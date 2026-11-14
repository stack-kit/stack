// The check of the height script of an HTML frame (### html-frame in DESIGN.md). The host of a product
// allows the script by its hash, so the hash that the package exports and the hash that DESIGN.md
// publishes must be the hash of the script of the same release.
//
//   node scripts/frame-height.mjs   exit 1 on a problem; the last line gives the hash of the script
//
// It fails when FRAME_HEIGHT_HASH of the module or a hash in DESIGN.md differs from the SHA-256 of
// FRAME_HEIGHT_SCRIPT. It also fails when the script holds a character that makes the value of the
// string differ from the text in the file (a backslash, a backtick or a dollar sign), a character that
// is not ASCII, a carriage return, or a text that ends or opens an element in an HTML page, and when
// the script does not hold the two type tags of the module. The script reads the module as text,
// because the root check runs before the install of the preview and has no TypeScript, as
// scripts/keys.mjs reads keys.ts.
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readSource } from './lib/design.mjs';

export const MODULE = 'preview/src/lib/stack/frame-height.ts';
export const DESIGN = 'DESIGN.md';

/** The source for script-src of a script text: the SHA-256 of its UTF-8 bytes in base64, with its quotes. */
export function hashOf(script) {
  return `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`;
}

/** The values of the four constants of the module, or a problem for each one that it lacks. */
export function readModule(source) {
  const problems = [];
  const one = (name, re) => {
    const m = re.exec(source);
    if (!m) problems.push(`${MODULE} has no line "export const ${name}: string = ..." in the form of this check`);
    return m?.[1];
  };
  const script = one('FRAME_HEIGHT_SCRIPT', /^export const FRAME_HEIGHT_SCRIPT: string = `([^`]*)`;$/m);
  const hash = one('FRAME_HEIGHT_HASH', /^export const FRAME_HEIGHT_HASH: string = "('sha256-[^']*')";$/m);
  const height = one('FRAME_HEIGHT_TYPE', /^export const FRAME_HEIGHT_TYPE: string = '([a-z-]+)';$/m);
  const mode = one('FRAME_MODE_TYPE', /^export const FRAME_MODE_TYPE: string = '([a-z-]+)';$/m);
  return { script, hash, height, mode, problems };
}

/** The problems of the module text and the text of DESIGN.md. */
export function check(moduleText, designText) {
  const { script, hash, height, mode, problems } = readModule(moduleText);
  if (script === undefined) return { problems, want: null };
  const want = hashOf(script);
  if (/[\\`$]/.test(script)) problems.push(`FRAME_HEIGHT_SCRIPT holds a backslash, a backtick or a dollar sign, so the value of the string differs from the text in ${MODULE}`);
  if (/[^\x09\x0a\x20-\x7e]/.test(script)) problems.push('FRAME_HEIGHT_SCRIPT holds a character that is not printable ASCII, a tab or a line feed, so its bytes can change on their way into a page');
  if (/<\/script|<!--|<script/i.test(script)) problems.push('FRAME_HEIGHT_SCRIPT holds "</script", "<script" or "<!--", which change how an HTML page reads the script element');
  for (const [name, tag] of [['FRAME_HEIGHT_TYPE', height], ['FRAME_MODE_TYPE', mode]]) {
    if (tag && !script.includes(`'${tag}'`)) problems.push(`FRAME_HEIGHT_SCRIPT does not hold '${tag}', the value of ${name}`);
  }
  if (hash !== undefined && hash !== want) problems.push(`FRAME_HEIGHT_HASH of ${MODULE} is ${hash}, and the hash of the script is ${want}`);
  const published = [...designText.matchAll(/'sha256-[A-Za-z0-9+/=]*'/g)].map((m) => m[0]);
  if (published.length === 0) problems.push(`${DESIGN} publishes no hash of the script, such as ${want} in ### html-frame`);
  for (const h of new Set(published)) if (h !== want) problems.push(`${DESIGN} publishes ${h}, and the hash of the script is ${want}`);
  return { problems, want };
}

function main() {
  const moduleText = readSource(MODULE);
  const designText = readSource(DESIGN);
  if (moduleText === null || designText === null) throw new Error(`${moduleText === null ? MODULE : DESIGN} not found. Run this from the root of the repository.`);
  const { problems, want } = check(moduleText, designText);
  for (const p of problems) console.error(`frame: ${p}`);
  console.log(`frame: the hash of the height script is ${want ?? 'unknown'}${problems.length ? `, ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}` : ''}`);
  return problems.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main();
  } catch (e) {
    console.error(`frame: ${e.message}`);
    process.exitCode = 1;
  }
}
