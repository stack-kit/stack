---
status: accepted
date: 2026-11-13
decision-makers: the developer
---

# Squire for the rich text field

## Context and Problem Statement

A product writes text that people read with its look: a reply to a mail, an internal comment, a note or the description of a record. The person needs bold, headings, lists, links, colors and pictures, and pastes text from a word processor or a web page. `DESIGN.md` had `### textarea` for plain text and `### code-editor` for code, and no field for rich text. A product built a rich text field and sent its parts to STACK as proposals in November 2026. Which engine edits the text, and in which form does a product take it?

## Decision Drivers

1. The engine edits a `contenteditable` element that a part of STACK draws, so the toolbar, the bars and the states follow `DESIGN.md`, and the engine brings no look of its own.
2. Each HTML that enters goes through one hook, so the field cleans a paste, a drop and a load with the lists of STACK.
3. The HTML that the engine writes is plain: a line is a block, a mark is a tag, and nothing of the engine stays in the content. A mail client and a server read it with no schema.
4. The engine keeps an undo history, and a change that a part makes, such as a proposed change, can join it as one step.
5. The engine has no dependencies, and its licence permits it in a closed product.
6. It runs on Svelte 5 in SvelteKit ([0001](0001-svelte-5.md)), and it loads only with a page that shows the field.
7. The focus never gets caught: WCAG 2.2 success criterion 2.1.2, No Keyboard Trap (level A). In a list item, Tab and Shift+Tab move the item a level in or out, so Esc, then Tab within 2 s, leaves the item, as in the code editor ([0005](0005-codemirror-6.md)). Alt+F10 moves the focus from the text to the toolbar, and Esc moves it back. In a read-only text, Esc reaches the page, so a layer around the field closes.
8. Of the options that meet drivers 1 to 7, it adds the least to the page that uses it.

## Considered Options

- Squire 2.4.10, behind one interface of the part, with its own resizer of pictures off
- An editor framework with a document schema, and the toolkit built on it
- An editor framework with its own state model and its own nodes
- An editor with its own document format and its own toolbar and theme
- A `contenteditable` element with the `execCommand` of the browser

## Decision Outcome

Chosen option: "Squire 2.4.10, behind one interface of the part, with its own resizer of pictures off", because it meets each driver and is the smallest of the options. A product ran the same engine in its rich text field before it sent the proposals. The part `RichTextField` loads the engine with `import()`, and `preview/src/lib/rich-text/engine/engine.ts` is the one file that imports `squire-rte`. The other parts of the field read the interface `Engine` of `preview/src/lib/rich-text/engine/types.ts`, so another engine can stand behind it.

### Consequences

- Good, because Squire edits the element that the part gives it, and draws nothing else. The toolbar, the bar over selected text, the picture bar and the states are parts of STACK.
- Good, because `sanitizeToDOMFragment` takes each HTML that enters: `setHTML`, `insertHTML` and a paste. The field gives it the load list or the paste list of `@stack-kit/stack/rich-text`, which builds a new tree from an allow list.
- Good, because the HTML is plain: a line is a `div`, a mark is `b`, `i`, `u`, `s`, `sub`, `sup` or `code`, a color is a `span` with a hex value in its style, and an aligned line has a class and a `text-align` style.
- Good, because `saveUndoState` records the content, and a change of the DOM after it is one step of the history. A Take of a proposed change and the drag of a grip use it.
- Good, because the package has no dependencies, and its licence is MIT. `dist/squire.mjs` of 2.4.10 is 60,233 B raw and 18,477 B gzip at level 9.
- Bad, because Squire writes the value of `setTextColor`, `setHighlightColor`, `makeLink` and `insertImage` into an attribute outside the sanitizer. So the engine passes only `#rrggbb`, an http, https or mailto address, and a picture address that the picture test of the field keeps.
- Bad, because the engine reads four members that Squire declares in its types and does not document: `_imageResizer`, whose handles would enter the HTML and the undo history, `_dragRange`, which tells a drag inside the text from a drop of files, `_updatePathOnEvent`, which reads the selection only while the text has the focus, and `_config.addLinks`, which Take all of a whole text turns off, so that a plain address stays a plain address. It also replaces the key handlers of Squire by their names. The record pins 2.4.10 exactly, and the peer range of `squire-rte` is `~2.4.10`, so a product takes only the patch releases of 2.4, and a new minor version comes only through a release of STACK that checks the four members. A `typeof` guard keeps the engine working when one of them is missing: the field then keeps the resizer of Squire, counts no drag as its own, leaves Squire to listen to the selection of each field, or lets Take all make a link of a plain address. The check s23 renames each of the four in the chunk of the engine, and the field still edits.
- Bad, because the browser formats text by itself, such as from the Format menu of Safari, and Squire runs some of those inputs. The engine stops each of them, and runs only bold, italic and underline, which every preset has.
- Bad, because one maintainer publishes the package. 2.4.11 came out on 2026-11-10 and was not tested.
- Neutral, because Squire makes a list of "* " and "1. " at the start of a line. The simple preset turns that key off, because it has no list.

### Confirmation

The check s23 of the fixture ran on 2026-11-13 against the packed package, in the headless shell of Chromium 156.0.8078.4 on macOS:

- **The sanitizer.** 20 hostile samples went through the load list and the paste list, such as `<img src=x onerror>`, script in SVG and in MathML, a `noscript` title, a `javascript:` address with a tab, a control character or mixed case, `vbscript:`, `data:text/html`, an SVG and a `srcset` on a picture, a style with `url()`, a form action, `base`, `meta` refresh, `template`, `iframe srcdoc`, and `id` and `name` on a link. Each output held only the elements, attributes and values of its list, and a second clean changed nothing. The cleaned HTML in `{@html}` ran no script and loaded no picture.
- **A paste.** A copy and a paste in the field kept the color of the copy. The clipboard held the copy with `<!-- squire -->` in front. In a paste of that copy between the markers of a clipboard, the HTML outside the markers did not enter. A paste of the copy with more HTML got the paste list.
- **Refused values.** The field refused a picture from a `javascript:` address, an https host, an SVG, an HTML data address and a data address with a quote, and it kept a PNG. The link form refused five hostile addresses, and an address with a quote stayed one `href`. The engine refused a color that is no hex value.
- **Keys.** In a text that a person can edit, Esc and Cmd+B stayed in the field, Cmd+K opened the link form and did not reach the page, and Cmd+S and Cmd+Enter reached the page. In the simple preset, Cmd+K reached the page. In a list item, Tab indented and Shift+Tab outdented, and Esc, then Tab, moved the focus out with no change. Alt+F10 moved the focus to the toolbar, and Esc moved it back. A read-only field in a dialog passed Cmd+K, Cmd+B, Cmd+S and Cmd+Enter to the page, Tab left it, Esc closed the dialog, and no key changed its text.
- **The marks.** The words of an open change had their mark, and the HTML out held no trace of it.

With three rules broken on purpose, the same check failed on those lines (see More Information). `npm run check` in the root and in `preview/`, and `npm run build:static` in `preview/`, compiled the parts with Squire 2.4.10 pinned exactly. In the static build, the chunk of the engine, Squire with `rich-text/engine/engine.ts`, is 72,419 B raw and 22,412 B gzip at level 9, measured on 2026-11-13 after the fixes of the review and the cut of the parts that a service of the product runs. The field loads the engine and each of its other parts with `import()`, in chunks of their own, so a field loads at its mount only what it mounts (`### rich-text-field` in `DESIGN.md`). Measured on 2026-11-14 in a built SvelteKit page that installs the packed package: one field of the simple preset loads 402.9 KB of JavaScript at idle, against 520.7 KB with one chunk for the whole toolbar, and a page of 50 fields of the full preset loads 444.6 KB, against 520.8 KB. After the keys by id and the option `toolbar` of the field, a measure of the same day in the same way gave these sizes. The page of one field of the simple preset has 115.0 KB of static JS beyond the shared chunks, against 110.5 KB, and loads 404.3 KB at idle. The page of 50 fields loads 446.1 KB. The one parser of the keys and the default keys of the commands now stand in the chunk of the page. The chunk of the component page is 629.66 kB, so it stays over the 500 kB warning of the bundler, as it was at v2.2.0 with 605.40 kB. The product that sent the proposals ran Squire 2.4.10 in its field with the same lists and the same keys. Firefox, Safari, a screen reader and a phone were not tested. A person checks the field there before a release takes it.

## Pros and Cons of the Options

### Squire 2.4.10, behind one interface of the part, with its own resizer of pictures off

- Good, because it meets each driver (Consequences).
- Bad, because of the undocumented fields and the attributes outside the sanitizer (Consequences).

### An editor framework with a document schema, and the toolkit built on it

- Good, because a schema refuses any content that the field does not allow, and a transaction makes each change one step.
- Bad, because the HTML goes through the schema both ways, so each mark, block and color of the field needs a node or a mark of the schema.
- Bad, because the core of the toolkit is 3,333,868 B unpacked at version 3.33.1, and the view of the framework alone is 912,117 B unpacked at version 1.42.9, with three dependencies (npm, 2026-11-13).

### An editor framework with its own state model and its own nodes

- Good, because its state is data, and a part can read it with no DOM.
- Bad, because the HTML goes through its nodes both ways, as with a schema.
- Bad, because it is 3,745,927 B unpacked at version 0.53.0, before 1.0 (npm, 2026-11-13).

### An editor with its own document format and its own toolbar and theme

- Bad, because it draws its own toolbar and loads its own CSS, so a product restyles it for each theme.
- Bad, because it is 3,036,362 B unpacked at version 2.0.3, with four dependencies (npm, 2026-11-13).

### A `contenteditable` element with the `execCommand` of the browser

- Good, because it needs no package.
- Bad, because the specification of `execCommand` is unofficial and the browsers differ in the HTML that it writes, such as a `span` with a style in place of a `b`.
- Bad, because it has no undo history that a part can join, and no hook for the HTML that enters.

## More Information

The preview pins `squire-rte` 2.4.10 exactly, and the record `preview/components.lock.json` names it for the parts of the field. The rules that the field takes from the engine:

- **One hook.** Give `sanitizeToDOMFragment` the load list while `setHTML` or a replace of the whole text runs, and while a drag inside the text moves a part of it. A paste is the own copy of the field when its fragment equals the last copy of this text: the part between the markers of the clipboard, with no charset element and no `<!-- squire -->` in front. Give the load list that fragment only, and give the paste list each other paste.
- **A copy.** Squire writes `<!-- squire -->` in front of the HTML of each copy, and it copies a part of one text node inside one inline element as plain text, with no HTML. On 2026-11-13, the clipboard of the headless shell of Chromium 156 gave a paste the HTML that a copy wrote, exactly, with the comment in front (measured).
- **The keys.** Take each format key of Squire and its keys of undo and redo out with `setKeyHandler(key, null)`. Name Cmd both `Meta-` and `Ctrl-`, because Squire names Cmd by its own test of the system. The field matches the keys of its commands with the one parser of `@stack-kit/stack/behaviour/keys`, so a page can give a command other keys ([0014](0014-the-public-surface-of-the-rich-text-field.md)). Undo and redo still run through Squire. A key with Cmd that no command takes goes on to the page. For Cmd+B, Cmd+I, Cmd+U, Cmd+Z, Cmd+Shift+Z and Cmd+Y the field then stops the edit of the browser, so a key that a command gave up does not format or undo the text.
- **Read-only.** Set `contenteditable` through `modifyDocument`, so that Squire counts no input, and stop each input event before Squire while the text is read-only, except a keydown. Let Esc and each key with Cmd or Ctrl go on to the page. Prevent the ones that edit a text, because Squire returns on a prevented key: Backspace and Delete, which Squire runs, and Z and Y, which the field runs. Stop each other key at the text, as in a read-only text area, so that no single-key binding of the page runs.
- **A change.** Squire fires `input` for a change of the DOM that changes no content, such as the removal of its zero-width spaces. Compare `getHTML()` with the last value before the field calls `onchange`.
- **A replace of the whole text.** Call `saveUndoState()` with the selection of the person first, then put one empty block in the root outside `modifyDocument`, select the whole root, and call `insertHTML` with `addLinks` off. A selection of the whole old text keeps the containers of its first block, so a text that starts with a quote takes the new text into the quote, and a text that starts with a list keeps an empty list. `takeRecords()` of `modifyDocument` counts the bookmark of the saved step as a change, so undo gives an empty text. `addLinks` turns a plain address of the new text into a link. In Chromium, 25 pairs of an old and a new text gave the new HTML exactly, one undo step back to the old HTML with a caret, and a redo (measured on 2026-11-14).
- **The marks of a proposed change.** Mark the words with the CSS Custom Highlight API, so that no mark enters the HTML, a copy or the undo history. The API draws only a color or a line, and no sign such as a pilcrow, so a proposal of a whole text shows as a `diff` in the place of the text, and its HTML enters through a replace of the whole text.

The check s23 can fail. One run broke three rules on purpose: a link kept any address, a read-only text stopped every key, and a paste compared the whole clipboard HTML, with `<!-- squire -->` in front, with the copy, as the first version of the engine did. 16 of the 60 lines of the check failed. 10 lines were the 5 samples of a hostile link address, in both lists. 3 lines were the pastes: the copy of the field never matched in Chromium, so a paste of it lost its color. 3 lines were the read-only field: no key with Cmd reached the page, and Esc left the dialog open.

### The sanitizer

The field cleans HTML with its own allow list in `preview/src/lib/stack/rich-text.ts`, and with no sanitizer library:

- The lists do more than remove. The paste list reads the bold of a style as `b`, makes a list of the list paragraphs of a word processor, keeps the text of a table cell and the alt text of a picture, and gives each block of a container to the top level. A general sanitizer in front of that pass would make two passes over each paste.
- The copy is an allow list by its form. The sanitizer parses the HTML into an inert `template`, and builds a new tree in a document with no browsing context. Each element is a new element of an allowed tag, and each attribute a value that passed its own test. Nothing that the list does not name reaches the output, so a tag, an attribute or a scheme that the list forgot cannot pass.
- It adds no package, so driver 5 holds.

The sanitizer needs a DOM, so it runs in the browser. A server that stores or sends the HTML cleans it again, because a person can send any HTML past the field, and the server stays the authority. A Worker has no DOM, so the server uses an allow-list sanitizer that needs no DOM, with the tags, attributes and schemes of the load list that `### rich-text-field` in `DESIGN.md` names. A page never gives stored HTML to `{@html}` unless `sanitizeRichText` cleaned it first.
