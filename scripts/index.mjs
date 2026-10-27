// The index of DESIGN.md. It writes DESIGN.index.md: the first and the last line of the front matter and
// of each of its top-level keys, of each "## " section and of each "### " heading, in the order of the file.
//
//   node scripts/index.mjs           writes DESIGN.index.md
//   node scripts/index.mjs --check   writes nothing, and exits 1 when DESIGN.index.md differs from what it would write
//   node scripts/index.mjs --dry-run writes nothing, and exits 1 when the index cannot be built
//
// Run it from the root of the repository: it reads DESIGN.md and package.json there. The "version" script of
// package.json runs it, so that "npm version" puts a fresh index into the release commit and its tag.
//
// An entry ends on the line before the next entry of the same or a higher level, or on the last line of its
// parent. The front matter ends on its closing "---" line, and its last key ends on the line before it. A "#"
// line inside a code fence is not a heading.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readSource, readDesign, splitFrontMatter } from './lib/design.mjs';

const OUT = 'DESIGN.index.md';
const KEY = /^([A-Za-z0-9_-]+):(?:\s|$)/;
const HEADING = /^(##|###)[ \t]/;
const FENCE = /^\s*(`{3,}(?=[^`]*$)|~{3,})(.*)$/;

/** [first, last] for each start line. A range ends on the line before the next start, the last one on `end`. */
function ranges(starts, end) {
  return starts.map((first, i) => [first, i + 1 < starts.length ? starts[i + 1] - 1 : end]);
}

/** The entries of the index, in the order of the file: { depth, first, last, name }. Lines are 1-based. */
export function entries(text) {
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop(); // The newline at the end of the file starts no line.
  const close = splitFrontMatter(text).bodyLine - 1;

  const keyLines = [];
  const names = [];
  for (let n = 2; n < close; n++) {
    const m = KEY.exec(lines[n - 1]);
    if (m) {
      keyLines.push(n);
      names.push(m[1]);
    }
  }
  const parsed = Object.keys(readDesign(text).front);
  if (names.join(',') !== parsed.join(',')) {
    throw new Error(`DESIGN.md: the keys at column 0 of the front matter (${names.join(', ')}) differ from the keys that yaml reads (${parsed.join(', ')}). Write each top-level key at column 0, with no quotes.`);
  }

  const heads = [];
  let fence = null;
  let fenceLine = 0;
  for (let n = close + 1; n <= lines.length; n++) {
    const line = lines[n - 1];
    const f = FENCE.exec(line);
    if (f) {
      if (!fence) { fence = f[1]; fenceLine = n; }
      else if (f[1][0] === fence[0] && f[1].length >= fence.length && /^\s*$/.test(f[2])) fence = null;
      continue;
    }
    if (fence) continue;
    const h = HEADING.exec(line);
    if (h) heads.push({ depth: h[1].length - 1, first: n, name: line.replace(/[ \t]+#+[ \t]*$/, '').trimEnd() });
  }
  if (fence) throw new Error(`DESIGN.md:${fenceLine}: the code fence ${fence} has no closing line, so the headings after it are not in the index.`);
  if (heads.length && heads[0].depth === 2) {
    throw new Error(`DESIGN.md:${heads[0].first}: "${heads[0].name}" comes before the first "## " section, so it has no section.`);
  }

  const out = [{ depth: 1, first: 1, last: close, name: 'front matter' }];
  ranges(keyLines, close - 1).forEach(([first, last], i) => out.push({ depth: 2, first, last, name: `\`${names[i]}\`` }));
  const sections = heads.filter((h) => h.depth === 1);
  ranges(sections.map((s) => s.first), lines.length).forEach(([first, last], i) => {
    out.push({ depth: 1, first, last, name: sections[i].name });
    const subs = heads.filter((h) => h.depth === 2 && h.first > first && h.first <= last);
    ranges(subs.map((s) => s.first), last).forEach(([f, l], k) => out.push({ depth: 2, first: f, last: l, name: subs[k].name }));
  });
  return out;
}

/** The text of DESIGN.index.md for one DESIGN.md and one version of package.json. */
export function render(buffer, version) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const rows = entries(buffer.toString('utf8')).map((e) => `${'  '.repeat(e.depth - 1)}- ${e.first}-${e.last} ${e.name}`);
  const head = [
    '# Index of DESIGN.md',
    '',
    `This index was written at version ${version} of \`package.json\`, from a \`DESIGN.md\` whose SHA-256 starts with \`${hash}\`. When the hash differs, run \`npm run index\` to write it again.`,
    '',
  ];
  return { text: [...head, ...rows, ''].join('\n'), hash, count: rows.length, headLines: head.length };
}

function main(argv) {
  const unknown = argv.filter((a) => a !== '--check' && a !== '--dry-run');
  if (unknown.length) throw new Error(`unknown argument "${unknown[0]}". Give no argument to write ${OUT}, --check to compare it, or --dry-run to count the entries.`);
  let buffer;
  try {
    buffer = readFileSync('DESIGN.md');
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('DESIGN.md not found. Run this from the root of the repository.');
    throw e;
  }
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const { text, hash, count, headLines } = render(buffer, version);

  if (argv.includes('--dry-run')) {
    console.log(`index: DESIGN.md gives ${count} entries, ${hash}; nothing written`);
    return 0;
  }
  if (!argv.includes('--check')) {
    writeFileSync(OUT, text);
    console.log(`index: wrote ${OUT}, ${count} entries for DESIGN.md ${hash}`);
    return 0;
  }
  const found = readSource(OUT);
  if (found === null) {
    console.error(`index: ${OUT} does not exist. Run "npm run index".`);
    return 1;
  }
  const want = text.split('\n');
  const have = found.split(/\r?\n/);
  // The rows before the head: an edit of DESIGN.md always changes the hash in the head, and a reader acts on the row.
  const order = [...Array(Math.max(want.length, have.length)).keys()].sort((a, b) => (a < headLines) - (b < headLines) || a - b);
  for (const i of order) {
    if (want[i] === have[i]) continue;
    const show = (s) => (s === undefined ? 'no line' : `"${s}"`);
    console.error(`index: ${OUT}:${i + 1} holds ${show(have[i])}, and DESIGN.md gives ${show(want[i])}. Run "npm run index".`);
    return 1;
  }
  console.log(`index: ${OUT} matches DESIGN.md ${hash}, ${count} entries`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`index: ${e.message}`);
    process.exitCode = 1;
  }
}
