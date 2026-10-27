#!/usr/bin/env node
// The contrast check. It reads the pairs from DESIGN.md and the values from each theme file,
// and checks both modes of each theme. Its colour math, OKLCH to sRGB and then WCAG 2.2, and its pairs
// are in lib/color.mjs and lib/pairs.mjs, which the theme generator and the preview also read.
// It also checks the email colors of "### Email colors" in DESIGN.md: the hex value of each role and
// the ratio of each pair, in the light mode of each theme. For a theme file with no column there, such
// as the theme of a product, it prints the values to copy. With no file named, it checks the print
// colors of "### Print colors" once: each value a gray, each pair at its ratio, and the css block of
// "### Print template" with those values only.
//
//   node scripts/contrast.mjs [files]   default: every themes/*.css; exit 1 on any failure
//   node scripts/contrast.mjs --self-test
//
// The product check. It reads the pairs of a product from a JSON file, the values of the product
// layer and of each theme that the product imports, and checks both modes. It reads no front matter,
// so it needs no package. A product runs it as "npx --no -- stack-contrast", the bin entry of package.json.
//
//   stack-contrast --layer <css> --pairs <json> --theme <name|file.css> [--theme ...]
import { readdirSync, realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readSource, readDesign, parseThemeCss, section } from './lib/design.mjs';
import { EMAIL_ROLES, EMAIL_PAIRS } from './lib/email-roles.mjs';
import { parseOklch, oklchToSrgb, paint, over, ratio, hex } from './lib/color.mjs';
import { MARK_GROUNDS, pairs, textLabel, groundLabel, audit } from './lib/pairs.mjs';

// The color math and the pairs stay exports of this file, for a script that imports them from here.
export { parseOklch, oklchToSrgb, over, luminance, ratio, hex } from './lib/color.mjs';
export { pairs, textLabel, groundLabel, audit } from './lib/pairs.mjs';

/**
 * Reads the custom properties of a product layer: each ":root {}" and ".dark {}" block, also inside an
 * at-rule such as "@layer base". It skips every other rule, such as "@theme inline". A later block
 * overrides an earlier one. Names come back without "--".
 */
export function readLayer(css, file) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = { root: new Map(), dark: new Map() };
  for (const m of text.matchAll(/(?<=^|[{};])\s*(:root|\.dark)\s*\{([^{}]*)\}/g)) {
    const outer = [];
    let from = 0;
    for (let i = 0; i < m.index; i++) {
      if (text[i] === '{') { outer.push(text.slice(from, i).trim()); from = i + 1; }
      else if (text[i] === '}') { outer.pop(); from = i + 1; }
      else if (text[i] === ';') from = i + 1;
    }
    const other = outer.find((p) => !/^@layer\b/.test(p));
    if (other) throw new Error(`${file}: "${m[1]}" sits inside "${other}". The check reads ":root {}" and ".dark {}" at the top level and inside @layer only.`);
    const block = m[1] === ':root' ? blocks.root : blocks.dark;
    for (const decl of m[2].split(';')) {
      const d = /^\s*--([a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/.exec(decl);
      if (d) block.set(d[1], d[2]);
    }
  }
  if (!blocks.root.size && !blocks.dark.size) throw new Error(`${file}: no ":root {}" or ".dark {}" block sets a custom property.`);
  return blocks;
}

/** The fallback of each added role, from the lines "--color-<n>: var(--<n>, <fallback>);" of stack.css. */
export function stackFallbacks(css) {
  const out = {};
  for (const m of css.matchAll(/--color-([a-z0-9-]+): var\(--\1, (?:var\(--([a-z0-9-]+)\)|(oklch\([^)]*\)))\);/g)) out[m[1]] = m[2] ?? m[3];
  return out;
}

// The floor of each use of a product color, as "Contrast" in ## Colors of DESIGN.md sets it.
const FLOORS = { text: 4.5, icon: 3, dot: 3, line: 3, fill: 3 };

/**
 * The pairs of a product, from a JSON list. Each entry is { "color", "use", "on" }:
 * - color: a name without "--", such as "product-status-done", or "product-status-done/70" at 70%;
 * - use: text (4.5), or icon, dot, line or fill (3), the floor of FLOORS;
 * - on: optional, a list of grounds, each "<name>", "<name>/<n>" or "<name>/<n> over <name>", the form
 *   that the output prints. Without it, the pair is checked on each ground of MARK_GROUNDS.
 */
export function productPairs(list, file) {
  const example = '[{ "color": "product-status-done", "use": "text" }]';
  if (!Array.isArray(list) || !list.length) throw new Error(`${file}: the file holds a JSON list of pairs, such as ${example}.`);
  const pct = '(100|[1-9]?[0-9])';
  const colorForm = new RegExp(`^([a-z0-9-]+)(?:/${pct})?$`);
  const groundForm = new RegExp(`^([a-z0-9-]+)(?:/${pct}(?: over ([a-z0-9-]+))?)?$`);
  return list.flatMap((e, i) => {
    const at = `${file}, pair ${i + 1}`;
    if (!e || typeof e !== 'object' || Array.isArray(e)) throw new Error(`${at}: a pair is an object, such as ${example.slice(1, -1)}.`);
    const extra = Object.keys(e).filter((k) => !['color', 'use', 'on'].includes(k));
    if (extra.length) throw new Error(`${at}: unknown key "${extra.join('", "')}". A pair has "color", "use" and, if it needs them, "on".`);
    const c = colorForm.exec(String(e.color ?? ''));
    if (!c) throw new Error(`${at}: "color" is a name without "--", such as "product-status-done", or "product-status-done/70" at 70%.`);
    if (!Object.hasOwn(FLOORS, e.use)) throw new Error(`${at}: "use" is one of ${Object.keys(FLOORS).join(', ')}.`);
    const on = e.on ?? MARK_GROUNDS;
    if (!Array.isArray(on) || !on.length) throw new Error(`${at}: "on" is a list of grounds, such as ["background", "selected"].`);
    return on.map((g) => {
      const m = groundForm.exec(String(g));
      if (!m) throw new Error(`${at}: the ground "${g}" has the form "<name>", "<name>/<n>" or "<name>/<n> over <name>".`);
      return {
        id: e.use,
        bg: m[1],
        fg: c[1],
        min: FLOORS[e.use],
        alpha: m[2] === undefined ? 1 : Number(m[2]) / 100,
        fgAlpha: c[2] === undefined ? 1 : Number(c[2]) / 100,
        modes: null,
        under: m[3] ?? null,
      };
    });
  });
}

/** One line of output for one pair in one mode. note goes in parentheses after the pair. */
function printRow(r, note) {
  const from = note ? `  (${note})` : '';
  console.log(`  ${r.ok ? 'ok  ' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(5)}  min ${String(r.pair.min).padEnd(3)}  ${textLabel(r.pair)} on ${groundLabel(r.pair)}${from}${r.clipped ? '  (clipped to sRGB)' : ''}`);
}

const USAGE = 'Usage: stack-contrast --layer <css> --pairs <json> --theme <name|file.css> [--theme ...]';

function productArgs(argv) {
  const o = { layer: null, pairs: null, themes: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (!['--layer', '--pairs', '--theme'].includes(flag)) throw new Error(`"${flag}" is not an option. ${USAGE}`);
    if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value. ${USAGE}`);
    if (flag === '--theme') o.themes.push(value);
    else if (o[flag.slice(2)]) throw new Error(`${flag} appears twice. ${USAGE}`);
    else o[flag.slice(2)] = value;
  }
  if (!o.layer || !o.pairs || !o.themes.length) throw new Error(`--layer, --pairs and --theme are all needed. ${USAGE}`);
  return o;
}

/**
 * Checks the pairs of a product in both modes of each theme. The layer comes after the theme, as in
 * the CSS of the product, so a name of the layer overrides the same name of the theme. A name that
 * neither sets takes its value from theme-fallbacks, as stack.css writes it for the browser.
 */
function productMain(o) {
  const own = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
  const shipped = readdirSync(own('themes')).filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4)).sort();
  const read = (file) => {
    const text = readSource(file);
    if (text === null) throw new Error(`${file}: not found.`);
    return text;
  };
  const layer = readLayer(read(o.layer), o.layer);
  const pairsText = read(o.pairs);
  let list;
  try {
    list = JSON.parse(pairsText);
  } catch (e) {
    throw new Error(`${o.pairs}: ${e.message}`);
  }
  const p = productPairs(list, o.pairs);
  const fallbacks = stackFallbacks(read(own('stack.css')));
  let failures = 0;
  let blocks = 0;
  for (const theme of o.themes) {
    const file = theme.endsWith('.css') ? theme : shipped.includes(theme) ? own(`themes/${theme}.css`) : null;
    if (!file) throw new Error(`--theme ${theme}: name a theme of the package (${shipped.join(', ')}), or a theme file that ends in .css.`);
    const t = parseThemeCss(read(file), file);
    const merged = { root: new Map([...t.root, ...layer.root]), dark: new Map([...t.dark, ...layer.dark]) };
    let rows;
    let used;
    try {
      ({ rows, used } = audit(merged, p, fallbacks));
    } catch (e) {
      throw new Error(`${o.layer} on ${theme}: ${e.message}`);
    }
    for (const mode of ['light', 'dark']) {
      blocks++;
      console.log(`\n${o.layer} on ${theme}  ${mode === 'light' ? ':root' : '.dark'} (${mode})`);
      for (const r of rows.filter((x) => x.mode === mode)) {
        if (!r.ok) failures++;
        printRow(r, r.pair.id);
      }
      if (used[mode].size) console.log(`  note  resolved through theme-fallbacks: ${[...used[mode]].join(', ')}`);
    }
  }
  console.log(`\ncontrast: ${p.length} pairs of ${o.pairs} in ${blocks} blocks, ${failures} below the minimum`);
  return failures ? 1 : 0;
}

// The values that Chrome measured in the test project (canvas readback, 8-bit), copied in as numbers.
const CHROME = {
  colors: [
    ['oklch(1 0 0)', [255, 255, 255]],
    ['oklch(0.145 0 0)', [10, 10, 10]],
    ['oklch(0.985 0 0)', [250, 250, 250]],
    ['oklch(0.845 0.143 164.978)', [94, 233, 181]],
    ['oklch(0.696 0.17 162.48)', [0, 188, 125]],
    ['oklch(0.596 0.145 163.225)', [0, 153, 102]],
    ['oklch(0.508 0.118 165.612)', [0, 122, 85]],
    ['oklch(0.432 0.095 166.913)', [0, 96, 69]],
    ['oklch(0.705 0.213 47.604)', [255, 105, 0]],
    ['oklch(0.637 0.237 25.331)', [251, 44, 54]],
    ['oklch(0.623 0.214 259.815)', [43, 127, 255]],
  ],
  // [fill, ink, background, ratio to ink, ratio to background]
  light: ['oklch(0.145 0 0)', 'oklch(1 0 0)', 19.8, [13.01, 8, 5.42, 3.69, 2.6, 6.86, 5.2, 5.26], [1.52, 2.47, 3.65, 5.36, 7.61, 2.89, 3.81, 3.76]],
  dark: ['oklch(0.985 0 0)', 'oklch(0.145 0 0)', 18.97, [1.46, 2.37, 3.5, 5.14, 7.29, 2.77, 3.65, 3.6], [13.01, 8, 5.42, 3.69, 2.6, 6.86, 5.2, 5.26]],
};

function selfTest() {
  let bad = 0;
  const rgb = (s) => paint(oklchToSrgb(parseOklch(s)));
  for (const [s, want] of CHROME.colors) {
    const c = rgb(s);
    const got = [c.r, c.g, c.b].map((v) => Math.round(v * 255));
    const ok = got.every((v, i) => Math.abs(v - want[i]) <= 1);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${s}  rgb(${got})  Chrome rgb(${want})`);
  }
  const fills = CHROME.colors.slice(3).map(([s]) => s);
  for (const mode of ['light', 'dark']) {
    const [ink, bg, inkOnPaper, toInk, toBg] = CHROME[mode];
    const check = (label, got, want) => {
      const ok = Math.abs(got - want) <= 0.02;
      if (!ok) bad++;
      console.log(`${ok ? 'ok  ' : 'FAIL'}  ${mode} ${label}  ${got.toFixed(2)}  Chrome ${want}`);
    };
    check('ink on background', ratio(rgb(ink), rgb(bg)), inkOnPaper);
    fills.forEach((f, i) => {
      check(`chart-${i + 1} against ink`, ratio(rgb(f), rgb(ink)), toInk[i]);
      check(`chart-${i + 1} against background`, ratio(rgb(f), rgb(bg)), toBg[i]);
    });
  }
  console.log(bad ? `self-test: ${bad} values differ from Chrome` : 'self-test: every value matches Chrome (rgb within 1/255, ratio within 0.02)');
  return bad ? 1 : 0;
}


/**
 * The tables under one "### " heading of one "## " part of the body, up to the next heading: each
 * table as its rows, and each row as its cells, with the divider row left out. null when the part has
 * no such heading.
 */
function tablesUnder(body, part, heading) {
  const lines = section(body, part).text.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return null;
  const end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l));
  const tables = [];
  let rows = null;
  for (const l of lines.slice(start + 1, end < 0 ? undefined : end)) {
    if (!l.startsWith('|')) {
      rows = null;
      continue;
    }
    const cells = l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue;
    if (!rows) tables.push((rows = []));
    rows.push(cells);
  }
  return tables;
}

/**
 * The two tables of "### Email colors" in "## Email": the hex value of each role in each theme, and
 * each pair with its minimum and its ratio in each theme. A theme column has its name in backticks
 * in the header row, such as `default`. Returns null when the body has no such heading. Throws when a role of scripts/lib/email-roles.mjs or a pair is missing from its table.
 */
export function emailTables(body) {
  const tables = tablesUnder(body, 'Email', '### Email colors');
  if (!tables) return null;
  const unquote = (c) => /^`(.*)`$/.exec(c)?.[1] ?? null;
  const read = (first) => {
    const t = tables.find((x) => x[0][0] === first);
    if (!t) throw new Error(`"### Email colors" has no table whose first column is "${first}".`);
    const head = t[0];
    const themes = head.map((c, i) => [unquote(c), i]).filter(([n]) => n);
    return { head, themes, rows: t.slice(1) };
  };
  const v = read('Role');
  const p = read('Pair');
  const values = v.rows.map((r) => ({ role: unquote(r[0]), hex: Object.fromEntries(v.themes.map(([n, i]) => [n, unquote(r[i])])) }));
  const min = p.head.indexOf('Minimum');
  const pairs = p.rows.map((r) => {
    const m = /^`([a-z0-9-]+)` on `([a-z0-9-]+)`$/.exec(r[0]);
    if (!m) throw new Error(`"### Email colors": the pair "${r[0]}" has the form "\`<text>\` on \`<ground>\`".`);
    const floor = Number(r[min]);
    if (!(floor > 0)) throw new Error(`"### Email colors": the pair ${r[0]} needs a minimum greater than 0.`);
    return { fg: m[1], bg: m[2], min: floor, ratio: Object.fromEntries(p.themes.map(([n, i]) => [n, r[i]])) };
  });
  const names = v.themes.map(([n]) => n);
  const lackRoles = EMAIL_ROLES.filter((r) => !values.some((x) => x.role === r));
  const extraRoles = values.map((x) => x.role).filter((r) => !EMAIL_ROLES.includes(r));
  if (lackRoles.length || extraRoles.length) {
    throw new Error(`"### Email colors": the role table ${lackRoles.length ? `lacks ${lackRoles.join(', ')}` : ''}${lackRoles.length && extraRoles.length ? ' and ' : ''}${extraRoles.length ? `has ${extraRoles.join(', ')}, which scripts/lib/email-roles.mjs does not list` : ''}.`);
  }
  const lackPairs = EMAIL_PAIRS.filter((q) => !pairs.some((x) => `${x.fg} on ${x.bg}` === q));
  if (lackPairs.length) throw new Error(`"### Email colors": the pair table lacks ${lackPairs.join(', ')}.`);
  if (p.themes.map(([n]) => n).join() !== names.join()) throw new Error('"### Email colors": the two tables must have the same theme columns, in the same order.');
  return { themes: names, values, pairs };
}

/**
 * Checks the email colors of one theme file in light mode: the hex value of each role and the ratio
 * of each pair, against the theme file. A theme with a column in "### Email colors" fails on a value
 * or a ratio that differs from its column, and on a pair below its minimum. A theme with no column,
 * such as the theme of a product, prints its values to copy, and fails only on a pair below its
 * minimum. Returns the number of failures.
 */
function emailAudit(file, t, tables, fallbacks) {
  const name = file.replace(/^.*\//, '').replace(/\.css$/, '');
  const column = tables.themes.includes(name) ? name : null;
  const value = (n, depth = 0) => {
    const v = t.root.get(n);
    if (v !== undefined) return v;
    const fb = fallbacks[n];
    if (fb === undefined || depth > 2) throw new Error(`${file}: --${n} is not set, and theme-fallbacks has no entry for it.`);
    return String(fb).startsWith('oklch(') ? fb : value(fb, depth + 1);
  };
  const ground = over(oklchToSrgb(parseOklch(value('background'))), { r: 1, g: 1, b: 1, a: 1, clipped: false });
  const color = (n) => over(oklchToSrgb(parseOklch(value(n))), ground);
  let failures = 0;
  console.log(`\n${file}  email (light)${column ? '' : '  (no column in "### Email colors": copy these values for the emails of this theme)'}`);
  for (const row of tables.values) {
    const got = hex(color(row.role));
    const want = column ? row.hex[column] : got;
    const ok = got === want;
    if (!ok) failures++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${got}  ${row.role}${ok ? '' : `  ("### Email colors" states ${want})`}`);
  }
  for (const pair of tables.pairs) {
    const r = ratio(color(pair.fg), color(pair.bg)).toFixed(2);
    const stated = column ? pair.ratio[column] : r;
    const ok = Number(r) >= pair.min && r === stated;
    if (!ok) failures++;
    const why = Number(r) < pair.min ? '' : r === stated ? '' : `  ("### Email colors" states ${stated})`;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${r.padStart(5)}  min ${String(pair.min).padEnd(3)}  ${pair.fg} on ${pair.bg}${why}`);
  }
  return failures;
}

// The roles and the pairs of "### Print colors" in "## Print". A document takes these values in every
// theme and in both modes, so the check reads them once, and not for each theme file.
const PRINT_ROLES = ['paper', 'ink', 'ink-muted', 'rule'];
const PRINT_PAIRS = ['ink on paper', 'ink-muted on paper'];
// The color forms other than a hex value. The CSS of "### Print template" takes the hex values of the
// first table only, so that a document prints the same in every theme and in every renderer.
const COLOR_FUNCTIONS = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|var)\(/i;

/** The color of "#rrggbb", or null for any other form. */
function fromHex(h) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(String(h));
  return m ? { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255, a: 1, clipped: false } : null;
}

/**
 * Checks "## Print": each value of "### Print colors" is a gray of the form #rrggbb and paper is
 * #ffffff, each pair passes its minimum at the ratio of its row, and the CSS block of "### Print
 * template" holds only the values of the first table. Returns the number of failures. Throws when
 * a heading, a table, a role or a pair is missing.
 */
export function printAudit(body) {
  const tables = tablesUnder(body, 'Print', '### Print colors');
  if (!tables) throw new Error('DESIGN.md has no "### Print colors" heading in "## Print", so the print colors are not checked. Restore the heading.');
  const unquote = (c) => /^`(.*)`$/.exec(c)?.[1] ?? null;
  const read = (first) => {
    const t = tables.find((x) => x[0][0] === first);
    if (!t) throw new Error(`"### Print colors" has no table whose first column is "${first}".`);
    return { head: t[0], rows: t.slice(1) };
  };
  const v = read('Role');
  const p = read('Pair');
  const at = (t, name) => {
    const i = t.head.indexOf(name);
    if (i < 0) throw new Error(`"### Print colors": a table has no column "${name}".`);
    return i;
  };
  const values = new Map(v.rows.map((r) => [unquote(r[0]), unquote(r[at(v, 'Value')]) ?? r[at(v, 'Value')]]));
  const lack = PRINT_ROLES.filter((r) => !values.has(r));
  const extra = [...values.keys()].filter((r) => !PRINT_ROLES.includes(r));
  if (lack.length || extra.length) {
    throw new Error(`"### Print colors": the role table ${lack.length ? `lacks ${lack.join(', ')}` : ''}${lack.length && extra.length ? ' and ' : ''}${extra.length ? `has ${extra.join(', ')}, which contrast.mjs does not list` : ''}.`);
  }
  const pairs = p.rows.map((r) => {
    const m = /^`([a-z0-9-]+)` on `([a-z0-9-]+)`$/.exec(r[0]);
    if (!m) throw new Error(`"### Print colors": the pair "${r[0]}" has the form "\`<text>\` on \`<ground>\`".`);
    const min = Number(r[at(p, 'Minimum')]);
    if (!(min >= 7)) throw new Error(`"### Print colors": the pair ${r[0]} needs a minimum of at least 7.`);
    return { fg: m[1], bg: m[2], min, ratio: r[at(p, 'Ratio')] };
  });
  const lackPairs = PRINT_PAIRS.filter((q) => !pairs.some((x) => `${x.fg} on ${x.bg}` === q));
  if (lackPairs.length) throw new Error(`"### Print colors": the pair table lacks ${lackPairs.join(', ')}.`);
  let failures = 0;
  console.log('\nprint colors (every theme and both modes)');
  for (const [role, value] of values) {
    const c = fromHex(value);
    const gray = c !== null && c.r === c.g && c.g === c.b;
    const white = role !== 'paper' || value === '#ffffff';
    const why = !c ? '  (a value has the form #rrggbb, in lower case)' : !gray ? '  (not a gray: its red, green and blue parts differ)' : !white ? '  (paper is #ffffff)' : '';
    if (why) failures++;
    console.log(`  ${why ? 'FAIL' : 'ok  '}  ${value}  ${role}${why}`);
  }
  for (const pair of pairs) {
    const fg = fromHex(values.get(pair.fg));
    const bg = fromHex(values.get(pair.bg));
    const r = fg && bg ? ratio(fg, bg).toFixed(2) : 'none';
    const ok = Number(r) >= pair.min && r === pair.ratio;
    if (!ok) failures++;
    const why = r === 'none' ? '  (a value of the pair is not a hex value)' : Number(r) < pair.min ? '' : r === pair.ratio ? '' : `  ("### Print colors" states ${pair.ratio})`;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${r.padStart(5)}  min ${String(pair.min).padEnd(3)}  ${pair.fg} on ${pair.bg}${why}`);
  }
  // The CSS block of "### Print template": every color is a value of the first table.
  const text = section(body, 'Print').text;
  const start = text.indexOf('\n### Print template\n');
  const block = start < 0 ? null : /\n```css\n([\s\S]*?)\n```/.exec(text.slice(start))?.[1];
  if (!block) throw new Error('"## Print" in DESIGN.md has no "### Print template" heading with a css block, so the colors of the template are not checked. Restore them.');
  const allowed = new Set(values.values());
  const used = [...new Set([...block.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]))];
  for (const h of used.filter((x) => !allowed.has(x))) {
    failures++;
    console.log(`  FAIL  ${h}  in the css block of "### Print template", which "### Print colors" does not give`);
  }
  const fn = COLOR_FUNCTIONS.exec(block);
  if (fn) {
    failures++;
    console.log(`  FAIL  ${fn[0]}  in the css block of "### Print template": a document takes the hex values of "### Print colors" only`);
  }
  const DECL = /(?<![-\w])(color|background(?:-color)?|fill|stroke|outline(?:-color)?|text-decoration(?:-color)?|column-rule(?:-color)?|border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-color)?)\s*:\s*([^;}]*)/gi;
  const rest = (v) => v.replace(/#[0-9a-fA-F]{3,8}\b/g, (h) => (allowed.has(h) ? ' ' : ' x ')).replace(/-?\d*\.?\d+(?:px|pt|mm|em|%)?/g, ' ').replace(/\b(?:none|solid|dashed|dotted|double|currentcolor|inherit)\b/gi, ' ').trim();
  for (const [, prop, value] of block.matchAll(DECL)) {
    if (rest(value)) {
      failures++;
      console.log(`  FAIL  ${prop}: ${value.trim()}  in the css block of "### Print template": a color is a hex value of "### Print colors"`);
    }
  }
  console.log(`print: ${values.size} values and ${pairs.length} pairs, and ${used.length} colors in the css block of "### Print template", ${failures} that fail`);
  return failures;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  if (argv.some((a) => a.startsWith('--'))) return productMain(productArgs(argv));
  const text = readSource('DESIGN.md');
  if (text === null) throw new Error(`DESIGN.md not found. Run this from the root of the repository. A product checks its layer with the options. ${USAGE}`);
  const { front, body } = readDesign(text);
  const p = pairs(front);
  const fallbacks = front['theme-fallbacks'] ?? {};
  // The product check reads the fallbacks from stack.css, so stack.css must give the same ones.
  const fromCss = stackFallbacks(readSource('stack.css') ?? '');
  const names = new Set([...Object.keys(fallbacks), ...Object.keys(fromCss)]);
  const drift = [...names].filter((n) => fromCss[n] !== String(fallbacks[n]));
  if (drift.length) throw new Error(`stack.css and theme-fallbacks give another fallback for ${drift.join(', ')}. The product check reads stack.css: run "npm run theme".`);
  const files = argv.length
    ? argv
    : readdirSync('themes').filter((f) => f.endsWith('.css')).sort().map((f) => `themes/${f}`);
  let failures = 0;
  let blocks = 0;
  for (const file of files) {
    const css = readSource(file);
    if (css === null) throw new Error(`${file}: not found.`);
    const t = parseThemeCss(css, file);
    const { rows, used } = audit(t, p, fallbacks);
    for (const mode of ['light', 'dark']) {
      blocks++;
      console.log(`\n${file}  ${mode === 'light' ? ':root' : '.dark'} (${mode})`);
      for (const r of rows.filter((x) => x.mode === mode)) {
        if (!r.ok) failures++;
        printRow(r, r.pair.id.startsWith('components.') ? r.pair.id : '');
      }
      const block = mode === 'light' ? t.root : t.dark;
      const chartNames = [...Array.from({ length: 8 }, (_, i) => `chart-${i + 1}`), 'chart-ink', 'chart-heat'];
      const lacks = chartNames.filter((n) => !block.has(n));
      if (lacks.length) console.log(`  note  this block lacks ${lacks.join(', ')}. A theme author sets the chart values, chart-ink and chart-heat for each mode.`);
      const tagNames = Object.keys(front.colors ?? {}).filter((n) => n.startsWith('tag-'));
      const tagLacks = tagNames.filter((n) => !block.has(n));
      if (tagLacks.length) console.log(`  note  this block lacks ${tagLacks.join(', ')}. A theme author sets the tag values for each mode, or every label dot shows the fallback gray.`);
      if (used[mode].size) console.log(`  note  resolved through theme-fallbacks: ${[...used[mode]].join(', ')}`);
    }
  }
  console.log(`\ncontrast: ${p.length} pairs in ${blocks} blocks, ${failures} below the minimum`);
  // The email colors of "## Email": each stated value and ratio against the light mode of each theme.
  const tables = emailTables(body);
  if (!tables) throw new Error('DESIGN.md has no "### Email colors" heading in "## Email", so the email colors are not checked. Restore the heading.');
  let emailFailures = 0;
  if (!argv.length) {
    const names = files.map((f) => f.replace(/^.*\//, '').replace(/\.css$/, ''));
    const lacks = names.filter((n) => !tables.themes.includes(n));
    const extra = tables.themes.filter((n) => !names.includes(n));
    if (lacks.length) throw new Error(`"### Email colors" in DESIGN.md has no column for ${lacks.join(', ')}. Add it, with the values that "npm run contrast -- themes/<name>.css" prints.`);
    if (extra.length) throw new Error(`"### Email colors" in DESIGN.md has a column for ${extra.join(', ')}, and themes/ has no such file.`);
  }
  for (const file of files) emailFailures += emailAudit(file, parseThemeCss(readSource(file), file), tables, fallbacks);
  const themes = `${files.length} ${files.length === 1 ? 'theme' : 'themes'}`;
  console.log(`email: ${tables.values.length} values and ${tables.pairs.length} pairs in ${themes}, ${emailFailures} that differ from "### Email colors" or fall below the minimum`);
  // The print colors of "## Print" belong to no theme, so a check of named theme files skips them.
  const printFailures = argv.length ? 0 : printAudit(body);
  return failures || emailFailures || printFailures ? 1 : 0;
}

// realpathSync, because npm links the bin entry: argv[1] is then the link, and import.meta.url its target.
const self = (() => { try { return pathToFileURL(realpathSync(process.argv[1])).href; } catch { return null; } })();
if (process.argv[1] && import.meta.url === self) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`contrast: ${e.message}`);
    process.exitCode = 1;
  }
}
