### Product

rndm, v2.2.0

### Kind

missing

### What the product found

"Band 2" in `### Width bands` says: "The properties panel becomes a row of property values under the title of the item." "Properties beside the content" in `### Detail pane` says the same for the item column in band 2. `ItemColumns` lets a page that shows the properties in another form, "such as the row of values of band 2", pass no properties. STACK has no part that draws that row.

rndm shows four kinds of item with one wide column and no properties column: a conversation, a form that came in, a lead and a prepared mail. Each shows its facts in one row under its title, at every width. So the product built the row itself and decided these points, which STACK does not give:

- the label and the value of a fact, their type step and their roles;
- the edge between two facts, and where a line starts when the row wraps;
- a long value, such as a legal line: it must not be cut with no way to read it all;
- the semantics for a screen reader;
- the look of a value that is a link or an action, which "Property states" gives only for the panel.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:1737`, "Band 2" in `### Width bands`.
- `DESIGN.md:1943`, "Properties beside the content" in `### Detail pane`: "In band 2 the column lies over the list at 420 px. There its properties panel is a row of values under the title, as band 2 says."
- `preview/src/lib/stack/ItemColumns.svelte:29`: "a page that shows the properties in another form, such as the row of values of band 2, passes no properties".

The admin of rndm, at commit 3b15415:

- `admin/src/lib/PropertyStrip.svelte:1-43`: the part and its stopgap comment (`:20`).
- The four pages that use it: `admin/src/routes/(app)/mail/Conversation.svelte:3770`, `admin/src/routes/(app)/desk/FormItem.svelte:909`, `admin/src/routes/(app)/leads/Lead.svelte:558` and `admin/src/routes/(app)/outreach/Outreach.svelte:396`.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

A part for the row of property values, used in band 2 by the item column and the pane, and at every width by an item with no properties column:

1. The row is a `<section>` with the name of the properties, such as "Details", and a `<dl>` in it. A screen reader reads the facts in order, as terms and values.
2. Each fact is a label in `small` and `muted-foreground` (`<dt>`), with its value beside it in `small` (`<dd>`), 6 px apart, in a box at least 30 px high.
3. A `border` edge stands between two facts, with 10 px of padding on each side of it. The row wraps, and a fact that starts a line has no edge on its left.
4. A wide fact, such as a long legal line, takes a line of its own, and its value wraps. So no value is cut with no way to read it all. The fact after a wide fact starts a new line.
5. A `border` edge stands under the row, 8 px under the facts.
6. The values follow "Properties panel" and "Property states" of `### Detail pane`: a value that the system sets is plain text, and a link or an action is a `button` of size `xs`.

The part takes the facts as data, and the page gives each value as a snippet:

```svelte
<script lang="ts" module>
  import type { Snippet } from 'svelte';
  /** One fact: its label, its value, and whether the value takes a line of its own and wraps. */
  export type StripItem = { label: string; value: Snippet; wide?: boolean };
</script>

<script lang="ts">
  import { cn } from '#lib/utils.js';
  let { label, items, class: className }: { label: string; items: readonly StripItem[]; class?: string } = $props();
  /** A fact that starts a line has no edge on its left: the first fact, a wide fact, and the fact after a wide one. */
  const starts = (i: number) => i === 0 || items[i].wide || items[i - 1].wide;
</script>

<section aria-label={label} class={className}>
  <dl class="flex flex-wrap items-center gap-y-1 border-b border-border pb-2">
    {#each items as item, i (item.label)}
      <div class={cn('flex min-h-7.5 min-w-0 items-center gap-1.5', starts(i) ? 'pr-2.5' : 'border-l border-border px-2.5', item.wide && 'basis-full items-start py-1.5')}>
        <dt class="shrink-0 text-xs text-muted-foreground">{item.label}</dt>
        <dd class={cn('flex min-w-0 items-center gap-1.5 text-xs', item.wide && 'block wrap-break-word')}>{@render item.value()}</dd>
      </div>
    {/each}
  </dl>
</section>
```

A page uses it so:

```svelte
<PropertyStrip label="Details" items={[
  { label: 'Owner', value: ownerCell },
  { label: 'Next step', value: stepCell },
  { label: 'Value', value: valueCell },
  { label: 'Contract', value: contractCell, wide: true }
]} />
```

Below 768 px the row keeps its form, and a value that is a button takes the 44 px target of `button-phone`.

### What the product does until a release ships it

`PropertyStrip.svelte` draws the row as above, with `cn` from the utilities of STACK and the tokens of `DESIGN.md` only. Its stopgap comment names the number of this pull request.
