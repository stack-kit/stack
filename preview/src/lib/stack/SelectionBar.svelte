<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type SelectionAction = {
		id: string;
		/** The verb, such as "Archive". */
		label: string;
		icon?: Component;
		/** Set while a rule blocks the action for one or more selected rows. */
		reason?: string;
		/** A destructive action goes last in the More menu, after a separator. */
		destructive?: boolean;
		run: () => void;
	};

	/** @behaviour escape:selection place:top-bar,phone-header live-region */
	export type SelectionBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		/** The id of the bar. The count is `${id}-count`, and the More button is `${id}-more`. */
		id?: string;
		/** How many rows are selected. With `all`, every row of the filter is. The bar shows while it is 1 or more. */
		count: number;
		/** How many rows the list has loaded: the rows that the box of the page selects. */
		page: number;
		/** How many rows match the filter. */
		total: number;
		/** True after Select all: every row of the filter is selected, the rows not loaded too. */
		all?: boolean;
		/** In the order of their use. The first three that are not destructive show as buttons. */
		actions: SelectionAction[];
		/** Selects every row of the page. A click on the checked box of the page runs `onclear`. */
		onpage: () => void;
		/** Selects every row of the filter. */
		onall: () => void;
		/** Clears the selection, and moves the focus to the row that had it last, because the bar leaves. Clear and Esc run it. */
		onclear: () => void;
		/** More items of More, such as DropdownMenu.Item, after the actions and before a destructive action. */
		menu?: Snippet;
	};

	const NUMBER = new Intl.NumberFormat('en-GB');
	export const fmt = (n: number) => NUMBER.format(n);

	/** The count as the bar shows it and as the live region says it. */
	export function selectionText(count: number, page: number, total: number, all: boolean): string {
		if (count === 0) return 'Selection cleared';
		if (all || (count === page && total === page)) return `All ${fmt(all ? total : page)} selected`;
		if (count === page) return `All ${fmt(page)} on this page selected`;
		return `${fmt(count)} selected`;
	}
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { browser } from '$app/env';
	import { keyHint, onEscape } from '#lib/stack/behaviour/keys.js';
	import { announce, claimPlace, type PlaceName } from '#lib/stack/behaviour/place.js';
	import { holdsPlace } from '#lib/stack/place-state.js';
	import { bands } from '#lib/stack/behaviour/width.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import { cn } from '#lib/utils.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import XIcon from '@lucide/svelte/icons/x';

	// The selection bar takes the place of the content of the top bar while one or more rows are
	// selected, so no row moves. From the left: the box of the page, the count, Select all of the
	// filter, then the actions, More and Clear. Below 768 px it takes the place of the 52 px header:
	// Clear, the count and More, and every action is an item of More. On a touch screen every
	// action is an item of More too, because the bar has no room for the reason line of a blocked
	// action. A blocked action is disabled with a reason, as ### button says.
	//
	// While count is 1 or more, the bar claims the FramePlace 'top-bar' from 768 px and
	// 'phone-header' below (behaviour/place), and the live region of the place says the count. With no
	// FramePlace of that name, the bar renders where it stands, such as in the header of a card, and its
	// own polite live region says the count. That region is in the page at a count of 0 too, in the root
	// of the bar, which is then visually hidden, so a screen reader hears the first count. With count 0
	// the bar shows nothing. Either region says "Selection cleared" when the count falls to 0, so the
	// page keeps the bar in the page at a count of 0.
	// Esc runs onclear while the bar shows, after an open layer, such as the More menu, closes
	// (onEscape('selection') of behaviour/keys).
	const uid = $props.id();
	let {
		id = uid,
		count,
		page,
		total,
		all = false,
		actions,
		onpage,
		onall,
		onclear,
		menu,
		class: className,
		ref = $bindable(null),
		...rest
	}: SelectionBarProps = $props();

	// The server renders the form from 768 px, as the query of the screen does there.
	const phone = $derived(browser && !bands.md.current);
	const coarse = new MediaQuery('pointer: coarse');
	/** Every action is an item of More: on a phone and on a touch screen. */
	const compact = $derived(phone || coarse.current);

	const pageAll = $derived(all || count >= page);
	const some = $derived(count > 0 && !pageAll);
	const canAll = $derived(!all && count >= page && total > page);
	const text = $derived(selectionText(count, page, total, all));
	const CLEARED = selectionText(0, 0, 0, false);

	const shown = $derived(compact ? [] : actions.filter((a) => !a.destructive).slice(0, 3));
	const inMore = $derived(actions.filter((a) => !a.destructive && !shown.includes(a)));
	const destructive = $derived(actions.filter((a) => a.destructive));
	const escapeHint = $derived(keyHint('escape'));

	/** The bar shows while one or more rows are selected. */
	const active = $derived(count > 0);
	const placeName: PlaceName = $derived(phone ? 'phone-header' : 'top-bar');
	/** True while the FramePlace of placeName shows the bar. */
	let placed = $state(false);
	/** True while the page holds a FramePlace of placeName. Its live region says the count, and the bar has no region of its own. */
	const inPlace = $derived(holdsPlace(placeName));
	/** The FramePlace whose live region says the count, so that it says "Selection cleared" when the count falls to 0. */
	let spokenIn: PlaceName | null = null;
	/** The text of the own live region of the bar: empty before the first selection, then the count, then "Selection cleared". */
	let said = $state('');

	$effect(() => {
		if (!active) return;
		const release = claimPlace(placeName, bar);
		placed = release !== null;
		return () => {
			placed = false;
			release?.();
		};
	});
	$effect(() => {
		if (placed) announce((spokenIn = placeName), text);
	});
	// The own region says the count. Only a count that falls to 0 says "Selection cleared", in the region
	// that said the count. A change of the place, such as at 768 px, does not.
	$effect(() => {
		if (active) {
			said = text;
			return;
		}
		untrack(() => {
			if (said) said = CLEARED;
		});
		if (spokenIn) announce(spokenIn, CLEARED);
		spokenIn = null;
	});
	$effect(() => {
		if (active) return onEscape('selection', () => onclear());
	});

	// An item of More runs after the menu has closed and given back its focus, so that an
	// alert-dialog that the item opens keeps the focus.
	let pending: (() => void) | null = null;
	function afterMenu() {
		const run = pending;
		pending = null;
		// Bits UI gives the focus back to More first; the action then runs and may move it.
		if (run) queueMicrotask(run);
	}

	/** Select all leaves the bar when it runs, so the focus moves to the box of the page. */
	async function selectAll() {
		onall();
		await tick();
		document.getElementById(`${id}-page`)?.focus();
	}

	const BAR = 'flex h-11 min-w-0 flex-1 items-center gap-2 bg-background pr-4 pl-3 text-sm text-foreground max-md:gap-1 max-md:px-1';
	const blocked = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';
	const reasonId = (a: SelectionAction) => `${id}-${a.id}-reason`;
	const labelId = (a: SelectionAction) => `${id}-${a.id}-label`;
</script>

{#snippet clear()}
	<span data-slot="selection-bar-clear" class="contents">
		<Tooltip.Root>
			<Tooltip.Trigger onclick={onclear}>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size={phone ? 'icon' : 'icon-sm'} aria-label="Clear the selection" aria-keyshortcuts={escapeHint || undefined}>
						<XIcon />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Clear the selection{#if escapeHint}{' '}<Kbd>Esc</Kbd>{/if}</Tooltip.Content>
		</Tooltip.Root>
	</span>
{/snippet}

{#snippet item(a: SelectionAction)}
	{@const Icon = a.icon}
	{#if a.reason}
		<!-- A rule blocks it: the arrow keys reach it, it runs nothing, and its second line gives the reason. -->
		<DropdownMenu.Item variant={a.destructive ? 'destructive' : 'default'} onSelect={(e: Event) => e.preventDefault()}>
			{#snippet child({ props })}
				<div {...props} aria-disabled="true" aria-labelledby={labelId(a)} aria-describedby={reasonId(a)}>
					{#if Icon}<Icon class="opacity-50" />{/if}
					<span class="flex flex-col">
						<span id={labelId(a)} class="opacity-50">{a.label}</span>
						<span id={reasonId(a)} class="text-xs text-muted-foreground">{a.reason}</span>
					</span>
				</div>
			{/snippet}
		</DropdownMenu.Item>
	{:else}
		<DropdownMenu.Item variant={a.destructive ? 'destructive' : 'default'} onSelect={() => (pending = a.run)}>
			{#if Icon}<Icon />{/if}{a.label}
		</DropdownMenu.Item>
	{/if}
{/snippet}

<!-- The content of the bar, in a FramePlace and where it stands. -->
{#snippet inside()}
	{#if phone}
		{@render clear()}
	{:else}
		<Checkbox
			id="{id}-page"
			aria-label="Select all {fmt(page)} on this page"
			bind:checked={() => pageAll, (on) => (on ? onpage() : onclear())}
			bind:indeterminate={() => some, () => {}}
		/>
	{/if}
	<span id="{id}-count" data-slot="selection-bar-count" class="min-w-0 truncate font-medium tabular-nums">{text}</span>
	{#if canAll && !phone}
		<Button variant="ghost" size="sm" class="tabular-nums" onclick={selectAll}>Select all {fmt(total)}</Button>
	{/if}
	<div data-slot="selection-bar-actions" class="ml-auto flex shrink-0 items-center gap-2 max-md:gap-0">
		{#each shown as a (a.id)}
			{@const Icon = a.icon}
			<Tooltip.Root>
				<Tooltip.Trigger
					class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), blocked)}
					aria-disabled={a.reason ? 'true' : undefined}
					aria-describedby={a.reason ? reasonId(a) : undefined}
					onclick={(e: MouseEvent) => {
						if (a.reason) {
							e.preventDefault();
							return;
						}
						a.run();
					}}
				>
					{#if Icon}<Icon data-icon="inline-start" />{/if}{a.label}
				</Tooltip.Trigger>
				{#if a.reason}<Tooltip.Content>{a.reason}</Tooltip.Content>{/if}
			</Tooltip.Root>
			<!-- The description of a blocked button. The bar shows no reason line: on a phone and on a touch screen the action is an item of More. -->
			{#if a.reason}<span id={reasonId(a)} class="hidden">{a.reason}</span>{/if}
		{/each}
		{#if inMore.length || destructive.length || menu || phone}
			<span data-slot="selection-bar-more" class="contents">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						id="{id}-more"
						class={buttonVariants({ variant: phone ? 'ghost' : 'outline', size: phone ? 'icon' : 'icon-sm' })}
						aria-label="More actions"
					>
						<EllipsisIcon />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-64" onCloseAutoFocus={afterMenu}>
						{#if phone && (!pageAll || canAll)}
							<DropdownMenu.Group>
								{#if !pageAll}
									<DropdownMenu.Item onSelect={() => (pending = onpage)}>Select all {fmt(page)} on this page</DropdownMenu.Item>
								{/if}
								{#if canAll}
									<DropdownMenu.Item class="tabular-nums" onSelect={() => (pending = onall)}>Select all {fmt(total)}</DropdownMenu.Item>
								{/if}
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
						{/if}
						{#each inMore as a (a.id)}
							{@render item(a)}
						{/each}
						{@render menu?.()}
						{#if destructive.length}
							{#if inMore.length || menu}<DropdownMenu.Separator />{/if}
							{#each destructive as a (a.id)}
								{@render item(a)}
							{/each}
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</span>
		{/if}
		{#if !phone}
			{@render clear()}
		{/if}
	</div>
{/snippet}

<!-- The bar in a FramePlace: claimPlace gives this snippet to the place. -->
{#snippet bar()}
	<Tooltip.Provider>
		<div bind:this={ref} {id} data-slot="selection-bar" role="group" aria-labelledby="{id}-count" class={cn(BAR, className)} {...rest}>
			{@render inside()}
		</div>
	</Tooltip.Provider>
{/snippet}

<!--
	The bar where it stands, while no FramePlace shows it. With no FramePlace of its place, the root holds
	the live region of the bar, and it stays in the page at a count of 0, visually hidden, because a
	screen reader can miss a region that comes into the page with its text.
-->
{#if (active && !placed) || !inPlace}
	<div
		bind:this={ref}
		{id}
		data-slot="selection-bar"
		role={active ? 'group' : undefined}
		aria-labelledby={active ? `${id}-count` : undefined}
		class={cn(active ? BAR : 'sr-only', className)}
		{...rest}
	>
		{#if active}
			<Tooltip.Provider>
				{@render inside()}
			</Tooltip.Provider>
		{/if}
		{#if !inPlace}
			<p role="status" class="sr-only">{said}</p>
		{/if}
	</div>
{/if}
