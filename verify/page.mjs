// Drives the planner in Chromium and checks the CySA+ V4, Security+ V8,
// A+ Core 2 V15 and Network+ V9 banks against the owner's objectives doc. objectives-2026-09-29.md is the
// Security+ and CySA+ sections of "All updated Objectives" (Google Doc
// 1C9MhVjNyXHJ_i3mPthaBNRmB3A0_sG8UJmzv_H3Lddo), copied verbatim on
// 29 September 2026. If the doc changes, replace that file first.
// cysa-score-report-2026-09-30.md is the objective list from a real CompTIA
// CySA+ score report. Where it has a number, the CySA+ title and kind are
// checked against CompTIA's wording rather than the doc's.
//   node verify/page.mjs [file]     file defaults to index.html
// Needs Playwright. Not needed to run the site. Exit 1 on any failure.
// node verify/plant.mjs proves each check can fail.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const FILE = process.argv[2] || path.join(HERE, '..', 'index.html');
const DIR = path.dirname(path.resolve(FILE));
const fails = [];
const esc = t => t.replace(/&/g, '&amp;');
const ok = (c, m) => { if (!c) fails.push(m); };

// ---- the doc, parsed ----
// objectives-core2-netplus-2026-09-30.md is the A+ Core 2 and Network+
// sections of the same doc, copied verbatim on 30 September 2026.
const doc = ['objectives-2026-09-29.md', 'objectives-core2-netplus-2026-09-30.md']
  .map(f => fs.readFileSync(path.join(HERE, f), 'utf8')).join('\n').replace(/\\&/g, '&');
const DOC_EXAMS = { 'Security+': 'secplus-v8', 'CySA+': 'cysa-v4', 'A+ Core 2': 'aplus-1202', 'Network+': 'netplus-v9' };
const DOC = {};
let exam = null, dom = null;
for (const line of doc.split('\n')) {
  let m;
  if ((m = line.match(/^## \*\*(Security\+|CySA\+|A\+ Core 2|Network\+)/))) { exam = DOC_EXAMS[m[1]]; DOC[exam] = []; }
  else if ((m = line.match(/^### \*\*(.+) \((\d+)%\)\*\*/))) { dom = { name: m[1], weight: +m[2], objs: [] }; DOC[exam].push(dom); }
  else if ((m = line.match(/^\s+- \*\*(.+?):\*\* (.+?)\s*$/))) dom.objs.push({ title: m[1], desc: m[2] });
}

// ---- the score report, parsed: id -> CompTIA's title ----
const REPORT = {};
for (const line of fs.readFileSync(path.join(HERE, 'cysa-score-report-2026-09-30.md'), 'utf8').split('\n')) {
  const m = line.match(/^- (\d\.\d) (.+?)\.\s*$/);
  if (m) REPORT[m[1]] = m[2];
}
// The planner drops the leading "Given a scenario, " (as the A+ titles do)
// and marks those objectives kind:"scenario".
const reportTitle = t => { const u = t.replace(/^Given a scenario, /, ''); return u[0].toUpperCase() + u.slice(1); };
const reportKind = t => /^Given a scenario, /.test(t) ? 'scenario' : 'recall';

// What a student pastes: the report's own text, wrapped lines and all.
const REPORT_PASTE = `PASSING SCORE: 750
CANDIDATE SCORE: 612
PASS/FAIL: Fail
Before attempting to retake the CompTIA Cybersecurity Analyst (CySA+) Certification Exam, please review the CompTIA Retake Policy below.
The CompTIA Cybersecurity Analyst (CySA+) Certification Exam has a scaled score between 100 and 900.
You incorrectly answered one or more questions in the following objective areas:
` + Object.entries(REPORT).map(([id, t]) => {
  const words = `${id} ${t}.`.split(' '); const out = []; let line = '•  ';
  for (const w of words) { if ((line + w).length > 72) { out.push(line.trimEnd()); line = '        '; } line += w + ' '; }
  out.push(line.trimEnd()); return out.join('\n');
}).join('\n');

// "Doc wording only": every word of a checklist item must come from that
// objective's own title or description, allowing plain inflection and a
// few joining words.
const GLUE = new Set(['on', 'in', 'that', 'the', 'to', 'of', 'and', 'across', 'how', 'metric', 'target', 'with']);
// Short words (class "E", "IP") are left whole, or trimming would empty them.
const stem = w => { const t = w.toLowerCase().replace(/[^a-z0-9&+-]/g, ''); return t.length > 3 ? t.replace(/(ing|es|ed|s|e)$/, '') : t; };
function foreignWords(item, o) {
  const src = (o.title + ' ' + o.desc + ' ' + (o.official || '')).split(/[\s,():\/]+/).map(stem).filter(Boolean);
  const same = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));
  return item.split(/[\s,():\/]+/).filter(w => w && !GLUE.has(w.toLowerCase()) && !src.some(x => same(x, stem(w))));
}

// ---- serve ----
const srv = http.createServer((q, r) => {
  const f = path.join(DIR, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': 'text/html' }); r.end(b); } });
}).listen(0);
const URL = `http://127.0.0.1:${srv.address().port}/${path.basename(FILE)}`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
// Resource failures are the container's proxy blocking Google Fonts, not the page.
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });

await page.goto(URL);
const E = await page.evaluate(() => EXAM_DATA);

// ---- the program footer, full wording, on the page every step shares ----
const FOOT = 'Cyber Warrior Program — built by an instructor, for students, to make certification study more interactive. For educational purposes only. Not affiliated with, endorsed by, or sponsored by CompTIA®. All trademarks belong to their respective owners.';
const footer = async where => {
  const t = await page.evaluate(() => { const f = document.querySelector('footer.site-footer'); return f && f.offsetParent !== null ? f.textContent.replace(/\s+/g, ' ').trim() : null; });
  ok(t === FOOT, `footer missing or wrong on ${where}: ${t === null ? 'not visible' : JSON.stringify(t.slice(0, 80))}`);
};
await footer('step 1');

// ---- bank vs doc ----
const NEW_BANKS = ['cysa-v4', 'secplus-v8', 'aplus-1202', 'netplus-v9'];
const PASS = { 'cysa-v4': 750, 'secplus-v8': 750, 'aplus-1202': 700, 'netplus-v9': 725 };
for (const id of NEW_BANKS) {
  const bank = E[id], want = DOC[id];
  ok(want && want.length, `${id}: no section for it in the saved doc`);
  ok(bank, `${id}: bank missing`);
  if (!bank || !want) continue;
  if (id === 'cysa-v4') {
    const notOnReport = bank.objectives.map(o => o.id).filter(x => !(x in REPORT));
    ok(bank.numbersUnconfirmed !== true, `${id}: whole bank still marked unconfirmed although the score report confirms ${Object.keys(REPORT).length}`);
    ok(JSON.stringify(bank.unconfirmedIds || []) === JSON.stringify(notOnReport), `${id}: unconfirmedIds ${JSON.stringify(bank.unconfirmedIds)} should be exactly the ids not on the report, ${JSON.stringify(notOnReport)}`);
  } else ok(bank.numbersUnconfirmed === true, `${id}: numbersUnconfirmed not set`);
  ok(bank.domains.length === want.length, `${id}: ${bank.domains.length} domains, doc has ${want.length}`);
  ok(bank.objectives.length === want.reduce((a, d) => a + d.objs.length, 0), `${id}: objective count differs from doc`);
  want.forEach((d, i) => {
    const bd = bank.domains[i];
    ok(bd && bd.id === `${i + 1}.0` && bd.name.toLowerCase() === d.name.toLowerCase() && bd.weight === d.weight, `${id}: domain ${i + 1} is ${JSON.stringify(bd)}, doc ${d.name} ${d.weight}`);
    const bo = bank.objectives.filter(o => o.domain === `${i + 1}.0`);
    ok(bo.length === d.objs.length, `${id} ${i + 1}.0: ${bo.length} objectives, doc ${d.objs.length}`);
    d.objs.forEach((o, j) => {
      const b = bo[j];
      if (!b) return;
      ok(b.id === `${i + 1}.${j + 1}`, `${id}: expected ${i + 1}.${j + 1}, got ${b.id}`);
      if (id === 'cysa-v4' && REPORT[b.id]) {
        o.official = REPORT[b.id];
        ok(b.title === reportTitle(REPORT[b.id]), `${id} ${b.id}: title "${b.title}" is not the score report's "${reportTitle(REPORT[b.id])}"`);
        ok(b.kind === reportKind(REPORT[b.id]), `${id} ${b.id}: kind "${b.kind}", but the score report says ${reportKind(REPORT[b.id])}`);
      } else ok(b.title === o.title, `${id} ${b.id}: title "${b.title}" is not the doc's "${o.title}"`);
      ok(Array.isArray(b.checklist) && b.checklist.length >= 1, `${id} ${b.id}: checklist empty`);
      ok(typeof b.tip === 'string' && b.tip.length > 20, `${id} ${b.id}: tip missing`);
      ok(b.kind === 'recall' || b.kind === 'scenario', `${id} ${b.id}: bad kind`);
      for (const c of b.checklist || []) {
        const fw = foreignWords(c, o);
        ok(!fw.length, `${id} ${b.id}: checklist "${c}" has words not in the doc: ${fw.join(', ')}`);
      }
    });
  });
  const pass = await page.evaluate(k => PASSING_SCORES[k], id);
  ok(pass === PASS[id], `${id}: passing score ${pass}, want ${PASS[id]}`);
}
ok(!('cysa' in E), 'old "cysa" (CS0-003) bank still present');

// ---- the name: Shane's Retake Planner ----
const NAME = 'Shane\u2019s Retake Planner';
const brand = await page.evaluate(() => { const b = document.querySelector('header.top .brand'); return b && b.offsetParent !== null ? b.textContent.trim() : null; });
ok(brand === NAME, `header name is ${JSON.stringify(brand)}, want "${NAME}"`);
ok(await page.title() === `${NAME} — CWP`, `page title is "${await page.title()}"`);

// ---- dropdown ----
const opts = await page.$$eval('#s-exam option', os => os.map(o => ({ v: o.value, t: o.textContent.trim(), d: o.disabled })));
ok(!opts.some(o => o.d), `dropdown: still has a disabled option: ${opts.filter(o => o.d).map(o => o.t).join(', ')}`);
for (const id of ['aplus-1201', ...NEW_BANKS]) {
  const o = opts.find(x => x.v === id);
  ok(o && !o.d, `dropdown: ${id} missing or disabled`);
  if (o) ok(o.t === E[id].name, `dropdown: "${o.t}" doesn't match bank name "${E[id].name}"`);
}
ok(!opts.some(o => /CS0-003|SY0-701/.test(o.t)), 'dropdown still names an old exam code');

// ---- drive each exam end to end ----
async function start(id) {
  page.setDefaultTimeout(5000);
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL);
  await page.fill('#s-name', 'Test Student');
  await page.selectOption('#s-exam', id);
  await page.fill('#s-score', '700');
  const d = new Date(); d.setDate(d.getDate() + 40);
  await page.fill('#s-retake', d.toISOString().slice(0, 10));
  await page.click('#step1 button:has-text("Continue")');
  await page.waitForSelector('#step2', { state: 'visible' });
}
for (const id of ['aplus-1201', ...NEW_BANKS]) try {
  await start(id);
  const bank = E[id];
  const caution = (await page.textContent('#numbers-caution')).trim();
  const some = bank.unconfirmedIds || [];
  if (bank.numbersUnconfirmed) ok(/Check the titles, not just the numbers/.test(caution) && caution.includes(bank.name), `${id}: caution not shown`);
  else if (some.length) {
    const listed = some.length > 1 ? some.slice(0, -1).join(', ') + ' and ' + some[some.length - 1] : some[0];
    ok(caution.startsWith(`Check the titles for ${listed}.`) && caution.includes('match a real CompTIA score report'), `${id}: caution should name ${listed} only, got ${JSON.stringify(caution.slice(0, 90))}`);
  } else ok(caution === '', `${id}: caution shown on a confirmed exam`);

  // headings and rows as rendered
  const heads = await page.$$eval('#manual-adjust .domain-block h4', hs => hs.map(h => h.textContent.trim()));
  ok(heads.length === bank.domains.length, `${id}: ${heads.length} domain headings rendered`);
  bank.domains.forEach((d, i) => ok(heads[i] === `${d.id} ${d.name} — ${d.weight}%`, `${id}: heading "${heads[i]}"`));
  const rows = await page.$$eval('#manual-adjust .obj-check input', is => is.map(i => i.value));
  ok(rows.join() === bank.objectives.map(o => o.id).join(), `${id}: rendered rows ${rows.join()}`);

  // paste every id plus a stray number, as a score report would
  await page.fill('#s-paste', bank.objectives.map(o => `${o.id} ${o.title}`).join('\n') + '\n9.9 not an objective');
  await page.click('button:has-text("Match objectives")');
  const matched = await page.$$eval('#match-results .chip:not(.unmatched)', cs => cs.map(c => c.textContent));
  const unmatched = await page.$$eval('#match-results .chip.unmatched', cs => cs.map(c => c.textContent));
  ok(matched.length === bank.objectives.length, `${id}: matched ${matched.length}/${bank.objectives.length}`);
  ok(unmatched.join() === '9.9', `${id}: unmatched ${unmatched.join()}`);

  // the real score report's text, pasted as a student would paste it
  if (id === 'cysa-v4') {
    await page.evaluate(() => { state.selectedIds.clear(); });
    await page.fill('#s-paste', REPORT_PASTE);
    await page.click('button:has-text("Match objectives")');
    const got = await page.$$eval('#match-results .chip:not(.unmatched)', cs => cs.map(c => c.textContent));
    const odd = await page.$$eval('#match-results .chip.unmatched', cs => cs.map(c => c.textContent));
    ok(got.join() === Object.keys(REPORT).join() && !odd.length, `${id}: pasting the score report matched [${got}] and couldn't match [${odd}]`);
    const tickedTitles = await page.$$eval('#manual-adjust .obj-check', ls => ls.filter(l => l.querySelector('input').checked).map(l => l.querySelector('input').value));
    ok(tickedTitles.join() === Object.keys(REPORT).join(), `${id}: after pasting the report, ticked ${tickedTitles}`);
    await page.fill('#s-paste', bank.objectives.map(o => o.id).join(' '));
    await page.click('button:has-text("Match objectives")');
  }
  const ticked = await page.$$eval('#manual-adjust .obj-check input:checked', is => is.length);
  ok(ticked === bank.objectives.length, `${id}: ${ticked} ticked after matching`);
  ok(/Check the titles/.test(await page.textContent('#numbers-caution')) === !!(bank.numbersUnconfirmed || (bank.unconfirmedIds || []).length), `${id}: caution lost after matching`);

  await footer(`${id} step 2`);
  await page.click('#continue-step3');
  await page.waitForSelector('#step3', { state: 'visible' });
  await footer(`${id} step 3`);
  const planIds = await page.evaluate(() => [...new Set(state.planDays.flatMap(d => (d.objectives || []).map(o => o.id)))]);
  ok(planIds.length === bank.objectives.length, `${id}: plan covers ${planIds.length}/${bank.objectives.length}`);
  // open every study day and check its tip and checklist render
  const nDays = await page.evaluate(() => state.planDays.length);
  const seen = new Set();
  for (let i = 0; i < nDays; i++) {
    const html = await page.evaluate(i => { state.expandedDay = i; renderAccordion(); return document.body.innerHTML; }, i);
    for (const o of bank.objectives) if (html.includes(esc(o.tip)) && o.checklist.every(c => html.includes(`<span class="check-tag">${c.replace(/&/g, '&amp;')}</span>`))) seen.add(o.id);
  }
  // days lock until their date, so fast-forward through them
  if (seen.size < bank.objectives.length) {
    for (let i = 0; i < nDays; i++) {
      const html = await page.evaluate(i => { window.__rpDebugOffset = i; state.expandedDay = i; renderAccordion(); return document.body.innerHTML; }, i);
      for (const o of bank.objectives) if (html.includes(esc(o.tip)) && o.checklist.every(c => html.includes(`<span class="check-tag">${c.replace(/&/g, '&amp;')}</span>`))) seen.add(o.id);
    }
  }
  ok(seen.size === bank.objectives.length, `${id}: tip+checklist rendered for ${seen.size}/${bank.objectives.length} (missing ${bank.objectives.filter(o => !seen.has(o.id)).map(o => o.id).join(' ')})`);

  // it saved; a reload offers it back and resume restores the same plan
  await page.goto(URL);
  const banner = await page.textContent('#resume-banner');
  ok(banner.includes(bank.name), `${id}: resume banner "${banner.trim().slice(0, 60)}"`);
  await page.click('button:has-text("Resume my plan")');
  const back = await page.evaluate(() => [...new Set(state.planDays.flatMap(d => (d.objectives || []).map(o => o.id)))].length);
  ok(back === bank.objectives.length, `${id}: resumed plan covers ${back}`);
} catch (e) { ok(false, `${id}: could not drive the page — ${e.message.split('\n')[0]}`); }

// ---- a CS0-003 plan saved under the old key is never reopened ----
await page.evaluate(() => {
  localStorage.clear();
  const d = new Date(); d.setDate(d.getDate() + 10);
  localStorage.setItem('retakePlanner_v1_cysa', JSON.stringify({ schemaVersion: 1, studentInfo: { name: 'Old', exam: 'cysa', score: '700', retake: d.toISOString().slice(0, 10) }, selectedIds: ['2.5', '3.3'], planDaysMeta: [{ type: 'study', objectiveIds: ['2.5'] }], startDate: new Date().toISOString().slice(0, 10), completedDayIndices: [] }));
});
await page.goto(URL);
ok((await page.textContent('#resume-banner')).trim() === '', 'an old CS0-003 plan was offered for resume against the new numbers');

ok(!errors.length, 'script errors: ' + errors.join(' | '));
await browser.close(); srv.close();
if (fails.length) { console.log('FAIL ' + fails.length); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('PASS — all checks');
