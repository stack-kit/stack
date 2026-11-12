### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The back office of rndm holds a reply for some seconds after Send, before it goes, so that its sender can undo it. The time of the send comes from the service of the product. While the person stays in the conversation, the thread shows the reply with a line that counts down, such as "Goes out to <address> in 24 s.", with Undo and Cmd+Z. When the person goes to another item before that time, the reply follows the person in a toast with Undo, such as "Your reply in “<subject>” waits to go out.", until the time of the send. The product also gives the toast of a discarded draft 30 s, so that a click by mistake loses nothing.

`undoToast` takes a duration from the moment that the toast shows, and no end time. Hover pauses the timer of the toast, so Undo can still show after the reply went. An Undo then fails with "Too late: it went out at 14:05." `undoToast` takes no end callback either. Its own end, on a close, a swipe or a time out, only ends the binding of Cmd+Z. And the product cannot end the toast when it learns that the mail went. STACK does not say:

- how a toast ends at a given time, and whether hover pauses it then;
- whether such a toast counts down, such as "Goes out in 24 s";
- how the product ends a toast itself;
- how a product learns that a toast ended with no Undo: at the end of its time, on its close button, on a swipe, or when a new toast with the same id takes its place;
- how long a toast with Undo lasts for an action that the person can take back for longer than 10 s.

Every product that takes back an action after a short wait meets this: a mail that waits to go, a delete that the service of the product finishes later, a file that goes when the toast ends.

### Evidence

STACK, tag v2.2.0:

- `preview/src/lib/stack/behaviour/undo.ts:13-20`: `UndoOptions` holds `undo`, `id` and `duration`, and no end time and no end callback. `:26`: `undoToast` gives back nothing.
- `preview/src/lib/stack/behaviour/undo.ts:40-46`: `onDismiss` and `onAutoClose` only end the binding of the key.
- `DESIGN.md:4330`, "States" of `### sonner`: "give a toast with Undo 10000 ms", and "Hover pauses the timer".

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Conversation.svelte:886-901`: the toast of each reply that waits, when the person leaves the conversation, with the time left as its duration, and the stopgap comment. `:2846-2851`: the same toast after a send that ends while another item shows.
- `Conversation.svelte:2196-2203`: the 30 s of the toast of a discarded draft, and the stopgap comment.
- `Conversation.svelte:2623-2630` and `:2994-3027`: the line that counts down in the thread, with Undo, Cmd+Z and Send now.
- `Conversation.svelte:2730-2734`: the words of an Undo that comes too late.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. `UndoOptions` takes an end time in place of a duration, such as `until`. The timer of such a toast does not pause on hover, and the text can name the time left, such as "Goes out to <address> in 24 s".
2. `undoToast` gives back a function that ends the toast, so that the product ends it when the action finished, such as when the mail went.
3. `UndoOptions` takes an end callback, such as `onend`, that runs once when the toast ends with no Undo: at the end of its time, on its close button, on a swipe, on the function of point 2, or when a new toast with the same id takes its place.
4. A sentence in `### sonner` for an action that waits: the toast names the wait, and it keeps Undo and Cmd+Z until the end time. A second sentence says when a toast with Undo may last longer than 10000 ms, such as 30 s for a draft that the service of the product keeps for that time.

In the form that the product would use:

```ts
type UndoOptions = {
  /** Puts the change back. */
  undo: () => void | Promise<void>;
  /** One toast for each id. */
  id?: string;
  /** In ms from now, 10000 by default. */
  duration?: number;
  /** The end of the toast, in place of duration. Hover does not pause it. */
  until?: Date;
  /** Runs once when the toast ends with no Undo. */
  onend?: () => void;
};

/** Shows the toast, and gives back a function that ends it. */
declare function undoToast(text: string, o: UndoOptions): () => void;
```

### What the product does until a release ships it

The toast of a reply that waits takes the time left until the send as its `duration`, so hover can still keep it past the send. The thread offers the same Undo, with a line that counts down. The toast of a discarded draft takes 30 s, against the 10000 ms of `### sonner`. The product marks each stopgap with the number of this pull request.
