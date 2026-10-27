# Architecture

This folder holds the architecture recommendations of STACK for a back office or a dashboard app, and one file for each platform. Here a back office or a dashboard app means the whole of a web app, or the admin area of a website. The design and the stack choices of the public pages of a website are out of scope, because each site gets its own design. `cloudflare.md` still gives the Worker of a public site.

## What the folder holds

| File | What it holds | Who reads it |
|---|---|---|
| `README.md` | This file: the recommendations, and the index of the platform files | A product, at the start of a project |
| [`web-app.md`](web-app.md) | The behavior of every web app in the browser: localization, the keyboard model, the command palette, the screen states and accessibility | A product, for the behavior of a screen |
| [`cloudflare.md`](cloudflare.md) | The shape of a back office or a dashboard app on Cloudflare Workers: the Workers, the data stores, Cloudflare Access and how the parts talk, with the reason for each part | A product, before it builds or changes its Workers |

The recommendations also use these files outside the folder:

| File | What it holds |
|---|---|
| [`STACK.md`](../STACK.md) | The stack choices, each with its exact version and a link to its record |
| [`decisions/`](../decisions/) | One decision record for each stack choice: the problem, the options and the reason for the choice |
| [`DESIGN.md`](../DESIGN.md) | The look: the tokens, the components, the layout, the themes, the charts, the emails and the printed documents |
| [`providers/`](../providers/) | The limits, the prices and the quirks of each provider, each fact with its source and its read date |
| [`operations/monitoring.md`](../operations/monitoring.md) | What an app monitors, how and why |

## The recommendations

### Build the UI with the shared stack

Build the UI with Svelte 5 in SvelteKit, Tailwind CSS 4, shadcn-svelte on Bits UI, and LayerChart on its SVG layer, at the exact versions that [`STACK.md`](../STACK.md) lists.

**Why.** One framework, one component kit and one chart library let one design file serve every product. The theme contract of `DESIGN.md` is the set of shadcn CSS variable names, and shadcn-svelte on Bits UI is the only option that reads those names ([0003](../decisions/0003-shadcn-svelte-and-bits-ui.md)). LayerChart is the chart engine of the shadcn-svelte chart parts, and on its SVG layer it draws the pattern fills of the charts ([0004](../decisions/0004-layerchart-svg-layer.md)). Each record in [`decisions/`](../decisions/) gives the options that were turned down and the reason.

### Take the look from DESIGN.md and the behavior from web-app.md

- Use only the tokens of [`DESIGN.md`](../DESIGN.md). Give a token of the product the prefix `--product-`, and never redefine a token of STACK.
- Copy each component folder from the release, as "Add a component" in [`README.md`](../README.md) says, and never edit a copied file. Never run `shadcn-svelte add` or `shadcn-svelte update`, because the CLI reads the live registry and not the files that STACK tested ([0006](../decisions/0006-where-a-product-gets-the-component-files.md)).
- Follow [`web-app.md`](web-app.md) on every screen: a message key for every text, `Intl` for every format, one registry of keys, the command palette, the three screen states, and WCAG 2.2 at level AA.

**Why.** One source gives every product the same look and the same behavior. A theme then changes token values only, and no component changes.

### Run on Cloudflare Workers in the shape of cloudflare.md

[`cloudflare.md`](cloudflare.md) gives the shape and the reason for each part:

- A static public site in its own Worker, when the product has a public site.
- The admin in one Worker, which serves its UI as static assets, answers its API, runs its cron triggers and consumes its queues.
- A separate Worker for work that needs much memory or a headless browser.
- Cloudflare Access in front of the admin, and a check of the Access token in the admin Worker.
- D1 for the records, R2 for the files, KV for configuration and cached reads, and Analytics Engine for the counts and the events, such as the page views of the site.
- Queues for long work and work that must survive a failure, and service bindings for short calls between Workers.

**Why.** The reasons are in [`cloudflare.md`](cloudflare.md), next to each part. Each rule there carries a tier: Proven, Recommended or Not recommended.

### Check each limit in the provider file

Before a design depends on a limit or a price, read it in [`providers/`](../providers/), and check its read date. [`providers/README.md`](../providers/README.md) says how to tell a stale fact.

**Why.** A provider changes its limits and its prices without notice. A dated fact with its source shows how old the knowledge is.

### Set up monitoring on the first day

Set up what "What a new project sets up on its first day" in [`operations/monitoring.md`](../operations/monitoring.md) lists, before the first deploy.

**Why.** Some parts cost little on the first day and much later, such as the `audit_event` table in the first migration and a dead-letter queue with the first queue.

### Keep the code map in the product

Each product keeps its own `ARCHITECTURE.md`, which maps the code of that product. STACK keeps none. That is why this file is `architecture/README.md`.

### Pin a release, and propose instead of override

Pin a release tag of STACK, never `main`, and never edit the copy of STACK in the product. Send a missing rule, a conflict or a defect to STACK as a pull request, and mark each stopgap in the code with the number of the pull request. "Follow the rules for a product" and "Contribute from a product" in the [README of the repository](../README.md) give the steps.

**Why.** A product never customizes the core. STACK takes only what is general for a back office or a dashboard, and it may decline a proposal with a reason.

## Add a platform file

- Give each platform one file in this folder, named after the platform in lower case, such as `cloudflare.md`.
- Give the shape and the reason for each part. Mark each rule Proven, Recommended or Not recommended.
- Take each limit and each price from the file of the provider in [`providers/`](../providers/), with its source and its read date.
- Name no product. A product that solved a problem appears only in the Examples part.
- Add the file to the table in "What the folder holds".
