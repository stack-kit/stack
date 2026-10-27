<script lang="ts" module>
	import { ScreenQuery } from './screen-query.svelte.js';

	/**
	 * True from 1024 px, where the item column docks beside the list. There the column shows the
	 * first row when the address names no item; below 1024 px no item opens by itself, because the
	 * item covers the list ("First row" in ### Detail pane of DESIGN.md).
	 */
	export const itemDocks = new ScreenQuery('min-width: 1024px');
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	// The work form of the split, from 768 px ("Two forms of the split" in ### App shell, and
	// "Work form" in ### Width bands of DESIGN.md). The list takes a column of 340 px from 1024 px
	// (lg:w-85, spacing.list-column) and of 400 px from 1280 px (xl:w-100, spacing.list-column-wide),
	// and the item column takes the rest of the width, on background with a border edge on its left.
	// From 768 to 1023 px the list takes the whole width, and the item lies over its right side at
	// 420 px, on popover with shadow-lg, as the pane of the table form does. While the item column is
	// closed, the list takes the whole width in every band. Each column scrolls on its own and keeps
	// the bottom safe area. When only the item changes, the list keeps its scroll position, and the
	// item column scrolls to its top. Below 768 px a page shows the list as its own screen and does
	// not draw this part.
	let {
		open,
		key,
		listLabel,
		itemLabel,
		list,
		item
	}: {
		/** True while the item column shows. */
		open: boolean;
		/** The identifier of the item in the column. */
		key?: string;
		/** The name of the list, as a heading for a screen reader. */
		listLabel: string;
		/** The name of the item column, such as "Ticket QUO-0042". */
		itemLabel: string;
		list: Snippet;
		item: Snippet;
	} = $props();

	const uid = $props.id();
	let column = $state<HTMLElement>();

	// A new item starts at its top. The list is not drawn again, so it keeps its scroll position.
	$effect(() => {
		void key;
		if (column) column.scrollTop = 0;
	});
</script>

<div class="relative flex min-h-0 flex-1">
	<section aria-labelledby="{uid}-list" class={['flex min-w-0 flex-col', open ? 'flex-1 lg:w-85 lg:flex-none xl:w-100' : 'flex-1']}>
		<h2 id="{uid}-list" class="sr-only">{listLabel}</h2>
		<div class="safe-bottom min-h-0 flex-1 overflow-y-auto">{@render list()}</div>
	</section>
	{#if open}
		<aside
			bind:this={column}
			aria-label={itemLabel}
			class="safe-bottom print:max-lg:hidden absolute inset-y-0 right-0 z-30 w-105 overflow-y-auto border-l border-border bg-popover shadow-lg lg:static lg:z-auto lg:w-auto lg:min-w-0 lg:flex-1 lg:bg-background lg:shadow-none"
		>
			{@render item()}
		</aside>
	{/if}
</div>

<style>
	/* The list and the item column reach the bottom edge of the screen, so each keeps the bottom
	   safe area (### Width bands). Tailwind has no utility for env(), so the inset is written here. */
	.safe-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
