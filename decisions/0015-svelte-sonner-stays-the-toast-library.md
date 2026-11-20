---
status: accepted
date: 2026-11-15
decision-makers: the developer
---

# svelte-sonner stays the toast library

## Context and Problem Statement

A toast tells the person that an action ran, and it offers Undo (`### sonner` in `DESIGN.md`). The component `ui/sonner` renders the Toaster of svelte-sonner with a bar that holds Close all and "+N more". The module `behaviour/undo` shows each toast through `undoToast` and `plainToast`, so that a product never calls the library and STACK can change it. In November 2026 a new toast library appeared: one toast that morphs in place, spring motion, no dependencies, and a binding for Svelte 5. Does STACK change its toast library?

## Decision Drivers

1. The library carries the toast with Undo of `behaviour/undo`: an action button, a second button before it, an end callback for each end (the end of the time, the close button, a swipe, a dismiss), a duration for each toast that hover pauses, and a dismiss by id.
2. Each toast that waits keeps its own timer while other toasts show, as the States of `### sonner` say.
3. Esc keeps the order of the shared keys in `architecture/web-app.md`. A toast takes no Esc that a person gives to the page.
4. A polite live region, an assertive one for `important`, a keyboard path to each button, and a pause on hover: WCAG 2.2 success criteria 2.2.1, Timing Adjustable (level A), and 4.1.3, Status Messages (level AA).
5. The toasts follow `prefers-reduced-motion`.
6. The toasts take the tokens of the theme and the mode of mode-watcher.
7. The library is maintained, its versions follow semver, and its licence permits it in a closed product.
8. Of the options that meet drivers 1 to 7, the one that changes least for a product.

## Considered Options

- svelte-sonner, pinned exactly, behind `ui/sonner` and `behaviour/undo`
- A new toast library with no dependencies, at version 0.0.6

## Decision Outcome

Chosen option: "svelte-sonner, pinned exactly, behind `ui/sonner` and `behaviour/undo`", because it meets each driver, and the new library at version 0.0.6 fails drivers 1, 2, 3 and 7. A change of the library would also be a major release: the `Toaster` of `ui/sonner` passes the props of svelte-sonner, and `DESIGN.md` names its attributes, so each product changes its layout and its CSS. The new library is 826 B smaller in gzip, which does not pay for that.

### Consequences

- Good, because no product changes anything.
- Good, because `behaviour/undo` keeps the library behind its functions. A later change touches `undo.ts`, `ui/sonner`, `stack.css` and the documents, and no call in a product.
- Bad, because keyboard focus alone does not pause a toast of svelte-sonner. Hover, a pointer press and Alt+T pause it, as `### sonner` says.
- Bad, because one maintainer publishes svelte-sonner on npm. It ports the fixes of the toast library for React that it follows.
- Neutral, because 1.2.1 brings its own copy of `runed` 0.28.0 for one function. 1.2.3 of 2026-11-02 has no dependency.

### Confirmation

On 2026-11-15 the Svelte compiler 5.57.2 compiled both libraries for the client and for the server. rolldown 1.2.13 bundled what an app imports, `Toaster` and `toast`, with `minify` on and the Svelte runtime external, and lightningcss 1.32.0 minified the CSS. Gzip is level 9 for each file:

| Library | JS min | CSS min | Total gzip |
|---|---|---|---|
| svelte-sonner 1.2.1 | 30,247 B | 14,116 B | 12,008 B |
| svelte-sonner 1.2.3 | 29,533 B | 14,116 B | 11,765 B |
| The new library 0.0.6 | 32,552 B, with its CSS as a string | none | 11,182 B |

The code of the new library at version 0.0.6 was read and not run in a page. The behaviour that fails the drivers is in its store and its key handler.

## Pros and Cons of the Options

### svelte-sonner, pinned exactly, behind `ui/sonner` and `behaviour/undo`

- Good, because `onDismiss` and `onAutoClose` let `undoToast` run `onend` once for each end.
- Good, because each toast has its own timer, and the stack shows several toasts.
- Good, because Esc collapses the list only while the focus is in the toasts, and the focus goes back to the element that had it before.
- Good, because `important` makes a toast assertive.
- Good, because the package has been published since 2023, and it is the toast of the shadcn-svelte registry ([0003](0003-shadcn-svelte-and-bits-ui.md)).
- Bad, because its CSS is outside the layers of Tailwind, so `stack.css` needs `!important` for the size of the text and the color of the description.
- Bad, because each toast is a polite live region inside a polite section. A screen reader can read a toast twice. This was not tested.

### A new toast library with no dependencies, at version 0.0.6

- Good, because it has no dependencies, and its licence is MIT.
- Good, because keyboard focus pauses the timers, and a toast with a button stays until dismissed by default.
- Good, because two persistent regions, `role="status"` and `role="alert"`, read each toast.
- Good, because reduced motion keeps only a fade of 0.2 s.
- Bad, because a new toast morphs the shown toast when that toast has a duration, and it removes its action button with no callback. So a toast with Undo and a duration loses its Undo to the next toast, and two of them cannot wait together.
- Bad, because it has no end callback for each toast. `undoToast` would have to read the store and guess each end.
- Bad, because after a toast took the place of another, a dismiss by the id of the older toast removes the newer one.
- Bad, because Esc anywhere outside a dialog, a menu, a list box or a field dismisses every toast, and it does not call `preventDefault`.
- Bad, because a toast with a duration, or with a second button, has no close button.
- Bad, because only an error goes to the assertive region, so `important` has no equivalent.
- Bad, because it has one store for each page, no offset prop, and a gap of 16 px from the edge.
- Bad, because the repository started on 2026-11-05, two people wrote its commits, and one person publishes it. 0.0.6 changed a default, and an open change renames an attribute that the styles use.
- Neutral, because its stylesheet uses `light-dark()`, which the web-features data gives as Baseline Widely available from 2026-11-13.

## More Information

Look at the new library again when a release meets drivers 1 to 3: an end callback for each toast, its own timer for each timed toast while others show, an Esc that stays inside the toasts, and a close button on each toast. Its version must also be 1.0 or later.
