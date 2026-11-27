/*
 * Tutorial recorder: a scripted "tour" that is stepped frame by frame.
 * The recorder calls tour.tick(ms) and takes a screenshot after each call.
 *   tick() returns { kind: 'frame' }        -> capture one frame (ms long)
 *                  { kind: 'hold', ms }     -> capture one frame shown for ms
 *                  { kind: 'pending' }      -> nothing to capture, call again shortly
 *                  { kind: 'done' }
 * Only used to make the video; it is not part of the simulator.
 */
(function () {
  const css = `
  #tourCursor{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483646;pointer-events:none;transform:translate(-3px,-2px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
  #tourHalo{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(37,99,235,.18);border:2px solid rgba(37,99,235,.55);z-index:2147483645;pointer-events:none;opacity:0}
  .tourRipple{position:fixed;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:3px solid #2563eb;z-index:2147483645;pointer-events:none}
  #tourCaption{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483640;max-width:min(1100px,90vw);background:rgba(15,23,42,.92);color:#fff;padding:14px 22px 14px 18px;border-radius:14px;font:500 19px/1.4 Inter,system-ui,sans-serif;display:flex;gap:14px;align-items:center;box-shadow:0 12px 32px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:none}
  #tourCaption .st{flex-shrink:0;background:#2563eb;color:#fff;border-radius:8px;padding:4px 10px;font-size:14px;font-weight:700;letter-spacing:.02em}
  #tourTitle{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;flex-direction:column;gap:18px;text-align:center;color:#fff;font-family:Inter,system-ui,sans-serif;
    background:radial-gradient(1200px 600px at 20% 10%,#1d4ed8 0%,transparent 60%),radial-gradient(900px 500px at 90% 90%,#15803d 0%,transparent 55%),#0b1220}
  #tourTitle .brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:18px;letter-spacing:.04em;opacity:.9}
  #tourTitle .brand b{width:46px;height:46px;border-radius:10px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800}
  #tourTitle .kicker{font-size:20px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#93c5fd}
  #tourTitle h1{margin:0;font-size:64px;font-weight:800;letter-spacing:-.02em;max-width:1300px;line-height:1.08}
  #tourTitle p{margin:0;font-size:24px;color:#cbd5e1;max-width:1000px;line-height:1.45}
  #tourTitle .bar{width:120px;height:5px;border-radius:3px;background:linear-gradient(90deg,#22c55e,#3b82f6)}
  #tourTitle .foot{position:absolute;bottom:34px;font-size:16px;color:#94a3b8}
  #tourBanner{position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:2147483640;background:rgba(15,23,42,.92);color:#fff;border-radius:999px;padding:9px 20px;font:600 17px/1.3 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none;display:none;white-space:nowrap}
  #tourBanner b{color:#93c5fd;margin-right:10px;text-transform:uppercase;letter-spacing:.08em;font-size:14px}`;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);

  const cursor = document.createElement('div'); cursor.id = 'tourCursor';
  cursor.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.6 4 7.4-3 1.5-4-7.5L4 19z" fill="#fff" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const halo = document.createElement('div'); halo.id = 'tourHalo';
  const caption = document.createElement('div'); caption.id = 'tourCaption';
  const title = document.createElement('div'); title.id = 'tourTitle';
  const banner = document.createElement('div'); banner.id = 'tourBanner';
  document.body.append(halo, cursor, caption, title, banner);

  let cx = innerWidth * 0.6, cy = innerHeight * 0.55;
  const place = () => { cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px'; halo.style.left = cx + 'px'; halo.style.top = cy + 'px'; };
  place();

  const steps = [];
  let idx = 0, cur = null, videoMs = 0;
  const clicks = [], chapters = [], cues = [];
  let speechEnd = 0, label = '', lastLine = '';
  const NARR = window.NARR || {};
  const showCaption = text => {
    caption.innerHTML = (label ? '<span class="st"></span>' : '') + '<span></span>';
    if (label) caption.firstChild.textContent = label;
    caption.lastChild.textContent = text; caption.style.opacity = text ? '1' : '0';
  };
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const $ = q => typeof q === 'function' ? q() : document.querySelector(q);
  const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + Math.min(r.width / 2, 60), r.top + r.height / 2]; };
  function ensureVisible(el) {
    const r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 110) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  /* ---------- building blocks ---------- */
  const T = {
    run(fn) { steps.push({ step() { fn(); return { kind: 'skip', end: true }; } }); return T; },
    wait(ms) { steps.push({ step() { return { kind: 'hold', ms, end: true }; } }); return T; },
    /** wait in real time (CSS transitions, network) without adding video time */
    sleep(ms) { let s = 0; steps.push({ step() { if (!s) s = performance.now(); return performance.now() - s >= ms ? { kind: 'skip', end: true } : { kind: 'pending' }; } }); return T; },
    until(fn, ms = 8000) { let s = 0; steps.push({ step() { if (!s) s = performance.now(); return (fn() || performance.now() - s > ms) ? { kind: 'skip', end: true } : { kind: 'pending' }; } }); return T; },
    /** label shown at the left of every subtitle, e.g. "Video 4" */
    label(text) { return T.run(() => { label = text; }); },
    /** wait until the narrator has finished the current line (plus a short pause) */
    sync(pause = 600) {   // a calm pause between lines, easier for beginners
      steps.push({ step() { const r = speechEnd + pause - videoMs; return r > 0 ? { kind: 'hold', ms: r, end: true } : { kind: 'skip', end: true }; } });
      return T;
    },
    /** narrate a line: shown as a subtitle; spoken text can differ (e.g. "*713#" -> "star seven one three hash") */
    say(text, spoken) {
      T.sync();
      steps.push({ step() {
        const key = spoken || text;
        let d = NARR[key];
        if (d == null) { (window.__tourErrors = window.__tourErrors || []).push('no narration audio for: ' + key); d = key.length * 65; }
        cues.push({ t: Math.round(videoMs), key });
        speechEnd = videoMs + d; lastLine = text;
        if (title.style.display !== 'flex') showCaption(text);
        return { kind: 'skip', end: true };
      } });
      return T;
    },
    /** title card that stays up while the narrator speaks */
    titleOn(kicker, heading, sub, foot = '') {
      return T.run(() => {
        chapters.push({ t: Math.round(videoMs), heading });
        title.innerHTML = `<div class="brand"><b>SAB</b>SAB-TECH HUB</div>${kicker ? `<div class="kicker"></div>` : ''}<h1></h1><div class="bar"></div>${sub ? '<p></p>' : ''}${foot ? '<div class="foot"></div>' : ''}`;
        if (kicker) title.querySelector('.kicker').textContent = kicker;
        title.querySelector('h1').textContent = heading;
        if (sub) title.querySelector('p').textContent = sub;
        if (foot) title.querySelector('.foot').textContent = foot;
        title.style.display = 'flex'; caption.style.opacity = '0';
      });
    },
    titleOff() { T.sync(400); return T.run(() => { title.style.display = 'none'; }); },
    /** small label at the top of the screen for the current part, e.g. "Part 3 · Look around" (also a chapter marker) */
    banner(kicker, heading) {
      return T.run(() => {
        chapters.push({ t: Math.round(videoMs), heading });
        banner.innerHTML = '<b></b><span></span>';
        banner.firstChild.textContent = kicker; banner.lastChild.textContent = heading;
        banner.style.display = 'block';
      });
    },
    bannerOff() { return T.run(() => { banner.style.display = 'none'; }); },
    /** hide the title card now; if the narrator is still talking, show his line as a subtitle */
    titleHide() { return T.run(() => { title.style.display = 'none'; if (speechEnd > videoMs) showCaption(lastLine); }); },
    /** smooth scroll of a scrollable element (e.g. the code window) */
    scroll(target, toY, ms = 1200) {
      T.sync(150);
      let el, from, t = 0;
      steps.push({ step(dt) {
        if (!el) { el = $(target); if (!el) return { kind: 'skip', end: true }; from = el.scrollTop; }
        t += dt; const p = ease(Math.min(1, t / ms));
        el.scrollTop = from + ((typeof toY === 'function' ? toY(el) : toY) - from) * p;
        return { kind: 'frame', end: t >= ms };
      } });
      return T;
    },
    caption(text, stepLabel) {
      return T.run(() => {
        caption.innerHTML = (stepLabel ? `<span class="st">${stepLabel}</span>` : '') + '<span></span>';
        caption.lastChild.textContent = text; caption.style.opacity = text ? '1' : '0';
      });
    },
    title(kicker, heading, sub, ms = 3200, foot = '') {
      T.run(() => {
        chapters.push({ t: videoMs, heading });
        title.innerHTML = `<div class="brand"><b>SAB</b>SAB-TECH HUB</div>${kicker ? `<div class="kicker"></div>` : ''}<h1></h1><div class="bar"></div>${sub ? '<p></p>' : ''}${foot ? '<div class="foot"></div>' : ''}`;
        if (kicker) title.querySelector('.kicker').textContent = kicker;
        title.querySelector('h1').textContent = heading;
        if (sub) title.querySelector('p').textContent = sub;
        if (foot) title.querySelector('.foot').textContent = foot;
        title.style.display = 'flex'; caption.style.opacity = '0';
      });
      T.wait(ms);
      return T.run(() => { title.style.display = 'none'; });
    },
    move(target, ms = 650) {
      T.sync(200);
      let from, to, t = 0;
      steps.push({ step(dt) {
        if (!from) {
          const el = $(target);
          if (!el) { (window.__tourErrors = window.__tourErrors || []).push(`not found at ${Math.round(videoMs / 1000)}s: ${target}`); return { kind: 'skip', end: true }; }
          ensureVisible(el); from = [cx, cy]; to = centerOf(el);
        }
        t += dt; const p = ease(Math.min(1, t / ms));
        cx = from[0] + (to[0] - from[0]) * p; cy = from[1] + (to[1] - from[1]) * p; place();
        return { kind: 'frame', end: t >= ms };
      } });
      return T;
    },
    /** ripple + click sound; act() does the real click (default: element.click()) */
    click(target, act, moveMs) {
      T.move(target, moveMs);
      let t = 0, ring;
      steps.push({ step(dt) {
        if (t === 0) {
          clicks.push(videoMs);
          ring = document.createElement('div'); ring.className = 'tourRipple'; ring.style.left = cx + 'px'; ring.style.top = cy + 'px'; document.body.append(ring);
          halo.style.opacity = '1';
          const el = $(target);
          try { if (act) act(el); else if (el) el.click(); } catch (e) { console.warn('tour click', e); }
        }
        t += dt; const p = Math.min(1, t / 320);
        ring.style.transform = `scale(${1 + p * 3})`; ring.style.opacity = String(1 - p);
        halo.style.opacity = String(1 - p);
        if (p >= 1) { ring.remove(); halo.style.opacity = '0'; }
        return { kind: 'frame', end: p >= 1 };
      } });
      return T;
    },
    /** type text into an input/textarea, a few letters per frame */
    type(target, text, { msPerChar = 55, clear = true, change = false } = {}) {
      T.sync(150);
      let el, n = 0, acc = 0;
      steps.push({ step(dt) {
        if (!el) { el = $(target); if (!el) return { kind: 'skip', end: true }; el.focus(); if (clear) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } }
        acc += dt;
        while (acc >= msPerChar && n < text.length) { acc -= msPerChar; el.value += text[n++]; el.dispatchEvent(new Event('input', { bubbles: true })); }
        const end = n >= text.length;
        if (end && change) el.dispatchEvent(new Event('change', { bubbles: true }));
        return { kind: 'frame', end };
      } });
      return T;
    },
    /** choose an option in a <select> */
    pick(target, value) {
      return T.click(target, el => { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); });
    },
    hover(target) {
      T.move(target);
      return T.run(() => { const el = $(target); if (el) el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); });
    },
    /** drag with the pointer from one place to another (map boxes and links) */
    drag(fromTarget, toTarget, ms = 900, offset = [0, 0]) {
      T.move(fromTarget);
      let t = 0, startEl, from, to;
      steps.push({ step(dt) {
        const pe = (type, x, y, el) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, button: 0, isPrimary: true, pointerType: 'mouse' }));
        if (!startEl) {
          startEl = $(fromTarget); if (!startEl) return { kind: 'skip', end: true };
          from = [cx, cy];
          // the target can be an element, a function returning an element, or a function returning a point {x, y}
          const toEl = typeof toTarget === 'string' || typeof toTarget === 'function' ? $(toTarget) : null;
          to = toEl && typeof toEl.x === 'number' && !toEl.nodeType ? [toEl.x, toEl.y] : toEl ? centerOf(toEl) : [cx + offset[0], cy + offset[1]];
          clicks.push(videoMs);
          pe('pointerdown', cx, cy, startEl);
        }
        t += dt; const p = ease(Math.min(1, t / ms));
        cx = from[0] + (to[0] - from[0]) * p; cy = from[1] + (to[1] - from[1]) * p; place();
        pe('pointermove', cx, cy, startEl);
        if (p >= 1) pe('pointerup', cx, cy, startEl);
        return { kind: 'frame', end: p >= 1 };
      } });
      return T;
    },
    rightClick(target) {
      T.move(target);
      return T.run(() => {
        clicks.push(videoMs);
        const el = $(target); if (el) el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 2 }));
      });
    },
    key(key) { T.sync(150); return T.run(() => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))); },
    scrollTop() { return T.run(() => window.scrollTo(0, 0)); },
  };

  window.tour = {
    T,
    tick(dt) {
      for (let guard = 0; guard < 200; guard++) {
        if (!cur) {
          if (idx >= steps.length) {
            if (speechEnd + 600 > videoMs) { const ms = speechEnd + 600 - videoMs; videoMs += ms; return { kind: 'hold', ms }; }   // let the last line finish
            return { kind: 'done', clicks, chapters, cues, videoMs };
          }
          cur = steps[idx++];
        }
        const r = cur.step(dt);
        if (r.end) cur = null;
        if (r.kind === 'skip') continue;
        if (r.kind === 'frame') videoMs += dt;
        if (r.kind === 'hold') videoMs += r.ms;
        return r;
      }
      return { kind: 'pending' };
    },
    get clicks() { return clicks; },
    get videoMs() { return videoMs; },
  };
})();
