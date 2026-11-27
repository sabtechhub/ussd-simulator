/* Demo USSD endpoint (same menu as mock.php), speaks both Hubtel and Nalo formats. */
const naloState = new Map();   // Nalo keeps no state in the request, so remember it per session

function step(state, input) {
  const menu = '1. Check balance\n2. Buy airtime\n0. Exit';
  if (state === '') return [`Welcome to Demo Shop\n${menu}`, 'menu', false];
  if (state === 'menu') {
    if (input === '1') return ['Your balance is GHS 25.40', '', true];
    if (input === '2') return ['Enter amount (GHS):', 'amount', false];
    if (input === '0') return ['Goodbye!', '', true];
    return [`Invalid option.\n${menu}`, 'menu', false];
  }
  if (state === 'amount') {
    const n = Number(input);
    if (input === '' || !isFinite(n) || n <= 0) return ['Invalid amount. Enter amount (GHS):', 'amount', false];
    const a = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return [`Buy GHS ${a} airtime?\n1. Confirm\n2. Cancel`, `confirm:${a}`, false];
  }
  if (state.startsWith('confirm:')) {
    const a = state.slice(8);
    return input === '1' ? [`Success! GHS ${a} airtime purchased.`, '', true] : ['Transaction cancelled.', '', true];
  }
  return ['Session error.', '', true];
}

const truthy = v => v === true || ['1', 'true', 'on', 'yes'].includes(String(v).toLowerCase());

/** Takes the request object, returns the response object. */
function handle(r = {}) {
  if ('MSISDN' in r || 'USERID' in r) {   // Nalo
    const sid = String(r.SESSIONID ?? 'x');
    const first = truthy(r.MSGTYPE);
    const state = first ? '' : (naloState.get(sid) || '');
    const input = first ? '' : String(r.USERDATA ?? '').trim();
    const [msg, next, end] = step(state, input);
    if (end) naloState.delete(sid); else naloState.set(sid, next);
    return { USERID: r.USERID ?? '', MSISDN: r.MSISDN ?? '', USERDATA: input, MSG: msg, MSGTYPE: !end };
  }
  const type = String(r.Type ?? '').toLowerCase();   // Hubtel
  if (type === 'release' || type === 'timeout') return { SessionId: r.SessionId ?? '', Type: 'Release', Message: '' };
  const first = type === 'initiation';
  const [msg, next, end] = step(first ? '' : String(r.ClientState ?? ''), first ? '' : String(r.Message ?? '').trim());
  return { SessionId: r.SessionId ?? '', Type: end ? 'Release' : 'Response', Message: msg, Label: 'Demo Shop',
    ClientState: next, DataType: end ? 'display' : 'input', FieldType: 'text' };
}

module.exports = { handle };
