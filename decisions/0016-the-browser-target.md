---
status: accepted
date: 2026-11-15
decision-makers: the developer
---

# The browser target: Baseline Widely available on 2026-11-15, raised to the Firefox floor of Tailwind CSS 4

## Context and Problem Statement

STACK states no browser target. The parts, the rules of `DESIGN.md` and `architecture/web-app.md`, and the code of a product use web platform features of different ages, from `:has()` to the CSS Custom Highlight API. Each stack choice has a floor of its own. Tailwind CSS 4 depends on Chrome 111, Safari 16.4 and Firefox 128. SvelteKit 3 builds for the default target of Vite 8: Chrome 111, Edge 111, Firefox 114 and Safari 16.4. Svelte 5 works from Chrome 87, Firefox 83 and Safari 14. With no target, a part can use a feature that one browser lacks, and no rule asks for a fallback. A coding agent that follows a guide for the web platform takes Baseline Widely available when a project states no target. Which browsers do the parts and the rules of STACK support, and what does a part do with a feature outside them?

## Decision Drivers

1. A product and a person who checks a release know the oldest version of each browser as a number.
2. The target changes only through a decision record, so a release never drops a browser that no record named.
3. The target follows a public definition that tools and coding agents read, so STACK keeps no list of features of its own.
4. Each stack choice works in the target, so the target is never below the floor of a stack choice.
5. A feature outside the target never stops a person. Without it, each text reads, each control works and each task ends.
6. STACK adds no polyfill. A polyfill adds code to each page, also in a browser that has the feature.

## Considered Options

- Baseline Widely available on a fixed date, raised to the floor of each stack choice
- Baseline Widely available on the day that a person reads it, with no date
- A Baseline year, such as Baseline 2023 or Baseline 2024
- The floor of the stack choices alone: Chrome 111, Firefox 128 and Safari 16.4

## Decision Outcome

Chosen option: "Baseline Widely available on a fixed date, raised to the floor of each stack choice", because it meets each driver. Vite 8, the build tool of SvelteKit 3, uses the same form: its default target is Baseline Widely available on a date that each major release of Vite fixes.

The target is Baseline Widely available on 2026-11-15, raised to Firefox 128, the floor of Tailwind CSS 4:

| Browser | Oldest version | Released |
|---|---|---|
| Chrome, desktop and Android | 124 | 2024-04-16 |
| Edge | 124 | 2024-04-18 |
| Firefox, desktop and Android | 128 | 2024-07-09 |
| Safari, macOS and iOS | 17.5 | 2024-05-13 |

- **The date.** Baseline Widely available on 2026-11-15 holds each feature that became Baseline Newly available on or before 2024-05-15, 30 months earlier. In the web-features data 3.46.0, the oldest versions that support all of these features are Chrome and Edge 124, Firefox 126 and Safari 17.5.
- **The raise.** Tailwind CSS 4 names Firefox 128 as a version that its core depends on. Registered custom properties (`@property`), which the output of Tailwind CSS 4 declares, came to Firefox in version 128. So the target takes Firefox 128 in place of Firefox 126.
- **The end of the raise.** Registered custom properties become Baseline Widely available on 2027-01-09. A later record with a date on or after that day needs no raise for them.
- **A feature in the target.** A feature is in the target when each version of the table supports it. A part, a rule and the code of a product use such a feature with no fallback.
- **A feature outside the target.** It gets a fallback. "Browser support" in [`architecture/web-app.md`](../architecture/web-app.md#browser-support) names each such feature that STACK uses, with its fallback. A change that adds such a feature adds its line to that table.
- **A move of the target.** Only a new record that supersedes this one moves the date. The change log of the release that ships the new record names the new versions.

### Consequences

- Good, because the table gives numbers that a person and a test can check.
- Good, because a coding agent reads the same definition: Baseline Widely available, a date, and the versions of the table.
- Good, because each stack choice works in the target. Svelte 5 works from Chrome 87, Firefox 83 and Safari 14. SvelteKit 3 and Vite 8 build for Chrome 111, Firefox 114 and Safari 16.4. Tailwind CSS 4 depends on Chrome 111, Firefox 128 and Safari 16.4.
- Good, because the floor of Tailwind CSS 4 is in the target, so no utility of Tailwind needs a fallback.
- Bad, because a device that cannot update past Safari 17.4 is outside the target.
- Bad, because the date stays fixed, so a feature that becomes Widely available after 2026-11-15 still gets a fallback until a new record moves the date.
- Bad, because the checks of a release run in Chromium only, so no check proves the oldest Firefox and the oldest Safari of the table.
- Neutral, because a product can take a higher target for its own code.

### Confirmation

- In the web-features data 3.46.0 of 2026-11-12, the oldest versions that support each feature with a Baseline Newly available date on or before 2024-05-15 are Chrome and Edge 124, Firefox 126 and Safari 17.5, on desktop and on mobile. The same count with the date 2023-07-01 gives Chrome 111, Edge 111, Firefox 114 and Safari 16.4. These are the versions that Vite 8 names for Baseline Widely available on 2026-01-01, so the count follows the definition.
- Tailwind CSS 4.3.3 gives Lightning CSS the targets Chrome 111, Firefox 128 and Safari 16.4 in `@tailwindcss/node`. Its documentation names the same three versions.
- A scan of the parts, `stack.css`, `themes/` and `DESIGN.md` on 2026-11-15 found each feature of the table in "Browser support" of `architecture/web-app.md`, each with its fallback in the code or in the rule. The scan found no `popover` attribute, no `dialog` element, no anchor positioning, no view transition and no `@starting-style` in them. Bits UI places its layers with a script.
- No test ran in Firefox 128 or in Safari 17.5. A person checks a new part in both before a release takes it.

## Pros and Cons of the Options

### Baseline Widely available on a fixed date, raised to the floor of each stack choice

- Good, because it meets each driver (Consequences).
- Bad, because the target ages between two records.

### Baseline Widely available on the day that a person reads it, with no date

- Good, because the target moves with the web, and no record moves it.
- Bad, because the oldest versions change each month, so no table of versions stays true, against driver 1.
- Bad, because a browser leaves the target on a day with no release, against driver 2.
- Bad, because Firefox 128 stays above this floor until 2027-01-09, so the target needs the raise all the same.

### A Baseline year, such as Baseline 2023 or Baseline 2024

- Good, because a year is short, and a coding agent reads it.
- Bad, because Baseline 2023 needs only Chrome 120, Firefox 121 and Safari 17.2. Firefox 121 is below the floor of Tailwind CSS 4, so the year needs the raise all the same.
- Bad, because Baseline 2024 needs Chrome 130, Firefox 132 and Safari 18.2. It drops Chrome 124 to 129 and Safari 17.5, which run each part of STACK.
- Neutral, because a year counts the features by the year in which they became Newly available, and not by their age.

### The floor of the stack choices alone: Chrome 111, Firefox 128 and Safari 16.4

- Good, because it reaches the most devices.
- Bad, because a part uses a feature above it with no fallback: the subgrid rows of `figure-band` need Chrome 117.
- Bad, because the floor follows no public definition that a coding agent reads, against driver 3.

## More Information

- **Baseline.** The WebDX Community Group keeps the definition and the data in the web-features project. A feature is Baseline Newly available when each browser of the core set supports it: Chrome on desktop and Android, Edge, Firefox on desktop and Android, and Safari on macOS and iOS. It becomes Baseline Widely available 30 months after that date. A Baseline year, such as Baseline 2024, is the set of features that became Newly available in that year.
- **A build target.** STACK sets no build target for a product. The default target of Vite 8 is below the target of this record, so the build of a product keeps the syntax that each browser of the table reads.
- **Web components.** Before STACK builds a web component, it writes its own rules and a decision record, and a text from a guide keeps its CC BY 4.0 notice.
