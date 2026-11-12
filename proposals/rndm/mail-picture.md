### Product

rndm, v2.2.0

### Kind

missing

### What the product found

A client sent the back office of rndm a mail with a photo, from Gmail. Its plain text part holds the word `[image: photo.jpg]` where the HTML part shows the photo, and the photo comes as a file of the mail. `MailMessage` showed the word as text and the file as a card with an image icon. A click on the card saved the file. The owner asked to see the picture, and to open it large and not download it.

`### mail-message` shows each file as an `attachment` of size `sm` "with its name, its size and a trigger that opens the file", from the host of "Content that the product did not write". `MailMessage` draws the media of a picture as an icon. `### attachment` has `Attachment.Media variant="image"`, and `MailMessage` does not use it. STACK does not say:

- whether a picture of a mail shows as a picture, in its card or under the message;
- what the trigger of a picture opens: a large view in the page, a tab, or a download;
- whether the word `[image: NAME]` of the text shows the picture of that file in its place, and how the n-th word finds its file when two files share a name;
- which types count as a picture. SVG can hold a script, so a product shows only raster types, such as PNG, JPEG, GIF and WebP;
- the most bytes and the most pixels of a picture that the page shows, so that a decompression bomb never reaches the decoder of the browser;
- what a picture shows when it does not load, and when the product refuses it;
- what a product does while it has no host of its own for content that it did not write.

Every product that shows mail from outside meets this: a photo of a document, a screenshot of an error, a scan of a form.

This proposal also names a deviation. The admin of rndm has no host for content that it did not write yet. So it loads a picture from its own origin, and that breaks two rules:

- `DESIGN.md:4640`, "Variants" of `### mail-message`: "A file that came in is content that the product did not write too, so it opens from the host of that content."
- `architecture/web-app.md:259`: an image that a person uploaded comes from the host of "Content that the product did not write", never from the origin of the app.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4638`, "Anatomy" of `### mail-message`: the body "is the plain text part of the mail as running text", and the files are `attachment` parts of size `sm`.
- `DESIGN.md:4526`, "Variants" of `### attachment`: "`Attachment.Media variant="image"` shows a picture."
- `preview/src/lib/stack/MailMessage.svelte:7`: `MailFile` holds `image?: boolean`, which only picks the icon. `:199-200`: each paragraph as a `<p>`, with no place for a picture. `:222-223`: the trigger "Open {name}", and the media as `ImageIcon`.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Message.svelte:311-332`: the pictures under the message. Each is a vertical `attachment` with the whole picture in its media, its name and its size, or the error state with "Did not load". `:107-108`: which files show as pictures, and which stay cards. `:61-71`: the stopgap comment.
- `admin/src/routes/(app)/mail/Thread.svelte:377-402`: the `dialog` with the picture, its name, its size, Try again and Download. `:269-284`: a picture that did not load, and a refused picture as a download. `:242-253`: the stopgap comment, which names both rules.
- `admin/src/lib/mail.ts:20-27`: the four types and the 10 MiB. `:176-178`: the address that shows a picture.
- `admin/vite.config.ts:67`: `img-src 'self' data:`.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. `MailFile` takes the address that shows a picture, such as `picture?: string`, apart from `image`, which only picks the icon.
2. The picture of such a file shows whole in `Attachment.Media variant="image"` (`object-contain`), about 160 px on its long side, with its name and its size. Its trigger opens it large: a `dialog` with the picture at most as large as the window, its name, its size and Download in its foot. Every other file opens as today.
3. A picture that did not load takes the error state of `### attachment`, with an icon in its media and "Did not load" in its description, and the dialog loads it again. A picture that the product refuses becomes a file card again, and its trigger downloads it.
4. A sentence in "Anatomy" of `### mail-message`. Gmail and other mail apps write a word `[image: NAME]` in the plain text for a picture of the HTML part. That word shows the picture of that file in its place, at most 320 px high, as a button that opens it large. The n-th word of a name takes the n-th picture of that name, in the order of the parts. A word with no such file stays text.
5. A rule on the types and the limits. Only raster types that a browser decodes and never runs show as a picture, such as PNG, JPEG, GIF and WebP. A picture shows only up to a limit in bytes, and up to a limit in the pixels that its header declares. SVG, every other type and a picture past a limit stay a file.

### What the product does until a release ships it

Each file of PNG, JPEG, GIF or WebP up to 10 MiB shows under the message as a vertical `attachment`, with the picture in its media. A click opens it in a `dialog` at most 640 px wide, with the picture at most 70% of the window high, and its name, its size and Download in its foot. The picture loads lazily, from the origin of the admin. A picture that the product refuses shows as the card of `MailMessage` again, and a click downloads it. The word `[image: NAME]` stays text. The product marks each stopgap with the number of this pull request, and the comment names both rules that the stopgap breaks.
