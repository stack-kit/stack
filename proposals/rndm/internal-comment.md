### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The back office of rndm keeps comments that only the team sees: on a form that came in, and in the thread of a mail conversation. In the thread, a comment stands between the mails that go out and the mails that come in. The owner asked that a person sees at once what stays inside the team and what goes out. He asked for a small tab "Internal" with a lock, on a white block, and no coloured ground. On a form that came in, the comments have their own section, oldest first, and the changes between two comments stand between them in small type. A comment is rich text (see the proposal "missing: a rich text field that takes a paste from Word or a web page as clean structure"), and its author can edit it.

STACK does not say:

- how a list of comments and a comment box look: the author and the time, the order, an edit by the author and its mark, the field and its limit, the send button and its key. `### bubble` names "a comment on a ticket" as a bubble of a conversation, with a side and a box at most 80% wide. A comment among mail messages needs the full width of the messages;
- how content that stays inside the team is marked, so that the mark reads in grayscale and to a screen reader;
- how a reply and a comment share one place at the end of a thread. The product uses two tabs, "Reply · goes out" and "Comment · internal";
- which variant the send button of a comment box takes. The view already has its one primary button, Reply, and the mocks of the owner draw Comment as a second dark button;
- which icon an activity line takes for a change to a status that has no icon. "Variants" of `### item` gives a change of status the icon of the new status, and the statuses of a form have none;
- the size of an activity line between two comments. The owner asked for small type, and an `xs` item has 8 by 10 px of padding and `body` text.

Every back office with a team meets this: a note on a case, a comment on a deal, an internal reply in a support desk.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4555`, `### bubble`: "a comment on a ticket" is a bubble in a `message`.
- `DESIGN.md:4209`, "Variants" of `### item`: an activity line is an item of size `xs`, and "A change of status takes the icon of the new status".
- `DESIGN.md:1546`, `primary`: "One primary per view, pane and dialog."
- `DESIGN.md:3285`, "Accessibility" of `### tabs`: a trigger shows its panel as soon as it has focus (`activationMode="automatic"`).
- `DESIGN.md:4840`, "Do's and Don'ts": a dashed edge in `input` and a badge mark content that no person has confirmed yet.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/InternalBlock.svelte:8-20`: the stopgap comment. `:35-39`: the block and its tab.
- `admin/src/lib/EventLine.svelte:49-52`: the small activity line between two comments.
- `admin/src/lib/CommentBody.svelte:11-13` and `:48-60`: the body of a comment, on the paper of the content.
- `admin/src/routes/(app)/desk/FormItem.svelte:1032-1096`: the section of comments, oldest first, with Edit for the author and the events between them. `:1097-1124`: the comment box. `:1125-1135`: the Comment button with its key, and the line "C puts the caret here". `:445-458`: a neutral icon for each change of status.
- `admin/src/routes/(app)/mail/Conversation.svelte:3035-3077`: the comment box of a conversation, and its button. `:3644-3660`: the two tabs.
- `admin/src/routes/(app)/mail/Thread.svelte:304-334`: a comment in its place in the thread, with Edit for the author.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. A list of comments and a comment box. A comment shows its author at 500, its time by its age, and its text at the full width of the column, oldest first. Its author can edit it, and the comment then says "edited" beside its time. The box holds a rich text field of the preset Comment, the count of the characters left, a send button with Cmd+Enter, and a key that puts the caret in the field, such as C.
2. A mark for internal content: a block on `background` with a `border` edge and the 8 px radius, and a small `outline` badge with a lock and the word "Internal" on its top edge. The word carries the mark, so it reads in grayscale and to a screen reader. Internal content that no person confirmed yet, such as a summary from the service of the product, takes the dashed edge in `input` of "Do's and Don'ts".
3. A reply and a comment at the end of a thread: two tabs with an icon and the side in words, such as "Reply · goes out" and "Comment · internal". Each panel stays mounted, so each keeps its text. The rule says whether such tabs switch on focus, as `### tabs` says, or on Enter and Space, because a tab here opens a box and does not show a view.
4. The variant of the send button of a comment box, beside the one primary button of the view.
5. An activity line for a change to a status that has no icon: a neutral icon, such as `history`.
6. A small activity line between two comments: 4 px of padding above and below, and `small` text.

### What the product does until a release ships it

`InternalBlock` draws the block: `rounded-lg border border-border bg-background`, with an `outline` badge, a lock icon and "Internal" at `-top-2.5 left-3`. Its `dashed` prop draws the dashed edge for content that no person confirmed. Comment and "Add the internal comment" are `default` buttons of size `sm`, with a lock icon and their key in `kbd`. A change of status takes the `history` icon. `EventLine` takes `py-1 text-xs` in its small form. The tabs of a conversation take `activationMode="manual"`. The product marks each stopgap with the number of this pull request.
