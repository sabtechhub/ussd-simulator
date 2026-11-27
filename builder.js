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
    email:  { label: 'Email address',       msg: 'Please enter a valid email address.' },
    text:   { label: 'Text (no digits)',    msg: 'Please enter text without numbers.' },
  };
  // [key, label shown to the user, group, needs no value]
  const OPS = [
    ['=', 'equals', 'Compare'], ['!=', 'not equal', 'Compare'],
    ['>', 'greater than', 'Compare'], ['<', 'less than', 'Compare'],
    ['>=', 'at least (≥)', 'Compare'], ['<=', 'at most (≤)', 'Compare'],
    ['between', 'is between', 'Compare'], ['one_of', 'is one of', 'Compare'], ['not_one_of', 'is not one of', 'Compare'],
    ['contains', 'contains', 'Text'], ['not_contains', 'does not contain', 'Text'],
    ['starts', 'starts with', 'Text'], ['ends', 'ends with', 'Text'],
    ['is_number', 'is a number', 'Type', true], ['is_int', 'is a whole number', 'Type', true],
    ['is_text', 'is text (not a number)', 'Type', true], ['is_email', 'is an email', 'Type', true],
    ['is_phone', 'is a phone number', 'Type', true],
    ['is_empty', 'is empty', 'Type', true], ['not_empty', 'is not empty', 'Type', true],
    ['len_eq', 'length is', 'Length'], ['len_gte', 'length at least', 'Length'], ['len_lte', 'length at most', 'Length'],
  ];
  const OP_HINT = { between: 'e.g. 1,100', one_of: 'e.g. 1,2,3', not_one_of: 'e.g. 0,9', len_eq: 'e.g. 4', len_gte: 'e.g. 3', len_lte: 'e.g. 10' };
  const isUnary = op => !!(OPS.find(x => x[0] === op) || [])[3];
  const opLabel = op => (OPS.find(x => x[0] === op) || ['', op])[1];
  const RX = { number: /^-?\d+(\.\d+)?$/, int: /^-?\d+$/, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, phone: /^(\+?233|0)\d{9}$/ };
  const listOf = v => String(v).split(',').map(x => x.trim()).filter(x => x !== '');
  // conditions whose value may contain {{name}}, e.g. "to equals {{phone}}"
  const VALUE_FILL = OPS.filter(x => !x[3]).map(x => x[0]);   // every check that takes a value

  /** A new menu: one empty start screen. */
  function blankFlow() {
    return { name: "", start: "main", screens: [
      { id: "main", type: "menu", text: "", saveAs: "", options: [{ key: "1", label: "", next: "" }], rules: [], validate: "any", error: "", next: "", sets: [] },
    ] };
  }
  /** Menus saved by an older version that only held the built-in vote example are replaced by a blank menu. */
  function isOldExample(f) { return f && f.name === "Demo Vote" && Array.isArray(f.screens) && f.screens.some(s => s.id === "votes"); }

  /* ================= model ================= */
  let flow = load();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    try { const f = JSON.parse(localStorage.getItem(STORE_KEY)); if (valid(f) && !isOldExample(f)) return normalize(f); } catch (e) {}
    return normalize(blankFlow());
  }
  let lastSaved = null;
  /** Keeps the menu in this browser. Returns false if the browser refused (private mode, storage full). */
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(flow)); lastSaved = new Date(); showSaveState('saved'); return true; }
    catch (e) { showSaveState('error'); return false; }
  }
  function showSaveState(state) {
    const el2 = document.getElementById('saveState'); if (!el2) return;
    el2.className = 'save-state ' + state;
    el2.textContent = state === 'saving' ? 'Saving…' : state === 'error' ? 'Not saved: this browser blocked storage'
      : 'Saved' + (lastSaved ? ' ' + lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
  }
  /** The Save button and Ctrl+S. */
  function saveNow() {
    clearTimeout(saveTimer);
    if (save()) window.toast && window.toast('Menu saved in this browser. Use File → Save to file to keep a copy.', 'save');
    else window.tell && window.tell({ title: "Couldn't save", message: 'This browser is blocking storage (for example a private window). Use File → Save to file to keep your menu.' });
  }
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
      s.sets = Array.isArray(s.sets) ? s.sets.filter(x => x && typeof x === 'object').map(x => ({ name: slug(x.name || ''), value: String(x.value ?? '') })) : [];
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
    flow.screens.forEach(s => { if (s.type === 'input') v.add(inputVar(s)); if (s.type === 'menu' && s.saveAs) v.add(s.saveAs); (s.sets || []).forEach(x => x.name && v.add(x.name)); });
    return [...v];
  }

  /** Text the phone shows for a screen (menu options are added as numbered lines). */
  function screenText(s) {
    if (s.type !== 'menu') return s.text;
    const lines = s.options.filter(o => o.key !== '' || o.label !== '').map(o => `${o.key}. ${o.label}`);
    return [s.text, ...lines].filter(x => x !== '').join('\n');
  }

  /** Every variable a message can use, and where it comes from. */
  function variables() {
    const out = [{ name: 'phone', from: "Caller's phone number (always there)" }, { name: 'network', from: "Caller's network (always there)" }];
    const seen = new Set(['phone', 'network']);
    const add = (name, from) => { if (name && !seen.has(name)) { seen.add(name); out.push({ name, from }); } };
    flow.screens.forEach(s => {
      if (s.type === 'input') add(inputVar(s), `Answer typed on "${s.id}"`);
      if (s.type === 'menu' && s.saveAs) add(s.saveAs, `Option chosen on "${s.id}"`);
      (s.sets || []).forEach(x => add(x.name, `Set on "${s.id}"`));
    });
    return out;
  }

  /* ================= runner (used by the simulator) ================= */
  /**
   * Simple maths for values that start with =, e.g. "={{price}} * {{qty}}".
   * Only numbers, + - * / and brackets; anything else is kept as text.
   * The generated PHP has the same calc() so both give the same answer.
   */
  function calc(expr) {
    const s = String(expr).replace(/\s+/g, '');
    if (!/^[0-9+\-*\/().]+$/.test(s)) return String(expr);
    let i = 0;
    const num = () => {
      if (s[i] === '(') { i++; const v = add(); i++; return v; }
      if (s[i] === '-') { i++; return -num(); }
      const j = i; while (i < s.length && /[0-9.]/.test(s[i])) i++;
      const t = s.slice(j, i); return t === '' ? 0 : parseFloat(t);
    };
    const mul = () => { let v = num(); while (s[i] === '*' || s[i] === '/') { const op = s[i++], r = num(); v = op === '*' ? v * r : (r == 0 ? 0 : v / r); } return v; };
    const add = () => { let v = mul(); while (s[i] === '+' || s[i] === '-') { const op = s[i++], r = mul(); v = op === '+' ? v + r : v - r; } return v; };
    const v = add();
    if (i !== s.length || !isFinite(v)) return '0';
    return String(Math.round(v * 100) / 100);
  }
  /** Value of a "set" row: text with {{name}} filled in, or maths when it starts with =. */
  function setValue(value, vars) {
    const v = String(value);
    return v.trim().startsWith('=') ? calc(fill(v.trim().slice(1), vars)) : fill(v, vars);
  }
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
      case 'not_contains': return a.indexOf(b) === -1;
      case 'starts': return a.startsWith(b);
      case 'ends': return a.endsWith(b);
      case 'between': { const [lo, hi] = String(b).split(',').map(x => parseFloat(x) || 0); return isNum(a) && parseFloat(a) >= (lo || 0) && parseFloat(a) <= (hi || 0); }
      case 'one_of': return listOf(b).includes(a);
      case 'not_one_of': return !listOf(b).includes(a);
      case 'is_number': return RX.number.test(a);
      case 'is_int': return RX.int.test(a);
      case 'is_text': return a !== '' && !RX.number.test(a);
      case 'is_email': return RX.email.test(a);
      case 'is_phone': return RX.phone.test(a);
      case 'is_empty': return a.trim() === '';
      case 'not_empty': return a.trim() !== '';
      case 'len_eq': return [...a].length === (parseInt(b, 10) || 0);
      case 'len_gte': return [...a].length >= (parseInt(b, 10) || 0);
      case 'len_lte': return [...a].length <= (parseInt(b, 10) || 0);
    }
    return false;
  }
  function validInput(rule, v) {
    switch (rule) {
      case 'number': return isNum(v) && /^-?\d+(\.\d+)?$/.test(v);
      case 'pin': return /^\d{4}$/.test(v);
      case 'phone': return RX.phone.test(v);
      case 'email': return RX.email.test(v);
      case 'text': return v !== '' && !/\d/.test(v);
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
      (s.sets || []).forEach(x => { if (x.name) st.v[x.name] = setValue(x.value, st.v); });   // set values when the screen opens
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
      const val = VALUE_FILL.includes(r.op) ? fill(String(r.value ?? ''), st.v) : r.value;
      if (r.next && compare(st.v[r.var || inputVar(cur)], r.op, val)) return show(r.next);
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
    const s = `(string)(${a})`, v = String(value ?? '');
    if (VALUE_FILL.includes(op) && /\{\{\s*\w+\s*\}\}/.test(v)) {   // value uses {{name}}: compare with the filled-in text
      const f = `fill(${phpStr(v)})`;
      switch (op) {
        case 'contains': return `strpos(${s}, ${f}) !== false`;
        case 'not_contains': return `strpos(${s}, ${f}) === false`;
        case 'starts': return `strncmp(${s}, ${f}, strlen(${f})) === 0`;
        case 'ends': return `(${f} === '' || substr(${s}, -strlen(${f})) === ${f})`;
        case 'between': return `is_numeric(${s}) && (float)${s} >= (float)(explode(',', ${f})[0]) && (float)${s} <= (float)(explode(',', ${f})[1] ?? 0)`;
        case 'one_of': return `in_array(${s}, array_filter(array_map('trim', explode(',', ${f})), 'strlen'), true)`;
        case 'not_one_of': return `!in_array(${s}, array_filter(array_map('trim', explode(',', ${f})), 'strlen'), true)`;
        case 'len_eq': return `preg_match_all('/./us', ${s}) === (int)${f}`;
        case 'len_gte': return `preg_match_all('/./us', ${s}) >= (int)${f}`;
        case 'len_lte': return `preg_match_all('/./us', ${s}) <= (int)${f}`;
        default: return `(${a}) ${op === '=' ? '==' : op} ${f}`;
      }
    }
    const list = '[' + listOf(v).map(phpStr).join(', ') + ']';
    const n = parseInt(v, 10) || 0;
    const len = `preg_match_all('/./us', ${s})`;   // number of characters
    switch (op) {
      case 'contains': return `strpos(${s}, ${phpStr(v)}) !== false`;
      case 'not_contains': return `strpos(${s}, ${phpStr(v)}) === false`;
      case 'starts': return v === '' ? 'true' : `strncmp(${s}, ${phpStr(v)}, ${phpStr(v)} === '' ? 0 : strlen(${phpStr(v)})) === 0`;
      case 'ends': return v === '' ? 'true' : `substr(${s}, -strlen(${phpStr(v)})) === ${phpStr(v)}`;
      case 'between': { const [lo, hi] = v.split(',').map(x => parseFloat(x) || 0); return `is_numeric(${s}) && (float)${s} >= ${lo || 0} && (float)${s} <= ${hi || 0}`; }
      case 'one_of': return `in_array(${s}, ${list}, true)`;
      case 'not_one_of': return `!in_array(${s}, ${list}, true)`;
      case 'is_number': return `preg_match('/^-?\\d+(\\.\\d+)?$/', ${s})`;
      case 'is_int': return `preg_match('/^-?\\d+$/', ${s})`;
      case 'is_text': return `${s} !== '' && !preg_match('/^-?\\d+(\\.\\d+)?$/', ${s})`;
      case 'is_email': return `preg_match('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/', ${s})`;
      case 'is_phone': return `preg_match('/^(\\+?233|0)\\d{9}$/', ${s})`;
      case 'is_empty': return `trim(${s}) === ''`;
      case 'not_empty': return `trim(${s}) !== ''`;
      case 'len_eq': return `${len} === ${n}`;
      case 'len_gte': return `${len} >= ${n}`;
      case 'len_lte': return `${len} <= ${n}`;
    }
    const phpOp = op === '=' ? '==' : op;
    return `(${a}) ${phpOp} ${phpVal(value)}`;
  }
  function phpValidate(rule) {
    switch (rule) {
      case 'number': return `!preg_match('/^-?\\d+(\\.\\d+)?$/', $input)`;
      case 'pin': return `!preg_match('/^\\d{4}$/', $input)`;
      case 'phone': return `!preg_match('/^(\\+?233|0)\\d{9}$/', $input)`;
      case 'email': return `!preg_match('/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/', $input)`;
      case 'text': return `$input === '' || preg_match('/\\d/', $input)`;
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
    const usesCalc = flow.screens.some(s => (s.sets || []).some(x => x.name && x.value.trim().startsWith('=')));
    if (usesCalc) {
      L.push('// Work out simple maths like "5*2+1" (numbers, + - * / and brackets)');
      L.push('function calc($expr) {');
      L.push("    $s = preg_replace('/\\s+/', '', (string)$expr);");
      L.push("    if (!preg_match('/^[0-9+\\-*\\/().]+$/', $s)) return (string)$expr;");
      L.push('    $n = strlen($s); $i = 0; $num = $mul = $add = null;');
      L.push('    $num = function () use ($s, $n, &$i, &$add, &$num) {');
      L.push("        if ($i < $n && $s[$i] === '(') { $i++; $v = $add(); $i++; return $v; }");
      L.push("        if ($i < $n && $s[$i] === '-') { $i++; return -$num(); }");
      L.push("        $j = $i; while ($i < $n && strpos('0123456789.', $s[$i]) !== false) $i++;");
      L.push('        return (float)substr($s, $j, $i - $j);');
      L.push('    };');
      L.push('    $mul = function () use ($s, $n, &$i, &$num) {');
      L.push('        $v = $num();');
      L.push("        while ($i < $n && ($s[$i] === '*' || $s[$i] === '/')) { $op = $s[$i++]; $r = $num(); $v = $op === '*' ? $v * $r : ($r == 0 ? 0 : $v / $r); }");
      L.push('        return $v;');
      L.push('    };');
      L.push('    $add = function () use ($s, $n, &$i, &$mul) {');
      L.push('        $v = $mul();');
      L.push("        while ($i < $n && ($s[$i] === '+' || $s[$i] === '-')) { $op = $s[$i++]; $r = $mul(); $v = $op === '+' ? $v + $r : $v - $r; }");
      L.push('        return $v;');
      L.push('    };');
      L.push('    $v = $add();');
      L.push("    if ($i !== $n || !is_finite($v)) return '0';");
      L.push('    return (string)round($v, 2);');
      L.push('}');
      L.push('');
    }
    L.push('// ---------- screens ----------');
    L.push("function show($screen, $error = '') {");
    L.push('    global $vars;');
    L.push('    switch ($screen) {');
    flow.screens.forEach(s => {
      L.push(`        case ${phpStr(s.id)}:   // ${s.type}`);
      (s.sets || []).forEach(x => {
        if (!x.name) return;
        const v = x.value.trim();
        L.push(v.startsWith('=')
          ? `            $vars[${phpStr(x.name)}] = calc(fill(${phpStr(v.slice(1))}));`
          : `            $vars[${phpStr(x.name)}] = fill(${phpStr(x.value)});`);
      });
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
      (s.sets || []).forEach((x, i) => { if (!x.name) out.push([s.id, `set value ${i + 1} (under More) needs a name`]); });
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
      else if (k === 'title') e.dataset.tip = v;   // styled tooltip instead of the browser one
      else if (v !== false && v !== null && v !== undefined) e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  let saveTimer;
  function changed(rerender) {
    clearTimeout(saveTimer); showSaveState('saving'); saveTimer = setTimeout(save, 400);
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
      flow.screens.push({ id, type: 'end', text: '', saveAs: '', options: [], rules: [], validate: 'any', error: '', next: '', sets: [] });
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
    if (screen(newId)) { tell({ title: 'Name already used', message: `There is already a screen called "${newId}". Pick another name.` }); return render(); }
    const old = s.id;
    flow.screens.forEach(x => {
      (x.options || []).forEach(o => { if (o.next === old) o.next = newId; });
      (x.rules || []).forEach(r => { if (r.next === old) r.next = newId; });
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
      el('button', { class: 'btn icon danger', title: 'Delete screen', onclick: async () => {
        if (flow.screens.length === 1) return tell({ title: "Can't delete the last screen", message: 'A menu needs at least one screen.' });
        if (!await ask({ title: `Delete "${s.id}"?`, message: 'Options and conditions that lead to this screen will need a new next screen.', ok: 'Delete', danger: true })) return;
        flow.screens.splice(i, 1);
        if (flow.start === s.id) flow.start = flow.screens[0].id;
        changed(true);
      } }, iconEl('trash'))));

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
          el('button', { class: 'btn icon', title: 'Remove option', onclick: () => { s.options.splice(oi, 1); changed(true); } }, iconEl('x'))));
      });
      const nextKey = String((s.options.filter(o => /^\d+$/.test(o.key) && o.key !== '0').map(o => +o.key).sort((a, b) => b - a)[0] || 0) + 1);
      card.append(el('button', { class: 'btn sm', onclick: () => { s.options.push({ key: nextKey, label: '', next: '' }); changed(true); } }, iconEl('plus', 14), 'Option'));
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
    const n = s.type === 'input' ? s.rules.length : 0, m = (s.sets || []).length;
    const bits = [n ? `${n} condition${n > 1 ? 's' : ''}` : '', m ? `${m} value${m > 1 ? 's' : ''} set` : ''].filter(Boolean);
    more.append(el('summary', {}, ['More', ...bits].join(' · ')));

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
        const groups = [...new Set(OPS.map(x => x[2]))];
        const opSel = el('select', { title: 'How to check the value', onchange: e => { r.op = e.target.value; changed(true); } },
          groups.map(g => el('optgroup', { label: g }, OPS.filter(x => x[2] === g).map(([k, t]) => el('option', { value: k }, t)))));
        opSel.value = r.op || '=';
        more.append(el('div', { class: 'grid-row rule-row' },
          varInput(r.var || v, x => { r.var = x; changed(false); }),
          opSel,
          el('input', { value: r.value, placeholder: OP_HINT[r.op] || 'value or {{name}}', list: 'bValVars', class: isUnary(r.op) ? 'no-value' : '', title: isUnary(r.op) ? 'Not needed for this check' : 'Type a value, or pick a saved value like {{amount}} to compare with' + (OP_HINT[r.op] ? ' (separate values with commas)' : ''), disabled: isUnary(r.op), oninput: e => { r.value = e.target.value; changed(false); } }),
          el('span', { class: 'arrow' }, '→'),
          screenSelect(r.next, x => { r.next = x; changed(false); }),
          el('button', { class: 'btn icon', title: 'Remove condition', onclick: () => { s.rules.splice(ri, 1); changed(true); } }, iconEl('x'))));
      });
      more.append(el('button', { class: 'btn sm', onclick: () => { s.rules.push({ var: v, op: '=', value: '', next: '' }); openMore.add(s.id); changed(true); } }, iconEl('plus', 14), 'Condition'));
    }
    more.append(el('label', {}, 'Set values when this screen opens'),
      el('div', { class: 'set-help' }, 'Show them later with {{name}}. Start a value with = to calculate, e.g. ={{price}} * {{qty}}'));
    (s.sets = s.sets || []).forEach((x, xi) => {
      more.append(el('div', { class: 'grid-row set-row' },
        varInput(x.name, v => { x.name = v; changed(true); }, 'name'),
        el('span', { class: 'arrow' }, '='),
        el('input', { value: x.value, placeholder: 'value, e.g. 5 or {{answer}}', oninput: e => { x.value = e.target.value; changed(false); } }),
        el('button', { class: 'btn icon', title: 'Remove this value', onclick: () => { s.sets.splice(xi, 1); changed(true); } }, iconEl('x'))));
    });
    more.append(el('button', { class: 'btn sm', onclick: () => { s.sets.push({ name: '', value: '' }); openMore.add(s.id); changed(true); } }, iconEl('plus', 14), 'Set value'));
    more.append(el('div', { class: 'more-btns' },
      isStart ? null : el('button', { class: 'btn sm', onclick: () => { flow.start = s.id; changed(true); } }, 'Show this first'),
      el('button', { class: 'btn sm', disabled: i === 0, onclick: () => { flow.screens.splice(i - 1, 0, flow.screens.splice(i, 1)[0]); changed(true); } }, 'Move up'),
      el('button', { class: 'btn sm', disabled: i === flow.screens.length - 1, onclick: () => { flow.screens.splice(i + 1, 0, flow.screens.splice(i, 1)[0]); changed(true); } }, 'Move down'),
      el('button', { class: 'btn sm', onclick: () => { const c = clone(s); c.id = uniqueId(s.id + '_copy'); flow.screens.splice(i + 1, 0, c); changed(true); } }, 'Duplicate')));
    card.append(more);

    const issues = problems().filter(p => p[0] === s.id);
    if (issues.length) card.append(el('div', { class: 'warn' }, iconEl('alert', 14), issues.map(p => p[1]).join(' · ')));
    return card;
  }

  /* ================= map view: draggable boxes + arrows ================= */
  let view = 'list';
  try { view = localStorage.getItem('ussdsim_bview') === 'map' ? 'map' : 'list'; } catch (e) {}
  const NODE_W = 230;

  function render() {
    $('#screens').hidden = view !== 'list';
    $('#bmap').hidden = view !== 'map';
    document.querySelectorAll('#bView button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    if (view === 'map') renderMap(); else renderList();
  }
  function setView(v) {
    view = v; try { localStorage.setItem('ussdsim_bview', v); } catch (e) {}
    render();
  }

  /** Places screens that have no position yet, column by column from the start screen. */
  function autoLayout(all) {
    const level = {}, order = [];
    const q = [flow.start]; level[flow.start] = 0;
    while (q.length) {
      const id = q.shift(), s = screen(id); if (!s) continue; order.push(id);
      links(s).forEach(l => { if (l.to && screen(l.to) && level[l.to] === undefined) { level[l.to] = level[id] + 1; q.push(l.to); } });
    }
    const maxL = Math.max(0, ...Object.values(level));
    flow.screens.forEach(s => { if (level[s.id] === undefined) { level[s.id] = maxL + 1; order.push(s.id); } });
    const colY = {};
    order.forEach(id => {
      const s = screen(id), L = level[id];
      const h = 78 + (s.type === 'menu' ? s.options.length * 26 : s.type === 'input' ? (1 + s.rules.length) * 26 : 0);
      colY[L] = colY[L] || 30;
      if (all || typeof s.x !== 'number' || typeof s.y !== 'number') { s.x = 30 + L * (NODE_W + 70); s.y = colY[L]; }
      colY[L] += h + 28;
    });
  }

  /** Every arrow leaving a screen: [{label, to, set(newId)}]. */
  function links(s) {
    if (s.type === 'menu') return s.options.map(o => ({ label: `${o.key}. ${o.label || '…'}`, to: o.next, set: v => { o.next = v; } }));
    if (s.type === 'input') return [
      ...s.rules.map(r => ({ label: `if ${r.var || inputVar(s)} ${opLabel(r.op)}${isUnary(r.op) ? '' : ' ' + r.value}`, to: r.next, set: v => { r.next = v; }, rule: true })),
      { label: s.rules.length ? 'otherwise' : 'then', to: s.next, set: v => { s.next = v; } },
    ];
    return [];
  }

  function renderMap() {
    const wrap = $('#bmap');
    const keep = wrap.querySelector('.map-scroll');
    const sl = keep ? keep.scrollLeft : 0, st = keep ? keep.scrollTop : 0;
    if (flow.screens.some(s => typeof s.x !== 'number' || typeof s.y !== 'number')) { autoLayout(false); save(); }
    wrap.innerHTML = '';

    const scroller = el('div', { class: 'map-scroll' });
    const canvas = el('div', { class: 'map-canvas' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map-lines');
    svg.innerHTML = '<defs><marker id="mArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>';
    canvas.append(svg);

    flow.screens.forEach(s => canvas.append(renderNode(s)));
    scroller.append(canvas);
    scroller.addEventListener('contextmenu', e => mapContextMenu(e, canvas));
    scroller.addEventListener('pointerdown', e => { if (!e.target.closest('.node')) { selectedId = null; canvas.querySelectorAll('.node.sel').forEach(n => n.classList.remove('sel')); } });
    wrap.append(scroller);
    wrap.append(el('div', { class: 'map-help' }, 'Type straight into a box to change its name, message or options. Drag a box by its top bar to move it. Drag from a dot onto a box to link them, or onto empty space for a new screen. Right-click a box, an arrow or empty space for more.'));
    sizeCanvas(canvas);
    drawLines(canvas);
    scroller.scrollLeft = sl; scroller.scrollTop = st;
  }

  /** A box on the map. Name, type, message and menu options can be edited right here. */
  function renderNode(s) {
    const isStart = flow.start === s.id;
    // after typing, redraw the arrows (the box may have grown) and save
    const edited = () => { changed(false); const c = document.querySelector('#bmap .map-canvas'); if (c) { sizeCanvas(c); drawLines(c); } };
    const grow = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };

    const typeSel = el('select', { class: 'node-typesel', title: 'Screen type', onchange: e => {
      s.type = e.target.value;
      if (s.type === 'menu' && !s.options.length) s.options.push({ key: '1', label: '', next: '' });
      changed(true);
    } }, el('option', { value: 'menu' }, 'Menu'), el('option', { value: 'input' }, 'Question'), el('option', { value: 'end' }, 'End'));
    typeSel.value = s.type;

    const msg = el('textarea', { class: 'node-msg-in', rows: 1, placeholder: s.type === 'menu' ? 'Message above the options' : s.type === 'input' ? 'Question to ask' : 'Last message',
      oninput: e => { s.text = e.target.value; grow(e.target); edited(); } }, s.text);

    const rows = s.type === 'menu'
      ? s.options.map((o, oi) => el('div', { class: 'node-link opt' },
          el('input', { class: 'nk', value: o.key, title: 'What the user types', oninput: e => { o.key = e.target.value.trim(); edited(); } }),
          el('input', { class: 'nl', value: o.label, placeholder: 'Option text', oninput: e => { o.label = e.target.value; edited(); } }),
          el('button', { class: 'nx-del', type: 'button', title: 'Remove this option', onclick: () => { s.options.splice(oi, 1); changed(true); } }, iconEl('x', 12)),
          el('span', { class: 'port' + (o.next ? ' linked' : ''), 'data-link': oi, title: 'Drag onto a screen to link' })))
      : links(s).map((l, li) => el('div', { class: 'node-link' + (l.rule ? ' rule' : '') },
          el('span', {}, l.label),
          el('span', { class: 'port' + (l.to ? ' linked' : ''), 'data-link': li, title: 'Drag onto a screen to link' })));

    const node = el('div', { class: `node t-${s.type}` + (isStart ? ' start' : '') + (selectedId === s.id ? ' sel' : ''), 'data-id': s.id, style: `left:${s.x}px;top:${s.y}px;width:${NODE_W}px` },
      el('div', { class: 'node-h', title: 'Drag here to move the box' },
        el('span', { class: 'grip' }, iconEl('grip', 14)),
        isStart ? el('span', { class: 'badge go' }, 'Start') : null,
        el('input', { class: 'node-name', value: s.id, title: 'Screen name', onchange: e => renameScreen(s, e.target.value), onkeydown: e => { if (e.key === 'Enter') e.target.blur(); } }),
        typeSel),
      msg,
      (s.sets || []).filter(x => x.name).map(x => el('div', { class: 'node-set', title: 'Set when this screen opens (double-click the header to edit)' }, iconEl('variable', 12), `${x.name} = ${x.value}`)),
      rows,
      s.type === 'menu' ? el('button', { class: 'node-add', type: 'button', onclick: () => {
        const nextKey = String((s.options.filter(o => /^\d+$/.test(o.key) && o.key !== '0').map(o => +o.key).sort((a, b) => b - a)[0] || 0) + 1);
        s.options.push({ key: nextKey, label: '', next: '' }); changed(true);
        setTimeout(() => { const n = document.querySelector(`#bmap .node[data-id="${s.id}"] .opt:last-of-type .nl`); if (n) n.focus(); });
      } }, iconEl('plus', 12), 'Option') : null,
      s.type === 'input' ? el('button', { class: 'node-add', type: 'button', title: 'Answer checks, conditions and set values', onclick: () => editInList(s.id) }, iconEl('settings', 12), 'Conditions & more') : null,
      s.type === 'end' ? el('div', { class: 'node-end' }, 'Session ends') : null);
    node.addEventListener('pointerdown', e => startDrag(e, s, node));
    node.querySelector('.node-h').addEventListener('dblclick', e => { if (!e.target.closest('input,select')) editInList(s.id); });
    setTimeout(() => grow(msg));
    return node;
  }
  function sizeCanvas(canvas) {
    let w = 0, h = 0;
    canvas.querySelectorAll('.node').forEach(n => { w = Math.max(w, n.offsetLeft + n.offsetWidth); h = Math.max(h, n.offsetTop + n.offsetHeight); });
    canvas.style.width = (w + 260) + 'px';
    canvas.style.height = (h + 200) + 'px';
  }

  function center(elm, canvas) {
    const r = elm.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, r: { l: r.left - c.left, t: r.top - c.top, w: r.width, h: r.height } };
  }
  function curve(x1, y1, x2, y2) {
    const dx = Math.max(40, Math.abs(x2 - x1) / 2);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }
  function drawLines(canvas) {
    const svg = canvas.querySelector('.map-lines');
    svg.querySelectorAll('path.ln').forEach(p => p.remove());
    svg.setAttribute('width', canvas.offsetWidth); svg.setAttribute('height', canvas.offsetHeight);
    flow.screens.forEach(s => {
      const node = canvas.querySelector(`.node[data-id="${s.id}"]`); if (!node) return;
      links(s).forEach((l, i) => {
        if (!l.to) return;
        const target = canvas.querySelector(`.node[data-id="${l.to}"]`); if (!target) return;
        const a = center(node.querySelector(`.port[data-link="${i}"]`), canvas);
        const t = center(target.querySelector('.node-h'), canvas);
        // arrive on the left side of the target box (or the right side if it is behind us)
        const back = t.r.l + t.r.w / 2 < a.x;
        const x2 = back ? t.r.l + t.r.w + 2 : t.r.l - 2;
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', back ? `M${a.x},${a.y} C${a.x + 60},${a.y} ${x2 + 60},${t.y} ${x2},${t.y}` : curve(a.x, a.y, x2, t.y));
        p.setAttribute('class', 'ln' + (l.rule ? ' rule' : ''));
        p.setAttribute('marker-end', 'url(#mArrow)');
        // a wide invisible copy of the arrow makes it easy to hover and right-click
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hit.setAttribute('d', p.getAttribute('d')); hit.setAttribute('class', 'ln hit');
        hit.dataset.from = s.id; hit.dataset.link = i;
        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title'); tip.textContent = `${l.label} → ${l.to} (right-click to remove)`; hit.append(tip);
        svg.append(p, hit);
      });
    });
  }

  /* --- dragging boxes, and dragging from a dot to link --- */
  function startDrag(e, s, node) {
    if (e.button !== 0) return;
    const canvas = node.parentElement;
    const port = e.target.closest('.port');
    if (!port && e.target.closest('input, textarea, select, button')) {   // clicking a field: select the box, let the user type
      selectedId = s.id; canvas.querySelectorAll('.node.sel').forEach(n => n.classList.remove('sel')); node.classList.add('sel');
      return;
    }
    e.preventDefault();
    if (document.activeElement && node.contains(document.activeElement)) document.activeElement.blur();
    if (port) return startLink(e, s, +port.dataset.link, port, canvas);
    selectedId = s.id; canvas.querySelectorAll('.node.sel').forEach(n => n.classList.remove('sel')); node.classList.add('sel');
    const sx = e.clientX, sy = e.clientY, ox = s.x, oy = s.y;
    let moved = false;
    node.setPointerCapture(e.pointerId);
    node.classList.add('dragging');
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      s.x = Math.max(0, Math.round(ox + dx)); s.y = Math.max(0, Math.round(oy + dy));
      node.style.left = s.x + 'px'; node.style.top = s.y + 'px';
      drawLines(canvas);
    };
    const up = () => {
      node.removeEventListener('pointermove', move); node.removeEventListener('pointerup', up);
      node.classList.remove('dragging');
      if (moved) { sizeCanvas(canvas); drawLines(canvas); changed(false); }
    };
    node.addEventListener('pointermove', move); node.addEventListener('pointerup', up);
  }

  function startLink(e, s, idx, port, canvas) {
    const svg = canvas.querySelector('.map-lines');
    const a = center(port, canvas);
    const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tmp.setAttribute('class', 'ln temp'); tmp.setAttribute('marker-end', 'url(#mArrow)');
    svg.append(tmp);
    port.setPointerCapture(e.pointerId);
    let hover = null;
    const pos = ev => { const c = canvas.getBoundingClientRect(); return { x: ev.clientX - c.left, y: ev.clientY - c.top }; };
    const move = ev => {
      const p = pos(ev);
      tmp.setAttribute('d', curve(a.x, a.y, p.x, p.y));
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const n = under && under.closest('.node');
      if (hover && hover !== n) hover.classList.remove('drop');
      hover = n && n.dataset.id !== s.id ? n : null;
      if (hover) hover.classList.add('drop');
    };
    const up = ev => {
      port.removeEventListener('pointermove', move); port.removeEventListener('pointerup', up);
      tmp.remove();
      if (hover) hover.classList.remove('drop');
      const link = links(s)[idx];
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const n = under && under.closest('.node');
      if (n && n.dataset.id !== s.id) { link.set(n.dataset.id); changed(true); return; }
      if (!under || !under.closest('#bmap')) return;           // dropped outside the map: no change
      if (n) return;                                           // dropped on its own box: no change
      // dropped on empty space: make a new screen there and link to it
      const p = pos(ev), id = uniqueId('new_screen');
      flow.screens.push({ id, type: 'end', text: '', saveAs: '', options: [], rules: [], validate: 'any', error: '', next: '', sets: [], x: Math.max(0, Math.round(p.x - 20)), y: Math.max(0, Math.round(p.y - 20)) });
      link.set(id);
      changed(true);
    };
    port.addEventListener('pointermove', move); port.addEventListener('pointerup', up);
  }

  /* --- right-click menu on the map --- */
  let selectedId = null;   // box picked with a click; the Delete key removes it

  function closeCtx() { const m = document.querySelector('.ctx'); if (m) m.remove(); }
  function openCtx(x, y, items) {
    closeCtx();
    const m = el('div', { class: 'ctx', role: 'menu' },
      items.map(it => it === '-' ? el('div', { class: 'ctx-sep' }) :
        el('button', { type: 'button', role: 'menuitem', class: it.danger ? 'danger' : '', onclick: () => { closeCtx(); it.run(); } }, it.label)));
    document.body.append(m);
    // keep the menu inside the window
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
    m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
  }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.ctx')) closeCtx(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCtx();
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && view === 'map' && selectedId && screen(selectedId) && !$('#bmap').closest('[hidden]')) {
      e.preventDefault(); deleteScreen(selectedId);
    }
  });
  window.addEventListener('scroll', closeCtx, true);

  async function deleteScreen(id) {
    if (flow.screens.length === 1) return tell({ title: "Can't delete the last screen", message: 'A menu needs at least one screen.' });
    if (!await ask({ title: `Delete "${id}"?`, message: 'Arrows pointing to it will be removed too.', ok: 'Delete', danger: true })) return;
    flow.screens = flow.screens.filter(s => s.id !== id);
    flow.screens.forEach(s => links(s).forEach(l => { if (l.to === id) l.set(''); }));
    if (flow.start === id) flow.start = flow.screens[0].id;
    if (selectedId === id) selectedId = null;
    changed(true);
  }
  function addScreenAt(type, x, y) {
    const id = uniqueId(type === 'input' ? 'question' : type === 'end' ? 'end' : 'menu');
    flow.screens.push({ id, type, text: '', saveAs: '', options: type === 'menu' ? [{ key: '1', label: '', next: '' }] : [], rules: [], validate: 'any', error: '', next: '', sets: [], x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)) });
    selectedId = id;
    changed(true);
  }

  function mapContextMenu(e, canvas) {
    e.preventDefault();
    const c = canvas.getBoundingClientRect(), px = e.clientX - c.left, py = e.clientY - c.top;
    const hit = e.target.closest('path.hit');
    const node = e.target.closest('.node');
    if (hit) {
      const s = screen(hit.dataset.from), l = s && links(s)[+hit.dataset.link];
      if (!l) return;
      return openCtx(e.clientX, e.clientY, [
        { label: `Remove link "${l.label}" → ${l.to}`, danger: true, run: () => { l.set(''); changed(true); } },
      ]);
    }
    if (node) {
      const s = screen(node.dataset.id); if (!s) return;
      selectedId = s.id; canvas.querySelectorAll('.node.sel').forEach(n => n.classList.remove('sel')); node.classList.add('sel');
      const items = [
        { label: 'Edit', run: () => editInList(s.id) },
        flow.start === s.id ? null : { label: 'Show this first (start)', run: () => { flow.start = s.id; changed(true); } },
        { label: 'Duplicate', run: () => { const c2 = clone(s); c2.id = uniqueId(s.id + '_copy'); c2.x = s.x + 30; c2.y = s.y + 30; flow.screens.push(c2); changed(true); } },
        '-',
        ...['menu', 'input', 'end'].filter(t => t !== s.type).map(t => ({ label: 'Turn into ' + (t === 'input' ? 'a Question' : t === 'end' ? 'an End screen' : 'a Menu'), run: () => {
          s.type = t; if (t === 'menu' && !s.options.length) s.options.push({ key: '1', label: '', next: '' }); changed(true);
        } })),
        '-',
        { label: 'Delete screen', danger: true, run: () => deleteScreen(s.id) },
      ].filter(Boolean);
      return openCtx(e.clientX, e.clientY, items);
    }
    openCtx(e.clientX, e.clientY, [
      { label: 'Add a Menu here', run: () => addScreenAt('menu', px, py) },
      { label: 'Add a Question here', run: () => addScreenAt('input', px, py) },
      { label: 'Add an End screen here', run: () => addScreenAt('end', px, py) },
      '-',
      { label: 'Tidy up', run: () => { autoLayout(true); changed(true); } },
    ]);
  }

  /** "Add a value": opens More on a screen (the selected one, or the start screen) with a new empty Set value row. */
  function addSetValue(id) {
    const s = screen(id) || screen(selectedId) || screen(flow.start);
    if (!s) return;
    s.sets.push({ name: '', value: '' });
    openMore.add(s.id);
    changed(false);
    setView('list');
    const card = document.querySelector(`#screens .scr[data-id="${s.id}"]`);
    if (!card) return;
    card.scrollIntoView({ block: 'center' });
    card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 1200);
    const rows = card.querySelectorAll('.set-row');
    const name = rows.length ? rows[rows.length - 1].querySelector('input') : null;
    if (name) name.focus({ preventScroll: true });
  }

  /** File → Load a sample: pick one of the ready-made menus in samples.js. */
  function openSamples() {
    const list = window.SAMPLES || [];
    const back = el('div', { class: 'dlg-back' });
    const close = () => { back.classList.remove('show'); setTimeout(() => back.remove(), 150); document.removeEventListener('keydown', key, true); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const search = el('input', { class: 'smp-search', placeholder: 'Search samples…', oninput: () => filter() });
    const body = el('div', { class: 'smp-list' });
    const draw = () => {
      body.innerHTML = '';
      ['Beginner', 'Intermediate', 'Advanced'].forEach(level => {
        const items = list.map((x, n) => [x, n]).filter(([x]) => x.level === level);
        if (!items.length) return;
        body.append(el('div', { class: 'smp-level' }, level));
        items.forEach(([x, n]) => body.append(el('button', { type: 'button', class: 'smp-item', 'data-text': (x.title + ' ' + x.about).toLowerCase(), onclick: () => pick(x) },
          el('span', { class: 'smp-n' }, String(n + 1)),
          el('span', { class: 'smp-t' }, el('b', {}, x.title), el('span', {}, x.about)),
          el('span', { class: 'smp-c' }, `${x.flow.screens.length} screens`))));
      });
    };
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      body.querySelectorAll('.smp-item').forEach(b => b.hidden = q && !b.dataset.text.includes(q));
      body.querySelectorAll('.smp-level').forEach(h => {
        let n = h.nextElementSibling, any = false;
        while (n && !n.classList.contains('smp-level')) { if (!n.hidden) any = true; n = n.nextElementSibling; }
        h.hidden = !any;
      });
    };
    const pick = async x => {
      const hasWork = flow.screens.some(s => s.text.trim() || (s.options || []).some(o => o.label.trim())) || flow.screens.length > 1;
      if (hasWork && !(await window.ask({ title: `Load "${x.title}"?`, message: 'This replaces the menu you are working on. Use File → Save to file first if you want to keep it.', ok: 'Load sample', icon: 'folder' }))) return;
      close();
      flow = normalize(clone(x.flow));
      selectedId = null; openMore.clear();
      flow.screens.forEach(s => { delete s.x; delete s.y; });   // let the map lay it out
      changed(true);
      window.toast && window.toast(`Loaded "${x.title}". Press Test on phone to try it.`, 'check');
    };
    back.append(el('div', { class: 'dlg smp', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Load a sample' },
      el('div', { class: 'smp-h' }, el('h3', {}, 'Load a sample'), el('span', {}, `${list.length} ready-made menus, from simple to advanced. Load one, then change it however you like.`)),
      search, body,
      el('div', { class: 'dlg-btns' }, el('button', { type: 'button', class: 'btn', onclick: close }, 'Close'))));
    back.addEventListener('pointerdown', e => { if (e.target === back) close(); });
    document.addEventListener('keydown', key, true);
    draw();
    document.body.append(back);
    setTimeout(() => { back.classList.add('show'); search.focus(); }, 10);
  }

  /** Jump from the map to the screen's full editor in the list. */
  function editInList(id) {
    setView('list');
    const card = document.querySelector(`#screens .scr[data-id="${id}"]`);
    if (card) { card.scrollIntoView({ block: 'center' }); card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 1200); const t = card.querySelector('textarea'); if (t) t.focus({ preventScroll: true }); }
  }

  function renderList() {
    const box = $('#screens');
    const scroll = box.scrollTop;
    box.innerHTML = '';
    box.append(el('datalist', { id: 'bVars' }, knownVars().map(v => el('option', { value: v }))));
    box.append(el('datalist', { id: 'bValVars' }, knownVars().map(v => el('option', { value: `{{${v}}}` }))));
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
    showSaveState('saved');
    $('#bSave').onclick = saveNow;
    $('#bSamples').onclick = openSamples;
    document.addEventListener('click', e => { if (e.target.closest('[data-samples]')) openSamples(); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('#page-builder').hidden) { e.preventDefault(); saveNow(); }
    });
    $('#bAdd').onclick = () => {
      const id = uniqueId('screen');
      flow.screens.push({ id, type: 'menu', text: '', saveAs: '', options: [{ key: '1', label: '', next: '' }], rules: [], validate: 'any', error: '', next: '', sets: [] });
      if (view === 'map') {   // drop the new box where the user is looking
        const sc = document.querySelector('#bmap .map-scroll');
        const s = screen(id); s.x = (sc ? sc.scrollLeft : 0) + 40; s.y = (sc ? sc.scrollTop : 0) + 40;
        changed(true); return;
      }
      changed(true);
      const box = $('#screens'); box.scrollTop = box.scrollHeight;
      const card = box.querySelector(`[data-id="${id}"] textarea`); if (card) card.focus();
    };
    $('#bView').onclick = e => { const b = e.target.closest('button'); if (b) setView(b.dataset.v); };
    $('#bTidy').onclick = () => { autoLayout(true); changed(true); };
    window.addEventListener('resize', () => { if (view === 'map') { const c = document.querySelector('#bmap .map-canvas'); if (c) drawLines(c); } });
    $('#bReset').onclick = async () => {
      if (await ask({ title: 'Start a new menu?', message: 'This clears every screen. Use File → Save to file first if you want to keep this menu.', ok: 'Start over', danger: true, icon: 'reset' })) { flow = normalize(blankFlow()); openMore.clear(); changed(true); }
    };
    $('#bExport').onclick = () => download(fileName() + '.flow.json', JSON.stringify(flow, null, 2), 'application/json');
    $('#bImport').onclick = () => $('#bFile').click();
    $('#bFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => {
        try { const j = JSON.parse(t); if (!valid(j)) throw new Error('no screens'); flow = normalize(j); changed(true); }
        catch (err) { tell({ title: "Can't open that file", message: 'It is not a menu saved from the Menu builder (' + err.message + ').' }); }
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
    respond, toPhp, init, render, problems, setView, variables, addSetValue,
    get flow() { return flow; },
    set flow(f) { flow = normalize(clone(f)); save(); render(); },
    blank: blankFlow,
  };
})();
