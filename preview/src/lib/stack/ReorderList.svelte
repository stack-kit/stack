<script lang="ts" generics="T extends { id: string }">
	import { tick, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';

	// A list in an order that the person sets. Each row has a handle and a More menu.
	// - The pointer: press the handle and drag. The row lifts to level 3 and follows the pointer,
	//   its slot stays on the muted ground, and a 2 px line in foreground shows where it lands.
	//   The other rows stand still until the drop. Esc puts the row back.
	// - The keyboard: Space or Enter on the handle lifts the row, the up and down arrow keys, Home
	//   and End move it, Space or Enter drops it, and Esc or a focus that leaves puts it back.
	// - No drag: Move up and Move down in More.
	// A polite live region says each step. A drop and a move from More save the order at once, and
	// a toast offers Undo. Pointer events serve the mouse, the pen and a finger alike, and the
	// handle takes touch-action: none so that a finger on it does not scroll the page.
	let {
		items = $bindable(),
		label,
		name,
		item,
		onsave
	}: {
		/** The items in their order. A move writes it. */
		items: T[];
		/** The name of the list, for a screen reader. */
		label: string;
		/** The name of an item, for its handle, its menu and the live region. */
		name: (item: T) => string;
		/** The content of a row after the handle. */
		item: Snippet<[T, number]>;
		/** Called with the new order after each drop, each move from More and each Undo. */
		onsave?: (items: T[]) => void;
	} = $props();

	const uid = $props.id();
	const hint = `${uid}-hint`;
	const handleId = (it: T) => `${uid}-handle-${it.id}`;
	const reduce = new MediaQuery('prefers-reduced-motion: reduce');

	/** The text of the live region. */
	let said = $state('');
	/** The row that is lifted, the place that it came from, and how. */
	let lifted = $state<{ id: string; from: number; by: 'pointer' | 'key'; before: T[] } | null>(null);
	/** Where the drop line shows: on the top or the bottom edge of a row. */
	let line = $state<{ id: string; edge: 'top' | 'bottom' } | null>(null);

	const slots: Record<string, HTMLLIElement> = {};
	const rows: Record<string, HTMLDivElement> = {};
	/** True while the list writes a new order, when the handle can lose the focus for a moment. */
	let moving = false;

	const where = (i: number) => `position ${i + 1} of ${items.length}`;
	const Where = (i: number) => `Position ${i + 1} of ${items.length}`;
	const moved = (list: T[], from: number, to: number) => {
		const next = [...list];
		const [x] = next.splice(from, 1);
		next.splice(to, 0, x);
		return next;
	};

	/**
	 * Writes a new order. Each row that changes its place slides there in duration-fast with
	 * ease-stack, and jumps there under reduced motion. `offset` adds a start offset to a row, such
	 * as the place where the pointer left a dragged row.
	 */
	async function reorder(next: T[], offset = new Map<string, number>()) {
		const before = new Map(items.map((it) => [it.id, slots[it.id]?.getBoundingClientRect().top ?? 0]));
		moving = true;
		items = next;
		await tick();
		moving = false;
		if (reduce.current) return;
		const slide: HTMLLIElement[] = [];
		for (const it of items) {
			const el = slots[it.id];
			if (!el) continue;
			const d = (before.get(it.id) ?? 0) + (offset.get(it.id) ?? 0) - el.getBoundingClientRect().top;
			if (Math.abs(d) < 0.5) continue;
			el.style.transition = 'none';
			el.style.transform = `translateY(${d}px)`;
			slide.push(el);
		}
		if (!slide.length) return;
		void document.body.offsetHeight;
		for (const el of slide) {
			el.style.transition = 'transform var(--transition-duration-fast) var(--ease-stack)';
			el.style.transform = '';
			el.addEventListener('transitionend', () => (el.style.transition = ''), { once: true });
		}
	}

	/** Saves the order, and offers Undo in one toast for the list: a new move replaces it. */
	function save(it: T, before: T[], from: number) {
		onsave?.(items);
		toast('Order saved', {
			id: `${uid}-saved`,
			duration: 10000,
			action: {
				label: 'Undo',
				onClick: async () => {
					await reorder(before);
					onsave?.(items);
					said = `Undone. ${name(it)} is back at ${where(from)}.`;
					// The toast leaves with its Undo button, so the focus moves to the handle of the row.
					document.getElementById(handleId(it))?.focus();
				}
			}
		});
	}

	// The keyboard.
	async function keyMove(it: T, to: number) {
		const i = items.indexOf(it);
		const j = Math.max(0, Math.min(items.length - 1, to));
		if (j === i) {
			// The region empties first, so that a screen reader says the same words again.
			said = '';
			await tick();
			said = `Already at ${where(i)}.`;
			return;
		}
		await reorder(moved(items, i, j));
		document.getElementById(handleId(it))?.focus();
		said = `Moved to ${where(j)}.`;
	}
	async function putBack(it: T, text: string) {
		const from = lifted?.from ?? items.indexOf(it);
		lifted = null;
		line = null;
		const i = items.indexOf(it);
		if (i !== from) await reorder(moved(items, i, from));
		said = `${text} Back at ${where(from)}.`;
	}
	function onkeydown(e: KeyboardEvent, it: T) {
		const i = items.indexOf(it);
		if (!lifted) {
			if (e.key !== ' ' && e.key !== 'Enter') return;
			e.preventDefault();
			// A held key repeats, and each repeat would drop the row and lift it again.
			if (e.repeat) return;
			lifted = { id: it.id, from: i, by: 'key', before: items };
			said = `Lifted ${name(it)}. ${Where(i)}.`;
			return;
		}
		if (lifted.id !== it.id || lifted.by !== 'key') return;
		// The lifted row takes these keys, so a key handler of the list does not move the focus.
		if (['ArrowUp', 'ArrowDown', 'Home', 'End', ' ', 'Enter', 'Escape'].includes(e.key)) e.stopPropagation();
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			keyMove(it, i + (e.key === 'ArrowUp' ? -1 : 1));
		} else if (e.key === 'Home' || e.key === 'End') {
			e.preventDefault();
			keyMove(it, e.key === 'Home' ? 0 : items.length - 1);
		} else if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			if (e.repeat) return;
			const { from, before } = lifted;
			lifted = null;
			said = `Dropped at ${where(i)}.`;
			if (i !== from) save(it, before, from);
		} else if (e.key === 'Escape') {
			// The lifted row takes Esc, so the pane and the selection stay.
			e.preventDefault();
			putBack(it, 'Move cancelled.').then(() => document.getElementById(handleId(it))?.focus());
		}
	}
	function onfocusout(it: T) {
		if (moving || lifted?.id !== it.id || lifted.by !== 'key') return;
		putBack(it, 'Move cancelled.');
	}

	// The pointer.
	/** How far the pointer moves the row before it aims at another place, in px. */
	const DEAD = 8;
	/** The drag of one pointer. A second finger or pen on the handle changes nothing. */
	let drag: { pointer: number; id: string; from: number; y: number; dy: number; rects: DOMRect[]; to: number } | null = null;
	function onpointerdown(e: PointerEvent, it: T) {
		if (e.button !== 0 || lifted) return;
		const from = items.indexOf(it);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		drag = { pointer: e.pointerId, id: it.id, from, y: e.clientY, dy: 0, rects: items.map((x) => slots[x.id].getBoundingClientRect()), to: from };
		lifted = { id: it.id, from, by: 'pointer', before: items };
		said = `Lifted ${name(it)}. ${Where(from)}.`;
	}
	function onpointermove(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointer) return;
		const { rects, from } = drag;
		const r = rects[from];
		// The row stays inside the list.
		drag.dy = Math.max(rects[0].top - r.top, Math.min(rects[rects.length - 1].bottom - r.bottom, e.clientY - drag.y));
		rows[drag.id].style.transform = `translateY(${drag.dy}px)`;
		// The row lands next to the row that its leading edge is over: before it on the way up, and
		// after it on the way down. So the drop line is always outside the lifted row, which a
		// threshold at the middle of the row does not give. The first 8 px change nothing.
		const top = r.top + drag.dy;
		const bottom = r.bottom + drag.dy;
		let to = from;
		if (drag.dy < -DEAD) to = rects.findIndex((x, j) => j !== from && x.bottom > top);
		else if (drag.dy > DEAD) to = rects.findLastIndex((x, j) => j !== from && x.top < bottom);
		drag.to = to;
		line = to === from ? null : { id: items[to].id, edge: to < from ? 'top' : 'bottom' };
	}
	async function endDrag(drop: boolean) {
		if (!drag) return;
		const { id, from, dy, to } = drag;
		drag = null;
		line = null;
		lifted = null;
		const it = items[from];
		rows[id].style.transform = '';
		const before = items;
		const at = drop ? to : from;
		await reorder(at === from ? items : moved(items, from, at), new Map([[id, dy]]));
		// The press gave the handle the focus, and the move can take it away, so it goes back.
		document.getElementById(handleId(it))?.focus({ preventScroll: true });
		if (!drop) said = `Move cancelled. Back at ${where(from)}.`;
		else {
			said = `Dropped at ${where(at)}.`;
			if (at !== from) save(it, before, from);
		}
	}
	function onwindowkey(e: KeyboardEvent) {
		if (drag && e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			endDrag(false);
		}
	}

	// No drag: Move up and Move down in More.
	async function menuMove(it: T, by: -1 | 1) {
		const i = items.indexOf(it);
		const before = items;
		await reorder(moved(items, i, i + by));
		said = `Moved to ${where(i + by)}.`;
		save(it, before, i);
	}
</script>

<svelte:window onkeydowncapture={onwindowkey} />

<p id={hint} class="sr-only">Press Space to lift it. Then the up and down arrow keys move it, Space drops it, and Escape puts it back.</p>
<p role="status" class="sr-only">{said}</p>
<Tooltip.Provider>
	<ol data-slot="reorder-list" role="list" aria-label={label} class="flex flex-col bg-background">
		{#each items as it, i (it.id)}
			{@const up = lifted?.id === it.id}
			<li bind:this={slots[it.id]} data-slot="reorder-list-item" data-lifted={up ? lifted?.by : undefined} class="relative data-[lifted=pointer]:bg-muted">
				{#if line?.id === it.id}
					<span
						data-slot="reorder-list-drop-line"
						aria-hidden="true"
						class="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-foreground {line.edge === 'top' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2'}"
					></span>
				{/if}
				<div
					bind:this={rows[it.id]}
					data-slot="reorder-list-row"
					data-lifted={up || undefined}
					class="relative flex h-8 items-center gap-3 border-b border-border-faint pr-4 pl-2 text-sm transition-[background-color,box-shadow] duration-fast ease-stack data-lifted:z-10 data-lifted:rounded-lg data-lifted:border-transparent data-lifted:bg-popover data-lifted:text-popover-foreground data-lifted:shadow-md data-lifted:ring-1 data-lifted:ring-foreground/10 max-md:h-13 max-md:gap-2 max-md:pr-1 max-md:pl-0"
				>
					<!-- The tooltip closes while a row is lifted, so that it covers no row on the way. -->
					<Tooltip.Root disabled={lifted !== null} open={lifted ? false : undefined}>
						<Tooltip.Trigger
							onkeydown={(e: KeyboardEvent) => onkeydown(e, it)}
							onfocusout={() => onfocusout(it)}
							onpointerdown={(e: PointerEvent) => onpointerdown(e, it)}
							onpointermove={onpointermove}
							onpointerup={(e: PointerEvent) => e.pointerId === drag?.pointer && endDrag(true)}
							onpointercancel={(e: PointerEvent) => e.pointerId === drag?.pointer && endDrag(false)}
							onlostpointercapture={(e: PointerEvent) => e.pointerId === drag?.pointer && endDrag(false)}
						>
							{#snippet child({ props })}
								<Button
									{...props}
									id={handleId(it)}
									data-slot="reorder-list-handle"
									variant="ghost"
									size="icon-xs"
									class="cursor-grab touch-none text-muted-foreground hover:text-foreground in-data-lifted:cursor-grabbing in-data-lifted:text-foreground print:hidden"
									aria-label="Move {name(it)}"
									aria-describedby={hint}
								>
									<GripVerticalIcon class="size-4" />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Move {name(it)} <Kbd>Space</Kbd></Tooltip.Content>
					</Tooltip.Root>
					<div class="flex min-w-0 flex-1 items-center gap-3">{@render item(it, i)}</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="{buttonVariants({ variant: 'ghost', size: 'icon-xs' })} print:hidden" aria-label="More for {name(it)}">
							<EllipsisIcon />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-48">
							<DropdownMenu.Item disabled={i === 0} onSelect={() => menuMove(it, -1)}><ArrowUpIcon />Move up</DropdownMenu.Item>
							<DropdownMenu.Item disabled={i === items.length - 1} onSelect={() => menuMove(it, 1)}><ArrowDownIcon />Move down</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</li>
		{/each}
	</ol>
</Tooltip.Provider>
