#!/usr/bin/env node
// The theme generator. It writes a theme file in the form of themes/*.css from three inputs, a base
// color, an accent color and a contrast level, and then runs the contrast check on that file. It fails
// when a pair is below its minimum. The rules of the scales are in lib/generate.mjs.
//
//   node scripts/generate.mjs --out <file> [--base <color>] [--accent <color>] [--contrast <0-100>]
//                             [--charts <theme>] [--radius <n>rem] [--compare <theme file>]
//   node scripts/generate.mjs --self-test
//
// A color is "oklch(L C H)", "#rgb" or "#rrggbb". An input that the command lacks comes from
// theme-inputs in the front matter of DESIGN.md, and --radius comes from rounded.lg. --charts takes the
// chart colors of a theme of themes/ by its name, such as graphite. Without it, or with default, the
// chart colors are the default set of the front matter. --compare prints the difference of each role
// against another theme file, in L, C, h and alpha. --self-test writes seven themes into a temporary
// folder and runs the contrast check on each. It checks that the generated graphite has the light
// secondary and the chart colors of themes/graphite.css, that the generated default keeps the hues of the
// default chart set, and that the generator refuses a mid-gray page.
//
// It reads DESIGN.md and themes/ of the copy of this repository that holds it, so it runs from any folder.
// --out and --compare are paths from the working folder, such as the root folder of a product. The copy
// needs "npm ci", because the front matter needs the dev dependency yaml. So the npm package, which has
// no dependency, does not carry the generator.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readSource, readDesign, parseThemeCss } from './lib/design.mjs';
import { formatOklch, parseOklch } from './lib/color.mjs';
import { generate, compare, withCharts, CHARTS, THEME_INPUTS } from './lib/generate.mjs';
import { renderTheme } from './theme.mjs';

const USAGE = 'Usage: node scripts/generate.mjs --out <file> [--base <color>] [--accent <color>] [--contrast <0-100>] [--charts <theme>] [--radius <n>rem] [--compare <theme file>]';
const FLAGS = ['--out', '--base', '--accent', '--contrast', '--charts', '--radius', '--compare'];
const CONTRAST = fileURLToPath(new URL('./contrast.mjs', import.meta.url));
/** A path in the copy of this repository that holds this file. */
const own = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (!FLAGS.includes(flag)) throw new Error(`"${flag}" is not an option. ${USAGE}`);
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value. ${USAGE}`);
    if (o[flag.slice(2)] !== undefined) throw new Error(`${flag} appears twice. ${USAGE}`);
    o[flag.slice(2)] = value;
  }
  if (!o.out) throw new Error(`--out is needed: the theme file to write. ${USAGE}`);
  if (o.radius !== undefined && !/^\d*\.?\d+rem$/.test(o.radius)) throw new Error(`--radius "${o.radius}" must be a rem value, such as 0.5rem.`);
  if (o.charts !== undefined && !/^[a-z0-9-]+$/.test(o.charts)) throw new Error(`--charts "${o.charts}" must be the name of a theme of themes/, such as graphite.`);
  return o;
}

function front() {
  const file = own('DESIGN.md');
  const text = readSource(file);
  if (text === null) throw new Error(`${file} not found. The generator reads the DESIGN.md of the copy of this repository that holds it.`);
  return readDesign(text).front;
}

/**
 * The front matter with the chart colors of themes/<name>.css. No name, or default, keeps the chart colors
 * of the front matter, which themes/default.css holds.
 */
function chartsOf(f, name) {
  if (name === undefined || name === 'default') return f;
  const file = `themes/${name}.css`;
  const text = readSource(own(file));
  if (text === null) throw new Error(`--charts "${name}" names no theme: ${file} does not exist. Give the name of a file of themes/, such as graphite.`);
  return withCharts(f, parseThemeCss(text, file), file);
}

/** The inputs of one generation, as the options of the command. */
function inputsOf(g, charts) {
  const i = g.inputs;
  const set = charts === undefined || charts === 'default' ? '' : ` --charts ${charts}`;
  return `--base "${formatOklch(i.base)}" --accent "${formatOklch(i.accent)}" --contrast ${i.contrast}${set}`;
}

/** The radius of rounded.lg, as theme.mjs writes it into themes/default.css. */
function radiusOf(f) {
  const m = /^([\d.]+)px$/.exec(String(f.rounded?.lg));
  if (!m) throw new Error(`rounded.lg "${f.rounded?.lg}" must be a px value.`);
  return `${+(parseFloat(m[1]) / 16).toFixed(4)}rem`;
}

/** The theme file of one generation, with a header that gives its inputs. */
function render(g, radius, charts) {
  const header = `/* Generated by scripts/generate.mjs from ${inputsOf(g, charts)}. Every pair of "npm run contrast" passes in both modes. To change the theme, run the command again with other inputs, and do not edit a value by hand. */`;
  return renderTheme({ light: g.light, dark: g.dark }, radius, header);
}

/**
 * Runs the contrast check on one file. Returns its exit code and its output lines. The check reads DESIGN.md
 * and stack.css from its working folder, so it runs in the root of this copy, with the full path of the file.
 */
function contrastCheck(file) {
  try {
    const out = execFileSync(process.execPath, [CONTRAST, resolve(file)], { cwd: own(''), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, lines: out.split('\n') };
  } catch (e) {
    return { code: e.status ?? 1, lines: `${e.stdout ?? ''}${e.stderr ?? ''}`.split('\n') };
  }
}

/** The lines of the contrast output that a person reads: each failure, and the two summaries. */
const summary = (lines) => lines.filter((l) => /^\s*FAIL\b/.test(l) || /^(contrast|email): /.test(l));

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  const o = args(argv);
  const f = chartsOf(front(), o.charts);
  const ti = f['theme-inputs'] ?? {};
  const g = generate({ base: o.base ?? ti.base, accent: o.accent ?? ti.accent, contrast: o.contrast ?? ti.contrast }, f);
  if (g.problems.length) {
    for (const p of g.problems) console.error(`generate: ${p}`);
    console.error('generate: wrote nothing. Change the inputs. A conflict on primary needs another accent; the contrast level does not move primary. A text at the end of the range needs a base color nearer white or black.');
    return 1;
  }
  mkdirSync(dirname(o.out), { recursive: true });
  writeFileSync(o.out, render(g, o.radius ?? radiusOf(f), o.charts));
  console.log(`generate: wrote ${o.out} from ${inputsOf(g, o.charts)}`);
  if (g.lifts.length) console.log(`generate: lifted ${g.lifts.length} values until each pair passed:`);
  for (const l of g.lifts) console.log(`  ${l.mode.padEnd(5)}  ${l.role.padEnd(18)}  ${l.from} to ${l.to}, for ${l.pairs.join('; ')}`);
  for (const x of g.flipped) console.log(`generate: took the other text for ${x}, because no lightness of the fill passed with the first one`);
  if (o.compare) {
    const current = parseThemeCss(readSource(o.compare) ?? '', o.compare);
    console.log(`\ngenerate: each role against ${o.compare}, as the generated value minus the value of the file`);
    console.log(`  ${'mode'.padEnd(5)}  ${'role'.padEnd(26)}  ${'current'.padEnd(28)}  ${'generated'.padEnd(28)}  ${'dL'.padStart(6)}  ${'dC'.padStart(6)}  ${'dh'.padStart(8)}  ${'dA'.padStart(6)}`);
    for (const r of compare(current, parseThemeCss(readSource(o.out), o.out))) {
      const n = (v, w) => (v === null ? 'gray' : String(v)).padStart(w);
      console.log(`  ${r.mode.padEnd(5)}  ${r.role.padEnd(26)}  ${r.from.padEnd(28)}  ${r.to.padEnd(28)}  ${n(r.dl, 6)}  ${n(r.dc, 6)}  ${n(r.dh, 8)}  ${n(r.da, 6)}`);
    }
  }
  const check = contrastCheck(o.out);
  for (const l of summary(check.lines)) console.log(l);
  if (check.code) console.error(`generate: the contrast check fails on ${o.out}. The file stays for a look, and no theme of a product may take it.`);
  return check.code;
}

// The input sets of the self-test: the two themes of this repository, each with its own chart colors,
// a warm base given as a hex value, a saturated accent, a high contrast level with the chart colors of
// graphite, a base for dark mode, and a light accent that takes the other text on primary in both
// modes.
function testSets(f) {
  const ti = f['theme-inputs'];
  const g = THEME_INPUTS.graphite;
  return [
    ['graphite', g],
    ['default', { base: ti.base, accent: ti.accent, contrast: ti.contrast }],
    ['warm base', { base: '#f7f3ec', accent: 'oklch(0.55 0.13 45)', contrast: 30 }],
    ['saturated accent', { base: 'oklch(1 0 0)', accent: '#7c3aed', contrast: 30 }],
    ['high contrast', { ...g, contrast: 90 }],
    ['dark base', { base: 'oklch(0.2 0.01 250)', accent: 'oklch(0.7 0.15 200)', contrast: 30 }],
    ['light accent', { base: 'oklch(0.862 0.011 351.8)', accent: 'oklch(0.787 0.158 107.8)', contrast: 0 }],
  ];
}

// The most difference in L at which a generated value matches the value of a theme file. Each gray of the
// generated graphite is within it of themes/graphite.css, except muted and sidebar-accent in dark, which
// take step 300 of the ratio table.
const MATCH = 0.007;

/** Three checks of the graphite input set: the light secondary is lighter than the page and within MATCH of themes/graphite.css in L, and the charts are those of themes/graphite.css. Returns the number of failures. */
function graphiteChecks(g) {
  let bad = 0;
  const fail = (msg) => { bad++; console.log(`FAIL  graphite: ${msg}`); };
  const file = 'themes/graphite.css';
  const want = parseThemeCss(readSource(own(file)) ?? '', file);
  const secondary = parseOklch(g.light.get('secondary')).l;
  const background = parseOklch(g.light.get('background')).l;
  const target = parseOklch(want.root.get('secondary')).l;
  if (!(secondary > background)) fail(`--secondary has L ${secondary} in light, and it is not above --background at L ${background}`);
  if (!(Math.abs(secondary - target) <= MATCH)) fail(`--secondary has L ${secondary} in light, more than ${MATCH} from L ${target} in ${file}`);
  for (const [mode, from, to] of [['light', g.light, want.root], ['dark', g.dark, want.dark]]) {
    for (const t of CHARTS) {
      const x = from.get(t);
      const y = to.get(t);
      if (x === undefined || y === undefined) fail(`--${t} is missing in ${mode} (generated ${x}, ${file} ${y})`);
      else if (formatOklch(parseOklch(x)) !== formatOklch(parseOklch(y))) fail(`--${t} in ${mode} is ${x}, and ${file} has ${y}`);
    }
  }
  return bad;
}

/**
 * One check of the default input set, which names no chart set: each chart color keeps the hue of the
 * default set of the front matter. The lift may move its lightness, so the check compares the hue only.
 * Returns the number of failures.
 */
function defaultChecks(g, f) {
  let bad = 0;
  for (const [mode, from, want] of [['light', g.light, f.colors], ['dark', g.dark, f.colors.dark]]) {
    for (const t of CHARTS) {
      const x = parseOklch(from.get(t)).h;
      const y = parseOklch(want[t]).h;
      if (Math.abs(x - y) > 0.001 || parseOklch(from.get(t)).c > parseOklch(want[t]).c + 0.0005) { bad++; console.log(`FAIL  default: --${t} in ${mode} has hue ${x}, and the default set of the front matter has hue ${y}`); }
    }
  }
  return bad;
}

function selfTest() {
  const f = front();
  const dir = mkdtempSync(join(tmpdir(), 'stack-generate-'));
  let bad = 0;
  try {
    for (const [name, inputs] of testSets(f)) {
      const g = generate(inputs, chartsOf(f, inputs.charts));
      if (g.problems.length) {
        bad++;
        console.log(`FAIL  ${name}: ${g.problems.join(' ')}`);
        continue;
      }
      // A file named like a theme of themes/ would meet the email column of that theme, so each name starts with "test-".
      const file = join(dir, `test-${name.replace(/ /g, '-')}.css`);
      writeFileSync(file, render(g, radiusOf(f), inputs.charts));
      if (name === 'graphite') bad += graphiteChecks(g);
      if (name === 'default') bad += defaultChecks(g, f);
      const check = contrastCheck(file);
      if (check.code) bad++;
      const lines = summary(check.lines);
      console.log(`${check.code ? 'FAIL' : 'ok  '}  ${name} contrast: ${g.lifts.length} lifts; ${lines.filter((l) => !/^\s*FAIL/.test(l)).join('; ')}`);
      for (const l of lines.filter((x) => /^\s*FAIL/.test(x))) console.log(`  ${l.trim()}`);
    }
    const refused = generate({ base: 'oklch(0.5 0 0)', accent: 'oklch(0.3 0.1 260)', contrast: 30 }, f);
    if (refused.problems.length) console.log(`ok    refusal: a mid-gray page gives ${refused.problems.length} problems`);
    else { bad++; console.log('FAIL  refusal: a mid-gray page passed, but no dark text reaches 4.5:1 on it'); }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(bad ? `generate self-test: ${bad} ${bad === 1 ? 'check fails' : 'checks fail'}, each on a FAIL line above` : 'generate self-test: every input set gives a theme that passes the contrast check, the mid-gray page is refused, and the graphite and default checks pass');
  return bad ? 1 : 0;
}

// realpathSync, because a folder of the path can be a link (/tmp on macOS), and argv[1] then differs from import.meta.url.
const self = (() => { try { return pathToFileURL(realpathSync(process.argv[1])).href; } catch { return null; } })();
if (process.argv[1] && import.meta.url === self) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`generate: ${e.message}`);
    process.exitCode = 1;
  }
}
