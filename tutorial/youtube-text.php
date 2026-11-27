<?php
/**
 * Writes YouTube upload text (title, description with chapters, tags) for every finished video.
 * Usage: php youtube-text.php <videos folder> <ffprobe.exe> <output folder>
 */
[$self, $dir, $ffprobe, $out] = $argv + [null, null, null, null];
if (!$dir || !$ffprobe || !$out) exit("usage: php youtube-text.php <videos dir> <ffprobe> <out dir>\n");
@mkdir($out, 0777, true);

$series = 'How to Build a USSD Menu';
$site = 'https://sabtechhub.com/ussd-simulator/';
$github = 'https://github.com/sabtechhub/ussd-simulator';
$tags = 'USSD, short code, how to build USSD, USSD menu, USSD code, USSD Ghana, Hubtel USSD, Nalo USSD, Arkesel, Orchard, USSD simulator, USSD tutorial, no code, PHP, SAB-TECH HUB';

function ts(float $s): string { $s = (int)floor($s); return sprintf('%d:%02d', intdiv($s, 60), $s % 60) . ''; }

$all = [];
foreach (glob("$dir/*.mp4") as $mp4) {
    $name = basename($mp4, '.mp4');
    $script = __DIR__ . "/videos/$name.js";
    if (!is_file($script)) continue;
    $js = file_get_contents($script);
    if (!preg_match("/L\\.intro\\(\\s*(\\d+)\\s*,\\s*'((?:[^'\\\\]|\\\\.)*)'\\s*,\\s*'((?:[^'\\\\]|\\\\.)*)'/", $js, $m)) {
        // the bonus video opens with its own card: T.titleOn('Bonus video', 'Title', 'About', ...)
        if (!preg_match("/T\\.titleOn\\('Bonus video',\\s*'((?:[^'\\\\]|\\\\.)*)'\\s*,\\s*'((?:[^'\\\\]|\\\\.)*)'/", $js, $b)) continue;
        $m = [0, 'bonus', $b[1], $b[2]];
    }
    [$_, $n, $title, $about] = $m;
    $title = stripslashes($title); $about = stripslashes($about);
    $small = ['a', 'an', 'and', 'the', 'or', 'of', 'to', 'in', 'on', 'with', 'for'];
    $title = implode(' ', array_map(fn($w, $i) => ($i > 0 && in_array(strtolower($w), $small)) ? strtolower($w) : ucfirst($w), explode(' ', $title), array_keys(explode(' ', $title))));

    $info = json_decode(shell_exec(escapeshellarg($ffprobe) . ' -v quiet -print_format json -show_chapters -show_format ' . escapeshellarg($mp4)), true);
    $chap = [];
    foreach ($info['chapters'] ?? [] as $i => $c) {
        $t = $i === 0 ? 0 : (float)$c['start_time'];
        $h = $c['tags']['title'] ?? '';
        if ($i > 0 && $t - end($chap)[0] < 10) continue;          // YouTube needs 10 s or more per chapter
        $chap[] = [$t, $i === 0 ? 'Introduction' : (stripos($h, 'end of this video') !== false ? "What's next" : $h)];
    }
    $mins = round(((float)($info['format']['duration'] ?? 0)) / 60, 1);

    $bonus = $n === 'bonus';
    $ytTitle = $bonus ? "$series (Bonus): $title | SAB-TECH HUB" : "$series (Part $n of 12): $title | SAB-TECH HUB";
    if (mb_strlen($ytTitle) > 100) $ytTitle = "$series #$n: $title";
    $desc = "$about\n\n"
        . ($bonus ? 'Bonus video in' : "Part $n of 12 in") . " our free beginner course: $series (also called a short code), with the free SAB-TECH HUB USSD Simulator. "
        . "Build your menu on the Map with no code, test it on a pretend phone, then copy the code onto your server and connect Hubtel, Nalo, Orchard, Arkesel or any USSD provider.\n\n"
        . "Try the simulator free: $site\nDownload it (free, open source): $github\n\n"
        . "Chapters:\n" . implode("\n", array_map(fn($c) => ts($c[0]) . ' ' . $c[1], $chap)) . "\n\n"
        . "#USSD #ShortCode #SABTECHHUB";
    $txt = "FILE: $name.mp4  ($mins min)\n\nTITLE:\n$ytTitle\n\nDESCRIPTION:\n$desc\n\nTAGS:\n$tags\n\nPLAYLIST: $series - Free Course (SAB-TECH HUB)\n";
    file_put_contents("$out/$name.txt", $txt);
    $all[] = $txt;
}
$head = "PLAYLIST TITLE:\n$series - Free Course (SAB-TECH HUB)\n\nPLAYLIST DESCRIPTION:\n"
    . "Learn how to build a USSD menu (short code) from scratch, with no code. 12 simple videos for complete beginners: "
    . "dial your first code, build menus on the Map, ask questions, use conditions and prices, and put your menu live with Hubtel, Nalo, Orchard or Arkesel. "
    . "Free simulator: $site\n\n" . str_repeat('=', 60) . "\n\n";
file_put_contents("$out/ALL-VIDEOS.txt", $head . implode("\n" . str_repeat('=', 60) . "\n\n", $all));
echo count($all) . " videos written to $out\n";
