### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The owner of rndm opened a newsletter and a Gmail mail with a photo in the back office. The owner asked to see each mail as its sender designed it, in its place in the thread. Nearly every mail that a back office gets has a plain text part and an HTML part: a newsletter, an invoice of a service, and each mail from Gmail and Outlook.

`### mail-message` says that the body "is the plain text part of the mail as running text". It says that "a mail with only an HTML part" shows that part in the frame of "Content that the product did not write". It says nothing of a mail with both parts, and `MailMessage` has no place for a frame: its body takes paragraphs only. So every product that shows mail from outside must decide:

- which part opens first when a mail has both;
- where the frame stands in the message, and what happens to the body, the quote, the translation box and the files while it shows;
- the words of the badge, and the switch between the frame and the text;
- what a folded message shows;
- what the message shows when the frame does not load, and when the mail is too large to clean;
- whether a picture that the HTML shows by `cid:` repeats under the message, because it is also a file of the mail;
- how a reply that the product sent shows in the frame, because a person of the team wrote it and checked it;
- what the frame says about remote pictures, which the product does not load, and how a person loads them.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4638`, "Anatomy" of `### mail-message`: the body "is the plain text part of the mail as running text".
- `DESIGN.md:4640`, "Variants": "HTML: a mail with only an HTML part never shows that part as HTML in the page. It shows it in the frame of "Content that the product did not write"".
- `architecture/web-app.md:263-270`: the frame of "Content that the product did not write", and the mark of its source outside the frame.
- `preview/src/lib/stack/MailMessage.svelte:199-200`: the body takes paragraphs only.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Message.svelte:238-285`: the frame at the place of the body, with the mark outside it. A mail that came in has the dashed edge in `input`, the badge "Designed by the sender" and Show as text. A reply that the product sent has a solid `border` edge and the badge "As it went out". `:256-279`: the line about remote pictures, and the `alert` with Load pictures. `:286-296`: Show as designed, and the lines of a frame that did not load and of a mail that is too large. `:297-310`: the files after the frame. `:99-108`: when the frame takes the place of the body, and which files stay cards. `:75-88`: the stopgap comment.
- `admin/src/routes/(app)/mail/MailFrame.svelte:106-120`: the `skeleton` while the frame loads, and the frame with its sandbox and `scheme-light`.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

In "Variants" of `### mail-message`, in place of the sentence on HTML:

HTML: a mail with an HTML part shows that part as its sender designed it, in the frame of "Content that the product did not write" in `architecture/web-app.md`, at the place of the body. A mail with a plain text part too opens in the frame as well. The mark stands outside the frame: the dashed edge in `input`, the 8 px radius, the badge "Designed by the sender", and beside it a `ghost` button of size `xs`, "Show as text". The text view has "Show as designed" at the same place. A reply that the product sent has a solid `border` edge and the badge "As it went out", because a person of the team checked it before the send. While the frame shows, the body and the quote do not show, and the translation box and the files follow the frame. A folded message keeps the first words of the text, and its frame mounts only when it opens. The frame keeps a white ground and the light scheme in both modes, because a designed mail expects them. While the frame loads, its box shows a `skeleton`. When the frame cannot show the mail, the message shows the text, and a line in `small` and `muted-foreground` says why, such as "This mail did not load as designed." with "Show as designed", or "This mail is too large to show as designed.". A picture that the frame shows by its Content-ID stays in the files and does not repeat as a preview. A remote picture never loads by itself, and a line over the frame says so: "Remote pictures are not loaded, so the sender does not learn that you opened this mail." Where the product keeps copies of the remote pictures, an `alert` with `role="status"` takes the place of that line: "Pictures are off for this mail. Loading them tells the sender that this address gets mail.", with an `outline` button of size `xs`, Load pictures.

In the part: `MailMessage` takes a snippet that takes the place of the body paragraphs, so that a product puts its frame there, and the quote, the translation and the files keep their order after it.

### What the product does until a release ships it

The frame stands after `MailMessage`, which gets no body and no files while the frame shows. The files follow the frame as cards of `### attachment` of size `sm`, as `MailMessage` draws them, and the previews of the pictures follow the files. In the text view, `MailMessage` draws the files, and "Show as designed" and the line of a frame that did not load follow them. The product marks each stopgap with the number of this pull request.
