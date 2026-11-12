### Product

rndm, v2.2.0

### Kind

missing

### What the product found

In the back office of rndm, the list of the inbox takes the whole width from 768 to 1023 px, and a row opens its item as a page there (see the proposal "conflict: a list at full width whose row opens its item as a page"). One more list takes the whole width at every width from 768 px. The owner asked for one line per row on a computer and two lines on a phone. A row of the inbox holds the sender, the subject with the first words of the newest message, the marks with the owner and the count, and the time.

`### Lists` gives the 32 px row: the cells in a fixed order, the data columns at fixed widths, and a title that takes the rest. STACK ships no part for that row. `SplitRow` draws the row of the work form, with two or three lines. An inbox has no data columns, so at full width it needs the 32 px row with the four parts of `SplitRow`: line 1, line 2 and their ends. From 1024 px the same inbox takes the work form and `SplitRow` with three lines. So one list draws both rows from the same snippets. STACK does not say:

- the width of each part in one line: the first fact, such as the sender, the key values, which take the rest, and the two ends;
- how the one line turns into the two lines of the phone row below 768 px;
- which element is the button of the row, and that its area covers the row.

Every list at full width with no data columns meets this: an inbox, a list of cases, a list of notices.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:1875`, "Row" of `### Lists`: 32 px high, 12 px of padding on the left, 16 px on the right, a 12 px gap and a `border-faint` divider. No part draws it.
- `DESIGN.md:1877`, "Row of the work form": two or three lines of 20 px, 52 or 72 px high.
- `DESIGN.md:1933`, "Item column": `SplitRow` draws one row of the work form.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/ListRow.svelte:1-58`: the part. `:8-13`: the stopgap comment. `:35-57`: the classes of the row, one line from 768 px and two lines below. `:41-51`: line 1 is the button of the row, and its area covers the row.
- `admin/src/routes/(app)/mail/[[inbox]]/[[conversation]]/+page.svelte:337-352`: `SplitRow` with three lines from 1024 px, and `ListRow` below, with the same snippets.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. A part for the 32 px row, such as `ListRow`, or a prop of `SplitRow` that puts its lines in one line from 768 px. It takes the snippets of `SplitRow`: `line1`, `end1`, `line2` and `end2`.
2. From 768 px, the row is one line of 32 px. Line 1 takes a fixed width, such as 192 px, and line 2 takes the rest of the width. The end of line 2 follows, and the end of line 1 comes last, in a fixed width, such as 80 px, aligned to the end. Each part ends in an ellipsis. The ends take `small`, `muted-foreground` and tabular figures, so that the times of the rows align.
3. Below 768 px, the phone row of two lines, 52 px high, as `SplitRow` draws it.
4. Line 1 is the button that opens the item, and its area covers the row. The row keeps the padding, the divider, the hover, the focus ring and the states of a row.

### What the product does until a release ships it

`ListRow` draws the row inside a `ListSplit` with an address. From 768 px, its two blocks take `display: contents`, so the four parts stand in one line: `h-8 pl-3 pr-4 gap-3`, line 1 in `w-48`, line 2 in `flex-1`, and the end of line 1 in `w-20`, aligned to the end. Below 768 px the row is `h-13` with two lines. A click calls `show` of the item context. The inbox draws `SplitRow` from 1024 px and `ListRow` below. The product marks each stopgap with the number of this pull request.
