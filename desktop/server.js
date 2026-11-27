/*
 * Small local web server for the desktop app. It does the jobs index.php does on a website:
 *   GET  /                -> the simulator page (taken from index.php, without the PHP parts)
 *   GET  /?source=hubtel  -> sample endpoint code for the viewer
 *   POST /?proxy=1        -> forwards a USSD request to the user's server (no CORS limits here)
 *   POST /mock.php        -> the demo endpoint
 * It only listens on 127.0.0.1, so nothing outside this computer can use it.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mock = require('./mock');

const SAMPLE_FILES = { hubtel: 'sample-hubtel.php', nalo: 'sample-nalo.php' };
const TYPES = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };

function pageHtml(web, info) {
  let html = fs.readFileSync(path.join(web, 'index.php'), 'utf8');
  const start = html.indexOf('?><!doctype html>');
  if (start < 0) throw new Error('index.php: page start not found');
  html = html.slice(start + 2);
  html = html.replace(/<\?=\s*SIM_OWN_COMPUTER[\s\S]*?\?>/, 'true')
             .replace(/<\?=\s*json_encode\(GITHUB_URL\)\s*\?>/, JSON.stringify(info.github))
             .replace(/<\?=\s*json_encode\(APP_URL\)\s*\?>/, JSON.stringify(info.github + '/releases/latest'))
             .replace(/<\?=\s*htmlspecialchars\(APP_URL\)\s*\?>/, info.github + '/releases/latest');
  if (/<\?(php|=)/.test(html)) throw new Error('index.php has PHP the desktop app does not understand');
  // use the bundled code highlighter, so the app works without internet
  html = html.replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/highlight\.js\/[\d.]+\/styles\/atom-one-dark\.min\.css/, 'vendor/atom-one-dark.min.css')
             .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/highlight\.js\/[\d.]+\/highlight\.min\.js/, 'vendor/highlight.min.js')
  // and the bundled Inter font instead of Google Fonts
             .replace(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '')
             .replace('</head>', '<style>@font-face{font-family:"Inter";font-style:normal;font-display:swap;font-weight:100 900;src:url(vendor/inter-latin-wght-normal.woff2) format("woff2")}</style></head>');
  // tell the page it runs as an installed app (shows the version in the footer)
  return html.replace('</head>', `<script>window.SIM_DESKTOP = ${JSON.stringify({ version: info.version })};</script></head>`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > 1e6) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** POST a JSON payload to the user's endpoint, following redirects, with a 20 s limit. */
function forward(url, payload, headers, insecure, redirects = 5) {
  return new Promise(resolve => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ status: 0, body: null, error: 'Not a valid address' }); }
    const lib = u.protocol === 'https:' ? https : http;
    const body = Buffer.from(payload, 'utf8');
    const req = lib.request(u, {
      method: 'POST', timeout: 20000, rejectUnauthorized: !insecure,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers, 'Content-Length': body.length },
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(forward(new URL(res.headers.location, u).href, payload, headers, insecure, redirects - 1));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), error: null }));
    });
    req.on('timeout', () => req.destroy(new Error('No answer within 20 seconds')));
    req.on('error', e => resolve({ status: 0, body: null, error: e.message }));
    req.end(body);
  });
}

async function proxy(raw, selfOrigin) {
  let input = {};
  try { input = JSON.parse(raw || '{}') || {}; } catch (e) {}
  const url = String(input.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return { error: 'Endpoint must start with http:// or https://' };
  const payload = JSON.stringify(input.payload ?? {});
  const t = Date.now();
  // the demo endpoint is answered right here
  let u; try { u = new URL(url); } catch (e) {}
  if (u && u.origin === selfOrigin && u.pathname === '/mock.php') {
    const body = JSON.stringify(mock.handle(input.payload || {}));
    return { status: 200, time_ms: Date.now() - t, body, error: null };
  }
  const headers = {};
  for (const line of String(input.headers || '').split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const r = await forward(url, payload, headers, !!input.insecure);
  return { status: r.status, time_ms: Date.now() - t, body: r.body, error: r.error };
}

function start(web, info) {
  web = path.resolve(web);
  const html = pageHtml(web, info);
  const server = http.createServer(async (req, res) => {
    const send = (code, type, data) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(data); };
    try {
      const u = new URL(req.url, 'http://x');
      const origin = `http://${req.headers.host}`;
      if (u.searchParams.has('proxy') && req.method === 'POST') return send(200, 'application/json', JSON.stringify(await proxy(await readBody(req), origin)));
      if (u.searchParams.has('source')) {
        const f = SAMPLE_FILES[u.searchParams.get('source')];
        return send(200, 'text/plain; charset=utf-8', f ? fs.readFileSync(path.join(web, f), 'utf8') : '');
      }
      if (u.pathname === '/mock.php') {
        let r = {}; try { r = JSON.parse(await readBody(req) || '{}'); } catch (e) {}
        return send(200, 'application/json', JSON.stringify(mock.handle(r)));
      }
      if (u.pathname === '/' || u.pathname === '/index.php') return send(200, 'text/html; charset=utf-8', html);
      const file = path.join(web, path.normalize(decodeURIComponent(u.pathname)).replace(/^([\\/]|\.\.)+/, ''));
      if (file.startsWith(web) && TYPES[path.extname(file)] && fs.existsSync(file)) return send(200, TYPES[path.extname(file)], fs.readFileSync(file));
      send(404, 'text/plain', 'Not found');
    } catch (e) {
      send(500, 'text/plain', String(e && e.message || e));
    }
  });
  // A fixed port keeps the page's address the same on every start, so saved menus (kept per address) stay.
  // If it is busy, try the next few, and as a last resort any free port.
  const ports = [47813, 47814, 47815, 47816, 47817, 0];
  return new Promise((resolve, reject) => {
    const tryPort = i => {
      server.removeAllListeners('error');
      server.once('error', e => (e.code === 'EADDRINUSE' && i + 1 < ports.length) ? tryPort(i + 1) : reject(e));
      server.listen(ports[i], '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` }));
    };
    tryPort(0);
  });
}

module.exports = { start, pageHtml, proxy };
