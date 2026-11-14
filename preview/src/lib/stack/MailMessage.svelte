<script lang="ts" module>
	import type { Snippet } from 'svelte';
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
		files?: MailFile[];
		/** The line of a message that the product sent, such as "Sent by Mail agent for Marko Ellis". */
		sentBy?: string;
		/** The reason when a reply did not go out. */
		failed?: string;
		/** True while the person has not read the message. */
		unread?: boolean;
		/** 'in' for a message that came in, and 'out' for a message that the product sent or sends. A badge before the time says Sent or Received. */
		direction?: 'in' | 'out';
		/** The time at which a reply that waits goes out. Give it while the person can still undo the send, and remove it when the reply went out. */
		sendsAt?: Date;
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
		onretry?: () => void;
		/** Opens a file from the host of the content that the product did not write. */
		onopenfile?: ((file: MailFile) => void) | undefined;
		/** The HTML part of a mail with frame, in place of the HtmlFrame that the part draws, such as an HtmlFrame with a line of the product about the pictures. It takes the mail and the address of its page (frame), and it renders inside the mark of the source. */
		body?: Snippet<[Mail, string]> | undefined;
		/** Stops a reply that waits to go out (sendsAt). The waiting line shows Undo only when the product gives it. */
		onundo?: (() => void) | undefined;
		/** Sends a reply that waits at once. The waiting line shows Send now only when the product gives it. */
		onsendnow?: (() => void) | undefined;
	};

	/** A time by its age, as "Formats" in architecture/web-app.md says. */
	export function age(at: Date, now: Date, locale: string, timeZone: string): string {
		const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone });
		const year = (d: Date) => d.toLocaleDateString('en-CA', { timeZone, year: 'numeric' });
		if (day(at) === day(now)) return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(at);
		if (year(at) === year(now)) return new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);
		return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium' }).format(at);
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import ArrowDownLeftIcon from '@lucide/svelte/icons/arrow-down-left';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImageOffIcon from '@lucide/svelte/icons/image-off';
	import HtmlFrame from './HtmlFrame.svelte';
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
	// with the same word. A reply that waits to go out shows a line with the time left, Undo and
	// Send now under the body. When the person reads the translation and not the language of the
	// mail, the translation comes first and the original folds behind a button; the folded line then
	// shows the first words of the translation. A file with a picture is a vertical attachment with the picture, and
	// its trigger opens the picture large in a dialog. A mail with frame shows its HTML part as its
	// sender designed it: an HtmlFrame, or the snippet body, in a box with the dashed edge and the badge
	// of the source, in place of the body and the quote. A button before the box, Show as text or
	// Show as designed, switches between the two and keeps the focus. The frame mounts only while the
	// original shows open, so a folded message and a folded original hold the text. In print every
	// message prints open, and a folded quote stays folded.
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
		ref = $bindable(null),
		class: className,
		...rest
	}: MailMessageProps = $props();

	const uid = $props.id();
	let quoteOpen = $state(false);
	let originalOpen = $state(false);
	/** True while a mail with frame shows its HTML part, and false after Show as text. */
	let designed = $state(true);
	let heading = $state<HTMLElement>();

	const label = (p: MailPerson) => p.name ?? p.address;
	/** The text that the person reads first: the translation when it comes first, else the body. */
	const read = $derived(mail.translationFirst && mail.translation ? mail.translation : undefined);
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
	/** To, then Cc and Bcc when the mail holds them, each with the count of the people that the product left out. */
	const groups = $derived(
		[
			{ word: 'To', list: mail.to, more: mail.toMore },
			{ word: 'Cc', list: mail.cc ?? [], more: mail.ccMore },
			{ word: 'Bcc', list: mail.bcc ?? [], more: undefined }
		].filter((g) => g.list.length > 0)
	);

	/** The direction badge, when the product gives the direction. Its word also starts the heading and the folded line. */
	const sent = $derived.by(() => {
		if (mail.direction === 'in') return { word: 'Received', icon: ArrowDownLeftIcon };
		if (mail.direction !== 'out') return undefined;
		if (mail.failed) return { word: 'Not sent', icon: CircleAlertIcon };
		if (mail.sendsAt) return { word: 'Scheduled', icon: ClockIcon };
		return { word: 'Sent', icon: ArrowUpRightIcon };
	});

	/** The clock while a reply waits. It stays undefined on the server and until the part mounts, so that the server and the page write the same words. */
	let clock = $state<number>();
	$effect(() => {
		const at = mail.sendsAt?.getTime();
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

	async function unfold() {
		folded = false;
		await tick();
		heading?.focus();
	}
</script>

<!-- The direction badge. The heading and the folded line hold its word, so a screen reader does not read the badge. -->
{#snippet mark()}
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

<!-- The original of the mail: the body and the quote, in the lang and the dir of the mail. While the
     original shows open, a mail with frame shows its HTML part in their place, in the mark of the source. -->
{#snippet original(open: boolean)}
	{#if mail.frame && open}
		<!-- One button for both views, so that the focus stays on it. -->
		<Button variant="ghost" size="xs" class="self-start text-muted-foreground print:hidden" onclick={() => (designed = !designed)}>
			{designed ? 'Show as text' : 'Show as designed'}
		</Button>
	{/if}
	{#if mail.frame && open && designed}
		<div data-slot="mail-message-designed" class="flex max-w-180 flex-col items-start gap-3 rounded-lg border border-dashed border-input p-3">
			<Badge variant="outline" class="border-input">Designed by the sender</Badge>
			{#if body}{@render body(mail, mail.frame)}{:else}<HtmlFrame src={mail.frame} title="The message from {label(mail.from)}, as the sender designed it" />{/if}
		</div>
	{:else}
		<div data-slot="mail-message-body" lang={mail.lang} dir={mail.dir} class="flex max-w-180 flex-col gap-3 text-md whitespace-pre-line wrap-break-word">
			{#each mail.body as p, i (i)}<p>{p}</p>{/each}
		</div>
		{#if mail.quote}
			<div class="flex max-w-180 flex-col items-start gap-2">
				<Button variant="ghost" size="xs" class="text-muted-foreground print:hidden" aria-expanded={quoteOpen} aria-controls="{uid}-quote" onclick={() => (quoteOpen = !quoteOpen)}>
					{quoteOpen ? 'Hide the quoted text' : 'Show the quoted text'}
				</Button>
				<blockquote id="{uid}-quote" data-slot="mail-message-quote" lang={mail.lang} dir={mail.dir} class={cn('flex-col gap-3 border-l border-border pl-3 text-md whitespace-pre-line wrap-break-word text-muted-foreground', quoteOpen ? 'flex' : 'hidden')}>
					{#each mail.quote as p, i (i)}<p>{p}</p>{/each}
				</blockquote>
			</div>
		{/if}
	{/if}
{/snippet}

<!-- A translation from an agent, which no person confirmed: the dashed edge and the badge. -->
{#snippet translation(t: { by: string; lang: string; body: string[] })}
	<div data-slot="mail-message-translation" lang={t.lang} class="flex max-w-180 flex-col items-start gap-3 rounded-lg border border-dashed border-input p-3 text-md whitespace-pre-line text-muted-foreground">
		<Badge variant="outline" class="border-input">Translated by {t.by}</Badge>
		{#each t.body as p, i (i)}<p>{p}</p>{/each}
	</div>
{/snippet}

<!-- A list that the product cut ends with the count of the others, as plain text: the part does not hold those people. -->
{#snippet people(word: string, list: MailPerson[], more = 0)}
	{word}{' '}{#each list as p, i (i)}{#if i > 0},{' '}{/if}{#if p.name}<bdi>{p.name}</bdi> &lt;{p.address}&gt;{:else}{p.address}{/if}{/each}{#if more > 0}{' '}and {number.format(more)} more<span class="sr-only select-none">{' '}{more === 1 ? 'recipient' : 'recipients'}</span>{/if}
{/snippet}

<Tooltip.Provider>
	<article bind:this={ref} data-slot="mail-message" aria-labelledby="{uid}-from" class={cn('border-b border-border text-sm last:border-b-0', className)} {...rest}>
		{#if folded}
			<svelte:element this={`h${headingLevel}`} class="print:hidden">
				<!-- The phone key of the slot makes the line 44 px high below 768 px, so the line takes no min-h class. -->
				<button
					type="button"
					data-slot="mail-message-fold"
					aria-expanded="false"
					aria-controls="{uid}-content"
					class="flex w-full cursor-pointer items-center gap-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
					onclick={unfold}
				>
					{@render avatar(mail.from)}
					{#if sent}<span class="sr-only">{sent.word},</span>{/if}
					<bdi id="{uid}-from" class="max-w-48 shrink-0 overflow-x-clip font-medium text-ellipsis whitespace-nowrap">{label(mail.from)}</bdi>
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
							{#if mail.unread}<span class="sr-only">Unread,</span>{/if}{#if sent}<span class="sr-only">{sent.word},</span>{/if}<bdi data-slot="mail-message-sender" class="font-medium">{label(mail.from)}</bdi>
						</svelte:element>
						{#if mail.from.name}<span data-slot="mail-message-address" class="text-muted-foreground">{' '}{mail.from.address}</span>{/if}
					</div>
					{@render mark()}
					{@render time()}
					{#if mail.unread}<UnreadMark class="mt-1.5" />{/if}
				</div>
				<!-- To, then Cc and Bcc when the mail holds them, with a middle dot between the groups. -->
				<p data-slot="mail-message-recipients" class="pl-7 text-xs wrap-break-word text-muted-foreground">
					{#each groups as { word, list, more }, g (word)}{#if g > 0}{' '}·{' '}{/if}{@render people(word, list, more)}{/each}
				</p>
				{#if mail.sentBy}<p data-slot="mail-message-sent-by" class="pl-7 text-xs text-muted-foreground">{mail.sentBy}</p>{/if}
			</header>
			<!-- The order of the text: the original, then the translation. When the person reads the translation, it comes first, and the original folds behind a button. -->
			{#if read}
				{@render translation(read)}
				<div class="flex max-w-180 flex-col items-start gap-2">
					<Button variant="ghost" size="xs" class="text-muted-foreground print:hidden" aria-expanded={originalOpen} aria-controls="{uid}-original" onclick={() => (originalOpen = !originalOpen)}>
						{originalOpen ? 'Hide the original' : 'Show the original'}
					</Button>
					<div id="{uid}-original" data-slot="mail-message-original" class={cn('w-full flex-col gap-3', originalOpen ? 'flex' : 'hidden print:flex')}>{@render original(!folded && originalOpen)}</div>
				</div>
			{:else}
				{@render original(!folded)}
				{#if mail.translation}{@render translation(mail.translation)}{/if}
			{/if}
			{#if mail.files?.length}
				<!-- A picture is higher than a file, so each file keeps its own height (items-start). -->
				<Attachment.Group role="group" aria-label="Files of the message from {label(mail.from)}" class="items-start">
					{#each mail.files as f, i (i)}
						{#if f.picture}
							<!-- A picture: its trigger opens it large. A picture that did not load takes the error state and opens as a file. -->
							{@const src = f.picture}
							{@const failed = broken.has(src)}
							<Attachment.Root size="sm" orientation="vertical" state={failed ? 'error' : 'done'}>
								<Attachment.Trigger aria-label="Open {f.name}" onclick={() => (failed ? onopenfile?.(f) : view(f))} />
								<!-- The media of a vertical attachment of size sm takes the width of the card, in place of the 32 px of a row. -->
								<Attachment.Media variant={failed ? 'icon' : 'image'} class="group-data-[size=sm]/attachment:w-full">
									{#if failed}<ImageOffIcon />{:else}<img {src} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={() => broken.add(src)} />{/if}
								</Attachment.Media>
								<Attachment.Content>
									<Attachment.Title>{f.name}</Attachment.Title>
									<Attachment.Description>{failed ? 'Did not load' : f.size}</Attachment.Description>
								</Attachment.Content>
							</Attachment.Root>
						{:else}
							<Attachment.Root size="sm">
								<Attachment.Trigger aria-label="Open {f.name}" onclick={() => onopenfile?.(f)} />
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
					<Dialog.Content class="flex flex-col sm:max-w-160 md:max-h-11/12">
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
									<Button variant="outline" onclick={() => onopenfile(file)}>Open the file</Button>
								</Dialog.Footer>
							{/if}
						{/if}
					</Dialog.Content>
				</Dialog.Root>
			{/if}
			{#if mail.failed}
				<div class="flex max-w-180 items-start gap-2 text-destructive">
					<CircleAlertIcon class="mt-0.5 size-4 shrink-0" />
					<p class="min-w-0 flex-1">Not sent. {mail.failed}</p>
					<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onretry}>Retry</Button>
				</div>
			{/if}
			<!-- The time left is plain text and no live region, so a screen reader does not read each second. -->
			{#if mail.sendsAt}
				<div data-slot="mail-message-waiting" class="flex max-w-180 items-start gap-2 text-muted-foreground">
					<ClockIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<p class="min-w-0 flex-1">
						{#if left === 0}Sending.{:else if left <= 60}Goes out in {number.format(left)} {left === 1 ? 'second' : 'seconds'}.{:else}Goes out at <time datetime={mail.sendsAt.toISOString()}>{age(mail.sendsAt, now, locale, timeZone)}</time>.{/if}
					</p>
					{#if left > 0 && onundo}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onundo}>Undo</Button>{/if}
					{#if left > 0 && onsendnow}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onsendnow}>Send now</Button>{/if}
				</div>
			{/if}
		</div>
	</article>
</Tooltip.Provider>
