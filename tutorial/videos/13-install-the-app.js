/* Video 13 (bonus): Install the free app on Windows or Mac.
 * The install steps happen outside the browser, so they are shown as simple drawn scenes over the page. */
const ICON = 'desktop/build/icon.png';
const SC = {
  css: `
  #scene{position:fixed;inset:0;z-index:2147483000;display:none;font-family:'Segoe UI',Inter,system-ui,sans-serif;color:#0f172a;
    background:radial-gradient(900px 500px at 15% 10%,#1e3a8a 0%,transparent 60%),radial-gradient(800px 500px at 90% 95%,#065f46 0%,transparent 55%),#0b1220}
  #scene .win{position:absolute;background:#fff;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,.5);overflow:hidden}
  #scene .bar{height:40px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;padding:0 14px;font-size:14px;color:#475569}
  #scene .dots i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:6px;background:#e2e8f0}
  #scene .url{flex:1;background:#fff;border:1px solid #e2e8f0;border-radius:999px;padding:5px 14px;font-size:14px;color:#334155}
  #scene .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:10px;font-weight:600;font-size:17px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;cursor:default}
  #scene .btn.pri{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
  #scene .ss{position:absolute;left:50%;top:150px;transform:translateX(-50%);width:640px;background:#0b5cad;color:#fff;padding:34px 40px 30px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
  #scene .ss h2{margin:0 0 18px;font-size:34px;font-weight:400}
  #scene .ss p{font-size:17px;line-height:1.5;margin:0 0 14px}
  #scene .ss a{color:#fff;text-decoration:underline;font-size:17px}
  #scene .ss .row{display:flex;justify-content:flex-end;gap:12px;margin-top:30px}
  #scene .ss .b{padding:9px 28px;border:2px solid #fff;font-size:16px;background:transparent;color:#fff}
  #scene .inst .side{position:absolute;left:0;top:40px;bottom:0;width:190px;background:linear-gradient(180deg,#1d4ed8,#0b1220);display:flex;align-items:flex-start;justify-content:center;padding-top:40px}
  #scene .inst .side img{width:120px}
  #scene .inst .body{position:absolute;left:220px;right:30px;top:70px;font-size:17px;line-height:1.5}
  #scene .inst h3{margin:0 0 10px;font-size:22px}
  #scene .inst .foot{position:absolute;right:24px;bottom:20px;display:flex;gap:10px}
  #scene .inst .foot .btn{padding:8px 26px;font-size:15px}
  #scene .prog{height:18px;border-radius:9px;background:#e2e8f0;overflow:hidden;margin-top:20px}
  #scene .prog b{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#16a34a)}
  #scene .desk{position:absolute;left:60px;top:150px;display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;font-size:15px;width:120px;text-align:center}
  #scene .desk img{width:72px}
  #scene .dl{position:absolute;right:30px;top:52px;width:360px;background:#fff;border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,.3);padding:16px 18px;font-size:15px}
  #scene .dl b{display:block;margin-bottom:4px}
  #scene .mac{position:absolute;left:50%;top:170px;transform:translateX(-50%);width:760px;height:420px}
  #scene .mac .area{position:absolute;inset:40px 0 0;display:flex;align-items:center;justify-content:space-around;background:#f8fafc}
  #scene .mac .item{display:flex;flex-direction:column;align-items:center;gap:10px;font-size:16px}
  #scene .mac .item img,#scene .mac .folder{width:120px;height:120px}
  #scene .mac .folder{border-radius:18px;background:linear-gradient(160deg,#60a5fa,#2563eb);display:flex;align-items:center;justify-content:center;color:#fff;font-size:44px;font-weight:700}
  #scene .mac .arrow{font-size:60px;color:#94a3b8}
  #scene .menu{position:absolute;background:#fff;border-radius:8px;box-shadow:0 16px 40px rgba(0,0,0,.35);padding:6px 0;width:200px;font-size:15px}
  #scene .menu div{padding:7px 16px}
  #scene .menu .on{background:#2563eb;color:#fff}
  #scene .gk{position:absolute;left:50%;top:190px;transform:translateX(-50%);width:460px;background:#f8fafc;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.5);padding:28px;text-align:center;font-size:15px;line-height:1.5}
  #scene .gk img{width:70px}
  #scene .gk .row{display:flex;gap:10px;justify-content:center;margin-top:18px}
  #scene .gk .btn{padding:7px 26px;font-size:15px}`,
  show(html) {
    return T.run(() => {
      let s = document.getElementById('scene');
      if (!s) { const st = document.createElement('style'); st.textContent = SC.css; document.head.append(st); s = document.createElement('div'); s.id = 'scene'; document.body.append(s); }
      s.innerHTML = html; s.style.display = 'block';
    });
  },
  set(sel, fn) { return T.run(() => { const el = document.querySelector('#scene ' + sel); if (el) fn(el); }); },
  off() { return T.run(() => { const s = document.getElementById('scene'); if (s) s.style.display = 'none'; }); },
  /** the dragged Mac icon follows the pointer */
  draggable(sel) {
    return T.run(() => {
      const el = document.querySelector('#scene ' + sel); let x0, y0;
      el.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; el.style.position = 'relative'; el.style.zIndex = 5; });
      el.addEventListener('pointermove', e => { if (x0 != null) el.style.transform = `translate(${e.clientX - x0}px,${e.clientY - y0}px)`; });
      el.addEventListener('pointerup', () => { x0 = null; el.style.opacity = '0'; });
    });
  },
};
const browser = (url, inner) => `<div class="win" style="left:120px;top:140px;width:1360px;height:600px"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span class="url">${url}</span></div>${inner}</div>`;
const installer = (inner, buttons) => `<div class="win inst" style="left:50%;top:150px;transform:translateX(-50%);width:760px;height:470px"><div class="bar">SAB-TECH HUB USSD Simulator Setup</div><div class="side"><img src="${ICON}"></div><div class="body">${inner}</div><div class="foot">${buttons}</div></div>`;

/* ---------------- opening ---------------- */
T.label('Bonus video');
T.run(() => window.scrollTo(0, 0));
T.titleOn('Bonus video', 'Install the free app', 'Put the USSD Simulator on your Windows or Mac computer.', 'SAB-TECH HUB USSD Simulator');
T.wait(3000);
T.titleHide();
T.say("This is a bonus video. The USSD Simulator is also a free app for Windows and Mac. Let us install it, step by step.");

L.section('Why', 'Why use the app?', "Why use the app, instead of the website?");
T.say("The app works without internet. Your menus are saved on your own computer. And the app can test your own USSD server, even one running on your computer.");
T.say("It looks and works exactly like the simulator you have seen in these videos.");

/* ---------------- download ---------------- */
L.section('Step 1', 'Download it', "Step one. Download the app.");
SC.show(browser('sabtechhub.com/ussd', `<div style="padding:60px 80px">
  <div style="font-size:15px;color:#64748b;margin-bottom:6px">SAB-TECH HUB</div>
  <h1 style="margin:0 0 14px;font-size:44px">USSD Simulator</h1>
  <p style="font-size:20px;color:#475569;max-width:900px;line-height:1.5;margin:0 0 34px">Build and test your USSD menu, free. Build it on a Map, with no code.</p>
  <div style="display:flex;gap:14px"><span class="btn pri" id="dlWin">Download for Windows</span><span class="btn" id="dlMac">Download for Mac</span><span class="btn">Try it online</span></div>
  <p style="font-size:15px;color:#64748b;margin-top:28px">Free for Windows 10 and 11, and for Mac.</p></div>`));
T.say("Go to sabtechhub dot com, and open the USSD Simulator page. You can also find it on the Apps page.");
T.move('#scene .url', 900).wait(400);
T.say("Choose your computer. Here we choose Windows.");
T.click('#scene #dlWin').sleep(300);
SC.set('.win', el => el.insertAdjacentHTML('beforeend', '<div class="dl" id="dlBox"><b>USSD-Simulator-Setup.exe</b><span style="color:#64748b">116 MB · Done</span><div style="margin-top:10px"><span class="btn" id="openFile" style="padding:6px 16px;font-size:14px">Open file</span></div></div>'));
T.say("The file downloads. It is about one hundred megabytes. When it is done, open it.");
T.click('#scene #openFile').sleep(300);

/* ---------------- windows protected your pc ---------------- */
L.section('Step 2', 'The blue warning', "Step two. You may see a blue box.");
SC.show(`<div class="ss" id="ss"><h2>Windows protected your PC</h2>
  <p>Windows stopped an app it does not know yet from starting. Running this app might put your PC at risk.</p>
  <a id="moreInfo">More info</a>
  <div class="row"><span class="b">Don't run</span></div></div>`);
T.say("Windows shows this for new apps it does not know yet. Our app is safe. Click More info.", "Windows shows this for new apps it does not know yet. Our app is safe. Click, More info.");
T.click('#scene #moreInfo').sleep(250);
SC.set('#ss', el => { el.innerHTML = `<h2>Windows protected your PC</h2><p>Windows stopped an app it does not know yet from starting. Running this app might put your PC at risk.</p><p>App: USSD-Simulator-Setup.exe<br>Publisher: Unknown publisher</p><div class="row"><span class="b" id="runAnyway">Run anyway</span><span class="b">Don't run</span></div>`; });
T.say("Now a new button appears. Click Run anyway.", "Now a new button appears. Click, Run anyway.");
T.click('#scene #runAnyway').sleep(300);
T.say("You only see this the first time.");

/* ---------------- installer ---------------- */
L.section('Step 3', 'Install it', "Step three. The installer opens.");
SC.show(installer(`<h3>Choose installation options</h3><p>Who should this app be installed for?</p>
  <p>○ Anyone who uses this computer<br>● Only for me</p>`, `<span class="btn pri" id="next1">Next</span><span class="btn">Cancel</span>`));
T.say("Choose Only for me, and click Next.", "Choose, Only for me, and click Next.");
T.click('#scene #next1').sleep(250);
SC.show(installer(`<h3>Choose install location</h3><p>The app will be installed in this folder. You can leave it as it is.</p>
  <div style="border:1px solid #cbd5e1;border-radius:6px;padding:8px 12px;font-size:15px;margin-top:10px">C:\\Users\\You\\AppData\\Local\\Programs\\USSD Simulator</div>`, `<span class="btn pri" id="install">Install</span><span class="btn">Cancel</span>`));
T.say("Leave the folder as it is, and click Install.", "Leave the folder as it is, and click, Install.");
T.click('#scene #install').sleep(250);
SC.show(installer(`<h3>Installing</h3><p>Please wait while the app is installed.</p><div class="prog"><b id="pb"></b></div>`, `<span class="btn" style="opacity:.5">Next</span>`));
for (const w of [15, 35, 55, 72, 88, 100]) { SC.set('#pb', el => { el.style.width = w + '%'; }); T.wait(450); }
SC.show(installer(`<h3>Completing the setup</h3><p>SAB-TECH HUB USSD Simulator has been installed on your computer.</p><p>☑ Run SAB-TECH HUB USSD Simulator</p>`, `<span class="btn pri" id="finish">Finish</span>`));
T.say("It takes a few seconds. Then click Finish, and the app opens.", "It takes a few seconds. Then click, Finish, and the app opens.");
T.click('#scene #finish').sleep(300);

/* ---------------- open later ---------------- */
L.section('Step 4', 'Open it any time', "Step four. Opening it later.");
SC.show(`<div class="desk" id="desk"><img src="${ICON}"><span>USSD Simulator</span></div>
  <div style="position:absolute;left:50%;top:260px;transform:translateX(-50%);color:#cbd5e1;font-size:22px;text-align:center;line-height:1.6">The installer adds a shortcut on your desktop,<br>and in the Start menu.</div>`);
T.say("The installer puts a shortcut on your desktop, and in the Start menu. Just double click it, to open the app.");
T.move('#scene #desk img', 900).wait(300);
T.click('#scene #desk img').sleep(150);
T.click('#scene #desk img').sleep(300);
SC.off();
L.page('builder');
L.onMap();
T.say("And here it is, in its own window. The same simulator, with the Map, the samples, and the test phone.");
T.wait(800);
L.page('log');

/* ---------------- mac ---------------- */
L.section('On a Mac', 'Install on a Mac', "Now, on a Mac.");
SC.show(`<div class="win mac"><div class="bar">USSD Simulator</div><div class="area">
  <div class="item" id="macApp"><img src="${ICON}"><span>SAB-TECH HUB USSD Simulator</span></div>
  <div class="arrow">→</div>
  <div class="item"><div class="folder" id="appsFolder">A</div><span>Applications</span></div></div></div>`);
T.say("Click Download for Mac, and open the file. A window opens. Drag the app onto the Applications folder.", "Click, Download for Mac, and open the file. A window opens. Drag the app onto the Applications folder.");
SC.draggable('#macApp');
T.drag('#scene #macApp img', '#scene #appsFolder', 1400).sleep(300).wait(400);
SC.show(`<div class="win" style="left:50%;top:170px;transform:translateX(-50%);width:760px;height:420px"><div class="bar">Applications</div>
  <div style="padding:30px;display:flex;gap:40px;font-size:15px"><div class="item" id="macIcon" style="display:flex;flex-direction:column;align-items:center;gap:8px;width:150px;text-align:center"><img src="${ICON}" style="width:90px"><span>SAB-TECH HUB USSD Simulator</span></div></div></div>`);
T.say("The first time, open it like this. Right click the app, and choose Open.", "The first time, open it like this. Right click the app, and choose, Open.");
T.rightClick('#scene #macIcon img');
SC.set('.win', el => el.insertAdjacentHTML('beforeend', '<div class="menu" style="left:150px;top:150px"><div class="on" id="macOpen">Open</div><div>Show Package Contents</div><div>Move to Bin</div><div>Get Info</div></div>'));
T.wait(500);
T.click('#scene #macOpen').sleep(250);
SC.show(`<div class="gk"><img src="${ICON}"><p><b>macOS cannot check this app</b></p><p>Are you sure you want to open it?</p><div class="row"><span class="btn pri" id="gkOpen">Open</span><span class="btn">Cancel</span></div></div>`);
T.say("The Mac asks if you are sure. Click Open. Again, this only happens the first time.", "The Mac asks if you are sure. Click, Open. Again, this only happens the first time.");
T.click('#scene #gkOpen').sleep(300);
T.say("If you do not see an Open button, go to System Settings, then Privacy and Security, and click Open Anyway.");
SC.off();

/* ---------------- in the app ---------------- */
L.section('In the app', 'Test your own server', "One more thing the app can do.");
L.setupFolded(true);
T.say("In the app, My server is always on. Paste the address of your own USSD server, even one on your computer, and press Check.");
T.click('#setupOpen', null, 700).sleep(200);
T.click('#srcSeg button[data-v=url]').sleep(250);
T.move('#endpoint', 800).wait(600);
T.click('#srcSeg button[data-v=demo]').sleep(250);
T.click('#setupDone').sleep(200);
T.say("And when there is a new version, the app tells you. Your saved menus stay when you update.");

L.outro("That is it. You have the USSD Simulator on your own computer. Build your menu on the Map, test it, and put it live. Thank you for watching. Powered by SAB-TECH HUB.", '');
