---
status: accepted
date: 2026-10-12
decision-makers: the developer
---

# Tailwind CSS 4 for the styles

## Context and Problem Statement

The components of the products carry Tailwind classes, and a theme is a set of CSS variables that the project CSS maps to Tailwind colors. Which Tailwind version do the products use?

## Decision Drivers

- The shadcn-svelte CLI writes the CSS of a new project, and the components expect that CSS.
- A theme block from the shadcn create page holds `:root` and `.dark` only. The project CSS must map each variable to a Tailwind color, so that classes such as `bg-primary` exist.
- `stack.css` must set the type tokens in a form that a media query can change.

## Considered Options

- Tailwind CSS 4
- Tailwind CSS 3

## Decision Outcome

Chosen option: "Tailwind CSS 4", because the shadcn-svelte 1.7.0 CLI writes Tailwind 4 CSS for a new project. Also, `stack.css` uses the Tailwind 4 rules `@theme`, `@theme inline` and `@custom-variant`.

### Consequences

- Good, because the configuration lives in CSS. `stack.css` maps each role to a Tailwind color in `@theme inline`, and writes the type steps in a `@theme` block that a media query can change.
- Good, because a theme block from the shadcn create page works as it is. `shadcn-svelte init` writes the `@theme inline` map, and the block changes values only.
- Good, because the custom variants of the `tailwind.css` of shadcn-svelte, which a release ships as `preview/src/lib/components/ui/shadcn-svelte.css`, match both selector forms of Bits UI. For example, `data-open:` matches `[data-state="open"]` and `[data-open]`.
- Bad, because `stack.css` does not work in a Tailwind 3 project.

### Confirmation

The test project of 2026-10-13 ran `tailwindcss` 4.3.3 and `@tailwindcss/vite` 4.3.3. A theme block from the shadcn create page replaced the `:root` and `.dark` blocks of the project CSS. The 70 component files kept the same SHA-1 before and after, and the components took the new colors and the new radius.

## Pros and Cons of the Options

### Tailwind CSS 4

- Good, because the shadcn-svelte documentation app and its CLI use it. The CLI writes `@import "tailwindcss";` and `@custom-variant dark (&:is(.dark *));` into the global CSS file.
- Good, because the CLI writes `--color-<name>: var(--<name>)` into `@theme inline` for each color variable. A new role then needs one line in `:root`, one line in `.dark` and one line in the map.

### Tailwind CSS 3

- Good, because the shadcn-svelte changelog says that a Tailwind 3 project continues to work with the CLI until it upgrades.
- Bad, because shadcn-svelte keeps Tailwind 3 on a separate documentation site, apart from the current one.
- Bad, because the CSS that the CLI writes for a new project, and the `@theme` rules of `stack.css`, are Tailwind 4 CSS.

## More Information

The research of 2026-10-12 holds the facts above, with a source and a date for each claim. It stays outside this repository, because it names the products that it studied.

The test project of 2026-10-13 added Tailwind through the scaffold option `--add tailwindcss=plugins:none` ([0001](0001-svelte-5.md)), and its `package.json` holds `tailwindcss` 4.3.3 and `@tailwindcss/vite` 4.3.3. DESIGN.md names the order of the CSS files that a product imports.
