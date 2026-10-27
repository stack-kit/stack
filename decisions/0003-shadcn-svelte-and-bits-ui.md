---
status: accepted
date: 2026-10-12
decision-makers: the developer
---

# shadcn-svelte on Bits UI for the components

## Context and Problem Statement

The products need a component kit on Svelte 5 and Tailwind 4 ([0001](0001-svelte-5.md), [0002](0002-tailwind-4.md)). The theme contract of DESIGN.md is the set of shadcn CSS variable names. So a theme from the shadcn create page must work in a product with no change to a component. The developer looked at Bits UI and at a class-based component kit for Tailwind, and asked what the shadcn site recommends for Svelte. Which component kit and which primitive library do the products use?

The shadcn site names no Svelte port. Its page on official resources says that community projects are independent. shadcn-svelte calls itself an unofficial, community-led port, made with the blessing of the shadcn author.

## Decision Drivers

- A theme from the shadcn create page works with no change to a component.
- Each part of a component carries a `data-slot` and state attributes, so that DESIGN.md can bind tokens and name states.
- Keyboard, focus and ARIA behaviour come from the primitive library, and not from each product.
- The kit runs on Svelte 5 and Tailwind 4.

## Considered Options

- shadcn-svelte 1.7.0 on Bits UI 2.19.5
- Bits UI alone, with styles that STACK writes
- A class-based component kit for Tailwind 4, alone or over Bits UI

## Decision Outcome

Chosen option: "shadcn-svelte 1.7.0 on Bits UI 2.19.5", because it is the only option that reads the shadcn names. A theme from the shadcn create page then works as it is. Bits UI also supplies the behaviour that a class-based kit leaves to the product.

The chart parts of shadcn-svelte use LayerChart, which [0004](0004-layerchart-svg-layer.md) records. DESIGN.md names the component style and the component list.

### Consequences

- Good, because shadcn-svelte uses the same CSS variable names as the shadcn kit for React. Its CLI writes the `@theme inline` map, and `stack.css` holds the same map, so a product needs no CLI for it.
- Good, because each part sets `data-slot`, for example `data-slot="button"`, which the `components` keys of DESIGN.md use.
- Good, because shadcn-svelte checks its class strings against the reference kit with a parity tool, and pulls the style CSS from it without a change.
- Neutral, because Bits UI writes a `data-state` value for checked, open and active, and a presence attribute for disabled, highlighted, selected, placeholder and readonly. A switch has no `data-checked`, which the Bits UI documentation lists. DESIGN.md names both selector forms.
- Bad, because a preset code does not move a theme between the shadcn create page and the shadcn-svelte create page. A product takes a theme as the CSS block of the Theme tab.
- Bad, because the teams are small. Bits UI names one maintainer, and shadcn-svelte names three. In 2026 the longest gap between releases was 97 days for shadcn-svelte and 108 days for Bits UI.
- Bad, because the shadcn-svelte documentation lags its CLI in places, for example in the list of base colors.
- Bad, because the CLI needs two extra steps on SvelteKit 3 (More Information). Since [0006](0006-where-a-product-gets-the-component-files.md), only the maintainer runs the CLI, in the preview.
- Bad, because the CLI reads the live registry, which changes between two releases of STACK. So since [0006](0006-where-a-product-gets-the-component-files.md), a product copies the component files that a release ships, and never runs the CLI.

### Confirmation

The test project of 2026-10-13 ran the shadcn-svelte 1.7.0 CLI and `bits-ui` 2.19.5. `shadcn-svelte init` wrote `tailwind-variants` 3.3.1, `tw-animate-css` 1.4.0, `cn` 0.4.0, `@lucide/svelte` 1.55.0 and `@fontsource-variable/inter` 5.3.0, and `shadcn-svelte add` wrote `@internationalized/date` 3.12.4.

- A theme block from the Theme tab of the shadcn create page replaced the `:root` and `.dark` blocks of the project CSS. The 70 component files kept the same SHA-1 before and after, and the components took the new colors and the new radius.
- For the same theme choices, the shadcn-svelte registry returned 63 of 63 variables equal to the block of the shadcn create page. But one preset code showed a different theme and chart color on the other create page.
- The DOM showed the state attributes of six Bits UI components: the checkbox, the switch, the select, the dialog, the tabs and the menu.

## Pros and Cons of the Options

### shadcn-svelte 1.7.0 on Bits UI 2.19.5

- Good, because it keeps the theme contract, and it has its own create page.
- Good, because it follows the reference kit closely. The nova button carries the same classes for its default size as the nova button of the reference kit.
- Good, because a product holds each component as files in its own code. Since [0006](0006-where-a-product-gets-the-component-files.md), it copies them from a release of STACK, and not with the CLI.
- Good, because Bits UI is made by one of the shadcn-svelte maintainers.
- Bad, because it is an unofficial port with small teams.

### Bits UI alone, with styles that STACK writes

- Good, because Bits UI gives the behaviour, the keyboard handling and the state attributes, and ships almost no styles by design.
- Bad, because STACK would write and maintain the class strings of every component, which shadcn-svelte already writes and checks against the reference kit.
- Bad, because a theme from the shadcn create page then works only as far as STACK copies the shadcn classes.

### A class-based component kit for Tailwind 4, alone or over Bits UI

- Good, because a theme changes values only, in the vocabulary of the kit, and the kit ships many themes.
- Good, because it is CSS only, with no JavaScript.
- Bad, because it reads its own 20 color names and not the shadcn names. A theme from the shadcn create page does not work in it as it is.
- Bad, because 6 of the 16 design patterns that DESIGN.md takes do not fit. Among them are the token names, the state selectors and the chart tokens.
- Bad, because a theme cannot set a color per state. The kit computes the hover color with `color-mix`.
- Bad, because the kit leaves keyboard and focus handling to the product. Over Bits UI the pair works in principle, but no source documents it.

## More Information

The research of 2026-10-12 holds the comparison, with a source and a date for each claim. It stays outside this repository, because it names the products that it studied.

The test project of 2026-10-13 found two steps that the shadcn-svelte CLI needs on SvelteKit 3.0.1. Since [0006](0006-where-a-product-gets-the-component-files.md), the maintainer takes them when the CLI runs in the preview. The second step also holds in a product, because each npm install removes `node_modules/$app`.

- **`#lib` aliases.** SvelteKit 3 writes no `$lib` path alias. It uses the `#lib` subpath import. In the test project, the `imports` field of `package.json` maps `#lib` to `./src/lib/index.js` and `#lib/*` to `./src/lib/*`. `shadcn-svelte init` with the default `$lib` aliases stops with "`$lib/components` does not use an existing path alias defined in your tsconfig.json". Run `init` with `--lib-alias '#lib'` and the matching `--components-alias`, `--utils-alias`, `--ui-alias` and `--hooks-alias`. `components.json` then holds `#lib/components`, `#lib/utils`, `#lib/components/ui`, `#lib/hooks` and `#lib`. A `#lib` import names the full path with `.js`, for example `#lib/components/ui/button/index.js`.
- **`svelte-kit sync` after each `add`.** The npm install that the CLI runs removes `node_modules/$app`, where SvelteKit 3 writes its generated tsconfig. The next `shadcn-svelte add` then stops with "File '$app/tsconfig' not found". Run `npx svelte-kit sync` after each `shadcn-svelte add`.

A product takes a theme from the shadcn create page as the CSS block of its Theme tab. It never passes a preset code from the shadcn create page to the shadcn-svelte CLI.

[0006](0006-where-a-product-gets-the-component-files.md) amends this record. The kit and its versions stay. A product copies the component files and the lock of a release, and installs the exact packages of the lock.
