<?php
/*
 * Composes the tutorial soundtrack: an original, calm background track plus a
 * mouse-click sound at every click time. No samples or downloaded music.
 * Usage: php soundtrack.php meta.json out.wav [narration folder]
 * With a narration folder, the voice lines are mixed in and the music is lowered while the narrator speaks.
 */
[$_, $metaFile, $outFile, $narrDir] = $argv + [null, null, null, null];
$meta = json_decode(file_get_contents($metaFile), true);
$sr = 32000;
$dur = $meta['videoMs'] / 1000 + 0.5;
$N = (int)ceil($dur * $sr);
$mix = array_fill(0, $N, 0.0);

/* ---------- music ---------- */
$bpm = 84; $beat = 60 / $bpm; $bar = 4 * $beat;
$noteHz = fn($m) => 440 * 2 ** (($m - 69) / 12);
// warm progression: Cmaj9 – Am9 – Fmaj7#11 – G6/9 (MIDI notes)
$chords = [
  ['root' => 36, 'pad' => [52, 55, 59, 62], 'arp' => [64, 67, 71, 74, 72, 71, 67, 64]],
  ['root' => 33, 'pad' => [52, 55, 60, 59], 'arp' => [64, 67, 72, 71, 69, 67, 64, 60]],
  ['root' => 29, 'pad' => [53, 57, 60, 64], 'arp' => [65, 69, 72, 76, 74, 72, 69, 65]],
  ['root' => 31, 'pad' => [50, 55, 59, 64], 'arp' => [62, 67, 71, 74, 76, 74, 71, 67]],
];
// wavetables (sine; soft "electric piano" with a few harmonics)
$T = 4096;
$sine = []; $keys = [];
for ($i = 0; $i < $T; $i++) {
  $p = 2 * M_PI * $i / $T;
  $sine[] = sin($p);
  $keys[] = sin($p) * 0.75 + sin(2 * $p) * 0.18 + sin(3 * $p) * 0.05 + sin(4 * $p) * 0.02;
}
$osc = function (array &$tbl, float $phase) use ($T) { return $tbl[((int)($phase * $T)) & ($T - 1)]; };

$bars = (int)ceil($dur / $bar);
for ($b = 0; $b < $bars; $b++) {
  $c = $chords[$b % 4];
  $t0 = $b * $bar;
  // pad: slow swell over the bar, slightly detuned pairs
  foreach ($c['pad'] as $k => $m) {
    foreach ([0.997, 1.003] as $det) {
      $f = $noteHz($m) * $det; $ph = 0.13 * $k;
      $s0 = (int)($t0 * $sr); $len = (int)(($bar + 0.6) * $sr);
      for ($n = 0; $n < $len && $s0 + $n < $N; $n++) {
        $t = $n / $sr;
        $env = min(1, $t / 0.9) * ($t > $bar ? max(0, 1 - ($t - $bar) / 0.6) : 1) * (0.85 + 0.15 * sin(2 * M_PI * 0.25 * $t));
        $ph += $f / $sr; $ph -= floor($ph);
        $mix[$s0 + $n] += $osc($sine, $ph) * 0.022 * $env;
      }
    }
  }
  // bass on beats 1 and 3
  foreach ([0, 2] as $bt) {
    $f = $noteHz($c['root'] + 12); $ph = 0;
    $s0 = (int)(($t0 + $bt * $beat) * $sr); $len = (int)(1.4 * $sr);
    for ($n = 0; $n < $len && $s0 + $n < $N; $n++) {
      $t = $n / $sr;
      $env = min(1, $t / 0.01) * exp(-2.2 * $t);
      $ph += $f / $sr; $ph -= floor($ph);
      $mix[$s0 + $n] += $osc($sine, $ph) * 0.11 * $env;
    }
  }
  // plucked arpeggio, eighth notes, every other bar a little sparser
  foreach ($c['arp'] as $k => $m) {
    if ($b % 2 === 1 && $k % 2 === 1) continue;
    $f = $noteHz($m); $ph = 0;
    $s0 = (int)(($t0 + $k * $beat / 2) * $sr); $len = (int)(1.2 * $sr);
    $vel = 0.045 + 0.012 * (($k % 4) === 0);
    for ($n = 0; $n < $len && $s0 + $n < $N; $n++) {
      $t = $n / $sr;
      $env = min(1, $t / 0.004) * exp(-4.5 * $t);
      $ph += $f / $sr; $ph -= floor($ph);
      $mix[$s0 + $n] += $osc($keys, $ph) * $vel * $env;
    }
  }
  // very soft shaker on the off-beats
  mt_srand(1000 + $b);
  for ($k = 1; $k < 8; $k += 2) {
    $s0 = (int)(($t0 + $k * $beat / 2) * $sr); $len = (int)(0.06 * $sr); $lp = 0;
    for ($n = 0; $n < $len && $s0 + $n < $N; $n++) {
      $noise = mt_rand() / mt_getrandmax() * 2 - 1;
      $hp = $noise - $lp; $lp += 0.35 * ($noise - $lp);
      $mix[$s0 + $n] += $hp * 0.012 * exp(-70 * $n / $sr);
    }
  }
}
// gentle low-pass for warmth, plus a short echo for space
$lp = 0;
for ($n = 0; $n < $N; $n++) { $lp += 0.45 * ($mix[$n] - $lp); $mix[$n] = $lp; }
$d1 = (int)(0.27 * $sr); $d2 = (int)(0.41 * $sr);
for ($n = $N - 1; $n >= $d2; $n--) { $mix[$n] += $mix[$n - $d1] * 0.18 + $mix[$n - $d2] * 0.10; }
// fade in / out
for ($n = 0; $n < $N; $n++) {
  $t = $n / $sr;
  $g = min(1, $t / 2.5) * min(1, max(0, ($dur - $t) / 4));
  $mix[$n] *= $g;
}

/* ---------- mouse clicks ---------- */
$click = [];
mt_srand(7);
$cl = (int)(0.07 * $sr); $lp = 0;
for ($n = 0; $n < $cl; $n++) {
  $t = $n / $sr;
  $noise = mt_rand() / mt_getrandmax() * 2 - 1;
  $hp = $noise - $lp; $lp += 0.2 * ($noise - $lp);
  $press = exp(-900 * $t) * (0.7 * $hp + 0.5 * sin(2 * M_PI * 3200 * $t));
  $tr = $t - 0.045;   // the release "tick", quieter
  $release = $tr > 0 ? exp(-1100 * $tr) * (0.35 * $hp + 0.25 * sin(2 * M_PI * 4100 * $tr)) : 0;
  $click[] = ($press + $release) * 0.55;
}
/* ---------- narration ---------- */
// music on its own, normalised, then turned down (more while the narrator speaks)
$mpeak = 0.0001; foreach ($mix as $v) { $a = abs($v); if ($a > $mpeak) $mpeak = $a; }
$music = $mix; $mix = array_fill(0, $N, 0.0);
$voiceOn = array_fill(0, $N, 0);
$voiced = 0;
if ($narrDir && !empty($meta['cues'])) {
  foreach ($meta['cues'] as $cue) {
    $wav = @file_get_contents($narrDir . '/' . md5($cue['key']) . '.wav');
    if (!$wav) { fwrite(STDERR, "missing narration: {$cue['key']}\n"); continue; }
    // find fmt and data chunks
    $pos = 12; $vsr = 16000; $data = '';
    while ($pos < strlen($wav) - 8) {
      $id = substr($wav, $pos, 4); $len = unpack('V', substr($wav, $pos + 4, 4))[1];
      if ($id === 'fmt ') $vsr = unpack('V', substr($wav, $pos + 12, 4))[1];
      if ($id === 'data') { $data = substr($wav, $pos + 8, $len); break; }
      $pos += 8 + $len + ($len & 1);
    }
    $smp = array_values(unpack('v*', $data));
    $cnt = count($smp);
    $s0 = (int)($cue['t'] / 1000 * $sr);
    $outLen = (int)($cnt * $sr / $vsr);
    for ($n = 0; $n < $outLen && $s0 + $n < $N; $n++) {
      $x = $n * $vsr / $sr; $i = (int)$x; $fr = $x - $i;
      $a = $smp[$i] ?? 0; $b = $smp[$i + 1] ?? $a;
      if ($a >= 32768) $a -= 65536; if ($b >= 32768) $b -= 65536;
      $mix[$s0 + $n] += (($a + ($b - $a) * $fr) / 32768) * 0.95;
      $voiceOn[$s0 + $n] = 1;
    }
    $voiced++;
  }
}
// smooth ducking: music level 0.22 normally, 0.07 under speech, with ~0.25 s glides
$level = 0.22; $target = 0.22; $step = 1 / (0.25 * $sr);
$hold = 0;
for ($n = 0; $n < $N; $n++) {
  if ($voiceOn[$n]) $hold = (int)(0.35 * $sr); elseif ($hold > 0) $hold--;
  $target = ($voiceOn[$n] || $hold > 0) ? 0.07 : ($narrDir ? 0.22 : 0.6);
  $level += max(-$step * 0.15, min($step * 0.15, $target - $level));
  $mix[$n] += $music[$n] / $mpeak * $level;
}
unset($music, $voiceOn);

foreach ($meta['clicks'] as $ms) {
  $s0 = (int)($ms / 1000 * $sr);
  foreach ($click as $k => $v) { if ($s0 + $k < $N) $mix[$s0 + $k] += $v * 0.6; }
}

/* ---------- normalise and write 16-bit WAV ---------- */
$peak = 0.0001;
foreach ($mix as $v) { $a = abs($v); if ($a > $peak) $peak = $a; }
$gain = 0.89 / $peak;
$pcm = '';
foreach ($mix as $v) { $pcm .= pack('v', (int)round(max(-1, min(1, $v * $gain)) * 32767) & 0xFFFF); }
$hdr = 'RIFF' . pack('V', 36 + strlen($pcm)) . 'WAVEfmt ' . pack('VvvVVvv', 16, 1, 1, $sr, $sr * 2, 2, 16) . 'data' . pack('V', strlen($pcm));
file_put_contents($outFile, $hdr . $pcm);
printf("soundtrack: %.1fs, %d clicks, %d voice lines, peak gain %.2f\n", $dur, count($meta['clicks']), $voiced, $gain);
