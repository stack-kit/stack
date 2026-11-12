### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The back office of rndm writes the reply to a mail and an internal comment as rich text. `DESIGN.md` has a `textarea` for plain text and a `code-editor` for code, and no field for rich text. So the product built a rich text field from an `input-group` and met these gaps.

1. No anatomy. STACK does not say where the toolbar, a bar of the product and the rows under the text stand in an `input-group`, or which ground the text takes.
2. No paste rule. A paste from Word, from Google Docs or from a web page brings fonts, colours, spans, tables and containers. A container such as the `div` around an article stays one block around the pasted text. A tool that acts on the line of the caret, such as Heading 1 or a list, then takes the whole container. A list of Word comes as paragraphs with a marker character. A text whose page kept its lines with `white-space: pre-wrap` loses its lines when the style goes.
3. No line keys. STACK does not say what Enter, Shift+Enter, Tab, Shift+Tab and Backspace do in rich text. "Rules" of "Keyboard model" in `architecture/web-app.md` gives Enter and Cmd+Enter for a text area only. A `code-editor` takes Tab, and lets Esc and Tab leave it.
4. No ground for content that goes out. A mail has no dark values (`### Dark mode in a mail client`), so a mail body that a person writes keeps its own colours. On a dark page the body needs a light paper, so that the editor shows what goes out.
5. No states. STACK does not say how the field looks while the product reads the text and the person must not change it, what it shows when the editor fails to load, or how a placeholder and a label reach a `contenteditable` element.
6. No rule for the earlier message in a reply. A reply holds the quote of the message that it answers under the words. The quote is long, and the person rarely changes it.

Every product with a rich text field meets these: a mail, a comment, a note and a document.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:2302`, `### textarea`, and `DESIGN.md:2326`, `### code-editor`: no field for rich text.
- `DESIGN.md:2225`, `### input-group`: the message box puts a text area in the control and its actions in a `block-end` addon. Disabled: "a disabled control gives the group an `input/50` ground at 50% opacity".
- `architecture/web-app.md:116`: the Cmd keys in a text field. `:118`: Enter and Cmd+Enter in a text area.
- `architecture/web-app.md:146` and `:147`: Tab, Shift+Tab and Esc in a `code-editor`.
- `DESIGN.md:5346`, `### Dark mode in a mail client`.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/editor/RichEditor.svelte:3-40`: what a page reads from the field. `:71-108`: the props. `:348-420`: the markup.
- `admin/src/lib/editor/sanitize.ts:20-28`: the rules of the paste list. `:223`: a Word list. `:293`: the line ends of a kept style. `:311`: the structure before the allow list. `:512`: the flat paste. `:522`: the load of an older draft. `:552`: the inert parse. `:577`: the paste list in order.
- `admin/src/lib/editor/squire.ts:528`: Tab in a list item. `:535`: Backspace at the start of a quote.
- `admin/src/app.css:23-35`: the paper and the ink of a mail body.
- `admin/src/routes/(app)/mail/ReplyEditor.svelte:97-104`: the quote of the earlier message, folded in the field.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

**A part `### rich-text-field`.** The field is an `input-group`. Its rows, from the top:

1. The toolbar in the `block-start` row (see the proposal "missing: a rich text toolbar that stays at the top, a bar over selected text and a / menu").
2. An optional bar of the product, such as the state of a check of the text.
3. The text: the `input-group-control`, a `contenteditable` element with `role="textbox"` and `aria-multiline="true"`. It sits on the paper of the content. It has `contain: paint` and scrolls a wide content, such as a table of a quoted mail, inside itself. The text takes the `reading` step from 768 px, and 16 px below 768 px, so that iOS Safari does not zoom on focus. A preset sets its least height, such as 160 px for a mail and 96 px for a comment.
4. Optional rows of the product under the text, such as a list of left-out changes or a field with an instruction. The paper then keeps square bottom corners.

The product gives the field a preset: the tools that are on, the paste list and the least height. Three presets cover the cases that the product met: Mail (every tool), Comment (the tools of Mail with no quoted mail) and Simple (bold, italic and underline only).

Props and events, in the form that the product uses:

```ts
type RichTextFieldProps = {
  preset: 'simple' | 'mail' | 'comment';
  /** The first content, read once when the engine has loaded. */
  html?: string;
  readonly?: boolean;
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  /** A label element cannot name an element that is not a form control. */
  labelledby?: string;
  describedby?: string;
  /** The person changed the content. It carries no HTML, so a long quote is not written out at each key. */
  onchange?: () => void;
  /** Cmd+Enter in the text, such as Send. Cmd+S and every key that no tool takes pass to the page. */
  onsubmitkey?: (e: KeyboardEvent) => void;
  /** Stores a picture, and gives the stored picture, or the sentence that says why it did not go up. */
  upload?: (file: Blob) => Promise<{ id: string; url: string; width: number; height: number } | string>;
  toolbarEnd?: Snippet;
  bar?: Snippet;
  foot?: Snippet;
  ref?: RichTextFieldRef | null;
};

type RichTextFieldRef = {
  focus(): void;
  /** Sets the content with a new undo history, and fires no onchange. */
  load(html: string): void;
  html(): string;
  /** The words: each block on its own line, with no quoted mail. */
  words(): string;
};
```

**Paste.** Each HTML that comes in from outside the text goes through one paste list of the preset. The list keeps structure only. It parses the HTML into an inert `template`, so no script runs and nothing loads, and it removes `script`, `style`, `iframe`, `svg`, the elements of a head and each `on*` attribute there. Then it takes these steps in order:

1. While each element still has its style: a text whose style keeps its line ends (`pre`, `pre-wrap`, `pre-line`, `break-spaces`) gets a line break at each line end, and a blank line becomes an empty line. A run of Word list paragraphs (`mso-list`) becomes a list, a deeper level a list in the list, numbered when the marker is a number or a letter. The marker goes.
2. A table cell becomes its text, with a space before each cell after the first, and its row becomes a line. A picture becomes its alt text. The `<b style="font-weight:normal">` of Google Docs around a whole copy goes. A `span` or a `font` whose style makes bold, italic, underline, a line through, superscript or subscript becomes that tag. `strike` and `del` become `s`, and `ins` becomes `u`. Every other block becomes a line.
3. The allow list of the preset. Mail keeps `p`, `div`, `br`, `hr`, `h1` to `h3`, `b`, `strong`, `i`, `em`, `u`, `s`, `sub`, `sup`, `code`, `pre`, `ul`, `ol`, `li`, `blockquote` and `a` with an `http`, `https` or `mailto` address. No style, class, font, span, table or picture stays, and their text does. A link with no address becomes its text.
4. A flat paste. When the paste holds a block, each container gives its blocks to the top level, and each run of inline content becomes a line, a `div`. A list item holds no block: two lines in an item join with a line break. A quote holds lines, and a code block keeps its text with its line ends. An inline element around blocks, such as a link around a card, goes around each line. The line break that a browser adds after a copy goes. A paste of inline content alone stays inline, so it joins the line of the caret.

A paste of picture files with no text, and a drop of files from outside the text, go to `upload` when the preset takes pictures. The field never inserts the name of a file. A move inside the text, by a drag or by a copy and a paste of this text, keeps the look of what moved.

**Load.** A saved draft goes through a load list, which keeps the look that the tools write. A bare `div` with no attribute that holds a block or a line break gives its content to the top level, so an older draft with a container around its text loads flat. A `div` with an attribute, such as an aligned line, stays. A second load changes nothing.

**Keys in the text.**

| Key | Action |
|---|---|
| Enter | Start a new line. In an empty list item, move the item a level out. |
| Shift+Enter | Break the line inside its block, with no new block, such as the lines of an address. |
| Tab, Shift+Tab | Move a list item a level in or out, anywhere in the item. Outside a list, indent or outdent the line. The focus stays in the field. |
| Esc, then Tab within 2 s | Leave the field, as from a `code-editor`. |
| Cmd+Enter | Run `onsubmitkey`, such as Send. |
| Cmd+S | Pass to the page, which saves the draft. |
| Backspace | At the start of a quoted line with no line before it, do nothing, so that the quote stays whole. |

**The paper.** Two roles, `mail-paper` and `mail-ink`, with the same light values in both modes. The text of a mail and of a comment sits on them, so the field shows what goes out.

**States.**

- Read-only: the text takes `mail-ink` at 75%, so the person sees that the words wait, and the toolbar shows each tool unavailable. The group does not dim, because no control is `:disabled`.
- Placeholder: `aria-placeholder` on the text, and the words in `mail-ink` at 60% while the text is empty.
- Invalid and required: `aria-invalid` and `aria-required` on the text, so the group draws the edge of `### input-group`.
- Failed to load: a line with `role="alert"` in the place of the text, such as "The editor did not load. Reload the page to write here."
- The page sets each attribute of the text through the field, so that the editor does not count it as an input of the person.

**A reply with the earlier message.** The quote stands under the words, after its line "On ... wrote:", and it is folded by a class, never in the HTML. "Show the quoted mail" opens it. Down or Right at the end of the visible text opens it and moves the caret in. A selection that reaches into it opens it. While it is folded, Cmd+A selects the words, and Delete at the end of the visible text does nothing, because it would join the hidden line to the words.

### What the product does until a release ships it

`RichEditor.svelte` builds the field from `InputGroup.Root`, with Squire 2.4.10 as the engine behind one interface and DOMPurify 3.4.17 for the lists. The engine loads with a dynamic import, so it stays out of the bundle of each page. The product layer holds `--product-mail-paper` and `--product-mail-ink`. Outside a list, Tab leaves the field today, and the owner asked for the indent of the table above. The product marks each stopgap with the number of this pull request.
