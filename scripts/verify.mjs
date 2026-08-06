// Regression check for output/driver-guide-*.html. Run after any edit to these
// files (by hand or by remediate-html.mjs) and before committing/publishing:
//
//   node scripts/verify.mjs
//
// Exits non-zero if anything fails. This exists because this repo has, more
// than once, had a file quietly revert to a broken state between sessions
// (JS syntax errors, the language-toggle CSS losing its !important, leftover
// PDF-extraction debris) without anyone touching it directly. This script
// makes that fast to catch instead of requiring a full manual re-audit.

import fs from 'node:fs';
import vm from 'node:vm';

const files = [
  'output/driver-guide-english.html',
  'output/driver-guide-bengali.html',
  'output/driver-guide-unified.html',
];

let failures = 0;
function ok(label) { console.log(`  \x1b[32m✓\x1b[0m ${label}`); }
function fail(label, detail) {
  failures++;
  console.log(`  \x1b[31m✗ ${label}\x1b[0m${detail ? '\n      ' + detail : ''}`);
}

const html_en = fs.readFileSync('output/driver-guide-english.html', 'utf8');
const html_bn = fs.readFileSync('output/driver-guide-bengali.html', 'utf8');
const html_uni = fs.readFileSync('output/driver-guide-unified.html', 'utf8');

for (const file of files) {
  console.log(`\n${file}`);
  if (!fs.existsSync(file)) { fail('file exists'); continue; }
  const html = fs.readFileSync(file, 'utf8');

  // 1. Every <script> block must be syntactically valid.
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let scriptsOk = true;
  for (const [i, src] of scripts.entries()) {
    try {
      new vm.Script(src);
    } catch (e) {
      scriptsOk = false;
      fail(`script block ${i} parses`, e.message);
    }
  }
  if (scriptsOk && scripts.length) ok(`${scripts.length} script block(s) parse cleanly`);
  if (!scripts.length) fail('has at least one <script> block', 'expected gradeQuiz/checkExam to be defined');

  // 2. Unified-only: language toggle must be self-consistent.
  if (file.includes('unified')) {
    const hasImportant = /\.bn-text \{ display: block !important; \}/.test(html)
      && /\.en-text \{ display: none !important; \}/.test(html)
      && /body\.bn-mode \.en-text \{ display: block !important; \}/.test(html)
      && /body\.bn-mode \.bn-text \{ display: none !important; \}/.test(html);
    if (hasImportant) ok('toggle CSS has !important on all 4 base rules');
    else fail('toggle CSS has !important on all 4 base rules', 'a more specific selector elsewhere (e.g. ".toc a") can silently win and show both languages at once');

    const conflicting = /(?<!body\.bn-mode )\.bn-text \{ display: none !important; \}/.test(html);
    if (!conflicting) ok('no conflicting .bn-text override');
    else fail('no conflicting .bn-text override', 'found a bare .bn-text (not scoped to body.bn-mode) that forces Bengali hidden regardless of mode');

    if (scripts.some(s => /nowShowingEnglish/.test(s))) ok('toggleLang() uses correct show-English semantics');
    else fail('toggleLang() uses correct show-English semantics', 'variable naming inverted relative to the CSS before; check toggleLang()/loadProgress() by hand');
  }

  // 3. No leftover PDF-extraction / cover-graphic debris.
  const badPatterns = [
    [/CHAPTER \d/, 'leftover "CHAPTER N" divider fragment'],
    [/অধ্যায় \d/, 'leftover Bengali chapter divider fragment'],
    [/EVERGREEN STATE|TABMONTHWASHINGTON/, 'leftover license-plate graphic fragment'],
    [/\/gid\d+/, 'leftover PDF object ID'],
    [/\.{10,}/, 'dot-leader table-of-contents fragment'],
    [/520-400 \(R\/4\/25\)/, 'leftover form/revision code'],
  ];
  let debrisFound = false;
  for (const [pattern, label] of badPatterns) {
    if (pattern.test(html)) { fail(`no ${label}`); debrisFound = true; }
  }
  if (!debrisFound) ok('no known leftover extraction debris');

  // 4. Glued-word artifacts (e.g. "PassengersDrugs", "environmentWhen").
  const bodyOnly = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const text = bodyOnly.replace(/<[^>]+>/g, ' ');
  const glued = [
    ...text.matchAll(/\b[a-z]{2,}[A-Z][a-z]{1,}\b/g),
    ...text.matchAll(/\b[A-Z][a-z]{2,}[A-Z][a-z]{2,}\b/g),
  ].map(m => m[0]).filter(w => w !== 'LifeCenter' && !/^LanguageAccess$/.test(w));
  if (!glued.length) ok('no glued-word artifacts');
  else fail('no glued-word artifacts', glued.join(', '));

  // Bengali character glued directly to a Latin character with no space —
  // a strong signal of corrupted/garbled machine translation (as opposed to
  // a deliberately English term like "BAC" or "LifeCenter Northwest", which
  // always has normal word boundaries around it).
  const gluedBnEn = [...new Set(text.match(/[ঀ-৿][a-zA-Z]+|[a-zA-Z]+[ঀ-৿]/g) || [])];
  if (!gluedBnEn.length) ok('no glued Bengali/Latin corruption');
  else fail('no glued Bengali/Latin corruption', gluedBnEn.join(', '));

  // 5. table.comparison structural sanity: every table has thead+tbody, and
  //    every row has the same cell count as the header.
  const tables = [...html.matchAll(/<table class="comparison"[^>]*>([\s\S]*?)<\/table>/g)];
  let tablesOk = true;
  for (const [i, m] of tables.entries()) {
    const t = m[1];
    const headerCells = [...t.matchAll(/<th>/g)].length;
    const rows = [...t.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1); // skip header row
    for (const row of rows) {
      const cellCount = [...row[1].matchAll(/<td>/g)].length;
      if (cellCount !== headerCells) {
        tablesOk = false;
        fail(`table ${i} rows match header column count`, `header has ${headerCells} columns, a row has ${cellCount}`);
      }
    }
  }
  if (tablesOk) ok(`${tables.length} comparison table(s) structurally sound`);

  // 6. Practice exam present with the expected question count.
  const examQuestions = [...html.matchAll(/class="exam-question/g)].length;
  if (examQuestions === 47) ok('practice exam has all 47 questions');
  else fail('practice exam has all 47 questions', `found ${examQuestions}`);
  const examDataMatch = html.match(/const EXAM_DATA = (\[[\s\S]*?\]);/);
  if (examDataMatch) {
    try {
      const data = JSON.parse(examDataMatch[1]);
      if (data.length === 47) ok('EXAM_DATA has 47 entries');
      else fail('EXAM_DATA has 47 entries', `found ${data.length}`);
    } catch (e) {
      fail('EXAM_DATA is valid JSON', e.message);
    }
  } else {
    fail('EXAM_DATA present');
  }

  // 7. No leaked local file paths (a print-to-pdf / dev artifact check).
  if (!/file:\/\/|\/Users\/[a-z]+\//.test(html)) ok('no leaked local file paths');
  else fail('no leaked local file paths');
}

// 8. Cross-edition parity: heading structure must match across all three files.
{
  const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const h3sOf = (html, re) => {
    const out = {};
    for (const m of html.matchAll(/<section id="(sec\d+)">([\s\S]*?)<\/section>/g)) {
      out[m[1]] = [...m[2].matchAll(re)].map(x => strip(x[1]));
    }
    return out;
  };
  const enH3 = h3sOf(html_en, /<h3>([\s\S]*?)<\/h3>/g);
  const bnH3 = h3sOf(html_bn, /<h3>([\s\S]*?)<\/h3>/g);
  const uniH3 = h3sOf(html_uni, /<h3 class="en-text">([\s\S]*?)<\/h3>/g);
  let parityOk = true;
  for (const sid of Object.keys(enH3)) {
    const e = enH3[sid].length;
    const b = (bnH3[sid] || []).length;
    const u = (uniH3[sid] || []).length;
    if (e !== b || e !== u) {
      parityOk = false;
      fail(`h3 parity ${sid}`, `english=${e} bengali=${b} unified=${u}`);
    }
  }
  if (parityOk) ok(`h3 counts match across all 3 editions (${Object.keys(enH3).length} sections)`);

  // h2 parity: compare the h2 of each numbered content section (sec0..secN).
  const secH2 = (html, h2re) => {
    const out = {};
    for (const m of html.matchAll(/<section id="(sec\d+)">([\s\S]*?)<\/section>/g)) {
      if (m[2].includes('class="quiz"')) continue;
      const h = m[2].match(h2re);
      if (h) out[m[1]] = h[1].replace(/<[^>]+>/g, '').trim();
    }
    return out;
  };
  const sh2_en = secH2(html_en, /<h2[^>]*>([\s\S]*?)<\/h2>/);
  const sh2_bn = secH2(html_bn, /<h2[^>]*>([\s\S]*?)<\/h2>/);
  const sh2_uni = secH2(html_uni, /<h2 class="en-text">([\s\S]*?)<\/h2>/);
  const missingBn = Object.keys(sh2_en).filter(s => !sh2_bn[s]);
  const missingUni = Object.keys(sh2_en).filter(s => !sh2_uni[s]);
  if (!missingBn.length && !missingUni.length) ok(`section h2 parity across editions (${Object.keys(sh2_en).length} sections)`);
  else fail('section h2 parity across editions', `bn missing: ${missingBn} | unified missing: ${missingUni}`);

  // TOC anchor coverage: every section id must appear in the TOC
  for (const [name, html] of [['english', html_en], ['bengali', html_bn], ['unified', html_uni]]) {
    const secs = new Set([...html.matchAll(/<section id="(sec\d+)"/g)].map(m => m[1]));
    const toc = new Set([...html.matchAll(/href="#(sec\d+)"/g)].map(m => m[1]));
    const missing = [...secs].filter(s => !toc.has(s) && s !== 'sec0');
    if (!missing.length) ok(`${name}: TOC covers all sections`);
    else fail(`${name}: TOC covers all sections`, missing.join(', '));
  }

  // Bengali edition: no visible English left in mini-quiz legends/labels
  const bnBody = html_bn.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const visible = bnBody.replace(/<span class="en-text">[\s\S]*?<\/span>/g, '').replace(/<[^>]+class="en-text"[^>]*>[\s\S]*?<\/[^>]+>/g, '');
  const quizZone = visible.match(/id="quiz-sec1"[\s\S]*?id="practice-exam"/);
  if (quizZone) {
    const englishLeft = [...quizZone[0].matchAll(/>([A-Z][A-Za-z ,'\?]{25,})</g)].map(m => m[1]);
    if (!englishLeft.length) ok('bengali: no visible English in mini-quiz zone');
    else fail('bengali: no visible English in mini-quiz zone', englishLeft.slice(0, 5).join(' | '));
  }

  // unified: every en-text h2/h3 has a bn-text sibling (quiz/exam h2s wrap
  // both languages inside a single h2, so count only bare-pair headings)
  const enHeads = (html_uni.match(/<h[23] class="en-text">/g) || []).length;
  const bnHeads = (html_uni.match(/<h[23] class="bn-text">/g) || []).length;
  if (Math.abs(enHeads - bnHeads) <= 1) ok(`unified: en/bn heading pairs balanced (en=${enHeads} bn=${bnHeads})`);
  else fail('unified: en/bn heading pairs balanced', `en=${enHeads} bn=${bnHeads}`);
}

// 9. output/ and docs/ must not drift apart.
{
  for (const f of ['english', 'bengali', 'unified']) {
    const a = `output/driver-guide-${f}.html`;
    const b = `docs/driver-guide-${f}.html`;
    if (!fs.existsSync(b)) { fail(`docs/${f} exists`); continue; }
    if (fs.readFileSync(a, 'utf8') === fs.readFileSync(b, 'utf8')) ok(`docs/${f}.html in sync with output/`);
    else fail(`docs/${f}.html in sync with output/`, 'copies differ — republish from output/ to docs/');
  }
}

console.log(`\n${failures === 0 ? '\x1b[32mAll checks passed.' : `\x1b[31m${failures} check(s) failed.`}\x1b[0m`);
process.exit(failures === 0 ? 0 : 1);
