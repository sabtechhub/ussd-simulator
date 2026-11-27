/*
 * USSD Menu Builder — Powered by SAB-TECH HUB
 *
 * A flow is a list of screens:
 *   menu  : message + numbered options, each option goes to another screen
 *   input : asks the user to type something, saves it, then checks conditions
 *           to decide the next screen
 *   end   : final message, the session closes
 *
 * The same flow can be run inside the simulator (Flow.run) and turned into a
 * Hubtel or Nalo PHP endpoint (Flow.toPhp). Both follow the same rules.
 */
(function () {
  'use strict';

  const BUILDER_ENDPOINT = 'builder:flow';
  const STORE_KEY = 'ussdsim_flow';

  const VALIDATE = {
    any:    { label: 'Anything',            msg: 'Please enter a value.' },
    number: { label: 'A number',            msg: 'Please enter a valid number.' },
    pin:    { label: '4-digit PIN',         msg: 'Please enter 4 digits.' },
    phone:  { label: 'Phone number',        msg: 'Please enter a valid phone number.' },
  };
  const OPS = [
    ['=', 'equals'], ['!=', 'not equal'], ['>', 'greater than'], ['<', 'less than'],
    ['>=', 'at least'], ['<=', 'at most'], ['contains', 'contains'],
  ];

  /** A new menu: one empty start screen. */
  function blankFlow() {
    return { name: "", start: "main", screens: [
      { id: "main", type: "menu", text: "", saveAs: "", options: [{ key: "1", label: "", next: "" }], rules: [], validate: "any", error: "", next: "" },
    ] };
  }
  /** Menus saved by an older version that only held the built-in vote example are replaced by a blank menu. */
  function isOldExample(f) { return f && f.name === "Demo Vote" && Array.isArray(f.screens) && f.screens.some(s => s.id === "votes"); }

  /* ================= model ================= */
  let flow = load();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    try { const f = JSON.parse(localStorage.getItem(STORE_KEY)); if (valid(f) && !isOldExample(f)) return normalize(f); } catch (e) {}
    return blankFlow();
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(flow)); } catch (e) {} }
  function valid(f) { return f && Array.isArray(f.screens) && f.screens.length > 0; }
  function normalize(f) {
    f.name = typeof f.name === 'string' ? f.name : '';
    f.screens.forEach(s => {
      s.id = slug(s.id) || 'screen';
      s.type = ['menu', 'input', 'end'].includes(s.type) ? s.type : 'menu';
      s.text = s.text || '';
      s.options = Array.isArray(s.options) ? s.options : [];
      s.rules = Array.isArray(s.rules) ? s.rules : [];
      s.saveAs = slug(s.saveAs || '');
      s.validate = VALIDATE[s.validate] ? s.validate : 'any';
      s.error = s.error || '';
      s.next = s.next || '';
    });
    if (!f.screens.some(s => s.id === f.start)) f.start = f.screens[0].id;
    return f;
  }
  function slug(s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40); }
  function screen(id) { return flow.screens.find(s => s.id === id); }
  function uniqueId(base) { let id = slug(base) || 'screen', n = 2; const b = id; while (screen(id)) id = b + '_' + n++; return id; }
  function inputVar(s) { return s.saveAs || s.id; }
  function knownVars() {
    const v = new Set(['phone', 'network']);
    flow.screens.forEach(s => { if (s.type === 'input') v.add(inputVar(s)); if (s.type === 'menu' && s.saveAs) v.add(s.saveAs); });
    return [...v];
  }

  /** Text the phone shows for a screen (menu options are added as numbered lines). */
  function screenText(s) {
    if (s.type !== 'menu') return s.text;
    const lines = s.options.filter(o => o.key !== '' || o.label !== '').map(o => `${o.key}. ${o.label}`);
    return [s.text, ...lines].filter(x => x !== '').join('\n');
  }

  /* ================= runner (used by the simulator) ================= */
  function fill(text, vars) { return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => vars[k] !== undefined ? vars[k] : ''); }
  function isNum(x) { return x !== '' && x !== null && !isNaN(x) && !isNaN(parseFloat(x)); }
  function compare(a, op, b) {
    a = a === undefined || a === null ? '' : String(a); b = String(b);
    const num = isNum(a) && isNum(b), x = num ? parseFloat(a) : a, y = num ? parseFloat(b) : b;
    switch (op) {
      case '=': return x == y; case '!=': return x != y;
      case '>': return x > y; case '<': return x < y;
      case '>=': return x >= y; case '<=': return x <= y;
      case 'contains': return a.indexOf(b) !== -1;
    }
    return false;
  }
  function validInput(rule, v) {
    switch (rule) {
      case 'number': return isNum(v) && /^-?\d+(\.\d+)?$/.test(v);
      case 'pin': return /^\d{4}$/.test(v);
      case 'phone': return /^(0|233)\d{9}$/.test(v);
      default: return v !== '';
    }
  }

  /**
   * One step of the flow. state = {s: current screen id, v: saved values}.
   * Returns {text, end, state}.
   */
  function step(state, input, isNew, ctx) {
    const st = isNew || !state ? { s: '', v: {} } : { s: state.s, v: Object.assign({}, state.v) };
    st.v.phone = ctx.phone; st.v.network = ctx.network;
    const show = (id, err) => {
      const s = screen(id);
      if (!s) return { text: 'Session error. Please dial again.', end: true, state: st };
      let t = fill(screenText(s), st.v);
      if (err) t = err + '\n' + t;
      st.s = id;
      return { text: t, end: s.type === 'end', state: st };
    };
    if (isNew) return show(flow.start);
    const cur = screen(st.s);
    if (!cur || cur.type === 'end') return show(flow.start);
    if (cur.type === 'menu') {
      const opt = cur.options.find(o => String(o.key) === input);
      if (!opt) return show(cur.id, 'Invalid option.');
      if (cur.saveAs) st.v[cur.saveAs] = opt.label;
      return show(opt.next);
    }
    // input screen
    if (!validInput(cur.validate, input)) return show(cur.id, cur.error || VALIDATE[cur.validate].msg);
    st.v[inputVar(cur)] = input;
    for (const r of cur.rules) {
      if (r.next && compare(st.v[r.var || inputVar(cur)], r.op, r.value)) return show(r.next);
    }
    return show(cur.next);
  }

  const naloSessions = {};
  /** Answers a Hubtel or Nalo request payload exactly like the generated PHP would. */
  function respond(payload, gateway) {
    if (gateway === 'hubtel') {
      const type = String(payload.Type || '').toLowerCase();
      if (type === 'release' || type === 'timeout') return { SessionId: payload.SessionId, Type: 'Release', Message: '' };
      let state = null; try { state = JSON.parse(payload.ClientState || 'null'); } catch (e) {}
      const r = step(state, String(payload.Message || '').trim(), type === 'initiation', { phone: payload.Mobile || '', network: payload.Operator || '' });
      return {
        SessionId: payload.SessionId, Type: r.end ? 'Release' : 'Response', Message: r.text, Label: flow.name || 'USSD',
        ClientState: r.end ? '' : JSON.stringify(r.state), DataType: r.end ? 'display' : 'input', FieldType: 'text',
      };
    }
    const isNew = payload.MSGTYPE === true || String(payload.MSGTYPE).toLowerCase() === 'true';
    const input = isNew ? '' : String(payload.USERDATA || '').trim();
    const r = step(naloSessions[payload.SESSIONID], input, isNew, { phone: payload.MSISDN || '', network: payload.NETWORK || '' });
    if (r.end) delete naloSessions[payload.SESSIONID]; else naloSessions[payload.SESSIONID] = r.state;
    return { USERID: payload.USERID, MSISDN: payload.MSISDN, USERDATA: input, MSG: r.text, MSGTYPE: !r.end };
  }

  /* ================= PHP generator ================= */
  function phpStr(s) {
    return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/\r?\n/g, '\\n') + '"';
  }
  function phpVal(v) { return isNum(v) && /^-?\d+(\.\d+)?$/.test(String(v)) ? String(v) : phpStr(v); }
  function phpCond(varName, op, value) {
    const a = `$vars[${phpStr(varName)}] ?? ''`;
    if (op === 'contains') return `strpos((string)(${a}), ${phpStr(value)}) !== false`;
    const phpOp = op === '=' ? '==' : op;
    return `(${a}) ${phpOp} ${phpVal(value)}`;
  }
  function phpValidate(rule) {
    switch (rule) {
      case 'number': return `!preg_match('/^-?\\d+(\\.\\d+)?$/', $input)`;
      case 'pin': return `!preg_match('/^\\d{4}$/', $input)`;
      case 'phone': return `!preg_match('/^(0|233)\\d{9}$/', $input)`;
      default: return `$input === ''`;
    }
  }

  function toPhp(gateway) {
    const L = [];
    const hub = gateway === 'hubtel';
    L.push('<?php');
    L.push('/*');
    L.push(` * ${(flow.name || 'USSD menu').replace(/\*\//g, '* /').replace(/\?>/g, '? >')} — ${hub ? 'Hubtel' : 'Nalo'} USSD endpoint`);
    L.push(' * Generated with SAB-TECH HUB USSD Simulator (Menu Builder)');
    L.push(' * Powered by SAB-TECH HUB');
    L.push(' *');
    L.push(' * How it works: show() sends a screen to the phone and stops the script.');
    L.push(' * The current screen and saved values ($vars) are kept between requests' + (hub ? ' in ClientState.' : ' in a temp file.'));
    L.push(' */');
    L.push("header('Content-Type: application/json');");
    L.push('');
    L.push('// ---------- read the request ----------');
    L.push("$req = json_decode(file_get_contents('php://input'), true) ?: [];");
    if (hub) {
      L.push("$type      = strtolower($req['Type'] ?? '');   // initiation | response | release | timeout");
      L.push("$sessionId = $req['SessionId'] ?? '';");
      L.push("$input     = trim($req['Message'] ?? '');");
      L.push("$state     = json_decode($req['ClientState'] ?? '', true) ?: ['s' => '', 'v' => []];");
      L.push("$vars      = $state['v'];");
      L.push("$vars['phone']   = $req['Mobile'] ?? '';");
      L.push("$vars['network'] = $req['Operator'] ?? '';");
    } else {
      L.push("$isNew     = filter_var($req['MSGTYPE'] ?? false, FILTER_VALIDATE_BOOLEAN);   // true = first dial");
      L.push("$sessionId = preg_replace('/\\W/', '', (string)($req['SESSIONID'] ?? ''));");
      L.push("$input     = $isNew ? '' : trim($req['USERDATA'] ?? '');");
      L.push('// Nalo does not send state back, so keep it in a file (use your database in production)');
      L.push("$stateFile = sys_get_temp_dir() . \"/ussd_$sessionId.json\";");
      L.push("$state     = $isNew ? null : json_decode((string)@file_get_contents($stateFile), true);");
      L.push("$state     = $state ?: ['s' => '', 'v' => []];");
      L.push("$vars      = $state['v'];");
      L.push("$vars['phone']   = $req['MSISDN'] ?? '';");
      L.push("$vars['network'] = $req['NETWORK'] ?? '';");
    }
    L.push('');
    L.push('// ---------- send a reply to the gateway ----------');
    L.push("function respond($message, $end, $screen = '') {");
    if (hub) {
      L.push('    global $sessionId, $vars;');
      L.push('    echo json_encode([');
      L.push("        'SessionId'   => $sessionId,");
      L.push("        'Type'        => $end ? 'Release' : 'Response',");
      L.push("        'Message'     => $message,");
      L.push(`        'Label'       => ${phpStr(flow.name || 'USSD')},`);
      L.push("        'ClientState' => $end ? '' : json_encode(['s' => $screen, 'v' => $vars]),");
      L.push("        'DataType'    => $end ? 'display' : 'input',");
      L.push("        'FieldType'   => 'text',");
      L.push('    ]);');
    } else {
      L.push('    global $req, $input, $vars, $stateFile;');
      L.push("    $end ? @unlink($stateFile) : file_put_contents($stateFile, json_encode(['s' => $screen, 'v' => $vars]));");
      L.push('    echo json_encode([');
      L.push("        'USERID'   => $req['USERID'] ?? '',");
      L.push("        'MSISDN'   => $req['MSISDN'] ?? '',");
      L.push("        'USERDATA' => $input,");
      L.push("        'MSG'      => $message,");
      L.push("        'MSGTYPE'  => !$end,   // true = wait for input, false = end session");
      L.push('    ]);');
    }
    L.push('    exit;');
    L.push('}');
    L.push('');
    L.push('// Replace {{name}} in a message with the saved value');
    L.push('function fill($text) {');
    L.push('    global $vars;');
    L.push("    return preg_replace_callback('/\\{\\{\\s*(\\w+)\\s*\\}\\}/', function ($m) use ($vars) {");
    L.push("        return (string)($vars[$m[1]] ?? '');");
    L.push('    }, $text);');
    L.push('}');
    L.push('');
    L.push('// ---------- screens ----------');
    L.push("function show($screen, $error = '') {");
    L.push('    switch ($screen) {');
    flow.screens.forEach(s => {
      L.push(`        case ${phpStr(s.id)}:   // ${s.type}`);
      L.push(`            $text = ${phpStr(screenText(s))};`);
      L.push(`            $end  = ${s.type === 'end' ? 'true' : 'false'};`);
      L.push('            break;');
    });
    L.push('        default:');
    L.push("            respond('Session error. Please dial again.', true);");
    L.push('    }');
    L.push('    $text = fill($text);');
    L.push("    if ($error !== '') $text = $error . \"\\n\" . $text;");
    L.push('    respond($text, $end, $screen);');
    L.push('}');
    L.push('');
    L.push('// ---------- start of the session ----------');
    if (hub) {
      L.push("if ($type === 'release' || $type === 'timeout') respond('', true);");
      L.push(`if ($type === 'initiation') show(${phpStr(flow.start)});`);
    } else {
      L.push(`if ($isNew) show(${phpStr(flow.start)});`);
    }
    L.push('');
    L.push("// ---------- handle the user's reply on the current screen ----------");
    L.push("switch ($state['s']) {");
    flow.screens.forEach(s => {
      if (s.type === 'end') return;
      L.push(`    case ${phpStr(s.id)}:   // ${s.type}`);
      if (s.type === 'menu') {
        L.push('        switch ($input) {');
        s.options.forEach(o => {
          if (o.key === '') return;
          const save = s.saveAs ? `$vars[${phpStr(s.saveAs)}] = ${phpStr(o.label)}; ` : '';
          L.push(`            case ${phpStr(o.key)}: ${save}show(${phpStr(o.next)});   // ${o.label.replace(/\n/g, ' ').replace(/\?>/g, '? >')}`);
        });
        L.push(`            default: show(${phpStr(s.id)}, 'Invalid option.');`);
        L.push('        }');
      } else {
        const v = inputVar(s);
        L.push(`        if (${phpValidate(s.validate)}) show(${phpStr(s.id)}, ${phpStr(s.error || VALIDATE[s.validate].msg)});`);
        L.push(`        $vars[${phpStr(v)}] = $input;`);
        s.rules.forEach(r => {
          if (!r.next) return;
          L.push(`        if (${phpCond(r.var || v, r.op, r.value)}) show(${phpStr(r.next)});`);
        });
        L.push(`        show(${phpStr(s.next)});`);
      }
    });
    L.push('    default:');
    L.push(`        show(${phpStr(flow.start)});`);
    L.push('}');
    L.push('');
    return L.join('\n');
  }

  /* ================= checks ================= */
  function problems() {
    const out = [];
    const ids = new Set(flow.screens.map(s => s.id));
    flow.screens.forEach(s => {
      if (s.type === 'menu') {
        if (!s.options.length) out.push([s.id, 'menu has no options']);
        const keys = s.options.map(o => o.key);
        if (new Set(keys).size !== keys.length) out.push([s.id, 'two options use the same key']);
        s.options.forEach(o => { if (!o.next || !ids.has(o.next)) out.push([s.id, `option "${o.key}" needs a next screen`]); });
      }
      if (s.type === 'input') {
        if (!s.next || !ids.has(s.next)) out.push([s.id, 'choose the next screen']);
        s.rules.forEach((r, i) => { if (!r.next || !ids.has(r.next)) out.push([s.id, `condition ${i + 1} (under More) needs a next screen`]); });
      }
    });
    return out;
  }

  /* ================= UI ================= */
  const $ = s => document.querySelector(s);
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else if (v !== false && v !== null && v !== undefined) e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  let saveTimer;
  function changed(rerender) {
    clearTimeout(saveTimer); saveTimer = setTimeout(save, 250);
    if (rerender) render();
  }
  /** How a screen is named in the "goes to" lists: name plus the start of its message. */
  function screenLabel(x) {
    let msg = (x.text || '').split('\n')[0].trim();
    if (msg.length > 24) msg = msg.slice(0, 23) + '…';
    return x.id + (msg ? ` — "${msg}"` : ' — (no message yet)') + (x.type === 'end' ? '  · ends' : '');
  }
  /** Dropdown to pick the screen to go to next; last choice creates a new screen. */
  function screenSelect(value, onchange) {
    const s = el('select', { class: 'nx', title: 'The screen the user sees next', onchange: e => {
      if (e.target.value !== '__new__') return onchange(e.target.value);
      const id = uniqueId('new_screen');
      flow.screens.push({ id, type: 'end', text: '', saveAs: '', options: [], rules: [], validate: 'any', error: '', next: '' });
      onchange(id);
      changed(true);
      const card = document.querySelector(`.scr[data-id="${id}"]`);
      if (card) { card.scrollIntoView({ block: 'nearest' }); card.querySelector('textarea').focus(); }
    } },
      el('option', { value: '' }, '— pick the next screen —'),
      flow.screens.map(x => el('option', { value: x.id }, screenLabel(x))),
      el('option', { value: '__new__' }, '+ New screen…'));
    s.value = value || '';
    return s;
  }
  function varInput(value, onchange, placeholder) {
    return el('input', { value: value || '', placeholder: placeholder || 'variable', list: 'bVars', onchange: e => { e.target.value = slug(e.target.value); onchange(e.target.value); } });
  }

  function renameScreen(s, newId) {
    newId = slug(newId);
    if (!newId || newId === s.id) return render();
    if (screen(newId)) { alert(`A screen called "${newId}" already exists.`); return render(); }
    const old = s.id;
    flow.screens.forEach(x => {
      x.options.forEach(o => { if (o.next === old) o.next = newId; });
      x.rules.forEach(r => { if (r.next === old) r.next = newId; });
      if (x.next === old) x.next = newId;
    });
    if (flow.start === old) flow.start = newId;
    s.id = newId;
    changed(true);
  }

  const openMore = new Set();   // screens whose "More" section is open

  function renderScreen(s, i) {
    const isStart = flow.start === s.id;
    const card = el('div', { class: 'scr' + (isStart ? ' start' : ''), 'data-id': s.id });

    // --- header: name, type, delete ---
    const typeSel = el('select', { title: 'Screen type', onchange: e => {
      s.type = e.target.value;
      if (s.type === 'menu' && !s.options.length) s.options.push({ key: '1', label: '', next: '' });
      changed(true);
    } }, el('option', { value: 'menu' }, 'Menu'), el('option', { value: 'input' }, 'Question'), el('option', { value: 'end' }, 'End'));
    typeSel.value = s.type;
    card.append(el('div', { class: 'sh' },
      isStart ? el('span', { class: 'badge go', title: 'Shown first after dialing' }, 'Start') : null,
      el('input', { value: s.id, title: 'Screen name', onchange: e => renameScreen(s, e.target.value) }),
      typeSel,
      el('button', { class: 'btn icon danger', title: 'Delete screen', onclick: () => {
        if (flow.screens.length === 1) return alert('You need at least one screen.');
        if (!confirm(`Delete screen "${s.id}"?`)) return;
        flow.screens.splice(i, 1);
        if (flow.start === s.id) flow.start = flow.screens[0].id;
        changed(true);
      } }, '✕')));

    // --- message ---
    card.append(el('textarea', {
      placeholder: s.type === 'menu' ? 'Message shown above the options' : s.type === 'input' ? 'Question to ask' : 'Last message',
      oninput: e => {
        s.text = e.target.value; changed(false);
        // keep this screen's name in every "goes to" list up to date
        document.querySelectorAll(`#screens select.nx option[value="${s.id}"]`).forEach(o => o.textContent = screenLabel(s));
      },
    }, s.text));

    // --- the basics for each type ---
    if (s.type === 'menu') {
      if (s.options.length) card.append(el('div', { class: 'grid-row opt-row col-h' },
        el('span', {}, 'Press'), el('span', {}, 'Option'), el('span', {}), el('span', {}, 'Goes to screen'), el('span', {})));
      s.options.forEach((o, oi) => {
        card.append(el('div', { class: 'grid-row opt-row' },
          el('input', { value: o.key, placeholder: '#', title: 'What the user types', oninput: e => { o.key = e.target.value.trim(); changed(false); } }),
          el('input', { value: o.label, placeholder: 'Option text', oninput: e => { o.label = e.target.value; changed(false); } }),
          el('span', { class: 'arrow' }, '→'),
          screenSelect(o.next, v => { o.next = v; changed(false); }),
          el('button', { class: 'btn icon', title: 'Remove option', onclick: () => { s.options.splice(oi, 1); changed(true); } }, '✕')));
      });
      const nextKey = String((s.options.filter(o => /^\d+$/.test(o.key) && o.key !== '0').map(o => +o.key).sort((a, b) => b - a)[0] || 0) + 1);
      card.append(el('button', { class: 'btn sm', onclick: () => { s.options.push({ key: nextKey, label: '', next: '' }); changed(true); } }, '+ Option'));
    }
    if (s.type === 'input') {
      card.append(el('div', { class: 'grid-row then-row' },
        el('span', { class: 'lbl' }, s.rules.length ? 'Otherwise go to' : 'Then go to'),
        screenSelect(s.next, x => { s.next = x; changed(false); })));
    }

    // --- everything optional lives behind "More" ---
    const more = el('details', { class: 'more' });
    more.open = openMore.has(s.id);
    more.addEventListener('toggle', () => { if (more.open) openMore.add(s.id); else openMore.delete(s.id); });
    const n = s.type === 'input' ? s.rules.length : 0;
    more.append(el('summary', {}, n ? `More · ${n} condition${n > 1 ? 's' : ''}` : 'More'));

    if (s.type === 'menu') {
      more.append(el('label', {}, 'Remember the chosen option as (then show it in a message with {{name}})'),
        varInput(s.saveAs, v => { s.saveAs = v; changed(true); }, 'not saved'));
    }
    if (s.type === 'input') {
      const v = inputVar(s);
      const valSel = el('select', { onchange: e => { s.validate = e.target.value; changed(true); } },
        Object.keys(VALIDATE).map(k => el('option', { value: k }, VALIDATE[k].label)));
      valSel.value = s.validate;
      more.append(el('div', { class: 'two' },
        el('div', {}, el('label', {}, 'Remember the answer as'), varInput(s.saveAs, x => { s.saveAs = x; changed(true); }, s.id)),
        el('div', {}, el('label', {}, 'Accept'), valSel)));
      more.append(el('label', {}, 'Message for a wrong answer'),
        el('input', { value: s.error, placeholder: VALIDATE[s.validate].msg, oninput: e => { s.error = e.target.value; changed(false); } }));
      more.append(el('label', {}, 'Go somewhere else when… (checked in order)'));
      s.rules.forEach((r, ri) => {
        const opSel = el('select', { onchange: e => { r.op = e.target.value; changed(false); } }, OPS.map(([k, t]) => el('option', { value: k }, t)));
        opSel.value = r.op || '=';
        more.append(el('div', { class: 'grid-row rule-row' },
          varInput(r.var || v, x => { r.var = x; changed(false); }),
          opSel,
          el('input', { value: r.value, placeholder: 'value', oninput: e => { r.value = e.target.value; changed(false); } }),
          el('span', { class: 'arrow' }, '→'),
          screenSelect(r.next, x => { r.next = x; changed(false); }),
          el('button', { class: 'btn icon', title: 'Remove', onclick: () => { s.rules.splice(ri, 1); changed(true); } }, '✕')));
      });
      more.append(el('button', { class: 'btn sm', onclick: () => { s.rules.push({ var: v, op: '=', value: '', next: '' }); openMore.add(s.id); changed(true); } }, '+ Condition'));
    }
    more.append(el('div', { class: 'more-btns' },
      isStart ? null : el('button', { class: 'btn sm', onclick: () => { flow.start = s.id; changed(true); } }, 'Show this first'),
      el('button', { class: 'btn sm', disabled: i === 0, onclick: () => { flow.screens.splice(i - 1, 0, flow.screens.splice(i, 1)[0]); changed(true); } }, 'Move up'),
      el('button', { class: 'btn sm', disabled: i === flow.screens.length - 1, onclick: () => { flow.screens.splice(i + 1, 0, flow.screens.splice(i, 1)[0]); changed(true); } }, 'Move down'),
      el('button', { class: 'btn sm', onclick: () => { const c = clone(s); c.id = uniqueId(s.id + '_copy'); flow.screens.splice(i + 1, 0, c); changed(true); } }, 'Duplicate')));
    card.append(more);

    const issues = problems().filter(p => p[0] === s.id);
    if (issues.length) card.append(el('div', { class: 'warn' }, '⚠ ' + issues.map(p => p[1]).join(' · ')));
    return card;
  }

  function render() {
    const box = $('#screens');
    const scroll = box.scrollTop;
    box.innerHTML = '';
    box.append(el('datalist', { id: 'bVars' }, knownVars().map(v => el('option', { value: v }))));
    box.append(el('div', { class: 'two', style: 'margin-bottom:4px' },
      el('div', {}, el('label', { style: 'margin-top:0' }, 'Service name'),
        el('input', { value: flow.name, placeholder: 'Name of your service', oninput: e => { flow.name = e.target.value; changed(false); } }))));
    flow.screens.forEach((s, i) => box.append(renderScreen(s, i)));
    box.scrollTop = scroll;
  }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function fileName() { return slug(flow.name) || 'ussd'; }

  function init() {
    render();
    $('#bAdd').onclick = () => {
      const id = uniqueId('screen');
      flow.screens.push({ id, type: 'menu', text: '', saveAs: '', options: [{ key: '1', label: '', next: '' }], rules: [], validate: 'any', error: '', next: '' });
      changed(true);
      const box = $('#screens'); box.scrollTop = box.scrollHeight;
      const card = box.querySelector(`[data-id="${id}"] textarea`); if (card) card.focus();
    };
    $('#bReset').onclick = () => { if (confirm('Clear everything and start a new menu? Use File → Save to file first if you want to keep this one.')) { flow = blankFlow(); openMore.clear(); changed(true); } };
    $('#bExport').onclick = () => download(fileName() + '.flow.json', JSON.stringify(flow, null, 2), 'application/json');
    $('#bImport').onclick = () => $('#bFile').click();
    $('#bFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        try { const j = JSON.parse(t); if (!valid(j)) throw new Error('no screens'); flow = normalize(j); changed(true); }
        catch (err) { alert('That file is not a menu builder flow (' + err.message + ').'); }
        e.target.value = '';
      });
    };
    $('#bGen').onclick = () => {
      const p = problems();
      window.openCodeModal('Generated PHP endpoint' + (flow.name ? ' — ' + flow.name : ''), async g => toPhp(g), g => `${fileName()}-${g}.php`,
        p.length ? '⚠ Fix these first: ' + p.map(x => `${x[0]}: ${x[1]}`).join(' · ') : '');
    };
  }

  window.Flow = {
    ENDPOINT: BUILDER_ENDPOINT,
    respond, toPhp, init, render, problems,
    get flow() { return flow; },
    set flow(f) { flow = normalize(clone(f)); save(); render(); },
    blank: blankFlow,
  };
})();
