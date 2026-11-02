---
status: accepted
date: 2026-11-01
decision-makers: the developer
---

# A product imports every part from the package

## Context and Problem Statement

Up to v1.0.0, a product copied the component files of a release into its own code, and installed the packages of the lock with `npm install -E` ([0006](0006-where-a-product-gets-the-component-files.md)). The parts that STACK adds had no folder at all: a product built each one from the classes of its example in `DESIGN.md`. So a product held a copy of each component and of each part that it used. An update meant a new copy of each folder, a review of the diff of each copy, and a new build of each part by hand. A product that needed a change of a part changed its own copy, although the rules forbade an edit. How does a product take the components and the parts, so that an update is one change of the pin, and a change of the look of a part reaches a product with no edit?

## Decision Drivers

- An update is one change of the version in the dependency line of the product.
- A product gets exactly the files and the package versions that STACK tested.
- A change of the look of a part happens inside the part, and a product changes no file for it.
- The import works in the build, in the built server, in `vite dev` and in `svelte-check`, with no configuration in the product.
- An import that the release does not support fails loudly, and does not work by chance.

## Considered Options

- An `exports` map over the folders of the package, with the files where they are
- The copy model of [0006](0006-where-a-product-gets-the-component-files.md), with a part folder for each part
- A move of every shipped file into one folder that a package tool builds
- No `exports` map: a product imports each file by its path in the package

## Decision Outcome

Chosen option: "An `exports` map over the folders of the package, with the files where they are", because it met each driver in the test of 2026-11-01, and no file of a part moves.

The map gives one prefix for each kind of import: `./ui/<name>` for a component of the registry, `./parts/<Name>` for a part of STACK, `./behaviour/<name>` for a behaviour module, `./outside/<Name>` for a page outside the frame, and `./utils`, `./hooks/<name>` and `./patterns` for the parts of a product. It also names each other path that a product reads: the CSS files, the themes, `DESIGN.md`, `chart-patterns.svg`, `architecture/keys.json`, the record of the tested versions and the contract. An `imports` field maps `#lib/*` inside the package, so the files keep their import lines.

The package declares no dependency. Each package that its files import is a peer, with the caret range of the version in the record `preview/components.lock.json`. A peer that only some parts need is optional in `peerDependenciesMeta`. A product installs the packages of the export paths that it imports, and each required peer, at the exact versions of the record, with `npm install -D -E`. `stack.css` starts with the `@source` lines of the shipped folders, so Tailwind finds the classes of the parts, and a product writes no line for them. The record keeps the export paths that each entry uses, its packages and the files that STACK changed after the copy from the registry. The SHA-256 of each file goes, because no product holds a copy to compare.

"Install the packages", "Import a part" and "Delete the copies" in the README give the steps.

### Consequences

- Good, because an update is one change of the pin, then one install line and the check of the product.
- Good, because a change of the look of a part reaches every product with the next release, and the product changes no file.
- Good, because every old path to a file inside the package fails at the update, so the move from a copy is loud and complete.
- Good, because the map is the public surface of the package. A file can move behind the map in a later release, and no product sees the move.
- Neutral, because each product rewrites its import lines once, at the update to v2.0.0, and deletes its copies.
- Bad, because the `svelte-check` of a product reports no type error inside a file of the package. So STACK checks its own part sources, with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- Bad, because a fix of a part reaches a product only through a release of STACK.

### Confirmation

The test of 2026-11-01 installed a packed copy of the package with the map into a new SvelteKit 3.0.1 project:

- `vite build` passed, and each route of the built server answered 200. `vite dev` answered 200 with no configuration in the project.
- `svelte-check` gave 0 errors, and it saw the real props types through the map: each `@ts-expect-error` probe met a real error.
- An import of a file by its path inside the package failed in all three tools. The build stopped with "is not exported under the conditions", `svelte-check` reported "Cannot find module", and `vite dev` answered 500.
- With the `@source` lines in `stack.css`, the built CSS held 9 of 9 probe classes of the parts. With no `@source` line, it held 0 of 9.
- With `tw-animate-css` 1.4.0 in `dependencies`, the server build of `vite build` stopped with `"." is not exported under the conditions ["node", "module-sync", "import"]`, because the package exports its CSS under the `style` condition only. With the package in `devDependencies`, the build passed. A control of 2026-11-02 gave the same two results with the install line of the record.

From v2.0.0, a test project of the maintainer installs the packed release at each release, with the install line of the record for each export path that it imports. It runs `svelte-check`, the build, the built server, `vite dev` and a browser check of each part.

## Pros and Cons of the Options

### An `exports` map over the folders of the package, with the files where they are

- Good, because no file of a part moves, and the files keep their import lines.
- Good, because each tool of a product resolves the map with no configuration.
- Bad, because the map must name each path that a product reads, CSS included. A path that it lacks fails.

### The copy model of 0006, with a part folder for each part

- Good, because a product sees each change of a release in the diff of its copies.
- Bad, because an update stays a copy of each folder, and a change of the look of a part changes files in every product.
- Bad, because a product can edit a copy, and only a hash comparison finds it.

### A move of every shipped file into one folder that a package tool builds

- Good, because the folder of the package then holds only shipped files.
- Bad, because hundreds of files move, and every import line of the preview changes.
- Bad, because the preview then links the package folder, and no check of the preview tests the packed release.

### No `exports` map: a product imports each file by its path in the package

- Good, because the package needs no new field.
- Bad, because each path of the package becomes public, so each later move of a file is a major release.

## More Information

This record supersedes [0006](0006-where-a-product-gets-the-component-files.md). It amends [0003](0003-shadcn-svelte-and-bits-ui.md), [0005](0005-codemirror-6.md) and [0007](0007-lean-qr.md): the kits and their versions stay, and the code editor and the QR code are parts that a product imports. [0009](0009-the-parts-use-the-address-and-the-navigation-of-sveltekit-3.md), [0010](0010-rune-modules-ship-as-javascript-with-types.md), [0011](0011-shared-behaviour-lives-in-modules.md) and [0012](0012-a-part-keeps-each-prop-of-an-earlier-release.md) follow from it.
