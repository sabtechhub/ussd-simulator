<?php
/*
 * USSD Simulator (Hubtel + Nalo)
 * The browser cannot call your USSD endpoint directly (CORS), so this file
 * also acts as a small proxy: the page POSTs to ?proxy=1 and PHP forwards it.
 */
const SAMPLE_FILES = ['hubtel' => 'sample-hubtel.php', 'nalo' => 'sample-nalo.php'];

// ?source=hubtel|nalo returns the sample endpoint's PHP code for the viewer
if (isset($_GET['source'])) {
    header('Content-Type: text/plain; charset=utf-8');
    $f = SAMPLE_FILES[$_GET['source']] ?? null;
    echo $f ? file_get_contents(__DIR__ . '/' . $f) : '';
    exit;
}

if (isset($_GET['proxy'])) {
    header('Content-Type: application/json');
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $url = trim($in['url'] ?? '');
    if (!preg_match('#^https?://#i', $url)) {
        echo json_encode(['error' => 'Endpoint must start with http:// or https://']);
        exit;
    }
    $payload = json_encode($in['payload'] ?? new stdClass(), JSON_UNESCAPED_SLASHES);

    // Demo endpoint on this same server: answer in-process instead of over HTTP,
    // because `php -S` handles one request at a time and would wait on itself.
    $u = parse_url($url);
    $selfHost = strtolower($_SERVER['HTTP_HOST'] ?? '');
    $target = strtolower(($u['host'] ?? '') . (isset($u['port']) ? ':' . $u['port'] : ''));
    $selfDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
    $localFile = ($target === $selfHost && strpos($u['path'] ?? '', $selfDir . '/') === 0)
        ? substr($u['path'], strlen($selfDir) + 1) : null;
    if ($localFile === 'mock.php') {
        require_once __DIR__ . '/mock.php';
        $t = microtime(true);
        $body = json_encode(ussd_mock_handle(json_decode($payload, true) ?: []));
        echo json_encode(['status' => 200, 'time_ms' => round((microtime(true) - $t) * 1000), 'body' => $body, 'error' => null]);
        exit;
    }
    // PHP's built-in server (php -S) handles one request at a time, so it can never answer
    // a call to itself. Say so straight away instead of waiting for a timeout.
    if ($target === $selfHost && PHP_SAPI === 'cli-server') {
        echo json_encode(['error' => "This page is running on PHP's built-in server, which can't call itself. "
            . 'Run your USSD endpoint on another port (e.g. php -S localhost:8091) or use XAMPP/Apache.']);
        exit;
    }
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    foreach (preg_split('/\r?\n/', $in['headers'] ?? '') as $h) {
        if (strpos($h, ':') !== false) $headers[] = trim($h);
    }
    $t = microtime(true);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_FOLLOWLOCATION => true,
        ]);
        if (!empty($in['insecure'])) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        }
        $body = curl_exec($ch);
        $err = $body === false ? curl_error($ch) : null;
        $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    } else {
        $ctx = stream_context_create([
            'http' => ['method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => $payload, 'timeout' => 20, 'ignore_errors' => true],
            'ssl' => ['verify_peer' => empty($in['insecure']), 'verify_peer_name' => empty($in['insecure'])],
        ]);
        $body = @file_get_contents($url, false, $ctx);
        $err = $body === false ? (error_get_last()['message'] ?? 'Request failed') : null;
        $code = isset($http_response_header[0]) && preg_match('/\s(\d{3})\s?/', $http_response_header[0], $m) ? (int)$m[1] : 0;
    }
    echo json_encode([
        'status' => $code,
        'time_ms' => round((microtime(true) - $t) * 1000),
        'body' => $body === false ? null : $body,
        'error' => $err,
    ]);
    exit;
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAB-TECH HUB USSD Simulator</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script>
// Apply the saved (or system) theme before the page paints
(function(){ var t = null; try { t = localStorage.getItem('ussdsim_theme'); } catch(e) {}
  if (!t) t = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t); })();
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
/* dark theme (default) */
:root{--bg:#0f172a;--panel:#111c33;--line:#22304f;--text:#e2e8f0;--muted:#8a9bbb;--accent:#22c55e;--accent2:#3b82f6;--danger:#ef4444;
  --field:#0b1428;--btn:#16233f;--btn-h:#1d2d50;--req:#93c5fd;--res:#86efac;--err:#fca5a5;--code-bg:#0b1220;--code-text:#cbd5e1;--sub:#0d1830;color-scheme:dark}
/* light theme */
:root[data-theme="light"]{--bg:#f1f5f9;--panel:#ffffff;--line:#dbe3ee;--text:#0f172a;--muted:#5b6b82;--accent:#16a34a;--accent2:#2563eb;--danger:#dc2626;
  --field:#f8fafc;--btn:#eef2f7;--btn-h:#e2e8f0;--req:#1d4ed8;--res:#15803d;--err:#b91c1c;--code-bg:#0f172a;--code-text:#cbd5e1;--sub:#f8fafc;color-scheme:light}
.theme-btn{border:1px solid var(--line);background:var(--btn);color:var(--text);border-radius:999px;padding:4px 10px;cursor:pointer;font:inherit;font-size:12px}
.theme-btn:hover{background:var(--btn-h)}
*{box-sizing:border-box}
[hidden]{display:none !important}
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{padding:14px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}
header h1{font-size:17px;margin:0}
header span{color:var(--muted);font-size:13px}
header{flex-wrap:wrap}
header .brand{margin-left:auto;font-size:12px;padding:4px 10px;border:1px solid var(--line);border-radius:999px}
header .brand b{color:var(--accent)}
footer{text-align:center;color:var(--muted);font-size:12px;padding:6px 16px 22px}
footer b{color:var(--accent)}
/* Test page: phone on the left, setup + activity on the right */
.wrap{display:grid;grid-template-columns:360px minmax(0,1fr);gap:24px;padding:24px;align-items:start;max-width:1180px;margin:0 auto}
.side{display:flex;flex-direction:column;gap:16px;min-width:0}
.wrap-b{padding:24px;max-width:1480px;margin:0 auto}
@media(max-width:860px){.wrap{grid-template-columns:1fr;padding:12px;gap:16px}.wrap-b{padding:12px}}
/* page switch in the header */
header .nav{margin:0 auto;width:auto;padding:3px}
header .nav button{flex:none;padding:7px 18px;font-size:13px}
header .brand{margin-left:0}
@media(max-width:860px){header .nav{order:5;width:100%;margin:4px 0 0}header .nav button{flex:1}}
/* setup summary */
.setup-sum{display:flex;align-items:center;gap:12px}
.sum-text{flex:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:13px;font-weight:600;min-width:0}
.sum-text i{color:var(--muted);font-style:normal}
#setupBody{display:flex;flex-direction:column;gap:16px}
.setup-done{display:flex;justify-content:flex-end}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px}
.card h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 12px}
label{display:block;font-size:12px;color:var(--muted);margin:10px 0 4px}
input,select,textarea{width:100%;background:var(--field);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px 10px;font:inherit}
textarea{min-height:54px;font-family:ui-monospace,Consolas,monospace;font-size:12px}
input:focus,select:focus,textarea:focus{outline:2px solid var(--accent2);outline-offset:-1px}
.seg{display:flex;background:var(--field);border:1px solid var(--line);border-radius:8px;padding:3px;gap:3px}
.seg button{flex:1;border:0;background:none;color:var(--muted);padding:7px;border-radius:6px;cursor:pointer;font:inherit;font-weight:600}
.seg button.on{background:var(--accent2);color:#fff}
.row{display:flex;gap:8px}.row>*{flex:1}
.chk{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12px;color:var(--muted)}.chk input{width:auto}
.btn{border:1px solid var(--line);background:var(--btn);color:var(--text);padding:7px 10px;border-radius:8px;cursor:pointer;font:inherit;font-size:12px}
.btn:hover{background:var(--btn-h)}
.hint{font-size:12px;color:var(--muted);margin-top:10px}

/* phone */
.phone{width:330px;margin:0 auto;background:#05070d;border-radius:44px;padding:14px;box-shadow:0 0 0 2px #2a2f3a,0 20px 50px rgba(0,0,0,.5)}
.screen{position:relative;height:660px;background:linear-gradient(#f8fafc,#eef2f7);border-radius:32px;overflow:hidden;color:#0f172a;display:flex;flex-direction:column}
.status{display:flex;justify-content:space-between;padding:10px 22px 4px;font-size:11px;font-weight:600}
.status span{max-width:95px;white-space:nowrap;overflow:hidden}
.notch{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:13px;height:13px;background:#05070d;border-radius:50%}
.display{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:10px 18px}
.display .num{font-size:32px;font-weight:300;letter-spacing:1px;min-height:44px;word-break:break-all;text-align:center}
.display .sub{font-size:12px;color:#64748b;min-height:18px}
.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:8px 26px}
.key{height:58px;border-radius:50%;border:0;background:#e2e8f0;font-size:24px;cursor:pointer;color:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.key small{font-size:9px;letter-spacing:1px;color:#64748b;margin-top:2px}
.key:active{background:#cbd5e1}
.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:6px 26px 26px;align-items:center}
.call{height:58px;border-radius:50%;border:0;background:var(--accent);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
.call:active{filter:brightness(.9)}
.del{background:none;border:0;cursor:pointer;color:#475569;font-size:22px}
.overlay{position:absolute;inset:0;background:rgba(15,23,42,.45);display:none;align-items:center;justify-content:center;padding:22px}
.overlay.show{display:flex}
.dialog{background:#fff;border-radius:18px;width:100%;padding:20px 20px 8px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.dialog .msg{white-space:pre-wrap;font-size:15px;max-height:300px;overflow:auto;word-wrap:break-word}
.dialog input{margin-top:14px;background:#fff;color:#0f172a;border:0;border-bottom:2px solid var(--accent2);border-radius:0;padding:6px 2px;font-size:16px}
.dialog .btns{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}
.dialog .btns button{background:none;border:0;color:var(--accent2);font-weight:700;font-size:14px;padding:10px 12px;cursor:pointer;border-radius:8px}
.dialog .btns button:hover{background:#eff6ff}
.loading{display:flex;align-items:center;gap:14px;font-size:15px;padding-bottom:12px}
.spin{width:26px;height:26px;border:3px solid #cbd5e1;border-top-color:var(--accent2);border-radius:50%;animation:s 0.8s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}
.meta{text-align:center;color:var(--muted);font-size:12px;margin-top:12px;min-height:18px}

/* log */
.log .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.log .top h2{margin:0}
#logs{max-height:560px;overflow:auto;display:flex;flex-direction:column;gap:10px}
.entry{border:1px solid var(--line);border-radius:8px;overflow:hidden;flex-shrink:0}
.entry .h{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 10px;font-size:12px;font-weight:600;background:var(--field)}
.entry .h .r{display:flex;align-items:center;gap:8px}
.cp{border:1px solid var(--line);background:var(--btn);color:var(--text);padding:3px 8px;border-radius:6px;cursor:pointer;font:inherit;font-size:11px;font-weight:600}
.cp:hover{background:var(--btn-h)}
.entry pre{max-height:360px;overflow:auto}
.log .top{flex-wrap:wrap;gap:8px}
.modal{position:fixed;inset:0;background:rgba(2,6,23,.6);display:none;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal.show{display:flex}
.modal .box{background:var(--panel);border:1px solid var(--line);border-radius:12px;width:min(900px,100%);max-height:90vh;display:flex;flex-direction:column}
.modal .mh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--line)}
.modal .mh h3{margin:0;font-size:15px;flex:1}
.modal .seg{width:200px}
.modal pre{margin:0;padding:14px;overflow:auto;flex:1;font:12.5px/1.5 ui-monospace,Consolas,monospace;color:var(--code-text);white-space:pre;background:var(--code-bg);border-radius:0 0 12px 12px}
.log .top .btns{display:flex;gap:8px;flex-wrap:wrap}
.entry.req .h{color:var(--req)}.entry.res .h{color:var(--res)}.entry.err .h{color:var(--err)}
/* Activity as a conversation: phone on the right, menu on the left */
#logs .entry{border:0;border-radius:0;overflow:visible;display:flex;flex-direction:column;align-items:flex-start;max-width:100%}
#logs .entry.req{align-items:flex-end}
#logs .bubble{max-width:85%;white-space:pre-wrap;word-wrap:break-word;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.45;background:var(--sub);border:1px solid var(--line);color:var(--text)}
#logs .entry.req .bubble{background:var(--accent2);border-color:var(--accent2);color:#fff;border-bottom-right-radius:4px}
#logs .entry.res .bubble{border-bottom-left-radius:4px}
#logs .entry.err .bubble,#logs .entry.warn-reply .bubble{border-color:var(--danger);color:var(--err);background:transparent}
#logs .bubble .tag{display:block;margin-top:6px;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
#logs .entry .h{background:none;padding:3px 4px 0;font-weight:500;font-size:11px;gap:6px;justify-content:flex-start;color:var(--muted)}
#logs .entry.req .h,#logs .entry.res .h{color:var(--muted)}
#logs .entry .h .r::before{content:'·';margin-right:6px}
#logs .det{font-size:11px;max-width:85%;width:100%}
#logs .entry.req .det{text-align:right}
#logs .det summary{cursor:pointer;color:var(--muted);padding:2px 4px;display:inline-block}
#logs .det[open]{text-align:left}
#logs .det .cp{float:right;margin:4px 0}
#logs .det pre{clear:both;border-radius:8px;margin-top:4px;text-align:left}
.entry pre{margin:0;padding:10px;font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre-wrap;word-break:break-all;color:var(--code-text);background:var(--code-bg)}
/* header */
header{background:var(--panel);gap:12px;padding:12px 20px}
header .logo{width:40px;height:40px;border-radius:8px;background:var(--accent2);color:#fff;font-weight:800;font-size:13px;letter-spacing:.5px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
header .ttl{display:flex;flex-direction:column;line-height:1.25}
header .ttl h1{font-size:16px;font-weight:700}
header .ttl span{font-size:12.5px}

/* settings */
.settings{display:flex;flex-direction:column;gap:16px}
.grp-h{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;margin-bottom:6px}
.grp-h .n{width:22px;height:22px;border-radius:50%;background:var(--accent2);color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.help{font-size:12px;color:var(--muted);margin:-2px 0 8px 30px}
.seg.src button{font-size:12px;padding:8px 4px;white-space:nowrap}
.url-row{display:flex;gap:6px;margin-top:8px}
.url-row input{flex:1}
.src-note{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.45}
.good{color:var(--res);font-weight:700}.bad{color:var(--err);font-weight:700}
.adv{border-top:1px solid var(--line);padding-top:10px}
.adv summary{cursor:pointer;font-size:12.5px;font-weight:600;color:var(--muted)}
.adv summary small{font-weight:400}
.settings .hint{margin:0}
.link{background:none;border:0;padding:0;color:var(--accent2);font:inherit;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:2px}

/* which menu to test: option cards */
.choices{display:flex;flex-direction:column;gap:6px}
.choices button{display:grid;grid-template-columns:18px 1fr;column-gap:10px;align-items:center;text-align:left;background:var(--field);border:1px solid var(--line);border-radius:10px;padding:9px 12px;cursor:pointer;color:var(--text);font:inherit}
.choices button::before{content:'';grid-row:1/3;width:16px;height:16px;border-radius:50%;border:2px solid var(--line);box-sizing:border-box}
.choices button b{font-size:13px}
.choices button span{font-size:11.5px;color:var(--muted)}
.choices button:hover{border-color:var(--accent2)}
.choices button.on{border-color:var(--accent2);background:color-mix(in srgb,var(--accent2) 9%,var(--field))}
.choices button.on::before{border:5px solid var(--accent2)}
.src-note:empty{display:none}

/* phone extras */
.phone-col{display:flex;flex-direction:column;align-items:center}
.status{align-items:center;padding:12px 24px 4px}
.sb-right{display:flex;align-items:center;gap:5px;max-width:none !important}
.display .sub b{color:#0f172a}
.phone-bar{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:14px}
.pill{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:600;background:var(--panel);border:1px solid var(--line);color:var(--muted)}
.pill i{width:8px;height:8px;border-radius:50%;background:var(--muted)}
.pill.busy i{background:#f59e0b;animation:blink 1s infinite}.pill.busy{color:#d97706}
.pill.live i{background:var(--accent);animation:blink 1.4s infinite}.pill.live{color:var(--res)}
.pill.done i{background:var(--accent2)}.pill.done{color:var(--accent2)}
.pill.error i{background:var(--danger)}.pill.error{color:var(--err)}
@keyframes blink{50%{opacity:.35}}
.meta{margin-top:0}

/* activity guide */
.top-hint{font-size:12px;color:var(--muted)}
.guide{text-align:left;padding:18px 20px;border-style:solid;background:var(--sub);color:var(--text)}
.guide h3{margin:0 0 6px;font-size:15px}
.guide p{margin:0 0 10px;color:var(--muted)}
.guide ol{margin:0 0 12px;padding-left:20px;display:flex;flex-direction:column;gap:6px}
.guide .t-req{color:var(--req);font-weight:600}.guide .t-res{color:var(--res);font-weight:600}
.guide .guide-next{margin:0}

/* builder map view */
.view-seg{width:auto;padding:2px}
.view-seg button{flex:none;padding:5px 12px;font-size:12px}
#bTidy,#bFull{display:none}
#tab-builder:has(#bmap:not([hidden])) :is(#bTidy,#bFull){display:inline-block}
#tab-builder.full{position:fixed;inset:12px;z-index:40;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.35)}
#tab-builder.full .map-scroll{height:calc(100vh - 190px)}
body.map-full{overflow:hidden}
#bmap{position:relative}
.map-scroll{height:620px;overflow:auto;border:1px solid var(--line);border-radius:10px;background-color:var(--field);background-image:radial-gradient(circle,var(--line) 1px,transparent 1px);background-size:20px 20px}
.map-canvas{position:relative;min-width:100%;min-height:100%}
.map-lines{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;color:var(--muted)}
.map-lines .ln{fill:none;stroke:currentColor;stroke-width:2}
.map-lines .ln.rule{stroke-dasharray:5 4}
.map-lines .ln.temp{stroke:var(--accent2);color:var(--accent2)}
.node{position:absolute;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.12);cursor:grab;user-select:none;touch-action:none;font-size:12px}
.node.dragging{cursor:grabbing;box-shadow:0 10px 24px rgba(0,0,0,.25);z-index:3}
.node.start{border-color:var(--accent)}
.node.drop{outline:3px solid var(--accent2);outline-offset:2px}
.node-h{display:flex;align-items:center;gap:6px;padding:8px 10px 4px}
.node-h b{font-family:ui-monospace,Consolas,monospace;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.node-type{font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:700;color:var(--muted)}
.node.t-menu .node-type{color:var(--accent2)}.node.t-input .node-type{color:#d97706}.node.t-end .node-type{color:var(--danger)}
.node-msg{padding:0 10px 8px;color:var(--muted);white-space:pre-wrap;max-height:3.1em;overflow:hidden;line-height:1.5}
.node-msg.empty-msg{font-style:italic;opacity:.7}
.node-link{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid var(--line);padding:5px 18px 5px 10px;color:var(--text)}
.node-link span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.node-link.rule{color:#d97706}
.port{position:absolute;right:-7px;top:50%;transform:translateY(-50%);width:13px;height:13px;border-radius:50%;background:var(--panel);border:2px solid var(--accent2);cursor:crosshair}
.port.linked{background:var(--accent2)}
.port:hover{transform:translateY(-50%) scale(1.3)}
.node-end{border-top:1px solid var(--line);padding:5px 10px;font-size:11px;color:var(--danger);font-weight:600}
.map-help{font-size:12px;color:var(--muted);margin-top:8px}
.scr.flash{outline:3px solid var(--accent2);outline-offset:2px;transition:outline-color 1s}

/* tabs + builder */
.tabs{margin-bottom:12px}
.btn.primary{background:var(--accent2);border-color:var(--accent2);color:#fff;font-weight:600}
.btn.primary:hover{filter:brightness(1.08);background:var(--accent2)}
.btn.sm{padding:4px 8px;font-size:11px}
.btn.icon{padding:4px 8px;min-width:28px}
.btn.danger:hover{background:var(--danger);border-color:var(--danger);color:#fff}
.bbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.bbar .sp{flex:1}
code{background:var(--field);border:1px solid var(--line);border-radius:4px;padding:0 4px;font-size:12px}
#screens{display:flex;flex-direction:column;gap:12px;max-height:640px;overflow:auto;padding-right:2px}
.scr{border:1px solid var(--line);border-radius:10px;background:var(--sub);padding:12px;flex-shrink:0}
.scr.start{border-color:var(--accent)}
.scr .sh{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.scr .sh input{flex:1;min-width:120px;font-family:ui-monospace,Consolas,monospace;font-weight:600}
.scr .sh select{width:auto}
.badge{font-size:10px;font-weight:700;letter-spacing:.05em;padding:3px 7px;border-radius:999px;background:var(--btn);color:var(--muted);text-transform:uppercase;white-space:nowrap}
.badge.go{background:var(--accent);color:#fff}
.badge.t-menu{color:var(--accent2)}.badge.t-input{color:#d97706}.badge.t-end{color:var(--danger)}
.scr textarea{margin-top:8px;font-family:inherit;font-size:13px;min-height:46px}
.scr .sub-h{font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin:12px 0 6px}
.grid-row{display:grid;gap:6px;align-items:center;margin-bottom:6px}
.opt-row{grid-template-columns:52px 1fr 20px minmax(110px,.8fr) 30px}
.rule-row{grid-template-columns:minmax(70px,.8fr) 96px minmax(56px,.6fr) 16px minmax(96px,.8fr) 30px}
.col-h{margin:10px 0 2px}.col-h span{font-size:11px;color:var(--muted);font-weight:600}
.then-row{grid-template-columns:auto minmax(140px,380px);justify-content:start;margin-top:8px}
.more{margin-top:8px}
.more summary{cursor:pointer;font-size:12px;color:var(--muted);width:max-content;list-style:none;padding:2px 0}
.more summary::-webkit-details-marker{display:none}
.more summary::before{content:'▸ '}
.more[open] summary::before{content:'▾ '}
.more[open]{border-top:1px dashed var(--line);margin-top:10px;padding-top:4px}
.more-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.file-menu{position:relative}
.file-menu summary{list-style:none}
.file-menu summary::-webkit-details-marker{display:none}
.file-pop{position:absolute;right:0;top:calc(100% + 4px);z-index:5;display:flex;flex-direction:column;gap:4px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:6px;min-width:170px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.file-pop .btn{text-align:left}
.grid-row .arrow{color:var(--muted);text-align:center}
.grid-row .lbl{font-size:12px;color:var(--muted)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.two label{margin-top:8px}
.scr .note{font-size:12px;color:var(--muted);margin-top:8px}
.warn{color:var(--danger);font-size:12px;margin-top:6px}
.credit{text-align:center;font-size:12px;color:var(--muted);margin-top:12px}
.credit b{color:var(--accent)}
.modal .mh .btns{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:600px){.opt-row{grid-template-columns:44px 1fr 16px 1fr 30px}.rule-row{grid-template-columns:1fr 1fr}.rule-row .arrow{display:none}}
.empty{color:var(--muted);font-size:13px;padding:20px;text-align:center;border:1px dashed var(--line);border-radius:8px}
/* ===== polish: type, buttons, cards, spacing ===== */
body{font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.ic{flex-shrink:0;display:block}
[data-i]{display:inline-flex;align-items:center}
header{position:sticky;top:0;z-index:30;min-height:64px;padding:10px 24px;border-bottom:1px solid var(--line);background:var(--panel)}
header .nav button{display:inline-flex;align-items:center;gap:7px}
.theme-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px}
.card{border-radius:14px;padding:20px;box-shadow:0 1px 2px rgba(15,23,42,.05),0 6px 18px rgba(15,23,42,.05)}
.card-h{display:flex;flex-direction:column;gap:2px}
.card-h h2,.log .top h2{margin:0;font-size:15px;font-weight:700;color:var(--text);text-transform:none;letter-spacing:0;display:flex;align-items:center;gap:8px}
.log .top h2 [data-i]{color:var(--accent2)}
.card-sub{font-size:12.5px;color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 12px;font-size:12.5px;font-weight:500;border-radius:8px;transition:background .15s,border-color .15s;white-space:nowrap}
.btn.sm{height:28px;padding:0 10px;font-size:12px}
.btn.icon-only{width:34px;padding:0}
.btn.icon{width:30px;height:30px;padding:0;min-width:0}
.seg button{display:inline-flex;align-items:center;justify-content:center;gap:6px}
label{font-weight:500}
input,select,textarea{transition:border-color .15s,box-shadow .15s}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent2);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent2) 20%,transparent)}

/* setup */
#setupBody{gap:22px}
.grp{display:flex;flex-direction:column}
.grp-h{margin-bottom:10px;font-size:14px}
.grp-h .q{color:var(--muted);cursor:help;margin-left:2px}
.help{display:none}
.src-note{margin-top:10px}
.setup-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding-top:16px}
.setup-foot .hint{margin:0}
kbd{font:600 11px ui-monospace,Consolas,monospace;padding:1px 5px;border:1px solid var(--line);border-bottom-width:2px;border-radius:4px;background:var(--field);color:var(--text)}
.sum-ic{color:var(--accent2)}
.adv{padding-top:14px}
.adv summary{display:inline-flex;align-items:center;gap:6px}
.choices button{grid-template-columns:38px 1fr;padding:10px 12px;row-gap:1px}
.choices button::before{display:none}
.choices .c-ic{grid-row:1/3;width:32px;height:32px;border-radius:8px;background:var(--btn);color:var(--muted);display:flex;align-items:center;justify-content:center}
.choices button.on .c-ic{background:var(--accent2);color:#fff}

/* layout: setup + conversation on the left, phone on the right */
.wrap{grid-template-columns:minmax(300px,380px) 360px minmax(0,1fr);max-width:1560px}
@media(min-width:861px){.phone-col{position:sticky;top:88px}}
@media(max-width:1180px){.wrap{grid-template-columns:minmax(0,1fr) 360px}#tab-log{grid-column:1/-1}}
@media(max-width:860px){.wrap{grid-template-columns:1fr}}
#tab-log{align-self:stretch;display:flex;flex-direction:column;min-width:0}
#tab-log #logs{flex:1;max-height:calc(100vh - 200px);min-height:420px}
.log .top{margin-bottom:14px}
#logs{max-height:520px}

/* tooltips */
.tip{position:fixed;left:0;top:0;z-index:100;max-width:260px;padding:7px 10px;border-radius:8px;background:#0f172a;color:#f8fafc;font-size:12px;line-height:1.4;box-shadow:0 6px 20px rgba(0,0,0,.25);pointer-events:none;opacity:0;transform:translateY(3px);transition:opacity .12s,transform .12s}
:root[data-theme="dark"] .tip{background:#f1f5f9;color:#0f172a}
.tip.show{opacity:1;transform:none}

/* right-click menu */
.ctx{position:fixed;z-index:90;min-width:210px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:5px;box-shadow:0 12px 32px rgba(0,0,0,.22);display:flex;flex-direction:column}
.ctx button{background:none;border:0;text-align:left;padding:8px 10px;border-radius:6px;font:inherit;font-size:13px;color:var(--text);cursor:pointer}
.ctx button:hover{background:var(--btn-h)}
.ctx button.danger{color:var(--danger)}
.ctx button.danger:hover{background:var(--danger);color:#fff}
.ctx-sep{height:1px;background:var(--line);margin:4px 2px}

/* map and builder extras */
.node.sel{outline:2px solid var(--accent2);outline-offset:2px}
.map-lines .ln.hit{stroke:transparent;stroke-width:14;pointer-events:stroke;cursor:context-menu}
.map-lines .ln.hit:hover{stroke:color-mix(in srgb,var(--accent2) 25%,transparent)}
.b-hint{margin:0 0 14px}
.warn{display:flex;align-items:center;gap:6px}
.file-menu summary.btn{gap:5px}
.view-seg button{gap:5px}
/* editable map boxes */
.node{cursor:default}
.node-h{cursor:grab;padding:6px 8px 4px 6px;gap:4px;border-bottom:1px solid transparent}
.node.dragging .node-h{cursor:grabbing}
.node-h .grip{color:var(--muted);display:flex;opacity:.7}
.node input,.node textarea,.node select{background:transparent;border:1px solid transparent;border-radius:6px;color:var(--text);font:inherit;font-size:12px;padding:3px 5px;width:auto;min-width:0}
.node input:hover,.node textarea:hover,.node select:hover{border-color:var(--line);background:var(--field)}
.node input:focus,.node textarea:focus,.node select:focus{border-color:var(--accent2);background:var(--field);box-shadow:none}
.node-name{flex:1;font-family:ui-monospace,Consolas,monospace !important;font-weight:700;font-size:12.5px !important}
.node-typesel{font-size:10px !important;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:2px 2px !important;cursor:pointer;color:var(--muted) !important}
.node.t-menu .node-typesel{color:var(--accent2) !important}.node.t-input .node-typesel{color:#d97706 !important}.node.t-end .node-typesel{color:var(--danger) !important}
.node-msg-in{display:block;width:calc(100% - 12px) !important;margin:0 6px 6px;resize:none;overflow:hidden;line-height:1.45;min-height:26px;color:var(--muted) !important}
.node-link.opt{padding:3px 18px 3px 6px;gap:4px}
.node-link .nk{width:30px;text-align:center;font-weight:600;padding:3px 2px}
.node-link .nl{flex:1}
.nx-del{opacity:0;background:none;border:0;color:var(--muted);cursor:pointer;padding:2px;display:flex;border-radius:4px}
.node-link.opt:hover .nx-del{opacity:1}
.nx-del:hover{color:var(--danger);background:var(--btn-h)}
.node-add{display:flex;align-items:center;gap:4px;width:100%;background:none;border:0;border-top:1px solid var(--line);color:var(--accent2);font:inherit;font-size:11.5px;font-weight:600;padding:6px 10px;cursor:pointer;border-radius:0 0 10px 10px}
.node-add:hover{background:var(--btn-h)}
.set-help{font-size:11.5px;color:var(--muted);margin:-2px 0 8px}
.set-row{grid-template-columns:minmax(80px,.8fr) 14px minmax(100px,1.4fr) 30px}
.node-set{display:flex;align-items:center;gap:5px;padding:0 10px 6px;font:11.5px ui-monospace,Consolas,monospace;color:var(--accent2);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.var-pop{min-width:320px;max-height:360px;overflow:auto;right:auto;left:0}
.var-h{font-size:11.5px;color:var(--muted);padding:6px 8px}
.var-row{display:flex;flex-direction:column;align-items:flex-start;gap:1px;background:none;border:0;border-radius:6px;padding:7px 8px;text-align:left;cursor:pointer;color:var(--text);font:inherit}
.var-row:hover{background:var(--btn-h)}
.var-row code{font-size:12.5px;color:var(--accent2);background:none;border:0;padding:0}
.var-row span{font-size:11.5px;color:var(--muted)}
/* dialogs (dialog.js) */
.dlg-back{position:fixed;inset:0;z-index:120;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .15s}
.dlg-back.show{opacity:1}
.dlg{width:min(420px,100%);background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.3);padding:22px;display:grid;grid-template-columns:40px 1fr;gap:4px 14px;transform:translateY(8px) scale(.98);transition:transform .15s}
.dlg-back.show .dlg{transform:none}
.dlg-ic{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--accent2) 14%,transparent);color:var(--accent2)}
.dlg-ic.danger{background:color-mix(in srgb,var(--danger) 14%,transparent);color:var(--danger)}
.dlg-body h3{margin:2px 0 6px;font-size:16px}
.dlg-msg{margin:0;color:var(--muted);font-size:13.5px;line-height:1.5}
.dlg-list{margin:8px 0 4px;padding-left:18px;font-size:13px;display:flex;flex-direction:column;gap:3px}
.dlg-btns{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.btn.danger-btn{background:var(--danger);border-color:var(--danger);color:#fff}
</style>
</head>
<body>
<header>
  <div class="logo" aria-hidden="true">SAB</div>
  <div class="ttl">
    <h1>SAB-TECH HUB USSD Simulator</h1>
    <span>Test Hubtel &amp; Nalo USSD menus without a phone</span>
  </div>
  <nav class="seg nav" id="mainTabs" aria-label="Pages">
    <button data-v="log" type="button" data-tip="Dial a menu on the phone and see every message"><span data-i="phone"></span>Test</button>
    <button data-v="builder" type="button" data-tip="Make your own USSD menu, then test it or get its PHP code"><span data-i="workflow"></span>Menu builder</button>
  </nav>
  <span class="brand">Powered by <b>SAB-TECH HUB</b></span>
  <button class="theme-btn" id="themeBtn" type="button" data-tip="Switch between light and dark colours"></button>
</header>

<!-- Test page: setup (left) | phone (middle) | conversation (right) -->
<main class="wrap" id="page-test">
  <div class="side">
    <section class="card settings" id="setup">
      <div class="setup-sum" id="setupSum" hidden>
        <span class="sum-ic" data-i="settings"></span>
        <div class="sum-text" id="sumText"></div>
        <button class="btn" id="setupOpen" type="button" data-tip="Change the provider, menu, phone number or code"><span data-i="pencil"></span>Change</button>
      </div>

      <div id="setupBody">
        <div class="card-h">
          <h2>Set up your test</h2>
          <span class="card-sub">Three quick choices, then dial on the phone.</span>
        </div>

        <div class="grp">
          <div class="grp-h"><span class="n">1</span>Your USSD provider
            <span class="q" data-tip="The company that connects your USSD service to MTN, Telecel and AirtelTigo. Each one sends requests in its own format." data-i="help"></span></div>
          <div class="seg" id="provSeg">
            <button data-v="hubtel" type="button" data-tip="Requests use Hubtel's format (Type, Message, ClientState…)">Hubtel</button>
            <button data-v="nalo" type="button" data-tip="Requests use Nalo's format (USERID, MSISDN, USERDATA, MSGTYPE…)">Nalo</button>
          </div>
        </div>

        <div class="grp">
          <div class="grp-h"><span class="n">2</span>Which menu to test</div>
          <div class="choices" id="srcSeg">
            <button data-v="demo" type="button" data-tip="Try the simulator with a small built-in menu"><span class="c-ic" data-i="flask"></span><b>Demo</b><span>A ready-made test menu</span></button>
            <button data-v="builder" type="button" data-tip="Runs the menu you make on the Menu builder page"><span class="c-ic" data-i="workflow"></span><b>My builder menu</b><span>The menu you make in the Menu builder</span></button>
            <button data-v="url" type="button" data-tip="Sends real Hubtel or Nalo requests to your own server"><span class="c-ic" data-i="server"></span><b>My server</b><span>Your own USSD server address</span></button>
          </div>
          <div id="srcUrl">
            <div class="url-row">
              <input id="endpoint" placeholder="https://yourdomain.com/ussd" aria-label="Your USSD endpoint URL">
              <button class="btn" id="checkBtn" type="button" data-tip="Send one test dial to this address and check the reply"><span data-i="check"></span>Check</button>
            </div>
          </div>
          <div class="src-note" id="srcNote"></div>
        </div>

        <div class="grp">
          <div class="grp-h"><span class="n">3</span>Test phone
            <span class="q" data-tip="Pretend to be a customer: this number and network are sent to the menu, and the code is what they dial." data-i="help"></span></div>
          <div class="row">
            <div><label for="msisdn">Phone number</label><input id="msisdn" value="233241234567" data-tip="The caller's number, with country code (233…)"></div>
            <div><label for="operator">Network</label>
              <select id="operator" data-tip="The caller's mobile network">
                <option value="mtn">MTN</option>
                <option value="telecel">Telecel (Vodafone)</option>
                <option value="airteltigo">AirtelTigo</option>
              </select></div>
          </div>
          <label for="code">Code to dial</label>
          <input id="code" value="*713#" data-tip="Your short code, e.g. *713# or *713*1#">
        </div>

        <details class="adv" id="advBox">
          <summary><span data-i="settings"></span>Advanced settings <small>(optional)</small></summary>
          <div id="naloOnly">
            <label for="userid">Nalo USERID</label>
            <input id="userid" value="NALOTest" data-tip="The USERID Nalo sends with each request">
          </div>
          <label for="headers">Extra headers (one per line)</label>
          <textarea id="headers" placeholder="Authorization: Bearer xyz" data-tip="Added to every request, e.g. an API key your server checks"></textarea>
          <label class="chk" data-tip="Only for testing servers with a self-signed or expired certificate"><input type="checkbox" id="insecure"> Ignore SSL certificate errors</label>
        </details>

        <div class="setup-foot">
          <span class="hint">Keyboard: digits, <kbd>*</kbd> <kbd>#</kbd>, <kbd>Enter</kbd> to dial or send, <kbd>Esc</kbd> to cancel.</span>
          <button class="btn primary" id="setupDone" type="button" data-tip="Fold these settings into one line">Done</button>
        </div>
      </div>
    </section>

  </div>

  <section class="phone-col" aria-label="Test phone">
    <div class="phone">
      <div class="screen">
        <div class="notch"></div>
        <div class="status">
          <span id="clock">12:00</span>
          <span class="sb-right">
            <span id="netName">MTN GH</span>
            <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden="true"><rect x="0" y="8" width="3" height="3" rx=".6" fill="currentColor"/><rect x="4.3" y="5.5" width="3" height="5.5" rx=".6" fill="currentColor"/><rect x="8.6" y="3" width="3" height="8" rx=".6" fill="currentColor"/><rect x="12.9" y="0" width="3" height="11" rx=".6" fill="currentColor"/></svg>
            <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden="true"><rect x=".5" y=".5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor"/><rect x="2" y="2" width="13" height="7" rx="1.3" fill="currentColor"/><rect x="19.5" y="3.5" width="2" height="4" rx="1" fill="currentColor"/></svg>
          </span>
        </div>
        <div class="display">
          <div class="num" id="num"></div>
          <div class="sub" id="sub">Dial a USSD code</div>
        </div>
        <div class="pad" id="pad"></div>
        <div class="actions">
          <span></span>
          <button class="call" id="callBtn" type="button" data-tip="Dial the code">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>
          </button>
          <button class="del" id="delBtn" type="button" data-tip="Delete the last digit"><span data-i="backspace" data-size="22"></span></button>
        </div>

        <div class="overlay" id="overlay">
          <div class="dialog">
            <div id="loadBox" class="loading"><div class="spin"></div><span>USSD code running…</span></div>
            <div id="dlgBox">
              <div class="msg" id="msg"></div>
              <input id="reply" autocomplete="off" inputmode="numeric">
              <div class="btns">
                <button id="cancelBtn" type="button">CANCEL</button>
                <button id="sendBtn" type="button">SEND</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="phone-bar">
      <span class="pill" id="pill"><i></i><span id="pillText">Ready</span></span>
      <span class="meta" id="meta"></span>
    </div>
  </section>

  <section class="card log" id="tab-log">
    <div class="top">
      <h2><span data-i="chat"></span>Conversation</h2>
      <div class="btns">
        <button class="btn" id="viewSample" type="button" data-tip="Starter PHP code for a Hubtel or Nalo endpoint"><span data-i="code"></span>Sample code</button>
        <button class="btn" id="copyAll" type="button" data-tip="Copy the whole conversation with all request details"><span data-i="copy"></span>Copy all</button>
        <button class="btn" id="clearLog" type="button" data-tip="Clear the conversation"><span data-i="eraser"></span>Clear</button>
      </div>
    </div>
    <div id="logs">
      <div class="empty guide">
        <h3>New to USSD?</h3>
        <p>USSD is the menu that pops up when you dial a code like <b>*713#</b> on any phone. It works without internet or apps.</p>
        <ol>
          <li>Press the green <b>call</b> button on the phone.</li>
          <li>A menu pops up. Type a number and press <b>SEND</b>.</li>
          <li>Each step shows up here as a conversation: <span class="t-req">your replies on the right</span>, <span class="t-res">the menu on the left</span>.</li>
        </ol>
        <p class="guide-next">Ready to make your own menu? <button class="link" type="button" data-goto="builder">Open the Menu builder</button></p>
      </div>
    </div>
  </section>
</main>

<!-- Menu builder page -->
<main class="wrap-b" id="page-builder" hidden>
  <section class="card builder" id="tab-builder">
    <div class="bbar">
      <button class="btn primary" id="bRun" type="button" data-tip="Dial this menu on the test phone"><span data-i="play"></span>Test on phone</button>
      <button class="btn" id="bGen" type="button" data-tip="Turn this menu into a Hubtel or Nalo PHP endpoint"><span data-i="code"></span>Get PHP code</button>
      <button class="btn" id="bAdd" type="button" data-tip="Add a new screen"><span data-i="plus"></span>Add screen</button>
      <details class="file-menu var-menu" id="varMenu">
        <summary class="btn" data-tip="Every value you can show in a message with {{name}}"><span data-i="variable"></span>Variables<span data-i="chevron" data-size="14"></span></summary>
        <div class="file-pop var-pop" id="varPop"></div>
      </details>
      <span class="sp"></span>
      <div class="seg view-seg" id="bView">
        <button data-v="list" type="button" data-tip="Edit screens one by one"><span data-i="list"></span>List</button>
        <button data-v="map" type="button" data-tip="See screens as boxes with arrows; drag to arrange and link"><span data-i="workflow"></span>Map</button>
      </div>
      <button class="btn icon-only" id="bTidy" type="button" data-tip="Line the boxes up neatly" aria-label="Tidy up"><span data-i="grid"></span></button>
      <button class="btn icon-only" id="bFull" type="button" data-tip="Use the whole window for the map (Esc to close)" aria-label="Full screen"><span data-i="maximize"></span></button>
      <details class="file-menu">
        <summary class="btn" data-tip="Save, open or start a new menu"><span data-i="folder"></span>File<span data-i="chevron" data-size="14"></span></summary>
        <div class="file-pop">
          <button class="btn" id="bExport" type="button"><span data-i="download"></span>Save to file</button>
          <button class="btn" id="bImport" type="button"><span data-i="upload"></span>Open file</button>
          <button class="btn" id="bReset" type="button"><span data-i="reset"></span>Start over</button>
        </div>
      </details>
      <input type="file" id="bFile" accept=".json,application/json" hidden>
    </div>
    <p class="hint b-hint">Make your screens, then press <b>Test on phone</b>. When it works, press <b>Get PHP code</b>.</p>
    <div id="screens"></div>
    <div id="bmap" hidden></div>
    <div class="credit">Menu Builder · Powered by <b>SAB-TECH HUB</b></div>
  </section>
</main>

<footer>SAB-TECH HUB USSD Simulator · Powered by <b>SAB-TECH HUB</b> · © <span id="yr"></span></footer>

<div class="modal" id="sampleModal">
  <div class="box">
    <div class="mh">
      <h3 id="codeTitle">Sample PHP endpoint</h3>
      <div class="seg" id="sampleSeg"><button data-v="hubtel">Hubtel</button><button data-v="nalo">Nalo</button></div>
      <div class="btns">
        <button class="btn" id="copySample">Copy code</button>
        <button class="btn" id="downloadCode">Download .php</button>
        <button class="btn" id="closeSample">Close</button>
      </div>
    </div>
    <div class="warn" id="codeWarn" style="padding:0 14px" hidden></div>
    <pre id="sampleCode"></pre>
  </div>
</div>

<script src="icons.js"></script>
<script src="dialog.js"></script>
<script src="builder.js"></script>
<script>
const $ = s => document.querySelector(s);
$('#yr').textContent = new Date().getFullYear();
fillIcons();

/* ---------- tooltips: any element with data-tip ---------- */
const tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip'); document.body.append(tipEl);
let tipFor = null, tipTimer = null;
function showTip(t){
  const text = t.dataset.tip; if (!text) return;
  tipFor = t; tipEl.textContent = text; tipEl.classList.add('show');
  const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 8, below = false;
  if (y < 6) { y = r.bottom + 8; below = true; }
  x = Math.max(8, Math.min(x, innerWidth - w - 8));
  tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px'; tipEl.classList.toggle('below', below);
}
function hideTip(){ clearTimeout(tipTimer); tipFor = null; tipEl.classList.remove('show'); }
document.addEventListener('mouseover', e => {
  const t = e.target.closest('[data-tip]');
  if (t === tipFor) return;
  hideTip(); if (!t) return;
  tipTimer = setTimeout(() => showTip(t), 350);
});
document.addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); if (t && e.target.matches(':focus-visible')) showTip(t); });
document.addEventListener('focusout', hideTip);
document.addEventListener('pointerdown', hideTip);
window.addEventListener('scroll', hideTip, true);


/* ---------- theme ---------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  $('#themeBtn').innerHTML = t === 'dark' ? icon('sun') + '<span>Light</span>' : icon('moon') + '<span>Dark</span>';
}
applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
$('#themeBtn').onclick = () => {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(t); store('theme', t);
};
const FIELDS = ['endpoint','msisdn','operator','code','userid','headers'];
let provider = 'hubtel';
let dialStr = '';
let S = { active:false };

/* ---------- settings persistence ---------- */
function store(k,v){ try{ localStorage.setItem('ussdsim_'+k, v) }catch(e){} }
function read(k){ try{ return localStorage.getItem('ussdsim_'+k) }catch(e){ return null } }
FIELDS.forEach(f => { const v = read(f); if (v !== null) $('#'+f).value = v; $('#'+f).addEventListener('input', () => { store(f, $('#'+f).value); updateNet(); }); });
$('#insecure').checked = read('insecure') !== '0';
$('#insecure').addEventListener('change', () => store('insecure', $('#insecure').checked ? '1':'0'));
setProvider(read('provider') || 'hubtel');
$('#provSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setProvider(b.dataset.v); });
function setProvider(p){
  provider = p; store('provider', p);
  document.querySelectorAll('#provSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === p));
  $('#naloOnly').style.display = p === 'nalo' ? '' : 'none';
}
const BASE_URL = location.href.split('?')[0].split('#')[0].replace(/[^/]*$/, '');
/* ---------- which menu to test: demo / builder / own server ---------- */
const SRC_NOTES = {
  demo: '',
  builder: '<button class="link" type="button" data-goto="builder">Open the Menu builder</button>',
  url: 'Paste the callback URL you gave Hubtel or Nalo, then press Check.',
};
let src = read('src');
{ // older versions kept demo / builder in the URL box: move them to the new choice
  const ep = $('#endpoint').value.trim();
  if (ep === Flow.ENDPOINT || /\/mock\.php$/.test(ep)) { if (!src) src = ep === Flow.ENDPOINT ? 'builder' : 'demo'; $('#endpoint').value = ''; store('endpoint', ''); }
  if (!src) src = ep ? 'url' : 'demo';   // first visit: start with the demo
}
function setSrc(v){
  src = v; store('src', v);
  document.querySelectorAll('#srcSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('#srcUrl').hidden = v !== 'url';
  $('#srcNote').innerHTML = SRC_NOTES[v];
  $('#checkNote') && ($('#checkNote').textContent = '');
  if (v === 'url' && !$('#endpoint').value.trim()) setTimeout(() => $('#endpoint').focus(), 0);
}
$('#srcSeg').onclick = e => { const b = e.target.closest('button'); if (b) setSrc(b.dataset.v); };
/** The address requests go to for the current choice. */
function endpointUrl(){ return src === 'url' ? $('#endpoint').value.trim() : src === 'demo' ? BASE_URL + 'mock.php' : Flow.ENDPOINT; }
setSrc(src);

/* ---------- setup: full form, or a one-line summary once it is done ---------- */
function updateSummary(){
  const srcName = { demo: 'Demo menu', builder: 'My builder menu', url: 'My server' }[src];
  const net = $('#operator').selectedOptions[0]?.textContent.replace(/ \(.*\)/, '') || '';
  const parts = [provider === 'hubtel' ? 'Hubtel' : 'Nalo', srcName, $('#msisdn').value.trim() + ' (' + net + ')', $('#code').value.trim()];
  $('#sumText').innerHTML = parts.map(p => '<span>' + escapeHtml(p) + '</span>').join('<i>·</i>');
}
function setSetupOpen(open){
  $('#setupBody').hidden = !open;
  $('#setupSum').hidden = open;
  store('setup', open ? 'open' : 'closed');
  updateSummary();
}
$('#setupOpen').onclick = () => setSetupOpen(true);
$('#setupDone').onclick = () => {
  if (src === 'url' && !$('#endpoint').value.trim()) { $('#endpoint').focus(); setPill('error', 'Add your server address first'); return; }
  setSetupOpen(false);
};
['#provSeg', '#srcSeg'].forEach(s => $(s).addEventListener('click', () => setTimeout(updateSummary)));
['#msisdn', '#code', '#operator'].forEach(s => $(s).addEventListener('input', updateSummary));
$('#operator').addEventListener('change', updateSummary);
setSetupOpen(read('setup') === 'closed' ? false : true);   // first visit: show the full form

// "Check" sends one test dial to the user's own server and says whether it answered properly
$('#checkBtn').onclick = async () => {
  const url = $('#endpoint').value.trim(), note = $('#srcNote');
  if (!url) { $('#endpoint').focus(); return; }
  note.textContent = 'Checking…';
  const payload = provider === 'hubtel'
    ? { Type: 'Initiation', Mobile: $('#msisdn').value.trim(), SessionId: 'check' + Date.now(), ServiceCode: serviceCodeOf($('#code').value), Message: $('#code').value.trim(), Operator: OPS[$('#operator').value][0], Sequence: 1, ClientState: '', Platform: 'USSD' }
    : { USERID: $('#userid').value.trim(), MSISDN: $('#msisdn').value.trim(), USERDATA: $('#code').value.trim(), MSGTYPE: true, NETWORK: OPS[$('#operator').value][1], SESSIONID: 'check' + Date.now() };
  try {
    const r = await (await fetch('?proxy=1', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, payload, insecure: $('#insecure').checked, headers: $('#headers').value }) })).json();
    if (r.error) { note.innerHTML = '<span class="bad">✕ Could not reach it:</span> ' + escapeHtml(r.error); return; }
    if (r.status >= 400) { note.innerHTML = `<span class="bad">✕ Your server answered with an error (HTTP ${r.status}).</span>`; return; }
    let j = null; try { j = JSON.parse(r.body); } catch (e) {}
    const msg = j && (provider === 'hubtel' ? getKey(j, 'Message') : getKey(j, 'MSG'));
    if (msg === undefined || msg === null) { note.innerHTML = `<span class="bad">⚠ It answered (${r.time_ms} ms) but not in ${provider === 'hubtel' ? 'Hubtel' : 'Nalo'} format.</span> Look at "Sample PHP code" for the expected reply.`; return; }
    note.innerHTML = `<span class="good">✓ Works!</span> Answered in ${r.time_ms} ms. Press the green button to try it.`;
  } catch (e) { note.innerHTML = '<span class="bad">✕ ' + escapeHtml(String(e)) + '</span>'; }
};
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
// links that open a tab, e.g. "Open the Menu builder"
document.addEventListener('click', e => { const g = e.target.closest('[data-goto]'); if (g) setTab(g.dataset.goto); });

function updateNet(){
  const n = {mtn:'MTN GH', telecel:'Telecel GH', airteltigo:'AT GH'}[$('#operator').value];
  $('#netName').textContent = n;
}
updateNet();
$('#operator').addEventListener('change', () => { store('operator', $('#operator').value); updateNet(); });
setInterval(() => { const d = new Date(); $('#clock').textContent = d.toTimeString().slice(0,5); }, 1000);

/* ---------- keypad ---------- */
const KEYS = [['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']];
KEYS.forEach(([k,s]) => {
  const b = document.createElement('button'); b.className = 'key'; b.innerHTML = k + (s ? `<small>${s}</small>` : '');
  b.onclick = () => press(k); $('#pad').appendChild(b);
});
function press(k){
  if (dialogOpen()) { const r = $('#reply'); if (r.style.display !== 'none') { r.value += k; r.focus(); } return; }
  dialStr += k; renderDial();
}
function renderDial(){ $('#num').textContent = dialStr; $('#sub').innerHTML = dialStr ? '' : 'Press the green button to dial <b>' + escapeHtml($('#code').value || '*713#') + '</b>'; }
renderDial();
$('#delBtn').onclick = () => { dialStr = dialStr.slice(0,-1); renderDial(); };
$('#callBtn').onclick = () => dial();
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (dialogOpen()) {
    if (e.key === 'Enter') { e.preventDefault(); $('#sendBtn').click(); }
    if (e.key === 'Escape') { $('#cancelBtn').click(); }
    return;
  }
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (/^[0-9*#]$/.test(e.key)) press(e.key);
  else if (e.key === 'Backspace') $('#delBtn').click();
  else if (e.key === 'Enter') dial();
});

/* ---------- dialog ---------- */
function dialogOpen(){ return $('#overlay').classList.contains('show'); }
function showLoading(){ $('#overlay').classList.add('show'); $('#loadBox').style.display = 'flex'; $('#dlgBox').style.display = 'none'; }
function showDialog(text, ended){
  $('#overlay').classList.add('show'); $('#loadBox').style.display = 'none'; $('#dlgBox').style.display = '';
  $('#msg').textContent = text;
  $('#reply').value = '';
  $('#reply').style.display = ended ? 'none' : '';
  $('#sendBtn').style.display = ended ? 'none' : '';
  $('#cancelBtn').textContent = ended ? 'OK' : 'CANCEL';
  if (!ended) setTimeout(() => $('#reply').focus(), 30);
}
function closeDialog(){ $('#overlay').classList.remove('show'); }
$('#sendBtn').onclick = () => reply();
$('#cancelBtn').onclick = () => cancel();

/* ---------- protocol ---------- */
const OPS = { mtn:['mtn','MTN'], telecel:['vodafone','VODAFONE'], airteltigo:['airteltigo','AIRTELTIGO'] };
function newSessionId(){ return (crypto.randomUUID ? crypto.randomUUID().replace(/-/g,'') : Date.now().toString(16) + Math.random().toString(16).slice(2)); }
function serviceCodeOf(d){ const m = d.match(/^\*?(\d+)/); return m ? m[1] : d; }
function getKey(o, ...names){
  if (!o || typeof o !== 'object') return undefined;
  for (const n of names) { const k = Object.keys(o).find(k => k.toLowerCase() === n.toLowerCase()); if (k !== undefined) return o[k]; }
  return undefined;
}

function buildPayload(kind, text){
  const op = OPS[$('#operator').value];
  if (S.provider === 'hubtel') {
    return {
      Type: kind === 'start' ? 'Initiation' : kind === 'cancel' ? 'Release' : 'Response',
      Mobile: $('#msisdn').value.trim(),
      SessionId: S.sessionId,
      ServiceCode: serviceCodeOf(S.dialed),
      Message: text,
      Operator: op[0],
      Sequence: S.seq,
      ClientState: S.clientState || '',
      Platform: 'USSD'
    };
  }
  return {
    USERID: $('#userid').value.trim(),
    MSISDN: $('#msisdn').value.trim(),
    USERDATA: text,
    MSGTYPE: kind === 'start',
    NETWORK: op[1],
    SESSIONID: S.sessionId
  };
}

function parseResponse(raw){
  let j; try { j = JSON.parse(raw); } catch(e) { return { msg: (raw && raw.trim()) ? raw : '(empty response from endpoint)', end:true, bad:true }; }
  if (S.provider === 'hubtel') {
    const type = String(getKey(j,'Type') ?? '').toLowerCase();
    return { msg: String(getKey(j,'Message') ?? ''), end: type === 'release' || type === 'timeout', clientState: getKey(j,'ClientState') };
  }
  const t = getKey(j,'MSGTYPE');
  const cont = t === true || t === 1 || String(t).toLowerCase() === 'true' || t === '1';
  return { msg: String(getKey(j,'MSG','MESSAGE','USERDATA') ?? ''), end: !cont };
}

async function send(kind, text){
  const payload = buildPayload(kind, text);
  const gw = S.provider === 'hubtel' ? 'Hubtel' : 'Nalo';
  const said = kind === 'start' ? 'Dialed ' + text : kind === 'cancel' ? 'Cancelled the session' : text;
  addLog('req', `Phone · step ${S.seq}`, JSON.stringify(payload, null, 2), said);
  if (endpointUrl() === Flow.ENDPOINT) {
    // Answered by the menu builder flow in this page, same rules as the generated PHP
    const body = JSON.stringify(Flow.respond(payload, S.provider));
    if (kind !== 'cancel') addLog('res', 'Menu builder', JSON.stringify(JSON.parse(body), null, 2), replySummary(body));
    return { status: 200, time_ms: 0, body, error: null };
  }
  try {
    const r = await fetch('?proxy=1', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ url: endpointUrl(), payload, insecure: $('#insecure').checked, headers: $('#headers').value }) });
    const j = await r.json();
    if (j.error) addLog('err', 'Could not reach the menu', j.error, j.error);
    else {
      let pretty = j.body; try { pretty = JSON.stringify(JSON.parse(j.body), null, 2); } catch(e){}
      if (j.status >= 400) addLog('err', `${gw} reply · HTTP ${j.status} · ${j.time_ms} ms`, pretty || '(empty body)', `The server answered with an error (HTTP ${j.status}).`);
      else if (kind !== 'cancel') addLog('res', `Menu · ${j.time_ms} ms`, pretty || '(empty body)', replySummary(j.body));
    }
    return j;
  } catch (e) {
    const m = String(e) + '\n\nIs this page being served by PHP (XAMPP / php -S)? The simulator needs PHP.';
    addLog('err', 'Simulator error', m, m);
    return { error: String(e) };
  }
}
/** What the phone will show for a reply, in plain words. */
function replySummary(body){
  const p = parseResponse(body);
  if (p.bad) return { text: 'The reply is not in ' + (S.provider === 'hubtel' ? 'Hubtel' : 'Nalo') + ' format:\n' + p.msg, end: true, bad: true };
  return { text: p.msg || '(empty message)', end: p.end };
}

function handle(res){
  if (res.error) { S.active = false; showDialog('Connection problem or invalid MMI code.\n\n' + res.error, true); updateMeta('error'); return; }
  if (res.status >= 400) { S.active = false; showDialog(`Endpoint returned HTTP ${res.status}.\n\n` + String(res.body || '').slice(0, 300), true); updateMeta('error'); return; }
  const p = parseResponse(res.body);
  if (p.clientState !== undefined && p.clientState !== null) S.clientState = String(p.clientState);
  if (p.end) S.active = false;
  showDialog(p.msg, p.end);
  updateMeta(p.bad ? 'error' : p.end ? 'session ended' : 'waiting for input');
}

/* status pill under the phone */
const PILL = {
  'starting':          ['busy', 'Dialing…'],
  'waiting for input': ['live', 'Waiting for your reply'],
  'session ended':     ['done', 'Session finished'],
  'cancelled by user': ['idle', 'Cancelled'],
  'error':             ['error', 'Something went wrong — see Activity'],
};
function setPill(kind, text){ $('#pill').className = 'pill ' + kind; $('#pillText').textContent = text; }
function updateMeta(state){
  const p = PILL[state]; if (p) setPill(p[0], p[1]);
  $('#meta').textContent = S.sessionId ? `Step ${S.seq} · session ${S.sessionId.slice(0,6)}` : '';
}

async function dial(){
  if (!endpointUrl()) { setPill('error', 'Add your server address first'); $('#endpoint').focus(); return; }
  if (src === 'builder' && Flow.flow.screens.every(s => !s.text.trim() && !(s.options || []).some(o => o.label.trim()))) {
    setPill('error', 'Your builder menu is empty — write a message first');
    setTab('builder');
    const t = document.querySelector('#screens textarea'); if (t) t.focus();
    return;
  }
  let code = dialStr || $('#code').value.trim();
  if (!code) return;
  if (!code.endsWith('#')) code += '#';
  dialStr = code; renderDial();
  S = { active:true, provider, sessionId:newSessionId(), seq:1, clientState:'', dialed:code };
  updateMeta('starting');
  showLoading();
  handle(await send('start', code));
}

async function reply(){
  if (!S.active) return closeDialog();
  const text = $('#reply').value.trim();
  if (!text) { $('#reply').focus(); return; }
  S.seq++;
  showLoading();
  handle(await send('reply', text));
}

function cancel(){
  if (S.active && S.provider === 'hubtel') { S.seq++; send('cancel', ''); }
  if (S.active) updateMeta('cancelled by user');
  S.active = false;
  closeDialog();
  dialStr = ''; renderDial();
}

/* ---------- log ---------- */
/**
 * One line in Activity: a chat bubble with what was said, and the raw JSON
 * folded under "Details". cls: req (phone), res (menu) or err.
 */
function addLog(cls, title, body, said){
  const logs = $('#logs'); const empty = logs.querySelector('.empty'); if (empty) empty.remove();
  const s = typeof said === 'object' && said ? said : { text: String(said ?? '') };
  const d = document.createElement('div'); d.className = 'entry ' + cls + (s.bad ? ' warn-reply' : '');

  const bubble = document.createElement('div'); bubble.className = 'bubble';
  bubble.textContent = s.text;
  if (s.end) { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'Session ended'; bubble.append(tag); }

  const h = document.createElement('div'); h.className = 'h';
  const t1 = document.createElement('span'); t1.textContent = title;
  const r = document.createElement('span'); r.className = 'r';
  const t2 = document.createElement('span'); t2.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  r.append(t2); h.append(t1, r);

  const det = document.createElement('details'); det.className = 'det';
  const sum = document.createElement('summary'); sum.textContent = 'Details';
  const cp = document.createElement('button'); cp.className = 'cp'; cp.type = 'button'; cp.textContent = 'Copy';
  cp.onclick = e => { e.preventDefault(); copyText(body, cp); };
  const pre = document.createElement('pre');
  let isJson = false; try { JSON.parse(body); isJson = true; } catch (e) {}
  if (isJson && window.hljs) pre.innerHTML = hljs.highlight(body, { language: 'json' }).value;
  else pre.textContent = body;
  det.append(sum, cp, pre);

  d.append(bubble, h, det); logs.appendChild(d); logs.scrollTop = logs.scrollHeight;
}
const GUIDE_HTML = $('#logs').innerHTML;
$('#clearLog').onclick = () => { $('#logs').innerHTML = GUIDE_HTML; };
$('#copyAll').onclick = e => {
  const txt = [...document.querySelectorAll('#logs .entry')].map(en =>
    en.querySelector('.h span').textContent + '  [' + en.querySelector('.r span').textContent + ']\n' + en.querySelector('pre').textContent).join('\n\n');
  copyText(txt || '(log is empty)', e.currentTarget);
};
/* ---------- code window (samples + generated code) ---------- */
let sampleProv = 'hubtel';
let codeSrc = { get: p => loadSample(p), file: p => 'sample-' + p + '.php' };
window.openCodeModal = function(title, get, file, warning){
  codeSrc = { get, file };
  $('#codeTitle').textContent = title;
  $('#codeWarn').hidden = !warning; $('#codeWarn').textContent = warning || '';
  showSample(provider);
  $('#sampleModal').classList.add('show');
};
function showSample(p){
  sampleProv = p;
  document.querySelectorAll('#sampleSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === p));
  $('#sampleCode').textContent = 'Loading…';
  Promise.resolve(codeSrc.get(p)).then(code => {
    if (sampleProv !== p) return;
    if (window.hljs) $('#sampleCode').innerHTML = hljs.highlight(code, { language: 'php' }).value;
    else $('#sampleCode').textContent = code;
    $('#sampleCode').scrollTop = 0;
  });
}
$('#downloadCode').onclick = async () => {
  const code = await codeSrc.get(sampleProv);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([code], { type: 'application/x-php' }));
  a.download = codeSrc.file(sampleProv); document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};
const sampleCache = {};
async function loadSample(p){
  if (!sampleCache[p]) {
    try { sampleCache[p] = await (await fetch('?source=' + p)).text(); }
    catch (e) { return '// Could not load sample-' + p + '.php: ' + e; }
  }
  return sampleCache[p];
}
$('#viewSample').onclick = () => openCodeModal('Sample PHP endpoint', p => loadSample(p), p => 'sample-' + p + '.php');
$('#sampleSeg').onclick = e => { const b = e.target.closest('button'); if (b) showSample(b.dataset.v); };
$('#copySample').onclick = async e => { const btn = e.currentTarget; copyText(await codeSrc.get(sampleProv), btn); };$('#closeSample').onclick = () => $('#sampleModal').classList.remove('show');
$('#sampleModal').onclick = e => { if (e.target.id === 'sampleModal') $('#sampleModal').classList.remove('show'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#sampleModal').classList.remove('show'); });

/* ---------- tabs + menu builder ---------- */
function setTab(t){
  document.querySelectorAll('#mainTabs button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  $('#page-test').hidden = t !== 'log';
  $('#page-builder').hidden = t !== 'builder';
  if (t !== 'builder') setFull(false);
  if (t === 'builder') Flow.render();   // the map needs to be visible to measure its boxes
  store('tab', t);
}
/* map full screen */
function setFull(on){
  $('#tab-builder').classList.toggle('full', on);
  document.body.classList.toggle('map-full', on);
  $('#bFull').innerHTML = icon(on ? 'minimize' : 'maximize');
  $('#bFull').dataset.tip = on ? 'Back to normal size (Esc)' : 'Use the whole window for the map (Esc to close)';
  if ($('#mainTabs .on')?.dataset.v === 'builder') Flow.render();
}
$('#bFull').onclick = () => setFull(!$('#tab-builder').classList.contains('full'));
$('#bView').addEventListener('click', e => { if (e.target.closest('button[data-v=list]')) setFull(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#tab-builder').classList.contains('full')) setFull(false); });
$('#mainTabs').onclick = e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.v); };
Flow.init();
$("#code").addEventListener("input", () => { if (!S.active) renderDial(); });
document.querySelectorAll(".file-pop .btn").forEach(b => b.addEventListener("click", () => b.closest("details").open = false));
/* Variables list: every {{name}} a message can use; click one to copy it */
$('#varMenu').addEventListener('toggle', () => {
  if (!$('#varMenu').open) return;
  const pop = $('#varPop');
  pop.innerHTML = '<div class="var-h">Click a name to copy it, then paste it into a message.</div>';
  Flow.variables().forEach(v => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'var-row';
    b.innerHTML = '<code></code><span></span>';
    b.querySelector('code').textContent = '{{' + v.name + '}}';
    b.querySelector('span').textContent = v.from;
    b.onclick = () => copyText('{{' + v.name + '}}', b.querySelector('code'), 'Copied!');
    pop.append(b);
  });
  const tip = document.createElement('div'); tip.className = 'var-h';
  const link = document.createElement('button'); link.type = 'button'; link.className = 'link';
  link.textContent = 'Add your own value';
  link.dataset.tip = 'Opens More → Set value on the selected screen (or the start screen)';
  link.onclick = () => { $('#varMenu').open = false; Flow.addSetValue(); };
  tip.append(link, document.createTextNode(' (More → Set value on any screen)'));
  pop.append(tip);
});
document.addEventListener('pointerdown', e => { const m = $('#varMenu'); if (m.open && !e.target.closest('#varMenu')) m.open = false; });
setTab(read('tab') === 'builder' ? 'builder' : 'log');
$('#bRun').onclick = async () => {
  const p = Flow.problems();
  if (p.length && !await ask({ title: 'Some screens are not finished', list: p.map(x => `${x[0]}: ${x[1]}`), message: 'You can still test the parts that are ready.', ok: 'Test anyway', cancel: 'Keep editing', icon: 'alert' })) return;
  setSrc('builder');
  setTab('log');              // go to the Test page, where the phone is
  if (S.active) cancel();
  dialStr = ''; renderDial();
  dial();
};

async function copyText(text, btn, okLabel){
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (e2) {}
  }
  if (!btn) return;
  const old = btn.dataset.label || btn.textContent; btn.dataset.label = old;
  btn.textContent = ok ? (okLabel || 'Copied!') : 'Copy failed';
  clearTimeout(btn._t); btn._t = setTimeout(() => btn.textContent = old, 1500);
}

</script>
</body>
</html>
