/*
 * Shared helpers for the narrated tutorial videos (loaded before each video script).
 * T.say("subtitle", "optional spoken text") narrates; actions between say() lines happen while the narrator talks.
 */
const { T } = window.tour;
const L = {
  q: s => () => document.querySelector(s),
  btn: (scope, text) => () => [...document.querySelectorAll(scope + ' button')].find(b => b.textContent.trim() === text),
  ctxItem: text => () => [...document.querySelectorAll('.ctx button')].find(b => b.textContent.trim().startsWith(text)),
  opt: (id, row, n) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .opt-row:not(.col-h)`)[row]; return r && r.querySelectorAll('input')[n]; },
  optSel: (id, row) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .opt-row:not(.col-h)`)[row]; return r && r.querySelector('select.nx'); },
  ruleIn: (id, row, n) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .rule-row`)[row]; return r && r.querySelectorAll('input')[n]; },
  ruleSel: (id, row, nx) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .rule-row`)[row]; return r && r.querySelector(nx ? 'select.nx' : 'select:not(.nx)'); },
  setIn: (id, row, n) => () => { const r = document.querySelectorAll(`.scr[data-id="${id}"] .set-row`)[row]; return r && r.querySelectorAll('input')[n]; },
  dialogReady: () => document.querySelector('#overlay').classList.contains('show') && document.querySelector('#dlgBox').style.display !== 'none' && document.querySelector('#msg').textContent.trim() !== '',
};

/** type a reply on the phone and send it, then wait for the menu to answer */
L.reply = (text, ms = 140) => T.click('#reply').type('#reply', text, { msPerChar: ms }).wait(500).click('#sendBtn').until(L.dialogReady).sleep(250).wait(1400);
/** dial the code on the test phone and wait for the menu */
L.dial = () => T.click('#callBtn').until(L.dialogReady).sleep(300).wait(900);
/** close the phone popup */
L.ok = () => T.click('#cancelBtn').wait(500);

/** opening card for 3 seconds, then the narrator introduces the video over the app */
L.intro = (n, heading, sub, line, spoken) => {
  T.label(`Video ${n}`);
  T.run(() => window.scrollTo(0, 0));
  T.titleOn(`Video ${n} of 12`, heading, sub, 'SAB-TECH HUB USSD Simulator');
  T.wait(3000);
  T.titleHide();
  return T.say(line, spoken);
};
/** a new part of the video: a small label at the top, no full-screen card */
L.section = (kicker, heading, line, spoken) => {
  T.sync(400);
  T.banner(kicker, heading);
  return T.say(line, spoken);
};
/** the narrator closes over the app, then a short end card */
L.outro = (line, next, spoken) => {
  T.sync(400);
  T.bannerOff();
  T.say(line, spoken);
  T.sync(600);
  T.titleOn('Well done', 'That is the end of this video', next ? 'Next: ' + next : 'You have finished the series.', 'Powered by SAB-TECH HUB · github.com/sabtechhub/ussd-simulator');
  T.wait(3000);
  return T.titleHide();
};
/** load a menu into the builder without showing the steps */
L.loadFlow = flow => T.run(() => { Flow.flow = flow; });
/** open a page: 'log' (Test) or 'builder' */
L.page = p => T.click(`#mainTabs button[data-v=${p}]`).sleep(250);
/** fold or open the setup panel instantly (used to start a video in a clean state) */
L.setupFolded = folded => T.run(() => { const b = document.querySelector(folded ? '#setupDone' : '#setupOpen'); if (b && b.offsetParent) b.click(); });

/* small ready-made menus used by several videos */
L.shopFlow = () => ({ name: 'My Shop', start: 'main', screens: [
  { id: 'main', type: 'menu', text: 'Welcome to My Shop', options: [{ key: '1', label: 'Check balance', next: 'balance' }, { key: '2', label: 'Buy airtime', next: 'amount' }, { key: '0', label: 'Exit', next: 'bye' }] },
  { id: 'balance', type: 'end', text: 'Your balance is GHS 25.00' },
  { id: 'amount', type: 'input', text: 'Enter amount (GHS 1 - 500):', saveAs: 'amount', validate: 'number', rules: [{ var: 'amount', op: 'between', value: '1,500', next: 'done' }], next: 'too_much' },
  { id: 'done', type: 'end', text: 'You bought GHS {{amount}} airtime.' },
  { id: 'too_much', type: 'end', text: 'Amount must be between GHS 1 and 500.' },
  { id: 'bye', type: 'end', text: 'Thank you. Goodbye!' }] });
