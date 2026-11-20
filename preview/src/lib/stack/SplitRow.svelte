<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLLiAttributes } from 'svelte/elements';

	/**
	 * Who owns the open item. With key, inside a ListSplit with an address, the row takes its button
	 * id, its current state and its open from the address. With id, as in v1.0.0, the page gives them.
	 */
	type RowSource =
		| {
				/** The identifier of the item, as in the address, such as "QUO-0042". */
				key: string;
				id?: never;
				current?: never;
				onopen?: never;
		  }
		| {
				key?: never;
				/** The id of the button of line 1, which J and K focus. */
				id: string;
				/** True for the row of the item that the item column shows. */
				current?: boolean;
				onopen?: () => void;
		  };

	export type SplitRowProps = Omit<HTMLLiAttributes, 'children'> &
		RowSource & {
			ref?: HTMLLIElement | null;
			/** Every row of one list has the same number of lines, so every row has one height. */
			lines?: 2 | 3;
			/**
			 * True for a list that takes the whole width. From 768 px the row then puts its parts in one
			 * line of 32 px, and below 768 px it keeps the phone row of two lines. lines and line 3 then do
			 * not apply. A list in the work form docks its item from 1024 px, so it gives
			 * oneLine={!itemDocks.current}.
			 */
			oneLine?: boolean;
			/** True while the row is selected: the selected ground. */
			selected?: boolean;
			/** True while the check box of the row is on. The row then takes the selected ground too. */
			checked?: boolean;
			/** A list with a selection gives it, and the row draws its check box. A list with no selection leaves it out. */
			oncheck?: (checked: boolean) => void;
			/**
			 * The read state of the item, in a list that has one: true while the person has not read it.
			 * Leave it out in a list with no read state, and line 1 keeps no place for the mark.
			 */
			unread?: boolean;
			/** The status icon, on the height of line 1. A control in the lead takes relative z-10, so it stays above the area of the row button. */
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
		};
</script>

<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { cn } from '#lib/utils.js';
	import { getItemContext } from './behaviour/item.js';
	import UnreadMark from './UnreadMark.svelte';

	// One row of a list in the work form of the split ("Row of the work form" in ### Lists of
	// DESIGN.md). The row has no data columns, so it puts the facts of the item in two or three
	// lines of 20 px: line 1 in body type, line 2 in small type, and line 3 in small type and
	// muted-foreground. Each line ends in an ellipsis, and the end of a line holds its time, its
	// value or its marks. The row has 6 px above its lines and 6 px under them, the 1 px divider
	// included: 52 px with two lines (h-13, spacing.row-phone) and 72 px with three (h-18,
	// spacing.row-three-line). The check box and the status icon stand on the height of line 1. The
	// check box shows on hover, on focus and while any row is checked ("Row" in ### Lists). Line 1 is
	// the button that opens the item, and its area covers the row.
	// The row of the item that the column shows is the current row: aria-current and the muted
	// ground. Below 768 px the row keeps two lines, as the phone row of band 1. In a list with a
	// read state, line 1 ends in the place of the unread mark, so the times of the rows align. An
	// unread row shows the mark there, its title takes 500, and the name of the row button starts
	// with the word "Unread" ("Unread mark" in ### Lists, and ### unread-mark).
	// Inside a ListSplit with an address, Enter on the row button opens the item on its full page
	// when the address has an href, and else it opens the item in the column.
	// With oneLine, from 768 px the row is one line of 32 px (h-8, spacing.row), as the row of a list
	// with data columns ("One line from 768 px" in ### Lists). The box of line 1 takes display
	// contents, so its parts stand in the line of the body, and the order puts line 2 after the
	// title. The title takes the rest of the width. Line 2 with its end takes a column of 240 px
	// (md:w-60), and of 320 px from 1280 px (xl:w-80). The end of line 1 takes a column of 108 px
	// (md:w-27), aligned to its end, so the key values and the times of the rows align. The body puts
	// its parts 8 px apart, and line 2 takes 4 px more at each side, so the cells stand 12 px apart,
	// and the place of the unread mark stays 8 px after the time.
	let {
		key,
		id,
		lines = 2,
		oneLine = false,
		current = false,
		selected = false,
		checked = false,
		oncheck,
		unread,
		onopen,
		lead,
		line1,
		end1,
		line2,
		end2,
		line3,
		end3,
		class: className,
		ref = $bindable(null),
		...rest
	}: SplitRowProps = $props();

	const address = getItemContext();
	const uid = $props.id();
	const buttonId = $derived(key === undefined ? id : address?.rowId(key));
	const isCurrent = $derived(key === undefined ? current : address?.key === key);
	const ground = $derived(selected || checked);
	const end = 'shrink-0 text-xs text-muted-foreground tabular-nums';

	function open() {
		if (key === undefined) onopen?.();
		else void address?.show(key);
	}
</script>

<li
	bind:this={ref}
	data-slot="split-row"
	data-key={key}
	data-checked={checked || undefined}
	class={cn(
		'group/row relative flex gap-3 border-b border-border-faint pt-1.5 pr-4 pl-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-focus-visible:ring-inset',
		oneLine ? 'h-13 md:h-8 md:items-center md:pt-0' : lines === 3 ? 'h-18 max-md:h-13' : 'h-13',
		ground ? 'bg-selected text-selected-foreground' : isCurrent ? 'bg-muted' : 'hover:bg-muted/50',
		className
	)}
	{...rest}
>
	{#if oncheck || lead}
		<div class="flex h-5 shrink-0 items-center gap-3">
			{#if oncheck}
				<span id="{uid}-select" class="sr-only">Select</span>
				<Checkbox
					class={cn(
						'relative z-10',
						!checked &&
							'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 in-[[data-slot=list-split-list]:has([data-checked])]:opacity-100'
					)}
					{checked}
					onCheckedChange={oncheck}
					aria-labelledby="{uid}-select {uid}-line1"
				/>
			{/if}
			{#if lead}{@render lead()}{/if}
		</div>
	{/if}
	<div class={cn('flex min-w-0 flex-1 flex-col', oneLine && 'md:flex-row md:items-center md:gap-2')}>
		<div class={cn('flex h-5 min-w-0 items-center gap-2 text-sm', oneLine && 'md:contents')}>
			<button
				type="button"
				id={buttonId}
				aria-current={isCurrent ? 'true' : undefined}
				data-keys-enter={key === undefined ? undefined : ''}
				class={cn('min-w-0 flex-1 cursor-pointer truncate text-left outline-none after:absolute after:inset-0', unread && 'font-medium', oneLine && 'md:-order-2')}
				onclick={open}
			>
				{#if unread}<span class="sr-only">Unread,</span>{/if}<span id="{uid}-line1">{@render line1()}</span>
			</button>
			{#if end1}<span class={cn(end, oneLine && 'md:w-27 md:truncate md:text-right')}>{@render end1()}</span>{/if}
			{#if unread}<UnreadMark />{:else if unread === false}<span class="size-2 shrink-0" aria-hidden="true"></span>{/if}
		</div>
		<div class={cn('flex h-5 min-w-0 items-center gap-2 text-xs', oneLine && 'md:-order-1 md:mx-1 md:w-60 md:shrink-0 xl:w-80')}>
			<p class="min-w-0 flex-1 truncate">{@render line2()}</p>
			{#if end2}<span class={end}>{@render end2()}</span>{/if}
		</div>
		{#if lines === 3 && !oneLine}
			<div class="flex h-5 min-w-0 items-center gap-2 text-xs text-muted-foreground max-md:hidden">
				<p class="min-w-0 flex-1 truncate">{#if line3}{@render line3()}{/if}</p>
				{#if end3}<span class={end}>{@render end3()}</span>{/if}
			</div>
		{/if}
	</div>
</li>
