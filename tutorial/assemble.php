<?php
/*
 * Builds the final MP4 from the recorded frames, the soundtrack and chapter markers.
 * Usage: php assemble.php <build folder> <ffmpeg.exe> <output.mp4>
 */
[$_, $build, $ffmpeg, $out] = $argv;
$meta = json_decode(file_get_contents("$build/meta.json"), true);

// chapter markers (shown as chapters in VLC, YouTube uploads, etc.)
$chapters = $meta['chapters'] ?? [];
$total = (int)$meta['videoMs'];
$txt = ";FFMETADATA1\ntitle=SAB-TECH HUB USSD Simulator - Complete guide\nartist=SAB-TECH HUB\n";
foreach ($chapters as $k => $c) {
    $start = (int)$c['t'];
    $end = isset($chapters[$k + 1]) ? (int)$chapters[$k + 1]['t'] : $total;
    $title = str_replace(["=", ";", "#", "\\", "\n"], ["\\=", "\\;", "\\#", "\\\\", " "], $c['heading']);
    $txt .= "\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=$start\nEND=$end\ntitle=$title\n";
}
file_put_contents("$build/chapters.txt", $txt);

$cmd = sprintf(
    '%s -y -hide_banner -loglevel error -f concat -safe 0 -i %s -i %s -i %s -map 0:v -map 1:a -map_metadata 2 -map_chapters 2 ' .
    '-vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 160k -shortest -movflags +faststart %s',
    escapeshellarg($ffmpeg), escapeshellarg("$build/frames.txt"), escapeshellarg("$build/soundtrack.wav"),
    escapeshellarg("$build/chapters.txt"), escapeshellarg($out));
chdir($build);   // frames.txt uses paths relative to the build folder
passthru($cmd, $rc);
if ($rc !== 0) { fwrite(STDERR, "ffmpeg failed\n"); exit(1); }
printf("video: %s (%.1f MB, %d:%02d, %d chapters)\n", $out, filesize($out) / 1048576, intdiv((int)($total / 1000), 60), (int)($total / 1000) % 60, count($chapters));
