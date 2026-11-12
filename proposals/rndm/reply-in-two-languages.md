### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The back office of rndm answers its clients in the language of the client, and the team works in English. So a reply in another language has two texts. The text in the language of the client goes out. The English text stays in the conversation, so that each person of the team can read what went out. The person picks the send form: the language of the client only, or that text with the English text below it, after a line "English:". The form starts with the English below. The check before a send names the language, the form and the version of the shared draft that goes. A reply in a language that the team reads keeps one field.

`### mail-message` names the reply field in one place: "a reply field of the product follows the last message". STACK does not say:

- how one reply field holds two texts in two languages: the order of the two fields, their labels, and which one the From and the recipients describe;
- which control picks the reply language. The list holds more than seven languages, so `### select` asks for a `command` in a `popover`. No part of STACK picks a language, as `### time-zone-field` picks a zone;
- which control picks the send form, and where it stands;
- how the field that does not go out says so, and how it says that the other form sends it below;
- the `lang` and the `dir` of each field. `### Content in another language` asks for `dir="auto"` on a field of free text, but no line names a field in each of two languages;
- how the summary of the facts of a send confirmation names the language, the form and the version of a shared draft;
- how the thread names the form of a sent reply. `### mail-message` lets a product add "one more fact after a middle dot" to the line Sent by. The product writes "Sent by Ana Turner · German, with the English text below it".

Every back office that answers its clients in their languages meets this, such as a support desk, a shared inbox and a CRM. The translation box of `### mail-message` shows a translation of a mail that came in. This proposal is the way back: a reply that a person writes in two languages.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:4638`, "Anatomy" of `### mail-message`: "a reply field of the product follows the last message". No line names a reply in two languages or its send form.
- `DESIGN.md:4640`, "Variants" of `### mail-message`: "Another language" and "Translation" cover a mail that came in. "A product may add one more fact after a middle dot" covers one fact of a sent reply. No line covers the reply field.
- `DESIGN.md:2633`, `### select`: "Above seven options, use a list that the person can search: a `command` in a `popover`." No part picks a language.
- `DESIGN.md:1685`, `### Content in another language`: "A field where a person types free text, such as a name or a note, takes `dir="auto"`."
- `DESIGN.md:2850`, "Variants" of `### alert-dialog`: the summary of the facts is a grid of rows with a 112 px label column. No row names a language or a version.

The admin of rndm, at commit 3b15415:

- `admin/src/routes/(app)/mail/Conversation.svelte:3142-3187`: the field "Reply language", an `outline` trigger of size `sm` that opens a `command` in a `popover`. For another language, the `toggle-group` "Send form" follows, with "German only" and "With the English below".
- `Conversation.svelte:3188-3210`: the field "German, the text that goes out", with the From and the recipients as its description, the `lang` of the language and `dir="auto"`, and the stopgap comment.
- `Conversation.svelte:3240-3256`: the field "English", with `lang="en"` and a description of its form.
- `Conversation.svelte:3371-3382`: the rows Language and Version of the summary in the check before a send.
- `admin/src/lib/mail.ts:51-75`: the languages of the list, their names from `Intl.DisplayNames`, and the words of each form. `:185-189`: the form after a middle dot in the line Sent by.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

1. A part "Reply in another language" in `### mail-message`, or a part of its own. The reply field picks its language with a `command` in a `popover`, with the language of the interface first. In a language that the team reads, the field stays one field. In another language, the field holds two text areas: the text in that language first, because it goes out, then the text in the language of the interface. Each text area carries the `lang` of its text and `dir="auto"`, and its label names the language, such as "German, the text that goes out".
2. The send form: the language of the client only, or that text with the text in the language of the interface below it. A `toggle-group` of size `sm` beside the language picks it. The description of the second text area says whether it goes out, such as "Goes out below the German text, after a line "English:"." or "Stays in the conversation, and does not go out."
3. The summary of the facts of the send confirmation adds a row Language with the form in words, such as "German, with the English text below it". For a draft that many people edit, it adds a row Version with its number and its author, such as "Version 2, by you".
4. The line Sent by of a sent reply names the form as its one more fact, such as "Sent by Ana Turner · German, with the English text below it".
5. A list of languages with their names in the language of the interface (`Intl.DisplayNames`), as a part or as a helper with no token, so that every product names a tag the same way.

### What the product does until a release ships it

The reply language is an `outline` trigger of size `sm` that opens a `command` in a `popover`, as the time zone field does, with the name of each tag as its keyword. The send form is a `toggle-group` of size `sm` beside it. The two text areas are each a `Field.Field` with a `Field.Label`, a `Field.Description` and a `Textarea`, the text in the language of the client first. The summary of the check before a send adds the rows Language and Version, and the thread adds the form after a middle dot in the line Sent by. The product marks each stopgap with the number of this pull request.
