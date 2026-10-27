---
status: accepted
date: 2026-10-12
decision-makers: the developer
---

# LayerChart 2.7.0 on its SVG layer for the charts

## Context and Problem Statement

The admin areas of the products need charts. The chart library must draw the STACK pattern fills, an exact SVG tile, on bars, areas and donut slices. It must read the chart tokens of DESIGN.md in light and dark, and it must cover the charts of an admin area. The shadcn-svelte maintainers chose LayerChart for their chart parts, and the shadcn kit for React uses a React-only chart library. The developer asked whether LayerChart is better than that library, and whether a better chart library for Svelte exists. Which chart library do the products use, and on which layer?

The research of 2026-10-12 compared 16 libraries against 10 requirements, and checked four more links that the developer sent.

## Decision Drivers

1. The library runs natively on Svelte 5.
2. It draws the STACK pattern fills on bars, areas and donut slices.
3. It reads the CSS variables of a theme, and it follows a change to `.dark` with no chart code.
4. It covers the admin chart set: line, area, stacked and grouped bar, pie, donut, sparkline and heatmap.
5. It is accessible.
6. It renders 10,000 points.
7. It renders on the server in SvelteKit.
8. Its licence allows use inside a product.
9. It is maintained.
10. Its size is small, and it has documentation for agents.

## Considered Options

- LayerChart 2.7.0 on its SVG layer
- LayerChart 2.7.0 on its canvas layer
- The canvas runner-up: a canvas chart library with the widest free chart set, mounted directly with a wrapper that converts the tokens
- A React-only chart library: the chart library of the shadcn kit for React
- A Svelte chart framework that gives scales and layouts, but no ready charts
- Two plot libraries in the grammar-of-graphics style, with no pie or donut chart
- An SVG chart library with a Svelte 4 peer
- Three more canvas chart libraries, which need a token shim
- Two chart libraries that need a paid licence inside a product
- A large plot library
- A low-level visualization toolkit
- An SVG chart library with no Svelte package
- A Svelte 5 chart wrapper whose CI sends vendor telemetry

## Decision Outcome

Chosen option: "LayerChart 2.7.0 on its SVG layer", because it is the chart engine of the shadcn-svelte chart parts. It is native Svelte 5, and on SVG it meets the requirements 1, 2, 3, 4 and 8 with no shim.

STACK adds three things that LayerChart does not supply:

1. A legend item that draws the pattern tile. The default legend swatch is a CSS background, and it cannot show a tile.
2. An accessibility layer: a title, a description, and a data table that a screen reader and the keyboard can reach. This replaces the keyboard path to the data that the marks lack.
3. An exact version pin, because LayerChart depends on prerelease packages.

### Consequences

- Good, because one chart styling layer serves all products. `Chart.Container` and `Chart.Tooltip` of shadcn-svelte color LayerChart through the `--chart-n` tokens.
- Good, because the `fill` of bars, areas and slices takes `url(#id)` for a pattern or `var(--chart-n)` for a solid fill, and a pattern tile reads `var(--chart-ink)`. A change to `.dark` then changes the colors with no chart code.
- Good, because LayerChart is MIT, and it has documentation for agents.
- Bad, because LayerChart has one main maintainer, and the 2.x line is stable only since 2026-07-01.
- Bad, because the server rendering of LayerChart 2.7.0 is faulty on Svelte 5.57.2. Charts render on the client only (More Information).
- Bad, because the tooltip indicator of `Chart.Tooltip` shows a color only. STACK adds a tile indicator, or hides the indicator.
- Neutral, because one page with a bar, an area and a pie chart loads 134.4 KiB gz of JavaScript from `layerchart/svg`. The same page loads 143.9 KiB gz from `layerchart`.

### Confirmation

The test project of 2026-10-13 ran `layerchart` 2.7.0 with the shadcn-svelte chart parts, in Chrome:

- Stacked bar 24 of 24, grouped bar 24 of 24, stacked area 4 of 4 and donut 8 of 8 shapes carried `fill="url(#...)"`.
- A change to `.dark` on `<html>` changed the ink of the SVG charts with no chart code.
- Five charts on one page, one of them in a dialog, wrote 139 pattern ids with 0 duplicates.
- The legend drew a 12 by 12 px tile through the `children` snippet of `Legend`. Tab reached each item, and Enter and Space toggled it with `aria-pressed`.
- A line of 10,000 points rendered first in 34 to 53 ms on SVG and in 33 to 35 ms on canvas. The median tooltip delay was 2.3 ms on SVG.
- A `Calendar` heatmap and a `Cell` heatmap rendered in the chart tokens.
- axe found 0 violations in the chart of the accessibility page. One gap stays open: the tooltip layer adds a second `svg` with `role="figure"` and no name.

Firefox, Safari, VoiceOver and NVDA were not tested. A person checks them.

## Pros and Cons of the Options

### LayerChart 2.7.0 on its SVG layer

- Good, because it meets requirements 1 to 4 and 8 with no shim.
- Good, because the `defs` snippet of the `Svg` layer, and `patternContent` of `Pattern`, take the exact STACK tile.
- Bad, because the marks have no keyboard path to the data, and the server rendering is faulty.

### LayerChart 2.7.0 on its canvas layer

- Good, because it keeps the DOM small: 5 nodes against 114 for a line of 10,000 points.
- Bad, because the canvas `Pattern` cannot draw custom content, so it cannot draw the STACK tile.
- Bad, because it keeps the colors of its first draw after a change to `.dark`.

### The canvas runner-up

- Good, because it has the widest free chart set, with heatmap and calendar.
- Good, because it has built-in decal patterns with rotation, and a generated ARIA description.
- Good, because it renders an SVG string on the server, and its canvas handles large data.
- Good, because it is a foundation project with several long-time committers.
- Bad, because a wrapper must read each token with `getComputedStyle`, convert `oklch()` to `rgb()`, and apply the theme again when `.dark` changes.
- Bad, because its decals are not the STACK tile. An exact tile needs an image pattern.
- Bad, because the shadcn-svelte chart parts do not apply to it, and its Svelte wrapper package declares the previous major version.
- Neutral, because the test project of 2026-10-13 did not test it. It is the fallback if LayerChart stalls, or if a product needs heavy data or a heatmap that LayerChart draws badly.

### A React-only chart library

- Good, because its keyboard layer is on by default, and it has three committers with more than 200 commits each.
- Bad, because it runs in React only, so a Svelte product cannot use it.

### The other options

- The Svelte chart framework: the right base, but each product would build every chart.
- The two plot libraries: no pie or donut chart. One is pre-1.0 with one maintainer and no release since 2026-04-12. The other has no Svelte package and no release since 2025-02-14.
- The SVG chart library with a Svelte 4 peer: it has open issues about Svelte 5. Its patterns are masks in the series color, not the STACK ink over a color fill.
- The three more canvas chart libraries: each needs a shim for the tokens. One has no server rendering, a color parser that predates `oklch()`, and one release in 12 months. One has no pie chart and no accessibility. One keeps the heatmap and the server rendering in a paid edition, has no Svelte package, and weighs 411 kB gz.
- The two chart libraries with a paid licence: requirement 8 fails.
- The large plot library: 401 kB gz at the minimum, patterns with no rotation, and a Svelte wrapper on its previous major version.
- The low-level visualization toolkit: each product would build every chart. LayerChart already builds on it.
- The SVG chart library with no Svelte package: it draws SVG pattern tiles, but a product would mount it by hand.
- The Svelte 5 chart wrapper: its CI sends vendor telemetry, and its pattern support is not established.

A Gantt component with a Svelte 4 peer was not a candidate. A product that needs a Gantt chart asks that question on its own.

## More Information

The research of 2026-10-12 holds the comparison, with a source and a date for each claim. It stays outside this repository, because it names the products that it studied.

The test project of 2026-10-13 found these rules for a product:

- **The exact pin.** Pin `layerchart` at 2.7.0, with no `^` and no `~`. LayerChart 2.7.0 pins four prerelease packages exactly: `@layerstack/svelte-actions` 1.0.1-next.20, `@layerstack/svelte-state` 0.1.0-next.25, `@layerstack/tailwind` 2.0.0-next.21 and `@layerstack/utils` 2.0.0-next.19. The lockfile holds them.
- **No `ssr` prop.** With LayerChart 2.7.0 on Svelte 5.57.2, the server writes a function into the `style` of the chart root. The root is then not positioned, and the svg sits at the page origin, over the header, until hydration. With no fixed size, the server draws the chart at 100 by 100. Also, every chart prop becomes an attribute of the root: at 10,000 points the `data` attribute holds 159,999 characters. Leave out the `ssr` prop, and render each chart on the client in a container with a fixed height.
- **The canvas layer, a test result only.** A product never uses the canvas layer, because DESIGN.md allows the SVG layer only. The test found the reason. After a theme change, the canvas layer kept the colors of its first draw. It caches the computed styles, and the cache key holds no theme. A remount in `{#key theme}`, with a canvas `id` that names the theme, such as `` props={{ canvas: { id: `sales-${theme}` } }} ``, drew the new colors. At 10,000 points on one line, SVG took 34 to 53 ms and canvas 33 to 35 ms, so the canvas layer gave no gain at that size.
- **`Calendar` takes the end of the last day.** An `end` at 00:00 on 31 December draws 364 day cells. `new Date(2026, 11, 31, 23, 59, 59, 999)` draws 365.
- **The tile.** Draw the STACK tile in the `defs` snippet of the `Svg` layer, or in `patternContent`. Never use the `lines` option of `Pattern`. It draws one fixed diagonal for 30, 45 and 60 degrees, and the other diagonal for 120, 135 and 150 degrees. DESIGN.md holds the chart patterns and the chart rules.
