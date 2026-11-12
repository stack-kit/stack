### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The rich text toolbar of rndm has a Text colour tool and a Highlight tool (see the proposal "missing: a rich text toolbar that stays at the top, a bar over selected text and a / menu"). A colour that a person writes into a mail is content. It goes out as a hex value in a style attribute, and it keeps that value in every client, in light and in dark mode. So it cannot be a role of STACK, whose value changes with the theme and the mode. A hex value is also the one colour form that Gmail keeps: Gmail drops the whole style attribute for an `rgb()` with spaces and for `oklch()` (caniemail, `css-rgb` and `css-modern-color`).

`### radio-group` has a colour picker only for the eight `tag-<color>` roles of a label. STACK does not say:

- which set of content colours a picker offers, and which contrast each colour must pass;
- how a person types a hex value, or picks any other colour;
- how a person goes back to the default colour;
- how the picker shows the contrast of a colour that the person typed;
- which edge a disc takes, when its colour can match the ground;
- how the check follows the colour at the selection, and what the arrow keys do.

Every product with a rich text editor meets this: a mail, a note and a document.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:2703`, `### radio-group`: the colour picker of a label, one disc for each `tag-<color>` role, 16 px, in a target of 24 px (Variants and Sizes).
- `DESIGN.md:1590`: the `tag-<color>` roles, "Only as a dot, with the name in words".

The admin of rndm, at commit 3b15415:

- `admin/src/lib/editor/ColorPicker.svelte:8`: the stopgap comment. `:53-83`: the discs in 8 columns, 6 below 768 px, and the binding whose setter does nothing (`:57`). `:107`: the colour input of the browser. `:117-122`: the contrast line.
- `admin/src/lib/editor/colors.ts:1-12`: why a mail colour is a hex value. `:19` and `:38`: the 16 text colours and the 16 highlight colours. `:77-78`: the ink and the paper.
- The contrast of the set, by the WCAG formula over `colors.ts`: each text colour reads at 4.83:1 to 21:1 on white, and the ink `#171717` reads at 12.02:1 to 16.69:1 on each highlight.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

A content variant of the colour picker in `### radio-group`, for a colour that a person writes into content:

1. A fixed set of 16 discs in two rows of eight, and six columns below 768 px. Each disc takes its colour as a style, because the colour is content and not a role, and a `foreground/10` inset edge, because a content colour can match the ground. Each disc has the name of its colour as its accessible name.
2. The set holds hex values that pass 4.5:1: a text colour on the paper of the content, and the ink of the content on a highlight.
3. A hex field in an `input-group` with Apply. It takes 3 or 6 digits, with or without "#".
4. The colour input of the browser for any other colour.
5. A `ghost` button back to the default colour, such as "Remove colour".
6. A line in `small` with the contrast ratio of the colour in the field, such as "On white: 3.2:1, under 4.5:1 and hard to read", with a `warning` icon under 4.5:1.
7. The value flows one way: the colour at the selection checks a disc. The arrow keys move the focus between the discs and check none. A click, Enter or Space applies the colour of the disc.
8. The picker opens in a `popover` at the tool that opened it: a button of the toolbar, a menu, More or the bar over selected text.

The product gives the picker its set and its paper:

```ts
type Swatch = { hex: string; name: string };
type ContentColourPickerProps = {
  kind: 'text' | 'highlight';
  /** The colour at the selection as "#rrggbb", or null with none. */
  value: string | null;
  swatches: readonly Swatch[];
  /** The ground and the ink of the content, for the contrast line. */
  paper: string;
  ink: string;
  /** A colour as "#rrggbb", or null to remove the colour. */
  onpick: (hex: string | null) => void;
};
```

### What the product does until a release ships it

`ColorPicker.svelte` takes the discs of the label colour picker with the hex set of `colors.ts`, an `input-group` for the field, and the colour input of the browser. The radio group takes a binding whose setter does nothing, so an arrow key checks no disc. The editor writes only a value that matches `#rrggbb` into a style, and ignores any other value. The stopgap comment names the number of this pull request.
