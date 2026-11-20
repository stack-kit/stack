<!--
	A conversation (### conversation in DESIGN.md): one section that holds the mails and the chat messages
	of a record on each of its channels, with the events and the comments of the team, each at its time,
	the oldest first. It is an advanced part: it puts MailMessage, message, bubble, marker, ActivityLines,
	CommentItem and SendState together.

	- The part sorts copies of the four lists with inConversation (thread-entries.ts). At one time a mail
	  comes first, then a chat message, a comment and an event, and two entries of one kind keep the given
	  order. A marker of the separator variant with the date in words stands before the first entry of each
	  day of the time zone of the product.
	- A mail is a MailMessage. Each read mail folds to one line, except the last message of the
	  conversation, as in MailThread. An event or a comment never folds or opens a mail.
	- A chat message is a message with one bubble. A run of chat messages of one author on one channel
	  shows one header: the name as a heading, the channel with its icon, and the time. Each other message
	  of the run gives the name in sr-only text. A message of the person (own) stands at the end.
	- The footer of a chat message holds SendState, or the failure line with Retry when the product gives
	  onretry.
	- showChannel={false} hides the channel of each mail and each chat message, for the view of one channel.
	- The heading counts the mails and the chat messages, not the events and the comments.
	- When the product removes the entry that holds the focus, the focus moves to the heading of the next
	  message, else of the message before, else of the conversation, as in MailThread. When the page builds
	  the run of a message with the focus again, such as after the first message of the run goes, the focus
	  moves to the heading of the run.
-->
<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ActivityLine, ActivityLinesWords } from './ActivityLines.svelte';
	import type { CommentData, CommentWords } from './CommentItem.svelte';
	import type { Mail, MailAction, MailFile, MailMessageWords } from './MailMessage.svelte';
	import type { SendStateWords, SendStep } from './SendState.svelte';

	/** One message of a chat service, such as a message that a customer sent to the support number. */
	export type ChatMessage = {
		id: string;
		at: Date;
		/** The author: the name, and the address of a picture on the host of the product when it has one. */
		from: { name: string; picture?: string };
		/** True for a message of the person who reads the conversation. It stands at the end. */
		own?: boolean;
		/** The paragraphs of the text. A single line break stays in a paragraph as \n. */
		body: string[];
		/** The language of the text when it differs from the interface, and its direction. */
		lang?: string;
		dir?: 'ltr' | 'rtl' | 'auto';
		/** Where the message came in or went out, in the words of the product, such as "Kiwi Talk · Support". It shows in the header of the run. */
		channel?: string;
		/** The icon of the channel, as channelIcon of Mail. It shows at 14 px before the words of channel, and with no channel it does not show. */
		channelIcon?: Component;
		/** The steps that the service reported for a message of the team. The footer shows them with SendState. */
		steps?: SendStep[];
		/** The reason when the message did not go out. The footer then shows the failure line and no send state. */
		failed?: string;
	};

	/** One message of the conversation with its kind, a mail or a chat message. Retry gives it to the product. */
	export type ConversationEntry = { kind: 'mail'; mail: Mail } | { kind: 'chat'; message: ChatMessage };

	/** The words of the part, in the language of the product. */
	export type ConversationWords = {
		/** The line of a chat message that did not go out, with the reason of the product (failed), and its button. */
		failed: (reason: string) => string;
		retry: string;
		/** The words of each mail, as words of MailMessage. */
		mail: Partial<MailMessageWords>;
		/** The words of the send state of each chat message, as words of SendState. */
		sendState: Partial<SendStateWords>;
		/** The words of each stretch of events, as words of ActivityLines. */
		lines: Partial<ActivityLinesWords>;
		/** The words of each comment, as words of CommentItem. */
		comment: Partial<CommentWords>;
	};

	/** @behaviour fold:activity */
	export type ConversationProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The root element, the <section> of the conversation. */
		ref?: HTMLElement | null;
		/** The mails, in any order: the part sorts a copy by time. */
		mails?: Mail[] | undefined;
		/** The chat messages, in any order: the part sorts a copy by time. */
		messages?: ChatMessage[] | undefined;
		/** The events of the team, in any order. A run of events between two other entries is one ActivityLines. */
		events?: ActivityLine[] | undefined;
		/** The comments of the team, in any order. Each is a CommentItem with internal. */
		comments?: CommentData[] | undefined;
		/** Now, for the time by its age. */
		now: Date;
		locale?: string | undefined;
		/** The time zone of the product, which counts the days of the date markers and gives each time. */
		timeZone: string;
		/** The heading, before the count of the mails and the chat messages. "Messages" by default. */
		label?: string | undefined;
		headingLevel?: 2 | 3 | undefined;
		/** The words under the heading that say what the count leaves out, such as "Comments and changes stand in their place." */
		note?: string | undefined;
		/** False in the view of one channel, where a tab names the channel: no mail and no chat message shows its channel. */
		showChannel?: boolean | undefined;
		onopenfile?: ((file: MailFile) => void) | undefined;
		/** Sends a mail or a chat message that did not go out again. Each message with failed shows Retry only when the product gives it. It takes the message with its kind. */
		onretry?: ((entry: ConversationEntry) => void) | undefined;
		/** Stops a reply that waits to go out, as onundo of MailThread. */
		onundo?: ((mail: Mail) => void) | undefined;
		/** Sends a reply that waits at once, as onsendnow of MailThread. */
		onsendnow?: ((mail: Mail) => void) | undefined;
		/** The HTML part of each mail with frame, as body of MailThread. */
		body?: Snippet<[Mail, string]> | undefined;
		/** Loads the remote pictures of a mail with frame, as onloadpictures of MailThread. */
		onloadpictures?: ((mail: Mail) => void) | undefined;
		/** Gives a new address of the page of a mail with frame, as onframe of MailThread. */
		onframe?: ((mail: Mail) => Promise<string>) | undefined;
		/** The actions of each mail, which end its line 1, as actions of MailThread. */
		actions?: ((mail: Mail) => MailAction[]) | undefined;
		/** The name of the More button of each mail, as actionsLabel of MailThread. */
		actionsLabel?: ((mail: Mail) => string) | undefined;
		/** The words of the part in the language of the product. Each word that the product does not give stays as in CONVERSATION_WORDS. The heading takes label. */
		words?: Partial<ConversationWords> | undefined;
	};

	/** The words of the part in English, which the words of the product replace one by one. */
	export const CONVERSATION_WORDS: ConversationWords = {
		failed: (reason) => `Not sent. ${reason}`,
		retry: 'Retry',
		mail: {},
		sendState: {},
		lines: {},
		comment: {}
	};
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import * as Bubble from '#lib/components/ui/bubble/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Marker from '#lib/components/ui/marker/index.js';
	import * as Message from '#lib/components/ui/message/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import ActivityLines from './ActivityLines.svelte';
	import { age } from './age.js';
	import CommentItem from './CommentItem.svelte';
	import MailMessage from './MailMessage.svelte';
	import SendState from './SendState.svelte';
	import { inConversation } from './thread-entries.js';

	let {
		mails = [],
		messages = [],
		events = [],
		comments = [],
		now,
		locale = 'en-GB',
		timeZone,
		label = 'Messages',
		headingLevel = 2,
		note,
		showChannel = true,
		onopenfile,
		onretry,
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
	}: ConversationProps = $props();

	const uid = $props.id();
	const w = $derived({ ...CONVERSATION_WORDS, ...words });
	const entries = $derived(inConversation(mails, messages, events, comments, timeZone));
	/** The level of the heading of each mail, of each run of chat messages and of each comment: one under the heading of the conversation. */
	const inner = $derived(headingLevel === 2 ? 3 : 4);
	const full = $derived(new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full', timeStyle: 'short' }));
	const date = $derived(new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full' }));
	const count = $derived(new Intl.NumberFormat(locale).format(mails.length + messages.length));

	/** The key of each entry on the screen in its order, with each chat message on its own and no day. */
	const keys = $derived(entries.flatMap((e) => (e.kind === 'day' ? [] : e.kind === 'chat' ? e.messages.map((m) => `s-${m.id}`) : [e.key])));
	const isMessage = (key: string) => key.startsWith('m-') || key.startsWith('s-');
	/** The key of the last mail or chat message. A read mail folds unless it is this message. */
	const lastMessage = $derived(keys.findLast(isMessage));
	const opened = new SvelteSet<string>();
	const isFolded = (m: Mail) => !opened.has(m.id) && !m.unread && !m.sendsAt && `m-${m.id}` !== lastMessage;
	/** The mail as the view of one channel shows it: with no channel and no icon of the channel. */
	function bare(m: Mail): Mail {
		const { channel: _channel, channelIcon: _icon, ...rest } = m;
		return rest;
	}
	const initial = (name: string) => name.trim().charAt(0).toUpperCase();

	/** The keys that the page shows, in their order. */
	let shownKeys: string[] = [];
	// Before the page drops the element of a removed entry, the effect finds the entry that holds the focus.
	// When the product removed it, the focus goes to the heading of the next message that stays, else of
	// the message before, else of the conversation, after the page shows the new list.
	$effect.pre(() => {
		const after = keys;
		untrack(() => {
			const before = shownKeys;
			shownKeys = after;
			const focused = document.activeElement;
			const held = focused?.closest<HTMLElement>('[data-entry]');
			if (!ref || !focused || !held || held.closest('[data-slot=conversation]') !== ref) return;
			const gone = held.dataset.entry ?? '';
			const index = before.indexOf(gone);
			if (index < 0) return;
			// The message stays, but its run can get a new key, such as when the first message of the run goes.
			// The page then builds the run again, and the focus goes to the heading of the run.
			if (after.includes(gone)) {
				tick().then(() => !focused.isConnected && focusHeading(gone));
				return;
			}
			const stays = (key: string) => isMessage(key) && after.includes(key);
			const next = before.slice(index + 1).find(stays) ?? before.slice(0, index).reverse().find(stays);
			tick().then(() => focusHeading(next));
		});
	});
	/** Focuses the heading of the message with the key, or the heading of the conversation. A folded mail takes the focus on its line, and a chat message on the heading of its run. */
	function focusHeading(key: string | undefined) {
		const el = key ? ref?.querySelector<HTMLElement>(`[data-entry="${CSS.escape(key)}"]`) : undefined;
		const target = !el
			? undefined
			: key?.startsWith('m-')
				? (el.querySelector<HTMLElement>('[data-slot=mail-message-fold]') ?? document.getElementById(el.getAttribute('aria-labelledby') ?? ''))
				: el.parentElement?.querySelector<HTMLElement>(`h${inner}`);
		(target ?? document.getElementById(`${uid}-head`))?.focus();
	}
</script>

{#snippet time(at: Date)}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<time {...props} tabindex="-1" datetime={at.toISOString()} class="tabular-nums">{age(at, now, locale, timeZone)}</time>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{full.format(at)}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<!-- A chat message: the header on the first message of its run, the bubble, and the footer. The avatar of the
     author stands beside the last bubble of the run, and the other messages of the run keep its column. -->
{#snippet chat(m: ChatMessage, first: boolean, last: boolean)}
	{@const ChannelIcon = m.channelIcon}
	<Message.Root align={m.own ? 'end' : 'start'} data-entry="s-{m.id}">
		{#if !m.own}
			{#if last}
				<Message.Avatar aria-hidden="true">
					<Avatar.Root>
						{#if m.from.picture}<Avatar.Image src={m.from.picture} alt="" />{/if}
						<Avatar.Fallback>{initial(m.from.name)}</Avatar.Fallback>
					</Avatar.Root>
				</Message.Avatar>
			{:else}
				<div aria-hidden="true" class="w-8 shrink-0"></div>
			{/if}
		{/if}
		<Message.Content>
			{#if first}
				<Message.Header>
					<!-- The header wraps on a narrow screen, so that a long name or channel never scrolls the page sideways. -->
					<span class="flex min-w-0 flex-wrap items-center gap-x-1.5">
						<svelte:element this={`h${inner}`} tabindex="-1" class="min-w-0 wrap-break-word outline-none focus-visible:underline"><bdi>{m.from.name}</bdi></svelte:element>
						{#if showChannel && m.channel}
							<span aria-hidden="true">·</span>
							<span class="inline-flex min-w-0 items-center gap-1 wrap-break-word">{#if ChannelIcon}<ChannelIcon class="size-3.5 shrink-0" aria-hidden="true" />{/if}{m.channel}</span>
						{/if}
						<span aria-hidden="true">·</span>
						<!-- The time is no target, so it stands in an inline box, where the 44 px of tooltip-trigger-phone does not reach it. -->
						<span>{@render time(m.at)}</span>
					</span>
				</Message.Header>
			{:else}
				<span class="sr-only"><bdi>{m.from.name}</bdi></span>
			{/if}
			<Bubble.Root variant={m.own ? 'default' : 'secondary'}>
				<Bubble.Content>
					<div lang={m.lang} dir={m.dir} class="flex flex-col gap-2 whitespace-pre-line">
						{#each m.body as p, i (i)}<p>{p}</p>{/each}
					</div>
				</Bubble.Content>
			</Bubble.Root>
			{#if m.failed}
				<Message.Footer>
					<span class="flex min-w-0 flex-wrap items-center gap-2 text-destructive">
						<CircleAlertIcon class="size-3.5 shrink-0" aria-hidden="true" />
						<span class="min-w-0 wrap-break-word">{w.failed(m.failed)}</span>
						{#if onretry}<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={() => onretry({ kind: 'chat', message: m })}>{w.retry}</Button>{/if}
					</span>
				</Message.Footer>
			{:else if m.steps?.length}
				<Message.Footer><SendState steps={m.steps} {now} {locale} {timeZone} words={w.sendState} /></Message.Footer>
			{/if}
		</Message.Content>
	</Message.Root>
{/snippet}

<!-- The part gives its tooltips their provider, so it works on a page with none. -->
<Tooltip.Provider>
	<section bind:this={ref} data-slot="conversation" aria-labelledby="{uid}-head" aria-describedby={note ? `${uid}-note` : undefined} class={cn('flex min-w-0 flex-col gap-3 text-sm', className)} {...rest}>
		<div class="flex flex-col gap-1">
			<svelte:element this={`h${headingLevel}`} id="{uid}-head" tabindex="-1" class="text-xs font-semibold text-muted-foreground outline-none focus-visible:underline">
				{label} <span class="tabular-nums">· {count}</span>
			</svelte:element>
			{#if note}<p id="{uid}-note" class="text-xs text-muted-foreground">{note}</p>{/if}
		</div>
		<!-- The entries stand in the section in the order of their time, so a screen reader reads them in the order of the screen. -->
		<div class="flex min-w-0 flex-col gap-4">
			{#each entries as e (e.key)}
				{#if e.kind === 'day'}
					<Marker.Root variant="separator"><Marker.Content><time datetime={e.day}>{date.format(e.at)}</time></Marker.Content></Marker.Root>
				{:else if e.kind === 'mail'}
					{@const m = e.mail}
					<MailMessage
						data-entry={e.key}
						mail={showChannel ? m : bare(m)}
						{now}
						{locale}
						{timeZone}
						headingLevel={inner}
						{onopenfile}
						onretry={onretry && (() => onretry({ kind: 'mail', mail: m }))}
						onundo={onundo && (() => onundo(m))}
						onsendnow={onsendnow && (() => onsendnow(m))}
						{body}
						onloadpictures={onloadpictures && (() => onloadpictures(m))}
						onframe={onframe && (() => onframe(m))}
						actions={actions?.(m)}
						actionsLabel={actionsLabel?.(m)}
						words={w.mail}
						bind:folded={() => isFolded(m), (v) => (v ? opened.delete(m.id) : opened.add(m.id))}
					/>
				{:else if e.kind === 'chat'}
					<Message.Group>
						{#each e.messages as m, i (m.id)}{@render chat(m, i === 0, i === e.messages.length - 1)}{/each}
					</Message.Group>
				{:else if e.kind === 'lines'}
					<ActivityLines data-entry={e.key} lines={e.lines} {now} {locale} {timeZone} words={w.lines} />
				{:else}
					<CommentItem data-entry={e.key} comment={e.comment} {now} {locale} {timeZone} internal headingLevel={inner} words={w.comment} />
				{/if}
			{/each}
		</div>
	</section>
</Tooltip.Provider>
