// The check of the service icons ("Service icons" in DESIGN.md). It reads each file of
// preview/src/lib/service-icons/ as text.
//
//   node scripts/service-icons.mjs                     exit 1 on a problem; the last line counts the icons
//   node scripts/service-icons.mjs --compare <folder>  exit 1 when a path differs from the unpacked
//                                                      package simple-icons in <folder>
//
// The check: the folder holds LICENSE.md and one file for each service of ICONS, and no other file.
// Each icon holds one <svg> with viewBox="0 0 24 24", fill="currentColor" and aria-hidden="true", and
// one <path> with the transform that draws the mark inside 22 of the 24 units. It holds no color of its
// own: no other fill, no stroke, no style, no color attribute, no expression for one of them, no hex color
// and no color function. It holds no shape element other than the one <path>.
//
// --compare is the update step of MAINTAINING.md. <folder> holds the package as npm unpacks it, with
// package.json and icons/<slug>.svg. For each icon, the script compares the d attribute of the path
// with the d attribute of the path of its slug, as text, and prints "same" or "differs". It also prints
// the version of the package and the version that LICENSE.md names, and the license field of each icon in
// data/simple-icons.json (none, or a type). MAINTAINING.md stops the update on a type other than CC0-1.0. It runs no file of the package.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIR = join(ROOT, 'preview/src/lib/service-icons');
const NOTICE = 'LICENSE.md';
// Each icon that STACK ships: its file name and its slug in Simple Icons. A third element 'stand-in'
// marks an urgent replacement by the Lucide icon of its kind (MAINTAINING.md). The check and --compare skip it.
export const ICONS = [
  ['WhatsApp', 'whatsapp'],
  ['Viber', 'viber'],
  ['Telegram', 'telegram'],
  ['Messenger', 'messenger'],
  ['Instagram', 'instagram'],
  ['Signal', 'signal'],
  ['Gmail', 'gmail'],
];
const isStandIn = (entry) => entry[2] === 'stand-in';
export const TRANSFORM = 'translate(1 1) scale(0.91666667)';

const count = (text, re) => [...text.matchAll(re)].length;
/** The d attribute of each <path> of an SVG or a Svelte file. */
const paths = (text) => [...text.matchAll(/<path\b[^>]*?\sd="([^"]*)"/g)].map((m) => m[1]);

/** The problems of the source of one icon. */
export function checkIcon(source) {
  const problems = [];
  const svg = source.match(/<svg\b[^>]*>/g) ?? [];
  if (svg.length !== 1) problems.push(`holds ${svg.length} <svg> elements, and needs one`);
  const tag = svg[0] ?? '';
  for (const attr of ['viewBox="0 0 24 24"', 'fill="currentColor"', 'aria-hidden="true"']) if (!tag.includes(` ${attr}`)) problems.push(`its <svg> has no ${attr}`);
  const path = source.match(/<path\b[^>]*>/g) ?? [];
  if (path.length !== 1) problems.push(`holds ${path.length} <path> elements, and needs one`);
  else {
    if (!path[0].includes(` transform="${TRANSFORM}"`)) problems.push(`its <path> has no transform="${TRANSFORM}", which draws the mark inside 22 of the 24 units`);
    if (paths(source).length !== 1) problems.push('its <path> has no d attribute');
  }
  const shapes = source.match(/<(circle|rect|ellipse|line|polyline|polygon|image|use)\b/g) ?? [];
  if (shapes.length) problems.push(`holds a shape element other than the one <path>: ${[...new Set(shapes)].join(', ')}`);
  const markup = source.replace(/<script\b[\s\S]*?<\/script>/g, '');
  if (count(markup, /\sfill="/g) !== 1) problems.push('sets fill more than once, and only fill="currentColor" of the <svg> is allowed');
  if (/\s(stroke|stroke-[a-z]+|style|color|stop-color|class)="/.test(markup)) problems.push('sets a stroke, a style, a color or a static class of its own');
  if (/\s(fill|stroke|style|color)=\{/.test(markup)) problems.push('sets a fill, a stroke, a style or a color with an expression');
  if (/<style\b|#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/.test(source)) problems.push('holds a color of its own');
  return problems;
}

/** The problems of a folder of icons: the file set, and the source of each icon that is no stand-in. */
export function folderProblems(icons = ICONS, dir = DIR) {
  const want = new Set([NOTICE, ...icons.map(([name]) => `${name}.svelte`)]);
  const have = readdirSync(dir).filter((f) => !f.startsWith('.'));
  const rel = relative(ROOT, dir);
  const problems = [];
  for (const f of have) if (!want.has(f)) problems.push(`${rel}/${f}: is no icon of ICONS in scripts/service-icons.mjs. Add the service to ICONS, or remove the file.`);
  for (const f of want) if (!have.includes(f)) problems.push(`${rel}/${f}: is missing.`);
  for (const entry of icons) {
    const file = join(dir, `${entry[0]}.svelte`);
    if (isStandIn(entry) || !existsSync(file)) continue;
    for (const p of checkIcon(readFileSync(file, 'utf8'))) problems.push(`${rel}/${entry[0]}.svelte: ${p}.`);
  }
  return problems;
}

function check() {
  const problems = folderProblems();
  const shipped = ICONS.filter((e) => !isStandIn(e));
  for (const p of problems) console.error(`service-icons: ${p}`);
  console.log(`service-icons: ${shipped.length} icons${problems.length ? `, ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}` : ', each with one path in currentColor and no color of its own'}`);
  return problems.length ? 1 : 0;
}

function compare(folder) {
  const version = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')).version;
  const notice = readFileSync(join(DIR, NOTICE), 'utf8').match(/Simple Icons (\d+\.\d+\.\d+)/)?.[1] ?? 'none';
  console.log(`service-icons: the package in ${folder} is simple-icons ${version}, and ${NOTICE} names ${notice}`);
  const dataFile = join(folder, 'data/simple-icons.json');
  const data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : [];
  const shipped = ICONS.filter((e) => !isStandIn(e));
  let differs = 0;
  for (const [name, slug] of shipped) {
    const svg = join(folder, 'icons', `${slug}.svg`);
    if (!existsSync(svg)) {
      differs++;
      console.log(`  ${name}.svelte  icons/${slug}.svg  missing in the package`);
      continue;
    }
    const [theirs] = paths(readFileSync(svg, 'utf8'));
    const [ours] = paths(readFileSync(join(DIR, `${name}.svelte`), 'utf8'));
    const license = data.find((d) => d.slug === slug)?.license?.type ?? 'none';
    const same = theirs !== undefined && theirs === ours;
    if (!same) differs++;
    console.log(`  ${name}.svelte  icons/${slug}.svg  ${same ? 'same' : 'differs'}  ${ours?.length ?? 0} and ${theirs?.length ?? 0} characters  license ${license}`);
  }
  console.log(`service-icons: ${shipped.length - differs} of ${shipped.length} paths are the same as in simple-icons ${version}`);
  return differs ? 1 : 0;
}

function main(argv) {
  if (argv.length === 0) return check();
  if (argv[0] === '--compare' && argv.length === 2) return compare(argv[1]);
  throw new Error('give no argument, or --compare <folder of the unpacked package simple-icons>.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`service-icons: ${e.message}`);
    process.exitCode = 1;
  }
}
