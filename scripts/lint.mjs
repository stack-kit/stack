// Runs the design.md lint on DESIGN.md. It fails on an error, and on a warning whose rule is not in
// the list "Accepted lint warnings" in "## Overview" of DESIGN.md. Each list item starts with the
// rule id in backticks. A `broken-ref` warning passes only on a `borderColor`, the one property that
// DESIGN.md adds, so that a misspelled property name still fails.
//
//   node scripts/lint.mjs
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readSource, readDesign, section } from './lib/design.mjs';

/** The rule ids of the list that follows the line "Accepted lint warnings" in ## Overview. */
export function acceptedWarnings(body) {
  const lines = section(body, 'Overview').text.split('\n');
  const start = lines.findIndex((l) => /Accepted lint warnings/.test(l));
  if (start < 0) return [];
  const ids = [];
  for (const l of lines.slice(start + 1)) {
    if (/^\s*$/.test(l) && !ids.length) continue;
    const m = /^\s*[-*] `([a-z-]+)`/.exec(l);
    if (!m) break;
    ids.push(m[1]);
  }
  return ids;
}

/** True when the list accepts this warning. `broken-ref` is accepted on a `borderColor` path only. */
export function isAccepted(f, accepted) {
  if (f.severity !== 'warning' || !accepted.has(f.rule)) return false;
  return f.rule !== 'broken-ref' || String(f.path ?? '').endsWith('.borderColor');
}

function runLint() {
  const bin = join('node_modules', '.bin', 'design.md');
  try {
    return execFileSync(bin, ['lint', 'DESIGN.md'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  } catch (e) {
    // The CLI exits 1 when it reports an error, and still prints its JSON.
    if (e.stdout) return e.stdout;
    throw new Error(`could not run ${bin}: ${e.message}. Run "npm ci" first.`);
  }
}

function main() {
  const text = readSource('DESIGN.md');
  if (text === null) throw new Error('DESIGN.md not found. Run this from the root of the repository.');
  const { body } = readDesign(text);
  const accepted = new Set(acceptedWarnings(body));
  const report = JSON.parse(runLint());
  const counts = {};
  const refused = [];
  for (const f of report.findings) {
    const ok = isAccepted(f, accepted);
    const k = `${f.severity} ${f.rule}${ok ? ' (accepted)' : ''}`;
    counts[k] = (counts[k] ?? 0) + 1;
    if (f.severity === 'error' || (f.severity === 'warning' && !ok)) refused.push(f);
  }
  for (const f of refused) console.error(`lint: ${f.severity} ${f.rule} ${f.path ?? ''}: ${f.message}`);
  const s = report.summary;
  console.log(`lint: ${s.errors} errors, ${s.warnings} warnings, ${s.infos} infos`);
  for (const [k, n] of Object.entries(counts).sort()) console.log(`  ${String(n).padStart(4)}  ${k}`);
  console.log(refused.length ? `lint: ${refused.length} findings are not accepted` : `lint: passed; accepted warning classes: ${[...accepted].join(', ') || 'none'}`);
  return refused.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (e) {
    console.error(`lint: ${e.message}`);
    process.exitCode = 1;
  }
}
