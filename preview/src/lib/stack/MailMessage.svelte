<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** A person in the header of a mail: the name when the mail holds one, and the address. */
	export type MailPerson = { name?: string; address: string };
	/** A file of a mail, with its size in words, such as "182 KB". */
	export type MailFile = {
		name: string;
		size: string;
		image?: boolean;
		/** The address of the picture on the host of the content that the product did not write. The part checks nothing about the address: the product serves it from its content host after the checks of the rule of Picture in ### mail-message of DESIGN.md. Give it only for a file that passes them. The file then shows its picture, and its trigger opens the picture large. */
		picture?: string;
	};
	export type Mail = {
		id: string;
		from: MailPerson;
		to: MailPerson[];
		/** The count of the people that the product left out of to, when it gives only the first people. It shows after the last person, as "and 90 more". */
		toMore?: number;
		cc?: MailPerson[];
		/** The count of the people that the product left out of cc, as toMore. */
		ccMore?: number;
		/** Only a message that the product sent holds Bcc. A message that came in does not show it. */
		bcc?: MailPerson[];
		at: Date;
		/** The subject of the mail, when the product shows it, such as in a record that holds the mails of several threads. It shows on a line of its own at 500 between the header and the text, in the lang and dir of the mail. */
		subject?: string;
		/** The paragraphs of the plain text part. A blank line ends a paragraph, and a single line break stays in it as \n. */
		body: string[];
		/** The language of the body when it differs from the interface, and its direction. */
		lang?: string;
		dir?: 'ltr' | 'rtl' | 'auto';
		/** The quoted part of an earlier message, which the product found at the end of the body. Its paragraphs take the form of body. */
		quote?: string[];
		/** The address of the page of the HTML part on the host of the content that the product did not write: a signed link for this one message with a short expiry. The message then shows the HTML part as its sender designed it, in an HtmlFrame in place of the body and the quote, and Show as text gives the body and the quote back. Give body too: the folded line, Show as text and print read it. */
		frame?: string;
		/** A translation from an agent, which no person confirmed: the agent and the paragraphs, in the form of body. */
		translation?: { by: string; lang: string; body: string[] };
		/** True when the person reads the translation and not the language of the mail. The translation then comes first, and the original folds behind "Show the original". */
		translationFirst?: boolean;
		/** The text in the language of the team from which the product made a mail that went out in another language, in the form of body. Give it only while that text stays inside the team. It shows in the internal mark, and a mail with source shows no translation. proposal names the source of a text that no person confirmed, such as "Written by Mail agent": the mark then takes the dashed edge and a second badge. */
		source?: { lang: string; body: string[]; proposal?: string };
		/** True when the person reads the source and not the mail as sent. The source then comes first, and the mail as sent folds behind "Show the mail as sent". */
		sourceFirst?: boolean;
		files?: MailFile[];
		/** The line of a message that the product sent, such as "Sent by Mail agent for Marko Ellis". */
		sentBy?: string;
		/** Where the message came in or went out, in the words of the product, such as "Mail · Support · Spam". It shows on a line of its own after the recipients. */
		channel?: string;
		/** The icon of the channel, such as a Lucide icon, an icon that STACK ships in @stack-kit/stack/service-icons/ (WhatsApp, Viber, Telegram, Messenger, Instagram, Signal and Gmail), or the icon of another outside service that the product gives. It shows at 14 px before the words of channel, in the color of the line, or in the product- role that the component of the product sets. The words name the channel, so the icon takes aria-hidden. */
		channelIcon?: Component;
		/** The reason when a reply did not go out. */
		failed?: string;
		/** True while the person has not read the message. */
		unread?: boolean;
		/** True while the message is new in the record that shows it, such as a mail that joined the record by a rule. A badge says New. The product removes it when another item takes the column, as it does unread. */
		fresh?: boolean;
		/** 'in' for a message that came in, and 'out' for a message that the product sent or sends. A badge before the time says Sent or Received. */
		direction?: 'in' | 'out';
		/** The time at which a reply that waits goes out. Give it while the person can still undo the send, and remove it when the reply went out. */
		sendsAt?: Date;
		/** The words of the product for a reply that waits and that another person sent, such as "Riley Shaw's reply waits to go out." With sendsAt, the waiting line shows these words in place of the time left, and no Undo and no Send now. */
		waitingNote?: string;
	};

	/** An action of one message, such as a delete into the Trash, a forward or a download. */
	export type MailAction = {
		id: string;
		/** The action and the message, such as "Delete the mail from Ana Turner". It names the button, its tooltip and the item of More. */
		label: string;
		icon?: Component;
		/** A destructive action goes last in the More menu, after a separator. */
		destructive?: boolean;
		run: () => void;
	};

	/** The words of a mail message, in the language of the product. */
	export type MailMessageWords = {
		/** The word that starts the heading of an unread message, for a screen reader. */
		unread: string;
		/** The badge of a message that is new in its record (fresh). The word also starts the heading and the folded line. */
		fresh: string;
		/** The direction badges: a message that came in, a message that the product sent, a reply that waits to go out (sendsAt) and a reply that did not go out (failed). The word also starts the heading and the folded line. */
		received: string;
		sent: string;
		scheduled: string;
		notSent: string;
		/** The words before the people of To, Cc and Bcc. */
		to: string;
		cc: string;
		bcc: string;
		/** The end of a list of people that the product cut (toMore, ccMore), with the count, and the count in the number format of locale. */
		more: (n: number, count: string) => string;
		/** The words that a screen reader speaks in place of more, with the count, and the count in the number format of locale. They say what the count counts, as a whole phrase. */
		moreSpoken: (n: number, count: string) => string;
		/** The button of the quoted text, and the button that folds it again. */
		showQuote: string;
		hideQuote: string;
		/** The button of the original of a message that the person reads in its translation, and the button that folds it again. */
		showOriginal: string;
		hideOriginal: string;
		/** The badge of a translation from an agent, with the name of the agent (translation.by). */
		translatedBy: (agent: string) => string;
		/** The word of the badge of the internal mark around the source of a reply. */
		internal: string;
		/** The button of the mail as sent of a reply whose source comes first, and the button that folds it again. */
		showSent: string;
		hideSent: string;
		/** The badge of the HTML part of a mail with frame. */
		designed: string;
		/** The button that shows the text of a mail with frame, and the button that shows its HTML part again. */
		showText: string;
		showDesigned: string;
		/** The name of the frame for a screen reader, with the name of the sender. */
		frameTitle: (sender: string) => string;
		/** The line of a page with the state too-large. */
		tooLarge: string;
		/** The line of a page that posts nothing, and of an address that onframe did not give. */
		frameFailed: string;
		/** The line of a page that names remote pictures, and its button. */
		remote: string;
		loadPictures: string;
		/** The name of the group of the files, with the name of the sender. */
		files: (sender: string) => string;
		/** The name of the trigger of a file, with the name of the file. */
		open: (file: string) => string;
		/** The description of a picture that did not load. */
		pictureFailed: string;
		/** The button of the large view of a picture that opens the file, and the name of the button that closes the view. */
		openFile: string;
		close: string;
		/** The line of a reply that did not go out, with the reason of the product (failed), and its button. */
		failed: (reason: string) => string;
		retry: string;
		/** The waiting line of a reply that waits: at its time, in the last minute with the seconds left and the count in the number format of locale, and before that with the time by its age. The part puts the time in a <time> element where it finds the time in the words. */
		sending: string;
		goesOutIn: (n: number, count: string) => string;
		goesOutAt: (time: string) => string;
		/** The buttons of the waiting line. */
		undo: string;
		sendNow: string;
		/** The name of the More button when the product gives no actionsLabel. */
		moreActions: string;
	};

	/** The words of a mail message in English, which the words of the product replace one by one. */
	export const MAIL_MESSAGE_WORDS: MailMessageWords = {
		unread: 'Unread',
		fresh: 'New',
		received: 'Received',
		sent: 'Sent',
		scheduled: 'Scheduled',
		notSent: 'Not sent',
		to: 'To',
		cc: 'Cc',
		bcc: 'Bcc',
		more: (_n, count) => `and ${count} more`,
		moreSpoken: (n, count) => `and ${count} more ${n === 1 ? 'recipient' : 'recipients'}`,
		showQuote: 'Show the quoted text',
		hideQuote: 'Hide the quoted text',
		showOriginal: 'Show the original',
		hideOriginal: 'Hide the original',
		translatedBy: (agent) => `Translated by ${agent}`,
		internal: 'Internal',
		showSent: 'Show the mail as sent',
		hideSent: 'Hide the mail as sent',
		designed: 'Designed by the sender',
		showText: 'Show as text',
		showDesigned: 'Show as designed',
		frameTitle: (sender) => `The message from ${sender}, as the sender designed it`,
		tooLarge: 'This mail is too large to show as designed.',
		frameFailed: 'This mail did not load as designed.',
		remote: 'Remote pictures stay off, so the sender does not learn that you opened this mail.',
		loadPictures: 'Load pictures',
		files: (sender) => `Files of the message from ${sender}`,
		open: (file) => `Open ${file}`,
		pictureFailed: 'Did not load',
		openFile: 'Open the file',
		close: 'Close',
		failed: (reason) => `Not sent. ${reason}`,
		retry: 'Retry',
		sending: 'Sending.',
		goesOutIn: (n, count) => `Goes out in ${count} ${n === 1 ? 'second' : 'seconds'}.`,
		goesOutAt: (time) => `Goes out at ${time}.`,
		undo: 'Undo',
		sendNow: 'Send now',
		moreActions: 'More actions'
	};

	export type MailMessageProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The root element, the <article> of the message. */
		ref?: HTMLElement | null;
		mail: Mail;
		/** Now, for the time by its age. */
		now: Date;
		locale?: string;
		timeZone: string;
		/** True while the message shows as one line. The thread folds each read message but the last. */
		folded?: boolean;
		/** The level of the heading of the message: one under the heading of the thread. */
		headingLevel?: 2 | 3 | 4;
		/** Sends a reply that did not go out (failed) again. The line of the reason shows Retry only when the product gives it. */
		onretry?: (() => void) | undefined;
		/** Opens a file from the host of the content that the product did not write. */
		onopenfile?: ((file: MailFile) => void) | undefined;
		/** The HTML part of a mail with frame, in place of the HtmlFrame that the part draws, such as an HtmlFrame with a line of the product about the pictures. It takes the mail and the address of its page (frame, or the address that onframe gave), and it renders inside the mark of the source. The product gives onpage and onfailure to its own frame, so the part shows no line of the page. */
		body?: Snippet<[Mail, string]> | undefined;
		/** Gives a new address of the page of a mail with frame, as the product shows the page now, such as with the copies after Load pictures, or rejects. The part calls it each time the frame mounts again after the first render, such as at Show as designed after Show as text, because the address of the page expires. The frame of the first render loads frame. A rejection, or no answer in 15 s, shows the text with the line of a page that posts nothing. */
		onframe?: (() => Promise<string>) | undefined;
		/** Loads the remote pictures of a mail with frame: the product gives a new frame, whose page holds copies of the pictures from its content host. The line of remote pictures shows Load pictures only when the product gives it. */
		onloadpictures?: (() => void) | undefined;
		/** Stops a reply that waits to go out (sendsAt). The waiting line shows Undo only when the product gives it. */
		onundo?: (() => void) | undefined;
		/** Sends a reply that waits at once. The waiting line shows Send now only when the product gives it. */
		onsendnow?: (() => void) | undefined;
		/** The actions of the message, in the order of their use. They end line 1. From 768 px with a pointer, one action with an icon is an icon button, and two or more stand in More. Below 768 px and on a touch screen, every action is an item of More. A folded message shows none. */
		actions?: MailAction[] | undefined;
		/** The name of the More button, such as "Actions of the mail from Ana Turner". With no actionsLabel, the button takes the word moreActions. */
		actionsLabel?: string | undefined;
		/** The words of the part in the language of the product. Each word that the product does not give stays as in MAIL_MESSAGE_WORDS. */
		words?: Partial<MailMessageWords> | undefined;
	};

	// A time by its age, as "Formats" in architecture/web-app.md says. The comment parts share it.
	import { age } from './age.js';
	export { age };
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { MediaQuery, SvelteSet } from 'svelte/reactivity';
	import { bands } from '#lib/stack/behaviour/width.js';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import ArrowDownLeftIcon from '@lucide/svelte/icons/arrow-down-left';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImageOffIcon from '@lucide/svelte/icons/image-off';
	import XIcon from '@lucide/svelte/icons/x';
	import HtmlFrame, { type FramePage } from './HtmlFrame.svelte';
	import InternalMark from './InternalMark.svelte';
	import UnreadMark from './UnreadMark.svelte';

	// One message of a mail thread (### mail-message in DESIGN.md): an <article> with no bubble and
	// no side. The header holds the avatar of 20 px, the name of the sender at 500, the address, the
	// time by its age and the unread mark. The recipients and the line of the sender follow in small
	// type, at the left edge of the name. The body is running text in the reading step, at most
	// 720 px wide, in the lang and dir of the mail. The body, the quote and the translation keep
	// each single line break of a paragraph (whitespace-pre-line). The quoted part of an earlier
	// message folds behind a button, a translation from an agent takes the dashed edge and the badge
	// of content that no person confirmed, and the files follow as attachments of size sm. A folded
	// message is one line: the avatar, the name, the first words and the time, as a button that
	// opens it. When the product gives the direction of a message, an outline badge with an arrow
	// says Sent or Received before the time, in line 1 and in the folded line, and the heading starts
	// with the same word. A message that is new in its record shows an outline badge New before
	// the direction badge, and the heading starts with "New,". The channel of the product stands on
	// a line of its own after the recipients, with the icon of the channel at 14 px before its words
	// when the product gives one. The subject of the mail, when the product gives it, stands at 500
	// between the header and the text. A reply that waits to go out shows a line with the
	// time left, Undo and Send now under the body, or the words of the product in place of all three.
	// The actions of the product end line 1, after the unread mark: one action as an icon button with
	// its tooltip from 768 px, else a More menu with a destructive action last. They never print.
	// When the person reads the translation and not the language of the
	// mail, the translation comes first and the original folds behind a button; the folded line then
	// shows the first words of the translation. The source of a reply that went out in another language,
	// the text that the team wrote and that stays inside, stands in the internal mark in the place of a
	// translation. When the person reads the source, it comes first, the mail as sent folds behind a
	// button, and the folded line shows the first words of the source. A file with a picture is a vertical attachment with the picture, and
	// its trigger opens the picture large in a dialog. A mail with frame shows its HTML part as its
	// sender designed it: an HtmlFrame, or the snippet body, in a box with the dashed edge and the badge
	// of the source, in place of the body and the quote. A button before the box, Show as text or
	// Show as designed, switches between the two and keeps the focus. The frame mounts only while the
	// original shows open, so a folded message and a folded original hold the text. The frame that the
	// part draws gives the facts of its page: a page with state text shows the text with no button, a
	// page with state too-large the text and a line in place of the button, and a remote count above 0
	// a line in the box, with Load pictures when the product gives onloadpictures. The part takes only
	// the first facts of each address, so a page that a link loads into the frame changes no fact. A
	// page that posts nothing gives the text, a line and Show as designed. The part keeps the facts of
	// its mail while it shows. When the element with the focus goes with a fact, the focus moves to
	// the heading. Each time the frame mounts again after the first render, the part asks onframe for
	// a new address, and the box holds an empty block of the height of a frame until the address
	// comes. A rejection, or no answer in 15 s, gives the view of a page that posts nothing. In print
	// every message prints open, and a folded quote stays folded. Each word that a person sees or a
	// screen reader reads comes from words, and each word that the product does not give stays as in
	// MAIL_MESSAGE_WORDS. The large view of a picture draws the close button of dialog-content itself,
	// so that the button takes the word of the product.
	let {
		mail,
		now,
		locale = 'en-GB',
		timeZone,
		folded = $bindable(false),
		headingLevel = 3,
		onretry,
		onopenfile,
		onundo,
		onsendnow,
		body,
		onloadpictures,
		onframe,
		actions,
		actionsLabel,
		words,
		ref = $bindable(null),
		class: className,
		...rest
	}: MailMessageProps = $props();

	const uid = $props.id();
	const w = $derived({ ...MAIL_MESSAGE_WORDS, ...words });
	let quoteOpen = $state(false);
	let originalOpen = $state(false);
	/** True while a mail with frame shows its HTML part, and false after Show as text. */
	let designed = $state(true);
	let heading = $state<HTMLElement>();

	/** The facts of the page of a mail, from the frame that the part draws, with the id of the mail and the address of the page. They stay while the part shows, so a message that opens again shows its text at once. */
	let facts = $state<{ id: string; src: string; page: FramePage }>();
	const page = $derived(facts?.id === mail.id ? facts.page : {});
	/** The id of the mail whose frame posted nothing, until the person picks Show as designed. */
	let failedId = $state<string>();
	const frameFailed = $derived(failedId === mail.id);
	/** True while the message shows its HTML part: the person picked it, the frame did not fail, and the page holds the HTML. */
	const asDesigned = $derived(designed && !frameFailed && page.state !== 'text' && page.state !== 'too-large');
	function pick() {
		designed = !asDesigned;
		failedId = undefined;
	}
	/** Applies a change that the page of the frame causes. When the element with the focus goes with it, the focus moves to the heading, so that it never falls to the page. */
	async function fromFrame(change: () => void) {
		const held = ref?.contains(document.activeElement) ? document.activeElement : null;
		change();
		await tick();
		if (held && !held.isConnected) heading?.focus();
	}
	/** Takes only the first facts of each address. A page that a link loads into the frame later passes the same checks, so the part takes no fact of it, and Load pictures does not move under the pointer. */
	function takePage(src: string, p: FramePage) {
		if (facts?.id === mail.id && facts.src === src) return;
		void fromFrame(() => (facts = { id: mail.id, src, page: p }));
	}
	const takeFailure = () => fromFrame(() => (failedId = mail.id));

	/** The address that onframe gave last, with the frame of the mail that it stands for. A new frame of the product takes its place. */
	let fresh = $state<{ frame: string; src: string }>();
	/** True while the part waits for the address that onframe gives. */
	let asking = $state(false);
	/** The count of the asks. An answer to an ask that is not the last changes nothing. */
	let asks = 0;
	/** The ms that the part waits for the address. With no answer by then, it takes the path of a rejection. */
	const ASK_WAIT = 15_000;
	/** The timer of the last ask. */
	let askTimer: ReturnType<typeof setTimeout> | undefined;
	function ask() {
		const call = onframe;
		const frame = mail.frame;
		const id = mail.id;
		if (!call || !frame) return;
		const n = ++asks;
		asking = true;
		const refuse = () => {
			if (n !== asks) return;
			clearTimeout(askTimer);
			asking = false;
			void fromFrame(() => (failedId = id));
		};
		clearTimeout(askTimer);
		askTimer = setTimeout(refuse, ASK_WAIT);
		// The executor turns an error that the function throws into a rejection.
		new Promise<string>((done) => done(call())).then((src) => {
			if (n !== asks) return;
			clearTimeout(askTimer);
			asking = false;
			fresh = { frame, src };
		}, refuse);
	}

	const label = (p: MailPerson) => p.name ?? p.address;
	/** The text that the person reads first: the source or the translation when it comes first, else the body. A mail with a source shows no translation. */
	const read = $derived(mail.source ? (mail.sourceFirst ? mail.source : undefined) : mail.translationFirst && mail.translation ? mail.translation : undefined);
	/** The words of the button of the original: the mail as sent behind a source, else the original behind a translation. */
	const fold = $derived(mail.source ? { show: w.showSent, hide: w.hideSent } : { show: w.showOriginal, hide: w.hideOriginal });
	/** The first words of that text for a folded line: enough to fill it, and a short name for a screen reader. */
	const first = $derived.by(() => {
		const text = (read?.body ?? mail.body).join(' ');
		if (text.length <= 120) return text;
		// Chinese, Japanese and Thai put no space between words, so the cut falls at 120 when no space comes first.
		const cut = text.lastIndexOf(' ', 120);
		return `${text.slice(0, cut > 0 ? cut : 120)}…`;
	});
	const initial = (p: MailPerson) => label(p).trim().charAt(0).toUpperCase();
	const full = $derived(new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full', timeStyle: 'short' }));
	const number = $derived(new Intl.NumberFormat(locale));
	/** To, then Cc and Bcc when the mail holds them, each with the count of the people that the product left out. The key is not the word, because a product can give two groups one word. */
	const groups = $derived(
		[
			{ key: 'to', word: w.to, list: mail.to, more: mail.toMore },
			{ key: 'cc', word: w.cc, list: mail.cc ?? [], more: mail.ccMore },
			{ key: 'bcc', word: w.bcc, list: mail.bcc ?? [], more: undefined }
		].filter((g) => g.list.length > 0)
	);

	/** The direction badge, when the product gives the direction. Its word also starts the heading and the folded line. */
	const sent = $derived.by(() => {
		if (mail.direction === 'in') return { word: w.received, icon: ArrowDownLeftIcon };
		if (mail.direction !== 'out') return undefined;
		if (mail.failed) return { word: w.notSent, icon: CircleAlertIcon };
		if (mail.sendsAt) return { word: w.scheduled, icon: ClockIcon };
		return { word: w.sent, icon: ArrowUpRightIcon };
	});

	/** The clock while a reply waits. It stays undefined on the server and until the part mounts, so that the server and the page write the same words. A reply with waitingNote shows no time, so the clock does not run. */
	let clock = $state<number>();
	$effect(() => {
		const at = mail.waitingNote ? undefined : mail.sendsAt?.getTime();
		if (at === undefined) return;
		clock = Date.now();
		const timer = setInterval(() => {
			clock = Date.now();
			if (clock >= at) clearInterval(timer);
		}, 1000);
		return () => clearInterval(timer);
	});
	/** The whole seconds until a reply that waits goes out, and 0 when its time came. */
	const left = $derived(mail.sendsAt ? Math.max(0, Math.ceil((mail.sendsAt.getTime() - (clock ?? now.getTime())) / 1000)) : 0);

	/** The addresses of the pictures that did not load. Such a picture opens as a file. */
	const broken = new SvelteSet<string>();
	/** The file whose picture the dialog shows. It stays while the dialog closes, so that the dialog keeps its content. */
	let viewing = $state<MailFile>();
	let viewOpen = $state(false);
	function view(file: MailFile) {
		viewing = file;
		viewOpen = true;
	}

	const coarse = new MediaQuery('pointer: coarse');
	/** Every action is an item of More: below 768 px and on a touch screen. The server renders this form. */
	const compact = $derived(!bands.md.current || coarse.current);
	/** The one action that shows as an icon button, from 768 px with a pointer. An action with no icon stays in More. */
	const lone = $derived.by(() => {
		const [only, ...others] = actions ?? [];
		return !compact && only?.icon && others.length === 0 ? only : undefined;
	});
	const plainActions = $derived(actions?.filter((a) => !a.destructive) ?? []);
	const destructiveActions = $derived(actions?.filter((a) => a.destructive) ?? []);
	// An item of More runs after the menu has closed and given back its focus, so that an alert dialog
	// that the item opens keeps the focus, as in the selection bar.
	let pending: (() => void) | null = null;
	function afterMenu() {
		const run = pending;
		pending = null;
		if (run) queueMicrotask(run);
	}

	/** True while the frame of the mail shows: the message and its original are open, and the message shows as designed. */
	const frameShown = $derived(!!mail.frame && !folded && (!read || originalOpen) && asDesigned);
	/** The view at the last run of the effect: undefined before the first run, so that the frame of the first render loads frame of the mail. */
	let last: { shown: boolean; id: string; frame?: string | undefined } | undefined;
	// Each time the frame mounts again, the part asks for a new address before the page updates, so the
	// frame never loads the old address. When the frame goes, or a new frame or another mail comes, the
	// wait ends and an answer that comes later changes nothing. The frame then loads the new frame at once.
	$effect.pre(() => {
		const view = { shown: frameShown, id: mail.id, frame: mail.frame };
		untrack(() => {
			const before = last;
			last = view;
			const other = before !== undefined && (before.id !== view.id || before.frame !== view.frame);
			if (!view.shown || other) {
				asks += 1;
				asking = false;
				clearTimeout(askTimer);
			} else if (before && !before.shown) ask();
		});
	});

	async function unfold() {
		folded = false;
		await tick();
		heading?.focus();
	}
</script>

<!-- The New badge and the direction badge. The heading and the folded line hold their words, so a screen reader does not read the badges. -->
{#snippet mark()}
	{#if mail.fresh}<Badge variant="outline" aria-hidden="true">{w.fresh}</Badge>{/if}
	{#if sent}
		{@const Icon = sent.icon}
		<Badge variant="outline" aria-hidden="true"><Icon data-icon="inline-start" />{sent.word}</Badge>
	{/if}
{/snippet}

{#snippet avatar(p: MailPerson)}
	<Avatar.Root size="sm" aria-hidden="true" class="data-[size=sm]:size-5"><Avatar.Fallback class="font-medium group-data-[size=sm]/avatar:text-2xs">{initial(p)}</Avatar.Fallback></Avatar.Root>
{/snippet}

{#snippet time()}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<time {...props} tabindex="-1" data-slot="mail-message-time" datetime={mail.at.toISOString()} class="shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">{age(mail.at, now, locale, timeZone)}</time>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{full.format(mail.at)}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<!-- The waiting line before the last minute, in the words of the product. The time stands in a <time> element
     where the words hold it, and words that do not hold it show with no element. -->
{#snippet goesOutAt(at: Date)}
	{@const shown = age(at, now, locale, timeZone)}
	{@const line = w.goesOutAt(shown)}
	{@const i = line.indexOf(shown)}
	{#if i < 0}{line}{:else}{line.slice(0, i)}<time datetime={at.toISOString()}>{shown}</time>{line.slice(i + shown.length)}{/if}
{/snippet}

<!-- The original of the mail: the body and the quote, in the lang and the dir of the mail. While the
     original shows open, a mail with frame shows its HTML part in their place, in the mark of the source.
     A page with state text shows the text alone, as a mail with no frame does. -->
{#snippet original(open: boolean)}
	{#if mail.frame && open}
		{#if page.state === 'too-large'}
			<p data-slot="mail-message-frame-note" class="text-xs text-muted-foreground">{w.tooLarge}</p>
		{:else if page.state !== 'text'}
			{#if frameFailed}<p data-slot="mail-message-frame-note" class="text-xs text-muted-foreground">{w.frameFailed}</p>{/if}
			<!-- One button for both views, so that the focus stays on it, also when the frame fails. -->
			<Button variant="ghost" size="xs" class="self-start text-muted-foreground print:hidden" onclick={pick}>
				{asDesigned ? w.showText : w.showDesigned}
			</Button>
		{/if}
	{/if}
	{#if mail.frame && open && asDesigned}
		<!-- The address that onframe gave, while the product gives no new frame. -->
		{@const src = fresh?.frame === mail.frame ? fresh.src : mail.frame}
		<div data-slot="mail-message-designed" aria-busy={asking || undefined} class="flex max-w-180 flex-col items-start gap-3 rounded-lg border border-dashed border-input p-3">
			<Badge variant="outline" class="border-input">{w.designed}</Badge>
			{#if (page.remote ?? 0) > 0}
				<div data-slot="mail-message-remote" class="flex items-center gap-2 self-stretch text-xs text-muted-foreground">
					<p class="min-w-0 flex-1">{w.remote}</p>
					{#if onloadpictures}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onloadpictures}>{w.loadPictures}</Button>{/if}
				</div>
			{/if}
			{#if asking}
				<!-- The fixed height of a frame that loads, until onframe gives the address. -->
				<div class="h-80 self-stretch"></div>
			{:else if body}{@render body(mail, src)}{:else}<HtmlFrame {src} title={w.frameTitle(label(mail.from))} onpage={(p) => takePage(src, p)} onfailure={takeFailure} />{/if}
		</div>
	{:else}
		<div data-slot="mail-message-body" lang={mail.lang} dir={mail.dir} class="flex max-w-180 flex-col gap-3 text-md whitespace-pre-line wrap-break-word">
			{#each mail.body as p, i (i)}<p>{p}</p>{/each}
		</div>
		{#if mail.quote}
			<!-- The quote takes the width of the body, and its edge stands at the start of its dir: on the right in a mail from right to left. -->
			<div class="flex max-w-180 flex-col items-start gap-2">
				<Button variant="ghost" size="xs" class="text-muted-foreground print:hidden" aria-expanded={quoteOpen} aria-controls="{uid}-quote" onclick={() => (quoteOpen = !quoteOpen)}>
					{quoteOpen ? w.hideQuote : w.showQuote}
				</Button>
				<blockquote id="{uid}-quote" data-slot="mail-message-quote" lang={mail.lang} dir={mail.dir} class={cn('flex-col gap-3 self-stretch border-s border-border ps-3 text-md whitespace-pre-line wrap-break-word text-muted-foreground', quoteOpen ? 'flex' : 'hidden')}>
					{#each mail.quote as p, i (i)}<p>{p}</p>{/each}
				</blockquote>
			</div>
		{/if}
	{/if}
{/snippet}

<!-- A translation from an agent, which no person confirmed: the dashed edge and the badge. -->
{#snippet translation(t: { by: string; lang: string; body: string[] })}
	<div data-slot="mail-message-translation" lang={t.lang} class="flex max-w-180 flex-col items-start gap-3 rounded-lg border border-dashed border-input p-3 text-md whitespace-pre-line text-muted-foreground">
		<Badge variant="outline" class="border-input">{w.translatedBy(t.by)}</Badge>
		{#each t.body as p, i (i)}<p>{p}</p>{/each}
	</div>
{/snippet}

<!-- The source of a reply in the language of the team, which stays inside the team: the internal mark,
     with the dashed edge and a second badge when no person confirmed it. The lang goes on the block of
     the text, so that the badges keep the language of the interface. The badge stands over the top edge,
     so the mark takes 10 px above it, and the badge stands 13 px under the part before it. -->
{#snippet sourceMark(s: { lang: string; body: string[]; proposal?: string })}
	<InternalMark label={w.internal} proposal={s.proposal} class="mt-2.5 max-w-180">
		<div data-slot="mail-message-source" lang={s.lang} class="flex flex-col gap-3 text-md whitespace-pre-line wrap-break-word">
			{#each s.body as p, i (i)}<p>{p}</p>{/each}
		</div>
	</InternalMark>
{/snippet}

<!-- A list that the product cut ends with the count of the others, as plain text: the part does not hold those people. -->
{#snippet people(word: string, list: MailPerson[], more = 0)}
	{word}{' '}{#each list as p, i (i)}{#if i > 0},{' '}{/if}{#if p.name}<bdi>{p.name}</bdi> &lt;{p.address}&gt;{:else}{p.address}{/if}{/each}{#if more > 0}{' '}<span aria-hidden="true">{w.more(more, number.format(more))}</span><span class="sr-only select-none">{w.moreSpoken(more, number.format(more))}</span>{/if}
{/snippet}

{#snippet actionItem(a: MailAction)}
	{@const Icon = a.icon}
	<DropdownMenu.Item variant={a.destructive ? 'destructive' : 'default'} onSelect={() => (pending = a.run)}>
		{#if Icon}<Icon />{/if}{a.label}
	</DropdownMenu.Item>
{/snippet}

<!-- The actions end line 1, with the middle of each button on the middle of the line. From 768 px the box
     takes 2 px off above and below, so the button of 24 px keeps the line at 20 px. Below 768 px the button
     of 44 px starts 12 px over the line, in the padding of the message, so it ends 32 px under the top of
     the line and stays clear of the recipients. -->
{#snippet actionsBox()}
	<div data-slot="mail-message-actions" class="flex shrink-0 max-md:-mt-3 md:-my-0.5 print:hidden">
		{#if lone}
			{@const one = lone}
			{@const Icon = one.icon}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon-xs" aria-label={one.label} onclick={() => one.run()}>{#if Icon}<Icon />{/if}</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>{one.label}</Tooltip.Content>
			</Tooltip.Root>
		{:else}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon-xs' })} aria-label={actionsLabel ?? w.moreActions}>
					<EllipsisIcon />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-64" onCloseAutoFocus={afterMenu}>
					{#each plainActions as a (a.id)}{@render actionItem(a)}{/each}
					{#if plainActions.length && destructiveActions.length}<DropdownMenu.Separator />{/if}
					{#each destructiveActions as a (a.id)}{@render actionItem(a)}{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	</div>
{/snippet}

<Tooltip.Provider>
	<article bind:this={ref} data-slot="mail-message" aria-labelledby="{uid}-from" class={cn('border-b border-border text-sm last:border-b-0', className)} {...rest}>
		{#if folded}
			<svelte:element this={`h${headingLevel}`} class="print:hidden">
				<!-- The phone key of the slot makes the line 44 px high below 768 px, so the line takes no min-h class.
				     When the line has no room, the name shrinks (`shrink`), so the badges and the time keep their place. -->
				<button
					type="button"
					data-slot="mail-message-fold"
					aria-expanded="false"
					aria-controls="{uid}-content"
					class="flex w-full cursor-pointer items-center gap-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
					onclick={unfold}
				>
					{@render avatar(mail.from)}
					{#if mail.fresh}<span class="sr-only">{w.fresh},</span>{/if}{#if sent}<span class="sr-only">{sent.word},</span>{/if}
					<bdi id="{uid}-from" class="max-w-48 min-w-0 shrink overflow-x-clip font-medium text-ellipsis whitespace-nowrap">{label(mail.from)}</bdi>
					<span class="min-w-0 flex-1 overflow-x-clip text-left text-ellipsis whitespace-nowrap text-muted-foreground" lang={read?.lang ?? mail.lang} dir="auto">{first}</span>
					{@render mark()}
					<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{age(mail.at, now, locale, timeZone)}</span>
				</button>
			</svelte:element>
		{/if}
		<div id="{uid}-content" class={cn('flex-col gap-3 py-4', folded ? 'hidden print:flex' : 'flex')}>
			<header data-slot="mail-message-header" class="flex flex-col gap-1">
				<div class="flex items-start gap-2">
					{@render avatar(mail.from)}
					<div class="min-w-0 flex-1 wrap-break-word">
						<svelte:element
							this={`h${headingLevel}`}
							bind:this={heading}
							id={folded ? undefined : `${uid}-from`}
							tabindex="-1"
							class="inline outline-none focus-visible:underline"
						>
							{#if mail.unread}<span class="sr-only">{w.unread},</span>{/if}{#if mail.fresh}<span class="sr-only">{w.fresh},</span>{/if}{#if sent}<span class="sr-only">{sent.word},</span>{/if}<bdi data-slot="mail-message-sender" class="font-medium">{label(mail.from)}</bdi>
						</svelte:element>
						{#if mail.from.name}<span data-slot="mail-message-address" class="text-muted-foreground">{' '}{mail.from.address}</span>{/if}
					</div>
					{@render mark()}
					{@render time()}
					{#if mail.unread}<UnreadMark class="mt-1.5" />{/if}
					{#if actions?.length}{@render actionsBox()}{/if}
				</div>
				<!-- To, then Cc and Bcc when the mail holds them, with a middle dot between the groups. -->
				<p data-slot="mail-message-recipients" class="pl-7 text-xs wrap-break-word text-muted-foreground">
					{#each groups as { key, word, list, more }, g (key)}{#if g > 0}{' '}·{' '}{/if}{@render people(word, list, more)}{/each}
				</p>
				<!-- The icon of the channel stands at 14 px before the words, in the middle of the line: 1 px under the top of the 16 px line, and 2 px under the top of the 18 px line below 768 px. -->
				{#if mail.channel}
					{@const ChannelIcon = mail.channelIcon}
					<p data-slot="mail-message-channel" class="pl-7 text-xs wrap-break-word text-muted-foreground">{#if ChannelIcon}<ChannelIcon class="me-1 mt-px inline-block size-3.5 align-top max-md:mt-0.5" aria-hidden="true" />{/if}{mail.channel}</p>
				{/if}
				{#if mail.sentBy}<p data-slot="mail-message-sent-by" class="pl-7 text-xs text-muted-foreground">{mail.sentBy}</p>{/if}
			</header>
			{#if mail.subject}<p data-slot="mail-message-subject" lang={mail.lang} dir={mail.dir} class="max-w-180 font-medium wrap-break-word">{mail.subject}</p>{/if}
			<!-- The order of the text: the original, then the source or the translation. When the person reads the source or the translation, it comes first, and the original folds behind a button. A mail with a source shows no translation. -->
			{#if read}
				{#if mail.source}{@render sourceMark(mail.source)}{:else if mail.translation}{@render translation(mail.translation)}{/if}
				<div class="flex max-w-180 flex-col items-start gap-2">
					<Button variant="ghost" size="xs" class="text-muted-foreground print:hidden" aria-expanded={originalOpen} aria-controls="{uid}-original" onclick={() => (originalOpen = !originalOpen)}>
						{originalOpen ? fold.hide : fold.show}
					</Button>
					<div id="{uid}-original" data-slot="mail-message-original" class={cn('w-full flex-col gap-3', originalOpen ? 'flex' : 'hidden print:flex')}>{@render original(!folded && originalOpen)}</div>
				</div>
			{:else}
				{@render original(!folded)}
				{#if mail.source}{@render sourceMark(mail.source)}{:else if mail.translation}{@render translation(mail.translation)}{/if}
			{/if}
			{#if mail.files?.length}
				<!-- A picture is higher than a file, so each file keeps its own height (items-start). -->
				<Attachment.Group role="group" aria-label={w.files(label(mail.from))} class="items-start">
					{#each mail.files as f, i (i)}
						{#if f.picture}
							<!-- A picture: its trigger opens it large. A picture that did not load takes the error state and opens as a file. -->
							{@const src = f.picture}
							{@const failed = broken.has(src)}
							<Attachment.Root size="sm" orientation="vertical" state={failed ? 'error' : 'done'}>
								<Attachment.Trigger aria-label={w.open(f.name)} onclick={() => (failed ? onopenfile?.(f) : view(f))} />
								<!-- The media of a vertical attachment of size sm takes the width of the card, in place of the 32 px of a row. -->
								<Attachment.Media variant={failed ? 'icon' : 'image'} class="group-data-[size=sm]/attachment:w-full">
									{#if failed}<ImageOffIcon />{:else}<img {src} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={() => broken.add(src)} />{/if}
								</Attachment.Media>
								<Attachment.Content>
									<Attachment.Title>{f.name}</Attachment.Title>
									<Attachment.Description>{failed ? w.pictureFailed : f.size}</Attachment.Description>
								</Attachment.Content>
							</Attachment.Root>
						{:else}
							<Attachment.Root size="sm">
								<Attachment.Trigger aria-label={w.open(f.name)} onclick={() => onopenfile?.(f)} />
								<Attachment.Media>{#if f.image}<ImageIcon />{:else}<FileTextIcon />{/if}</Attachment.Media>
								<Attachment.Content>
									<Attachment.Title>{f.name}</Attachment.Title>
									<Attachment.Description>{f.size}</Attachment.Description>
								</Attachment.Content>
							</Attachment.Root>
						{/if}
					{/each}
				</Attachment.Group>
				<!-- The large view of a picture: the wide dialog, whose body scrolls when the picture is higher than the dialog. -->
				<Dialog.Root bind:open={viewOpen}>
					<Dialog.Content class="flex flex-col sm:max-w-160 md:max-h-11/12" showCloseButton={false}>
						{#if viewing?.picture}
							{@const file = viewing}
							<Dialog.Header class="pr-6">
								<Dialog.Title class="wrap-break-word">{file.name}</Dialog.Title>
								<Dialog.Description>{file.size}</Dialog.Description>
							</Dialog.Header>
							<div class="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">
								<img src={file.picture} alt={file.name} referrerpolicy="no-referrer" class="mx-auto h-auto max-w-full" />
							</div>
							{#if onopenfile}
								<Dialog.Footer>
									<Button variant="outline" onclick={() => onopenfile(file)}>{w.openFile}</Button>
								</Dialog.Footer>
							{/if}
						{/if}
						<!-- The close button of dialog-content, with the word of the product in place of its English name. -->
						<Dialog.Close>
							{#snippet child({ props })}
								<Button variant="ghost" class="absolute top-2 right-2" size="icon-sm" {...props}><XIcon /><span class="sr-only">{w.close}</span></Button>
							{/snippet}
						</Dialog.Close>
					</Dialog.Content>
				</Dialog.Root>
			{/if}
			{#if mail.failed}
				<div class="flex max-w-180 items-start gap-2 text-destructive">
					<CircleAlertIcon class="mt-0.5 size-4 shrink-0" />
					<p class="min-w-0 flex-1">{w.failed(mail.failed)}</p>
					{#if onretry}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onretry}>{w.retry}</Button>{/if}
				</div>
			{/if}
			<!-- The time left is plain text and no live region, so a screen reader does not read each second. -->
			{#if mail.sendsAt}
				<div data-slot="mail-message-waiting" class="flex max-w-180 items-start gap-2 text-muted-foreground">
					<ClockIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<p class="min-w-0 flex-1">
						{#if mail.waitingNote}{mail.waitingNote}{:else if left === 0}{w.sending}{:else if left <= 60}{w.goesOutIn(left, number.format(left))}{:else}{@render goesOutAt(mail.sendsAt)}{/if}
					</p>
					{#if !mail.waitingNote && left > 0 && onundo}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onundo}>{w.undo}</Button>{/if}
					{#if !mail.waitingNote && left > 0 && onsendnow}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onsendnow}>{w.sendNow}</Button>{/if}
				</div>
			{/if}
		</div>
	</article>
</Tooltip.Provider>
