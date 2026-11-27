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
body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{padding:14px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}
header h1{font-size:17px;margin:0}
header span{color:var(--muted);font-size:13px}
header{flex-wrap:wrap}
header .brand{margin-left:auto;font-size:12px;padding:4px 10px;border:1px solid var(--line);border-radius:999px}
header .brand b{color:var(--accent)}
footer{text-align:center;color:var(--muted);font-size:12px;padding:6px 16px 22px}
footer b{color:var(--accent)}
.wrap{display:grid;grid-template-columns:320px 360px 1fr;gap:18px;padding:18px;align-items:start}
@media(max-width:1100px){.wrap{grid-template-columns:1fr 360px}.log{grid-column:1/-1}}
@media(max-width:760px){.wrap{grid-template-columns:1fr;padding:12px}}
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
#logs{max-height:690px;overflow:auto;display:flex;flex-direction:column;gap:10px}
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
</style>
</head>
<body>
<header>
  <div class="logo" aria-hidden="true">SAB</div>
  <div class="ttl">
    <h1>SAB-TECH HUB USSD Simulator</h1>
    <span>Test Hubtel &amp; Nalo USSD menus without a phone</span>
  </div>
  <span class="brand">Powered by <b>SAB-TECH HUB</b></span>
  <button class="theme-btn" id="themeBtn" type="button" title="Switch light / dark theme">Light mode</button>
</header>

<div class="wrap">
  <!-- settings -->
  <section class="card settings">
    <div class="grp">
      <div class="grp-h"><span class="n">1</span>Your USSD provider</div>
      <p class="help">The company that connects your service to the phone networks. Not sure? Keep Hubtel.</p>
      <div class="seg" id="provSeg">
        <button data-v="hubtel">Hubtel</button>
        <button data-v="nalo">Nalo</button>
      </div>
    </div>

    <div class="grp">
      <div class="grp-h"><span class="n">2</span>Which menu to test</div>
      <div class="seg src" id="srcSeg">
        <button data-v="demo" title="A ready-made test menu">Demo</button>
        <button data-v="builder" title="The menu you make in the Menu builder tab">My builder menu</button>
        <button data-v="url" title="Your own USSD server">My server</button>
      </div>
      <div id="srcUrl">
        <div class="url-row">
          <input id="endpoint" placeholder="https://yourdomain.com/ussd" aria-label="Your USSD endpoint URL">
          <button class="btn" id="checkBtn" type="button" title="Send one test dial to this URL">Check</button>
        </div>
      </div>
      <div class="src-note" id="srcNote"></div>
    </div>

    <div class="grp">
      <div class="grp-h"><span class="n">3</span>Test phone</div>
      <p class="help">Pretend you are a customer with this phone.</p>
      <div class="row">
        <div><label for="msisdn">Phone number</label><input id="msisdn" value="233241234567"></div>
        <div><label for="operator">Network</label>
          <select id="operator">
            <option value="mtn">MTN</option>
            <option value="telecel">Telecel (Vodafone)</option>
            <option value="airteltigo">AirtelTigo</option>
          </select></div>
      </div>
      <label for="code">Code to dial (your short code)</label>
      <input id="code" value="*713#">
    </div>

    <details class="adv" id="advBox">
      <summary>Advanced settings <small>(you can skip this)</small></summary>
      <div id="naloOnly">
        <label for="userid">Nalo USERID</label>
        <input id="userid" value="NALOTest">
      </div>
      <label for="headers">Extra headers (one per line)</label>
      <textarea id="headers" placeholder="Authorization: Bearer xyz"></textarea>
      <label class="chk"><input type="checkbox" id="insecure"> Ignore SSL certificate errors</label>
    </details>

    <p class="hint">Your keyboard works too: digits, <b>*</b>, <b>#</b>, <b>Enter</b> to dial or send, <b>Esc</b> to cancel.</p>
  </section>

  <!-- phone -->
  <section class="phone-col">
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
          <button class="call" id="callBtn" title="Dial">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>
          </button>
          <button class="del" id="delBtn" title="Delete">⌫</button>
        </div>

        <div class="overlay" id="overlay">
          <div class="dialog">
            <div id="loadBox" class="loading"><div class="spin"></div><span>USSD code running…</span></div>
            <div id="dlgBox">
              <div class="msg" id="msg"></div>
              <input id="reply" autocomplete="off" inputmode="numeric">
              <div class="btns">
                <button id="cancelBtn">CANCEL</button>
                <button id="sendBtn">SEND</button>
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

  <!-- log -->
  <section class="card log">
    <div class="seg tabs" id="mainTabs">
      <button data-v="log">Activity</button>
      <button data-v="builder">Menu builder</button>
    </div>

    <div id="tab-log">
      <div class="top">
        <span class="top-hint">Every message between the phone and the menu</span>
        <div class="btns">
          <button class="btn" id="viewSample" title="View and copy a starter PHP endpoint">Sample PHP code</button>
          <button class="btn" id="copyAll">Copy all</button>
          <button class="btn" id="clearLog">Clear</button>
        </div></div>
      <div id="logs">
        <div class="empty guide">
          <h3>New to USSD?</h3>
          <p>USSD is the menu that pops up when you dial a code like <b>*713#</b> on any phone. It works without internet or apps.</p>
          <ol>
            <li>Press the green <b>call</b> button on the phone.</li>
            <li>A menu pops up. Type a number and press <b>SEND</b>.</li>
            <li>Each step shows up here: <span class="t-req">→ what the phone sent</span> and <span class="t-res">← what came back</span>.</li>
          </ol>
          <p class="guide-next">Ready to make your own menu? <button class="link" type="button" data-goto="builder">Open the Menu builder →</button></p>
        </div>
      </div>
    </div>

    <div id="tab-builder" hidden>
      <div class="bbar">
        <button class="btn primary" id="bRun" title="Dial this menu on the phone">▶ Test on phone</button>
        <button class="btn" id="bGen" title="Get the PHP code for this menu">Get PHP code</button>
        <button class="btn" id="bAdd">+ Add screen</button>
        <span class="sp"></span>
        <details class="file-menu">
          <summary class="btn">File ▾</summary>
          <div class="file-pop">
            <button class="btn" id="bExport" title="Save this menu as a .json file">Save to file</button>
            <button class="btn" id="bImport" title="Open a menu saved earlier">Open file</button>
            <button class="btn" id="bReset" title="Clear everything and start a new menu">Start over</button>
          </div>
        </details>
        <input type="file" id="bFile" accept=".json,application/json" hidden>
      </div>
      <p class="hint" style="margin-top:0">Make your screens, then press <b>Test on phone</b>. When it works, press <b>Get PHP code</b>.</p>
      <div id="screens"></div>
      <div class="credit">Menu Builder · Powered by <b>SAB-TECH HUB</b></div>
    </div>
  </section>
</div>

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

<script src="builder.js"></script>
<script>
const $ = s => document.querySelector(s);
$('#yr').textContent = new Date().getFullYear();

/* ---------- theme ---------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  $('#themeBtn').textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
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
  demo: 'A ready-made test menu. Press the green button on the phone to try it.',
  builder: 'Runs the menu you make in the <button class="link" type="button" data-goto="builder">Menu builder</button> tab.',
  url: 'The address of your own USSD server (the callback URL you gave Hubtel or Nalo).',
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
  addLog('req', `→ ${S.provider.toUpperCase()} ${kind === 'start' ? 'initiation' : kind}  · step ${S.seq}`, JSON.stringify(payload, null, 2));
  if (endpointUrl() === Flow.ENDPOINT) {
    // Answered by the menu builder flow in this page, same rules as the generated PHP
    const body = JSON.stringify(Flow.respond(payload, S.provider));
    addLog('res', '← Menu builder flow', JSON.stringify(JSON.parse(body), null, 2));
    return { status: 200, time_ms: 0, body, error: null };
  }
  try {
    const r = await fetch('?proxy=1', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ url: endpointUrl(), payload, insecure: $('#insecure').checked, headers: $('#headers').value }) });
    const j = await r.json();
    if (j.error) addLog('err', `✕ Error${j.time_ms !== undefined ? ' · ' + j.time_ms + ' ms' : ''}`, j.error);
    else {
      let pretty = j.body; try { pretty = JSON.stringify(JSON.parse(j.body), null, 2); } catch(e){}
      addLog(j.status >= 400 ? 'err' : 'res', `← HTTP ${j.status} · ${j.time_ms} ms`, pretty || '(empty body)');
    }
    return j;
  } catch (e) {
    addLog('err', '✕ Simulator error', String(e) + '\n\nIs this page being served by PHP (XAMPP / php -S)? The proxy needs PHP.');
    return { error: String(e) };
  }
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
function addLog(cls, title, body){
  const logs = $('#logs'); const empty = logs.querySelector('.empty'); if (empty) empty.remove();
  const d = document.createElement('div'); d.className = 'entry ' + cls;
  const h = document.createElement('div'); h.className = 'h';
  const t1 = document.createElement('span'); t1.textContent = title;
  const r = document.createElement('span'); r.className = 'r';
  const t2 = document.createElement('span'); t2.textContent = new Date().toLocaleTimeString();
  const cp = document.createElement('button'); cp.className = 'cp'; cp.textContent = 'Copy';
  cp.onclick = () => copyText(body, cp);
  r.append(t2, cp);
  h.append(t1, r);
  const pre = document.createElement('pre');
  let isJson = false; try { JSON.parse(body); isJson = true; } catch (e) {}
  if (isJson && window.hljs) pre.innerHTML = hljs.highlight(body, { language: 'json' }).value;
  else pre.textContent = body;
  d.append(h, pre); logs.appendChild(d); logs.scrollTop = logs.scrollHeight;
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
  $('#tab-log').hidden = t !== 'log';
  $('#tab-builder').hidden = t !== 'builder';
  store('tab', t);
}
$('#mainTabs').onclick = e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.v); };
Flow.init();
$("#code").addEventListener("input", () => { if (!S.active) renderDial(); });
document.querySelectorAll(".file-pop .btn").forEach(b => b.addEventListener("click", () => b.closest("details").open = false));
setTab(read('tab') === 'builder' ? 'builder' : 'log');
$('#bRun').onclick = () => {
  const p = Flow.problems();
  if (p.length && !confirm('Some screens are not finished:\n\n' + p.map(x => `• ${x[0]}: ${x[1]}`).join('\n') + '\n\nRun anyway?')) return;
  setSrc('builder');
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
