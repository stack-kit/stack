<script lang="ts" module>
	/** @behaviour item-in-address first-row read escape:item keys:next-row,previous-row,open-item */
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ItemInAddress } from './behaviour/item.js';
	import { bands } from './behaviour/width.js';

	/**
	 * True from 1024 px (64rem, from the breakpoints of DESIGN.md), where the item column docks beside the list. There the column shows the
	 * first row when the address names no item; below 1024 px no item opens by itself, because the
	 * item covers the list ("First row" in ### Detail pane of DESIGN.md). It is bands.lg of
	 * behaviour/width.
	 */
	export const itemDocks = bands.lg;

	/** The form of the item column: 'item' docked beside the list from 1024 px, 'pane' over the list from 768 to 1023 px. */
	export type ListSplitLayout = 'item' | 'pane';

	/**
	 * Who owns the open item. With address, the part keeps it in the web address, and binds Esc, J, K,
	 * Down, Up and Enter. With open and key, as in v1.0.0, the page keeps it and binds the keys.
	 */
	type Source =
		| { address: ItemInAddress; open?: never; key?: never }
		| {
				address?: never;
				/** True while the item column shows. */
				open: boolean;
				/** The identifier of the item in the column. */
				key?: string;
		  };

	export type ListSplitProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
		Source & {
			ref?: HTMLDivElement | null;
			/** The name of the list, as a heading for a screen reader. */
			listLabel: string;
			/** The name of the item column, such as "Ticket QUO-0042". */
			itemLabel: string;
			list: Snippet;
			/** The item, with the form of its column. */
			item: Snippet<[ListSplitLayout]>;
			/** A band across both columns, such as the key figures of the list. */
			head?: Snippet;
		};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { setItemContext } from './behaviour/item.js';
	import { bindKey, onEscape } from './behaviour/keys.js';

	// The work form of the split, from 768 px ("Two forms of the split" in ### App shell, and
	// "Work form" in ### Width bands of DESIGN.md). The list takes a column of 340 px from 1024 px
	// (lg:w-85, spacing.list-column) and of 400 px from 1280 px (xl:w-100, spacing.list-column-wide),
	// and the item column takes the rest of the width, on background with a border edge on its left.
	// From 768 to 1023 px the list takes the whole width, and the item lies over its right side at
	// 420 px, on popover with shadow-lg, as the pane of the table form does. While the item column is
	// closed, the list takes the whole width in every band. Each column scrolls on its own and keeps
	// the bottom safe area. Each column is also the containing block of the absolute boxes in it
	// (relative), so such a box, such as a line for a screen reader under a long item, scrolls with its
	// column. A static column let that box out to the wrapper, which made the document higher than
	// the window, and a wheel over a short list then scrolled the document. From 768 px a wheel at the
	// end of a column stops there (overscroll-contain), and the wrapper of the two columns never
	// scrolls.
	// When only the item changes, the list keeps its scroll position, and the item column scrolls to
	// its top. The scroll boxes are list-split-list and list-split-item, so a frame can bring the list
	// back to its top on another page or view. Below 768 px the list takes the whole screen, the item
	// column does not show, the list keeps the overscroll of the browser, and the keys of the list do
	// nothing: a page gives the item its own screen there. The head spans both columns.
	//
	// With address, the rows inside the list take the open item, the focus and the read state from
	// the address (behaviour/item). Esc closes the item column after an open layer and the selection,
	// J and Down show the next row, K and Up the row before, and Enter opens the item on its full page
	// when the address has an href. While the focus is in a dialog or a menu, the keys of the list do
	// nothing, so a letter there does not change the item behind the layer. They also do nothing while
	// the keysOff function of the address gives true, such as while the item holds an open form.
	let {
		address,
		open,
		key,
		listLabel,
		itemLabel,
		list,
		item,
		head,
		class: className,
		ref = $bindable(null),
		...rest
	}: ListSplitProps = $props();

	// The address of a split stays for its life, so the rows take it once.
	// svelte-ignore state_referenced_locally
	if (address) setItemContext(address);

	const uid = $props.id();
	const shows = $derived(address ? address.open : !!open);
	const shownKey = $derived(address ? address.key : key);
	let column = $state<HTMLElement>();

	// A new item starts at its top. The list is not drawn again, so it keeps its scroll position.
	$effect(() => {
		void shownKey;
		if (column) column.scrollTop = 0;
	});

	/** True while the focus is in a dialog, a menu or a list box, which keeps the keys of the list. */
	const inLayer = () => !!document.activeElement?.closest('[role=dialog], [role=alertdialog], [role=menu], [role=listbox]');

	/** The key of the row inside this split that has focus. */
	function focusedRow(): string | undefined {
		const el = document.activeElement;
		return el && ref?.contains(el) ? el.closest<HTMLElement>('[data-key]')?.dataset.key : undefined;
	}

	// The keys of the list, from 768 px. Below 768 px and in a layer a binding declines, so the key
	// keeps its own use there.
	$effect(() => {
		const a = address;
		if (!a) return;
		const offs = [
			bindKey('next-row', () => {
				if (!bands.md.current || inLayer() || a.keysOff) return false;
				void a.step(1);
			}),
			bindKey('previous-row', () => {
				if (!bands.md.current || inLayer() || a.keysOff) return false;
				void a.step(-1);
			}),
			bindKey('open-item', () => {
				const k = focusedRow() ?? a.key;
				if (!bands.md.current || inLayer() || a.keysOff || k === null || !a.openPage(k)) return false;
			})
		];
		return () => offs.forEach((off) => off());
	});
	// Esc reaches the item column last: after an open layer and after the selection.
	$effect(() => {
		const a = address;
		if (!a || !a.open || !bands.md.current || a.keysOff) return;
		return onEscape('item', () => {
			void a.close();
		});
	});
</script>

<div bind:this={ref} data-slot="list-split" class={cn('flex min-h-0 flex-1 flex-col', className)} {...rest}>
	{#if head}<div data-slot="list-split-head" class="shrink-0">{@render head()}</div>{/if}
	<div class="relative flex min-h-0 flex-1">
		<section
			data-slot="list-split-list"
			aria-labelledby="{uid}-list"
			class={['safe-bottom relative flex min-h-0 min-w-0 flex-col overflow-y-auto md:overscroll-contain', shows ? 'flex-1 lg:w-85 lg:flex-none xl:w-100' : 'flex-1']}
		>
			<h2 id="{uid}-list" class="sr-only">{listLabel}</h2>
			{@render list()}
		</section>
		{#if shows}
			<aside
				bind:this={column}
				data-slot="list-split-item"
				aria-label={itemLabel}
				class="safe-bottom absolute inset-y-0 right-0 z-30 w-105 overflow-y-auto overscroll-contain border-l border-border bg-popover shadow-lg max-md:hidden lg:relative lg:z-auto lg:w-auto lg:min-w-0 lg:flex-1 lg:bg-background lg:shadow-none print:max-lg:hidden"
			>
				{@render item(itemDocks.current ? 'item' : 'pane')}
			</aside>
		{/if}
	</div>
</div>

<style>
	/* The list and the item column reach the bottom edge of the screen, so each keeps the bottom
	   safe area (### Width bands). Tailwind has no utility for env(), so the inset is written here. */
	.safe-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
