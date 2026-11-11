### Product

rndm, v2.2.0

### Kind

conflict

### What the product found

`### sonner` of DESIGN.md says: "Show a toast only when Undo exists." The back office of rndm has a mail page with a list of conversations and a conversation that is open. A new incoming mail can arrive in a conversation that the person does not have open. The person needs to know, and the open screen does not show that conversation. The product shows a toast that names the sender and the conversation, and its action is Open, which goes to that conversation. No action is undone, so the rule allows no such toast.

When the new mail joins the conversation that is open, the product shows no toast: the mail appears at the end of the thread and the reading position stays. So the toast is for a new item that arrives elsewhere only. This is general for a back office: a mail, a ticket or a message arrives in a place that the person does not look at, and a link to it is the useful feedback.

### Evidence

The stopgap is the function `announce` in `admin/src/routes/(app)/mail/[[inbox]]/[[conversation]]/+page.svelte` of rndm-doo/rndm-code, on branch `feat/rndm-235-188-thread` (commit 810089e, ticket RNDM-188). The call is:

```ts
toast(`New mail from ${sender}.`, {
  id: `new-mail-${row.id}`,
  description: `In the conversation “${subject}”.`,
  duration: NEW_MAIL_MS,
  action: { label: 'Open', onClick: () => void goto(href) }
});
```

What the product found in use:

- One toast stands for each conversation, with the id `new-mail-<id>`, and the newest mail takes its place.
- The toast goes at once when the person opens that conversation by another way: a row, a step key or the toast (`toast.dismiss`).
- A reply that a user sent is no new mail, and a row that comes up from beyond the end of the list is no new mail.
- Without the toast the person sees nothing of a new mail in a conversation that is not open. With Open they reach it in one step.

### Proposed rule or change

Replace the first two sentences of **Purpose** in `### sonner` with:

"A toast tells the person that an action ran, and it offers Undo. It may also tell the person that a new item arrived in a place that the screen does not show, such as a mail in another conversation, and then its action is Open, which goes to that item. Show no other toast, and keep all other feedback in the screen where the change happens (see Do's and Don'ts)."

Add to **Variants**:

"`action` with the label Open goes to the item that the toast names. Give the toast an `id` for each item, so that a newer arrival replaces the toast of the same item, and dismiss the toast when the person opens the item by another way. Show no toast for an item that arrives in the view that is open: the item joins the view and the reading position stays."

The names and the wording are the maintainer's to choose.

### What the product does until a release ships it

The product keeps the toast with Open in `announce` of the mail page and marks it with a stopgap comment that names this pull request. When a release ships the rule, the product removes the mark and keeps the call.
