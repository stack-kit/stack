---
status: accepted
date: 2026-11-01
decision-makers: the developer
---

# A part keeps each prop of an earlier release

## Context and Problem Statement

v2.0.0 changes how a product takes the parts ([0008](0008-a-product-imports-every-part-from-the-package.md)), and the parts take new forms, such as the list that keeps the open item in the address. The pages of a product use the props of v1.0.0. A rename of a prop makes each page change, at the same update as the delete of the copies. A name that a release removes and a later release brings back with another meaning passes `svelte-check`, and the page breaks with no error. How does a part take a new form, so that a page of v1.0.0 still passes the check, and the check names each page that must change?

## Decision Drivers

- A page in the form of v1.0.0 passes `svelte-check` after the update.
- `svelte-check` names each page that a change of a part breaks.
- A name keeps one meaning in every release.

## Considered Options

- A part keeps each prop of v1.0.0, and takes a new form beside it
- A part takes the new form only, and each page changes at the update
- A part takes the names of the copy of one product

## Decision Outcome

Chosen option: "A part keeps each prop of v1.0.0, and takes a new form beside it", because a page then moves to the new form when the product chooses, and the check stays a true guide.

A part follows four rules:

- Each prop and each export of a part of `stack/` in v1.0.0 stays.
- A new form goes beside the old one, such as `address` beside `open` and `key` of the list. A union type lets a page pass one form and not both.
- Every new prop is optional. v1.0.0 exported no part. The pages of `outside/` and the parts TimeField and TimeZoneField were only preview pages and showcase files in v1.0.0, so they take the v2.0.0 form whole. Each function that the page always calls, the `label` of TimeField and the `locale` of both time fields are required, so that `svelte-check` names a page that lacks one. A function of a step that a product can leave out, such as `appCode` of SignInPage and `resend` of LinkPage, is optional, and so is the `label` of TimeZoneField. The prop `initial` of SignInPage and RecoveryPage goes.
- A removed name never comes back with a new meaning.

### Consequences

- Good, because the update to v2.0.0 breaks only the import lines and the props that the change log names.
- Good, because a later rename shows in the contract diff as a removed name, at level major, and `svelte-check` names each page that uses it.
- Bad, because a part with two forms has more props, and its types are unions.
- Bad, because an old form stays until a major release removes it, and the change log then names each step.

### Confirmation

`node scripts/contract.mjs diff <a> <b>` prints a removed or renamed prop, callback, snippet, export or `data-slot` under Breaking, and exits 1. The gate of each release refuses a level below it. The test project of each release holds a page of the list in the form of v1.0.0, with `open` and `key`, and `svelte-check` passes on it.

## Pros and Cons of the Options

### A part keeps each prop of v1.0.0, and takes a new form beside it

- Good, because a product moves one page at a time.
- Bad, because of the larger surface of each part.

### A part takes the new form only, and each page changes at the update

- Good, because each part has one form.
- Bad, because each page changes at the same update as the delete of the copies, so the update is large.

### A part takes the names of the copy of one product

- Good, because that product then checks with no edit.
- Bad, because each other product pays the rename.

## More Information

The version levels are in "Update a product to a new release" in the README. [0011](0011-shared-behaviour-lives-in-modules.md) decides where the new behaviour lives.
