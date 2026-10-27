---
status: accepted
date: 2026-10-25
decision-makers: the developer
---

# Svelte 5 for the products

## Context and Problem Statement

The products need one UI framework, so that one design file, one component kit and one chart library serve all of them. Which framework do the products use?

The first research of 2026-10-12 assumed React, because the shadcn component kit and the primitive libraries that it studied are React libraries. The developer then asked for Svelte: the developer has good experience with it and finds it fast. A second research of 2026-10-12 checked the Svelte side against the design patterns that DESIGN.md takes.

## Decision Drivers

- The developer knows Svelte and finds it fast.
- The theme contract of DESIGN.md is the set of shadcn CSS variable names. The framework needs a component kit that reads those names.
- The component kit, its primitive library and the chart library must support the same major version of the framework.

## Considered Options

- Svelte 5
- React, with the shadcn component kit for React
- Svelte 4

## Decision Outcome

Chosen option: "Svelte 5", because the developer knows it, and because the Svelte 5 side keeps the design contract. The research of 2026-10-12 found a Svelte 5 component kit that keeps the shadcn names ([0003](0003-shadcn-svelte-and-bits-ui.md)). It also found a Svelte 5 chart library that draws the STACK patterns ([0004](0004-layerchart-svg-layer.md)).

The choice binds every web app and the admin area of a website, and not the public pages of a website. The public pages choose their own stack, as they get their own design. [`STACK.md`](../STACK.md) gives the scope. STACK added this scope on 2026-10-25.

The products run Svelte in SvelteKit, the application framework of Svelte. The research of 2026-10-12 judged each library on SvelteKit, and the test project of 2026-10-13 ran on it.

### Consequences

- Good, because the component kit, the primitive library and the chart library all declare a Svelte 5 peer, so one framework version serves all three.
- Good, because the theme contract holds. A theme block from the shadcn create page works in a Svelte product with no change to a component ([0003](0003-shadcn-svelte-and-bits-ui.md)).
- Bad, because the React kit is the reference, and the Svelte kit is an unofficial port that follows it.
- Bad, because the React-only chart library of the reference kit has a keyboard layer that is on by default. The Svelte chart library has no keyboard path to the data, so STACK adds a data table ([0004](0004-layerchart-svg-layer.md)).
- Bad, because SvelteKit 3 needs Node 22.17 or later.

### Confirmation

The test project of 2026-10-13 ran Svelte 5.57.2 in SvelteKit 3.0.1, with the component kit and the chart library of the records 0003 and 0004. `npm run check` reported 0 errors and 0 warnings, and `npm run build` reported 0 warnings.

## Pros and Cons of the Options

### Svelte 5

- Good, because the developer knows it.
- Good, because Bits UI 2.19.5 declares the peer `svelte ^5.33.0`, and the shadcn-svelte 1.7.0 CLI and LayerChart 2.7.0 declare `svelte ^5.0.0`.

### React, with the shadcn component kit for React

- Good, because the reference kit and its theme tools are made for React.
- Good, because its chart library has a keyboard layer that is on by default.
- Bad, because the developer works in Svelte.

### Svelte 4

- Bad, because Bits UI 2, the shadcn-svelte CLI and LayerChart 2 declare Svelte 5 as their peer.
- Bad, because shadcn-svelte keeps its Svelte 4 line on a separate documentation site, apart from the current one.

## More Information

The research of 2026-10-12 holds the comparison, with a source and a date for each claim. It stays outside this repository, because it names the products that it studied.

The test project of 2026-10-13 ran these versions: Svelte 5.57.2, SvelteKit 3.0.1, Vite 8.3.4, `@sveltejs/vite-plugin-svelte` 7.3.1 and TypeScript 6.0.3. Two facts from it apply to every product:

- SvelteKit 3.0.1 declares `node >=22.17`. On Node 20, npm refuses the install with `EBADENGINE`. Use Node 22.17 or later.
- The test project began with the command `npx sv@1.1.1 create --template minimal --types ts --add tailwindcss=plugins:none sveltekit-adapter=adapter:node`. It took the Node adapter only so that it could read the server HTML.
