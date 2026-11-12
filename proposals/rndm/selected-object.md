### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The rich text field of rndm holds pictures in a mail and in a comment (see the proposal "missing: a rich text field that takes a paste from Word or a web page as clean structure"). A person selects a picture to change its width or to remove it. The owner compared several forms and picked one: no frame and no square handles on the picture, one grip on the middle of its right edge, and a floating bar with the size in pixels, the widths 25, 50, 75 and 100 %, Original and Remove.

`DESIGN.md` has no rule for a selected object in rich text. STACK does not say:

- how a selected object shows, and whether it takes a frame;
- the form of a grip, its place and its target, on a computer and on a phone;
- the place of the bar of the object, its layer and its controls;
- the keys: how the focus reaches the bar, and how it goes back to the text;
- that the grip and the bar never enter the HTML of the content or its undo history.

Every product with pictures, tables or other objects in a rich text editor meets this.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:2020`, `## Elevation & Depth`: level 3, the `popover` ground with `ring-1 ring-foreground/10` and `shadow-md`, for a menu and a popover.
- `DESIGN.md:3564`, `### resizable`: the grip of a handle is 4 by 24 px on its line. This serves panes, not an object in content.
- `DESIGN.md:2045`, `## Shapes`: "The focus ring is the only thicker line." The owner picked no frame for a selected picture.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/editor/ImageOverlay.svelte:8`: the stopgap comment.
- `admin/src/lib/editor/ImageOverlay.svelte:75-86`: the grip on the middle of the right edge, with its target.
- `admin/src/lib/editor/ImageOverlay.svelte:87-152`: the bar, a `toolbar` with the size, the widths as a `toggle-group`, Original and Remove, each with a `tooltip`.
- `admin/src/lib/editor/image-resize.ts:1-11`: the rules of the overlay. `:15-16`: a width of 32 to 600 px. `:214-239`: the keys.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

A rule "Selected object" for content that a person edits:

1. A selected object takes no frame and no square handles.
2. The grip is a pill of 6 px on the middle of the side edge of the object, on the `popover` ground with the ring and the shadow of the bar. Its height follows the object, from 12 to 32 px. Its target is 26 by 40 px, and 46 by 48 px below 768 px. A drag of the grip changes the width, and one drag is one undo step.
3. The bar is a floating layer at level 3 (`popover` ground, `ring-1 ring-foreground/10`, `shadow-md`, 8 px radius) above the object, or under it where there is no room. It holds the size in `small`, `muted-foreground` and tabular figures, such as "480 × 320 px", the preset widths as a segmented `toggle-group`, the action back to the original size, and the destructive action as the last icon button. Each control has a `tooltip`, such as "Medium: 240 px, 50% of the line, at most 600 px".
4. A control that cannot act, such as Original when the object has its original size, takes `aria-disabled`, because the editor stands in an `input-group`, which dims itself for a `:disabled` control.
5. Tab from a selected object reaches the bar, at the control that holds the tab stop of its group. The arrow keys, Enter and Space work the bar. Esc hides the bar and gives the caret back to the text. Any other key hides the bar, and the text takes the key at the caret. A press on the bar keeps the focus and the caret in the text. A click outside the object, a drag in the text and a focus that leaves both the bar and the text end the selection.
6. The grip and the bar live in an overlay beside the text, never inside it. So they never enter the HTML of the content or its undo history.
7. While an object is selected, the bar over selected text hides.

### What the product does until a release ships it

`ImageOverlay.svelte` draws the grip and the bar in an overlay over the text. The bar is a `role="toolbar"` layer at level 3 with a `toggle-group`, a `ghost` button and a `ghost` icon button, and a `tooltip` on each. `image-resize.ts` places the overlay and takes the keys. The stopgap comment names the number of this pull request.
