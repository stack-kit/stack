# Changelog

Each release has a heading `## vX.Y.Z - YYYY-MM-DD` and the sections
Breaking, Behaviour, Added and Fixed. Breaking holds each change that a
product must act on: the change of the contract since the last release, and
one step for each part. Behaviour holds each change that reaches a product
with no edit, so that the product knows what its users see. Added holds each
new part, export, prop and snippet, and Fixed each fix.

A change that a product must act on is a major version: a removed documented
behaviour, such as a word that goes from an `@behaviour` line; a removed or
renamed prop, callback, snippet, export, `data-slot` or command, a removed
option of a command, a narrowed type, a new required input, a change of a
member of an exported object type other than a new optional member, a
changed default that changes what a page shows, a behaviour that needs a new
function from the product, or a change of a rule of the frame. A new part, a
new command, a new optional prop or snippet, a new optional member of an
exported object type, a change of the look, or a change of behaviour that
needs no input from the product is a minor version.
A fix that keeps the contract and the documented behaviour is a patch. The
release step writes each entry from the commits since the last tag.

## v2.5.0 - 2026-11-20

### Breaking

- None. A product changes no code at this update. It moves the pin. The
  peers of `package.json` do not change.

### Behaviour

- `parts/RichTextField` and `parts/RichTextInPlace`: `dir` is `auto` by
  default, as a field of free text asks. A text that starts with an
  Arabic or a Hebrew letter now aligns to the right. `dir={null}` leaves
  the direction of the page, as v2.4.0 did.
- `parts/RichTextField` and `parts/RichTextInPlace`: a `lang` or a `dir`
  that a product gives reaches the editable text and the read view only.
  Before, it reached the root through the rest attributes, and a `dir`
  there turned the toolbar too. The root, the toolbar, the bars and the
  rows keep the language and the direction of the page. The placeholder
  of a text from right to left starts at the right.
- `parts/RichTextField` and `parts/RichTextView`: in a text from right
  to left, a list takes its indent and a quote its edge at the start of
  the line, which is the right side. Before, the markers of a list
  passed the right edge and the field cut them, and a quote kept its
  edge on the left. A text from left to right looks as before.
- `rich-text` and `parts/RichTextField`: the load list keeps a line
  break that text or another line break follows in its block. So
  `<li>One<br>Two</li>` and `<h2>A<br>B</h2>` keep their two lines, and
  `<div>A<br>B</div>` stays one block. Before, the list joined the words
  or split the block, and `editor.html()` gave the joined lines. The
  list also keeps the last line break of a block when the break stands
  alone in its line, so `<div>A<br><br></div>` keeps its empty last
  line. `words()` and the diff of a whole text count that empty line.
- `parts/RichTextField`: the diff of a whole text counts an empty line.
  The review shows an added or removed empty line with the mark of a
  paragraph break, as Take all writes it. In a list, an empty line
  between the parts of a split takes the mark of a new item. An empty
  line between the parts of a join is a removed line after the joined
  line. So a split and a join with an empty line count two changes each.
- `parts/SplitRow`: with `oneLine`, the end of line 1 is a column of 108
  px in place of 80 px, from 768 px. A time of this year by its age now
  shows whole in each shared locale. The widest is "May 28, 08:48 AM" in
  en-US, at 106 px. A value wider than 108 px still goes to the end of
  line 2.
- `parts/HtmlFrame`: a new `src` gets a new `<iframe>`, so the frame
  starts again at its fixed height. A message of the page of the old
  `src`, which can post until the new page commits, no longer counts for
  the new `src`.
- `parts/HtmlFrame`: when the last call of `onpage` named a fact and the
  page of a new `src` names none, the part calls `onpage` once with `{}`
  at the first message that passes. A product drops the facts of the old
  `src` there.
- `parts/MailMessage` and `parts/MailThread`: a mail with `frame` whose
  page posts nothing shows the body and the quote. Such a page is the
  page of an error or of an expired address. The line "This mail did not
  load as designed." and Show as designed take the place of the frame.
  With no `onframe`, the frame loads `frame` each time it mounts. So
  after the expiry of the address, Show as designed after Show as text
  and the open of a folded message give this view. Before, they showed
  the page of the host that says that the address expired. Give
  `onframe` to load a new address.
- `### mail-message`: a reply that waits to go out stays a mail of the
  thread. It shows as the last mail, as the message that it becomes, and
  the heading counts it. The entries of the team that `after` renders
  follow it.
- `rich-text`: the load list keeps one attribute on a `blockquote`,
  `type="cite"`, the mark of a quoted earlier mail. The value passes in
  any case and the list writes it as `cite`. A quote keeps no other
  attribute, also not `cite`, which holds an address. The paste list and
  the simple preset keep none. A stored text with the mark now keeps it
  in the field and in the view. A server that keeps the list of v2.4.0
  drops the mark, and the reply still goes whole.
- `### sidebar`: a count that asks for an act of the person keeps the
  `sidebar-foreground` of the nova style and takes weight 600
  (`class="font-semibold"`). Such counts are the mails that wait for an
  answer, the tasks past their due time and the jobs that failed. Every
  other count keeps `text-muted-foreground` at 500. Under the pointer
  and on the current page, both take `sidebar-accent-foreground`, and
  the weight stays. So the weight tells the two counts apart, also in
  grayscale. No count takes red. The name of the menu button says the
  count and what it counts, and the rail hides the count with no mark.
  On a phone, the tab of a page with such a count shows it in the count
  badge. No component changes, because the product passes the class.

### Added

- `parts/InternalMark` and `### internal-mark`: a base part that marks
  content that stays inside the team, such as a comment between the
  mails of a thread. The content stands in a block with an `outline`
  badge, "Internal", on its top edge, so the mark reads in grayscale and
  a screen reader reads the word. `proposal` marks content that no
  person confirmed yet: a second badge names its source, and the edge
  turns dashed. `label` gives the word in the language of the product,
  and `badgeHidden` hides the badge from a screen reader for a part that
  says the word itself.
- `parts/ActivityLines` and `### activity-lines`: a base part that shows
  one stretch of the events of a record in its place among other
  content, such as the changes of a case between two comments. Each line
  is a `marker` with an icon, its words and its time by its age. A
  stretch of more than 8 lines shows its last 3, and a button shows the
  rest. `words` gives the words of the button. The export
  `ACTIVITY_LINES_WORDS` and the types `ActivityLine` and
  `ActivityLinesWords`.
- `parts/CommentItem`, `parts/CommentList` and `### comment-list`: the
  comments that only the team sees, at the width of the column and at
  most 720 px, with no bubble and no side. A list holds the comments and
  the activity lines of the record in the order of their time, a heading
  with the count and a place for the box at the end. `internal` puts the
  list, or one comment, in an `internal-mark`. `editable` and `onedit`
  let the author edit a comment in place with `rich-text-in-place`, and
  `onfailure` gets a rejected edit with the kind `save`. The exports
  `COMMENT_WORDS`, `COMMENT_LIST_WORDS` and the type `CommentData`.
- `parts/CommentBox` and `### comment-box`: a part that writes a comment
  of the team, at the end of a list or in the place of the comment at
  the end of a mail thread. It holds a `rich-text-field` of the simple
  preset, the count of the characters left with `limit`, and the send
  button with its key. `onsend` stores the comment. A failed send keeps
  the draft and calls `onfailure` with the kind `save`. The key C puts
  the caret in the field from the rest of the page, and `caretKeys`
  gives other keys or `[]`. `primary` makes the send the `default`
  button, `internal` puts the box in an `internal-mark`, and `words`
  gives its words. `COMMENT_BOX_WORDS`. A reply and a comment can share
  one place as two tabs, as the Example shows.
- `architecture/keys.json` and the table of `architecture/web-app.md`:
  an entry for the key C of `comment-box`, and the rule that the key is
  a default that the person can change or turn off.
- `parts/LanguageField` and `### language-field`: a part that picks one
  language, such as the language of a reply, of a document or of a
  customer. The value is a BCP 47 tag. It is a `command` in a `popover`,
  as `time-zone-field` is. Each row shows the name of the language in
  the locale of the product and its own name. `languages` gives the tags
  that a person can pick, and `suggested` the tags that the list shows
  first. The search ignores case and diacritics, so a search with no
  accents finds a name that has them. The exports `languageName(tag,
  locale)`, `languageDirection(tag)` and `LANGUAGE_FIELD_WORDS`.
- `parts/RichTextField` and `parts/RichTextInPlace`: `lang`, a BCP 47
  tag, and `dir`, `auto` by default. Both go on the editable text, so
  one page can hold two fields in two languages. `### Content in another
  language` in `DESIGN.md` gives the rule for a field whose text is in
  another language than the interface.
- `parts/RichTextField` and `parts/RichTextInPlace`: `markdown`, off by
  default. A person types a Markdown mark, such as `# `, `- `, `1. `, `>
  `, `**bold**`, `*italic*`, `~~strikethrough~~` or a backtick on each
  side, and the field turns it into the format of a tool of the preset
  in one undo step. Backspace right after the change gives the typed
  text back. A mark for a tool that the preset lacks stays text. A field
  with `markdown` off behaves as in v2.4.0.
- `parts/RichTextField` and `parts/RichTextInPlace`: `slash`, off by
  default. A slash at the start of an empty line, or after a space,
  opens a list box of the block commands of the preset at the caret. The
  words after the slash filter it. `slash` is `true` or an object with
  `words`, and the menu loads in a chunk of its own at the first use.
  The types `RichTextSlash`, `SlashWords` and `SlashCommand` of
  `@stack-kit/stack/rich-text`. A failed load of the menu calls
  `onfailure` with the kind `load` and the part `toolbar`.
- `parts/RichTextField`: `quote`, the earlier mail of a reply, and
  `quoteEdited`, bindable. `quote` is a `RichTextQuote`: `line`, `body`,
  `lang`, `dir` and `words`. The quote stands in a row
  (`rich-text-quote`) under the text, outside the editable element,
  folded behind "Show the quoted text". So `html()`, `words()`, the undo
  history and a request of the writing tools hold the words of the
  person only. The field renders the line and each paragraph as text,
  never as HTML. `RichTextInPlace` takes no `quote`.
- `parts/RichTextField`: "Edit the quoted text" moves the quote into the
  text after the words, as one undo step, and sets `quoteEdited` to
  true. The undo key gives the fold back. The moved quote is a
  `blockquote` with `type="cite"`. While the text is read-only, Edit
  takes `aria-disabled` and names its reason in a line beside it.
  `QuoteWords` of `@stack-kit/stack/rich-text` holds `show`, `hide`,
  `edit` and `readonly`.
- `parts/RichTextField`: a reply inside the moved quote. In a
  `blockquote` with `type="cite"`, one Enter splits the quote at the
  caret, also in the middle of a line. Both parts keep `type="cite"`,
  and a new empty line between them takes the caret. Backspace at the
  start of a line and Delete at its end move no words over the edge of a
  part. Each split and each removal is one undo step. A list item, a
  code block and a quote of the Quote tool keep the keys of the engine.
  The Enter that confirms a word of an input method splits no quote. The
  same keys act in a stored text of `RichTextInPlace`, and of
  `CommentBox` with the full preset, that holds such a quote.
- `parts/CommentBox`: the box gives `markdown` and `slash` to its field.
  It takes no `quote` and no `quoteEdited`, because a comment quotes no
  earlier mail.
- `@stack-kit/stack/email` and `### Rich text in an email`:
  `richTextStyles(colors, dir)`, the inline styles that a server writes
  on the HTML of a rich text in a mail, after it cleans the HTML. A
  table gives the style of each of the 21 tags of the load list, from
  the type and the colors of the email. The exports `richTextStyles`,
  `RichTextTag` and `MONO`. The section also says how the plain text
  part comes from the cleaned HTML.
- `architecture/web-app.md`, "A reply to a mail": the rules of the
  server for a reply by reference. The server takes the id of the
  earlier mail only from a conversation that the person answers and may
  read. It writes the quote from its own stored copy, and it never takes
  the words of the quote from the browser.
- `parts/MailThread`: the optional snippet `after(mail)`. It renders the
  entries of the team after each mail until the next mail, such as a
  stretch of events in `ActivityLines` and an internal comment in a
  `CommentItem`. The box (`mail-thread-after`) stands inside the
  section, between the articles of two mails, and takes no room while it
  is empty. A screen reader reads the entries in the order of the
  screen.
- `parts/MailThread`: the optional prop `note`, words under the heading
  that say what the count leaves out, such as "Comments and changes
  stand in their place." (`mail-thread-note`). The note describes the
  section.
- `parts/MailThread`: `placeAfter(mails, events, comments)` and the type
  `MailEntry`. `placeAfter` gives each event and each comment to the
  last mail at or before its time. It returns a map from the id of each
  mail, in the given order, to its entries in the order of time. A
  stretch of events is one entry, a comment is one entry, and a comment
  ends a stretch. `CommentList` uses the same rule.
- `parts/MailMessage`: `Mail.channel`, the words of where a message came
  in or went out, such as "Mail · Support · Spam". The words stand on a
  line of their own after the recipients and before Sent by
  (`mail-message-channel`). The part styles no word of them. The folded
  line does not show them.
- `parts/MailMessage`: `Mail.fresh` shows an `outline` badge "New" with
  no icon before the direction badge, in line 1 and in the folded line.
  The heading starts with the word, such as "Unread, New, Received, Ana
  Turner".
- `parts/MailMessage`: `Mail.waitingNote`, the words of a reply that
  another person sent and that waits. With `sendsAt` and `waitingNote`,
  the waiting line shows these words in place of the time left, with no
  Undo and no Send now, also when the thread gives both functions.
- `parts/MailMessage` and `parts/MailThread`: the actions of one
  message. The type `MailAction` is `{ id, label, icon, destructive, run
  }`. `MailMessage` takes `actions` and `actionsLabel`, and `MailThread`
  takes `actions(mail)` and `actionsLabel(mail)`. From 768 px with a
  pointer, one action with an icon is a `ghost` button of size `icon-xs`
  with a tooltip at the end of line 1. Line 1 stays 20 px high. Two or
  more actions, and an action with no icon, stand in a More menu with a
  destructive action last after a separator. Below 768 px and on a touch
  screen, each action is an item of More, 44 px high. The part shows no
  toast. `actionsLabel` names More, "More actions" by default. The
  folded line shows no action.
- `parts/MailThread`: when the product removes a message that held the
  focus, the thread moves the focus to the heading of the next message.
  With no next message, it moves the focus to the heading of the message
  before, and then to the heading of the thread. This holds while the
  focus is in the thread. When an action opens an `alert-dialog`, the
  product removes the message after the dialog closes and gives the
  focus back to More.
- `parts/MailMessage` and `parts/MailThread`: `words`, a
  `Partial<MailMessageWords>`, which merges over `MAIL_MESSAGE_WORDS` at
  render, as the comment parts do. Each word that a person sees or a
  screen reader reads is a member. Examples are the badges, the words of
  the heading, To, Cc and Bcc, the buttons of the quote and of the
  original, and the lines of a mail with `frame`. A word that holds a
  value is a function. `more` and `goesOutIn` take the count and the
  count in the number format of `locale`. `moreActions` names More when
  the product gives no `actionsLabel`, and `moreSpoken` speaks the end
  of a cut list of people. Each word that v2.4.0 had keeps its default.
  `MailThread` gives its `words` to each message, and writes the count
  of its heading in the number format of `locale`. The exports
  `MAIL_MESSAGE_WORDS` and the type `MailMessageWords`.
- `parts/MailMessage`: the facts of the page of an `HtmlFrame`. The part
  gives `onpage` and `onfailure` to its frame. A page with the state
  `text` shows the body and the quote, with no line and no Show as
  designed. A page with the state `too-large` shows the body, the quote
  and the line "This mail is too large to show as designed." in place of
  the button (`mail-message-frame-note`). A count of remote pictures
  above 0 adds the line "Remote pictures stay off, so the sender does
  not learn that you opened this mail." under the badge
  (`mail-message-remote`). Load pictures, an `outline` button of size
  `xs`, ends it when the product gives `onloadpictures`. `MailThread`
  takes `onloadpictures(mail)`. The part keeps the first facts of each
  address of the frame, so a page that a link loads into the frame
  changes nothing.
- `parts/MailMessage` and `parts/MailThread`: `onframe()` and
  `onframe(mail)`, a function that gives a new address of the page of a
  mail, or rejects. The part calls it each time the frame mounts again
  after its first render, such as at Show as designed after Show as
  text. It also calls it when a folded message or a folded original
  opens. The frame loads the address that it gives. Until the answer
  comes, the box has `aria-busy="true"` and an empty block of 320 px. A
  rejection, or no answer in 15 s, gives the view of a page that posts
  nothing. A new frame of the product, such as after Load pictures, ends
  the wait.
- `parts/HtmlFrame`: `onpage`, `onfailure` and the types `FramePage` and
  `FrameState`. `onpage` gets one `FramePage`, such as `{ state:
  'too-large', remote: 3 }`, when a message names a fact and again when
  a fact changes. `state` is `html`, `text` or `too-large`, and `remote`
  is the count of the remote resources that the host removed. The part
  takes a message only when `state` is absent or one of the three words,
  and `remote` is absent or a safe whole number of 0 or more. A message
  that fails a check changes nothing. `onfailure` runs once for each
  `src` when no message passed 2 s after the `load` event of the frame,
  or 15 s after the mount when no `load` came. The product picks what to
  show then, such as the text of the mail.
- `frame-height`: the height script reads five optional attributes of
  the `<html>` start tag of the page, once, at its start. The server of
  the host writes them. `data-stack-frame-state` and
  `data-stack-frame-remote` add `state` and `remote` to each height
  message. `data-stack-frame-fold` and `data-stack-frame-unfold` give
  the words of a closed and of an open fold, and the script puts each
  quote of an earlier mail into a `<details>` element.
  `data-stack-frame-fit` scales a page that is wider than the frame,
  never below 0.5. A page with none of the attributes gets the same page
  and the same messages as with the script of v2.4.0.
- `frame-height`: the new height script has a new hash,
  `'sha256-mWNHcJ+OAWmcfxCLUlK7uC8LVATRgQ8VzB7W3npxHWM='`
  (`FRAME_HEIGHT_HASH`). A host puts the new script and the new hash
  into its pages and its policy in the same deploy. A host that keeps
  the script and the hash of an earlier release keeps working with the
  part of this release, because the part takes a message with no fact.
  The fold needs the new script. `npm run frame` also fails now on a way
  to parse a text as HTML or as code, on a second `postMessage`, and on
  an attribute that the script lacks.
- `architecture/web-app.md`, "The HTML part of a mail": the five
  attributes and the escape of their values. The `<script>` element has
  no `type`, `async`, `defer` or `src` attribute, so that it runs before
  the parser reaches the mail. The section also gives the count of
  remote pictures as a hint, and the page that posts nothing. A server
  that writes a fact writes it on each page of the mail,
  `data-stack-frame-remote="0"` included.
- `behaviour/undo`: `undoToast` takes two optional members of
  `UndoOptions`, `undoLabel` and `openLabel`, the words of its Undo and
  Open buttons in the language of the product. The defaults are Undo and
  Open. `openLabel` counts only with `open`. The words come with each
  call, as `plainToast` takes its text. `board` and `reorder-list` pass
  no word, so their toasts stay English.
- `parts/MailMessage`: `Mail.subject`, for a record that holds the mails
  of several threads. The subject is a line at weight 500 in
  `foreground` between the header and the text, in the `lang` and the
  `dir` of the mail (`mail-message-subject`). The folded line does not
  show it.
- `parts/MailMessage`: `Mail.channelIcon`, the icon of the channel as a
  component, such as a Lucide icon or a service icon. The icon stands at
  14 px before the words of `channel`, in the color of the line, hidden
  from a screen reader. With no `channel`, it does not show. The folded
  line does not show it.
- `## Colors`, "A color of a category": a fixed category that the
  product defines, such as a channel, may take a role of its `product-`
  layer, such as `--product-channel-<id>`. The color shows only on the
  icon of the category. It is never a fill, a tint, an edge or text, and
  the name of the category always stands beside the icon. So the badge
  of a category stays gray: an `outline` badge with the icon in the role
  and the name in `foreground`. A product checks the role as `icon` with
  `stack-contrast`, and the command checks it on the six grounds.
- `## Shapes`, "Service icons": the icon of an outside service is the
  one exception to the one icon set. It is filled shapes in
  `currentColor` on the 24 px grid, at 14, 16 or 20 px, with
  `aria-hidden="true"` and the name of the service always beside it.
  STACK ships the icons of seven services. Another service takes an icon
  that the product gives, under the same rule. A channel with no icon of
  its own, such as a mail account or a text message, takes a Lucide
  icon, such as `mail` or `message-square-text`.
- `parts/MailMessage`: `Mail.source`, `{ lang, body, proposal? }`, the
  text in the language of the team from which the product made a reply
  that went out in another language, and `Mail.sourceFirst`. The source
  stays inside the team, so it stands in an `internal-mark` in the place
  of a translation (`mail-message-source`), with its `lang` on the text.
  `proposal` marks a source that no person confirmed. The mark then
  takes the dashed edge and a second badge. A mail with a source shows
  no translation. With `sourceFirst`, the mark comes first, and the mail
  as sent folds behind "Show the mail as sent" and "Hide the mail as
  sent". The folded line shows the first words of the source.
  `MailMessageWords` gets the members `internal`, `showSent` and
  `hideSent`.
- `parts/SendState` and `### send-state`: a base part that shows how far
  a chat service carried a message of the team. The product places it in
  `Message.Footer`. `steps` is a list of `SendStep`, `{ state: 'sent' |
  'delivered' | 'seen'; at: Date }`, and `now` and `timeZone` are
  required. The line shows the step of the highest rank, not the step
  that came last, so a report that comes out of order cannot move it
  back. A step that the product does not give never shows, and no step
  shows nothing. It shows no "not seen yet", because STACK cannot know
  it.
- `parts/SendState`: the line is a `ghost` button of size `xs` in
  `muted-foreground`, with the icon of the step (`check`, `check-check`
  or `eye`), its word and its time by its age. The icon starts where the
  words of the header start, and on a message with `align="end"` the
  time ends where the header ends. The line shows its whole words, and
  only a footer that is narrower than the line cuts them with an
  ellipsis. A click, Enter or Space opens a `popover` with each given
  step in the order of rank. No step takes a color, so the icon and the
  word tell the steps apart. `words` gives the words as functions of the
  time, so a language can put the time first. `locale` is optional. The
  exports `SEND_STATE_WORDS`, `SendStateWords` and `SendStep`. A message
  that failed shows its failure line and no send state.
- `### avatar`: the presence state of a contact on a chat service is the
  state of a connection, so it is feedback. Online takes `Avatar.Badge`
  in `success` (`bg-success`) with no icon. Offline takes no badge, so
  the shape and not the color tells the two states apart. A service that
  reports no presence state gives no badge and no words. In the header
  of a conversation, online is a status badge in `success` with the word
  of the product. Offline is a round `outline` badge with the time of
  the last check. A product shows a contact as online only while its
  last check is newer than the time between two checks. `Avatar.Badge`
  keeps its `primary` default.
- `parts/Conversation` and `### conversation`: an advanced part that
  shows the mails and the chat messages of one record in one timeline,
  each at its time, the oldest first, with the events and the comments
  of the team in their place. A mail stays a `MailMessage` and folds as
  in a mail thread, except the last message of the conversation. A chat
  message is a `message` with one `bubble`. The chat messages of one
  author, on one side and one channel, each at most 5 minutes after the
  one before, form a run with one header: the name as a heading, the
  icon and the words of the channel, and the time. The footer of a chat
  message holds its `SendState`, or its failure line with Retry when the
  product gives `onretry`. A day marker counts the days in the time zone
  of the product. The heading counts the mails and the chat messages,
  and `note` says what the count leaves out. `showChannel={false}` hides
  the channels in the view of one channel. The part takes the functions
  of `MailThread` for its mails, and `onretry` gets the message with its
  kind. When the product removes the entry that holds the focus, the
  focus moves to the heading of the next message, else of the message
  before, else of the conversation. The export `CONVERSATION_WORDS` and
  the types `ChatMessage`, `ConversationEntry` and `ConversationWords`.
- `@stack-kit/stack/service-icons/`: the icons of seven services,
  WhatsApp, Viber, Telegram, Messenger, Instagram, Signal and Gmail, as
  copies of the marks of Simple Icons 16.38.0 in the package, such as
  `import WhatsApp from '@stack-kit/stack/service-icons/WhatsApp'`. Each
  icon is a Svelte component with one filled path in `currentColor` on
  the 24 px grid, drawn inside 22 of the 24 units, with the `size` and
  the `class` of a Lucide icon and `aria-hidden="true"`. A product
  passes it where a part takes an icon, such as `channelIcon` of a mail.
  `LICENSE.md` in the folder names the source and its license, CC0-1.0.
  Each mark is a trademark of its owner, and a product uses it under the
  terms of that owner.
- Records 0015 and 0016. Record 0015 keeps `svelte-sonner` 1.2.1 as the
  toast library, behind `ui/sonner` and `behaviour/undo`. Record 0016
  sets the browser target of the parts and the rules: Chrome and Edge
  124, Firefox 128 and Safari 17.5.
- `architecture/web-app.md`, "Browser support": the rules for the
  target, and a table of each feature outside the target with the
  browsers that miss it and its fallback. A product can take the target
  or a higher one. `STACK.md` names the target, and `README.md` tells a
  product with a web platform skill to name it in its `AGENTS.md`.
- `README.md`: the version table counts a command of the package, an
  entry of `bin` in `package.json`. A new command is a minor change. A
  removed or renamed command, and a removed option of a command, is a
  major change.
- The command `stack-theme`, the theme generator in the package. A
  product runs `npx --no -- stack-theme --base <color> --accent <color>
  --contrast <0-100> --out src/theme.css` in its root folder, with no
  clone and no other package. It needs Node 20 or later. The package
  carries the generator and the front matter of `DESIGN.md` as JSON, so
  a product needs no YAML parser. At each update, run the command again
  with the inputs of the first line of the theme file, after the install
  of the new tag.

### Fixed

- `behaviour/item`: in the page form, a second `close()` of
  `itemInAddress` while the navigation of the first still runs does
  nothing. So two quick presses of Esc, a held Esc and a double click on
  Back go back one entry and never leave the list. The mark ends when
  the navigation ends, when it fails or a `beforeNavigate` cancels it,
  and when the history moves to a shallow entry. With `key`, `ItemPage`
  runs `onback` at each press, so the page owns that way back.
- `parts/MailThread`: the thread takes `onretry(mail)` and gives it to
  each message, and `MailMessage` shows Retry only when the product
  gives `onretry`. Before, Retry did nothing without that function, and
  a failed mail in a thread always showed it. The type of `onretry` of
  `MailMessage` widens to `(() => void) | undefined`.
- `parts/MailMessage`: the edge of an open quote stands at the start of
  the `dir` of the mail (`border-s`, `ps-3`). A quote in Arabic now has
  its edge on the right. Before, the edge stood on the left.
- `parts/MailMessage`: the name of a folded line shrinks when the line
  has no room. Before, the name kept 192 px from 768 px, and the line
  overflowed its column by 65, 73 and 93 px in item columns of 396, 388
  and 368 px.
- `parts/RichTextField`: Shift+Enter at the end of a line, of a list
  item or of bold words puts the caret on a new line. Before, the words
  that a person typed next joined the line above. The engine now adds
  the second line break that a browser adds by itself.
- `parts/RichTextField`: Enter and Shift+Enter right after a mark that
  ends at the caret, such as `**word**` with `markdown` on, put the next
  words on a new line with no mark. Before, Chromium and WebKit kept the
  mark on the new line.
- `rich-text`: the load list and the load into the field keep an empty
  last line in two more shapes. A line break at the end of a mark goes
  after the mark, so `<div><b>A<br></b><br></div>`, which Firefox
  writes, keeps its empty last line. The break between two lines of an
  item goes after the marks that the next line does not hold. So an item
  that ends with a link and an empty line keeps that line at the next
  load.
- `parts/RichTextInPlace`: a click on an item that holds a line break
  before a nested list puts the caret at the click, such as in
  `<ul><li>One<br><br><ul><li>Sub</li></ul></li></ul>`. Before, the
  count of the lines missed the empty line that the break draws.
- `parts/HtmlFrame`: the part drops each attribute of a product whose
  name in lowercase is an attribute that the part sets or removes, such
  as `srcDoc`, `SANDBOX` or `SRC`. On the server, Svelte wrote such an
  attribute before the attribute of the part, and the browser kept the
  first one until the page hydrated. The part also drops
  `allowfullscreen`, `allowpaymentrequest`, `webkitallowfullscreen` and
  `mozallowfullscreen`, so a frame no longer gets fullscreen or the
  payment feature from an attribute of a product. The types still accept
  `allowfullscreen` and `name`. A narrower type waits for v3.0.0.
- `parts/TimeZoneField`: the search turns off the vim keys of the
  command, so Ctrl+K in the search no longer moves the highlight.

## v2.4.0 - 2026-11-15

### Breaking

- None. A product changes no code at this update. It moves the pin.
  `package.json` gets one new optional peer, `squire-rte` `~2.4.10`, which
  a product installs only when it shows the rich text field. A product
  takes only the patch releases of Squire 2.4.

### Behaviour

- `behaviour/keys`: `matches()` reads each key through the one parser of
  STACK, which the rich text field uses too. A key matches its character,
  as before. A punctuation key with Cmd or Ctrl and no Shift and no Alt
  compares the character only, so Cmd+- is the key of "-" in each layout.
  A key also matches its physical key only where the character cannot
  match: a digit, such as "&" on the key of 1 in a French layout; Shift
  on a digit or on `[`, `]`, `\`, `-` and `=`, such as "&" for Shift+7;
  and Option on macOS, which gives another character, also on a letter.
  On Windows and Linux, Ctrl+Alt with AltGr down matches no key, because
  AltGr types a character. `Esc` and `Escape` name the same key, and F1
  to F24 are named keys. Each key of `DEFAULT_KEYS` matches as before.
- The shared keys of `architecture/web-app.md` and
  `architecture/keys.json`: Cmd+K opens the palette everywhere, except
  inside the text of a `rich-text-field` in the full preset while a person
  can edit the text, where it makes a link. Cmd+B of the `sidebar` fires
  everywhere except inside the text of a `rich-text-field` that a person
  can edit. Esc stays inside a `rich-text-field` and the field of a
  `rich-text-in-place` that a person can edit, so a layer around it stays
  open.
- The key rules of `architecture/web-app.md`: a function key, such as F2,
  that a page gives a command of a `rich-text-field` fires alone in its
  text, because a function key types no character.
- `themes/graphite.css`: the dark `muted-foreground` goes from L 0.67 to
  0.7, so the text of an addon of an `input-group` and the placeholder of
  a `select` read at 4.5:1 on `input/30` over `background`, `card` and
  `popover`. `npm run contrast` checks the new pair in both themes.

### Added

- `parts/RichTextField` and `### rich-text-field`: a field for a text that
  people read with its look, such as the reply to a mail or a note, on
  Squire 2.4.10 (record 0013). It keeps bold, headings, lists, links,
  colors and pictures, in the presets `full` and `simple`. Each HTML that
  enters goes through the load list or the paste list of
  `@stack-kit/stack/rich-text`. A product reads the field through
  `bind:editor`: `html()`, `words()`, `selection()`, `load()` and
  `focus()`. The engine and each smaller part load with `import()` in
  chunks of their own, so a field loads at its mount only what it mounts.
  A page with one field of the simple preset has 115.0 KB of static JS
  beyond the shared chunks.
- `parts/RichTextField`: `writing`, the writing tools. The page gives one
  function, `run(request, signal)`, and STACK owns the rest: Check,
  Rewrite with the modes of the page, Structure and the instruction row,
  the states of a request, Stop, a request of another view (`pending`),
  the numbering and the state of each change, Left out with Take after
  all, and the diff of a whole text, which the field computes. `ondecide`
  gives each decision to the product. The types `WritingRequest`,
  `WritingResult`, `WritingChange`, `WritingMode`, `WritingDecision`,
  `WritingWords` and `RichTextWriting` (record 0014).
- `parts/RichTextField`: `onfailure`. The field writes no failure text of
  its own. It calls `onfailure` with each `RichTextFailure`, and shows the
  words that the function gives in place.
- `parts/RichTextField`: `paper`, the paper, the ink and the link of one
  field, each a CSS color. In development the field warns when a text of
  the content reads under 4.5:1 on it, and calls `onfailure` with the kind
  `paper`.
- `parts/RichTextField`: `keys`, the keys of each command. Each command
  has its default keys in `RICH_TEXT_KEYS` and the id
  `rich-text.<command>` in `architecture/keys.json`. `undefined` keeps the
  default keys, and an empty list turns the key of the command off. The
  tooltips, the menus and `aria-keyshortcuts` show the keys of the page.
  When two commands get one key, the move to the toolbar takes it first,
  then the tool that comes first in the toolbar. A command that loses its
  key shows it nowhere, and in development the field warns once in the
  console. A key that no command takes reaches the page, and Cmd+B, Cmd+I,
  Cmd+U, Cmd+Z, Cmd+Shift+Z and Cmd+Y arrive with their default
  prevented, because the field stops the edit of the browser.
- `parts/RichTextField`: `toolbar`, `full` by default, or `none` for a
  field with no toolbar. The keys, the bar over selected text and the
  forms still work, and the writing tools and `toolbarEnd` do not show. A
  form that a key opens follows the selected words when the page
  scrolls, and stands at the field from a caret in an empty line.
- `parts/RichTextView` and `### rich-text-view`: a stored rich text, read
  only, with the look that it had in the field. It cleans the HTML with
  the load list, and loads no engine. `lines` clamps the text to a count
  of lines, and `paper` gives it the paper of the field that wrote it.
- `parts/RichTextInPlace` and `### rich-text-in-place`: a stored rich text
  that a person edits in its place, such as a description in a properties
  panel. The text shows as a view, and a click on it or Edit puts a field
  in its place at the same width, with the caret at the click. Save calls
  `onsave`, and so does the key of submit, Cmd+Enter by default, wherever
  the focus is in the part, except on Cancel and in the alert dialog. A
  failed save keeps the draft and calls `onfailure` with the kind `save`,
  and Cancel with changes asks in an alert dialog. `editing` and `dirty`
  are bindable, so a page gives `dirty` to its `keysOff`. A read-only
  part opens no field, also for a page that sets `editing`. `empty`
  shows for a text that the view cleans to nothing. A page of 50 parts
  in place has 91.2 KB of static JS beyond the shared chunks and loads no
  engine until the pointer enters one.
- `rich-text`: the types of the parts, the content colors `TEXT_COLORS`
  and `HIGHLIGHT_COLORS`, `parseHex`, `toHex`, `contrastRatio`,
  `paperContrast`, the sanitizer `sanitizeRichText` and
  `richTextFragment`, `defaultPicture`, `RichTextCommand` and
  `RICH_TEXT_KEYS`.
- The roles `rich-text-paper`, `rich-text-ink` and `rich-text-link` in
  each theme and mode, so the text of a field with a color tool stays on a
  light paper in dark mode. `npm run contrast` checks each text color on
  the paper and the ink on each highlight at 4.5:1.
- `parts/Diff`: a diff of text marks the blocks that changed: a new
  paragraph break, a break that went, a new list item and a new heading
  (`DiffBlock`, `DiffWord.block`, `diff-mark`). `DiffWords` takes
  `insertedBreak`, `deletedBreak`, `insertedItem` and `insertedHeading`.
  `diffChanges(lines, kind)` counts the changes of a diff.
- `behaviour/keys`: `parseKey`, `isKey`, `ariaKey`, `onMac`,
  `actionKeys`, `isFunctionKey` and the type `ParsedKey`. `isKey` matches
  a key wherever the focus is, and `matches` adds the rule of a text
  field. `actionKeys` gives the keys of an action that the person chose,
  else `DEFAULT_KEYS`. `onMac` reads the navigator, so a page calls it in
  the browser only.
- `architecture/keys.json` and the table of `architecture/web-app.md`: an
  entry for each key of a command of the rich text field, with its id, and
  the fixed keys inside its toolbar. `npm run keys` also compares the ids
  `rich-text.` with `RICH_TEXT_KEYS`.
- Records 0013, Squire for the rich text field, and 0014, the public
  surface of the rich text field and the writing request that STACK owns.

### Fixed

- None.

## v2.3.0 - 2026-11-14

### Breaking

- None. A product changes no code at this update. It moves the pin. The
  peers of `package.json` do not change.

### Behaviour

- `### sonner`: every toast that waits stays until its own end. The
  stack shows 3 toasts, and each toast after the third waits hidden, out
  of reach of the pointer and the keyboard. From two toasts, a bar under
  the stack holds Close all, which ends each toast as its close button
  does, so each toast with Undo runs its `onend`. While more than 3
  toasts wait, "+N more" opens the list of every toast, the newest next
  to the bar. The list scrolls when it is taller than the window, and a
  second press or Esc closes it. Below 600 px the bar takes 44 px
  buttons.
- Toasts: a new toast with the id of a toast that waits hidden takes its
  place and stands in front. A toast that has the focus stays in view.
  In the open list, a toast swipes only to its side, and a touch drag
  scrolls the list.
- `### sonner`: a part never shows a toast by itself. The product shows
  each toast through `undoToast` and `plainToast`. `DESIGN.md` advises
  Undo where a person can take an action back, and a failure that the
  person must fix shows in place. Until the next major version, `board`
  and `reorder-list` show their own toasts with their own failure words,
  and `code-block` and `diff` keep their default failure words.
- `### sonner` names `undoToast`, and its example uses it. A toast with
  Undo lasts longer than 10000 ms only until a time that the product
  knows, and its text never counts down.
- The key rules of `architecture/web-app.md`: a key that moves the focus
  into a text field takes the whole press, so a held key types no letter
  there.
- The shared keys of `architecture/web-app.md` and
  `architecture/keys.json`: in the work form of the split, Esc closes
  the open layer, then clears the selection, then goes back from a send
  check, then closes the item column. On an item page, Esc goes back to
  the list, and J, K, Down and Up show the next or the previous item.
- `### Detail pane` "Item column", "First row", "Esc and Close" and
  "Scroll" give the path form of the address. `### Lists` "Item in a
  refresh" covers both forms of the address.
- ListSplit: after Esc or Close, when the list holds no row of the
  closed item, the focus goes to the empty state in the list column,
  else to the list column. Before, it fell to the page. The target takes
  `tabindex="-1"` and shows no focus ring. The `@behaviour` word
  `close-focus:row,empty,list`.
- FormDialog: every form dialog holds an empty, visually hidden status
  region from the open. Nothing new shows. The `@behaviour` words
  `live-region`, `reason:line` and `stopped-click`.
- MailMessage: each file of a message stands at the top of its row, so a
  file keeps its own height beside a picture.

### Added

- `parts/HtmlFrame` and `### html-frame`: an HTML frame shows HTML that
  the product did not write, such as a report from an agent or the HTML
  part of a mail. It is a sandboxed `<iframe>` (`allow-scripts
  allow-popups allow-popups-to-escape-sandbox`, no referrer) that loads
  one page from the host of the content that the product did not write.
  The page has the special origin `"null"`. The part removes `srcdoc`,
  `allow`, `name` and `csp`, and it renders no frame for an address that
  is not `https:`, except `http:` on `localhost` and `127.0.0.1`. The
  frame takes the height that the height script of the page gives, up to
  `maxHeight` (25,000 px by default). A page with no script keeps
  `height` (320 px by default) and scrolls inside the frame.
- `frame-height`: `FRAME_HEIGHT_SCRIPT`, `FRAME_HEIGHT_HASH` and the
  type tags of the messages of the frame, for the server of the host of
  the content. The hash of the script of this release is
  `'sha256-2BfSgBcw0ftsnn9SepeAClM9mEN+hl50Yug9m2hvADA='`. `npm run
  frame` fails when the hash of the module or the hash in `DESIGN.md` is
  not the hash of the script.
- `architecture/web-app.md`, "The HTML part of a mail": the sandbox of
  the frame, the cleaning of the sender HTML on the server, the
  Content-Security-Policy of the host with its `sandbox` directive,
  remote pictures off and the address checks of each copy of a remote
  picture, the signed address of each page, `Cross-Origin-Opener-Policy:
  same-origin` for the app, and the height message.
- `parts/MailMessage`: `Mail.frame`, the signed address of the page of
  the HTML part on the host of the content. The message shows the mail
  as its sender designed it, in an `html-frame` in place of the body and
  the quote, in a box with a dashed edge and the badge "Designed by the
  sender" (`mail-message-designed`). One button switches between Show as
  text and Show as designed. The optional snippet `body(mail, src)` of
  `MailMessage` and `MailThread` takes the place of the frame.
- `parts/SendCheck` and `### send-check`: a send may show its check in
  the place of its form, as an option beside the alert dialog. The check
  holds the question, the facts in the order of the alert dialog, the
  optional snippet `preview` that shows what goes out, the warnings, the
  reason of a failed or a blocked send, Back to edit and the send. The
  form stays in the page and keeps its text. Esc and Back to edit go
  back to the form. Cmd+Enter runs the send, and Cmd+Enter in another
  field of the page or in a second check does not send from this check.
  "Actions with a lasting effect" in `architecture/web-app.md` gives the
  rule, and the Esc of the check is a key of the part.
- `parts/ItemPage` and `### item-page`: a list can open its item as a
  page in place of the list, from 768 px, through the new optional
  member `pageForm` of `itemInAddress`. The top bar holds Back, the
  crumbs, the position and the steps. The page binds J, K and Esc, holds
  the item in one box of at most 1,204 px (`spacing.item-page`), and
  takes no pointer input for 500 ms after it opens. Esc, Back and the
  back button of the browser give the list its scroll and focus the row
  of the item. `### breadcrumb` allows a crumb with no link.
- `parts/ListSplit`: the snippet `item` is optional, and the item column
  shows only with it.
- `parts/ItemColumns`: the optional prop `stickyProperties` keeps the
  properties in view while the item scrolls, from a box of 672 px. The
  rule "Properties in view" in `### Detail pane`.
- `behaviour/undo`: `plainToast` shows a toast with no Undo, such as a
  failure. `PlainOptions` takes `id`, `duration`, `kind`, `description`
  and `important`. A plain toast with the id of a toast with Undo takes
  its place, and the `onend` of that toast runs once. `endToast(id)`
  ends a toast of either kind by its id.
- `behaviour/undo`: `UndoOptions.open` adds Open before Undo. Open ends
  the toast, runs `onend` and then `open`, and runs no `undo`.
  `stack.css` gives the Open button the colors of an outline button.
- `behaviour/undo`: `UndoOptions.until` ends a toast with Undo at a
  given time, and hover and focus do not pause it. `UndoOptions.onend`
  runs once when the toast ends with no Undo.
- `ui/sonner`: the `Toaster` takes `closeAllLabel` and `moreLabel(n)`,
  so that a product gives the words of the bar in its own language. The
  defaults are "Close all" and "+N more".
- `## Components` in `DESIGN.md` names three layers: base, advanced and
  custom.
- `behaviour/keys`: `takePress(e)`. A key that moves the focus into a
  text field takes the whole press, so a held key types no letter there.
- `behaviour/item`: `itemInAddress` takes `path`. The address names the
  item with the last segment of the path, such as `/quotes/QUO-0042`.
- `parts/PropertyStrip` and `### property-strip`: the properties of an
  item as one row of values under its title.
- `parts/SplitRow`: the optional prop `oneLine` puts the row in one line
  of 32 px from 768 px. Below 768 px the row keeps the phone row of two
  lines.
- `parts/MailMessage`: `Mail.direction` and `Mail.sendsAt`. An outline
  badge says Sent, Received, Scheduled or Not sent, and a reply that
  waits to go out shows the time left with Undo (`onundo`) and Send now
  (`onsendnow`). `MailThread` passes both callbacks with the mail. A
  reply that waits never folds.
- `parts/MailMessage`: `MailFile.picture`. The file shows its picture,
  and its button opens the picture large in a dialog. The picture sends
  no referrer.
- `parts/MailMessage`: `Mail.translationFirst`. The translation comes
  first, and the original sits behind "Show the original"
  (`mail-message-original`).
- `parts/FormDialog`: the optional prop `note`, one line of plain text
  between the body and the footer that stays in view while the body
  scrolls. Below 768 px the line stands under the header. The optional
  prop `reason`: the line gives the reason, and both actions stay in the
  tab order with `aria-disabled`, described by the line
  (`form-dialog-line`).
- `### empty`: an empty state of a list takes `role="group"` and
  `aria-labelledby` its description, so that the focus reads why no row
  shows.
- The release check: a word that goes from an `@behaviour` line is level
  major, and a word that comes stays level minor.

### Fixed

- `### board`, `### reorder-list` and "A failed write" in
  `architecture/web-app.md`: a save that fails puts the item back, as
  the code does. Before, the text said that the item stays. The text now
  gives the move back, the words in the live region and in the toast of
  the part, and the focus after the move back.

## v2.2.0 - 2026-11-05

### Breaking

- None. A product changes no code at this update. It moves the pin, and
  it runs the install line of "Install the packages" in `README.md`
  again.

### Behaviour

- ListSplit: when the web address names no item, the item column keeps
  the item that it shows when a refresh brings a new first row. The new
  row comes in at the top with its unread mark, and the item in the
  column stays unread. When the row of that item leaves the list, the
  column shows the first row again. The `@behaviour` word `first-row` is
  now `first-row:kept`.

### Added

- `parts/Gap`: the optional prop `withheld` shows the reason as muted
  text at 400, with no em dash, for a value that the product withholds
  on purpose, such as an erased address. The text prints.
- `parts/MailMessage`: `Mail` takes the optional members `toMore` and
  `ccMore`. A cut list of To or Cc ends with the count of the others,
  such as "and 90 more", and a screen reader reads "and 90 more
  recipients".
- `### Lists` in `DESIGN.md`, "Rows that arrive": a list that other
  people or a system fill loads its rows again by itself, and only while
  its tab shows. The rows come in at their place, with no toast and no
  banner, and they wait while a pointer is over the list. A refresh
  never writes the key of an item into the address.
- `### Lists` in `DESIGN.md`, "Owner in a row": a row shows the owner of
  its item at the end of line 2, so that the owner also shows on a
  phone, with "You" for the signed-in person.
- `DESIGN.md`: the foot of a form that saves itself shows a failed save,
  its next try and a line for a text over a server limit, also in the
  foot bar below 768 px. The field keeps its look, and the list keys
  wait while a save failed.
- `DESIGN.md`: an alert dialog can hold one required field under its
  facts. The action stays blocked while the field is empty, and the
  focus goes into the field. A required control takes `aria-
  required="true"`.
- `### field` in `DESIGN.md`: text that the product adds to a value,
  such as a signature, shows under the control as its description, with
  its line breaks, after a solid edge.
- `DESIGN.md`: an app with no user menu puts the mode switch last in the
  foot of the sidebar, with the row "Use the system mode" before it
  while a choice is stored.
- `architecture/web-app.md`: a write whose result is not known is a case
  of "A failed write", and a refresh that a list starts by itself shows
  no syncing banner.
- The release check compares an exported object type member by member. A
  new optional member is level minor, as a new optional prop is, and
  each other change of a member stays major.

### Fixed

- MailMessage: the body, the quote and the translation keep each single
  line break of a paragraph, such as the lines of a signature or an
  address.
- The fixture checks of the menu wait until the focus is inside the menu
  before the first key, so that a loaded machine no longer fails them.

## v2.1.1 - 2026-11-03

### Breaking

- None. A product changes no code at this update.

### Behaviour

- None. No part, no rule and no style changed.

### Added

- `README.md` links the preview of the current release at
  https://stack.digitaldementia.co, in its head and in "The preview",
  and the preview of v1.0.0, the last release of the 1.x line, at
  https://stack.digitaldementia.co/1.0.0/.

### Fixed

- None.

## v2.1.0 - 2026-11-02

### Breaking

- None. A product changes no code at this update. It moves the pin, and
  it runs the install line of "Install the packages" in `README.md`
  again.

### Behaviour

- ListSplit: a wheel over a short list no longer scrolls the whole
  page. Before, an absolute box in a column, such as a line for a screen
  reader (`sr-only`) under a long item, got out of its column, so the
  page became higher than the window, and the top bar, the list and the
  item went out of view. Now each column (`relative`) is the containing
  block of each absolute box in it that has no positioned box nearer to
  it. The wrapper of the two columns never scrolls, and the document
  does not scroll on a page with a list split. On a test page at 1440
  by 900 px, the page was 1,125 px higher than the window before, and
  0 px now (`### Detail pane`, Scroll, in `DESIGN.md`).
- PageColumns: the same fix. The root and each column are the
  containing block of their absolute boxes. On a test page at 1440 by
  900 px, the page was 1,093 px higher than the window before, and 0 px
  now. Below 1280 px the root scrolls, and the columns stack, as before
  (`### Side column`, Scroll, in `DESIGN.md`).
- A wheel at the end of a column now stops there
  (`overscroll-behavior: contain`): from 768 px on each column of
  ListSplit and on the root of PageColumns, and from 1280 px on each
  column of PageColumns. Below 768 px the list and the root keep the
  overscroll of the browser, such as the pull to refresh of a phone.
- An absolute box that a page puts in a column of ListSplit or
  PageColumns, with no positioned box of its own around it, now takes
  the column as its containing block, and not the wrapper of the
  columns. So an overlay with `absolute inset-0` in the list covers the
  list column only. No part of STACK puts such a box there.

### Added

- `README.md`: "Give the agent of a product its prompt" gives the first
  message for the coding agent of a product. The agent finds the newest
  tag, pins it, and follows a named section of the README in each step.
- `README.md`, "Set up the root layout": the frame gives each page a
  column as high as the window, and on a page with ListSplit or
  PageColumns `main` takes `flex min-h-0 flex-1 flex-col`. Each part
  always needed this. The text now says it.

### Fixed

- The two scroll defects of Behaviour, which were there since v1.0.0.

## v2.0.0 - 2026-11-02

### Breaking

- The package now ships every component, every part that STACK adds,
  the behaviour modules and the pages outside the frame of a product. A
  product imports each one from the package, and it holds no copy.
  Before, a product copied the component folders, `utils.ts`, `hooks/`
  and the parts into its own `src/lib/`. The `exports` map of
  `package.json` names each public path: `@stack-kit/stack/ui/<name>`,
  `parts/<Name>`, `behaviour/<name>`, `outside/<Name>`, `outside/codes`,
  `utils`, `hooks/<name>`, `patterns`, `email`, `architecture/keys.json`,
  the CSS paths of "Import the CSS" in `README.md`, `DESIGN.md`,
  `chart-patterns.svg`, `preview/components.lock.json`,
  `preview/contract.json` and `package.json`. The map refuses each
  other path of the package, so each old deep import path ends. For
  example, an import of
  `@stack-kit/stack/preview/src/lib/stack/ListSplit.svelte` gives
  "Cannot find module" in `svelte-check`, "is not exported under the
  conditions" in `vite build`, and a 500 in `vite dev`. A read of a file
  by its path on the disk still works. A product on v1.0.0 or on an
  earlier release takes these steps once:
  1. Change the pin to `#v2.0.0`, and run `npm install`. Then print the
     install line with the command of "Install the packages" in
     `README.md`, and run it. The line starts with `npm install -D -E`,
     so npm moves each of its packages from `dependencies` to
     `devDependencies`. Never keep one of them in `dependencies`: the
     server build then stops on `tw-animate-css`.
  2. Delete the copies, as "Delete the copies" in `README.md` says:
     each folder of `src/lib/components/ui/` that the record lists,
     `utils.ts`, `hooks/`, and each file that copies a part, a module
     or a print file of the release. Then change each import line to
     its export path. The migration table below gives the export path
     of each kind of file.
  3. Set up the root layout, as "Set up the root layout" in `README.md`
     says. The layout renders one `<Toaster />` from
     `@stack-kit/stack/ui/sonner`, and the parts show their toasts in
     it. A second `<Toaster />` on a page shows each toast twice. In
     `onMount`, the layout calls `listenForPrint()` from
     `behaviour/print`, and returns its result. When a person can
     change a key, it also calls `provideKeys(keyOf)` from
     `behaviour/keys` there.
  4. Wrap the content of the top bar of the frame in
     `<FramePlace name="top-bar">`, and the content of the phone header
     in `<FramePlace name="phone-header">`, from `parts/FramePlace`.
  5. Run `npx svelte-kit sync` and the check of the product, such as
     `npm run check`. `svelte-check` names each file that imports a
     deleted file or an old deep path, and each prop that changed. Fix
     each file by the step of its part below, and run the check again
     until it gives 0 errors.
  6. Search the product for each word of the Find column of the
     migration table, and replace each hit by the part of its row.
- The package names the packages of its files as peers in
  `peerDependencies`, each with a caret range from the version of the
  record. Before, it named none. 13 peers are required for every
  product, such as `svelte`, `@sveltejs/kit`, `bits-ui`, `tailwindcss`
  and `svelte-sonner`. `svelte-sonner` is required also for a product
  that shows no toast of its own: `behaviour/undo` shows the Undo toast
  with it, and the board and the reorder list call `behaviour/undo`.
  The other 12 peers are optional, such as the CodeMirror packages of
  `parts/CodeEditor`. They come only with the export paths that need
  them.
- The parts import `$app/state`, `$app/navigation` and `$app/env` of
  SvelteKit 3, and they write the web address with
  `goto(url, { replace: true, reset: false })`. So a product runs
  SvelteKit 3, and the peer range of `@sveltejs/kit` is `^3.0.1`.
- The record `preview/components.lock.json` takes a new form. The
  record keys its `components` by export path, such as `./ui/button` and
  `./parts/ListSplit`, and each entry holds only `uses`, `packages` and
  `edited`. The keys `source`, `root`, `shared` and `css`, and the
  `files` key of each entry, go. A script of a product that reads the
  record takes the new keys, as the command of "Install the packages"
  in `README.md` does.
- An entry of `architecture/keys.json` can have an `id`: the
  `KeyAction` of `behaviour/keys` that runs the key. A key test of a
  product that refuses each field other than `key`, `action`, `scope`
  and `owner` accepts `id`.
- The contract diff from v1.0.0 gives the 39 Breaking lines below.
  v1.0.0 has no `preview/contract.json`, so the diff takes the contract of
  v1.0.0 from the files of its tag:
  `node scripts/contract.mjs diff v1.0.0 v2.0.0`.

  ```text
  - ./email Colors: type changed: { [x: string]: string; } -> { "muted-foreground": string; "primary-foreground": string; background: string; border: string; card: string; destructive: string; foreground: string; link: string; muted: string; primary: string; success: string; warning: string; }
  - ./email MONO: removed
  - ./email ROLES: value changed: any -> readonly ['background', 'card', 'border', 'muted', 'foreground', 'muted-foreground', 'link', 'primary', 'primary-foreground', 'success', 'warning', 'destructive']
  - ./email Role: type changed: any -> 'background' | 'border' | 'card' | 'destructive' | 'foreground' | 'link' | 'muted' | 'muted-foreground' | 'primary' | 'primary-foreground' | 'success' | 'warning'
  - ./email addressLines: removed
  - ./email buttonLines: removed
  - ./email footLines: removed
  - ./email head: removed
  - ./email heading: removed
  - ./outside/LinkPage default: new required callback act: () => Promise<LinkFailed | Refused<'changed' | 'expired' | 'used'> | { facts?: Fact[]; ok: true; }>
  - ./outside/LinkPage default: new required prop facts: Fact[]
  - ./outside/LinkPage default: new required prop product: OutsideProduct
  - ./outside/LinkPage default: new required prop text: string
  - ./outside/LinkPage default: new required prop texts: LinkTexts
  - ./outside/LinkPage default: new required prop title: string
  - ./outside/LinkPage default: new required prop verb: string
  - ./outside/LinkPage default: prop initial narrowed: 'changed' | 'done' | 'expired' | 'failed' | 'not-valid' | 'ready' | 'used' | 'working' -> 'changed' | 'done' | 'expired' | 'failed' | 'not-valid' | 'ready' | 'used'
  - ./outside/OutsidePage default: new required prop product: OutsideProduct
  - ./outside/ReadOnlyPage default: new required prop initial: 'expired' | 'not-valid' | 'ready'
  - ./outside/ReadOnlyPage default: new required prop product: OutsideProduct
  - ./outside/ReadOnlyPage default: new required prop title: string
  - ./outside/ReadOnlyPage default: new required prop until: string
  - ./outside/ReadOnlyPage default: new required snippet children()
  - ./outside/RecoveryPage default: new required callback addPasskey: () => Promise<Refused<'cancelled' | 'failed'> | WithCode>
  - ./outside/RecoveryPage default: new required callback notNow: () => Promise<Refused<'failed'> | WithCode>
  - ./outside/RecoveryPage default: new required callback ondone: Done
  - ./outside/RecoveryPage default: new required callback recoveryCode: (email: string, code: string) => Promise<Refused<'code-wrong' | 'paused' | 'paused-100'> | { ok: true; }>
  - ./outside/RecoveryPage default: new required callback setupCode: (code: string) => Promise<Refused<'paused' | 'setup-used' | 'setup-wrong'> | { ok: true; }>
  - ./outside/RecoveryPage default: new required prop product: OutsideProduct
  - ./outside/RecoveryPage default: prop initial removed
  - ./outside/SignInPage default: new required callback addPasskey: Passkey
  - ./outside/SignInPage default: new required callback deviceCode: (email: string, code: string) => Promise<Refused<'code-expired' | 'code-wrong'> | { ok: true; }>
  - ./outside/SignInPage default: new required callback ondone: Done
  - ./outside/SignInPage default: new required callback passkey: Passkey
  - ./outside/SignInPage default: new required prop links: { recovery: string; }
  - ./outside/SignInPage default: new required prop product: OutsideProduct
  - ./outside/SignInPage default: prop initial removed
  - ./parts/ComponentMenu: export path removed
  - ./ui/sidebar useSidebar: type SidebarStateProps: member open type changed: Getter<boolean> -> () => boolean
  ```

  The type of `open` is the same: `Getter<boolean>` was a local name for
  `() => boolean`, so a product changes nothing.

  The nine lines of `./email` ask nothing of a product. v1.0.0 did not
  ship the email module, so the diff reads the file of the preview at
  v1.0.0, and no product imported a name of it. A product that copied
  the module deletes its copy, as the table below says.

  Take one step for each part:
  - `outside/OutsidePage`, `outside/SignInPage`, `outside/RecoveryPage`,
    `outside/LinkPage` and `outside/ReadOnlyPage`: v1.0.0 held these
    pages only as pages of the preview, with sample data, and its
    package did not ship them. Now each page takes the `product`, and
    one function for each call to the server of the product.
    `svelte-check` names a page that lacks a required one. A product
    with its own sign-in page keeps its route, deletes the body of the
    page, and renders the page of STACK. SignInPage takes `passkey`,
    `addPasskey`, `deviceCode`, `ondone` and `links.recovery`, and
    `appCode` for the form of an authenticator app. RecoveryPage takes
    `addPasskey`, `notNow`, `recoveryCode`, `setupCode` and `ondone`.
    The prop `initial` of both pages goes. The new SetupLinkPage takes
    `addPasskey`, `notNow` and `ondone`. LinkPage takes `title`,
    `text`, `verb`, `texts`, `facts`, `initial` and `act`. Its
    `initial` has no `working` state, and it takes `done` and `failed`,
    so that a page with no script answers the POST with the page in its
    next state. ReadOnlyPage takes `title`, `initial`, `until`, which is
    a date that the product writes, and the content as children. Each
    function except `ondone` returns `{ ok: true }`, or a refusal
    `{ ok: false, state }` with the state that the page shows, and
    `until` where a pause ends. `addPasskey` and `notNow` of
    RecoveryPage and SetupLinkPage add the new recovery code, as
    `{ ok: true, recoveryCode }`, and `act` can add `facts`. `ondone`
    returns nothing, or a Promise.
    LinkPage shows no link that opens the object, and no report that
    signs in first.
  - `parts/ComponentMenu`: the component menu is a tool of the preview,
    and the package does not ship it. A product that copied it keeps
    the copy as code of its own.
  - `parts/SelectionBar`: while one or more rows are selected, the bar
    takes the place of the content of the top bar from 768 px, and of
    the phone header below 768 px, through `FramePlace`. With no
    `FramePlace` of that name, the bar shows where the page puts it,
    such as in a card. The bar says the count in the live region of the
    place, or in a region of its own. Delete the live region of the
    page that said the count, and a store that moved the bar into the
    top bar. Keep the bar in the page at a count of 0, so that its
    region says "Selection cleared". An action with a submenu goes into
    the `menu` snippet, because a `SelectionAction` has no submenu
    form.
  - `parts/CodeBlock`, `parts/CodeEditor` and `parts/Diff`: the `class`
    goes on a new root element, with the `data-slot`
    `code-block-wrapper`, `code-editor-wrapper` or `diff-wrapper`. The
    box keeps its `data-slot` (`code-block`, `code-editor`, `diff`),
    and it no longer takes the class. A class that places the part,
    such as a margin, a width or a `max-h-` class, still works. A class
    that changed the look of the box, such as `rounded-none`, has no
    effect now. Remove it, or propose the look.
  - `parts/ListSplit`: below 768 px the item column does not show, and
    the keys of the list do nothing. A page that showed its item in the
    column below 768 px gives the item a screen of its own, as "Band 1"
    in `### Width bands` of `DESIGN.md` says.
  - `parts/TimeField` and `parts/TimeZoneField`: v1.0.0 held them only
    as showcase files of the preview. A field of a product that copied
    a showcase imports the part. TimeField needs `label` and `locale`,
    and TimeZoneField needs `locale`. Bind `error` of TimeField, so
    that the same error shows again after a new time clears it.

  The migration table names each kind of file that a product can hold
  in place of a part of v2.0.0: a part of its own, or a copy of a file
  of STACK. Each export path follows `@stack-kit/stack/`. Search the
  product for each word of the Find column. A hit is code that a part
  of the release now owns. A hit in an import of `@stack-kit/stack/` is
  the part itself.

| What the product holds, by role | Find | STACK export | Props and functions | Step |
|---|---|---|---|---|
| an own list split: a list column and an item column | `ListSplit.svelte`, `headLabel` | `parts/ListSplit` | `address`, `listLabel`, `itemLabel`, `list`, `item(layout)`, `head` | Delete the own part. Give the band across both columns as `head`. The `item` snippet takes the layout, `'item'` or `'pane'`. |
| an own row of a list split | `SplitRow.svelte`, `data-key` | `parts/SplitRow` | `key`, `checked`, `oncheck`, `selected`, `unread`, `lines`, `lead`, `line1` to `line3`, `end1` to `end3` | Delete the own part. Inside a list split with an `address`, give each row its `key`. The part draws the check box from `checked` and `oncheck`. |
| own item columns: the content of an item beside its properties | `ItemColumns.svelte` | `parts/ItemColumns` | `content`, `header`, `properties`, `sideLabel` | Delete the own part. Name the properties with `sideLabel`. Put the head of the item into `header`, not into a padded box around the part. |
| an own module of the split: the width bands, the item in the address and the first row | `get('item')`, `closeItem` | `behaviour/item`, `behaviour/width` | `itemInAddress({ shown, onread, href, keysOff, itemParams })`, `bands.md`, `bands.lg` | Delete the module, and the page code that reads or writes the item. Give the result of `itemInAddress` to the list split as `address`. |
| an own selection bar, and a store that moves it into the top bar | `SelectionBar.svelte`, `selection = ` in the top bar | `parts/SelectionBar`, `parts/FramePlace` | `count`, `page`, `total`, `all`, `actions`, `onpage`, `onall`, `onclear`, `menu`; FramePlace `name` | Delete the own bar, the store and the live region of the count. Wrap the content of the top bar and of the phone header in FramePlace. |
| an own toast with Undo, and its Cmd+Z | `toastWithUndo(`, `label: 'Undo'` | `behaviour/undo` | `undoToast(text, { undo, id, duration })` | Delete the own module, and call `undoToast`. Cmd+Z runs `undo` while the toast shows. |
| an own dialog of one short form | `FormDialog.svelte` | `parts/FormDialog` | `id`, `title`, `description`, `short`, `action`, `onsubmit`, `runKey`, `wide`, `disabled`, `cancelLabel`, `open`, `onOpenChange`, the fields as children | Delete the own part. |
| an own button that a rule blocks | `ReasonButton.svelte`, `aria-disabled` on a button | `parts/ReasonButton` | `reason`, `describedby`, `variant`, `size`, `href`, `type`, `onclick` | Delete the own part. |
| an own menu item that a rule blocks | `ReasonMenuItem.svelte` | `parts/ReasonMenuItem` | `label`, `reason`, `onSelect` | Delete the own part. |
| an own check box that a rule holds | `HeldCheckbox.svelte` | `parts/HeldCheckbox` | `checked`, `reason`, `aria-label`, `describedby` | Delete the own part. |
| an own table cell with no value | `Gap.svelte`, an em dash in a cell | `parts/Gap` | `reason` | Delete the own part. Give the reason that a screen reader says. |
| own keys of the shell: Cmd+Z, the keys of a list, the text-field rule and a registry of keys | `GlobalKeys`, `svelte:window onkeydown` | `behaviour/keys` | `provideKeys(keyOf)`, `matches(e, key)`, `keyHint(action)`, `bindKey`, `onEscape`, `DEFAULT_KEYS` | Delete the own Cmd+Z and the keys of the list. The frame keeps its own keys, such as Cmd+K, `?`, `[` and G then a letter. A key of the frame calls `matches(e, key)`, which holds the text-field rule. A sequence such as G then a letter calls `inText(e)`, because `matches` never matches a sequence. Give the keys that a person chose to `provideKeys(keyOf)`. |
| an own text-field rule of the keys of the frame | `inTextField`, `isContentEditable` | `behaviour/keys` | `inText(e)` | Delete the own rule. A key of the frame that `matches` cannot read calls `inText(e)`, and runs only when it returns false. |
| a copy of the email module | `blockLines(`, `footLines(` | `email` | `html(email, colors)`, `text(email)`, `Email`, `Colors`, `ROLES` | Delete the copy and its own list of the roles, and import the module. |
| an own page with no session: the head line, one column, the title and the state | `AuthPage`, `navigator.credentials` | `outside/OutsidePage`, `outside/SignInPage`, `outside/RecoveryPage`, `outside/SetupLinkPage` | `product`, `title`, `tab`, `text`, `noscript`, and the functions of each page in the steps above | Keep the route, and delete the body of the page. |
| an own state line under the buttons of a page outside the frame | `StateLine.svelte` | `outside/StateLine` | `kind` (`wait`, `cancel`, `fail`), `text`, children | Delete the own part. |
| an own code input of a sign-in | `CodeInput.svelte`, `InputOTP` | `outside/CodeInput`, `outside/codes` | `kind` (`device`, `app`), `value`, `invalid`; `CODE_PATTERN`, `readCode`, `pasteCode` | Delete the own part. |
| an own band of key figures | `FigureBand.svelte` | `parts/FigureBand` | `label`, `figures` (`label`, `value`, `note`, `href`, `trend`), `inset`, `loading` | Delete the own part. Format each value in the page, and give it as a string. |
| an own meter that turns to warning past a share of the maximum | `warnAt`, `Meter.svelte` | `parts/Meter` | `value`, `max`, `label`, `figure`, `ticks` | Delete the own part. Give the share as a tick: `{ at, name, role: 'warning', text }`. |
| an own reader of the chart values of `DESIGN.md` at build time | `DESIGN.md?raw`, `readChart` | `patterns` | `PATTERNS`, `chartColor`, `heatColor`, `HEAT_STEPS` and the other exports of `patterns` | Delete the reader and its step in the Vite config. The chart parts and `patterns` read the values of the release. |
| a copy of the board | `Board.svelte` | `parts/Board` | `blocked`, `onmove(item, from, to, undo)`, `menu` | Delete the copy. A rule that keeps a card out of a column goes into `blocked`. |
| a copy of the reorder list | `ReorderList.svelte`, `{#snippet more(`, `more=` | `parts/ReorderList` | `blocked`, `menu`, `onsave`, `fixed`, `readonly` | Delete the copy, and rename `more` to `menu`. A row that never moves goes into `fixed`, and a locked list takes `readonly`. |
| a copy of the diff | `Diff.svelte` | `parts/Diff` | the props of v1.0.0, and `ref` | Delete the copy. A class that changed the look of the box has no effect now. |
| a copy of the code block | `CodeBlock.svelte` | `parts/CodeBlock` | the props of v1.0.0, and `ref` | Delete the copy. A class that changed the look of the box has no effect now. |
| a copy of the QR code | `QrCode.svelte` | `parts/QrCode` | the props of v1.0.0, and `ref` | Delete the copy. |
| a copy of the classes of a read-only check box | `checkbox-readonly` | `parts/HeldCheckbox` | `checked`, `reason` | Delete the copy, and replace each box that takes the classes by HeldCheckbox. The package exports no path to the classes. |
| a copy of the width query that answers for the paper in print | `screen-query.svelte`, `new ScreenQuery(`, `new MediaQuery(` | `behaviour/width` | `bands.md`, `bands.lg`, `bands.xl`, `bands['2xl']`, `ScreenQuery`, `isPrinting` | Delete the copy and each own width query, and read the band of its line. |
| a copy of the time chart | `TimeChart.svelte` | `parts/TimeChart` | the props of v1.0.0, with `style` and `ref` | Delete the copy. The part fits the column of the paper in print. |
| a copy of the line tile | `LineTile.svelte` | `parts/LineTile` | `look` | Delete the copy. |
| a copy of the pattern chart | `PatternChart.svelte`, `time-bar` | `parts/PatternChart` | the props of v1.0.0, with `kind`, `tick` and `style` | Delete the copy. A `time-bar` chart becomes `stacked-bar`, and `tick` gives the short name of each x value. |
| a copy of the chart legend | `PatternLegend.svelte` | `parts/PatternLegend` | `categories`, `context`, `prefix`, `style` | Delete the copy. |
| a copy of the chart tile | `PatternTile.svelte` | `parts/PatternTile` | `n`, `prefix`, `style` | Delete the copy. |
| a copy of the pattern definitions, also under another name | `PatternDefs.svelte`, `<pattern` | `parts/StackPatternDefs` | `prefix`, `style` | Delete the copy, and import the part by its name. |
| a copy of the heat map | `HeatMap.svelte` | `parts/HeatMap` | the props of v1.0.0, with `style` | Delete the copy. |
| a copy of the chart helpers | `patterns.ts` | `patterns` | `PATTERNS`, `chartColor`, `markColor`, `lineLook` and the other exports | Delete the copy. |
| the classes that make a dialog fill the screen below 768 px | `phoneFull`, `max-md:inset-0` | `stack.css` | none | Delete the classes from each dialog and alert dialog. `stack.css` draws the form. |
| a copy of the part that closes the sheet of the sidebar after a link | `CloseSheetOnNavigate.svelte` | `parts/CloseSheetOnNavigate` | children, optional | Delete the copy. Put the part once inside `Sidebar.Provider`. |

### Behaviour

- Below 768 px, each dialog and each alert dialog of the kit fills the
  screen, with its content at the top and the four safe-area insets.
  `stack.css` draws the form, and the rule beats the place, the width
  and the radius classes of the content. Before, each product gave the
  phone classes to each dialog. Those classes now do nothing more.
- An empty state of the kit (`[data-slot=empty]`) is never centered:
  its content starts at the left edge, 32 px under the top of its
  region. The rule of `stack.css` comes after the utilities of
  Tailwind, so it beats the center and the padding classes of the
  component, and also a padding class of a page of the same weight,
  such as `px-4 md:px-6`. A class with `!` beats the rule: an empty
  state with an edge takes `border p-6!` (`### empty` in `DESIGN.md`).
- A link button of the kit with `aria-disabled="true"` draws at 50%.
- The text of a toast takes the body step in the sans font of the
  theme, and its description takes `muted-foreground`.
- While the Undo toast of a move on the board or on the reorder list
  shows, Cmd+Z runs its Undo (Ctrl+Z on each system other than macOS).
  In a text field, Cmd+Z does nothing to the toast. The key ends when
  the toast closes or times out.
- When a page gives `blocked` to the board or to the reorder list, a
  move that the rule blocks stops: the card or the row stays, and the
  sentence of the rule shows in a toast and in the live region. Move to
  in the More menu of a card shows the sentence as its reason. When
  `onmove` or `onsave` returns a Promise that rejects, the card or the
  row goes back, and the part says so in a toast and in the live
  region. Undo shows only after the Promise resolves. On the reorder
  list, `blocked(item, to)` checks only the row that moves. For a rule
  of another row, the product rejects the Promise of `onsave`, and the
  row goes back.
- The reorder list counts its `fixed` rows first, so the live region
  says the place of a row as "position n of m" over all the rows.
- When a page gives a list split an `address`, the open item is in the
  web address, such as `?item=QUO-0042`, so a reload and a link keep
  it. `?item=` with no value keeps the item column closed. From
  1024 px, with no item in the address, the column shows the first row,
  which stays unread, and the address does not change. From 768 px, J
  and Down show the next row, K and Up the row before, and Enter opens
  the item on its full page when the page gives `href`. Esc closes the
  item column after an open layer and after the selection, and the
  focus goes back to the row.
- The selection bar clears the selection on Esc. With the More menu
  open, the first Esc closes only the menu. At a count of 0 the bar
  shows nothing. Before, it showed the text "Selection cleared". Its
  live region still says "Selection cleared" when the count falls to 0.
- The bands of the parts are in rem, as the breakpoints of the CSS are.
  So with a larger font in the browser, the selection bar and the list
  split change their form at the same width as the `md:` and `lg:`
  classes.
- A page that reads `bands.md` of `behaviour/width` in place of an own
  width query takes the narrow form of the column of the paper in
  print, before the layout. Each chart fits the column of the paper in
  print when the root layout calls `listenForPrint()`.
- A stacked chart of one category shows no legend, because its caption
  names the metric. When the names of the x values do not fit under
  the bars, the axis names every nth x value. When the value of a bar
  is wider than its bar, only the tallest bar shows its value.
- The `class` of HeatMap, PatternChart and TimeChart: a height class,
  such as `h-56`, sizes the chart container, as in v1.0.0. Each other
  class now places the root of the part. The legend of PatternLegend
  has a new `div` root, with `data-slot="pattern-legend"`.
- The sections of the properties of ItemColumns stand 16 px apart.
  Before, they had no gap.
- CodeBlock, Diff, ReasonButton and HeldCheckbox give their own tooltip
  provider. So a delay on the root `Tooltip.Provider` of a product does
  not reach their tooltips.
- When a code function of SignInPage or RecoveryPage rejects, the field
  shows "This app could not check the code. Choose Continue to try
  again." After its step, RecoveryPage shows the new recovery code
  once, and Continue then runs `ondone`.
- The global CSS of a product grows, because the `@source` lines of
  `stack.css` make Tailwind scan every part of the package, also a part
  that the product does not import. In a test move of one product, the
  global CSS file grew from 184.43 kB to 242.03 kB, and from 28.23 kB
  to 35.55 kB with gzip.
- The contract diff from v1.0.0 gives the Behaviour lines below.
  v1.0.0 documented no behaviour in its contract, so each documented
  behaviour shows as added, also a behaviour that v1.0.0 had, such as
  N and Shift+N in the diff, or a click on an item of the chart legend.

  ```text
  - ./parts/Board default: behaviour blocked added
  - ./parts/Board default: behaviour keys:undo added
  - ./parts/Board default: behaviour put-back added
  - ./parts/Board default: behaviour undo added
  - ./parts/CodeEditor default: behaviour escape:kept added
  - ./parts/Diff default: behaviour next-change:N added
  - ./parts/Diff default: behaviour previous-change:Shift+N added
  - ./parts/HeatMap default: behaviour print:fit-column added
  - ./parts/ListSplit default: behaviour escape:item added
  - ./parts/ListSplit default: behaviour first-row added
  - ./parts/ListSplit default: behaviour item-in-address added
  - ./parts/ListSplit default: behaviour keys:next-row,previous-row,open-item added
  - ./parts/ListSplit default: behaviour read added
  - ./parts/PatternChart default: behaviour print:fit-column added
  - ./parts/PatternLegend default: behaviour highlight-series added
  - ./parts/PatternLegend default: behaviour toggle-series added
  - ./parts/ReorderList default: behaviour blocked added
  - ./parts/ReorderList default: behaviour keys:undo added
  - ./parts/ReorderList default: behaviour put-back added
  - ./parts/ReorderList default: behaviour undo added
  - ./parts/SelectionBar default: behaviour escape:selection added
  - ./parts/SelectionBar default: behaviour live-region added
  - ./parts/SelectionBar default: behaviour place:top-bar,phone-header added
  - ./parts/Sparkline default: behaviour print:fit-column added
  - ./parts/StackPatternDefs default: behaviour print:marks-as-shapes added
  - ./parts/TimeChart default: behaviour print:fit-column added
  ```

### Added

- New parts:
  - `parts/Banner`: a banner under the top bar, across the list and the
    pane, with `title`, `tint` (`info`, `success`, `warning`,
    `destructive`), and the snippets `icon`, `action` and children.
    The part takes the role `alert` for `destructive` and `status` for
    the other tints. A `role` that the page gives wins, such as
    `role="alert"` for a warning that must speak at once.
  - `parts/CloseSheetOnNavigate`: it closes the sheet of the sidebar
    after a link opens a page.
  - `parts/FormDialog`: a dialog of one short form. Below 768 px it is
    a form screen with Cancel, the title and the action in its header.
    It puts the focus in the first field, and with `runKey`, Cmd+Enter
    runs the action.
  - `parts/FramePlace`: a place of the frame, `top-bar` or
    `phone-header`, that a part such as the selection bar takes, with a
    polite live region.
  - `parts/Gap`: a table cell with no value: a muted em dash that a
    screen reader skips, and a hidden text, `reason`.
  - `parts/HeldCheckbox`: a check box that a rule holds, with `checked`
    and `reason`. It stays in the tab order, and a click or Space does
    not change it.
  - `parts/PageColumns`: the main column of a page, and an optional
    `side` column with `sideLabel`, which stands at the right from
    1280 px.
  - `parts/ReadingColumn`: a column of running text, at most 720 px
    wide, at the start edge of its region.
  - `parts/ReasonButton`: a button that a rule can block. With a
    `reason`, it stays in the tab order, and a tooltip and a line give
    the reason.
  - `parts/ReasonMenuItem`: a menu item that a rule can block, with
    `label`, `reason` and `onSelect`.
  - `parts/SummaryBands`: the bands of a summary page. Each child is one
    band.
  - `parts/TimeField` and `parts/TimeZoneField`: the time field and the
    time zone field.
  - `outside/SetupLinkPage`, `outside/StateLine`, `outside/CodeInput`
    and `outside/codes` (`CODE_PATTERN`, `readCode`, `pasteCode`).
- The behaviour modules:
  - `behaviour/item`: `itemInAddress(options)` with `shown`, `param`,
    `itemParams`, `onread`, `href` and `keysOff`. It gives `key`,
    `open`, `firstRow`, `keysOff`, `show`, `step`, `close`, `openPage`
    and `rowId`. Also `setItemContext` and `getItemContext`.
  - `behaviour/keys`: `KeyAction` (`undo`, `escape`, `next-row`,
    `previous-row`, `open-item` and `submit`), `DEFAULT_KEYS`, `KeyOf`,
    `provideKeys`, `bindKey`, `matches`, `inText`, `keyHint` and
    `onEscape`. `inText(e)` is the text-field rule of `matches`, for a
    key of the frame that `matches` cannot read, such as G then a
    letter. A control with `data-keys-enter` gives its Enter to the
    bindings.
  - `behaviour/place`: `PlaceName`, `claimPlace` and `announce`.
  - `behaviour/print`: `listenForPrint` and `registerChart`.
  - `behaviour/undo`: `undoToast(text, { undo, id, duration })` and
    `UndoOptions`.
  - `behaviour/width`: `bands` (`md`, `lg`, `xl`, `2xl`), `ScreenQuery`
    and `isPrinting`.
- The export path `@stack-kit/stack/email`: `html(email, colors)` gives
  the HTML part of an email of `## Email` in `DESIGN.md`, with inline
  styles, and takes the colors of `### Email colors`. `text(email)`
  gives the plain text part. The path also exports `blockLines`,
  `ROLES`, `SANS` and the types `Email`, `Block`, `Colors`, `Role`,
  `StateRole`, `Link`, `Fact`, `Figure` and `Table`. `html` and
  `blockLines` throw an Error when a color is not a hex value (`#rgb`,
  `#rrggbb` or `#rrggbbaa`), and `html` throws when an address does not
  start with `https://`, so a value never carries markup into the
  email.
- Each of the 50 parts of `parts/` and `outside/` has the five
  extension points: its `<Name>Props` type, `bind:ref`, the other
  attributes of its root element, a `class` that `cn()` merges on the
  root, and a `data-slot` on the root. The contract diff lists each
  point that a part of v1.0.0 lacked.
- New props, callbacks and snippets of the parts of v1.0.0:
  - `parts/Board`: `blocked(item, column)`. `onmove` widens: it takes
    `undo` as a fourth argument, and it can return a Promise.
  - `parts/ReorderList`: `blocked(item, to)`, `fixed`, `readonly` and
    the snippet `menu(item)`. `onsave` can return a Promise.
  - `parts/ListSplit`: `address` and the snippet `head`. The snippet
    `item` takes the layout, and the type `ListSplitLayout` names it.
    `open` becomes optional.
  - `parts/SplitRow`: `key`, `checked` and `oncheck`. `id` becomes
    optional.
  - `parts/ItemColumns`: `sideLabel`.
  - `parts/SelectionBar`: the snippet `menu`.
  - `parts/PatternChart`: `tick`.
  - `parts/CodeBlock`: `copyValue` widens to `string | undefined`.
    `parts/MailMessage`: `onopenfile` widens to take `undefined`.
  - `parts/FlowTable`, `parts/Meter` and `parts/TableTree`: `class`.
    FlowTable and TableTree have a new `div` root (`flow-table`,
    `table-tree`) that takes the class. The table keeps its `data-slot`
    `table`.
  - `outside/OutsidePage`: `text`, `noscript` and `titleRef`.
    `outside/SignInPage`: `appCode`, `action` and `codeHelp`.
    `outside/RecoveryPage`: `action`. `outside/LinkPage`: `resend`,
    `action`, `requestId` and `variant`. `outside/ReadOnlyPage`:
    `text`.
- New types and values: `Transition` of FlowTable, `Tick` of Meter,
  `LinkFailed`, `LinkState`, `LinkTexts` and `NOT_VALID` of LinkPage,
  and `Done`, `OutsideProduct`, `OutsideRoot`, `Passkey` and `Refused`
  of OutsidePage.
- New `data-slot` names: `list-split`, `list-split-head`,
  `list-split-list`, `list-split-item`, `split-row`, `item-columns`,
  `item-columns-properties`, `selection-bar-actions`,
  `selection-bar-more`, `selection-bar-clear`, `reorder-list-wrapper`,
  `code-block-wrapper`, `code-editor-wrapper`, `diff-wrapper`,
  `heat-map`, `pattern-chart`, `pattern-legend`, `pattern-tile`,
  `line-tile`, `stack-pattern-defs`, `sparkline`, `time-chart`,
  `flow-table`, `meter`, `table-tree`, `outside-page`,
  `outside-page-title`, `sign-in-page`, `recovery-page`, `link-page`,
  `read-only-page` and `facts`.
- The export path `@stack-kit/stack/architecture/keys.json`, which the
  key test of a product reads.
- `preview/contract.json`: the contract of the release. For each export
  path that holds code, it gives each name that the path exports, and
  for a part its props, callbacks, snippets, `data-slot` names and
  documented behaviour. The file is 441.8 kB of the 2.6 MB of the
  unpacked package, and the packed package is 619.0 kB.
- The `###` definition of each part in `DESIGN.md` names its export
  path.

### Fixed

- The check of the public repository failed on v1.0.0 at `npm ci` in
  `preview/`, with ERESOLVE: `sveltekit-superforms` 2.31.0 accepts only
  `@sveltejs/kit` 1.x or 2.x, and the preview pins SvelteKit 3. The
  preview now pins `sveltekit-superforms` 3.1.0 and `formsnap` 2.1.0,
  which accept SvelteKit 3, and the form showcase calls `superForm()`.
  A product still builds each form with `field`, because the
  `packages` list of `form` in the record holds `@sveltejs/kit` and
  `vite` (`### form` in `DESIGN.md`).
- DayLog renders on a runtime with no `Intl.DurationFormat`, such as a
  server on Node 22. Before, it threw.
- TimeChart with no rows, and with two metrics or a comparison line,
  draws, and its labels stand at 0. Before, it threw.
- Meter keeps `aria-valuenow` inside 0 to `max`, also for a value past
  its limit. Before, a value past `max` went to `aria-valuenow`.
- The legend of HeatMap has the name "The steps of the heat map" for a
  screen reader. Before, it had no name.

## v1.0.0 - 2026-10-27

### Breaking

- Each release now comes from the public repository
  `https://github.com/stack-kit/stack`. A read of a release needs no
  GitHub login and no key ("Use a release in a product" in
  `README.md`). The package name stays `@stack-kit/stack`. In
  `README.md`, each command that prints the newest tag, clones a tag
  or reads a change log uses the public https address. The change log
  of a tag now comes through `curl` with no login. Before, it came
  through the GitHub API with a `gh` login. A product on v0.9.0 takes
  these steps at this update:
  1. Replace the whole dependency line in `package.json` with this
     line. Then run `npm install`:
     `"@stack-kit/stack": "git+https://github.com/stack-kit/stack.git#v1.0.0"`.
     npm writes the SSH form
     `git+ssh://git@github.com/stack-kit/stack.git#<commit>` into
     `package-lock.json`. But `npm ci` reads the public repository
     over https. So a build host with no SSH key installs the tag
     ("Pin a release with npm").
  2. A project with no Node points its reference clone to the public
     repository with
     `git -C _reference/stack remote set-url origin https://github.com/stack-kit/stack`.
     Then it fetches the tag, as "Update a product to a new release"
     says.
  3. Replace the design line in `AGENTS.md` with the line of "Follow
     the rules for a product" in `README.md`. Its source and its tag
     check name `https://github.com/stack-kit/stack`.
- A proposal is a pull request into `main` of `stack-kit/stack` from a
  branch `proposal/<topic>` of a fork ("Contribute from a product" in
  `README.md`). Before, the branch was `proposal/<product>/<topic>` in
  the repository itself. "Open the pull request" gives the new steps,
  and they still need a `gh` login. A product opens no issue for a
  proposal. Only a release changes `main`
  of `stack-kit/stack`, so STACK merges no pull request. When STACK
  accepts a proposal, it takes the ready change in, or it writes the
  change itself. The next release carries the change. STACK then
  closes the pull request with a link to that release. When STACK
  declines a proposal, it closes the pull request with the reason. A
  ready change under `preview/` also passes `npm ci`, `npm run check`
  and `npm run build:static` in `preview/`, on Node 22.17 or later.
- `### Type steps` and "Phone type" in `### Width bands`: the new type step
  `reading-phone` sets running text to 15 px on a 22 px line below
  768 px. Before, running text kept the `reading` step on a phone,
  14 / 21 px. Now it is as large as the 15 px `body` text around it.
  `stack.css` and `stack-plain.css` change `--text-md` in the phone
  media query, so every `text-md` class follows with no new class. So
  five type steps grow below 768 px, not four. The body, an open quote
  and the translation of a `mail-message` take the step, and so does a
  diff of text (`### diff`). A product that imports `stack.css` or
  `stack-plain.css` changes no code.
- `### figure-band`: a band holds one to four key figures. Before, it
  held two to four. A page with one key figure shows it in a band of
  one under the title of the page, with no card. The list of a band of
  one takes `grid-cols-1` in place of `grid-cols-2`, and its figure
  takes `justify-self-start`. So the figure stands at the start of the
  band, also on a phone, and it is as wide as its parts. The line
  under it crosses the band. `FigureBand.svelte` of the preview takes
  a band of one. A product that copied `FigureBand.svelte` copies it
  again. A product that shows one key figure in a card moves it into a
  band of one.
- "Sorting and search" in `architecture/web-app.md`: the search fold
  changes both texts to lower case, and then it replaces four letters
  that NFD does not split. It replaces ß with ss, ł with l, ø with o,
  and U+0111, the d with a stroke, with d. This order also covers ẞ,
  Ł, Ø and U+0110. Before, the fold replaced only U+0111 and U+0110,
  and it changed the case last. So "strasse" now finds "Straße", and
  "muller" still finds "Müller". A product that folds search text adds
  the three new replacements after the change to lower case.

### Added

- "Make a theme with the generator" in `README.md`: a product makes its
  own theme with the theme generator, `scripts/generate.mjs`. The
  generator takes a base color, an accent color and a contrast level
  from 0 to 100. It writes a theme file with every color role of
  `DESIGN.md` in light and in dark, and `--radius`. The generator
  needs the dev dependencies of STACK, so the npm package does not
  carry it. A product clones its pinned tag into a temporary folder and
  runs `npm ci` there. Then it runs the generator from its own root
  folder, and `--out` names the theme file as a path from that folder.
  When a pair of the contrast check fails, the generator moves the
  lightness of the value until the pair passes. It prints each value
  that it moved. It refuses a theme that fails, with exit code 1. At
  each update, run the command again from a clone of the new tag. The
  first line of the theme file gives the inputs. A block of the Theme
  tab of the create page stays the second way ("Take a theme from the
  Theme tab").
- `CONTRIBUTING.md` of the public repository gives the route of a
  proposal for every contributor. It also gives the checks to run
  before the push of a ready change, and the licence of a
  contribution. A contribution is under the MIT licence of `LICENSE`.
- `scripts/hooks/stack-checks.sh`: the checks of the `pre-commit` hook,
  in one script. It runs the theme check, the names check and the
  markers check on the staged files. It refuses the commit when
  `CHANGELOG.md` has no heading for the version in `package.json`. It
  also refuses every commit when `node` or the packages of `npm ci`
  are missing. The `pre-commit` hook in `.githooks/` runs the script.
  Before that, the hook refuses a staged path with a part that starts
  with `_`, and an embedded repository. The `commit-msg` hook runs the
  names check on the message. To turn the hooks on in a clone, run
  `git config core.hooksPath .githooks`.

### Fixed

- `### table`: below 768 px the header row of a tree is 44 px high
  (`max-md:h-[44px]` on its `Table.Row`). So a box in it, such as
  "Select all", has a target of 44 by 44 px. A product with a tree adds
  the class. `TableTree.svelte` of the preview has it. Before, the
  header row was 40 px, so a tap reached only 40 px of the height of
  that target.
- Step 1 of "Update a product to a new release" in `README.md` copies
  again only the folders that the release holds. A `test -d` guard in
  its command keeps every other folder. The step of v0.9.0 removed a
  folder that the release does not hold, such as `trace`, and then its
  copy failed. A product that lost such a folder takes it back from its
  own git history. Any other folder of `src/lib/components/ui/` stays
  as code of the product, and it must work with the package versions
  of the lock.
- `preview/src/lib/components/ui/LICENSE.md`: the licence notice of
  shadcn-svelte also covers `utils.ts` and `hooks/is-mobile.svelte.ts`.
  They come from the same release of shadcn-svelte. Before, the notice
  named only the component folders and `shadcn-svelte.css`. A product
  copies `LICENSE.md` again at this update, as step 1 of "Update a
  product to a new release" says.
