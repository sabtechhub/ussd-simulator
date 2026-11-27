<#
  Turns narration lines into WAV files with a built-in Windows voice.
  Input: a JSON file with an array of lines. Output: <Out>\<md5>.wav and durations.json ({ line: ms }).
  Usage: powershell -File narrate.ps1 -Lines lines.json -Out narration -Voice "Microsoft Mark"
#>
param(
  [Parameter(Mandatory)] [string]$Lines,
  [Parameter(Mandatory)] [string]$Out,
  [string]$Voice = 'Microsoft Mark',
  [double]$Rate = 0.95
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $Out | Out-Null
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Await($op, [Type]$type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(); $t.Result }

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$v = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -eq $Voice } | Select-Object -First 1
if (-not $v) { throw "Voice '$Voice' not found" }
$synth.Voice = $v
try { $synth.Options.SpeakingRate = $Rate } catch {}

$md5 = [Security.Cryptography.MD5]::Create()
$durations = @{}
$all = Get-Content $Lines -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($line in $all) {
  $hash = -join ($md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($line)) | ForEach-Object { $_.ToString('x2') })
  $file = Join-Path $Out "$hash.wav"
  if (-not (Test-Path $file)) {
    $stream = Await ($synth.SynthesizeTextToStreamAsync($line)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
    $reader = [Windows.Storage.Streams.DataReader]::new($stream.GetInputStreamAt(0))
    $null = Await ($reader.LoadAsync([uint32]$stream.Size)) ([uint32])
    $bytes = New-Object byte[] ([int]$stream.Size)
    $reader.ReadBytes($bytes)
    [IO.File]::WriteAllBytes($file, $bytes)
    $reader.Dispose(); $stream.Dispose()
  }
  # duration from the WAV header: data bytes / byte rate
  $b = [IO.File]::ReadAllBytes($file)
  $byteRate = [BitConverter]::ToInt32($b, 28)
  $pos = 12; $dataLen = 0
  while ($pos -lt $b.Length - 8) {
    $id = [Text.Encoding]::ASCII.GetString($b, $pos, 4); $len = [BitConverter]::ToInt32($b, $pos + 4)
    if ($id -eq 'data') { $dataLen = $len; break }
    $pos += 8 + $len
  }
  $durations[$line] = [int](1000 * $dataLen / $byteRate)
}
[IO.File]::WriteAllText((Join-Path $Out 'durations.json'), ($durations | ConvertTo-Json -Depth 3), (New-Object Text.UTF8Encoding($false)))
Write-Host "narration: $($all.Count) lines, voice $Voice"
