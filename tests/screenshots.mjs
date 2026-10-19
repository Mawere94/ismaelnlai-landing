// Capturas y medidas de la portada con Chrome headless (CDP), sin dependencias.
//
// Uso (con tests/serve.py corriendo en 8790):
//   node ismaelnlai-web/tests/screenshots.mjs <carpeta-salida> [url-base]
//
// No envía formularios ni abre el chat: solo carga páginas y mide.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = process.argv[2] || 'capturas';
const BASE = process.argv[3] || 'http://127.0.0.1:8790';
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(existsSync);
const PORT = 9333;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'isnl-shots-'))}`, 'about:blank'
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
  } catch {}
}
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const waiters = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method) waiters.filter((w) => w.method === m.method).forEach((w) => w.resolve(m.params));
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const i = ++id; pending.set(i, (m) => (m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

await send('Page.enable');
await send('Runtime.enable');

async function load(url) {
  const done = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await done;
  await sleep(1200); // fuentes y la animación corta de la ilustración
}

async function scenario({ name, width, height, mobile = false, consent = null, js = true, reduced = false, full = false, scrollTo = null, path = '/', check = null }) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  await load(BASE + '/404-reset');
  await evaluate(consent ? `localStorage.setItem('cookieConsent', '${consent}')` : 'localStorage.clear()');
  await send('Emulation.setScriptExecutionDisabled', { value: !js });
  await load(BASE + path);
  if (scrollTo) {
    await send('Emulation.setScriptExecutionDisabled', { value: false });
    await evaluate(`document.querySelector('${scrollTo}').scrollIntoView({block:'start'}); new Promise(r=>setTimeout(r,500))`);
    await send('Emulation.setScriptExecutionDisabled', { value: !js });
  }
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  const metrics = await evaluate(`({
    docHeight: document.documentElement.scrollHeight,
    hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    banner: !!document.getElementById('ck-banner'),
    chatBtn: !!document.getElementById('isnl-btn')
  })`);
  if (check) metrics.check = await evaluate(check);
  let shot;
  if (full) {
    const h = metrics.docHeight;
    await send('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: 1, mobile });
    await sleep(400);
    shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
  } else {
    shot = await send('Page.captureScreenshot', { format: 'png' });
  }
  if (name) writeFileSync(join(OUT, name + '.png'), Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify({ name, width, height, js, reduced, consent, ...metrics }));
}

const S = [
  { name: '01-escritorio-1440-primera-visita', width: 1440, height: 900 },
  { name: '02-escritorio-1280x720-primera-visita', width: 1280, height: 720 },
  { name: '03-escritorio-1440-pagina-completa', width: 1440, height: 900, consent: 'denied', full: true },
  { name: '04-movil-390-primera-visita', width: 390, height: 844, mobile: true },
  { name: '05-movil-390-pagina-completa', width: 390, height: 844, mobile: true, consent: 'denied', full: true },
  { name: '06-movil-360-primera-visita', width: 360, height: 800, mobile: true },
  { name: '07-movil-390-demo', width: 390, height: 844, mobile: true, consent: 'denied', scrollTo: '#demo' },
  { name: '08-movil-390-sin-javascript', width: 390, height: 844, mobile: true, js: false, full: true },
  { name: '09-escritorio-1440-movimiento-reducido', width: 1440, height: 900, consent: 'denied', reduced: true },
  { name: '10-movil-390-cta-fijo', width: 390, height: 844, mobile: true, consent: 'denied', check: `(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const cf = document.getElementById('ctaFija'), btn = document.getElementById('isnl-btn');
      const top = { visible: document.body.classList.contains('cta-visible'), inert: cf.inert, aria: cf.getAttribute('aria-hidden') };
      document.getElementById('precios').scrollIntoView({ behavior: 'instant' }); await sleep(500);
      const r1 = cf.getBoundingClientRect(), r2 = btn.getBoundingClientRect();
      const mid = { visible: document.body.classList.contains('cta-visible'), inert: cf.inert, aria: cf.getAttribute('aria-hidden'),
        linkTabbable: cf.querySelector('a').tabIndex, chatAboveBar: r2.bottom <= r1.top };
      return { top, mid };
    })()` },
  { name: '11-movil-390-chat-abierto', width: 390, height: 844, mobile: true, consent: 'denied', check: `(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      document.getElementById('demo').scrollIntoView({ behavior: 'instant' }); await sleep(400);
      document.getElementById('isnl-btn').click(); await sleep(400);
      const p = document.getElementById('isnl-panel').getBoundingClientRect();
      return { panel: [Math.round(p.left), Math.round(p.top), Math.round(p.right), Math.round(p.bottom)], vw: innerWidth, vh: innerHeight,
        barDisplay: getComputedStyle(document.getElementById('ctaFija')).display, focus: document.activeElement.id };
    })()` },
  { name: null, width: 390, height: 844, mobile: true, consent: 'denied', check: `(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      document.documentElement.style.scrollBehavior = 'auto';
      const out = {};
      for (const id of ['demo', 'como-funciona', 'precios', 'faq', 'contacto']) {
        location.hash = ''; scrollTo(0, 0); await sleep(50);
        location.hash = '#' + id; await sleep(150);
        out[id] = Math.round(document.getElementById(id).getBoundingClientRect().top);
      }
      out.header = document.getElementById('mainHeader').offsetHeight;
      return out;
    })()` },
  { name: null, width: 720, height: 450, consent: 'denied' },            // 1440 al 200 %: mismo ancho CSS
  { name: null, width: 1280, height: 720, consent: 'denied', path: '/sobre-mi' },
  { name: null, width: 390, height: 844, mobile: true, consent: 'denied', path: '/verifactu' }
];
for (const s of S) await scenario(s);

ws.close();
proc.kill();
