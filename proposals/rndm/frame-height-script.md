### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The back office of rndm shows each designed mail in the frame of "Content that the product did not write", in a thread of `### mail-message` (see the proposal "missing: the HTML part of a mail as its sender designed it, in the frame at the place of the body"). A mail has any height, from one line to a newsletter of 3,000 px. A frame of a fixed height either cuts the mail behind a scroll bar inside the thread, or leaves a large empty box. The app cannot measure the content. The sandbox has no `allow-same-origin`, so the content has an opaque origin, and the app reads nothing of it.

STACK says that the sandbox has "only the rights that the content needs", and that the policy of the host "allows the files of the content and the STACK files only". A mail needs no script. To follow its height, the frame needs one script of the product in the page. STACK does not say whether that is allowed, how the app checks what the script sends, and what the app does when the script sends nothing.

The product measured this in headless Chromium:

- A page with a block of `100vh` grows the frame by 54 px per message, 80 messages in 3 s and on, because the height of the frame is the viewport of the page. `html, body { height: 100% }` grows it by 62 px per step.
- With `height:auto!important;min-height:0!important;max-height:none!important` in the style attributes of `<html>` and `<body>`, and no viewport unit in the content, the page sends one message and stays.
- A script that the policy of the host allows by its hash runs. An inline script and an `onerror` handler of the content do not. The script reaches neither the page of the app nor its cookies nor its storage (`SecurityError` for each), and `self.origin` is "null".
- A mail with the height loop sent one message and stayed at 122 px for 2 s. A newsletter of 1,381 px got a frame of 1,381 px with no inner scroll bar. A mail with each form of a script got the app no message but those of the script of the product. A message that the window of the app posted to itself changed nothing.

The check before a send shows the HTML part of a reply in a frame with `srcdoc` and an empty sandbox (see the proposal "conflict: the check before a mail goes out, in the page in place of an alert dialog"). That frame runs no script, so it cannot follow its height. It is 60% of the window high, at least 320 px, and it scrolls inside.

### Evidence

STACK, tag v2.2.0:

- `architecture/web-app.md:265-270`, "Content that the product did not write": the sandbox with "only the rights that the content needs", the host, its policy, and the mark outside the frame.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/MailFrame.svelte:31-34`: the stopgap comment. `:36-44`: the cap of 25,000 px, the wait of 15 s at most for the first message, and the wait of 2 s after the load of the frame. `:80-95`: the checks on each message. `:106-120`: the `skeleton` while the frame loads, and the frame with `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`, `referrerpolicy="no-referrer"` and the height that the page posts.
- `admin/src/routes/(app)/mail/Message.svelte:286-296`: the text of the mail, with the line "This mail did not load as designed.", when no message comes in time.
- `admin/src/lib/SendCheck.svelte:186`: the frame of the check before a send, with an empty sandbox and a fixed height.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

In "Content that the product did not write" of `architecture/web-app.md`:

A frame whose height follows its content runs one script of the product in the page, with `allow-scripts` in the sandbox. The policy of the host allows that script by its hash, and no other script. The script measures the bottom of the content at load and on each change of its size, and it posts the height to the app only when the height changes. It posts with the target origin `'*'`, because the page has an opaque origin. The app takes a message only when its `source` is the window of that frame and its `origin` is "null". It takes only a message of the form that the script writes, with a finite height of at least 0, and it caps the height, such as at 25,000 px. A taller page scrolls inside the frame. The page holds the heights of `<html>` and `<body>` as `!important` declarations in their style attributes, and the content keeps no viewport unit, or the frame grows with no end. While the frame loads, its box shows a `skeleton`. When the page sends no message in time, such as 2 s after its load, the app shows the content in another form, or a line that says that it did not load.

The product writes the message in this form:

```ts
/** The one message that the script of the frame posts to the app. */
type FrameMessage = {
  rndm: 'frame';
  /** How the page shows the mail: as designed, as text, or too large to clean. */
  state: 'designed' | 'text' | 'too-large';
  /** The bottom of the content, in CSS px. */
  height: number;
  /** The count of the remote resources that the page does not load. */
  remote: number;
};
```

STACK could also say how a frame with no script, such as a frame with `srcdoc` and an empty sandbox, gets a height that follows its content.

### What the product does until a release ships it

The script and the checks above, with a `skeleton` while the frame loads. The app waits 15 s at most for the first message, and 2 s after the load of the frame. Then the message shows the plain text of the mail, with the line "This mail did not load as designed." and Show as designed. The product marks each stopgap with the number of this pull request.
