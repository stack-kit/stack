---
status: accepted
date: 2026-11-01
decision-makers: the developer
---

# The parts use the address and the navigation of SvelteKit 3

## Context and Problem Statement

From v2.0.0, a part such as the list with its item column keeps the open item in the web address, and Close gives the focus back to the row. Up to v1.0.0, each page of a product wrote this code itself. A part inside the package now reads and writes the address. How does a part reach the address and the navigation of the app, so that it works in dev, in the build, on a prerendered page and in the type check of a product?

## Decision Drivers

- A part works in `vite dev`, in the build and in the built server of a product, with no configuration in the product.
- A write of the address keeps the focus, the scroll position and the length of the history.
- A prerendered page that holds the part builds, and it shows the empty state until the page runs in the browser.
- A wrong option or a wrong import gives an error, not a value of the type `any`.

## Considered Options

- The parts import `$app/state`, `$app/navigation` and `$app/env` of SvelteKit 3
- The product gives each part an object with the address and a function that navigates
- The page keeps the address, and the part takes the open item as a prop

## Decision Outcome

Chosen option: "The parts import `$app/state`, `$app/navigation` and `$app/env` of SvelteKit 3", because the test of 2026-11-01 showed that these modules resolve inside `node_modules`, in dev and in the build, with no configuration in the product. The page then gives only data and functions.

A part follows three rules:

- It writes the address with `goto(url, { replace: true, reset: false })`. The options `keepFocus` and `noScroll` of SvelteKit 2 do not exist in SvelteKit 3.0.1.
- It reads the address only when `building` of `$app/env` is false, or in `$effect` or `onMount`. A prerendered page then holds the empty state, and the value comes after hydration.
- It imports `$app/env`, never `$app/environment`.

### Consequences

- Good, because a page that uses the list writes no code for the address, for Close or for the focus.
- Good, because the type check of the part sources finds a wrong option of `goto`.
- Bad, because the behaviour modules bind the parts to SvelteKit 3. A part in another framework needs a release of STACK.
- Bad, because a part that reads the address in its render, with no guard, fails the build of each prerendered page that holds it. STACK checks each part that reads the address on a prerendered page.

### Confirmation

The test of 2026-11-01 installed a packed copy of the package with probe parts into a new SvelteKit 3.0.1 project:

- In dev, `goto` with `keepFocus` and `noScroll` threw `goto_options_removed`. In the built server it raised no error, and the focus moved to `BODY`.
- With `{ replace: true, reset: false }`, the address changed, the focus stayed on the button, and `history.length` stayed the same, in dev and in the built server.
- A read of `page.url.searchParams` in the render of a prerendered page stopped the build with `url_search_unavailable_prerender`. With the guard of `building`, and with a read in `$effect` or in `onMount`, the build passed. The prerendered HTML held the empty state, and the browser showed the value after hydration.
- `$app/environment` has no type declaration in SvelteKit 3.0.1, so `svelte-check` read its values as `any`, with no error. `$app/env` has a declaration.

From v2.0.0, the test project of each release checks the list on a prerendered page, the write of the address and the focus after Close.

## Pros and Cons of the Options

### The parts import `$app/state`, `$app/navigation` and `$app/env` of SvelteKit 3

- Good, because the page gives no object and no function for the address.
- Good, because SvelteKit keeps `$app` out of the dev prebundle, so a part in a package reaches the same modules as the app.
- Bad, because of the bind to SvelteKit 3.

### The product gives each part an object with the address and a function that navigates

- Good, because the parts then do not import SvelteKit.
- Bad, because each product writes the same object, and a wrong navigation, such as one that moves the focus, is a defect of each product.

### The page keeps the address, and the part takes the open item as a prop

- Good, because this is the form of v1.0.0, and it stays as a second form ([0012](0012-a-part-keeps-each-prop-of-an-earlier-release.md)).
- Bad, because each page writes the address, Close and the focus again.

## More Information

[0008](0008-a-product-imports-every-part-from-the-package.md) decides the import from the package. [0011](0011-shared-behaviour-lives-in-modules.md) decides where the behaviour lives.
