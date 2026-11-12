### Product

rndm, v2.2.0

### Kind

conflict

### What the product found

The back office of rndm has lists that a person works one item at a time: the mail of a shared inbox, and a desk of the mail and the forms that came in. Both took the work form of the split. The owner used them, and he found the list column too narrow, and four columns side by side too many: the sidebar, the list, the item and its properties. So he picked another layout. The list takes the whole width, with one line per row. A click or Enter opens the item as a page with one scroll. Esc goes back to the list, at the same row.

Later the product docked the item beside the list again from 1024 px, as "Work form" says. From 768 to 1023 px, the item still opens as a page with the whole width, and not in the pane of 420 px over the list that "Work form" gives band 2. One more list, of entries that a person reviews one at a time, opens its item as a page at every width from 768 px. The address of the page is the path of the list and the key of the item (see the proposal "missing: the item of a list in the path of the address").

"Two forms of the split" and "Work form" give this layout no place, so it conflicts with them. "Pane" and "Item column" say that Enter opens the item "as a full page", but STACK gives that page no layout, no keys and no way back. STACK does not say:

- how a list at full width opens its item: in the place of the list, as a new entry of the history;
- where the position of the item and the steps go, such as "3 / 14" with up and down. The header of a pane holds them, and a page has no pane header;
- which keys step on the page, and which key goes back;
- how the list comes back: its scroll position, and the focus on the row of the item that was open;
- how wide the page is, and where the properties stand. In a window of 1,920 px, `ItemColumns` puts the properties at the far edge, far from the text;
- whether the properties stick while the text scrolls;
- a crumb that names a level and links nowhere, such as an inbox with no page of its own. `### breadcrumb` has only `breadcrumb-link` and `breadcrumb-page`;
- what the second click of a double click on a row does, when the page of the item takes the place of the row under the pointer.

Every back office whose people read long items meets this: a shared inbox, a list of cases, a list of requests.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:1725`, "Two forms of the split": "When a person opens each row of a list, acts on it and goes to the next row, the list takes the work form."
- `DESIGN.md:1745`, "Work form": in band 2 the item lies at 420 px over the right side of the list, only when the person opens it.
- `DESIGN.md:1925` and `:1933`, "Pane" and "Item column": "Enter opens the item as a full page", and no rule for that page.
- `DESIGN.md:1927`, "Pane header": the position of the item and the up and down buttons.
- `DESIGN.md:1943`, "Properties beside the content": the properties column by the width of the box, and no sticky position.
- `DESIGN.md:3306`, "Anatomy" of `### breadcrumb`: an item holds a `breadcrumb-link`, or a `breadcrumb-page` for the last part.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/path.ts:122-194`: `itemPage()`. The column of the item never opens, so the list takes the whole width. A row opens `<list>/<key>` as a new entry of the history. Back gives the list its scroll position and focuses the row. `:133-135`: the stopgap comment. `:196-225`: `itemBeside()`, which docks the item from 1024 px and opens it as a page below.
- `admin/src/lib/ItemPage.svelte:24-32`: the page of the item, and the stopgap comment. `:66-84`: the steps and Esc. `:92-101`: no click for 300 ms after a click opened the page. `:2-12`: the class that makes the properties of `ItemColumns` stick.
- `admin/src/lib/TopBar.svelte:47-79`: Back, the crumbs, a crumb with no link, the position and the steps. `:13-16`: the stopgap comment.
- `admin/src/app.css:36-43`: the token `--product-item-page`, 75.25rem (1,204 px).
- `admin/src/routes/(app)/mail/[[inbox]]/[[conversation]]/+page.svelte:285-294`: the page of a conversation from 768 to 1023 px, and its own screen below 768 px.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. A form of the split in `### App shell` for a list at full width whose item opens as a page, in the place of the list, as a new entry of the history. The rule says when a list takes this form and when it takes the work form. It also says whether band 2 of the work form may open the item as such a page, in place of the pane over the list.
2. The top bar of the item page: Back, then the crumbs, and on the right the position, such as "3 / 14", with the up and down steps. Below 768 px the inner screen of the item stays as it is.
3. The keys of the item page: J and Down open the next item, and K and Up the item before, in the place of the entry of the history. Esc goes back to the list. The steps and Esc do nothing while `keysOff` gives true, or while the focus is in a dialog, a menu or a list box.
4. Back: the list keeps its scroll position, and the row of the item takes the focus.
5. One scroll box for the item, at most 24 + 720 + 16 + 420 + 24 px wide, so that the properties stand right after the text. From a box of 672 px, the properties stick to the top of the scroll box. A prop of `ItemColumns` for this ends the reach into its slot.
6. A crumb with no link, for a level that has no page.
7. A short guard after a click of the pointer opens the item, so that the second click of a double click does not land on a control of the item. Enter opens the item with no guard.

### What the product does until a release ships it

`itemPage()` gives `ListSplit` an address whose column never opens, and a row goes to `<list>/<key>`. `itemBeside()` gives the work form from 1024 px and `itemPage()` below. `ItemPage` claims the top bar from 768 px with `claimPlace`, holds the item in one scroll box, and binds `next-row`, `previous-row` and `onEscape('item')`. `afterNavigate` gives the list back its scroll position and focuses the row. A class reaches into the properties slot of `ItemColumns` to make it sticky, and a `--product-` token holds the width. A crumb with no link is plain text. The item is `inert` for 300 ms after a click on a row opened it. The product marks each stopgap with the number of this pull request.
