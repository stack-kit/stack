---
status: accepted
date: 2026-11-14
decision-makers: the developer
---

# The public surface of the rich text field, and the writing request that STACK owns

## Context and Problem Statement

A product sent its rich text field to STACK as proposals in November 2026, and record [0013](0013-squire-for-rich-text.md) chose its engine. The proposals made seven parts public, and a module of the types and the sanitizer. The parts were the field, its toolbar, the bar over selected text, the picture bar, the request bar of the writing tools, the rows of the proposed changes and the color picker of content. The page loaded every part with the field, and only the engine loaded later. The lock of the text lived in three places: the field, the toolbar and the engine. The product kept the state of each proposed change and computed the lines of the diff of a proposal, and the field derived the state again. The toolbar and the picture bar took the engine and its state as props, and no export path named those types. No release held these parts. Which parts and types are public, how does a page load them, and who owns a request of the writing tools, its states and the diff of a whole text?

## Decision Drivers

1. The focus never falls to the page, and a locked text takes no change from any control. These rules hold across the toolbar, the bars, the forms and the writing tools, so one part owns them, and a product arranges none of the smaller parts.
2. The contract names only what a product uses. A type of the engine, such as its state at the caret, stays inside, so the engine can change behind the interface of [0013](0013-squire-for-rich-text.md).
3. A page loads only what it shows. A page of 50 texts that nobody edits loads no engine and no toolbar ("A table of 50 rows" in `### rich-text-view`).
4. The writing tools act the same in every product: the states of a request, Stop, the numbering of the changes, the state of each change and the diff of a whole text.
5. The product keeps its service and its words: it gives one function that asks the service, and the words of its language.
6. No release held the parts of the proposals, so the change stays at level minor against v2.2.0 ([0012](0012-a-part-keeps-each-prop-of-an-earlier-release.md)).

## Considered Options

- Three parts and one module, the smaller parts inside in chunks of their own, and the writing tools of STACK behind one prop
- The seven public parts of the proposals, which the product arranges
- Public parts that a product puts together, with a public controller of the engine
- A second part of the field that holds the writing tools
- Three parts and one module, and the product as the owner of the state of each change and of the diff

## Decision Outcome

Chosen option: "Three parts and one module, the smaller parts inside in chunks of their own, and the writing tools of STACK behind one prop". It meets each driver, and each other option breaks one or more of drivers 1 to 4.

- **The parts.** `@stack-kit/stack/parts/RichTextView` shows a stored text read only, with the look of the field, and loads no engine. `@stack-kit/stack/parts/RichTextField` is the field. `@stack-kit/stack/parts/RichTextInPlace` is an advanced part: it shows the view, and puts the field in its place while a person edits. The module `@stack-kit/stack/rich-text` holds the types, the content colors, the sanitizer, `paperContrast`, the commands and their default keys (`RichTextCommand`, `RICH_TEXT_KEYS`).
- **The smaller parts.** They live in `preview/src/lib/rich-text/`: the engine, the content, the context of the field, the tools and their keys, the toolbar, the bars, the forms, the color picker and the picture. The writing tools, the diff of a whole text and the edit state of the part in place live there too. The package ships the folder in `"files"`, and no export path names it. Each `.svelte` file under `preview/src/lib/stack/` is public, so the smaller parts stand outside that folder.
- **The chunks.** The field loads each smaller part with `import()`, in a chunk of its own. The engine and the groups of tools load at the mount, and the menus at the mount of the full preset. The drawer of More, the forms and the bar over selected text load at their first use. The picture loads with `upload`, the writing tools with `writing`, and the diff at the first whole text. The part in place loads the field only when a person edits, and loads it early when the pointer enters the part or the focus reaches Edit.
- **The lock.** The field owns one lock: read-only, a request that runs and a whole text that waits. The smaller parts read it through the context of the field, and each tool runs through one function of the field.
- **The writing tools.** The page gives `writing`, with one function, `run(request, signal)`, which asks its service and gives a `WritingResult` or rejects, and the options of the tools. STACK owns the rest. It owns the states idle, running, changes, text, failed and stopped, and the abort on Stop and at the end of the field. It owns a request of another view (`pending`), the numbering of the changes in the order of the text, and the open, taken and left state of each change. The field computes the diff of a whole text from the two HTML texts. The product logs each decision through `ondecide`.
- **The keys.** Each command of the field has its default keys in `RICH_TEXT_KEYS` and the id `rich-text.<command>` in `architecture/keys.json`. The page gives other keys through `keys`, and the field reads each key with the one parser of `@stack-kit/stack/behaviour/keys`. A registry of the keys of a product can take these ids later with no change of the public API.

### Consequences

- Good, because a product imports three parts and one module, and arranges no smaller part. The page places its own controls through the snippets `toolbarEnd`, `bar` and `foot`.
- Good, because the contract records no type of the engine, so another engine can stand behind the interface of [0013](0013-squire-for-rich-text.md) in a minor release.
- Good, because one owner keeps the focus and the lock across the smaller parts. The checks s23 and s24 move the focus through each control of the writing tools, and the focus never falls to the page.
- Good, because a page loads only what it shows. The measure of 2026-11-14 ran in a built SvelteKit app that installs the packed package. A page of 50 parts in place has 91.2 KB of static JS beyond the shared chunks. It loads 191.3 KB of JavaScript at idle in 14 files, and no engine chunk. A pointer on one part loads the field, the engine and the toolbar, 479.6 KB in 36 files, and mounts no field. The 50 parts add no listener to the window, and three delegated listeners to the document in all. In a build with no part in place, a page with one field of the simple preset has 115.0 KB of static JS beyond the shared chunks. It loads 404.3 KB at idle, with its engine.
- Good, because the writing tools act the same in every product, and a product writes no state machine and no diff. `scripts/rich-text-writing.test.mjs` checks the states on a fake engine, and `scripts/rich-text-diff.test.mjs` checks the diff of a whole text, also on 300 random pairs.
- Bad, because a product that wants another layout of the toolbar, or a smaller part elsewhere on the page, cannot have it. It proposes the change to STACK.
- Bad, because the controller of the writing tools is a `.svelte.js` file with JSDoc and a `.svelte.d.ts` file, as [0010](0010-rune-modules-ship-as-javascript-with-types.md) asks. The dev server of a product did not compile a `.svelte.ts` file inside the package (measured in the fixture).
- Bad, because the diff of STACK reads the words and the blocks, a picture, a divider and the address of a link, and shows no change of a mark or a color.
- Bad, because the field and its part in place take the one parser of the keys into the chunk of the page, with the commands and their keys.
- Neutral, because the six public paths of the proposals go, and no release held them, so the level against v2.2.0 stays minor.

### Confirmation

`node scripts/contract.mjs diff v2.2.0 HEAD` gives level minor, with no breaking change. `npm run check` in the root and in `preview/` passes, also `npm run keys`, which compares `architecture/keys.json`, the tables of `architecture/web-app.md`, `DEFAULT_KEYS` and `RICH_TEXT_KEYS`. The fixture installs the packed package as a product does. Its check s23 reads the field, its chunks, its failures and the keys that a page gives. s24 reads the writing tools, the diff of a whole text and the papers. s25 reads the part in place: the caret at a click, Save, a failed save, Cancel with changes, Esc, the draft on blur, the field with no toolbar, and the page of 50 parts that loads no engine. Firefox, Safari, a screen reader and a phone were not tested. A person checks the parts there before a release takes them.

## Pros and Cons of the Options

### Three parts and one module, the smaller parts inside in chunks of their own, and the writing tools of STACK behind one prop

- Good, because it meets each driver (Consequences).
- Bad, because a product cannot arrange the smaller parts (Consequences).

### The seven public parts of the proposals, which the product arranges

- Good, because a product can place each part where it wants.
- Bad, because each smaller part takes the engine or its state as a prop, so the contract records the types of the engine, against driver 2.
- Bad, because the lock and the focus span parts that the product arranges, so STACK cannot keep driver 1.
- Bad, because every part loads with the page, against driver 3.

### Public parts that a product puts together, with a public controller of the engine

- Good, because a product can build a field of its own from the parts.
- Bad, because the controller publishes the engine and its state, against driver 2.
- Bad, because STACK cannot keep the rules of the focus and the lock across parts that a product arranges, against driver 1.

### A second part of the field that holds the writing tools

- Good, because a field with no writing tools carries none of their code.
- Bad, because a page swaps parts to turn the writing tools on, and the two parts drift apart. The chunk of the writing tools already loads only with `writing`, so the field carries none of their code without them.

### Three parts and one module, and the product as the owner of the state of each change and of the diff

- Good, because a product can compute the diff in its own way.
- Bad, because each product writes the same state machine and the same diff, and the writing tools act differently in each product, against driver 4.
- Bad, because the field derives the state of a change again from the props, so two owners can disagree.

## More Information

The order of the work, and what each step changed:

1. The smaller parts moved to `preview/src/lib/rich-text/`, with no change of behaviour.
2. The context of the field, one function for each tool, the chunks, the bars and the tooltips that mount at the first use, and an `IntersectionObserver` for the toolbar that sticks.
3. The content in one place for the field and the view, and `RichTextView`. When the engine does not load, the field shows the HTML of the person in the view.
4. `paper`: a page gives a field or a view its own paper, ink and link. In development the part warns when a text reads under 4.5:1, and the field calls `onfailure` with the kind `paper`.
5. `onfailure`: the field writes no failure text of its own.
6. The diff of a whole text, with `node --test`.
7. `writing`: the state machine, the abort, `pending`, Left out with Take after all, and the words.
8. The keys by id, and the one parser of the keys.
9. `RichTextInPlace`, and the option `toolbar` of the field.

Markdown as a person types and a slash menu come in a later minor release, as props of the field (`markdown`, `slash`), with their chunks inside.

A registry of the keys of a product is a later step. It reads the ids `rich-text.<command>` of `architecture/keys.json` and the default keys of `RICH_TEXT_KEYS`, and it gives the keys of the person to the field through `keys`. The field takes no key of characters alone, so the rule of a text field in "### Rules" of `architecture/web-app.md` holds for each key that a person chooses.
