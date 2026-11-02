---
status: accepted
date: 2026-10-23
decision-makers: the developer
---

# CodeMirror 6 for the code editor

## Context and Problem Statement

A product edits text that a machine reads, such as an instruction, a configuration or a script. The person needs line numbers and Tab to indent, and the focus must never get caught in the editor. `DESIGN.md` had `### textarea`, with no gutter and no rule for Tab. A product asked for a code editor in a proposal pull request on 2026-10-20, and it named CodeMirror 6. Which editor do the products use, and in which form?

## Decision Drivers

1. The editor shows line numbers, and Tab indents.
2. The focus never gets caught: WCAG 2.2 success criterion 2.1.2, No Keyboard Trap (level A).
3. The editor takes the tokens of `stack.css`, in both modes and in every theme, with no editor code for a theme.
4. A read-only editor keeps its text in the focus order, so that a person can select and copy it.
5. It runs on Svelte 5 in SvelteKit ([0001](0001-svelte-5.md)).
6. Of the options that meet drivers 1 to 4, it adds the least to the page that uses it.

## Considered Options

- A plain `textarea` in `font-mono`
- CodeMirror 6 from its three core packages, in a small component of the product
- CodeMirror 6 through the `codemirror` package and its `basicSetup`
- A Svelte 5 wrapper of CodeMirror
- A small editor on a `contenteditable` element
- A large editor taken from a desktop code editor

## Decision Outcome

Chosen option: "CodeMirror 6 from its three core packages, in a small component of the product", because it met each driver in the test of 2026-10-23. The three packages are `@codemirror/state` 6.7.6, `@codemirror/view` 6.43.15 and `@codemirror/commands` 6.11.1. The component creates one `EditorView` on mount and destroys it on unmount. `DESIGN.md` holds the part, `### code-editor`, and the preview holds the component in `preview/src/lib/stack/CodeEditor.svelte`.

### Consequences

- Good, because `EditorView.theme` takes CSS custom properties as values, such as `var(--color-muted-foreground)`. The browser resolves them, so a change of the mode or the theme changes the editor with no editor code.
- Good, because `indentWithTab` binds Tab and Shift+Tab, and CodeMirror lets Tab leave for 2 s after Esc. In a read-only editor Tab leaves at once.
- Good, because `EditorState.readOnly` refuses each edit and keeps the text in the focus order, with `aria-readonly="true"`.
- Bad, because the editor adds 88,257 B gzip, 276,263 B raw, to a page. The research of 2026-10-23 read about 119 KB gzip for the `codemirror` package on bundlephobia. The three core packages are not much smaller, because `@codemirror/commands` depends on `@codemirror/language` and its parser packages. With esbuild 0.25.12 they bundle to 89,991 B gzip, against 125,124 B gzip for `codemirror` with `basicSetup`.
- Bad, because CodeMirror mounts its CSS with no cascade layer, so it beats a Tailwind class on the same property. The theme of the component replaces each value of the base theme that shows: the dotted focus outline, the font and the line height of the scroller, the black caret and the grey gutter.
- Bad, because the default keymap takes two keys that the part needs elsewhere. Escape collapses a selection, and then that Esc does not open the 2 s window. Mod-Enter adds a blank line, and Cmd+Enter is the shared key of the main action of a form. The component takes both bindings out.
- Bad, because the 2 s window is a fixed value in the code of `@codemirror/view` 6.43.15 (`Date.now() + 2000`), not an option.
- Bad, because one maintainer publishes the three packages (npm, 2026-10-23).
- Neutral, because the editor loads no language package, so the text has no syntax colors. A product that needs them asks that question on its own.

### Confirmation

The test of 2026-10-23 built the component in the preview with the three packages pinned exactly, and checked it in Chromium 1223 through Playwright 1.60.0:

- **Tokens.** Four editors at rest, read-only and invalid, in both modes of the `default` and the `graphite` theme: the ground, the text, the edge, the caret, the gutter ground, the gutter text and the gutter edge equal the tokens of the theme and mode, with 0 differences. The text renders in `ui-monospace, Menlo, monospace` at 12 px on a 16 px line.
- **Focus.** A click into the text draws the focus ring of `## Shapes` on the box, with the same edge and halo as the ring that the same classes draw on a plain element. An invalid editor draws the same edge and halo as an invalid text area, in light and in dark.
- **Keys.** Tab added two spaces at the start of the line, and Shift+Tab took them out, with the focus in the editor. Enter kept the indent of the line, and Cmd+Z took the input back. Esc, then Tab, moved the focus to the next control, and Esc, then Shift+Tab, to the previous one. With text selected, Esc, then Tab, also left once Escape was out of the keymap, and the text did not change. After Esc and a wait of 2.2 s, Tab indented again. Cmd+Enter added no line, and a listener on the window saw it, not prevented.
- **Read-only.** A click put the focus in the text. Typed letters, Enter and Backspace changed nothing. Tab moved the focus to the next control, and Shift+Tab to the previous one.
- **In a dialog.** With the editor in an open dialog, Esc closed the dialog. With the Esc stopped in the editor, the dialog stayed open, Tab moved the focus to the next control in the dialog, and the next Esc closed it. The component stops each Esc in an editor that a person can edit. With a read-only editor in the dialog, Esc closed the dialog, because the component lets Esc through there: Tab leaves a read-only editor at once.
- **Growth.** The box grew 16 px a line, from 66 px when empty to 320 px at `max-h-80`, with 19 lines, and then the text scrolled inside it. The gutter ran to the bottom of the box at every height once the min-height sat on the text and the gutter. On the box, the min-height left the gutter at 32 px in a 64 px box. The gutter was 36 px wide up to line 999 and 40.9 px at line 1,000, plus its 1 px edge. A long line scrolled sideways under the gutter, which kept the ground of the box.
- **Phone.** At 390 px, on a fresh load and after a resize from 1280 px, the gutter hid and long lines wrapped, with no sideways scroll. The resize back to 1280 px brought the gutter back. With the phone key of `DESIGN.md`, the text rendered 16 px on a 22 px line below 768 px, and 12 px from 768 px.
- **Size.** The JavaScript and CSS of `npm run build` of the preview grew by 290,258 B raw and 91,593 B gzip, at gzip level 9. The editor chunk, with CodeMirror and the component, is 276,263 B raw and 88,257 B gzip. The showcase adds 5,001 B raw to the chunk of the component page, and the CSS grows by 679 B raw. The rest, 8,315 B raw, is the longer text of `DESIGN.md`, which the preview bundles.

Firefox, Safari, VoiceOver, NVDA and a phone with a touch keyboard were not tested. A person checks them.

## Pros and Cons of the Options

### A plain `textarea` in `font-mono`

- Good, because it needs no package, and nova draws it.
- Bad, because it has no gutter. Line numbers need a second element that follows the scroll and each wrapped line (not measured).
- Bad, because Tab moves the focus out of a text area. Tab to indent needs a key handler of the product, and that handler needs its own way out.

### CodeMirror 6 from its three core packages, in a small component of the product

- Good, because the test met each driver.
- Good, because the component holds only what the part needs: line numbers, history, the keys and the theme.
- Bad, because of the size and the base theme (Consequences).

### CodeMirror 6 through the `codemirror` package and its `basicSetup`

- Good, because one import gives a full editor.
- Bad, because `basicSetup` adds a fold gutter, bracket matching, closing brackets, autocompletion, search, rectangular selection and the highlight of the active line. A text for a machine in a back office needs none of them.
- Bad, because esbuild 0.25.12 bundles it to 386,799 B raw and 125,124 B gzip, against 277,432 B raw and 89,991 B gzip for the three core packages with the same bundler.

### A Svelte 5 wrapper of CodeMirror

- Good, because its props cover line numbers, Tab, read-only and wrapping.
- Bad, because its peer is the `codemirror` package, and its component imports from seven CodeMirror packages, among them autocompletion, lint and search (version 2.1.0).
- Bad, because its last release is of 2025-10-10, and the theme still needs `EditorView.theme`.

### A small editor on a `contenteditable` element

- Good, because it is small: 26,112 B unpacked (version 4.3.0).
- Bad, because its README documents that it catches Tab by default and names no key to leave, so the focus gets caught until the product adds a way out.
- Bad, because line numbers come from a separate package.

### A large editor taken from a desktop code editor

- Bad, because its package is 101,674,083 B unpacked, at version 0.57.0, before 1.0.
- Neutral, because the test did not try it.

## More Information

The test of 2026-10-23 ran these versions. The preview pins the three packages exactly, and its lockfile holds the rest: `@codemirror/language` 6.13.1, `@codemirror/streamparser` 6.0.0, `@lezer/common` 1.5.4, `@lezer/highlight` 1.2.5, `@lezer/lr` 1.4.11, `style-mod` 4.1.4, `crelt` 1.0.7, `w3c-keyname` 2.2.8 and `@marijn/find-cluster-break` 1.0.4.

The test found these rules for the part:

- **The theme.** Put the box classes on the `.cm-editor` element through `EditorView.editorAttributes`, with `data-slot="code-editor"`. Put that element in a root of its own (`code-editor-wrapper`), a flex column that takes the class of the page. Then a `max-h-*` class on the root stops the box, which hides its overflow, and the scroller scrolls. The phone key of `stack.css` reaches the box. Give the scroller `font-family: inherit` and `line-height: inherit`, so that the classes of the box set the font.
- **The minimum height.** Set the min-height on `.cm-content` and `.cm-gutter`, not on the box.
- **Read-only.** Use `EditorState.readOnly`, never `EditorView.editable` set to false, which takes the text out of the focus order.
- **The keys.** Put `indentWithTab` first in the keymap, and take Escape and Mod-Enter out of `defaultKeymap`. Stop each Esc in an editor that a person can edit with `EditorView.domEventHandlers`, and let it through when `view.state.readOnly` is true. Return false, so that CodeMirror still opens its window for Tab.
- **The phone.** Swap `lineNumbers()` and `EditorView.lineWrapping` in a `Compartment` when the width crosses 768 px.
- **The size.** SvelteKit splits the code by route, so the editor loads only with a page that shows it. The component page of the preview shows every part in one chunk, so its showcase loads the component with `import()`. With a static import, that chunk grew to 683,205 B raw, past the 500 kB warning of the bundler.
