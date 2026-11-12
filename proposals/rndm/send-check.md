### Product

rndm, v2.2.0

### Kind

conflict

### What the product found

The back office of rndm writes a reply in a rich text field, with the earlier mail quoted under the words. The owner was not sure what goes out when everything shows inside the field. He asked for the check before Send to stand in the page, in the place of the form, and to show the mail that goes out.

"Actions with a lasting effect" in `architecture/web-app.md` says that a send opens a confirmation with a summary, and that the look of the confirmation is the `alert-dialog` definition. An alert dialog is at most 384 px wide. It cannot show the text of a mail, its signature and its quote. A dialog that scrolls inside a page that scrolls makes two scrolls. STACK does not say:

- whether the confirmation of a send can stand in the place of its form, in the page;
- how that check marks that nothing went out yet;
- how it shows the mail that goes out: the HTML part as it goes out, or the plain text with the signature and a line for the quote and the pictures;
- its keys. The action of an alert dialog takes Cmd+Enter, and Esc closes the dialog. In the page, Esc must go back to the form, and must not close the item;
- what stands in its place after the send: while the mail waits to go out, and after it went.

The proposal "missing: a reply in two languages, with its send form and its language in the confirmation" asks for the rows Language and Version in the summary of a send confirmation. They stand in this check too.

Every product that sends mail from a back office meets this: a support desk, a shared inbox, a CRM that sends an offer.

### Evidence

STACK, tag v2.2.0:

- `architecture/web-app.md:129`, "Actions with a lasting effect": "The look of the confirmation is the `alert-dialog` definition."
- `DESIGN.md:2850`, "Variants" of `### alert-dialog`: at most 384 px wide from 640 px, and the summary of the facts as a grid with a 112 px label column.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/SendCheck.svelte:38-49`: the part, and the stopgap comment. `:166-169`: the band "Check, then send. Nothing has gone out yet.". `:170-173`: the summary of the facts. `:174-198`: the mail that goes out. The HTML part shows in a frame with `srcdoc` and an empty sandbox, or the plain text shows with its signature and the lines under it. `:150-163`: Esc at the level of the item, and Cmd+Enter. `:206-216`: the reason of a send that failed. `:217-233`: "Send to <address>" with its key, Back to edit with Esc, and the line of the wait.
- `admin/src/routes/(app)/mail/Conversation.svelte:3087`: the form stays mounted with `hidden` while the check shows. `:3347-3411`: the check of a reply, with its rows and the line of the quote. `:2950`: after the send, the focus moves to the line of the reply that waits. `:3599-3605`: the line after the mail went.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. A send of a mail can show its confirmation in the place of its form, in the page, in the one scroll of the page. The form stays mounted and hidden, so that an editor keeps its content and its pictures.
2. The check is a box with a `border` edge and the 8 px radius. It starts with a band in `primary`, with an arrow up and to the right: "Check, then send. Nothing has gone out yet." The check takes the focus, so a screen reader reads the band. The summary of the facts of `### alert-dialog` follows: From, To, Cc, Subject, and the facts that the send fixes.
3. Then the mail that goes out, in a box with a `border` edge, under a `default` badge "This goes out to <address>". The HTML part shows as it goes out, in a frame with `srcdoc` and an empty sandbox. Or the plain text shows, read-only, with its signature, and a line for the quote and the pictures below it, such as "Below it: Ana Turner's mail of 12 Nov, quoted."
4. The action names the recipient, such as "Send to <address>" or "Send to <address> and 2 more", and takes Cmd+Enter. "Back to edit" takes Esc. Esc goes back to the form and never closes the item.
5. When the mail waits before it goes, a line under the action says so, such as "It waits 30 s. You can undo it until then." After the send, the check goes, the reply waits in the thread with its countdown and Undo, and the focus moves to its line (see the proposal "missing: the mark of who sent each message of a mail thread"). After the mail went, one line with `role="status"` stands in its place: "Sent to <address> at 14:05. It cannot come back."
6. A send that fails keeps the check. The reason stands in it with `role="alert"`, and the check takes the focus again.

### What the product does until a release ships it

`SendCheck` takes the place of the form while it shows, and the form stays mounted with `hidden`. The page keeps its `editing` state true, so the keys of the list stay off. The check binds Esc at the level of the item. The band is `bg-primary text-primary-foreground`, and the summary is the `<dl>` of the alert dialog. The mail is a frame 60% of the window high and at least 320 px, which scrolls inside, or a read-only block of text. The product marks each stopgap with the number of this pull request.
