<!--
	The bar of a request of the writing tools and of its result in the rich text field (### rich-text-field
	in DESIGN.md, "Writing tools"), between the toolbar and the text. It holds content that no person
	confirmed, so it takes a dashed edge in input under it and the proposal badge, which names the source.
	Its first line holds the state and the actions at its end, and its second line, in small, says what the
	person can do. The bar stands in the input group of the field, so no button takes disabled.

	| State | First line | Second line |
	| Running | The words of the busy button, such as "Checking…", and who asked and when | "The text is locked until the result comes." |
	| Stopped | "The request stopped. The text did not change." | |
	| Failed | The words that onfailure gave, with the warning icon; with no words the bar shows nothing | |
	| A whole text waits | Its title and its count of changes, the key of the tints, Take all and Leave all | "Take or leave the whole proposal. Until then, the text is locked." |
	| Changes wait | The count by rule, Take all and Leave all | "Take or leave each change under the text." |
	| A change is old | The warning icon and the count, and Leave all | "Take is off for each change whose words an edit changed." |
	| Decided | "Each change is decided · 3 taken, 1 left" | |
	| No change | "Nothing to change." | |

	The note of the service, when it gives one, is a line of its own. The key of a whole text shows the two
	tints of the marks with the underline and the line through, and a screen reader skips it, because each
	mark says its own words. While takeOff gives a reason, Take all stays in the tab order with that reason
	and does not act. The bar shows nothing while no request ran. Its status region is in the page from the
	mount of the bar, empty, so that a screen reader hears the first words that come into it. While the bar
	shows nothing, it takes no room.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WritingWords } from '#lib/stack/rich-text.js';
	import type { WritingState } from './writing.svelte.js';

	export type RequestBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		/** The name of the source in the proposal badge, such as "Suggestions". */
		source: string;
		words: WritingWords;
		state: WritingState;
		/** The number of each change whose words an edit changed. */
		stale: ReadonlySet<number>;
		/** Why Take all cannot act, as a sentence, such as while the text is read-only. Leave it undefined while Take all may act. */
		takeOff?: string | undefined;
		/** Takes the whole text while one waits, else each open change that is not old. */
		ontakeall: () => void;
		/** Leaves the whole text while one waits, else each open change. */
		onleaveall: () => void;
	};
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import XIcon from '@lucide/svelte/icons/x';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import ReasonButton from '#lib/stack/ReasonButton.svelte';
	import { reasonOf } from '../reason.js';

	let { source, words: w, state: s, stale, takeOff, ontakeall, onleaveall, class: className, ref = $bindable(null), ...rest }: RequestBarProps = $props();

	const changes = $derived(s.kind === 'changes' ? s.changes : []);
	const open = $derived(changes.filter((c) => c.state === 'open'));
	const old = $derived(open.filter((c) => stale.has(c.n)));
	const taken = $derived(changes.filter((c) => c.state === 'taken').length);
	const leftCount = $derived(changes.filter((c) => c.state === 'left').length);
	/** The open changes by rule, in the words of the rule that the product gives, such as "Spelling 2, Grammar 1". */
	const byRule = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const c of open) counts.set(c.rule, (counts.get(c.rule) ?? 0) + 1);
		return [...counts].map(([rule, n]) => `${rule} ${n}`).join(', ');
	});
	const shows = $derived(s.kind !== 'idle' && !(s.kind === 'failed' && !s.words));
	/** The words of the status region: the request that runs, a stop, or the words of a failure. */
	const said = $derived(s.kind === 'running' ? `${w.running[s.request.kind]}…` : s.kind === 'stopped' ? w.stopped : s.kind === 'failed' ? (s.words ?? '') : '');
	const asked = $derived(s.kind !== 'idle' && s.asked ? w.asked(s.asked.by, s.asked.at) : '');
	const note = $derived(s.kind === 'changes' || s.kind === 'text' ? s.note : null);
</script>

<div
	bind:this={ref}
	data-slot="rich-text-request-bar"
	class={cn('flex w-full flex-col gap-0.5 text-sm text-muted-foreground', shows && 'border-b border-dashed border-input px-3 py-2', className)}
	{...rest}
>
	<div class={cn('flex flex-wrap items-center gap-x-2 gap-y-1', shows && 'min-h-6')}>
		{#if shows}<Badge variant="outline" class="border-dashed border-input">{source}</Badge>{/if}
		<span class="min-w-0 flex-1">
			{#if s.kind === 'failed' && s.words}<TriangleAlertIcon aria-hidden="true" class="mr-1 inline size-3.5 text-warning" />{/if}<span role="status" class={cn(s.kind === 'failed' && 'text-foreground')}>{said}</span>
			{#if s.kind === 'text'}
				{s.title} · {w.count(s.count)}
			{:else if s.kind === 'changes'}
				{#if old.length > 0}
					<TriangleAlertIcon aria-hidden="true" class="mr-1 inline size-3.5 text-warning" />{w.textChanged} · {w.waiting(open.length, old.length)}
				{:else if open.length > 0}
					{w.count(open.length)} · {byRule}
				{:else if changes.length > 0}
					{w.decided(taken, leftCount)}
				{:else}
					{w.nothing}
				{/if}
			{/if}
			{#if asked}· {asked}{/if}
		</span>
		{#if s.kind === 'text'}
			<span class="flex shrink-0 flex-wrap items-center gap-1">
				<span data-slot="rich-text-request-key" aria-hidden="true" class="mr-1 flex items-center gap-1 text-xs text-foreground">
					<span class="rounded-sm bg-diff-added/30 px-1 underline underline-offset-2">{w.inserted}</span>
					<span class="rounded-sm bg-diff-removed/30 px-1 line-through">{w.deleted}</span>
				</span>
				{@render takeAll()}
				{@render leaveAll()}
			</span>
		{:else if old.length > 0}
			{@render leaveAll()}
		{:else if open.length > 0}
			<span class="flex shrink-0 items-center gap-1">
				{@render takeAll()}
				{@render leaveAll()}
			</span>
		{/if}
	</div>
	{#if s.kind === 'running'}
		<p class="text-xs">{w.locked}</p>
	{:else if s.kind === 'text'}
		<p class="text-xs">{w.proposalHint}</p>
	{:else if old.length > 0}
		<p class="text-xs">{w.oldHint}</p>
	{:else if open.length > 0}
		<p class="text-xs">{w.takeOrLeave}</p>
	{/if}
	{#if note}<p class="text-xs">{note}</p>{/if}
</div>

{#snippet takeAll()}
	<ReasonButton variant="outline" size="xs" data-action="take-all" {...reasonOf(takeOff)} onclick={ontakeall}><CheckIcon data-icon="inline-start" />{w.takeAll}</ReasonButton>
{/snippet}

{#snippet leaveAll()}
	<Button variant="ghost" size="xs" data-action="leave-all" onclick={onleaveall}><XIcon data-icon="inline-start" />{w.leaveAll}</Button>
{/snippet}
