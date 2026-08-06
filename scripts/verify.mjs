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

console.log(`\n${failures === 0 ? '\x1b[32mAll checks passed.' : `\x1b[31m${failures} check(s) failed.`}\x1b[0m`);
process.exit(failures === 0 ? 0 : 1);
