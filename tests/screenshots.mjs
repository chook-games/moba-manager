// Captures real gameplay screenshots via headless Chrome for store listings.
// Usage: node tests/screenshots.mjs   -> writes to store/screenshots/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'store', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function findChrome() {
  const env = process.env.CHROME_PATH || process.env.CHROME_BIN;
  if (env && fs.existsSync(env)) return env;
  const c = process.platform === 'win32'
    ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
       'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe']
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const p of c) if (fs.existsSync(p)) return p;
  for (const cmd of ['google-chrome', 'chromium', 'chrome']) if (spawnSync(cmd, ['--version'], { encoding: 'utf8' }).status === 0) return cmd;
  return null;
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

const chromePath = findChrome();
if (!chromePath) { console.error('No Chrome found (set CHROME_PATH).'); process.exit(1); }
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moba-shot-'));
const chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', `--user-data-dir=${userDir}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });

const wsPort = await new Promise((resolve, reject) => {
  let buf = ''; const t = setTimeout(() => reject(new Error('chrome timeout')), 30000);
  chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//); if (m) { clearTimeout(t); resolve(Number(m[1])); } });
});
const getJson = async (u) => (await fetch(u)).json();
const page = (await getJson(`http://127.0.0.1:${wsPort}/json/list`)).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((r) => pending.set(i, r)); };
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
await send('Page.enable');
await send('Runtime.enable');
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
  console.log('saved', name + '.png');
}

await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
await sleep(3500);
await shot('01-home');

await ev(`document.getElementById('btn-home-missions').click()`); await sleep(400);
await shot('02-missions');
await ev(`document.getElementById('btn-missions-back').click()`); await sleep(200);

await ev(`document.getElementById('btn-home-play').click()`); await sleep(300);
await shot('03-modes');
await ev(`document.querySelector('.mode-card:not(.is-locked)').click()`); await sleep(300);
await shot('04-squad');
await ev(`document.getElementById('btn-squad-auto').click()`); await sleep(200);
await ev(`document.getElementById('btn-start-match').click()`); await sleep(14000);
await shot('05-game');

// Zoom into the fight for a nicer detail shot.
await ev(`document.getElementById('cam-preset-2').click()`); await sleep(1200);
await ev(`document.querySelectorAll('#squad-cards-row .squad-card')[0].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));`); await sleep(800);
await shot('06-commands');
await ev(`document.getElementById('tab-btn-shop').click()`); await sleep(300);
await shot('07-shop');

// Landscape gameplay shot.
await send('Emulation.setDeviceMetricsOverride', { width: 915, height: 412, deviceScaleFactor: 2, mobile: true });
await sleep(1000);
await ev(`document.getElementById('tab-btn-tactics').click()`);
await shot('08-game-landscape');

ws.close(); chrome.kill(); server.close();
await sleep(300);
try { fs.rmSync(userDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* ignore */ }
console.log('done');
