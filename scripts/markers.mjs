// The conflict marker check. It refuses a merge conflict block that a person left in a file.
//
//   node scripts/markers.mjs            every tracked and untracked file that git does not ignore
//   node scripts/markers.mjs --staged   the staged files (the pre-commit hook)
//
// A line that starts with seven "<" alone or followed by a space, or with seven ">" alone or followed
// by a space, is a hit. A line of seven "=" alone is a hit between those two, and in every file that
// is not Markdown, because under a text line the same line is a setext heading in Markdown. Binary
// files and node_modules are skipped.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|pdf|zip|gz|woff2?|ttf|otf)$/i;
const OPEN = new RegExp(`^${'<'.repeat(7)}(?:\\s|$)`);
const MID = '='.repeat(7);
const CLOSE = new RegExp(`^${'>'.repeat(7)}(?:\\s|$)`);

/** The 1-based line numbers and the kind of each marker line of one text. */
export function scan(text, path = '') {
  const hits = [];
  let open = false;
  text.split('\n').forEach((raw, n) => {
    const line = raw.replace(/\r$/, '');
    if (OPEN.test(line)) {
      hits.push({ line: n + 1, kind: 'start of a conflict block' });
      open = true;
    } else if (line === MID && (open || !/\.(md|markdown)$/i.test(path))) {
      hits.push({ line: n + 1, kind: 'middle of a conflict block' });
    } else if (CLOSE.test(line)) {
      hits.push({ line: n + 1, kind: 'end of a conflict block' });
      open = false;
    }
  });
  return hits;
}

function targets(staged) {
  const args = staged
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
    : ['ls-files', '-co', '--exclude-standard', '-z'];
  return [...new Set(execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\0').filter(Boolean))];
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
  const staged = argv.includes('--staged');
  const files = targets(staged).filter((f) => !BINARY.test(f) && !/(^|\/)node_modules\//.test(f));
  let count = 0;
  for (const f of files) {
    const text = contents(f, staged);
    if (text.includes('\0')) continue;
    for (const h of scan(text, f)) {
      console.error(`${f}:${h.line}: ${h.kind}`);
      count++;
    }
  }
  if (count) console.error(`markers: ${count} conflict marker lines. Resolve the conflict and delete the marker lines.`);
  else console.log(`markers: no conflict marker in ${files.length} ${staged ? 'staged ' : ''}files`);
  return count ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`markers: ${e.message}`);
    process.exitCode = 1;
  }
}
