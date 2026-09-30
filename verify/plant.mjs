// Proves page.mjs can fail: plants one mistake at a time in a copy of
// index.html and checks page.mjs rejects every copy.
//   node verify/plant.mjs
// Exit 1 if any plant gets through. Not needed to run the site.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const base = fs.readFileSync(path.join(HERE, '..', 'index.html'), 'utf8');
// Empty (so reported STALE) unless both markers are still there, in order.
const between = (a, b) => { const i = base.indexOf(a), j = base.indexOf(b); return i >= 0 && j > i ? base.slice(i, j) : ''; };

const PLANTS = {
  'title off by one word': ['title:"Analyze indicators of malicious activity"', 'title:"Analyze indicators of malicious activities"'],
  'domain weight wrong': ['{id:"1.0", name:"Security Operations", weight:34}', '{id:"1.0", name:"Security Operations", weight:33}'],
  'checklist word not in the doc': ['checklist:["SIEM","EDR",', 'checklist:["SIEM","EDR","SPF, DKIM and DMARC",'],
  'objective renumbered': ['{id:"4.1", domain:"4.0", title:"Apply common', '{id:"4.9", domain:"4.0", title:"Apply common'],
  'objective dropped': [between('      {id:"3.3", domain:"3.0", title:"Implement incident response techniques"', '      {id:"4.1", domain:"4.0", title:"Explain the importance of vulnerability management'), ''],
  'unconfirmed caution switched off': ['name: "CompTIA Security+ (V8)",\n    numbersUnconfirmed: true,', 'name: "CompTIA Security+ (V8)",\n    numbersUnconfirmed: false,'],
  'CySA+ back on the CS0-003 key': ['"cysa-v4"', '"cysa"', true],
  'Security+ left disabled': ['<option value="secplus-v8">', '<option value="secplus-v8" disabled>'],
  'script error in the plan': ["function buildStudyAction(o){\n", "function buildStudyAction(o){\n  if(o.title.includes('AI')) throw new Error('planted');\n"],
  'checklist cut short on the day card': ['const checklistHtml = (o.checklist||[]).map(', 'const checklistHtml = (o.checklist||[]).slice(0,3).map(', true],
  'CySA+ title back in the doc wording': ['title:"Summarize the incident response process"', 'title:"Outline the incident response process"'],
  'CySA+ scenario objective marked recall': ['title:"Analyze data to prioritize and mitigate vulnerabilities", roi:true, confuse:true, kind:"scenario"', 'title:"Analyze data to prioritize and mitigate vulnerabilities", roi:true, confuse:true, kind:"recall"'],
  'CySA+ caution back to the whole bank': ['unconfirmedIds: ["1.5","1.6"],', 'numbersUnconfirmed: true,'],
  'CySA+ caution forgets 1.6': ['unconfirmedIds: ["1.5","1.6"]', 'unconfirmedIds: ["1.5"]'],
  'pasted score report not read': ['raw.match(/\\d\\.\\d/g)', 'raw.match(/^\\d\\.\\d/gm)'],
  'header name reverted': ['<div class="brand">Shane&rsquo;s Retake Planner</div>', '<div class="brand">RETAKE OPS PLANNER</div>'],
  'page title reverted': ['<title>Shane&rsquo;s Retake Planner — CWP</title>', '<title>Retake Ops Planner — CWP</title>'],
  'footer removed': [between('<footer class="site-footer">', '<div id="storage-warning"'), ''],
  'footer in the short form': ['Cyber Warrior Program &mdash; built by an instructor, for students, to make certification study more interactive. For educational purposes only.', 'For educational purposes only.'],
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-plant-'));
const file = path.join(dir, 'index.html');
let missed = 0;
for (const [name, [from, to, all]] of Object.entries(PLANTS)) {
  if (!from || !base.includes(from)) { console.log(`STALE  ${name}: its target text is no longer in index.html`); missed++; continue; }
  fs.writeFileSync(file, all ? base.split(from).join(to) : base.replace(from, to));
  let out = '', code = 0;
  try { out = execFileSync('node', [path.join(HERE, 'page.mjs'), file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { out = String(e.stdout || ''); code = e.status || 1; }
  const why = (out.split('\n').find(l => l.startsWith('  - ')) || out.trim().split('\n')[0] || '').trim();
  console.log(`${code ? 'CAUGHT' : 'MISSED'} ${name.padEnd(36)} ${why.slice(0, 120)}`);
  if (!code) missed++;
}
fs.rmSync(dir, { recursive: true, force: true });
console.log(missed ? `${missed} plant(s) got through` : `all ${Object.keys(PLANTS).length} plants caught`);
process.exit(missed ? 1 : 0);
