---
status: accepted
date: 2026-11-01
decision-makers: the developer
---

# Rune modules ship as JavaScript with types

## Context and Problem Statement

Three modules of the package use the runes of Svelte outside a component: `hooks/is-mobile`, `screen-query` and the context of `sidebar`. The registry and the preview wrote them as `.svelte.ts` files. A product now imports the package from `node_modules` ([0008](0008-a-product-imports-every-part-from-the-package.md)). In which form do these modules ship, so that `vite dev` of a product works with no configuration?

## Decision Drivers

- `vite dev`, the build and `svelte-check` of a product work with no line of configuration for the package.
- The package runs no script at install.
- A product sees the same types as from a TypeScript source.

## Considered Options

- Committed `.svelte.js` files with their types in JSDoc, and a committed `.svelte.d.ts` beside each one
- `.svelte.ts` source, and a line `optimizeDeps: { exclude: ['@stack-kit/stack'] }` in each product
- A build step that writes the JavaScript when npm installs the git dependency
- A package tool that builds the whole package into a folder of JavaScript

## Decision Outcome

Chosen option: "Committed `.svelte.js` files with their types in JSDoc, and a committed `.svelte.d.ts` beside each one", because it is the only option that met each driver with no new tool.

`scripts/rune-types.mjs` writes each `.svelte.d.ts` from its `.svelte.js` with TypeScript, and its `--check` in the check of `preview/` fails when a `.svelte.d.ts` differs, and when a `.svelte.ts` file is in a folder that ships. A new behaviour module that needs no rune is a plain `.ts` file, such as `behaviour/undo.ts`, because `vite dev` compiles a plain `.ts` file of the package.

### Consequences

- Good, because `vite dev` of a product works with no configuration.
- Good, because the import lines stay: each importer already named the modules with `.svelte.js`.
- Bad, because JSDoc types are longer to write than TypeScript.
- Bad, because the registry CLI writes the context of `sidebar` and `hooks/is-mobile` as `.svelte.ts` again at each update. The maintainer writes each change into the `.svelte.js` file, as "Take a change from the registry" in the README says.

### Confirmation

The test of 2026-11-01 installed a packed copy of the package into a new SvelteKit 3.0.1 project. With the `.svelte.ts` source, `vite dev` stopped at start with "Unexpected token" in `screen-query.svelte.ts`, because the dev prebundle of `@sveltejs/vite-plugin-svelte` compiles a `.svelte.ts` module of a package with no TypeScript step. With the `optimizeDeps` line, dev worked. With `.svelte.js` and `.svelte.d.ts`, dev worked with no line, the build passed and `svelte-check` gave 0 errors.

## Pros and Cons of the Options

### Committed `.svelte.js` files with their types in JSDoc, and a committed `.svelte.d.ts` beside each one

- Good, because each tool of a product reads plain JavaScript and a declaration file.
- Bad, because the `.svelte.d.ts` can differ from its source. The check compares them.

### `.svelte.ts` source, and a line `optimizeDeps: { exclude: ['@stack-kit/stack'] }` in each product

- Good, because the source stays TypeScript.
- Bad, because each product writes a line for the package, and a product without it fails in dev only.

### A build step that writes the JavaScript when npm installs the git dependency

- Good, because the source stays TypeScript.
- Bad, because npm then runs a script of the package at install. The theme check of STACK refuses a script such as `prepare` that makes npm build a git dependency.

### A package tool that builds the whole package into a folder of JavaScript

- Good, because each file then ships in its built form.
- Bad, because the files move, and the preview no longer reads the files that ship.
- Neutral, because the test did not try it.

## More Information

[0008](0008-a-product-imports-every-part-from-the-package.md) decides the import from the package.
