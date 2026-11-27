<#
  Makes the narrated tutorial videos: voice -> record -> soundtrack -> MP4, for each script in videos\.
  Usage: powershell -ExecutionPolicy Bypass -File make-videos.ps1 [-Only 03] [-Voice "Microsoft Mark"]
  Needs: Edge, PHP (C:\xampp\php\php.exe or on PATH), ffmpeg, and the simulator on http://localhost:8090/
#>
param(
  [string]$Only = '',
  [string]$Voice = 'en-US-AndrewNeural',   # natural voice; or a built-in one like 'Microsoft Mark'
  [string]$Url = 'http://localhost:8090/',
  [string]$Build = (Join-Path $PSScriptRoot 'build'),
  [string]$OutDir = (Join-Path $PSScriptRoot 'videos-out'),
  [switch]$Force   # remake videos that already exist
)
$ErrorActionPreference = 'Stop'
$php = if (Test-Path 'C:\xampp\php\php.exe') { 'C:\xampp\php\php.exe' } else { 'php' }
$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg) { $ffmpeg = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
if (-not $ffmpeg) { throw 'ffmpeg not found' }
New-Item -ItemType Directory -Force $Build, $OutDir | Out-Null

$scripts = Get-ChildItem (Join-Path $PSScriptRoot 'videos') -Filter '*.js' | Where-Object { $_.Name -notlike '_*' } | Sort-Object Name
if ($Only) { $scripts = $scripts | Where-Object { $_.Name -like "$Only*" } }

# 1. narration for every line (cached by text)
$lib = Join-Path $PSScriptRoot 'videos\_lib.js'
$linesFile = Join-Path $Build 'lines.json'
$linesJson = (& $php (Join-Path $PSScriptRoot 'lines.php') @($scripts.FullName)) -join "`n"
[IO.File]::WriteAllText($linesFile, $linesJson, (New-Object Text.UTF8Encoding($false)))
if ($Voice -match 'Neural$') {
  # Microsoft natural voice (e.g. en-US-AndrewNeural) via edge-tts: needs Python + "pip install edge-tts" and internet
  $narr = Join-Path $Build "narration-$Voice"
  $env:FFMPEG = $ffmpeg
  & python (Join-Path $PSScriptRoot 'narrate_edge.py') $linesFile $narr $Voice '-10%'
} else {
  # built-in Windows voice (e.g. "Microsoft Mark"), works offline
  $narr = Join-Path $Build 'narration'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'narrate.ps1') -Lines $linesFile -Out $narr -Voice $Voice
}
if ($LASTEXITCODE) { throw 'narration failed' }

foreach ($s in $scripts) {
  $name = [IO.Path]::GetFileNameWithoutExtension($s.Name)
  $work = Join-Path $Build $name
  if (-not $Force -and (Test-Path (Join-Path $OutDir "$name.mp4"))) { Write-Host "=== ${name}: already made, skipping (use -Force to remake) ==="; continue }
  Write-Host "=== $name ==="
  Start-Sleep -Seconds 3   # let the previous Edge close fully
  # library + this video's script in one file
  $combined = Join-Path $Build "$name.tour.js"
  # the video script runs in its own block, so its names cannot clash with the page's own
  [IO.File]::WriteAllText($combined, [IO.File]::ReadAllText($lib) + "`n{`n" + [IO.File]::ReadAllText($s.FullName) + "`n}`n")
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'record.ps1') -Url $Url -Out $work -Script $combined -Narration (Join-Path $narr 'durations.json')
  if ($LASTEXITCODE) { throw "recording $name failed" }
  & $php -d memory_limit=3G (Join-Path $PSScriptRoot 'soundtrack.php') (Join-Path $work 'meta.json') (Join-Path $work 'soundtrack.wav') $narr
  & $php (Join-Path $PSScriptRoot 'assemble.php') $work $ffmpeg (Join-Path $OutDir "$name.mp4")
  if ($LASTEXITCODE) { throw "building $name.mp4 failed" }
  # frames and the Edge profile are large; keep only meta.json and the soundtrack
  Remove-Item -Recurse -Force (Join-Path $work 'frames') -ErrorAction SilentlyContinue
}
Write-Host "ALL DONE: $OutDir"
