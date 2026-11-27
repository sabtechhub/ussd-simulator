/*
 * In-page dialogs instead of the browser's alert() and confirm().
 *
 *   if (await ask({ title: 'Delete screen?', message: '…', ok: 'Delete', danger: true })) { … }
 *   await tell({ title: 'Name already used', message: '…' });
 *
 * Enter confirms, Esc or a click outside cancels.
 */
(function () {
  function open(o, withCancel) {
    return new Promise(resolve => {
      const back = document.createElement('div');
      back.className = 'dlg-back';
      back.innerHTML = `
        <div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dlgTitle">
          <div class="dlg-ic ${o.danger ? 'danger' : ''}">${window.icon ? window.icon(o.icon || (o.danger ? 'trash' : withCancel ? 'help' : 'alert'), 20) : ''}</div>
          <div class="dlg-body">
            <h3 id="dlgTitle"></h3>
            <p class="dlg-msg"></p>
            <ul class="dlg-list"></ul>
          </div>
          <div class="dlg-btns">
            ${withCancel ? '<button type="button" class="btn dlg-cancel"></button>' : ''}
            <button type="button" class="btn primary dlg-ok ${o.danger ? 'danger-btn' : ''}"></button>
          </div>
        </div>`;
      back.querySelector('h3').textContent = o.title || '';
      const msg = back.querySelector('.dlg-msg');
      if (o.message) msg.textContent = o.message; else msg.remove();
      const list = back.querySelector('.dlg-list');
      if (o.list && o.list.length) o.list.forEach(t => { const li = document.createElement('li'); li.textContent = t; list.append(li); }); else list.remove();
      back.querySelector('.dlg-ok').textContent = o.ok || 'OK';
      if (withCancel) back.querySelector('.dlg-cancel').textContent = o.cancel || 'Cancel';

      const prevFocus = document.activeElement;
      const done = v => {
        document.removeEventListener('keydown', key, true);
        back.classList.remove('show');
        setTimeout(() => back.remove(), 150);
        if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
        resolve(v);
      };
      const key = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
        else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); done(true); }
        else if (e.key === 'Tab') {   // keep focus inside the dialog
          const b = [...back.querySelectorAll('button')]; const i = b.indexOf(document.activeElement);
          e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
        }
      };
      back.querySelector('.dlg-ok').onclick = () => done(true);
      if (withCancel) back.querySelector('.dlg-cancel').onclick = () => done(false);
      back.addEventListener('pointerdown', e => { if (e.target === back) done(false); });
      document.addEventListener('keydown', key, true);
      document.body.append(back);
      setTimeout(() => back.classList.add('show'), 10);   // next tick, so the fade-in runs
      (withCancel && o.danger ? back.querySelector('.dlg-cancel') : back.querySelector('.dlg-ok')).focus();
    });
  }
  /** Small message at the bottom of the screen that goes away by itself. */
  window.toast = function (text, iconName) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.innerHTML = (window.icon ? window.icon(iconName || 'check', 16) : '') + '<span></span>';
    t.querySelector('span').textContent = text;
    t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
  };
  window.ask = o => open(o, true);
  window.tell = o => open(o, false);
})();
