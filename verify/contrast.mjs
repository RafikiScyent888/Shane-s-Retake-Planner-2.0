// Painted-pixel contrast sweep of the planner's three steps, against AAA:
// 7:1 body text, 4.5:1 for large text (24px, or 18.66px bold). The glyphs are
// hidden, the page is screenshotted, and each run of text is compared with
// the pixels actually under it; the injected style is removed afterwards.
//   node verify/contrast.mjs [exam] [file]   exam defaults to cysa-v4
//   ALL=1 lists every failing run instead of a count per colour.
// Exit 1 if anything is under the floor. Not needed to run the site.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXAM = process.argv[2] || 'cysa-v4';
const FILE = process.argv[3] || path.join(HERE, '..', 'index.html');
const lum = c => { const f = v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
async function contrast(page) {
  const runs = await page.evaluate(() => {
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement; if (el.closest('script,style,#rp-debug,[id*=debug]')) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || !el.offsetParent && cs.position !== 'fixed') continue;
      let op = 1; for (let a = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) if (r.width > 2 && r.height > 2)
        out.push({ t: n.textContent.trim().slice(0, 50), c: cs.color, op, s: parseFloat(cs.fontSize), b: parseInt(cs.fontWeight) >= 700, x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height });
    }
    return out;
  });
  await page.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important} ::placeholder{color:transparent!important}' });
  const png = (await page.screenshot({ fullPage: true })).toString('base64');
  await page.evaluate(() => [...document.querySelectorAll('style')].pop().remove());
  const left = await page.evaluate(() => getComputedStyle(document.body).color);
  if (left === 'rgba(0, 0, 0, 0)') throw new Error('injected style not removed');
  const grounds = await page.evaluate(async ({ png, runs }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + png; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    return runs.map(r => { const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
      const d = g.getImageData(x0, y0, Math.max(1, Math.min(Math.floor(r.w), im.width - x0)), Math.max(1, Math.min(Math.floor(r.h), im.height - y0))).data;
      const px = []; for (let i = 0; i < d.length; i += 16) px.push([d[i], d[i + 1], d[i + 2]]); return px; });
  }, { png, runs });
  const bad = [];
  runs.forEach((r, i) => {
    const m = r.c.match(/\d+(\.\d+)?/g).map(Number); const a = (m.length > 3 ? m[3] : 1) * r.op;
    const need = (r.s >= 24 || (r.b && r.s >= 18.66)) ? 4.5 : 7;
    let worst = 99; for (const bg of grounds[i]) { const fg = [0, 1, 2].map(k => m[k] * a + bg[k] * (1 - a)); worst = Math.min(worst, ratio(fg, bg)); }
    if (worst < need) bad.push(`${worst.toFixed(2)}:1 < ${need}  ${r.c}  "${r.t}"`);
  });
  return { n: runs.length, bad };
}
const DIR = path.dirname(path.resolve(FILE));
const srv = http.createServer((q, r) => fs.readFile(path.join(DIR, q.url.split('?')[0]), (e, b) => { r.writeHead(e ? 404 : 200, { 'content-type': 'text/html' }); r.end(e ? '' : b); })).listen(0);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 900 } })).newPage();
await page.goto(`http://127.0.0.1:${srv.address().port}/${path.basename(FILE)}`);
await page.evaluate(() => localStorage.clear()); await page.reload();
const out = {};
out.step1 = await contrast(page);
await page.fill('#s-name', 'Test Student'); await page.selectOption('#s-exam', EXAM); await page.fill('#s-score', '700');
const d = new Date(); d.setDate(d.getDate() + 40); await page.fill('#s-retake', d.toISOString().slice(0, 10));
await page.click('#step1 button:has-text("Continue")');
await page.fill('#s-paste', '1.1 1.2 2.3 3.1 4.2 9.9'); await page.click('button:has-text("Match objectives")');
out.step2 = await contrast(page);
await page.click('#continue-step3'); out.step3 = await contrast(page);
for (const [k, v] of Object.entries(out)) { console.log(`${k}: ${v.n} runs, ${v.bad.length} under the floor`); if (process.env.ALL) v.bad.forEach(b => console.log("   " + b)); else { const u = {}; v.bad.forEach(b => { const k = b.split("  \"")[0]; u[k] = (u[k]||0) + 1; }); for (const k in u) console.log("   " + u[k] + " x " + k); } }
await browser.close(); srv.close();
process.exit(Object.values(out).some(v => v.bad.length) ? 1 : 0);
