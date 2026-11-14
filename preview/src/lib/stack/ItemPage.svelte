<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ItemInAddress } from './behaviour/item.js';

	/** One level of the path to the item, or the item itself. */
	export type ItemCrumb = {
		/** The name of the level, such as "Quotes", or of the item, such as "QUO-0042". */
		label: string;
		/** The address of the page of the level. A level with no page of its own has none, and the item, the last crumb, never has one. */
		href?: string;
	};

	/**
	 * Who owns the item. With address, the page form of itemInAddress gives the item, the steps and the
	 * way back to the list. With key, the page keeps the item and gives the steps and the way back.
	 */
	type Source =
		| { address: ItemInAddress; key?: never; onstep?: never; onback?: never }
		| {
				address?: never;
				/** The identifier of the item, such as "QUO-0042". A new key scrolls the item to its top. */
				key: string;
				/** Shows the next item (1) or the item before (-1). With no onstep, the bar shows no steps. */
				onstep?: (by: 1 | -1) => void;
				/** Shows the list again, with the focus on the row of the item. Back and Esc run it. */
				onback: () => void;
		  };

	/** @behaviour item-in-address escape:item keys:next-row,previous-row place:top-bar click-guard */
	export type ItemPageProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
		Source & {
			ref?: HTMLDivElement | null;
			/** The name of the item for a screen reader, such as "Quote QUO-0042". */
			label: string;
			/** The levels above the item, then the item itself as the last crumb. */
			crumbs: readonly ItemCrumb[];
			/** The place of the item in the list, from 1, such as 3 in "3 / 14". With position and count, the bar shows the position. */
			position?: number;
			/** The number of rows of the list, such as 14 in "3 / 14". */
			count?: number;
			/** The item, such as ItemColumns with class="p-0" and stickyProperties. */
			children: Snippet;
		};
</script>

<script lang="ts">
	import { browser } from '$app/env';
	import * as Breadcrumb from '#lib/components/ui/breadcrumb/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import { bindKey, keyHint, onEscape } from './behaviour/keys.js';
	import { announce, claimPlace } from './behaviour/place.js';
	import { bands } from './behaviour/width.js';

	// The page of one item ("Item page" in ### Detail pane of DESIGN.md, and ### item-page). Enter on a
	// row opens it, and in the page form a click on a row opens it too ("Page form" in ### App shell).
	// From 768 px the bar claims the FramePlace 'top-bar' (behaviour/place), as the selection bar does:
	// Back, the breadcrumbs, then at the right the position of the item, such as "3 / 14", with the
	// buttons of the item before and of the next item. The last crumb names the item and is not a link,
	// and a level with no page of its own is a crumb with no link. With no FramePlace of that name, the
	// bar renders where it stands, over the item, with a border edge under it. Below 768 px the bar does
	// not show, because the header of the inner screen of the frame holds the back button.
	//
	// The item scrolls in one box, which keeps the bottom safe area and, from 768 px, stops a wheel at
	// its end, as the list does. Its content is at most 1,204 px wide (max-w-301, spacing.item-page):
	// 24 px of padding, 720 px of content, 16 px of gap, 420 px of properties and 24 px of padding. The
	// padding is 16 px below 768 px. The content starts at the start edge and is never centered. A new
	// item starts at its top.
	//
	// From 768 px, J and Down show the next item, K and Up the item before, and Esc goes back to the list
	// (bindKey and onEscape('item') of behaviour/keys). The keys do nothing while the focus is in a
	// dialog, a menu or a list box, and while keysOff of the address gives true.
	//
	// For 500 ms after the page opens, it takes no pointer input (pointer-events: none), so that the
	// second click of a double click on a row does not land on a control of the item. A wheel over the
	// item does not scroll it in that time either. The keys work at once, so the guard costs a keyboard
	// nothing.
	//
	// The open moves the focus to the box of the item (tabindex="-1"), so a screen reader names the
	// item, and the focus does not fall to the page. In the FramePlace, the live region of the place says
	// the position after each step, such as "Item 21 of 40", as the selection bar says its count.
	let {
		address,
		key,
		onstep,
		onback,
		label,
		crumbs,
		position,
		count,
		children,
		class: className,
		ref = $bindable(null),
		...rest
	}: ItemPageProps = $props();

	/** The time in ms after the page opens in which it takes no pointer input. */
	const GUARD = 500;

	// The server renders the form from 768 px, as the query of the screen does there.
	const phone = $derived(browser && !bands.md.current);
	const shownKey = $derived(address ? address.key : key);
	const steps = $derived(!!address || !!onstep);
	/** The first key of a hint, such as J of "J ArrowDown", for a tooltip. */
	const firstKey = (hint: string) => hint.split(' ')[0] ?? '';

	// What the bar shows. The bar renders in the FramePlace of the frame, outside this part, so it reads
	// this copy and never a prop. When the page names no item any more, the frame can draw the bar once
	// more before this part leaves, and a prop such as crumbs may then read an item that is gone. Only
	// this effect writes the copy, and it ends with the part.
	type Shown = {
		crumbs: readonly ItemCrumb[];
		place: { position: number; count: number } | null;
		steps: boolean;
		escape: string;
		next: string;
		previous: string;
	};
	let shows = $state.raw<Shown | null>(null);
	$effect.pre(() => {
		shows = {
			crumbs,
			place: position !== undefined && count !== undefined && position > 0 ? { position, count } : null,
			steps,
			escape: keyHint('escape'),
			next: keyHint('next-row'),
			previous: keyHint('previous-row')
		};
	});

	function step(by: 1 | -1) {
		if (address) void address.step(by);
		else onstep?.(by);
	}
	function back() {
		if (address) void address.close();
		else onback?.();
	}

	let box = $state<HTMLElement>();
	// A new item starts at its top.
	$effect(() => {
		void shownKey;
		if (box) box.scrollTop = 0;
	});
	// The open moves the focus to the box of the item.
	$effect(() => {
		box?.focus();
	});

	/** True after the first effect, so the server and the hydration render no bar where the part stands. */
	let ready = $state(false);
	/** True for GUARD ms after the page opens: the page takes no pointer input. */
	let guard = $state(false);
	$effect(() => {
		ready = true;
		guard = true;
		const t = setTimeout(() => (guard = false), GUARD);
		return () => clearTimeout(t);
	});

	/** True while the FramePlace 'top-bar' shows the bar. */
	let placed = $state(false);
	$effect(() => {
		if (phone) return;
		const release = claimPlace('top-bar', bar);
		placed = release !== null;
		return () => {
			placed = false;
			release?.();
		};
	});
	// The live region of the place says the position. It empties when the page leaves, so the next open
	// of the same position says it again.
	const spoken = $derived(shows?.place ? `Item ${shows.place.position} of ${shows.place.count}` : '');
	$effect(() => {
		if (placed && spoken) announce('top-bar', spoken);
	});
	$effect(() => () => announce('top-bar', ''));

	/** True while the focus is in a dialog, a menu or a list box, which keeps the keys of the page. */
	const inLayer = () => !!document.activeElement?.closest('[role=dialog], [role=alertdialog], [role=menu], [role=listbox]');
	const keysOff = () => address?.keysOff ?? false;

	// The steps, from 768 px. Below 768 px and in a layer a binding declines, so the key keeps its own use.
	$effect(() => {
		if (!steps) return;
		const offs = [
			bindKey('next-row', () => {
				if (!bands.md.current || inLayer() || keysOff()) return false;
				step(1);
			}),
			bindKey('previous-row', () => {
				if (!bands.md.current || inLayer() || keysOff()) return false;
				step(-1);
			})
		];
		return () => offs.forEach((off) => off());
	});
	// Esc goes back to the list, after an open layer and after the selection.
	$effect(() => {
		if (!bands.md.current || keysOff()) return;
		return onEscape('item', back);
	});
</script>

<!-- The bar: in the FramePlace 'top-bar', or where the part stands. -->
{#snippet bar()}
	{#if shows}
		{@const { crumbs: path, place, escape, next, previous } = shows}
		<Tooltip.Provider>
			<div data-slot="item-page-bar" class="flex h-11 min-w-0 flex-1 items-center gap-2 bg-background pr-4 pl-3 text-sm text-foreground">
				<Tooltip.Root>
					<Tooltip.Trigger onclick={back}>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon-sm" aria-label="Back" aria-keyshortcuts={escape || undefined}><ArrowLeftIcon /></Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Back{#if escape}{' '}<Kbd>Esc</Kbd>{/if}</Tooltip.Content>
				</Tooltip.Root>
				<Breadcrumb.Root aria-label="Path" class="min-w-0">
					<Breadcrumb.List class="flex-nowrap">
						{#each path as c, i (i)}
							{#if i > 0}<Breadcrumb.Separator />{/if}
							{#if i === path.length - 1}
								<Breadcrumb.Item class="min-w-0"><Breadcrumb.Page class="truncate">{c.label}</Breadcrumb.Page></Breadcrumb.Item>
							{:else}
								<Breadcrumb.Item class="shrink-0">
									{#if c.href}<Breadcrumb.Link href={c.href}>{c.label}</Breadcrumb.Link>{:else}<span>{c.label}</span>{/if}
								</Breadcrumb.Item>
							{/if}
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
				{#if place || shows.steps}
					<div data-slot="item-page-steps" class="ml-auto flex shrink-0 items-center gap-0.5">
						{#if place}
							<span data-slot="item-page-position" class="mr-1 text-xs text-muted-foreground tabular-nums">
								<span class="sr-only">{'Item '}</span>{place.position}<span aria-hidden="true">{' / '}</span><span class="sr-only">{' of '}</span>{place.count}
							</span>
						{/if}
						{#if shows.steps}
							<Tooltip.Root>
								<Tooltip.Trigger onclick={() => step(-1)} disabled={place !== null && place.position <= 1}>
									{#snippet child({ props })}
										<Button {...props} variant="ghost" size="icon-sm" aria-label="Previous item" aria-keyshortcuts={previous || undefined}><ChevronUpIcon /></Button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>Previous item{#if previous}{' '}<Kbd>{firstKey(previous)}</Kbd>{/if}</Tooltip.Content>
							</Tooltip.Root>
							<Tooltip.Root>
								<Tooltip.Trigger onclick={() => step(1)} disabled={place !== null && place.position >= place.count}>
									{#snippet child({ props })}
										<Button {...props} variant="ghost" size="icon-sm" aria-label="Next item" aria-keyshortcuts={next || undefined}><ChevronDownIcon /></Button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>Next item{#if next}{' '}<Kbd>{firstKey(next)}</Kbd>{/if}</Tooltip.Content>
							</Tooltip.Root>
						{/if}
					</div>
				{/if}
			</div>
		</Tooltip.Provider>
	{/if}
{/snippet}

<div bind:this={ref} data-slot="item-page" class={cn('flex min-h-0 flex-1 flex-col', guard && 'pointer-events-none', className)} {...rest}>
	{#if ready && !phone && !placed}
		<div class="flex shrink-0 border-b border-border">{@render bar()}</div>
	{/if}
	<section
		bind:this={box}
		tabindex="-1"
		data-slot="item-page-body"
		aria-label={label}
		class="safe-bottom relative min-h-0 flex-1 overflow-y-auto outline-none md:overscroll-contain"
	>
		<div class="max-w-301 p-4 md:p-6">{@render children()}</div>
	</section>
</div>

<style>
	/* The box of the item reaches the bottom edge of the screen, so it keeps the bottom safe area
	   (### Width bands). Tailwind has no utility for env(), so the inset is written here. */
	.safe-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
