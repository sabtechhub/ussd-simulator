<#
  Records the tutorial: runs Edge headless, steps the tour frame by frame,
  saves JPEG frames + a ffmpeg concat list + click times.
  Usage: powershell -ExecutionPolicy Bypass -File record.ps1 -Url http://localhost:8090/ -Out <folder>
#>
param(
  [string]$Url = 'http://localhost:8090/',
  [string]$Out = (Join-Path $PSScriptRoot 'build'),
  [int]$Fps = 20,
  [int]$Port = 9339,
  [string]$Script = (Join-Path $PSScriptRoot 'tour-script.js'),
  [string]$Narration = ''
)
$ErrorActionPreference = 'Stop'
$frames = Join-Path $Out 'frames'
if (Test-Path $frames) { Remove-Item -Recurse -Force $frames }
New-Item -ItemType Directory -Force $frames | Out-Null
# Edge's profile goes in a short temp path: deep folders hit Windows' 260-character limit and Edge quits silently
$profileDir = Join-Path $env:TEMP ('ussd-rec-' + [Math]::Abs((Split-Path $Out -Leaf).GetHashCode()))
if (Test-Path $profileDir) { Remove-Item -Recurse -Force $profileDir }

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
function Stop-RecorderEdge { Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profileDir*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } }

try {
  # ---- start Edge and connect over the DevTools protocol (retry on a fresh port if it is slow to start) ----
  $page = $null; $proc = $null
  for ($attempt = 1; $attempt -le 3 -and -not $page; $attempt++) {
    if ($attempt -gt 1) { Write-Host "Edge did not answer, retrying ($attempt)"; Stop-RecorderEdge; Start-Sleep -Seconds 3; $Port++ }
    $proc = Start-Process $edge -PassThru -ArgumentList @('--headless=new', "--remote-debugging-port=$Port", "--user-data-dir=`"$profileDir`"",
      '--window-size=1600,900', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--disable-extensions', 'about:blank')
    for ($i = 0; $i -lt 120 -and -not $page; $i++) {
      Start-Sleep -Milliseconds 250
      try { $page = (Invoke-RestMethod "http://127.0.0.1:$Port/json" -TimeoutSec 2) | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {}
    }
  }
  if (-not $page) { throw 'Edge did not start' }
  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(30)
  $ws.ConnectAsync([Uri]$page.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  $script:id = 0
  $buf = New-Object byte[] 1048576

  function Cdp([string]$method, $params = @{}) {
    $script:id++
    $msg = @{ id = $script:id; method = $method; params = $params } | ConvertTo-Json -Depth 20 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($msg)
    $ws.SendAsync([ArraySegment[byte]]::new($bytes), 'Text', $true, [Threading.CancellationToken]::None).Wait()
    while ($true) {
      $ms = New-Object IO.MemoryStream
      do {
        $r = $ws.ReceiveAsync([ArraySegment[byte]]::new($buf), [Threading.CancellationToken]::None).Result
        $ms.Write($buf, 0, $r.Count)
      } while (-not $r.EndOfMessage)
      $text = [Text.Encoding]::UTF8.GetString($ms.ToArray())
      if ($text -match ('^\{"id":' + $script:id + ',')) {
        $resp = $text | ConvertFrom-Json
        if ($resp.error) { throw "$method failed: $($resp.error.message)" }
        return $resp.result
      }
    }
  }
  function Js([string]$expr) {
    $r = Cdp 'Runtime.evaluate' @{ expression = $expr; returnByValue = $true; awaitPromise = $true }
    if ($r.exceptionDetails) { throw "JS error: $($r.exceptionDetails.exception.description)" }
    return $r.result.value
  }

  Cdp 'Page.enable' | Out-Null
  Cdp 'Emulation.setDeviceMetricsOverride' @{ width = 1600; height = 900; deviceScaleFactor = 1.2; mobile = $false } | Out-Null
  Cdp 'Page.navigate' @{ url = $Url } | Out-Null
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 250
    try { if (Js "document.readyState === 'complete' && !!window.Flow && !!window.hljs && document.fonts.status === 'loaded'") { break } } catch {}
  }
  Start-Sleep -Milliseconds 800

  # ---- load the tour ----
  if ($Narration) { Js ('window.NARR = ' + [IO.File]::ReadAllText($Narration) + ';') | Out-Null }
  Js ([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tour-engine.js'))) | Out-Null
  Js ([IO.File]::ReadAllText($Script)) | Out-Null

  # ---- step and capture ----
  $dt = [math]::Round(1000 / $Fps, 3)
  $list = New-Object Text.StringBuilder
  $n = 0; $last = $null; $started = Get-Date
  while ($true) {
    $r = Js "JSON.stringify(window.tour.tick($dt))" | ConvertFrom-Json
    if ($r.kind -eq 'done') { break }
    if ($r.kind -eq 'pending') { Start-Sleep -Milliseconds 40; continue }
    $shot = Cdp 'Page.captureScreenshot' @{ format = 'jpeg'; quality = 90 }
    $n++
    $name = 'f{0:D5}.jpg' -f $n
    [IO.File]::WriteAllBytes((Join-Path $frames $name), [Convert]::FromBase64String($shot.data))
    $dur = if ($r.kind -eq 'hold') { $r.ms / 1000 } else { $dt / 1000 }
    [void]$list.AppendLine("file 'frames/$name'")
    [void]$list.AppendLine(('duration {0}' -f $dur.ToString([Globalization.CultureInfo]::InvariantCulture)))
    $last = $name
    if ($n % 200 -eq 0) { Write-Host ("{0} frames, {1:N0}s of video, {2:N0}s elapsed" -f $n, ((Js 'window.tour.videoMs') / 1000), ((Get-Date) - $started).TotalSeconds) }
  }
  [void]$list.AppendLine("file 'frames/$last'")   # concat needs the last file repeated
  [IO.File]::WriteAllText((Join-Path $Out 'frames.txt'), $list.ToString())
  $end = Js 'JSON.stringify(window.tour.tick(0))' | ConvertFrom-Json
  $meta = Js 'JSON.stringify((() => { const r = window.tour.tick(0); return { clicks: r.clicks, videoMs: r.videoMs, chapters: r.chapters, cues: r.cues }; })())'
  [IO.File]::WriteAllText((Join-Path $Out 'meta.json'), $meta)
  $errs = Js "JSON.stringify(window.__tourErrors || [])"
  Write-Host "TOUR ERRORS: $errs"
  Write-Host "DONE: $n frames"
  Write-Host "META: $meta"
}
finally {
  try { $ws.Dispose() } catch {}
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like "*$profileDir*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
  Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue   # the temporary Edge profile
}
