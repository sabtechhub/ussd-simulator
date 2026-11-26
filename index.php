<?php
/*
 * USSD Simulator (Hubtel + Nalo)
 * The browser cannot call your USSD endpoint directly (CORS), so this file
 * also acts as a small proxy: the page POSTs to ?proxy=1 and PHP forwards it.
 */
if (isset($_GET['proxy'])) {
    header('Content-Type: application/json');
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $url = trim($in['url'] ?? '');
    if (!preg_match('#^https?://#i', $url)) {
        echo json_encode(['error' => 'Endpoint must start with http:// or https://']);
        exit;
    }
    $payload = json_encode($in['payload'] ?? new stdClass(), JSON_UNESCAPED_SLASHES);
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
            CURLOPT_TIMEOUT => 30,
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
            'http' => ['method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => $payload, 'timeout' => 30, 'ignore_errors' => true],
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
<title>USSD Simulator</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<style>
:root{--bg:#0f172a;--panel:#111c33;--line:#22304f;--text:#e2e8f0;--muted:#8a9bbb;--accent:#22c55e;--accent2:#3b82f6;--danger:#ef4444}
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
input,select,textarea{width:100%;background:#0b1428;border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px 10px;font:inherit}
textarea{min-height:54px;font-family:ui-monospace,Consolas,monospace;font-size:12px}
input:focus,select:focus,textarea:focus{outline:2px solid var(--accent2);outline-offset:-1px}
.seg{display:flex;background:#0b1428;border:1px solid var(--line);border-radius:8px;padding:3px;gap:3px}
.seg button{flex:1;border:0;background:none;color:var(--muted);padding:7px;border-radius:6px;cursor:pointer;font:inherit;font-weight:600}
.seg button.on{background:var(--accent2);color:#fff}
.row{display:flex;gap:8px}.row>*{flex:1}
.chk{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12px;color:var(--muted)}.chk input{width:auto}
.btn{border:1px solid var(--line);background:#16233f;color:var(--text);padding:7px 10px;border-radius:8px;cursor:pointer;font:inherit;font-size:12px}
.btn:hover{background:#1d2d50}
.hint{font-size:12px;color:var(--muted);margin-top:10px}

/* phone */
.phone{width:330px;margin:0 auto;background:#05070d;border-radius:44px;padding:14px;box-shadow:0 0 0 2px #2a2f3a,0 20px 50px rgba(0,0,0,.5)}
.screen{position:relative;height:660px;background:linear-gradient(#f8fafc,#eef2f7);border-radius:32px;overflow:hidden;color:#0f172a;display:flex;flex-direction:column}
.status{display:flex;justify-content:space-between;padding:10px 22px 4px;font-size:11px;font-weight:600}
.status span{max-width:95px;white-space:nowrap;overflow:hidden}
.notch{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:90px;height:22px;background:#05070d;border-radius:12px}
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
.entry .h{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 10px;font-size:12px;font-weight:600;background:#0b1428}
.entry .h .r{display:flex;align-items:center;gap:8px}
.cp{border:1px solid var(--line);background:#16233f;color:var(--text);padding:3px 8px;border-radius:6px;cursor:pointer;font:inherit;font-size:11px;font-weight:600}
.cp:hover{background:#1d2d50}
.entry pre{max-height:360px;overflow:auto}
.log .top{flex-wrap:wrap;gap:8px}
.modal{position:fixed;inset:0;background:rgba(2,6,23,.7);display:none;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal.show{display:flex}
.modal .box{background:var(--panel);border:1px solid var(--line);border-radius:12px;width:min(900px,100%);max-height:90vh;display:flex;flex-direction:column}
.modal .mh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--line)}
.modal .mh h3{margin:0;font-size:15px;flex:1}
.modal .seg{width:200px}
.modal pre{margin:0;padding:14px;overflow:auto;flex:1;font:12.5px/1.5 ui-monospace,Consolas,monospace;color:#abb2bf;white-space:pre;background:#0b1220;border-radius:0 0 12px 12px}
.log .top .btns{display:flex;gap:8px;flex-wrap:wrap}
.entry.req .h{color:#93c5fd}.entry.res .h{color:#86efac}.entry.err .h{color:#fca5a5}
.entry pre{margin:0;padding:10px;font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre-wrap;word-break:break-all;color:#cbd5e1}
.empty{color:var(--muted);font-size:13px;padding:20px;text-align:center;border:1px dashed var(--line);border-radius:8px}
</style>
</head>
<body>
<header><h1>📱 USSD Simulator</h1><span>Hubtel &amp; Nalo — test your USSD endpoint without a phone</span><span class="brand">Powered by <b>SAB-TECH HUB</b></span></header>

<div class="wrap">
  <!-- settings -->
  <section class="card">
    <h2>Settings</h2>
    <label>Gateway format</label>
    <div class="seg" id="provSeg">
      <button data-v="hubtel">Hubtel</button>
      <button data-v="nalo">Nalo</button>
    </div>

    <label for="endpoint">USSD endpoint URL</label>
    <input id="endpoint" placeholder="https://yourdomain.com/ussd/callback">
    <div class="row" style="margin-top:6px"><button class="btn" id="demoBtn" type="button">Use demo endpoint</button></div>

    <div class="row">
      <div><label for="msisdn">Phone number</label><input id="msisdn" value="233241234567"></div>
      <div><label for="operator">Network</label>
        <select id="operator">
          <option value="mtn">MTN</option>
          <option value="telecel">Telecel (Vodafone)</option>
          <option value="airteltigo">AirtelTigo</option>
        </select></div>
    </div>

    <label for="code">Default short code</label>
    <input id="code" value="*713#">

    <div id="naloOnly">
      <label for="userid">Nalo USERID</label>
      <input id="userid" value="NALOTest">
    </div>

    <label for="headers">Extra headers (optional, one per line)</label>
    <textarea id="headers" placeholder="Authorization: Bearer xyz"></textarea>

    <label class="chk"><input type="checkbox" id="insecure"> Ignore SSL certificate errors</label>
    <p class="hint">Tap the green call button to dial. Keyboard works too: digits, <b>*</b>, <b>#</b>, Enter, Backspace, Esc.</p>
  </section>

  <!-- phone -->
  <section>
    <div class="phone">
      <div class="screen">
        <div class="notch"></div>
        <div class="status"><span id="clock">12:00</span><span id="netName">MTN GH ▂▄▆█</span></div>
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
    <div class="meta" id="meta"></div>
  </section>

  <!-- log -->
  <section class="card log">
    <div class="top"><h2>Request / Response log</h2>
      <div class="btns">
        <button class="btn" id="viewSample" title="View and copy a starter PHP endpoint">Sample PHP code</button>
        <button class="btn" id="copyAll">Copy all</button>
        <button class="btn" id="clearLog">Clear</button>
      </div></div>
    <div id="logs"><div class="empty">Requests sent to your endpoint and its responses will appear here.</div></div>
  </section>
</div>

<footer>USSD Simulator · Powered by <b>SAB-TECH HUB</b> · © <span id="yr"></span></footer>

<div class="modal" id="sampleModal">
  <div class="box">
    <div class="mh">
      <h3>Sample PHP endpoint</h3>
      <div class="seg" id="sampleSeg"><button data-v="hubtel">Hubtel</button><button data-v="nalo">Nalo</button></div>
      <button class="btn" id="copySample">Copy code</button>
      <button class="btn" id="closeSample">Close</button>
    </div>
    <pre id="sampleCode"></pre>
  </div>
</div>

<script>
const $ = s => document.querySelector(s);
$('#yr').textContent = new Date().getFullYear();
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
$('#demoBtn').onclick = () => {
  const base = location.href.split('?')[0].replace(/[^/]*$/, '');
  $('#endpoint').value = base + 'mock.php'; store('endpoint', $('#endpoint').value);
};
function updateNet(){
  const n = {mtn:'MTN GH', telecel:'Telecel GH', airteltigo:'AT GH'}[$('#operator').value];
  $('#netName').textContent = n + ' ▂▄▆█';
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
function renderDial(){ $('#num').textContent = dialStr; $('#sub').textContent = dialStr ? '' : 'Dial a USSD code (default ' + $('#code').value + ')'; }
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
  try {
    const r = await fetch('?proxy=1', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ url: $('#endpoint').value.trim(), payload, insecure: $('#insecure').checked, headers: $('#headers').value }) });
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
  if (res.error) { S.active = false; showDialog('Connection problem or invalid MMI code.\n\n' + res.error, true); return; }
  if (res.status >= 400) { S.active = false; showDialog(`Endpoint returned HTTP ${res.status}.\n\n` + String(res.body || '').slice(0, 300), true); return; }
  const p = parseResponse(res.body);
  if (p.clientState !== undefined && p.clientState !== null) S.clientState = String(p.clientState);
  if (p.end) S.active = false;
  showDialog(p.msg, p.end);
  updateMeta(p.end ? 'session ended' : 'waiting for input');
}

function updateMeta(state){
  $('#meta').textContent = S.sessionId ? `Session ${S.sessionId.slice(0,10)}… · step ${S.seq} · ${state}` : '';
}

async function dial(){
  if (!$('#endpoint').value.trim()) { alert('Enter your USSD endpoint URL first (or click "Use demo endpoint").'); $('#endpoint').focus(); return; }
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
$('#clearLog').onclick = () => { $('#logs').innerHTML = '<div class="empty">Log cleared.</div>'; };
$('#copyAll').onclick = e => {
  const txt = [...document.querySelectorAll('#logs .entry')].map(en =>
    en.querySelector('.h span').textContent + '  [' + en.querySelector('.r span').textContent + ']\n' + en.querySelector('pre').textContent).join('\n\n');
  copyText(txt || '(log is empty)', e.currentTarget);
};
let sampleProv = 'hubtel';
function showSample(p){
  sampleProv = p;
  document.querySelectorAll('#sampleSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === p));
  const code = p === 'nalo' ? SAMPLE_NALO : SAMPLE_HUBTEL;
  if (window.hljs) $('#sampleCode').innerHTML = hljs.highlight(code, { language: 'php' }).value;
  else $('#sampleCode').textContent = code;
  $('#sampleCode').scrollTop = 0;
}
$('#viewSample').onclick = () => { showSample(provider); $('#sampleModal').classList.add('show'); };
$('#sampleSeg').onclick = e => { const b = e.target.closest('button'); if (b) showSample(b.dataset.v); };
$('#copySample').onclick = e => copyText(sampleProv === 'nalo' ? SAMPLE_NALO : SAMPLE_HUBTEL, e.currentTarget);
$('#closeSample').onclick = () => $('#sampleModal').classList.remove('show');
$('#sampleModal').onclick = e => { if (e.target.id === 'sampleModal') $('#sampleModal').classList.remove('show'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#sampleModal').classList.remove('show'); });

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

/* ---------- sample endpoint code ---------- */
const SAMPLE_HUBTEL = "<" + String.raw`?php
// Hubtel USSD endpoint (Programmable Services) - sample
header('Content-Type: application/json');

$req         = json_decode(file_get_contents('php://input'), true) ?: [];
$type        = strtolower($req['Type'] ?? '');      // initiation | response | release | timeout
$sessionId   = $req['SessionId'] ?? '';
$mobile      = $req['Mobile'] ?? '';
$input       = trim($req['Message'] ?? '');
$clientState = $req['ClientState'] ?? '';           // whatever you sent back last time

function reply($sessionId, $message, $nextState = '', $end = false) {
    echo json_encode([
        'SessionId'   => $sessionId,
        'Type'        => $end ? 'Release' : 'Response',
        'Message'     => $message,
        'Label'       => 'Menu',
        'ClientState' => $nextState,
        'DataType'    => $end ? 'display' : 'input',
        'FieldType'   => 'text',
    ]);
    exit;
}

// User cancelled or session timed out
if ($type === 'release' || $type === 'timeout') {
    reply($sessionId, '', '', true);
}

// First dial, e.g. *713#
if ($type === 'initiation') {
    reply($sessionId, "Welcome\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');
}

switch ($clientState) {
    case 'menu':
        if ($input === '1') reply($sessionId, "Your balance is GHS 25.40", '', true);
        if ($input === '2') reply($sessionId, "Enter amount (GHS):", 'amount');
        if ($input === '0') reply($sessionId, "Goodbye!", '', true);
        reply($sessionId, "Invalid option.\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');

    case 'amount':
        if (!is_numeric($input) || $input <= 0) reply($sessionId, "Invalid amount. Enter amount (GHS):", 'amount');
        reply($sessionId, "Buy GHS $input airtime?\n1. Confirm\n2. Cancel", 'confirm:' . $input);

    default:
        if (strpos($clientState, 'confirm:') === 0) {
            $amount = substr($clientState, 8);
            if ($input === '1') {
                // TODO: process payment for $mobile here
                reply($sessionId, "Success! GHS $amount airtime purchased.", '', true);
            }
            reply($sessionId, "Transaction cancelled.", '', true);
        }
        reply($sessionId, "Session error. Please dial again.", '', true);
}
`;

const SAMPLE_NALO = "<" + String.raw`?php
// Nalo USSD endpoint - sample
header('Content-Type: application/json');

$req       = json_decode(file_get_contents('php://input'), true) ?: [];
$userId    = $req['USERID'] ?? '';
$msisdn    = $req['MSISDN'] ?? '';
$input     = trim($req['USERDATA'] ?? '');
$isNew     = filter_var($req['MSGTYPE'] ?? false, FILTER_VALIDATE_BOOLEAN); // true = first dial
$network   = $req['NETWORK'] ?? '';
$sessionId = preg_replace('/\W/', '', $req['SESSIONID'] ?? '');

// Nalo does not send state back, so keep it yourself (file here; use DB/Redis in production)
$stateFile = sys_get_temp_dir() . "/ussd_$sessionId.txt";
$state     = $isNew ? '' : (string)@file_get_contents($stateFile);

function reply($message, $nextState = '', $end = false) {
    global $userId, $msisdn, $input, $stateFile;
    $end ? @unlink($stateFile) : file_put_contents($stateFile, $nextState);
    echo json_encode([
        'USERID'   => $userId,
        'MSISDN'   => $msisdn,
        'USERDATA' => $input,
        'MSG'      => $message,
        'MSGTYPE'  => !$end,   // true = wait for input, false = end session
    ]);
    exit;
}

if ($isNew) {
    reply("Welcome\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');
}

switch ($state) {
    case 'menu':
        if ($input === '1') reply("Your balance is GHS 25.40", '', true);
        if ($input === '2') reply("Enter amount (GHS):", 'amount');
        if ($input === '0') reply("Goodbye!", '', true);
        reply("Invalid option.\n1. Check balance\n2. Buy airtime\n0. Exit", 'menu');

    case 'amount':
        if (!is_numeric($input) || $input <= 0) reply("Invalid amount. Enter amount (GHS):", 'amount');
        reply("Buy GHS $input airtime?\n1. Confirm\n2. Cancel", 'confirm:' . $input);

    default:
        if (strpos($state, 'confirm:') === 0) {
            $amount = substr($state, 8);
            if ($input === '1') {
                // TODO: process payment for $msisdn here
                reply("Success! GHS $amount airtime purchased.", '', true);
            }
            reply("Transaction cancelled.", '', true);
        }
        reply("Session error. Please dial again.", '', true);
}
`;
</script>
</body>
</html>
