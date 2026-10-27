// The lock of the component copies. It writes preview/components.lock.json: for each folder of
// preview/src/lib/components/ui/, its files with their SHA-256, the folders that it uses, the packages
// that it needs and the files that STACK changed. It gives the exact version of each package, from
// preview/package-lock.json. A product copies the folders from its copy of a release and installs these
// versions, so it gets the files and the versions that STACK tested.
//
//   node scripts/component-lock.mjs           writes preview/components.lock.json
//   node scripts/component-lock.mjs --check   writes nothing, and exits 1 when the lock differs from the copies
//
// Run it from the root of the repository. The "version" script of package.json runs it, so that
// "npm version" puts a fresh lock into the release commit and its tag.
//
// "uses" holds each folder that a component imports, also through another folder. "packages" holds each
// package that the files of the component, of its "uses" and of the shared files import, and each peer
// that those packages require. "css" holds the packages that the global CSS of the preview imports.
// "edited" holds the files that STACK changed after the copy from the registry.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SHADCN_SVELTE, REGISTRY_SNAPSHOT } from './components.mjs';

const OUT = 'preview/components.lock.json';
const LIB = 'preview/src/lib';
const UI = 'components/ui';
const NOTICE = `${UI}/LICENSE.md`;
// The dist/tailwind.css of the package shadcn-svelte, byte for byte. The global CSS of the preview and of a
// product imports it from the release, so a product installs no shadcn-svelte package.
const STYLE = `${UI}/shadcn-svelte.css`;
const CSS = 'preview/src/routes/layout.css';
// The files that STACK changed after the copy from the registry, relative to the ui folder. The CLI writes
// them back in the registry form at an update, so the maintainer applies each change again.
export const EDITED = [
  'chart/chart-container.svelte',
  'checkbox/checkbox.svelte',
  'radio-group/radio-group-item.svelte',
  'slider/slider.svelte',
  'switch/switch.svelte',
];
const SPEC = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g;

const read = (p) => readFileSync(join(LIB, p));
const sha256 = (p) => createHash('sha256').update(read(p)).digest('hex');

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
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** What the file p imports: the files under LIB and the packages. */
function imports(p) {
  const files = [];
  const packages = [];
  for (const m of read(p).toString('utf8').matchAll(SPEC)) {
    const spec = m[1] ?? m[2];
    let to;
    if (spec === '#lib') to = 'index.js';
    else if (spec.startsWith('#lib/')) to = spec.slice(5);
    else if (spec.startsWith('./') || spec.startsWith('../')) to = posix.normalize(posix.join(posix.dirname(p), spec));
    else {
      packages.push(packageName(spec));
      continue;
    }
    const found = [to, to.replace(/\.js$/, '.ts')].find((c) => !c.startsWith('../') && existsSync(join(LIB, c)));
    if (!found) throw new Error(`${LIB}/${p} imports "${spec}", and ${LIB}/${to} does not exist.`);
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
    if (!p) throw new Error(`the copies need the package "${n}", and preview/package-lock.json does not hold it. Install it in preview/ with "npm install -E".`);
    out.add(n);
    const optional = p.peerDependenciesMeta ?? {};
    for (const peer of Object.keys(p.peerDependencies ?? {})) if (!optional[peer]?.optional) queue.push(peer);
  }
  return [...out].sort();
}

/** The lock object for the copies on disk. */
export function build() {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const config = JSON.parse(readFileSync('preview/components.json', 'utf8'));
  const lock = JSON.parse(readFileSync('preview/package-lock.json', 'utf8'));
  const shared = ['utils.ts', ...walk('hooks'), NOTICE, STYLE];
  for (const s of shared) if (!existsSync(join(LIB, s))) throw new Error(`${LIB}/${s} does not exist. The release ships it with the copies.`);

  const folders = readdirSync(join(LIB, UI), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const filesOf = new Map(folders.map((f) => [f, walk(posix.join(UI, f))]));
  const folderOf = (p) => (p.startsWith(`${UI}/`) && p.slice(UI.length + 1).includes('/') ? p.slice(UI.length + 1).split('/')[0] : null);
  for (const e of EDITED) if (!filesOf.get(e.split('/')[0])?.includes(posix.join(UI, e))) throw new Error(`EDITED names ${LIB}/${UI}/${e}, which does not exist. Correct the list in scripts/component-lock.mjs.`);

  const components = {};
  for (const folder of folders) {
    const uses = new Set();
    const packages = new Set();
    const seen = new Set();
    const queue = [...filesOf.get(folder)];
    while (queue.length) {
      const p = queue.pop();
      if (seen.has(p)) continue;
      seen.add(p);
      const found = imports(p);
      found.packages.forEach((n) => packages.add(n));
      for (const to of found.files) {
        const other = folderOf(to);
        if (other && other !== folder && !uses.has(other)) {
          uses.add(other);
          queue.push(...filesOf.get(other));
        } else if (!other && !shared.includes(to)) {
          throw new Error(`${LIB}/${p} imports ${LIB}/${to}, which the release does not ship. Ship it with the copies, or remove the import.`);
        } else queue.push(to);
      }
    }
    const prefix = `${UI}/${folder}/`;
    components[folder] = {
      files: Object.fromEntries(filesOf.get(folder).map((p) => [p.slice(prefix.length), sha256(p)])),
      uses: [...uses].sort(),
      packages: withPeers(packages, lock),
      edited: EDITED.filter((e) => e.startsWith(`${folder}/`)).map((e) => e.slice(folder.length + 1)),
    };
  }

  const css = withPeers(
    [...readFileSync(CSS, 'utf8').matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]).filter((s) => !s.startsWith('.')).map(packageName),
    lock,
  );
  const all = [...new Set([...css, ...Object.values(components).flatMap((c) => c.packages)])].sort();
  return {
    stack: version,
    source: { cli: `shadcn-svelte@${SHADCN_SVELTE}`, style: config.style, registry: config.registry, snapshot: REGISTRY_SNAPSHOT },
    root: LIB,
    shared: Object.fromEntries(shared.map((p) => [p, sha256(p)])),
    css,
    packages: Object.fromEntries(all.map((n) => [n, lock.packages[`node_modules/${n}`].version])),
    components,
  };
}

/** The leaves of a JSON value, as "a.b.c" -> value. */
function leaves(v, path = '', out = new Map()) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, x] of Object.entries(v)) leaves(x, path ? `${path}.${k}` : k, out);
  } else out.set(path, JSON.stringify(v));
  return out;
}

function main(argv) {
  const unknown = argv.filter((a) => a !== '--check');
  if (unknown.length) throw new Error(`unknown argument "${unknown[0]}". Give no argument to write ${OUT}, or --check to compare it.`);
  if (!existsSync('preview/package-lock.json')) throw new Error('preview/package-lock.json not found. Run this from the root of the repository.');
  const want = build();
  const text = `${JSON.stringify(want, null, '\t')}\n`;
  const count = `${Object.keys(want.components).length} folders, ${Object.values(want.components).reduce((n, c) => n + Object.keys(c.files).length, 0)} files and ${Object.keys(want.packages).length} packages`;
  if (!argv.includes('--check')) {
    writeFileSync(OUT, text);
    console.log(`lock: wrote ${OUT}, ${count}`);
    return 0;
  }
  if (!existsSync(OUT)) {
    console.error(`lock: ${OUT} does not exist. Run "npm run lock".`);
    return 1;
  }
  const have = readFileSync(OUT, 'utf8');
  if (have === text) {
    console.log(`lock: ${OUT} matches the copies, ${count}`);
    return 0;
  }
  const a = leaves(JSON.parse(have));
  const b = leaves(want);
  const keys = [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
  for (const k of keys.slice(0, 10)) console.error(`lock: ${k}: the lock holds ${a.get(k) ?? 'nothing'}, and the copies give ${b.get(k) ?? 'nothing'}.`);
  if (keys.length > 10) console.error(`lock: ${keys.length - 10} more differences.`);
  console.error(`lock: ${OUT} differs from the copies. Run "npm run lock", and commit the lock with the change of the copies.`);
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
