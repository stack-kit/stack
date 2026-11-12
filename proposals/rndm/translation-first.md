### Product

rndm, v2.2.0

### Kind

conflict

### What the product found

"Translation" in `### mail-message` puts a translation after the body, in a box with a dashed edge and a badge. That order serves a reader who reads the language of the message and checks the translation. In rndm the team reads its own languages only. A message in another language, such as German or Italian, comes with a translation from the service of the product, and the person reads the translation and acts on it. The original is a check, not the text that the person reads.

With the order of STACK, such a message shows a long body that the person cannot read, and the translation only after it. The person scrolls past the original in each message of the thread.

So the owner decided: a message in a language that the team does not read shows the translation first, and the original one click away under "Show the original". `MailMessage` has no such order and no such button, so the product works around the part.

This is general for a back office: a support desk, an inbox of orders and a desk for partners abroad all read mail in languages that the team does not read.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4640`, Variants of `### mail-message`: "Translation: a translation ... follows the body in a box (`mail-message-translation`)."
- `preview/src/lib/stack/MailMessage.svelte:27-28`: the member `translation` of `Mail`. `:212-215`: the box after the body.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Message.svelte:97-98`: the state of "Show the original". `:109-129`: the stopgap comment and the mail that the page gives `MailMessage`: no body, no quote and no files, and the translation as its translation, so the box stands first under the header. `:206-215`: a class hides the empty body. `:220-237`: "Show the original" and the original under it, in the `lang` and the `dir` of the mail.

No screenshot goes with this proposal.

### Proposed rule or change

Text for "Translation" in Variants of `### mail-message`, after the sentence about the box:

"When the person does not read the language of the message, the product sets `translationFirst`. The translation box then stands first, 12 px under the header, and the body and the quote fold behind a `ghost` button of size `xs` in `muted-foreground`, 'Show the original'. The button has `aria-expanded`, and 'Hide the original' folds the original again. The original opens under the button, in the `lang` and the `dir` of the mail, and an HTML part mounts its frame only then. The files follow, as after the body. A folded line of the message shows the first words of the translation. In print, the button does not show, and the original prints only while it is open."

A new optional member of `Mail`, such as `translationFirst?: boolean`. A new optional member is level minor, as the change log of v2.2.0 says.

### What the product does until a release ships it

`Message.svelte` gives `MailMessage` a mail with no body, no quote and no files, and the translation as its `translation`, so the box stands first. A class on the article hides the empty body. A `ghost` button of size `xs`, "Show the original", follows the box, and the original, the HTML frame of a designed mail and the files follow it. A folded message gets the translation as its body, so its line shows the first translated words. The stopgap comment names the number of this pull request.
