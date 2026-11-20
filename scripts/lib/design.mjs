// The shared reader of DESIGN.md and of the theme files.
// Every script in scripts/ reads the design file through this module.
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// yaml is a dev dependency, so it loads on the first call of readDesign() and not on import. The
// product check of contrast.mjs reads no front matter, so it runs where yaml is not installed.
// Where yaml is not installed, as in the npm package, readDesign() takes the front matter of the
// DESIGN.md of this copy from FRONT_COPY, which "npm run theme" writes and "npm run theme -- --check"
// compares. Only an installed package uses the copy; a clone requires yaml. So the theme generator, and
// the contrast check that it runs on its file, run from the package in a product with no yaml. A bare
// stack-contrast of a theme file from a product root needs a DESIGN.md there, and it exits 1.
const require = createRequire(import.meta.url);
export const FRONT_COPY = 'scripts/lib/design-front.json';
/** A path in the copy of this repository that holds this file. */
const own = (path) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

// The names that the Theme tab of the shadcn create page writes, in its order.
// A pasted theme has these names and no others. Every other colour name is an
// added role, and it needs an entry in `theme-fallbacks`.
export const SHADCN_NAMES = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
];

/** The text of a file, from the working tree or from the index. null when the file does not exist. */
export function readSource(path, o = {}) {
  if (o.staged) {
    try {
      return execFileSync('git', ['show', `:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return null;
    }
  }
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

/** Splits "---\n<yaml>\n---\n<body>". bodyLine is the 1-based line number of the first body line. */
export function splitFrontMatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') throw new Error('DESIGN.md: the first line must be "---".');
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end < 0) throw new Error('DESIGN.md: the front matter has no closing "---" line.');
  return {
    yamlText: lines.slice(1, end).join('\n'),
    body: lines.slice(end + 1).join('\n'),
    bodyLine: end + 2,
  };
}

/** Parses the front matter. Duplicate keys are an error. Key order is the order of the file. */
export function readDesign(text) {
  const { yamlText, body, bodyLine } = splitFrontMatter(text);
  const front = parseFront(yamlText, text);
  if (!front || typeof front !== 'object') throw new Error('DESIGN.md: the front matter is empty.');
  return { front, body, bodyLine };
}

/** The front matter through yaml, or from FRONT_COPY when yaml is not installed. */
function parseFront(yamlText, text) {
  let yaml;
  try {
    yaml = require('yaml');
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e;
    // A clone or a worktree has a .git entry. There the copy would check itself, so yaml is required.
    if (existsSync(own('.git'))) throw e;
    // The copy holds the front matter of the DESIGN.md of this copy only, so it serves no other text.
    if (text !== readSource(own('DESIGN.md'))) {
      throw new Error(`the package yaml is not installed, so this reader reads only the DESIGN.md beside scripts/, from ${FRONT_COPY}. To read another DESIGN.md, run "npm ci" in a clone of the repository.`);
    }
    const copy = readSource(own(FRONT_COPY));
    if (copy === null) throw new Error(`the package yaml is not installed, and ${FRONT_COPY} does not exist. Run "npm run theme" in the repository, or "npm ci" to install yaml.`);
    return JSON.parse(copy);
  }
  return yaml.parse(yamlText, { uniqueKeys: true });
}

/** The light and the dark colour maps. Throws when the two name sets differ. */
export function colorSets(front) {
  const colors = front.colors ?? {};
  const light = new Map();
  for (const [name, value] of Object.entries(colors)) {
    if (name === 'dark') continue;
    if (typeof value !== 'string') throw new Error(`colors.${name}: the value must be a string.`);
    light.set(name, value);
  }
  const dark = new Map();
  for (const [name, value] of Object.entries(colors.dark ?? {})) {
    if (typeof value !== 'string') throw new Error(`colors.dark.${name}: the value must be a string.`);
    dark.set(name, value);
  }
  const missing = [...light.keys()].filter((n) => !dark.has(n));
  const extra = [...dark.keys()].filter((n) => !light.has(n));
  if (missing.length || extra.length) {
    const parts = [];
    if (missing.length) parts.push(`colors.dark lacks ${missing.join(', ')}`);
    if (extra.length) parts.push(`colors.dark has names that colors lacks: ${extra.join(', ')}`);
    throw new Error(`${parts.join('; ')}. The two sets must hold the same names.`);
  }
  return { light, dark };
}

/** "{colors.x}" -> "x". Throws on any other form, on colors.dark.*, and on an unknown name. */
export function resolveRef(front, ref) {
  const m = /^\{colors\.([a-z0-9-]+(?:\.[a-z0-9-]+)*)\}$/.exec(String(ref));
  if (!m) throw new Error(`${ref}: a colour reference has the form "{colors.<name>}".`);
  const name = m[1];
  if (name.startsWith('dark.')) throw new Error(`${ref}: a component references the light name; the dark value follows from the mode.`);
  if (!Object.hasOwn(front.colors ?? {}, name)) throw new Error(`${ref}: colors has no name "${name}".`);
  return name;
}

/** The text of "## title" up to the next "## " heading. Fence aware. line is 1-based within body; -1 when absent. */
export function section(body, title) {
  const lines = body.split('\n');
  let fence = null;
  let start = -1;
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const f = /^\s*(```+|~~~+)/.exec(l);
    if (f) {
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
    }
    if (!fence && !f && /^## /.test(l)) {
      if (start >= 0) break;
      if (l.slice(3).trim() === title) start = i;
      continue;
    }
    if (start >= 0) out.push(l);
  }
  return { text: out.join('\n'), line: start >= 0 ? start + 1 : -1 };
}

/**
 * Parses a theme file in the Theme tab form: comments, ":root { --n: v; }" and ".dark { --n: v; }".
 * Anything else throws with the line number. Names come back without "--".
 */
export function parseThemeCss(css, file = 'theme') {
  // Keep the line count when a comment goes away, so that errors name the right line.
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const blocks = { root: new Map(), dark: new Map() };
  const seen = new Set();
  const lineAt = (i) => text.slice(0, i).split('\n').length;
  const re = /\s*(:root|\.dark)\s*\{([^{}]*)\}/y;
  let i = 0;
  while (i < text.length) {
    if (/^\s*$/.test(text.slice(i))) break;
    re.lastIndex = i;
    const m = re.exec(text);
    if (!m) {
      const at = i + (/^\s*/.exec(text.slice(i))[0].length);
      throw new Error(`${file}:${lineAt(at)}: a theme file holds only comments, ":root {}" and ".dark {}".`);
    }
    const key = m[1] === ':root' ? 'root' : 'dark';
    if (seen.has(key)) throw new Error(`${file}:${lineAt(m.index)}: "${m[1]}" appears twice.`);
    seen.add(key);
    const bodyStart = m.index + m[0].indexOf('{') + 1;
    let off = 0;
    for (const decl of m[2].split(';')) {
      const at = bodyStart + off;
      off += decl.length + 1;
      if (/^\s*$/.test(decl)) continue;
      const d = /^\s*--([a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/.exec(decl);
      const line = lineAt(at + (/^\s*/.exec(decl)[0].length));
      if (!d) throw new Error(`${file}:${line}: expected "--<name>: <value>;".`);
      if (blocks[key].has(d[1])) throw new Error(`${file}:${line}: --${d[1]} appears twice in ${m[1]}.`);
      blocks[key].set(d[1], d[2]);
    }
    i = m.index + m[0].length;
  }
  return blocks;
}
