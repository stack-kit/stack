---
status: accepted
date: 2026-11-01
decision-makers: the developer
---

# Shared behaviour lives in modules

## Context and Problem Statement

Up to v1.0.0, a part of STACK drew its look, and the pages of a product wrote the behaviour around it. One product wrote the open item in the web address into 13 pages, and Close with the focus back to the row into 11. The board and the reorder list called the toast directly, with no Cmd+Z. Six parts each built their own query of the width. So each product held the same code many times, and each copy could differ from the rules of `architecture/web-app.md`. Where does the shared behaviour live, so that a page gives only data and functions?

## Decision Drivers

- A page gives data and the functions that call its server, and no code of the behaviour.
- One behaviour has one place, which every part and every product uses.
- The keys follow `architecture/keys.json`, and a person can change a key.
- No server request sees the state of another request.

## Considered Options

- Plain modules in `stack/behaviour/`, and a context that the list gives to its rows
- One object for each behaviour that the page makes and passes to each part
- The pages keep the behaviour, as in v1.0.0

## Decision Outcome

Chosen option: "Plain modules in `stack/behaviour/`, and a context that the list gives to its rows", because the parts then carry the behaviour, and a page passes only data and functions.

The modules are `behaviour/item` (the item in the address, Close with the focus back, the first row and the read state), `behaviour/undo` (one toast with Undo, and Cmd+Z while it shows), `behaviour/keys` (one listener on the window, the default keys of `architecture/keys.json`, the keys that a person chose, and the order of Esc), `behaviour/width` (the width bands), `behaviour/print` (the print listeners) and `behaviour/place` (the place that a part takes in the frame of a product). The list gives the open item, the focus and Close to its rows through a context. A behaviour that needs data of the product takes a function from the page, such as `onread` of the item or `blocked` of a move on the board.

Only a listener or an effect writes the state of a module, so only the browser writes it. The root layout of a product calls `listenForPrint()` and, when a person can change a key, `provideKeys(keyOf)` once.

### Consequences

- Good, because a page that shows a list writes no code for the address, Close, the keys or Undo.
- Good, because a fix of a behaviour reaches every product with the next release.
- Bad, because a change of a behaviour reaches every product with no edit, and no type check finds it. So each entry of the change log has a Behaviour part, and a part names its behaviour in a `@behaviour` line that the contract records.
- Bad, because one listener on the window serves every part. A binding that does not take a key returns false, and the listener then tries the older binding.

### Confirmation

From v2.0.0, the test project of each release checks each behaviour in a browser with the parts as a product imports them. Among the checks: the Undo toast shows, and Cmd+Z runs its action only while it shows; Cmd+Z in a text field does nothing; with a menu open, Esc closes only the menu; a click on a row writes the item into the address; Close focuses the row; and a prerendered page holds the empty state, then shows the item after hydration.

## Pros and Cons of the Options

### Plain modules in `stack/behaviour/`, and a context that the list gives to its rows

- Good, because the page code is data and functions.
- Good, because the modules are plain `.ts`, so they need no step of [0010](0010-rune-modules-ship-as-javascript-with-types.md).
- Bad, because a module keeps state for the whole page, so the parts share one Esc order and one set of keys.

### One object for each behaviour that the page makes and passes to each part

- Good, because the state of each behaviour is visible in the page.
- Bad, because each page makes the same objects again, and a page can pass the wrong one with no error.

### The pages keep the behaviour, as in v1.0.0

- Good, because a page keeps full control.
- Bad, because each product writes the same code in many pages, and each copy can differ from the rules.

## More Information

[0009](0009-the-parts-use-the-address-and-the-navigation-of-sveltekit-3.md) decides how a module reaches the address. [0012](0012-a-part-keeps-each-prop-of-an-earlier-release.md) keeps the props of v1.0.0 beside the new forms.
