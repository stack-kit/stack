### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The back office of rndm shows the mail of a shared inbox as a thread of `MailMessage`. The owner tested it. He sent an enquiry from his own mailbox, replied from the back office, and answered that reply. The thread then held his reply and his answer under one name. He could not tell which message the team sent and which came from outside, and he could not tell their order.

`### mail-message` marks a message that the product sent only with the line Sent by, after the recipients. That line shows only in an open message. A folded line holds the avatar, the name, the first words and the time, so two folded messages of one name look the same. A message that came in has no mark at all. The order shows only through the times.

A reply of the product also waits some seconds after Send before it goes, so that its sender can undo it (see the proposal "missing: an undo toast that ends at a given time, with an end callback"). The thread shows that reply at its end as the message that it becomes. So a message has a third side: it waits to go out.

Every product with a shared inbox meets this. A person writes to the support address from an address that also answers, or a client and a member of the team share a name.

STACK does not say:

- whether a message shows who sent it, the product or the other party, in line 1 and in the folded line;
- the form of the mark: a badge with an icon and a word, an icon only, or a side;
- its words and its weight, such as Sent and Received, and whether the mark of a sent message names its first recipient;
- how a long address in the mark ends;
- the state of a reply that waits to go out, with its mark and its line;
- what a screen reader reads;
- whether the heading of the thread says the order, such as "Messages · 3 · oldest first".

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4638`, "Anatomy" of `### mail-message`: line 1 holds the avatar, the name, the address, the time and the unread mark. No mark says who sent the message.
- `DESIGN.md:4640`, "Variants": "Sent by" names who sent a message that the product sent, in a line after the recipients. The folded line holds "the avatar, the name at 500, the first words of the body in `muted-foreground` and the time".
- `DESIGN.md:4644`, "States": Not sent is the one state of a reply. No state names a reply that waits to go out.
- `preview/src/lib/stack/MailMessage.svelte:156-173` and `:174-198`: the folded line and the header. The part has no snippet, so a product cannot add a mark to either.
- `preview/src/lib/stack/MailThread.svelte:48-50`: the heading `{label} · {count}`, with no place after the count. `:51-61`: one `MailMessage` for each mail, and the page passes nothing to each one.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Message.svelte:196-204`: the mark before each message, as a sibling of the message, so the divider of each message stays. `:213`: the message names the mark with `aria-describedby`. `:216-219`: the line of a reply that waits, under its body. `:46-57`: the stopgap comment.
- `admin/src/routes/(app)/mail/Thread.svelte:287-292`: the heading, such as "Messages · 3 · oldest first". `:106-107`: the stopgap comment. The thread puts `MailMessage` together as `MailThread` does, because `MailThread` passes nothing to each message. `:370-374`: each reply that waits, after the other messages.
- `admin/src/routes/(app)/mail/Conversation.svelte:2623-2630`: the words of the line of a reply that waits, such as "Goes out to <address> in 24 s.". `:2994-3027`: the line, with Undo and Send now.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. `Mail` takes the side of a message, such as `direction?: 'in' | 'out'`, where `out` is a message that the product sent. It also takes the state of a reply that waits to go out, such as `waiting?: boolean`.
2. A sentence in "Anatomy" and in "Variants" of `### mail-message`: a mark before line 1 and before the folded line shows the side. The product uses a `badge` with an arrow and a word, in two weights, so that a person sees at a glance what went out. A message that the product sent has the `default` badge with an arrow up and to the right, and "Sent to <the first address of To>", or "Sent" when To is empty. A message that came in has the `outline` badge with an arrow down and to the left, and "Received". The address in the badge ends in an ellipsis, and the badge is at most as wide as the message (`max-w-full`). The line Sent by stays.
3. A state Waits to go out of a message that the product sent. The mark is `secondary`, with a clock and "Waits to go out to <address>". The body takes `muted-foreground`. A line under the body, where the line Not sent stands, holds the countdown, Undo with Cmd+Z, and Send now at the far end. The countdown is no live region, so a screen reader reads it once, when the line takes the focus after Send.
4. What a screen reader reads: the message names the mark with `aria-describedby`, or the heading starts with the word, as "Unread," does now.
5. Whether the heading of `MailThread` names the order, such as "Messages · 3 · oldest first", or a prop of `MailThread` that adds words after the count. A snippet of `MailThread` that gives each message its mark would let a product keep `MailThread`.

### What the product does until a release ships it

`Message.svelte` puts a `badge` before each `MailMessage`, as a sibling, so the divider of each message stays. A message that the product sent has `default` with an arrow up and to the right and "Sent to <the first address of To>". A message that came in has `outline` with an arrow down and to the left and "Received". A reply that waits has `secondary` with a clock and "Waits to go out to <address>". The message names the mark with `aria-describedby`. `MailThread` passes nothing to each message, so the product puts `MailMessage` together in its own section, with the heading "Messages · 3 · oldest first" and the folds of `MailThread`. The product marks each stopgap with the number of this pull request.
