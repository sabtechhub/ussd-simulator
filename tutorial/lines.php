<?php
/*
 * Collects every narrated line from the video scripts.
 * Narration is written in "double quotes"; headings and labels use 'single quotes'.
 * In T.say(), L.intro(), L.section() and L.outro() the LAST double-quoted string is what is spoken
 * (say("subtitle", "spoken words") speaks the second one).
 * Usage: php lines.php videos/*.js > lines.json
 */
$lines = [];
$call = '/\b(?:say|intro|section|outro)\(((?:[^"\'()]|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|\((?:[^()"\']|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')*\))*)\)/s';
foreach (array_slice($argv, 1) as $file) {
    preg_match_all($call, file_get_contents($file), $calls);
    foreach ($calls[1] as $args) {
        preg_match_all('/"((?:[^"\\\\]|\\\\.)*)"/', $args, $s);
        if (!$s[1]) continue;
        $text = json_decode('"' . end($s[1]) . '"');
        if ($text !== null && $text !== '') $lines[$text] = true;
    }
}
echo json_encode(array_keys($lines), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
