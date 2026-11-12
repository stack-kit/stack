### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The reply editor of rndm has writing tools at the end of its toolbar. Each tool asks the service of the product for proposed changes to the text, and the person takes or leaves each one (see the proposal "missing: proposed changes in a text, each with Take and Leave, and Undo").

- Check proposes fixes of spelling, grammar and the rules of the product.
- Rewrite is a menu with two groups. Edit has five modes: Improve, Rephrase, Shorten, Fluent and Detailed. Tone has twelve: Friendly, Formal, Casual, Professional, Confident, Assertive, Diplomatic, Empathetic, Compassionate, Engaging, Exciting and Cooperative. A rewrite acts on the whole text, or on the selected words only.
- Structure arranges the same words into paragraphs, headings and lists.
- A field under the text takes an instruction in the words of the person, such as "make the second paragraph shorter", for the whole text or for the selected words.
- Check of a long text with no paragraphs first asks "Fix the structure first?".

A request takes seconds and can take minutes. While it runs, the text must not change under it, and the person must be able to stop it, to leave the page, and to find the result when they come back.

`DESIGN.md` has no rule for any of this. The product built it from `button`, `ReasonButton`, `dropdown-menu`, `badge`, `spinner`, `input-group`, `textarea`, `kbd`, `tooltip` and `alert-dialog`, and met these gaps:

1. No place for tools of the page in the toolbar of an editor, and no rule for the working state of such a tool and its Stop.
2. No bar for the state of a request between the toolbar and the text: running, failed, ready, old and decided.
3. No rule for a text that a request locks: how it looks, and how the person unlocks it.
4. No rule for a menu of modes that acts on the whole text or on the selection, and for how the menu says which.
5. No rule for a field that tells the service what to change, with the selected words as its scope. The product sends it with Enter and adds a line with Shift+Enter, because the instruction is a short message. "Rules" of "Keyboard model" says that a text area adds a line with Enter and sends with Cmd+Enter, so the two conflict.
6. No rule for a question before an action, in the bar and not in a dialog, such as "Fix the structure first?" with two answers.
7. No rule for Send while a request runs or a change waits.

Every back office that offers help with a text meets this: a reply, a ticket answer, a note, a description of a record.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4832`, `## Do's and Don'ts`: the proposal badge and the dashed edge, a stale proposal, and "The one spinner is the working state inside a button".
- `DESIGN.md:3042`, `### dropdown-menu`; `DESIGN.md:2225`, `### input-group`; `DESIGN.md:2844`, `### alert-dialog`.
- `architecture/web-app.md:118`: "A text area, such as a comment or a chat message, adds a line with Enter and sends with Cmd+Enter."

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Conversation.svelte:3447-3483`: Check, Checking and Stop, Rewrite and Structure at the end of the toolbar. `:3484-3525`: the bar of a check and the bar of Structure in its place. `:3526-3536`: Left out and the instruction field under the text, each a component of its own, with the chip of the selected words in the field. `:3219`: the text is read-only while a request runs. `:3413-3437`: the dialog of Send while a request runs or a change waits. `:1331-1349`: Check asks first about a text with no paragraphs.
- `admin/src/lib/RewriteMenu.svelte:1-50`: the Rewrite menu.
- `admin/src/lib/AiBar.svelte:1-164`: the bar of a check, a rewrite and an instruction.
- `admin/src/lib/StructureBar.svelte:1-143`: the question, and the bar of Structure.
- `admin/src/lib/editor/adapter.ts:41-46`: the selected words as a range of the words of the text.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

**Tools at the end of the toolbar.** The page puts its tools at the right end of the toolbar of the editor, outside the arrow order of the bar (see the proposal "missing: a rich text toolbar that stays at the top, a bar over selected text and a / menu"). Each is an `outline` button of size `sm` with an icon and a word, and a `tooltip` that says what it does, such as "Paragraphs, headings and lists, with the same words". A tool that cannot run is a `ReasonButton` with its reason, such as "Write the reply first." or a language that the service does not read.

| Moment | The tools |
|---|---|
| At rest | Check, Rewrite with a chevron, Structure |
| A request runs | The tool that runs says so, such as "Checking" or "Arranging", with the spinner inside it, `aria-disabled="true"` and `aria-busy="true"`. Stop follows it as an `outline` button with a square icon. The other tools are off with a reason, such as "Wait for the result, or press Stop." |

**The lock.** While a request runs, the text is read-only and its ink is at 75% (see the proposal "missing: a rich text field that takes a paste from Word or a web page as clean structure"). Stop ends the request and unlocks the text. A request that the person stopped shows nothing in the bar: the person knows, and the next request replaces it. An instruction that ends stopped or failed comes back into the field, so the person does not type it again.

**The bar of a request.** It stands between the toolbar and the text, with a dashed edge under it in `input`, the proposal badge that names the source, and its text in `muted-foreground`. Its first line holds the state and the actions at the end. Its second line, in `small`, says what the person can do.

| State | First line | Second line |
|---|---|---|
| Running (`role="status"`) | "Checking… you can leave, the result waits here.", and who asked and when at the end | "The text is locked until the result comes; Stop ends the check and unlocks it." |
| Failed | "The check did not finish." | "Press Check to try again." |
| Timed out | "The check took too long. Check again." | "The text is free again." |
| Ready | The counts, Take all and Leave all, as the proposal of the changes says. A rewrite ends the line with the tone of the text with every change made, such as "· Tone: warm and direct", and after a Leave "· Tone with the changes: …". | Who asked and when. |
| A rewrite or an instruction | As Ready, and a line under it: "Rewrite: Shorten · only the selected words “…”" or "Instruction: “…” · only the selected words “…”" | |
| A note of the service | | A last line with the note, such as why it changed nothing. |

The page reads the state again while a request runs, so a reload and a second window show the same bar.

**Rewrite.** A `dropdown-menu` aligned to the end of its trigger, 224 px wide. Its first row is a label that says what the rewrite acts on: "For the whole text", or "For the selected words" while the field holds a selection. Then a `separator` and the group Edit, a `separator` and the group Tone, each with a group heading. A pick sends the mode with the scope of the field, and its result shows as the result of an instruction does. Below 768 px the menu stays a dropdown, with rows of 44 px.

**The instruction field.** A row under the text, in the `input-group` of the editor, with a `border` edge on top:

- a pen icon, then the chip of the selection: a `secondary` badge of at most 256 px with the selected words on one line in quotes, cut with an ellipsis, all of them in its `title`, the words "Only the selected words:" for a screen reader, and a round cross that clears the selection, named "Clear the selection, so the instruction is for the whole text";
- a text area of one row that grows to 160 px, at most 1,000 characters, with a placeholder such as "Tell what to change…";
- `kbd` Enter from 768 px, and an `outline` icon button with an arrow up that sends, which shows the spinner while the instruction goes.

While a request runs, the field is `readonly` with `aria-disabled="true"`, its placeholder gives the reason, and the send button gives it too. The field stands in the input group, so it never takes `disabled`. The selection is a range of the words of the text, which the product sends as the scope:

```ts
/** From one place to another, each [line, offset] with the line from 0 and the offset in UTF-16 code units. */
type TextRange = { from: [number, number]; to: [number, number]; text: string };
```

STACK decides the send key of this field: Enter, as the product does, or Cmd+Enter, as "Rules" says for a text area.

**A question in the bar.** Check of a text of 300 characters or more with no empty line between two lines asks first, in the place of the bar: "Fix the structure first?", with "Fix the structure" (`outline xs`) and "Check as it is" (`ghost xs`), and the line "The text has no paragraphs. It can be arranged into paragraphs, headings and lists, and then checked." The bar asks once for the same words. Fix the structure runs Structure, and Check follows its Take, its Leave or a result with no change.

**Structure.** The bar of Structure takes the place of the bar of a check while it asks, while it says why Structure is off, and while its request runs or waits. Its result shows as "A new layout" in the proposal of the changes says: the counts, Take, Leave and the preview. A result with no change says "The structure needs no change." A taken result says "Structure taken", and a left result "Structure left as it was". Structure and Rewrite keep the blocks of the text and the span of each link and mark: a rewrite never joins two paragraphs, never turns a list into lines that start with "- ", and never moves a link over the next words.

**Send while a request runs or a change waits.** Send and Preview open an `alert-dialog` first: "Send the reply before the check is done?", with the reason, such as "2 changes wait for Take or Leave. The open changes do not go out." The cancel button is "Let it finish", and the action is "Send anyway", which stops a running request first and shows the spinner while it stops.

**The callbacks.** The page owns the service and the state, and the parts take the state and call back:

```ts
type WritingToolsProps = {
  /** The newest request, or null. */
  request: {
    kind: 'check' | 'rewrite' | 'instruction' | 'structure';
    state: 'running' | 'ready' | 'stopped' | 'failed';
    timedOut: boolean;
    instruction: string | null;
    scope: TextRange | null;
    askedBy: string;
    askedAt: string;
    note: string | null;
    tone: string | null;
  } | null;
  /** Why the tools are off, or undefined. */
  off?: string;
  /** The selection of the text that the next request is for, or null for the whole text. */
  scope: TextRange | null;
  oncheck: () => void;
  onstop: () => void;
  onrewrite: (mode: string, scope: TextRange | null) => void;
  onstructure: () => void;
  /** Sends the instruction; true when the request started, and the field then clears. */
  onask: (instruction: string, scope: TextRange | null) => Promise<boolean>;
  onclearscope: () => void;
};
```

### What the product does until a release ships it

The page puts its tools in the end slot of its toolbar. `AiBar.svelte` and `StructureBar.svelte` are the bars, `RewriteMenu.svelte` is the menu, and a component under the text is the instruction field, each built from STACK parts, with `ReasonButton` for each action that cannot run. The field sends with Enter. Structure runs today only on a text with no link, picture or format, and its bar says so with a warning icon; the owner asked for Structure on a formatted text that keeps its links, marks and pictures. A rewrite of a long pasted text does not yet keep each block and each link in every case, and the product fixes that. Each stopgap comment names the number of this pull request.
