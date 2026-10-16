// End-to-end browser test via the Chrome DevTools Protocol. Portable (Win/mac/Linux).
// Serves the folder, drives a headless browser through the full game flow, and fails
// on any console error / uncaught exception.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function findChrome() {
  const env = process.env.CHROME_PATH || process.env.CHROME_BIN;
  if (env && fs.existsSync(env)) return env;
  const c = [];
  if (process.platform === 'win32') {
    c.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe');
  } else if (process.platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    c.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  }
  for (const p of c) if (p && fs.existsSync(p)) return p;
  for (const cmd of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome']) {
    if (spawnSync(cmd, ['--version'], { encoding: 'utf8' }).status === 0) return cmd;
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

const chromePath = findChrome();
if (!chromePath) { console.error('No Chrome/Chromium found. Set CHROME_PATH.'); server.close(); process.exit(1); }

const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moba-chrome-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
  '--enable-unsafe-swiftshader', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${userDir}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

// Parse the actual DevTools port from Chrome stderr.
const wsPort = await new Promise((resolve, reject) => {
  let buf = '';
  const timer = setTimeout(() => reject(new Error('Chrome DevTools did not start')), 30000);
  chrome.stderr.on('data', (d) => {
    buf += d.toString();
    const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
    if (m) { clearTimeout(timer); resolve(Number(m[1])); }
  });
  chrome.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Chrome exited (${code})`)); });
});

const getJson = async (u) => (await fetch(u)).json();
let targets = [];
for (let i = 0; i < 40; i++) { try { targets = await getJson(`http://127.0.0.1:${wsPort}/json/list`); if (targets.length) break; } catch { /* retry */ } await sleep(200); }
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);

const errors = [];
let id = 0; const pending = new Map();
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((r) => pending.set(msgId, r));
}
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  const benign = (t) => /navigator\.vibrate|user hasn't tapped/i.test(t);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !benign(m.params.entry.text)) errors.push(m.params.entry.text);
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;

const checks = [];
const check = (name, cond) => checks.push({ name, ok: !!cond });

await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 820, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
await sleep(3500);

check('home screen visible', await ev(`!document.getElementById('screen-home').classList.contains('hidden')`));

// i18n toggle (Greek <-> English).
await ev(`(()=>{const s=document.getElementById('select-lang'); s.value='el'; s.dispatchEvent(new Event('change'));})()`); await sleep(100);
check('language switch -> Greek', (await ev(`document.getElementById('btn-home-play').textContent`)) === '▶ ΠΑΙΞΕ');
await ev(`(()=>{const s=document.getElementById('select-lang'); s.value='en'; s.dispatchEvent(new Event('change'));})()`); await sleep(100);
check('language switch -> English', (await ev(`document.getElementById('btn-home-play').textContent`)) === '▶ PLAY');

// Missions screen.
await ev(`document.getElementById('btn-home-missions').click()`); await sleep(100);
check('missions screen opens', !(await ev(`document.getElementById('screen-missions').classList.contains('hidden')`)));
check('daily quests rendered (4)', (await ev(`document.querySelectorAll('#daily-quests-list .mission-row').length`)) === 4);
check('achievements rendered', (await ev(`document.querySelectorAll('#achievements-list .mission-row').length`)) >= 6);
await ev(`document.getElementById('btn-missions-back').click()`); await sleep(100);
check('missions back to home', !(await ev(`document.getElementById('screen-home').classList.contains('hidden')`)));

// Transfer save modal (export produces a code).
await ev(`document.getElementById('btn-transfer-open').click()`); await sleep(80);
check('transfer modal opens', !(await ev(`document.getElementById('modal-transfer').classList.contains('hidden')`)));
await ev(`document.getElementById('btn-transfer-export').click()`); await sleep(80);
check('export produces a save code', (await ev(`document.getElementById('transfer-text').value`)).startsWith('MOBA1.'));
await ev(`document.getElementById('btn-transfer-close').click()`); await sleep(50);
check('transfer modal closes', await ev(`document.getElementById('modal-transfer').classList.contains('hidden')`));

await ev(`document.getElementById('btn-home-play').click()`); await sleep(200);
check('mode screen + 4 modes', await ev(`document.querySelectorAll('.mode-card').length === 4`));
await ev(`document.querySelector('.mode-card:not(.is-locked)').click()`); await sleep(200);
await ev(`document.getElementById('btn-squad-auto').click()`); await sleep(150);
await ev(`document.getElementById('btn-start-match').click()`); await sleep(3000);

check('game screen visible', await ev(`!document.getElementById('screen-game').classList.contains('hidden')`));
check('5 squad cards', await ev(`document.querySelectorAll('#squad-cards-row .squad-card').length === 5`));
check('starts zoomed out (0.8x)', await ev(`document.getElementById('zoom-label').textContent === '0.8x'`));
check('map preset active', await ev(`document.getElementById('cam-preset-0').classList.contains('is-active')`));
check('tutorial banner shows on first match', await ev(`!document.getElementById('tutorial-banner').classList.contains('hidden')`));

// Help modal opens/closes.
await ev(`document.getElementById('btn-help').click()`); await sleep(50);
check('help modal opens', !(await ev(`document.getElementById('modal-help').classList.contains('hidden')`)));
await ev(`document.getElementById('btn-help-close').click()`); await sleep(50);
check('help modal closes', await ev(`document.getElementById('modal-help').classList.contains('hidden')`));

// Selection switching via pointerdown.
const tap = (i) => `(()=>{const c=document.querySelectorAll('#squad-cards-row .squad-card')[${i}];const r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.x+5,clientY:r.y+5}));})()`;
await ev(tap(0)); await sleep(60);
const name0 = await ev(`document.getElementById('sel-name').textContent`);
await ev(tap(2)); await sleep(60);
const name2 = await ev(`document.getElementById('sel-name').textContent`);
check('selection switches on tap', name0 && name2 && name0 !== name2);

// Pause / resume via speed button (cycle 0.5 -> 1 -> 1.5 -> Pause).
await ev(`document.getElementById('btn-speed').click()`); // 1x
await ev(`document.getElementById('btn-speed').click()`); // 1.5x
await ev(`document.getElementById('btn-speed').click()`); // Pause
await sleep(100);
check('speed shows pause', await ev(`document.getElementById('btn-speed').textContent.includes('⏸')`));
const t1 = await ev(`document.getElementById('hud-timer').textContent`);
await sleep(1200);
const t2 = await ev(`document.getElementById('hud-timer').textContent`);
check('timer frozen while paused', t1 === t2);
await ev(`document.getElementById('btn-speed').click()`); // back to 0.5x
await sleep(1500);
const t3 = await ev(`document.getElementById('hud-timer').textContent`);
check('timer advances after resume', t3 !== t2);

// Resize during gameplay should not throw.
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await sleep(800);
check('desktop shell widened', (await ev(`getComputedStyle(document.getElementById('app-shell')).maxWidth`)) === '1120px');
check('canvas alive after resize', await ev(`document.getElementById('three-canvas').width > 0`));

check('no runtime errors', errors.length === 0);

let ok = true;
for (const c of checks) { if (!c.ok) { ok = false; console.log(`FAIL  ${c.name}`); } else { console.log(`PASS  ${c.name}`); } }
if (!ok || errors.length) {
  console.error('\nErrors:\n' + errors.slice(0, 12).join('\n'));
}
console.log(`\nbrowser: ${checks.filter((c) => c.ok).length}/${checks.length} checks passed`);
ws.close();
chrome.kill();
server.close();
await sleep(300); // let Chrome release its profile lock before cleanup
try { fs.rmSync(userDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* ignore */ }
process.exit(ok && errors.length === 0 ? 0 : 1);
