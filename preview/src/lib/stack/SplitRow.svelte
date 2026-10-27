<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';
	import UnreadMark from './UnreadMark.svelte';

	// One row of a list in the work form of the split ("Row of the work form" in ### Lists of
	// DESIGN.md). The row has no data columns, so it puts the facts of the item in two or three
	// lines of 20 px: line 1 in body type, line 2 in small type, and line 3 in small type and
	// muted-foreground. Each line ends in an ellipsis, and the end of a line holds its time, its
	// value or its marks. The row has 6 px above its lines and 6 px under them, the 1 px divider
	// included: 52 px with two lines (h-13, spacing.row-phone) and 72 px with three (h-18,
	// spacing.row-three-line). The lead, such as the check box and the status icon, stands on the
	// height of line 1. Line 1 is the button that opens the item, and its area covers the row.
	// The row of the item that the column shows is the current row: aria-current and the muted
	// ground. Below 768 px the row keeps two lines, as the phone row of band 1. In a list with a
	// read state, line 1 ends in the place of the unread mark, so the times of the rows align. An
	// unread row shows the mark there, its title takes 500, and the name of the row button starts
	// with the word "Unread" ("Unread mark" in ### Lists, and ### unread-mark).
	let {
		id,
		lines = 2,
		current = false,
		selected = false,
		unread,
		onopen,
		lead,
		line1,
		end1,
		line2,
		end2,
		line3,
		end3
	}: {
		/** The id of the button of line 1, which J and K focus. */
		id: string;
		/** Every row of one list has the same number of lines, so every row has one height. */
		lines?: 2 | 3;
		/** True for the row of the item that the item column shows. */
		current?: boolean;
		/** True while the check box of the row is on. */
		selected?: boolean;
		/**
		 * The read state of the item, in a list that has one: true while the person has not read it.
		 * Leave it out in a list with no read state, and line 1 keeps no place for the mark.
		 */
		unread?: boolean;
		onopen?: () => void;
		/** The check box and the status icon, on the height of line 1. A control in the lead, such as the check box, takes relative z-10, so it stays above the area of the row button. */
		lead?: Snippet;
		/** The identifier and the title. */
		line1: Snippet;
		end1?: Snippet;
		/** The key values. */
		line2: Snippet;
		end2?: Snippet;
		/** One more fact, where the list needs it. A row of a list of three lines with no third fact keeps an empty line. */
		line3?: Snippet;
		end3?: Snippet;
	} = $props();

	const end = 'shrink-0 text-xs text-muted-foreground tabular-nums';
</script>

<li
	class={cn(
		'group/row relative flex gap-3 border-b border-border-faint pt-1.5 pr-4 pl-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-focus-visible:ring-inset',
		lines === 3 ? 'h-18 max-md:h-13' : 'h-13',
		selected ? 'bg-selected text-selected-foreground' : current ? 'bg-muted' : 'hover:bg-muted/50'
	)}
>
	{#if lead}<div class="flex h-5 shrink-0 items-center gap-3">{@render lead()}</div>{/if}
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="flex h-5 min-w-0 items-center gap-2 text-sm">
			<button
				type="button"
				{id}
				aria-current={current ? 'true' : undefined}
				class={cn('min-w-0 flex-1 cursor-pointer truncate text-left outline-none after:absolute after:inset-0', unread && 'font-medium')}
				onclick={onopen}
			>
				{#if unread}<span class="sr-only">Unread,</span>{/if}{@render line1()}
			</button>
			{#if end1}<span class={end}>{@render end1()}</span>{/if}
			{#if unread}<UnreadMark />{:else if unread === false}<span class="size-2 shrink-0" aria-hidden="true"></span>{/if}
		</div>
		<div class="flex h-5 min-w-0 items-center gap-2 text-xs">
			<p class="min-w-0 flex-1 truncate">{@render line2()}</p>
			{#if end2}<span class={end}>{@render end2()}</span>{/if}
		</div>
		{#if lines === 3}
			<div class="flex h-5 min-w-0 items-center gap-2 text-xs text-muted-foreground max-md:hidden">
				<p class="min-w-0 flex-1 truncate">{#if line3}{@render line3()}{/if}</p>
				{#if end3}<span class={end}>{@render end3()}</span>{/if}
			</div>
		{/if}
	</div>
</li>
