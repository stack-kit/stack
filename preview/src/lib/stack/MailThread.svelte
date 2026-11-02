<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Mail, MailFile } from './MailMessage.svelte';

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
	};
</script>

<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { cn } from '#lib/utils.js';
	import MailMessage from './MailMessage.svelte';

	// A mail thread (### mail-message in DESIGN.md): a section with a heading, such as
	// "Messages · 4", and the messages in the order of their time, the oldest first. Each message
	// that the person has read folds to one line, except the last message. An unread message and
	// the last message stay open, so the newest message and every new one show. A click on a
	// folded line opens it, and it stays open while the thread shows.
	let {
		mails,
		now,
		locale = 'en-GB',
		timeZone,
		label = 'Messages',
		headingLevel = 2,
		onopenfile,
		ref = $bindable(null),
		class: className,
		...rest
	}: MailThreadProps = $props();

	const uid = $props.id();
	const opened = new SvelteSet<string>();
	const isFolded = (m: Mail, i: number) => !opened.has(m.id) && !m.unread && i < mails.length - 1;
</script>

<section bind:this={ref} data-slot="mail-thread" aria-labelledby="{uid}-head" class={cn('flex flex-col', className)} {...rest}>
	<svelte:element this={`h${headingLevel}`} id="{uid}-head" class="pb-1 text-xs font-semibold text-muted-foreground">
		{label} <span class="tabular-nums">· {mails.length}</span>
	</svelte:element>
	{#each mails as m, i (m.id)}
		<MailMessage
			mail={m}
			{now}
			{locale}
			{timeZone}
			headingLevel={headingLevel === 2 ? 3 : 4}
			{onopenfile}
			bind:folded={() => isFolded(m, i), (v) => (v ? opened.delete(m.id) : opened.add(m.id))}
		/>
	{/each}
</section>
