### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The service of rndm proposes changes to a text that a person writes, such as a reply to a mail: a word with a spelling error, a missing colon, a shorter sentence. The person decides each change. The proposals stand in the text itself, so the person reads each one in its place, and keeps writing while some wait.

STACK has the parts around this, and no part for it:

- `## Do's and Don'ts` marks content that no person has confirmed yet with a dashed edge in `input` and a badge, and a stale proposal with a warning icon, an accept action that is off with its reason, and a refresh.
- `### diff` shows the change between two versions of a text. It is read-only, and its words are not the text that a person edits.
- `### sonner` gives a toast with Undo 10000 ms.

So STACK does not say:

1. how a proposed change shows inside a text that the person can still edit, and how its marks stay out of the HTML, the words and the undo history of that text;
2. where the reason and the actions of each change stand, and how a person takes or leaves one change, or all of them;
3. when a change turns old after an edit by hand, and what stays possible then;
4. how long Undo of a decision lasts, and how Undo finds the words again after the person typed elsewhere;
5. where the changes that a person left go, so that the next proposal does not bring them again, and how the person takes one after all;
6. how a proposal that changes the layout of the text, such as new paragraphs, headings and lists with the same words, shows before the person takes it.

Every product that proposes edits to a text meets this: a check of spelling and grammar, a review by a colleague, a rewrite, a translation that a person corrects.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4832`, `## Do's and Don'ts`: the mark of content that no person confirmed, and of a stale proposal.
- `DESIGN.md:2414`, `### diff`: the marks of an added word (`bg-diff-added/30 underline`) and a removed word (`bg-diff-removed/30 line-through`), and the words "inserted" and "deleted" for a screen reader.
- `DESIGN.md:4320`, `### sonner`: "give a toast with Undo 10000 ms".
- `DESIGN.md:2225`, `### input-group`: a disabled control dims the whole group.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/ChangeRow.svelte:1-65`: the row of one change, with Take and Leave, and its old state.
- `admin/src/lib/editor/squire.ts:141-149`: the marks of a change in the text, and where its row stands. `:660-710`: the marks and the place of each row. `:719`: the marks come back after an undo or a load.
- `admin/src/lib/editor/adapter.ts:179-203`: what the editor gives for the changes: show them, make them as one undo step, find them again by their words.
- `admin/src/lib/AiBar.svelte:80-164`: the bar with the counts, Take all and Leave all, the old state and the decided state.
- `admin/src/lib/LeftOut.svelte:1-58`: the left-out changes, with Take after all.
- `admin/src/lib/ChangeText.svelte:1-74`: the same changes in a plain text that no editor holds.
- `admin/src/lib/StructurePreview.svelte:1-37`: the preview of a new layout of the text.
- `admin/src/routes/(app)/mail/Conversation.svelte:1653-1665`: the toast of a decision, with Undo for 30 s.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

**The data.** The product gives each proposed change in this form:

```ts
type ProposedChange = {
  /** From 1, in the order of the text. */
  n: number;
  /** The line of the words of the text, from 0. */
  block: number;
  /** The words that go. They stand exactly once in their line. */
  old: string;
  /** The words that come; '' removes the old words. */
  new: string;
  /** The name of the rule that the change follows, such as "Grammar". The product names its rules. */
  rule: string;
  /** Why, in one sentence. */
  reason: string;
  state: 'open' | 'taken' | 'left' | 'replaced';
};
```

**A change in the text.** The old words take the mark of a removed word of `### diff`, a `<del>` with `bg-diff-removed/30 line-through`. The new words follow as an `<ins>` with `bg-diff-added/30 underline underline-offset-2`. A box of 16 px with the number of the change follows them, with `aria-hidden="true"`. The words "deleted " and "inserted " that do not show come before the marks, as in a `diff` of text. The marks are no part of the content: the HTML, the words, a copy and each undo step of the editor leave them out. An undo or a load shows them again where their words still stand.

```html
The registered address <span class="sr-only">deleted </span><del class="rounded-xs bg-diff-removed/30 px-0.5 line-through">cost</del><span class="sr-only">inserted </span><ins class="rounded-xs bg-diff-added/30 px-0.5 underline underline-offset-2">costs</ins><span aria-hidden="true" class="ml-0.5 inline-grid h-4 min-w-4 place-items-center rounded-sm border px-1 align-middle text-2xs font-semibold tabular-nums select-none">3</span> 40 EUR per month.
```

**The row of a change.** A row stands under the paragraph of each change, after the rows of the changes before it, and inside the list item or the table cell of a change there. It is content that no person confirmed, so it takes a dashed edge. It holds the number, the rule at 600, the reason in `small`, Take as an `outline` button of size `xs` and Leave as a `ghost` button of size `xs`. It has `role="group"` and the name "Change 3", and Take and Leave name the change too, such as "Take change 3". A key on a button of the row is a key of that button and never reaches the editor, which would split the line on Enter. The row sits on the paper of the content, so it takes the ink of the paper and not the theme.

```svelte
<div role="group" aria-label="Change {change.n}" class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-dashed border-mail-ink/30 py-1 pr-1 pl-2 text-xs text-mail-ink/70">
  <span aria-hidden="true" class="inline-grid h-4 min-w-4 place-items-center rounded-sm border border-mail-ink/15 bg-mail-ink/5 px-1 text-2xs font-semibold text-mail-ink tabular-nums">{change.n}</span>
  {#if stale}
    <TriangleAlertIcon aria-hidden="true" class="size-3.5 shrink-0 text-mail-ink" />
    <span class="font-semibold whitespace-nowrap text-mail-ink">Old ·</span>
  {/if}
  <span class="font-semibold whitespace-nowrap text-mail-ink">{change.rule}</span>
  <span class="min-w-0 flex-1 wrap-break-word">{change.reason}</span>
  <span class="flex shrink-0 items-center gap-1">
    <ReasonButton variant="outline" size="xs" aria-label="Take change {change.n}" reason={stale ? staleReason : undefined} describedby={stale ? `${uid}-why` : undefined} onclick={ontake}><CheckIcon data-icon="inline-start" />Take</ReasonButton>
    <Button variant="ghost" size="xs" aria-label="Leave change {change.n}" onclick={onleave}><XIcon data-icon="inline-start" />Leave</Button>
  </span>
</div>
{#if stale}<p id="{uid}-why" class="mt-1 ml-2 text-xs text-mail-ink/70">{staleReason}</p>{/if}
```

**The bar of the changes.** A bar between the toolbar and the text holds the state of all changes, with a dashed edge under it in `input`, the proposal badge that names the source, and its text in `muted-foreground`:

| State | First line | Second line |
|---|---|---|
| Changes wait | "4 changes · grammar 1, spelling 2, colon 1", then Take all (`outline xs`) and Leave all (`ghost xs`) at the end | Who asked and when, and "Take or leave each change under its paragraph." |
| An open change is old | A warning icon, "Old check: the text changed at 09:14, after it. · 3 changes wait, 1 old", then the refresh, such as Check again, and Leave all. Take all hides. | "Take is off for each change whose words an edit changed." |
| No change | "No changes" | Who asked and when. |
| Each change is decided | "Each change is decided · 3 taken, 1 left" | Who asked and when. |

The bar stands in the `input-group` of the field, so no button of the bar or of a row takes `disabled`. A button that cannot act is a `ReasonButton` with `aria-disabled` and its reason.

**Take and Leave.** Take makes the change in the text as one undo step of the editor, and the product saves the text. Take all makes every open change in one undo step, and it hides while one change is old. Leave takes the marks out, and the words stay as the person wrote them.

**Old.** A change turns old when an edit by hand changes its words, or when its words then stand more than once in the text. An edit elsewhere keeps a change as it is. An old change shows the warning icon and "Old ·" in its row, its marks at 50%, and Take off with its reason, both as the `tooltip` and as a line under the row. Leave stays.

**Undo.** Each Take and each Leave shows a toast with Undo, such as "Change 3 taken." or "4 changes left out.". The product gives this toast 30 s, as it gives the toast after a discarded draft, against the 10000 ms of `### sonner`. Undo of a Take finds the new words by up to 24 characters of their line on each side, so an edit elsewhere keeps the Undo. A line that the Take emptied comes back as a line of its own. When the words changed, Undo says why it cannot run, such as "The text changed after the Take, so Undo is no longer possible." Undo gives the change back for a decision. A new proposal ends the Undo of each decision before it.

**Left out.** Under the text, a `collapsible` "Left out (2) · no later check proposes these again" lists the changes that the person left, newest first. A row shows the change as a word change of `### diff`, the rule and the reason, "Left by" with the name and the time in `faint-foreground`, and Take after all as a `ghost` button of size `xs`. Take after all is off with its reason while the words of the change do not stand exactly once in the text, or while a proposal is on its way.

**A text that no editor holds.** A plain text, such as the text part of a prepared mail, shows the same marks in each line and the same row under it, on the same paper. A change whose words do not stand exactly once in its line shows only its row, with Take off.

**A new layout.** A proposal can change only the layout of the text: the same words in paragraphs, headings and lists. The bar then shows "New structure · 3 paragraphs, 1 heading, 2 lists" with Take and Leave, and a preview of the text as it will read after Take: a box with a dashed edge in `input`, the proposal badge, the text in `muted-foreground`, at most 320 px high, which scrolls. A heading that the proposal added takes a small badge "New". The preview binds each text as text, never as HTML. After an edit of the words, the proposal is old: Take is off with the reason "Take is off, because the words changed. An Enter or a new line does not change the words.", and the refresh asks again. Take replaces the words as one undo step and shows a toast with Undo.

**What the editor gives.** A field that shows proposed changes gives the page these calls, in the form that the product uses:

```ts
type ShownChange = { n: number; block: number; old: string; new: string; stale?: boolean };
interface ChangesInText {
  /** Shows the changes in the text, and gives the element under the paragraph of each one, where its row goes. */
  showChanges(changes: readonly ShownChange[]): Map<number, HTMLElement>;
  /** The HTML and the words with the changes `ns` made; the text stays as it is. */
  madeWith(ns: readonly number[]): { html: string; words: string };
  /** Makes the changes `ns` in the text, as one undo step. */
  replace(ns: readonly number[]): void;
  /** The line where each change stands now, while its words stand as the proposal left them. */
  changeBlocks(): Map<number, number>;
}
```

### What the product does until a release ships it

`ChangeRow.svelte`, `AiBar.svelte`, `LeftOut.svelte`, `ChangeText.svelte` and `StructurePreview.svelte` build the parts from `badge`, `button`, `ReasonButton`, `collapsible` and the marks of `### diff`. The editor draws the marks and places the rows through its own interface. The toast of a decision is `undoToast` of `behaviour/undo` with a duration of 30 s. Each stopgap comment names the number of this pull request.
