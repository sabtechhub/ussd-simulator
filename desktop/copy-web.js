// Copies the simulator's web files (from the folder above) into web/, for the desktop app.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(__dirname, 'web');
const files = ['index.php', 'builder.js', 'samples.js', 'icons.js', 'dialog.js', 'sample-hubtel.php', 'sample-nalo.php'];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'vendor'), { recursive: true });
for (const f of files) fs.copyFileSync(path.join(root, f), path.join(out, f));
// code highlighter, bundled so the app works offline
const hl = path.dirname(require.resolve('@highlightjs/cdn-assets/package.json'));
fs.copyFileSync(path.join(hl, 'highlight.min.js'), path.join(out, 'vendor', 'highlight.min.js'));
fs.copyFileSync(path.join(hl, 'styles', 'atom-one-dark.min.css'), path.join(out, 'vendor', 'atom-one-dark.min.css'));
const inter = path.dirname(require.resolve('@fontsource-variable/inter/package.json'));
fs.copyFileSync(path.join(inter, 'files', 'inter-latin-wght-normal.woff2'), path.join(out, 'vendor', 'inter-latin-wght-normal.woff2'));
const html = require('./server').pageHtml(out, { version: 'check', github: '' });   // fails early if index.php changed shape
if (/cdnjs\.cloudflare\.com|fonts\.googleapis/.test(html)) throw new Error('index.php still loads the highlighter from the internet');
console.log('copied', files.length + 3, 'files to web/');
