// The record of the tested versions. It writes preview/components.lock.json: for each export path of
// package.json that holds code, and for ./stack.css, the other export paths that it uses, the packages
// that it needs and the files that STACK changed after the copy from the registry. It gives the exact
// version of each package, from preview/package-lock.json. From these versions it writes the
// peerDependencies and the peerDependenciesMeta of package.json.
//
//   node scripts/component-lock.mjs                       writes the record and the peers of package.json
//   node scripts/component-lock.mjs --check               writes nothing, and exits 1 when the record or the
//                                                         peers of package.json differ from the files
//   node scripts/component-lock.mjs print <export path>   prints the npm install line of the packages that
//                                                         the export paths need, such as ./parts/ListSplit
//
// Run it from the root of the repository. The "version" script of package.json runs it, so that
// "npm version" puts a fresh record into the release commit and its tag.
//
// The release ships the files of "files" in package.json. Each code file under preview/src/lib that it
// ships may import only another file that it ships. A file outside preview/src/lib counts only when
// "files" names it by its own path, and it may import nothing, because the scan does not follow it.
// An import of any other file stops the script, and so does an import that the scan cannot read:
// import() of a template literal or of a computed name, and import.meta.glob.
//
// "uses" holds each other export path that an entry imports, also through another file. It does not
// name ./utils and ./hooks/*, because nearly every component imports them. "packages" holds each package
// that the files of the entry and of its "uses" import, and each peer that those packages require.
// An import of $app/* counts as the package @sveltejs/kit. "edited" holds the files of a registry
// folder that STACK changed after the copy from the registry. The entry ./stack.css holds the packages
// that the CSS lines of a product need, from the global CSS of the preview.
//
// Each package of the record is a peer with the range "^<version>". It is optional, unless ./stack.css
// or a ./behaviour/* entry needs it, or CORE names it, or a package of these three requires it as a peer.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = 'preview/components.lock.json';
const LIB = 'preview/src/lib';
const UI = 'components/ui';
const NOTICE = `${UI}/LICENSE.md`;
// The dist/tailwind.css of the package shadcn-svelte, byte for byte. The global CSS of the preview and of a
// product imports it from the release, so a product installs no shadcn-svelte package.
const STYLE = `${UI}/shadcn-svelte.css`;
const CSS = 'preview/src/routes/layout.css';
// The files that STACK changed after the copy from the registry, relative to the ui folder. The CLI writes
// them back in the registry form at an update, so the maintainer applies each change again. The registry
// gives sidebar/context.svelte.ts. STACK writes it as JavaScript with JSDoc, because no rune module ships
// as TypeScript, and scripts/rune-types.mjs writes its .svelte.d.ts.
export const EDITED = [
  'chart/chart-container.svelte',
  'checkbox/checkbox.svelte',
  'radio-group/radio-group-item.svelte',
  'sidebar/context.svelte.js',
  'slider/slider.svelte',
  'switch/switch.svelte',
];
// The peers that a product must have, besides the packages of ./stack.css and ./behaviour/*. The parts
// import $app/* of @sveltejs/kit, and nearly every component imports the other five.
export const CORE = ['@lucide/svelte', '@sveltejs/kit', 'bits-ui', 'cn', 'svelte', 'tailwind-variants'];
const SPEC = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g;
// The imports that SPEC cannot read: an import() whose argument is not one string literal, and import.meta.glob.
const UNREAD = /(?<![\w$.])import\s*\((?!\s*(['"])[^'"\n]*\1\s*[,)])|(?<![\w$.])import\.meta\.glob\b/;
const SCRIPT = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
const CODE = /\.(svelte|ts|js)$/;

const read = (p) => readFileSync(join(LIB, p), 'utf8');

/** The files under LIB/dir, as sorted paths relative to LIB. Finder writes .DS_Store, and npm never packs it. */
function walk(dir) {
  const out = [];
  for (const e of readdirSync(join(LIB, dir), { withFileTypes: true })) {
    if (e.name === '.DS_Store') continue;
    const p = posix.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out.sort();
}

/** The package of a bare import, such as "@lucide/svelte" for "@lucide/svelte/icons/check". */
function packageName(spec) {
  if (spec.startsWith('$app/')) return '@sveltejs/kit';
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** The files under LIB that "files" of package.json ships, as paths relative to LIB. */
function shippedFiles(pkg) {
  const out = new Set();
  for (const f of pkg.files ?? []) {
    if (!f.startsWith(`${LIB}/`)) continue;
    const rel = f.slice(LIB.length + 1).replace(/\/$/, '');
    if (!existsSync(join(LIB, rel))) throw new Error(`"files" of package.json names ${f}, which does not exist.`);
    if (f.endsWith('/')) walk(rel).forEach((p) => out.add(p));
    else out.add(rel);
  }
  return out;
}

/** The files that "files" of package.json names by their own path outside LIB, such as scripts/lib/email-roles.mjs. */
function shippedOutside(pkg) {
  return new Set((pkg.files ?? []).filter((f) => !f.startsWith(`${LIB}/`) && !f.endsWith('/')));
}

/**
 * What the code file p imports: the files under LIB and the packages. In a .svelte file, only its script
 * blocks. An import of a file in outside adds nothing to the record, because that file imports nothing.
 */
function importsOf(p, shipped, outside) {
  const text = read(p);
  const code = p.endsWith('.svelte') ? [...text.matchAll(SCRIPT)].map((m) => m[1]).join('\n') : text;
  const unread = UNREAD.exec(code);
  if (unread) {
    const at = code.slice(unread.index).split('\n')[0].slice(0, 60);
    throw new Error(`${LIB}/${p} holds "${at}", an import that this script cannot read. Write the import with one string literal, such as import('./file.js'), so that the record holds what the file needs.`);
  }
  const files = [];
  const packages = [];
  for (const m of code.matchAll(SPEC)) {
    const spec = m[1] ?? m[2];
    let to;
    if (spec === '#lib') to = 'index.js';
    else if (spec.startsWith('#lib/')) to = spec.slice(5);
    else if (spec.startsWith('./') || spec.startsWith('../')) to = posix.normalize(posix.join(posix.dirname(p), spec));
    else {
      packages.push(packageName(spec));
      continue;
    }
    if (to.startsWith('../')) {
      const file = posix.normalize(posix.join(LIB, to));
      if (!outside.has(file)) throw new Error(`${LIB}/${p} imports "${spec}", which lies outside ${LIB}. The release ships a file outside ${LIB} only when "files" of package.json names it, and "files" does not name ${file}. Add it to "files", or remove the import.`);
      if (!existsSync(file)) throw new Error(`${LIB}/${p} imports "${spec}", and ${file} does not exist.`);
      const text = readFileSync(file, 'utf8');
      if ([...text.matchAll(SPEC)].length || UNREAD.test(text)) throw new Error(`${LIB}/${p} imports ${file}, which lies outside ${LIB} and imports another module. This script does not follow an import outside ${LIB}, so the record would miss what that module needs. Remove the import from ${file}, or move the file into ${LIB}.`);
      continue;
    }
    const found = [to, to.replace(/\.js$/, '.ts')].find((c) => existsSync(join(LIB, c)));
    if (!found) throw new Error(`${LIB}/${p} imports "${spec}", and ${LIB}/${to} does not exist.`);
    if (!shipped.has(found)) throw new Error(`${LIB}/${p} imports ${LIB}/${found}, which the release does not ship. Add it to "files" of package.json, or remove the import.`);
    files.push(found);
  }
  return { files, packages };
}

/** The packages of names and every peer that they require, from the lock of the preview. */
function withPeers(names, lock) {
  const out = new Set();
  const queue = [...names];
  while (queue.length) {
    const n = queue.pop();
    if (out.has(n)) continue;
    const p = lock.packages[`node_modules/${n}`];
    if (!p) throw new Error(`the release needs the package "${n}", and preview/package-lock.json does not hold it. Install it in preview/ with "npm install -E".`);
    out.add(n);
    const optional = p.peerDependenciesMeta ?? {};
    for (const peer of Object.keys(p.peerDependencies ?? {})) if (!optional[peer]?.optional) queue.push(peer);
  }
  return [...out].sort();
}

/** The target of an export path, from "exports" of package.json, or null when the map has no such path. */
export function resolveExport(pkg, path) {
  for (const [key, target] of Object.entries(pkg.exports ?? {})) {
    if (key === path) return target;
    const star = key.indexOf('*');
    if (star < 0) continue;
    const [head, tail] = [key.slice(0, star), key.slice(star + 1)];
    if (path.length > head.length + tail.length && path.startsWith(head) && path.endsWith(tail)) return target.replace('*', path.slice(head.length, path.length - tail.length));
  }
  return null;
}

/** The export paths of code, each with the files under LIB that it owns. An export of an index.ts owns its whole folder. */
function exportEntries(pkg, shipped) {
  const entries = new Map();
  const own = (key, target) => {
    const file = target.slice(LIB.length + 3);
    const files = posix.basename(file) === 'index.ts' ? [...shipped].filter((p) => p.startsWith(`${posix.dirname(file)}/`)).sort() : [file];
    entries.set(key, files);
  };
  for (const [key, target] of Object.entries(pkg.exports ?? {})) {
    if (typeof target !== 'string') throw new Error(`"exports" of package.json maps ${key} to an object. This script reads a path only.`);
    if (!CODE.test(target)) continue;
    if (!target.startsWith(`./${LIB}/`)) throw new Error(`"exports" of package.json maps ${key} to ${target}, outside ${LIB}.`);
    const star = target.indexOf('*');
    if (star < 0) {
      if (!shipped.has(target.slice(LIB.length + 3))) throw new Error(`"exports" of package.json maps ${key} to ${target}, which the release does not ship.`);
      own(key, target);
      continue;
    }
    const [head, tail] = [target.slice(LIB.length + 3, star), target.slice(star + 1)];
    for (const p of [...shipped].sort()) {
      if (p.length <= head.length + tail.length || !p.startsWith(head) || !p.endsWith(tail)) continue;
      own(key.replace('*', p.slice(head.length, p.length - tail.length)), `./${LIB}/${p}`);
    }
  }
  return entries;
}

/** The record object for the files on disk. */
export function build() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const lock = JSON.parse(readFileSync('preview/package-lock.json', 'utf8'));
  const shipped = shippedFiles(pkg);
  const outside = shippedOutside(pkg);
  for (const s of [NOTICE, STYLE]) if (!shipped.has(s)) throw new Error(`${LIB}/${s} is not in "files" of package.json. The release ships it with the components.`);
  for (const e of EDITED) if (!shipped.has(posix.join(UI, e))) throw new Error(`EDITED names ${LIB}/${UI}/${e}, which the release does not ship. Correct the list in scripts/component-lock.mjs.`);

  // Each code file that ships, also one that no export path reaches, may import only a file that ships.
  const found = new Map([...shipped].filter((p) => CODE.test(p)).map((p) => [p, importsOf(p, shipped, outside)]));
  const entries = exportEntries(pkg, shipped);
  const owner = new Map([...entries].flatMap(([key, files]) => files.map((f) => [f, key])));
  const named = (key) => key !== './utils' && !key.startsWith('./hooks/');

  const components = {};
  for (const [key, files] of [...entries].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const uses = new Set();
    const packages = new Set();
    const seen = new Set();
    const queue = [...files];
    while (queue.length) {
      const p = queue.pop();
      if (seen.has(p)) continue;
      seen.add(p);
      const { files: to, packages: names } = found.get(p) ?? { files: [], packages: [] };
      names.forEach((n) => packages.add(n));
      for (const t of to) {
        const other = owner.get(t);
        if (other && other !== key) {
          if (named(other)) uses.add(other);
          queue.push(...entries.get(other));
        } else queue.push(t);
      }
    }
    components[key] = {
      uses: [...uses].sort(),
      packages: withPeers(packages, lock),
      edited: EDITED.filter((e) => files.includes(posix.join(UI, e))).map((e) => e.slice(e.indexOf('/') + 1)),
    };
  }
  const css = [...readFileSync(CSS, 'utf8').matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]).filter((s) => !s.startsWith('.')).map(packageName);
  components['./stack.css'] = { uses: [], packages: withPeers(css, lock), edited: [] };
  const sorted = Object.fromEntries(Object.entries(components).sort(([a], [b]) => (a < b ? -1 : 1)));
  const all = [...new Set(Object.values(sorted).flatMap((c) => c.packages))].sort();
  return {
    stack: pkg.version,
    packages: Object.fromEntries(all.map((n) => [n, lock.packages[`node_modules/${n}`].version])),
    components: sorted,
  };
}

/** The peerDependencies and the peerDependenciesMeta of package.json for a record and the lock of the preview. */
export function peers(record, lock) {
  const core = new Set(
    withPeers(
      [
        ...CORE,
        ...Object.entries(record.components)
          .filter(([k]) => k === './stack.css' || k.startsWith('./behaviour/'))
          .flatMap(([, c]) => c.packages),
      ],
      lock,
    ),
  );
  const names = Object.keys(record.packages).sort();
  return {
    peerDependencies: Object.fromEntries(names.map((n) => [n, `^${record.packages[n]}`])),
    peerDependenciesMeta: Object.fromEntries(names.filter((n) => !core.has(n)).map((n) => [n, { optional: true }])),
  };
}

/** The leaves of a JSON value, as "a.b.c" -> value. */
function leaves(v, path = '', out = new Map()) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, x] of Object.entries(v)) leaves(x, path ? `${path}.${k}` : k, out);
  } else out.set(path, JSON.stringify(v));
  return out;
}

/** One line for each leaf that differs, at most ten, in the words of the caller. */
function differences(have, want, line) {
  const a = leaves(have);
  const b = leaves(want);
  const keys = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
  const out = keys.slice(0, 10).map((k) => line(k, a.get(k) ?? 'nothing', b.get(k) ?? 'nothing'));
  if (keys.length > 10) out.push(`lock: ${keys.length - 10} more differences.`);
  return out;
}

/** The npm install line for the packages of the export paths that a product imports. */
function print(paths) {
  if (!paths.length) throw new Error('print needs one or more export paths, such as ./stack.css ./ui/button ./parts/ListSplit.');
  if (!existsSync(OUT)) throw new Error(`${OUT} does not exist. Run "npm run lock".`);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const record = JSON.parse(readFileSync(OUT, 'utf8'));
  const names = new Set();
  for (const arg of paths) {
    const path = arg.startsWith(`${pkg.name}/`) ? `.${arg.slice(pkg.name.length)}` : arg;
    const entry = record.components[path];
    if (entry) {
      entry.packages.forEach((n) => names.add(n));
      continue;
    }
    const target = resolveExport(pkg, path);
    if (!target) throw new Error(`the package exports no path "${arg}". An export path is a key of "exports" in package.json, such as ./ui/button or ./parts/ListSplit.`);
    if (!existsSync(target)) throw new Error(`"${arg}" points to ${target}, which does not exist.`);
    if (CODE.test(target)) throw new Error(`${OUT} has no entry for "${arg}". Run "npm run lock".`);
  }
  if (!names.size) {
    console.error('lock: these export paths need no package.');
    return 0;
  }
  console.log(`npm install -D -E ${[...names].sort().map((n) => `${n}@${record.packages[n]}`).join(' ')}`);
  return 0;
}

function main(argv) {
  if (!existsSync('preview/package-lock.json')) throw new Error('preview/package-lock.json not found. Run this from the root of the repository.');
  if (argv[0] === 'print') return print(argv.slice(1));
  const unknown = argv.filter((a) => a !== '--check');
  if (unknown.length) throw new Error(`unknown argument "${unknown[0]}". Give no argument to write ${OUT}, --check to compare it, or print <export path>... for the npm install line.`);
  const want = build();
  const text = `${JSON.stringify(want, null, '\t')}\n`;
  const pkgText = readFileSync('package.json', 'utf8');
  const pkg = JSON.parse(pkgText);
  const wantPeers = peers(want, JSON.parse(readFileSync('preview/package-lock.json', 'utf8')));
  const count = `${Object.keys(want.components).length} export paths and ${Object.keys(want.packages).length} packages`;
  if (!argv.includes('--check')) {
    writeFileSync(OUT, text);
    console.log(`lock: wrote ${OUT}, ${count}`);
    const next = `${JSON.stringify({ ...pkg, ...wantPeers }, null, 2)}\n`;
    if (next !== pkgText) {
      writeFileSync('package.json', next);
      console.log('lock: wrote the peers of package.json. Run "npm install" in the root, so that package-lock.json holds them.');
    }
    return 0;
  }
  const problems = [];
  if (!existsSync(OUT)) problems.push(`lock: ${OUT} does not exist.`);
  else if (readFileSync(OUT, 'utf8') !== text) {
    problems.push(...differences(JSON.parse(readFileSync(OUT, 'utf8')), want, (k, a, b) => `lock: ${k}: the record holds ${a}, and the files give ${b}.`));
    problems.push(`lock: ${OUT} differs from the files.`);
  }
  const havePeers = { peerDependencies: pkg.peerDependencies ?? {}, peerDependenciesMeta: pkg.peerDependenciesMeta ?? {} };
  if (JSON.stringify(havePeers) !== JSON.stringify(wantPeers)) {
    problems.push(...differences(havePeers, wantPeers, (k, a, b) => `lock: package.json ${k} holds ${a}, and the record gives ${b}.`));
    problems.push('lock: the peers of package.json differ from the record.');
  }
  if (!problems.length) {
    console.log(`lock: ${OUT} and the peers of package.json match the files, ${count}`);
    return 0;
  }
  for (const p of problems) console.error(p);
  console.error('lock: run "npm run lock", then "npm install" in the root, and commit the record, package.json and package-lock.json with the change of the files.');
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`lock: ${e.message}`);
    process.exitCode = 1;
  }
}
