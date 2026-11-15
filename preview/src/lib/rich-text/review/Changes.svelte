<!--
	The rows of the proposed changes of the rich text field (### rich-text-field in DESIGN.md, "Writing
	tools"), under the text. A change is content that no person confirmed, so each row takes a dashed edge
	in input. A row holds the number of the change, its rule at 600, its reason in small, the change as the
	word marks of ### diff, Take as an outline button of size xs and Leave as a ghost button of size xs. The
	words of an open change are marked in the text too, outside the content (engine/engine.ts).

	A change turns old when an edit by hand changes its words, or when they then stand more than once in
	their line. An old row shows the warning icon and "Old", and Take is off with its reason; Leave stays.
	A change that the person took has no row. A change that the person left moves to Left out, under the
	open rows, with Take after all, which is off with its reason while the change is old.

	A pointer over an open row, or the focus in it, marks the words of its change in the text (onactive).

	The focus never falls to the page. When the button with the focus leaves with its row, the focus goes
	to the same button of the row that takes its place, or of the last row with that button, and to the text
	through onback when no such row is left. With no row, the part has no padding and takes no room.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WritingWords } from '#lib/stack/rich-text.js';
	import type { Change } from './writing.svelte.js';

	export type ChangesProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		changes: readonly Change[];
		/** The number of each change whose words an edit changed. */
		stale: ReadonlySet<number>;
		words: WritingWords;
		/** Why no Take can run now, such as while the text is read-only; undefined while it can. */
		takeOff?: string | undefined;
		ontake: (n: number) => void;
		onleave: (n: number) => void;
		/** Takes a change that the person left. */
		ontakeafterall: (n: number) => void;
		/** The change whose row the person looks at, or null. */
		onactive?: ((n: number | null) => void) | undefined;
		/** Moves the focus back to the text, when the row with the focus leaves and no row is left. */
		onback?: (() => void) | undefined;
	};
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '#lib/components/ui/button/index.js';
	import { untrack } from 'svelte';
	import { cn } from '#lib/utils.js';
	import ReasonButton from '#lib/stack/ReasonButton.svelte';
	import { reasonOf } from '../reason.js';

	let { changes, stale, words: w, takeOff, ontake, onleave, ontakeafterall, onactive, onback, onfocusin: pageFocusIn, onfocusout: pageFocusOut, class: className, ref = $bindable(null), ...rest }: ChangesProps = $props();

	const uid = $props.id();
	const open = $derived(changes.filter((c) => c.state === 'open'));
	const left = $derived(changes.filter((c) => c.state === 'left'));

	// The button that held the focus last: its action and its place among the buttons of that action. A
	// ReasonButton with its reason line puts data-action on the box around the button, so the action comes from closest().
	let held: { el: HTMLElement; action: string; index: number } | null = null;

	function onfocusin(e: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		pageFocusIn?.(e);
		const el = e.target instanceof HTMLElement ? e.target : null;
		const box = el?.closest<HTMLElement>('[data-action]');
		const action = box?.dataset.action;
		const all = ref && action ? [...ref.querySelectorAll(`[data-action="${action}"]`)] : [];
		held = el && box && action ? { el, action, index: all.indexOf(box) } : null;
	}

	// The focus that moves to another element ends the record. A button that leaves the page gives no
	// relatedTarget, so its record stays for the effect below.
	function onfocusout(e: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		pageFocusOut?.(e);
		if (e.relatedTarget instanceof Node && !ref?.contains(e.relatedTarget)) held = null;
	}

	// A row leaves when its change is decided, and a Take button changes its form when takeOff changes.
	$effect(() => {
		void changes;
		void takeOff;
		untrack(() => {
			const h = held;
			// The focus fell only when its button left the page and nothing else took the focus.
			if (!h || h.el.isConnected || (document.activeElement !== null && document.activeElement !== document.body)) return;
			held = null;
			const boxes = ref?.querySelectorAll<HTMLElement>(`[data-action="${h.action}"]`) ?? [];
			const box = boxes[Math.min(h.index, boxes.length - 1)];
			const next = box?.matches('button') ? box : box?.querySelector<HTMLElement>('button');
			if (next) next.focus();
			else onback?.();
		});
	});
</script>

<div bind:this={ref} data-slot="rich-text-changes" class={cn('flex w-full flex-col gap-1.5', changes.some((c) => c.state !== 'taken') && 'px-3 py-2', className)} {...rest} {onfocusin} {onfocusout}>
	{#each open as c (c.n)}
		{@const old = stale.has(c.n)}
		<!-- A key on a button of a row is a key of that button, and never reaches the text. -->
		<div
			role="group"
			aria-label={w.change(c.n)}
			data-change={c.n}
			class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-dashed border-input py-1 pr-1 pl-2 text-xs text-muted-foreground"
			onpointerenter={() => onactive?.(c.n)}
			onpointerleave={() => onactive?.(null)}
			onfocusin={() => onactive?.(c.n)}
			onfocusout={() => onactive?.(null)}
		>
			{@render head(c, old)}
			<span class="flex shrink-0 items-center gap-1">
				<ReasonButton variant="outline" size="xs" aria-label={w.takeChange(c.n)} data-action="take" {...reasonOf(old ? w.oldReason : takeOff)} {...(old ? { describedby: `${uid}-why-${c.n}` } : {})} onclick={() => ontake(c.n)}>
					<CheckIcon data-icon="inline-start" />{w.take}
				</ReasonButton>
				<Button variant="ghost" size="xs" aria-label={w.leaveChange(c.n)} data-action="leave" onclick={() => onleave(c.n)}><XIcon data-icon="inline-start" />{w.leave}</Button>
			</span>
		</div>
		{#if old}<p id="{uid}-why-{c.n}" class="-mt-1 ml-2 text-xs text-muted-foreground">{w.oldReason}</p>{/if}
	{/each}
	{#if left.length > 0}
		<p id="{uid}-left" class="mt-1 text-xs font-semibold text-muted-foreground">{w.leftOut}</p>
		<div role="group" aria-labelledby="{uid}-left" class="flex flex-col gap-1.5">
			{#each left as c (c.n)}
				{@const old = stale.has(c.n)}
				<div role="group" aria-label={w.change(c.n)} data-change={c.n} data-left="" class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-dashed border-input py-1 pr-1 pl-2 text-xs text-muted-foreground">
					{@render head(c, old)}
					<ReasonButton variant="outline" size="xs" aria-label={w.takeAfterAllChange(c.n)} data-action="take-after-all" {...reasonOf(old ? w.oldReason : takeOff)} onclick={() => ontakeafterall(c.n)}>
						<CheckIcon data-icon="inline-start" />{w.takeAfterAll}
					</ReasonButton>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#snippet head(c: Change, old: boolean)}
	<span aria-hidden="true" class="inline-grid h-4 min-w-4 place-items-center rounded-sm border border-border bg-muted px-1 text-2xs font-semibold text-foreground tabular-nums">{c.n}</span>
	{#if old}
		<TriangleAlertIcon aria-hidden="true" class="size-3.5 shrink-0 text-warning" />
		<span class="font-semibold whitespace-nowrap text-foreground">{w.old} ·</span>
	{/if}
	<span class="font-semibold whitespace-nowrap text-foreground">{c.rule}</span>
	<span class={cn('min-w-0 wrap-break-word text-foreground', old && 'opacity-50')}>
		<span class="sr-only">{w.deleted} </span><del class="rounded-xs bg-diff-removed/30 px-0.5 line-through">{c.old}</del>{#if c.new}<span class="sr-only"> {w.inserted} </span><ins class="ml-1 rounded-xs bg-diff-added/30 px-0.5 underline underline-offset-2">{c.new}</ins>{/if}
	</span>
	<span class="min-w-0 flex-1 basis-40 wrap-break-word">{c.reason}</span>
{/snippet}
