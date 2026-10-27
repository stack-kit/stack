<script lang="ts" module>
	import type { Component } from 'svelte';

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
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
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
		onclear
	}: {
		/** The id of the bar. The count is `${id}-count`, and the More button is `${id}-more`. */
		id?: string;
		/** How many rows are selected. With `all`, every row of the filter is. */
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
		/** Clears the selection, and moves the focus to the row that had it last, because the bar leaves. */
		onclear: () => void;
	} = $props();

	const phone = new ScreenQuery('max-width: 767px');
	const coarse = new MediaQuery('pointer: coarse');
	/** Every action is an item of More: on a phone and on a touch screen. */
	const compact = $derived(phone.current || coarse.current);

	const pageAll = $derived(all || count >= page);
	const some = $derived(count > 0 && !pageAll);
	const canAll = $derived(!all && count >= page && total > page);
	const text = $derived(selectionText(count, page, total, all));

	const shown = $derived(compact ? [] : actions.filter((a) => !a.destructive).slice(0, 3));
	const rest = $derived(actions.filter((a) => !a.destructive && !shown.includes(a)));
	const destructive = $derived(actions.filter((a) => a.destructive));

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

	const blocked = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';
	const reasonId = (a: SelectionAction) => `${id}-${a.id}-reason`;
	const labelId = (a: SelectionAction) => `${id}-${a.id}-label`;
</script>

{#snippet clear()}
	<Tooltip.Root>
		<Tooltip.Trigger onclick={onclear}>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size={phone.current ? 'icon' : 'icon-sm'} aria-label="Clear the selection" aria-keyshortcuts="Escape">
					<XIcon />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>Clear the selection <Kbd>Esc</Kbd></Tooltip.Content>
	</Tooltip.Root>
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

<Tooltip.Provider>
	<div
		{id}
		data-slot="selection-bar"
		role="group"
		aria-labelledby="{id}-count"
		class="flex h-11 min-w-0 flex-1 items-center gap-2 bg-background pr-4 pl-3 text-sm text-foreground max-md:gap-1 max-md:px-1"
	>
		{#if phone.current}
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
		{#if canAll && !phone.current}
			<Button variant="ghost" size="sm" class="tabular-nums" onclick={selectAll}>Select all {fmt(total)}</Button>
		{/if}
		<div class="ml-auto flex shrink-0 items-center gap-2 max-md:gap-0">
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
			{#if rest.length || destructive.length || phone.current}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						id="{id}-more"
						class={buttonVariants({ variant: phone.current ? 'ghost' : 'outline', size: phone.current ? 'icon' : 'icon-sm' })}
						aria-label="More actions"
					>
						<EllipsisIcon />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-64" onCloseAutoFocus={afterMenu}>
						{#if phone.current && (!pageAll || canAll)}
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
						{#each rest as a (a.id)}
							{@render item(a)}
						{/each}
						{#if destructive.length}
							{#if rest.length}<DropdownMenu.Separator />{/if}
							{#each destructive as a (a.id)}
								{@render item(a)}
							{/each}
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
			{#if !phone.current}
				{@render clear()}
			{/if}
		</div>
	</div>
</Tooltip.Provider>
