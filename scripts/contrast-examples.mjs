#!/usr/bin/env node
// The example contrast check. It looks in a folder for example layers: each subfolder that holds both
// product.css and product-pairs.json. For each layer, in name order, it runs the product check of
// scripts/contrast.mjs against the themes default and graphite, and it prints what that check prints.
// It exits 1 when any run fails. When the folder holds no layer, it says so and exits 0.
//
//   node scripts/contrast-examples.mjs [--dir <folder>]   default: preview/src/lib/examples
//   A relative folder is read from the repository root.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const argv = process.argv.slice(2);
const at = argv.indexOf('--dir');
if (at !== -1 && !argv[at + 1]) {
  console.error('contrast:examples: --dir needs a folder');
  process.exit(1);
}
const dir = at === -1 ? 'preview/src/lib/examples' : argv[at + 1];
const base = resolve(root, dir);

const layers = existsSync(base)
  ? readdirSync(base)
      .sort()
      .filter(
        (name) =>
          statSync(join(base, name)).isDirectory() &&
          existsSync(join(base, name, 'product.css')) &&
          existsSync(join(base, name, 'product-pairs.json'))
      )
  : [];

if (layers.length === 0) {
  console.log(`contrast:examples: no example layer in ${dir}`);
  process.exit(0);
}

let failed = false;
for (const name of layers) {
  const run = spawnSync(
    process.execPath,
    [
      'scripts/contrast.mjs',
      '--layer', `${dir}/${name}/product.css`,
      '--pairs', `${dir}/${name}/product-pairs.json`,
      '--theme', 'default',
      '--theme', 'graphite'
    ],
    { cwd: root, stdio: 'inherit' }
  );
  if (run.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
