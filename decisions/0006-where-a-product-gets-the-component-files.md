---
status: accepted
date: 2026-10-26
decision-makers: the developer
---

# Where a product gets the component files

## Context and Problem Statement

[0003](0003-shadcn-svelte-and-bits-ui.md) chose shadcn-svelte 1.7.0 on Bits UI 2.19.5, and a product copied each component into its own code with the shadcn-svelte CLI. `DESIGN.md` binds its tokens and its states to the slots of the registry snapshot of 2026-10-13, and STACK tested those files in the preview. A product reported that the CLI gave it other files and other versions. Where does a product get the component files, so that it gets the files and the versions that STACK tested?

STACK checked the report against the CLI that the preview pins, on 2026-10-26:

- The CLI reads the live registry at run time, and not a snapshot. It takes the URL from `COMPONENTS_REGISTRY_URL`. Without it, it takes `REGISTRY_URL` or the `registry` key of `components.json`, and adds `/styles/<style>`.
- The live index held 63 items, and the snapshot holds 61. The two new items are `code-block` and `trace`. The registry `code-block` writes `data-slot="code-block"`, which is the slot of the STACK part `code-block`.
- 34 items asked for `bits-ui` ^2.20.0, so the CLI installed 2.20.2 and not 2.19.5. The CLI adds `@lucide/svelte` with the version `latest`, which gave 1.61.0 and not 1.55.0. The CLI adds each package with a range and has no flag for an exact version.
- The live slot of `input-otp` writes `data-active="false"` on each cell that is not active. Tailwind compiles `data-active:` to a test of presence, so the ring of `### input-otp` showed on every cell.
- STACK changed five files of the preview after the copy, so that a page prints at its width. The CLI gives the registry form of these files. The slider sets the class of its thumb inside the file, with no prop for it. So a product could not follow the print rule without an edit by hand, which the rules forbid.
- The CLI has no path on disk. It fetches each URL with `fetch`, and Node 26.8.1 refuses a `file:` URL in `fetch` ("not implemented"). So a snapshot for the CLI needs an HTTP server.

## Decision Drivers

- A product gets exactly the files and the package versions that STACK tested.
- The edits of STACK reach every product.
- One step serves a product with npm and a project with no Node.
- No new tool, no server and no network fetch at the time of a copy.

## Considered Options

- Each release ships the component files of the preview, with a lock file
- Each release ships a registry snapshot, and the CLI reads it from a server on the loopback address
- The live registry, which STACK follows at each release

## Decision Outcome

Chosen option: "Each release ships the component files of the preview, with a lock file", because the tag then holds the files that STACK tested. One copy step also serves a product with npm and a project with no Node, with no new tool.

The release ships `preview/src/lib/components/ui/`, `preview/src/lib/utils.ts`, `preview/src/lib/hooks/` and `preview/components.lock.json`. It also ships the `tailwind.css` of shadcn-svelte 1.7.0 as `preview/src/lib/components/ui/shadcn-svelte.css`. A product imports that file from the release, and installs no `shadcn-svelte` package. For each component folder, the lock gives its files with their SHA-256 and the folders that it uses. It also gives the packages that the folder needs and the files that STACK changed. The exact version of each package comes from the lock file of the preview. A product copies a folder and each folder of its `uses` list, and installs the packages of the lock with `npm install -E`. A product never runs `shadcn-svelte add` or `shadcn-svelte update`. "Add a component" and "Update a product to a new release" in the README give the steps.

The CLI stays a tool of the maintainer. STACK takes a change of the registry on purpose: it runs the CLI in the preview, applies its own edits again, tests and releases. "Take a change from the registry" in the README gives the steps.

### Consequences

- Good, because a tag holds the files and the versions that STACK tested, and `npm run check` fails when the lock and the files differ.
- Good, because the five edits of STACK reach every product, so the print rule holds with no edit by hand.
- Good, because the registry item `code-block` never reaches a product, so the slot of the STACK part keeps one meaning.
- Good, because a product gets the slot of `input-otp` that STACK tested, so the classes of `### input-otp` match the active cell only.
- Good, because a project with no Node takes the same step from its clone in `_reference/stack/`.
- Neutral, because STACK now ships code of shadcn-svelte. So the release carries its MIT notice in `preview/src/lib/components/ui/LICENSE.md`, and a product copies it with the first component.
- Neutral, because a copy that misses a folder of its `uses` list fails `svelte-check` with "Cannot find module", so the error is loud.
- Bad, because a fix of Bits UI or of shadcn-svelte reaches a product only through a release of STACK.
- Bad, because an agent reads the `uses` and the `packages` of a component from the lock, where the CLI resolved them itself.

### Confirmation

The copy test of 2026-10-26 followed the steps on a new SvelteKit 3.1.0 project, made with `sv` 1.1.1 and Tailwind. It copied `button` and `sheet`, whose `uses` list holds `button`, from the packed tarball of the release.

- The 16 copied files had the SHA-256 of the lock.
- `npm install -E` removed `node_modules/$app`, so `svelte-check` stopped with "File '$app/tsconfig' not found". `npx svelte-kit sync` after the install fixed it, and the steps now hold that command.
- `svelte-check` 4.7.7 then gave 0 errors and 0 warnings in 660 files, and `vite build` passed.
- A copy of `sheet` with no `button` folder failed `svelte-check` with "Cannot find module '#lib/components/ui/button/index.js'".

## Pros and Cons of the Options

### Each release ships the component files of the preview, with a lock file

- Good, because the tag holds the tested files. The hashes of the lock also let a check test the rule "never edit a copy".
- Good, because the step needs no server and no network.
- Bad, because STACK keeps the copies of 61 folders, and takes each upstream change by hand.

### Each release ships a registry snapshot, and the CLI reads it from a server on the loopback address

- Good, because the CLI resolves the folders, the aliases and the packages.
- Bad, because the CLI fetches over HTTP only, so each copy needs a server that the product starts and stops.
- Bad, because a product that keeps the live URL in `components.json` reads the live registry again with no warning.
- Bad, because a project with no Node has no path.

### The live registry, which STACK follows at each release

- Good, because an upstream fix reaches a product at once, and STACK ships no copies.
- Bad, because a product that adds a component between two releases gets slots that do not match `DESIGN.md`, and no check finds that.
- Bad, because the edits of STACK cannot reach a product.
- Bad, because the CLI writes ranges, so a product pins each package again after each add.

## More Information

This record amends [0003](0003-shadcn-svelte-and-bits-ui.md): the kit and the versions stay, and only the way to the files changes. The research of 2026-10-26 holds the reading of the CLI code and the measurements of the live registry. It stays outside this repository.
