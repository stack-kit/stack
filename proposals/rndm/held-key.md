### Product

rndm, v2.2.0

### Kind

missing

### What the product found

rndm binds single keys that move the caret into a field: R opens the reply and puts the caret in its text, and C does the same for a comment. The binding runs on the first keydown. A press that lasts past the repeat delay of the system sends more keydowns of the same key. By then the field has the focus, so the binding declines them through `inText`, as "Rules" of "Keyboard model" asks, and the field types the letter. The person pressed R once and finds the letter in the reply.

The same happens with any single key that opens a field, such as a key for a new note or for an edit of a title. STACK does not say that such a key takes the whole press, and `behaviour/keys` has no helper for it.

### Evidence

STACK, tag v2.2.0:

- `architecture/web-app.md:115`: "A single key, with or without Shift, never fires while focus is in a text field, a text area, a select, an editable region or the palette."
- `preview/src/lib/stack/behaviour/keys.ts:106`: `inText`. `:195-206`: the listener runs the binding on each keydown and reads no `repeat`.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/keyGuard.ts:1-44`: `takePress`, the guard.
- `admin/src/routes/(app)/mail/Conversation.svelte:1899-1902`: R calls it after `preventDefault()`. `:1967-1970`: C does the same. Two other pages call it for their single keys.

No screenshot goes with this proposal.

### Proposed rule or change

A sentence in "Rules" of "Keyboard model":

"A single key that moves the focus into a text field, such as R for Reply, takes the whole press: from its keydown to the keyup of the same key, no keydown, keypress or typed input of that key reaches the field. The keyup, or the window that loses the focus, ends it, and the next press types the letter."

A helper in `behaviour/keys`, such as `takePress(e)`, that a binding calls after it takes the key. The product version, with no product code in it:

```ts
/** Call it in the handler that takes a single key, after e.preventDefault(). */
export function takePress(e: KeyboardEvent): void {
  const { code, key } = e;
  const letter = key.toLowerCase();
  // A soft keyboard can leave code empty, so the key counts then.
  const same = (next: KeyboardEvent) => (code ? next.code === code : next.key.toLowerCase() === letter);
  const stop = (next: KeyboardEvent) => {
    if (!same(next)) return;
    // A new press (no repeat) means the keyup of this one was lost: end the guard and let the press through.
    if (next.type === 'keydown' && !next.repeat) return end();
    next.preventDefault();
    next.stopImmediatePropagation();
  };
  const input = (next: InputEvent) => {
    if (next.inputType !== 'insertText' || next.data?.toLowerCase() !== letter) return;
    next.preventDefault();
    next.stopImmediatePropagation();
  };
  const up = (next: KeyboardEvent) => {
    if (same(next)) end();
  };
  const end = () => {
    removeEventListener('keydown', stop, true);
    removeEventListener('keypress', stop, true);
    removeEventListener('beforeinput', input, true);
    removeEventListener('keyup', up, true);
    removeEventListener('blur', end);
  };
  // The capture phase on the window runs before the listeners of an editor on its root.
  addEventListener('keydown', stop, true);
  addEventListener('keypress', stop, true);
  addEventListener('beforeinput', input, true);
  addEventListener('keyup', up, true);
  addEventListener('blur', end);
}
```

`bindKey` could also take an option that calls it, such as `bindKey('reply', run, { takesPress: true })`. The names are the maintainer's to choose.

### What the product does until a release ships it

The product keeps `takePress` in `admin/src/lib/keyGuard.ts`, and each binding of a single key that moves the focus into a field calls it. The comment of the helper names the number of this pull request.
