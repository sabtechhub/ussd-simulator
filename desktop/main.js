/* SAB-TECH HUB USSD Simulator - desktop app (Windows and Mac) */
const { app, BrowserWindow, Menu, shell, dialog, net } = require('electron');
const path = require('path');
const { start } = require('./server');

const SITE = 'https://sabtechhub.com/ussd-simulator/';
const DOWNLOAD = 'https://github.com/sabtechhub/ussd-simulator/releases/latest';
const GITHUB = 'https://github.com/sabtechhub/ussd-simulator';
const RELEASES_API = 'https://api.github.com/repos/sabtechhub/ussd-simulator/releases/latest';

let win, baseUrl;
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

const isExternal = url => !url.startsWith(baseUrl);

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 980, minHeight: 640, show: false,
    title: 'SAB-TECH HUB USSD Simulator', backgroundColor: '#f4f6fb',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // links to websites open in the normal browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (isExternal(url)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  win.loadURL(baseUrl);
}

function newer(a, b) {   // is version a newer than b?
  const pa = String(a).replace(/^v/, '').split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}

async function checkForUpdates(manual) {
  try {
    const res = await net.fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rel = await res.json();
    if (newer(rel.tag_name, app.getVersion())) {
      const { response } = await dialog.showMessageBox(win, {
        type: 'info', buttons: ['Download', 'Later'], defaultId: 0, cancelId: 1,
        title: 'Update available', message: `A new version (${String(rel.tag_name).replace(/^v/, '')}) is available.`,
        detail: `You have version ${app.getVersion()}. Download the new version and install it over this one. Your saved menus stay.`,
      });
      if (response === 0) shell.openExternal(DOWNLOAD);
    } else if (manual) {
      dialog.showMessageBox(win, { type: 'info', message: 'You have the latest version.', detail: `Version ${app.getVersion()}` });
    }
  } catch (e) {
    if (manual) dialog.showMessageBox(win, { type: 'warning', message: 'Could not check for updates.', detail: 'Check your internet connection and try again.' });
  }
}

function buildMenu() {
  const mac = process.platform === 'darwin';
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(mac ? [{ role: 'appMenu' }] : []),
    { label: 'File', submenu: [mac ? { role: 'close' } : { role: 'quit', label: 'Exit' }] },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'reload' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Help', submenu: [
      { label: 'Video tutorials', click: () => shell.openExternal('https://sabtechhub.com/videos') },
      { label: 'SAB-TECH HUB website', click: () => shell.openExternal('https://sabtechhub.com') },
      { label: 'Source code on GitHub', click: () => shell.openExternal(GITHUB) },
      { type: 'separator' },
      { label: 'Check for updates…', click: () => checkForUpdates(true) },
      { label: `Version ${app.getVersion()}`, enabled: false },
    ] },
  ]));
}

app.whenReady().then(async () => {
  const web = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, 'web');
  try {
    baseUrl = (await start(web, { version: app.getVersion(), github: GITHUB })).url;
  } catch (e) {
    dialog.showErrorBox('USSD Simulator could not start', String(e && e.message || e));
    return app.quit();
  }
  buildMenu();
  createWindow();
  setTimeout(() => checkForUpdates(false), 5000);
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
