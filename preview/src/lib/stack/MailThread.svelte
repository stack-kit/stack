<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Mail, MailAction, MailFile, MailMessageWords } from './MailMessage.svelte';

	export type MailThreadProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The root element, the <section> of the thread. */
		ref?: HTMLElement | null;
		/** The messages in the order of their time, the oldest first. */
		mails: Mail[];
		now: Date;
		locale?: string;
		timeZone: string;
		label?: string;
		headingLevel?: 2 | 3;
		onopenfile?: (file: MailFile) => void;
		/** Sends a reply that did not go out again. Each message whose mail has failed shows Retry only when the product gives it. */
		onretry?: ((mail: Mail) => void) | undefined;
		/** Stops a reply that waits to go out. Each message whose mail has sendsAt shows Undo when the product gives it. */
		onundo?: (mail: Mail) => void;
		/** Sends a reply that waits at once. Each message whose mail has sendsAt shows Send now when the product gives it. */
		onsendnow?: (mail: Mail) => void;
		/** The HTML part of each mail with frame, in place of the HtmlFrame that each message draws. It takes the mail and the address of its page (frame, or the address that onframe gave). */
		body?: Snippet<[Mail, string]>;
		/** Loads the remote pictures of a mail with frame. Each message whose page names remote pictures shows Load pictures when the product gives it. It takes the mail. */
		onloadpictures?: ((mail: Mail) => void) | undefined;
		/** Gives a new address of the page of a mail with frame, or rejects. Each message calls it each time its frame mounts again after the first render, such as when a folded message opens. It takes the mail. */
		onframe?: ((mail: Mail) => Promise<string>) | undefined;
		/**
		 * The entries of the team after each mail, until the next mail, such as the events in ActivityLines
		 * and an internal comment in a CommentItem with internal. It takes the mail, and it renders in the
		 * section, between that mail and the next one, or after the last mail. placeAfter gives each entry to
		 * the last mail at or before its time. The heading and the fold of read messages count the mails only.
		 */
		after?: Snippet<[Mail]> | undefined;
		/** The words under the heading that say what the count leaves out, such as "Comments and changes stand in their place." */
		note?: string | undefined;
		/** The actions of each message, which end its line 1. It takes the mail. When the product removes a message that held the focus, the focus moves to the heading of the next message, else of the message before, else of the thread. */
		actions?: ((mail: Mail) => MailAction[]) | undefined;
		/** The name of the More button of each message, such as "Actions of the mail from Ana Turner". It takes the mail. */
		actionsLabel?: ((mail: Mail) => string) | undefined;
		/** The words of each message in the language of the product, as words of MailMessage. The heading takes label. */
		words?: Partial<MailMessageWords> | undefined;
	};

	// The entries for the snippet after: placeAfter gives each event and comment to its mail, with the
	// rule of CommentList for two entries of one time (thread-entries.ts).
	import { placeAfter, type MailEntry } from './thread-entries.js';
	export type { MailEntry };
	export { placeAfter };
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { cn } from '#lib/utils.js';
	import MailMessage from './MailMessage.svelte';

	// A mail thread (### mail-message in DESIGN.md): a section with a heading, such as
	// "Messages · 4", and the messages in the order of their time, the oldest first. Each message
	// that the person has read folds to one line, except the last message. An unread message and
	// the last message stay open, so the newest message and every new one show. A click on a
	// folded line opens it, and it stays open while the thread shows. The snippet after renders the
	// entries of the team after each mail, in a box that takes no room while it holds no element. The last
	// message has no divider, and the box after it draws one when it holds an entry. The actions of
	// each message come from the product. When the product removes a message that held the focus, the
	// focus moves to the heading of the next message, else of the message before, else of the thread,
	// so that it never falls to the page. The thread gives words to each message. Its heading takes
	// label, "Messages" by default, and the count, so the thread has no words type of its own.
	let {
		mails,
		now,
		locale = 'en-GB',
		timeZone,
		label = 'Messages',
		headingLevel = 2,
		onopenfile,
		onretry,
		onundo,
		onsendnow,
		body,
		onloadpictures,
		onframe,
		after,
		note,
		actions,
		actionsLabel,
		words,
		ref = $bindable(null),
		class: className,
		...rest
	}: MailThreadProps = $props();

	const uid = $props.id();
	const opened = new SvelteSet<string>();
	const isFolded = (m: Mail, i: number) => !opened.has(m.id) && !m.unread && !m.sendsAt && i < mails.length - 1;

	/** The ids of the mails that the page shows, in their order. */
	let shownIds: string[] = [];
	// Before the page drops the article of a removed mail, the effect finds the mail whose article holds
	// the focus. When the product removed that mail, the focus goes to the heading of the next mail that
	// stays, else of the mail before, else of the thread, after the page shows the new list.
	$effect.pre(() => {
		const ids = mails.map((m) => m.id);
		untrack(() => {
			const before = shownIds;
			shownIds = ids;
			const held = document.activeElement?.closest('[data-slot=mail-message]');
			if (!ref || !held || held.parentElement !== ref) return;
			const index = [...ref.querySelectorAll(':scope > [data-slot=mail-message]')].indexOf(held);
			const gone = before[index];
			if (gone === undefined || ids.includes(gone)) return;
			const next = before.slice(index + 1).find((id) => ids.includes(id)) ?? before.slice(0, index).reverse().find((id) => ids.includes(id));
			tick().then(() => focusHeading(next));
		});
	});
	/** Focuses the heading of the mail with the id, or the heading of the thread. A folded mail takes the focus on its line, which its heading holds. */
	function focusHeading(id: string | undefined) {
		const articles = ref ? [...ref.querySelectorAll<HTMLElement>(':scope > [data-slot=mail-message]')] : [];
		const article = id === undefined ? undefined : articles[mails.findIndex((m) => m.id === id)];
		const target = article?.querySelector<HTMLElement>('[data-slot=mail-message-fold]') ?? document.getElementById(article?.getAttribute('aria-labelledby') ?? `${uid}-head`);
		target?.focus();
	}
</script>

<section bind:this={ref} data-slot="mail-thread" aria-labelledby="{uid}-head" aria-describedby={note ? `${uid}-note` : undefined} class={cn('flex flex-col', className)} {...rest}>
	<svelte:element this={`h${headingLevel}`} id="{uid}-head" tabindex="-1" class="pb-1 text-xs font-semibold text-muted-foreground outline-none focus-visible:underline">
		{label} <span class="tabular-nums">· {new Intl.NumberFormat(locale).format(mails.length)}</span>
	</svelte:element>
	{#if note}<p id="{uid}-note" data-slot="mail-thread-note" class="pb-1 text-xs text-muted-foreground">{note}</p>{/if}
	{#each mails as m, i (m.id)}
		{@const last = i === mails.length - 1}
		<MailMessage
			mail={m}
			{now}
			{locale}
			{timeZone}
			headingLevel={headingLevel === 2 ? 3 : 4}
			{onopenfile}
			onretry={onretry && (() => onretry(m))}
			onundo={onundo && (() => onundo(m))}
			onsendnow={onsendnow && (() => onsendnow(m))}
			{body}
			onloadpictures={onloadpictures && (() => onloadpictures(m))}
			onframe={onframe && (() => onframe(m))}
			actions={actions?.(m)}
			actionsLabel={actionsLabel?.(m)}
			{words}
			class={after && last ? 'border-b-0' : undefined}
			bind:folded={() => isFolded(m, i), (v) => (v ? opened.delete(m.id) : opened.add(m.id))}
		/>
		{#if after}
			<!-- The entries stand in the section, between two articles, so a screen reader reads them in the order of the screen. -->
			<div data-slot="mail-thread-after" class={cn('flex min-w-0 flex-col gap-4 py-4 text-sm not-has-[*]:hidden', last && 'border-t border-border')}>{@render after(m)}</div>
		{/if}
	{/each}
</section>
