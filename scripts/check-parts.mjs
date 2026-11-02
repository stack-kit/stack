// The filter of "npm run check:parts". It reads the machine output of svelte-check on stdin, and it
// fails closed. It exits 0 when no error is in the shipped paths or elsewhere. It exits 1 when a
// shipped path, or a path that is neither shipped nor a registry file, holds an error. It exits 2
// when the output is not complete: no COMPLETED line, a count of 0 files, or an error count that
// differs from the number of ERROR lines that it parsed. A path is relative to preview/, and an
// absolute path becomes relative to the START directory first.
//
//   svelte-check --tsconfig ./tsconfig.parts.json --output machine | node ../scripts/check-parts.mjs
//
// svelte-check also reports errors in the registry files (src/lib/components/ui/), which are outside
// the include list of the tsconfig. The summary line counts them apart, and they never fail the run.
import { readFileSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

const SHIPPED_DIRS = ['src/lib/stack/', 'src/lib/outside/'];
const SHIPPED_FILES = ['src/lib/print/chart-width.ts', 'src/lib/print/pattern-fills.ts', 'src/lib/print/marks.ts', 'src/lib/email/email.ts'];
const REGISTRY_DIR = 'src/lib/components/ui/';

const unquote = (s) => s.replace(/^"/, '').replace(/"$/, '');

let base = '';
let completed = null;
const errors = [];
for (const line of readFileSync(0, 'utf8').split(/\r?\n/)) {
  let m;
  if ((m = line.match(/^\d+ START (".*")\s*$/))) base = unquote(m[1]);
  else if ((m = line.match(/^\d+ COMPLETED (\d+) FILES (\d+) ERRORS /))) completed = { files: +m[1], errors: +m[2] };
  else if ((m = line.match(/^\d+ ERROR ("(?:[^"\\]|\\.)*") (\d+):(\d+) (.*)$/))) {
    let file = unquote(m[1]);
    if (isAbsolute(file)) file = relative(base, file);
    errors.push({ file, line: m[2], col: m[3], message: unquote(m[4]) });
  }
}

if (!completed) {
  console.error('check:parts: svelte-check stopped before its COMPLETED line.');
  process.exit(2);
}
if (completed.files === 0) {
  console.error('check:parts: svelte-check checked 0 files.');
  process.exit(2);
}
if (errors.length !== completed.errors) {
  console.error(`check:parts: the summary counts ${completed.errors} errors, and this script parsed ${errors.length} ERROR lines.`);
  process.exit(2);
}

let shipped = 0;
let registry = 0;
let other = 0;
const failures = [];
for (const e of errors) {
  if (SHIPPED_DIRS.some((d) => e.file.startsWith(d)) || SHIPPED_FILES.includes(e.file)) {
    shipped++;
    failures.push(e);
  } else if (e.file.startsWith(REGISTRY_DIR)) registry++;
  else {
    other++;
    failures.push(e);
  }
}
for (const e of failures) console.log(`${e.file}:${e.line}:${e.col} ${e.message}`);
console.log(`check:parts: ${shipped} errors in the shipped STACK paths, ${registry} in the registry files, which this check does not count, and ${other} elsewhere.`);
process.exit(failures.length > 0 ? 1 : 0);
