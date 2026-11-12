### Product

rndm, v2.2.0

### Kind

missing

### What the product found

A conversation of a shared inbox in the back office of rndm has events between its messages. A person takes the conversation, takes it over from another person, or releases it. A person marks it done or as spam, or takes back a reply before it went out. The team also adds internal comments (see the proposal "missing: a comment list, a comment box and the mark of content that stays inside the team"). The owner asked to see the events and the comments in their place in the thread, so that the thread tells what happened, in order.

`### mail-message` puts the messages in the order of their time, and a reply field after the last message. `MailThread` takes only mails. STACK does not say:

- whether events and comments stand in a mail thread, and in which form;
- how the events between two messages group, and how a long stretch of them folds;
- where an event stands that has the time of a message;
- whether the fold of read messages counts events;
- what the heading of the thread counts;
- where a reply that waits to go out stands.

The proposal "missing: the mark of who sent each message of a mail thread" covers the mark of each message, so this proposal leaves that out.

Every shared inbox and support desk with owners of a conversation meets this.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4638`, "Anatomy" of `### mail-message`: "The messages follow in the order of their time, the oldest first, and a reply field of the product follows the last message."
- `DESIGN.md:4209`, "Variants" of `### item`: an activity line of size `xs`, the 1 px line in `border` that joins the icons, and "a stretch of more than 8 lines shows its last 3 and a line that opens the rest".
- `preview/src/lib/stack/MailThread.svelte:9`: the prop `mails`. `:51-61`: one `MailMessage` for each mail, with nothing between two of them.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Thread.svelte:128-131`: the stopgap comment.
- `Thread.svelte:138-170`: the messages, the events and the comments in one order by time. Two entries at one time keep the order in which they happened. `:149-164`: a comment stands on its own and ends the stretch of events before it.
- `Thread.svelte:115-120`: the fold counts the messages only.
- `Thread.svelte:287-292`: the heading counts the messages, and a note says "Comments and changes stand in their place".
- `Thread.svelte:335-368`: a stretch of event lines in `small` type, with "Show 6 earlier events" when it folds. `:370-374`: the replies that wait to go out, after the messages and the events.
- `admin/src/lib/EventLine.svelte:1-14`: the fold of a stretch, after 8 lines.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. `MailThread` takes entries of three kinds in one order by time: a message, an event and a comment. Or it takes a snippet that it renders between two messages and after the last one.
2. The events between two messages, or after the last message, are one stretch of activity lines of size `xs` in `small` type, joined by the 1 px line. A stretch of more than 8 lines shows its last 3 and a line that opens the rest, as `### item` says.
3. An event at the time of a message stands after the message. Two entries at one time keep the order in which they happened.
4. A comment stands on its own, with the mark of internal content, and it ends the stretch of events before it.
5. The fold of read messages counts the messages only, so an event after the last message never folds it. The heading counts the messages, and a note says that the changes stand in their place.
6. A reply that waits to go out stands after the messages and the events, and the heading does not count it.

### What the product does until a release ships it

The thread puts `MailMessage` together as `MailThread` does. It puts a stretch of `EventLine` or an `InternalBlock` between two messages. The note of the heading says "Comments and changes stand in their place". The product marks each stopgap with the number of this pull request.
