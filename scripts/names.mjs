// The names check. It refuses the name of a studied third-party product in this repository.
// scripts/names.list holds a SHA-256 hash per name and no name in clear text.
//
//   node scripts/names.mjs              every tracked and untracked file that git does not ignore
//   node scripts/names.mjs --staged     the staged files and their paths (the pre-commit hook)
//   node scripts/names.mjs --loose      every entry matches in any case: a person reviews the hits
//   node scripts/names.mjs --message F  a commit message (the commit-msg hook)
//   printf %s 'Name' | node scripts/names.mjs --hash cap|any   prints the list line for one name
//
// An "any" entry matches in every case. A "cap" entry is an English word as well, so it matches only
// when it starts with a capital letter, or inside a URL or a host name. A name of two words matches
// as two adjacent words: "x.app" reads as "x app".
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LIST = join(dirname(fileURLToPath(import.meta.url)), 'names.list');
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|pdf|zip|gz|woff2?|ttf|otf)$/i;
const URL_RE = /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s<>()"'`\]]+/g;
const HOST_RE = /(?<![\w@./-])(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|app|dev|co|design|sh|ai|so|js)\b/g;

export function sha(s) {
  return createHash('sha256').update(s).digest('hex');
}

/** Lower case, with the words joined by one space. */
function normal(name) {
  return name.split(/[^A-Za-z0-9]+/).filter(Boolean).join(' ').toLowerCase();
}

export function loadList(text) {
  const list = { any: new Set(), cap: new Set() };
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const m = /^(any|cap) ([0-9a-f]{64})$/.exec(line);
    if (!m) throw new Error(`names.list:${i + 1}: expected "any <sha256>" or "cap <sha256>".`);
    list[m[1]].add(m[2]);
  });
  return list;
}

/** Each word and each pair of adjacent words of one line, with its 1-based column. */
export function candidates(line) {
  const spans = [];
  for (const re of [URL_RE, HOST_RE]) for (const m of line.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  const inUrl = (i) => spans.some(([a, b]) => i >= a && i < b);
  const words = [...line.matchAll(/[A-Za-z0-9]+/g)].map((m) => ({ text: m[0], i: m.index }));
  const out = [];
  words.forEach((w, k) => {
    out.push({ text: w.text, col: w.i + 1, inUrl: inUrl(w.i) });
    const next = words[k + 1];
    if (next) out.push({ text: `${w.text} ${next.text}`, col: w.i + 1, inUrl: inUrl(w.i) || inUrl(next.i) });
  });
  return out;
}

export function scan(text, list, o = {}) {
  const hits = [];
  text.split('\n').forEach((line, n) => {
    for (const c of candidates(line)) {
      const h = sha(c.text.toLowerCase());
      const hit = list.any.has(h) || (list.cap.has(h) && (o.loose || c.inUrl || /^[A-Z]/.test(c.text)));
      if (hit) hits.push({ line: n + 1, col: c.col, text: c.text });
    }
  });
  return hits;
}

/** The staged paths (added, copied, modified, renamed), or every file that git does not ignore. */
export function targets(o) {
  const args = o.staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
    : ['ls-files', '-co', '--exclude-standard', '-z'];
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\0').filter(Boolean);
}

function contents(path, staged) {
  if (staged) return execFileSync('git', ['show', `:${path}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return '';
    throw e;
  }
}

function main(argv) {
  if (argv[0] === '--hash') {
    const flag = argv[1];
    if (flag !== 'cap' && flag !== 'any') throw new Error('--hash takes "cap" or "any".');
    const name = normal(readFileSync(0, 'utf8'));
    if (!name) throw new Error('--hash reads one name on stdin.');
    console.log(`${flag} ${sha(name)}`);
    return 0;
  }
  const list = loadList(readFileSync(LIST, 'utf8'));
  const loose = argv.includes('--loose');
  const report = (where, hits) => {
    for (const h of hits) console.error(`${where}:${h.line}:${h.col}: "${h.text}" is on the names list`);
    return hits.length;
  };
  let count = 0;
  if (argv[0] === '--message') {
    const text = readFileSync(argv[1], 'utf8').split('\n').map((l) => (l.startsWith('#') ? '' : l)).join('\n');
    count += report('commit message', scan(text, list, { loose }));
  } else {
    const staged = argv.includes('--staged');
    const files = targets({ staged });
    for (const f of files) {
      count += report(`${f} (path)`, scan(f, list, { loose }));
      if (BINARY.test(f)) continue;
      const text = contents(f, staged);
      if (text.includes('\0')) continue;
      count += report(f, scan(text, list, { loose }));
    }
    if (!count) console.log(`names: no listed name in ${files.length} ${staged ? 'staged ' : ''}files`);
  }
  if (count) console.error(`names: ${count} hits. Name the kind of product instead, for example "a chart library".`);
  return count ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`names: ${e.message}`);
    process.exitCode = 1;
  }
}
