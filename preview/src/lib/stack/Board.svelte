<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** @behaviour undo keys:undo blocked put-back */
	/** One column of a board: the cards of one value of the field, in their order. */
	export type BoardColumn<T> = {
		id: string;
		label: string;
		items: T[];
		/** The most cards that the column should hold. The head shows it, and it never blocks a move. */
		limit?: number;
		/** A folded column shows as a rail. It takes no drop, and the keys pass over it. */
		folded?: boolean;
		/** The count of the column when it holds only its first cards, such as the first 10 of 62. */
		total?: number;
	};
	/** A place on a board. The index counts the cards of the column without the card that moves. */
	export type BoardPlace = { column: string; index: number };

	/** The place of a card, or null when no column holds it. */
	export function placeOf<T extends { id: string }>(columns: readonly BoardColumn<T>[], id: string): BoardPlace | null {
		for (const c of columns) {
			const index = c.items.findIndex((x) => x.id === id);
			if (index >= 0) return { column: c.id, index };
		}
		return null;
	}

	/** The columns after one card moves to a place. The owner of the columns can call it too. */
	export function placeCard<T extends { id: string }>(columns: readonly BoardColumn<T>[], id: string, to: BoardPlace): BoardColumn<T>[] {
		const from = placeOf(columns, id);
		if (!from) return [...columns];
		const card = columns.find((c) => c.id === from.column)!.items[from.index]!;
		const out = columns.map((c) => (c.id === from.column ? { ...c, items: c.items.filter((x) => x.id !== id) } : c));
		return out.map((c) => {
			if (c.id !== to.column) return c;
			const items = [...c.items];
			items.splice(Math.max(0, Math.min(items.length, to.index)), 0, card);
			return { ...c, items };
		});
	}

	const NUMBER = new Intl.NumberFormat('en-GB');
	/** The look of a folded column, with Fold or without it. */
	const RAIL =
		'flex h-full w-10 shrink-0 flex-col items-center gap-2 rounded-lg border border-border bg-muted/50 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';
	const cards = (n: number) => `${NUMBER.format(n)} ${n === 1 ? 'card' : 'cards'}`;

	export type BoardProps<T extends { id: string }> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, the region of the board. */
		ref?: HTMLDivElement | null;
		/** The columns in their order, each with its cards in their order. A move writes them. */
		columns: BoardColumn<T>[];
		/** The name of the board, for a screen reader, such as "Board of the leads". */
		label: string;
		/** The name of a card, for its handle, its menu and the live region. */
		name: (item: T) => string;
		/** The name of the field of the columns, for the switch of a phone, such as "Stage". */
		field?: string;
		/** The count of a column in words, for its head and the switch. */
		count?: (n: number) => string;
		/** Set when each column sorts its cards by a field: a move then changes the column only. */
		sorted?: { by: string; place: (item: T, items: readonly T[]) => number };
		/**
		 * Why a rule of the product keeps the card out of the column now, as a sentence, or undefined to
		 * let the move go. A column that the rule blocks takes no drop, the arrow keys do not move the
		 * card into it, and its Move to in More gives the sentence as its reason. A stopped move says the
		 * sentence in the live region and in a toast.
		 */
		blocked?: (item: T, column: string) => string | undefined;
		/**
		 * Called after each drop, each move from More and each Undo, with the columns already written.
		 * `undo` is true for the move of an Undo. Return a Promise to wait for the save: when it
		 * rejects, the card goes back, and the board says the message of the rejection, or else that
		 * the card did not move. Undo shows only after the Promise resolves. The result of an older save
		 * after a newer move changes nothing.
		 */
		onmove?: (item: T, from: BoardPlace, to: BoardPlace, undo?: boolean) => void;
		/** Set when the person may fold a column. The head then holds Fold, and a rail unfolds. */
		onfold?: (column: string, folded: boolean) => void;
		/** The start of the head line of a card, after the handle, such as the identifier. */
		lead?: Snippet<[T]>;
		/** The body of a card under its head line: the title and the fields. */
		card: Snippet<[T]>;
		/** The 16 px icon of a column, such as its status icon. */
		icon?: Snippet<[BoardColumn<T>]>;
		/** More buttons at the right of the head of a column, such as New. */
		actions?: Snippet<[BoardColumn<T>]>;
		/** The line of a column with no card. */
		empty?: Snippet<[BoardColumn<T>]>;
		/** More items of the menu of a card, before the moves, such as Open. */
		menu?: Snippet<[T]>;
		/** The end of a column under its cards, such as Show all. */
		foot?: Snippet<[BoardColumn<T>]>;
	};
</script>

<script lang="ts" generics="T extends { id: string }">
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { cn } from '#lib/utils.js';
	import { bands, isPrinting } from '#lib/stack/behaviour/width.js';
	import { undoToast } from '#lib/stack/behaviour/undo.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import FoldHorizontalIcon from '@lucide/svelte/icons/fold-horizontal';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// A view of a list in columns, one column for each value of a field, such as the stage. Each
	// card has a handle and a More menu.
	// - The pointer: press the handle and drag. The card lifts to level 3 and follows the pointer
	//   over the columns, its slot stays on the muted ground, and a 2 px line in foreground shows
	//   where it lands. The other cards stand still until the drop. Esc puts the card back.
	// - The keyboard: Space or Enter on the handle lifts the card. The up and down arrow keys, Home
	//   and End move it in its column, the left and right arrow keys move it to the column before
	//   or after, Space or Enter drops it, and Esc or a focus that leaves puts it back.
	// - No drag: Move up, Move down and Move to in More.
	// A polite live region says each step. A drop and a move from More save at once, and a toast
	// offers Undo, which the undo key runs too while the toast shows (behaviour/undo). A rule of the
	// product can block a move (blocked), and a save that fails puts the card back (onmove). Below
	// 768 px the board shows one column at a time, with a switch of the
	// columns above it, and More holds every move: a finger cannot drag to a column that it does
	// not see. Print takes the phone layout, and paper has no switch. So in print the switch
	// hides, and every column prints in turn under its head. A folded column prints its head only, as its rail does, and a cut column ends with a line such as "First 10 of 62 cards".
	let {
		columns = $bindable(),
		label,
		name,
		field = 'Column',
		count = cards,
		sorted,
		onmove,
		onfold,
		lead,
		card,
		icon,
		actions,
		empty,
		menu,
		foot,
		blocked,
		ref = $bindable(null),
		class: className,
		...rest
	}: BoardProps<T> = $props();

	const uid = $props.id();
	const hint = `${uid}-hint`;
	const handleId = (id: string) => `${uid}-handle-${id}`;
	const moreId = (id: string) => `${uid}-more-${id}`;
	const headId = (id: string) => `${uid}-head-${id}`;
	const switchId = (id: string) => `${uid}-switch-${id}`;
	const railId = (id: string) => `${uid}-rail-${id}`;
	const wide = bands.md;
	const reduce = new MediaQuery('prefers-reduced-motion: reduce');

	/** The text of the live region. */
	let said = $state('');
	/** The card that is lifted, the place that it came from, how, and the columns before the lift. */
	let lifted = $state<{ id: string; from: BoardPlace; by: 'pointer' | 'key'; before: BoardColumn<T>[] } | null>(null);
	/** Where the drop line shows: before a card, or after the last card of a column when `before` is null. */
	let line = $state<{ column: string; before: string | null } | null>(null);
	/** The column that a phone shows. */
	let phoneShown = $state<string | null>(null);

	const slots: Record<string, HTMLLIElement> = {};
	const shells: Record<string, HTMLDivElement> = {};
	const lists: Record<string, HTMLDivElement> = {};
	/** True while the board writes new columns, when a handle can lose the focus for a moment. */
	let moving = false;

	const columnOf = (id: string) => columns.find((c) => c.id === id)!;
	/** The card, or undefined when the product took it away, such as during a drag. */
	const itemOf = (id: string) => columns.flatMap((c) => c.items).find((x) => x.id === id);
	const open = $derived(columns.filter((c) => !c.folded));
	const phoneColumn = $derived(columns.find((c) => c.id === phoneShown) ?? columns.find((c) => c.items.length > 0) ?? columns[0]);
	const size = (c: BoardColumn<T>) => c.total ?? c.items.length;
	const over = (c: BoardColumn<T>) => c.limit !== undefined && size(c) > c.limit;
	const shownCount = (c: BoardColumn<T>) => (c.limit === undefined ? NUMBER.format(size(c)) : `${NUMBER.format(size(c))} / ${NUMBER.format(c.limit)}`);
	const countName = (c: BoardColumn<T>) => (c.limit === undefined ? count(size(c)) : `${count(size(c))}, ${over(c) ? 'over the limit of' : 'limit'} ${NUMBER.format(c.limit)}`);

	/** The place as the live region says it, from the columns as they are now. */
	const where = (p: BoardPlace) => `${columnOf(p.column).label}, position ${p.index + 1} of ${columnOf(p.column).items.length}`;
	/** The sentence that the region adds when a column passes its limit. */
	const limitText = (p: BoardPlace) => {
		const c = columnOf(p.column);
		return over(c) ? ` ${c.label} is over its limit of ${NUMBER.format(c.limit!)}.` : '';
	};
	const same = (a: BoardPlace, b: BoardPlace) => a.column === b.column && a.index === b.index;

	/** The place of a card in a column, by the order of that column. */
	function land(it: T, column: string, index: number): BoardPlace {
		// The product can take the column away, such as during a drag.
		const c = columns.find((x) => x.id === column);
		if (!sorted || !c) return { column, index };
		return { column, index: sorted.place(it, c.items.filter((x) => x.id !== it.id)) };
	}

	/** Says a text again: the region empties first, so that a screen reader says the same words. */
	async function say(text: string) {
		said = '';
		await tick();
		said = text;
	}

	/**
	 * Writes new columns. Each card that changes its place slides there in duration-fast with
	 * ease-stack, and jumps there under reduced motion. `start` gives a card another start, such
	 * as the place where the pointer left a dragged card.
	 */
	async function write(next: BoardColumn<T>[], start = new Map<string, DOMRect>()) {
		const before = new Map(Object.entries(slots).filter(([, el]) => el?.isConnected).map(([id, el]) => [id, el.getBoundingClientRect()]));
		for (const [id, r] of start) before.set(id, r);
		moving = true;
		columns = next;
		await tick();
		moving = false;
		if (reduce.current) return;
		const slide: HTMLLIElement[] = [];
		for (const [id, el] of Object.entries(slots)) {
			const b = before.get(id);
			if (!el?.isConnected || !b) continue;
			const a = el.getBoundingClientRect();
			const dx = b.left - a.left;
			const dy = b.top - a.top;
			if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
			el.style.transition = 'none';
			el.style.transform = `translate(${dx}px, ${dy}px)`;
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

	const focusOn = (id: string) => document.getElementById(id)?.focus();
	/** The control of a card that takes the focus: its handle, its More on a phone, or the rail of a folded column. */
	const focusCard = (it: T, column: string) => focusOn(wide.current ? (columnOf(column).folded ? railId(column) : handleId(it.id)) : moreId(it.id));

	/**
	 * Says why a rule or a failed save keeps the card out of a place, in the live region and in a toast
	 * of its own, so that the Undo of the move before stays in the toast of the board.
	 */
	function refuse(text: string) {
		void say(text);
		toast(text, { id: `${uid}-refused`, duration: 10000 });
	}

	/** The sequence number of the newest move. The result of the save of an older move changes nothing. */
	let last = 0;

	/**
	 * Waits for the Promise that onmove can return. When it rejects, the card goes back to `back` and
	 * the board says why. Gives true when the move holds. The result of move `seq` after a newer move
	 * changes nothing, and gives false.
	 */
	async function held(result: unknown, it: T, back: BoardPlace, seq: number): Promise<boolean> {
		if (typeof (result as PromiseLike<unknown> | null)?.then !== 'function') return true;
		try {
			await result;
			return seq === last;
		} catch (e) {
			if (seq !== last) return false;
			const reason = e instanceof Error ? e.message : typeof e === 'string' ? e : '';
			// The product can change the columns while it saves, and take the card or its column away.
			if (placeOf(columns, it.id) && columns.some((c) => c.id === back.column)) await write(placeCard(columns, it.id, back));
			const at = placeOf(columns, it.id);
			refuse(`${reason || `${name(it)} did not move.`}${at ? ` Back in ${where(at)}.` : ''}`);
			// The card left its column and came back, so the focus that it held fell to the page.
			if (at && document.activeElement === document.body) focusCard(it, at.column);
			return false;
		}
	}

	/** Saves a move, and offers Undo in one toast for the board: a new move replaces it. */
	async function save(it: T, from: BoardPlace, to: BoardPlace) {
		const seq = ++last;
		// The product can take the column away while it saves, so the name of the column comes first.
		const label = columnOf(to.column).label;
		if (!(await held(onmove?.(it, from, to), it, from, seq))) return;
		undoToast(`${name(it)} moved to ${label}`, {
			id: `${uid}-moved`,
			undo: async () => {
				// The product can take the card, or the column that it came from, away while the toast shows.
				if (!placeOf(columns, it.id) || !columns.some((c) => c.id === from.column)) return refuse(`${name(it)} cannot go back.`);
				const undo = ++last;
				const now = placeOf(columns, it.id) ?? to;
				const home = land(it, from.column, from.index);
				await write(placeCard(columns, it.id, home));
				const result = onmove?.(it, now, home, true);
				said = `Undone. ${name(it)} is back in ${where(home)}.`;
				// The toast leaves with its Undo button, so the focus moves to the card. A folded
				// column on a wide board shows no card, so the focus moves to its rail.
				focusCard(it, home.column);
				await held(result, it, now, undo);
			}
		});
	}

	// The keyboard.
	async function keyMove(it: T, to: BoardPlace | 'first' | 'last') {
		const at = placeOf(columns, it.id)!;
		if (typeof to === 'string') {
			if (to === 'first' && at.column === open[0]?.id) return say('Already in the first column.');
			if (to === 'last' && at.column === open.at(-1)?.id) return say('Already in the last column.');
			return;
		}
		if (same(at, to)) return say(`Already at ${where(at)}.`);
		const off = to.column === at.column ? undefined : blocked?.(it, to.column);
		if (off) return refuse(off);
		await write(placeCard(columns, it.id, to));
		focusOn(handleId(it.id));
		said = `Moved to ${where(to)}.${limitText(to)}`;
	}
	async function putBack(it: T, text: string) {
		const from = lifted?.from ?? placeOf(columns, it.id)!;
		lifted = null;
		line = null;
		if (!same(placeOf(columns, it.id)!, from)) await write(placeCard(columns, it.id, from));
		said = `${text} Back in ${where(from)}.`;
	}
	function onkeydown(e: KeyboardEvent, it: T) {
		const at = placeOf(columns, it.id)!;
		if (!lifted) {
			if (e.key !== ' ' && e.key !== 'Enter') return;
			e.preventDefault();
			// A held key repeats, and each repeat would drop the card and lift it again.
			if (e.repeat) return;
			lifted = { id: it.id, from: at, by: 'key', before: columns };
			said = `Lifted ${name(it)}. ${where(at)}.`;
			return;
		}
		if (lifted.id !== it.id || lifted.by !== 'key') return;
		const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' ', 'Enter', 'Escape'];
		// The lifted card takes these keys, so a key handler of the list does not move the focus.
		if (!keys.includes(e.key)) return;
		e.stopPropagation();
		e.preventDefault();
		const n = columnOf(at.column).items.length;
		const ci = open.findIndex((c) => c.id === at.column);
		if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
			if (sorted) return void say(`The cards sort by ${sorted.by}, so a move changes the column only.`);
			const index = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : at.index + (e.key === 'ArrowUp' ? -1 : 1);
			keyMove(it, { column: at.column, index: Math.max(0, Math.min(n - 1, index)) });
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			const next = open[ci + (e.key === 'ArrowLeft' ? -1 : 1)];
			if (!next) return void keyMove(it, e.key === 'ArrowLeft' ? 'first' : 'last');
			// The card keeps its position number where the column is long enough, and goes last where it is not.
			keyMove(it, land(it, next.id, Math.min(at.index, next.items.length)));
		} else if (e.key === ' ' || e.key === 'Enter') {
			if (e.repeat) return;
			const { from } = lifted;
			lifted = null;
			said = `Dropped in ${where(at)}.${limitText(at)}`;
			if (!same(at, from)) save(it, from, at);
		} else {
			// The lifted card takes Esc, so the pane and the selection stay.
			putBack(it, 'Move cancelled.').then(() => focusOn(handleId(it.id)));
		}
	}
	function onfocusout(it: T) {
		if (moving || lifted?.id !== it.id || lifted.by !== 'key') return;
		// The way back can take the card, and the control that the focus went to, out of a column.
		// The focus then goes to the handle, so that it never falls to the page.
		putBack(it, 'Move cancelled.').then(() => document.activeElement === document.body && focusOn(handleId(it.id)));
	}

	// The pointer.
	/** How far the pointer moves the card before it aims at another place, in px. */
	const DEAD = 8;
	/** The gap between two cards, in px: the drop line stands in its middle. */
	const GAP = 8;
	type Area = { id: string; left: number; right: number; top: number; slots: { id: string; top: number; bottom: number }[] };
	/** The drag of one pointer. A second finger or pen on the handle changes nothing. */
	let drag: { pointer: number; id: string; from: BoardPlace; x: number; y: number; dx: number; dy: number; rect: DOMRect; areas: Area[]; to: BoardPlace; off?: string | undefined } | null = null;

	function onpointerdown(e: PointerEvent, it: T) {
		if (e.button !== 0 || lifted || !wide.current) return;
		const from = placeOf(columns, it.id)!;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const rect = shells[it.id]!.getBoundingClientRect();
		const areas = open.map((c) => {
			const r = lists[c.id]!.getBoundingClientRect();
			const others = c.items.filter((x) => x.id !== it.id);
			return { id: c.id, left: r.left, right: r.right, top: r.top, slots: others.map((x) => ({ id: x.id, top: slots[x.id]!.getBoundingClientRect().top, bottom: slots[x.id]!.getBoundingClientRect().bottom })) };
		});
		drag = { pointer: e.pointerId, id: it.id, from, x: e.clientX, y: e.clientY, dx: 0, dy: 0, rect, areas, to: from };
		// The slot keeps the height of the card, and the card leaves the column as a fixed layer,
		// so that the scroll box of the column does not clip it on its way to another column.
		slots[it.id]!.style.height = `${rect.height}px`;
		Object.assign(shells[it.id]!.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px` });
		lifted = { id: it.id, from, by: 'pointer', before: columns };
		said = `Lifted ${name(it)}. ${where(from)}.`;
	}
	function onpointermove(e: PointerEvent) {
		if (!drag || e.pointerId !== drag.pointer) return;
		const { rect, areas, from } = drag;
		// The product can take the card away during the drag. Its handle then goes, and the lost
		// pointer capture ends the drag.
		const it = itemOf(drag.id);
		const shell = shells[drag.id];
		if (!it || !shell?.isConnected) return;
		// The card stays under the heads of the columns.
		const floor = Math.min(...areas.map((a) => a.top));
		drag.dx = e.clientX - drag.x;
		drag.dy = Math.max(floor - rect.top, e.clientY - drag.y);
		shell.style.transform = `translate(${drag.dx}px, ${drag.dy}px)`;
		const top = rect.top + drag.dy;
		const bottom = rect.bottom + drag.dy;
		const middle = rect.left + drag.dx + rect.width / 2;
		const area = areas.find((a) => middle >= a.left && middle <= a.right) ?? areas.reduce((a, b) => (Math.abs((a.left + a.right) / 2 - middle) <= Math.abs((b.left + b.right) / 2 - middle) ? a : b));
		let to: BoardPlace;
		if (area.id === from.column && Math.hypot(drag.dx, drag.dy) < DEAD) to = from;
		else if (drag.dy <= 0) {
			// On the way up the card lands before the first card whose bottom is under its top edge,
			// and on the way down after the last card whose top is over its bottom edge. So the drop
			// line is always outside the lifted card.
			const i = area.slots.findIndex((s) => s.bottom > top - GAP / 2);
			to = { column: area.id, index: i < 0 ? area.slots.length : i };
		} else {
			to = { column: area.id, index: area.slots.findLastIndex((s) => s.top < bottom + GAP / 2) + 1 };
		}
		to = land(it, to.column, to.index);
		// A column that the rule keeps the card out of takes no drop line and no drop: the card goes back.
		drag.off = to.column === from.column ? undefined : blocked?.(it, to.column);
		if (drag.off) to = from;
		drag.to = to;
		line = same(to, from) ? null : { column: to.column, before: area.slots[to.index]?.id ?? null };
	}
	async function endDrag(drop: boolean) {
		if (!drag) return;
		const { id, dx, dy, rect, off } = drag;
		let { from, to } = drag;
		drag = null;
		line = null;
		lifted = null;
		const left = new DOMRect(rect.left + dx, rect.top + dy, rect.width, rect.height);
		const slot = slots[id];
		if (slot) slot.style.height = '';
		const shell = shells[id];
		if (shell) Object.assign(shell.style, { position: '', left: '', top: '', width: '', transform: '' });
		// The product can replace the columns during a drag. The card then counts from where it is
		// now, and a drop on a column that is gone puts it back. With the card gone, nothing moves.
		const it = itemOf(id);
		const now = placeOf(columns, id);
		if (!it || !now) return void say('Move cancelled.');
		if (!same(now, from)) from = now;
		if (!columns.some((c) => c.id === to.column)) to = from;
		const at = drop && !off ? to : from;
		await write(same(at, from) ? columns : placeCard(columns, id, at), new Map([[id, left]]));
		// The press gave the handle the focus, and the move can take it away, so it goes back.
		document.getElementById(handleId(id))?.focus({ preventScroll: true });
		if (!drop) said = `Move cancelled. Back in ${where(from)}.`;
		else if (off) refuse(`${off} Back in ${where(from)}.`);
		else {
			said = `Dropped in ${where(at)}.${limitText(at)}`;
			if (!same(at, from)) save(it, from, at);
		}
	}
	function onwindowkey(e: KeyboardEvent) {
		if (drag && e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			endDrag(false);
		}
	}

	// No drag: Move up, Move down and Move to in More. An item runs after the menu has closed and
	// given back its focus, because the move takes the card, and its More, out of the column.
	let pending: (() => void) | null = null;
	function afterMenu() {
		const run = pending;
		pending = null;
		if (run) queueMicrotask(run);
	}
	async function menuMove(it: T, to: BoardPlace) {
		const from = placeOf(columns, it.id)!;
		const column = columnOf(from.column);
		// On a phone a card that leaves the column leaves the screen, so the focus goes to the card
		// that takes its place, or to the switch when the column is empty. On a wide board a folded
		// column shows no card, so the focus goes to its rail.
		const next = column.items[from.index + 1] ?? column.items[from.index - 1];
		let back = moreId(it.id);
		if (!wide.current && to.column !== from.column) back = next ? moreId(next.id) : switchId(from.column);
		else if (wide.current && columnOf(to.column).folded) back = railId(to.column);
		// The phone keeps the column on the screen, also when the move empties it. Without this it
		// would show the first column that holds a card.
		if (!wide.current) phoneShown = column.id;
		await write(placeCard(columns, it.id, to));
		focusOn(back);
		said = `Moved to ${where(to)}.${limitText(to)}`;
		save(it, from, to);
	}
</script>

<svelte:window onkeydowncapture={onwindowkey} />

{#snippet more(it: T, c: BoardColumn<T>, i: number)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger id={moreId(it.id)} class="{buttonVariants({ variant: 'ghost', size: 'icon-xs' })} relative z-10 shrink-0 print:hidden" aria-label="More for {name(it)}">
			<EllipsisIcon />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56" onCloseAutoFocus={afterMenu}>
			{#if menu}
				{@render menu(it)}
				<DropdownMenu.Separator />
			{/if}
			{#if !sorted}
				<DropdownMenu.Item disabled={i === 0} onSelect={() => (pending = () => menuMove(it, { column: c.id, index: i - 1 }))}><ArrowUpIcon />Move up</DropdownMenu.Item>
				<DropdownMenu.Item disabled={i === c.items.length - 1} onSelect={() => (pending = () => menuMove(it, { column: c.id, index: i + 1 }))}
					><ArrowDownIcon />Move down</DropdownMenu.Item
				>
				<DropdownMenu.Separator />
			{/if}
			{#each columns.filter((x) => x.id !== c.id) as target (target.id)}
				{@const off = blocked?.(it, target.id)}
				{#if off}
					{@render reasonItem(`${moreId(it.id)}-to-${target.id}`, `Move to ${target.label}`, off)}
				{:else}
					<DropdownMenu.Item onSelect={() => (pending = () => menuMove(it, land(it, target.id, 0)))}><ArrowRightIcon />Move to {target.label}</DropdownMenu.Item>
				{/if}
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<!-- A move that a rule blocks ("Disabled with a reason" in ### dropdown-menu): the item stays reachable
     with the arrow keys and runs nothing, its label draws at 50%, and a second line gives the reason.
     Bits UI writes aria-disabled="false" over a prop, so the child snippet sets it after the props. -->
{#snippet reasonItem(id: string, label: string, reason: string)}
	<DropdownMenu.Item onSelect={(e: Event) => e.preventDefault()}>
		{#snippet child({ props })}
			<div {...props} aria-disabled="true" aria-labelledby="{id}-label" aria-describedby="{id}-reason">
				<ArrowRightIcon class="opacity-50" />
				<span class="flex flex-col">
					<span id="{id}-label" class="opacity-50">{label}</span>
					<span id="{id}-reason" class="text-xs text-muted-foreground">{reason}</span>
				</span>
			</div>
		{/snippet}
	</DropdownMenu.Item>
{/snippet}

{#snippet shell(it: T, c: BoardColumn<T>, i: number)}
	{@const up = lifted?.id === it.id}
	<li bind:this={slots[it.id]} data-slot="board-item" data-lifted={up ? lifted?.by : undefined} class="relative shrink-0 rounded-lg data-[lifted=pointer]:bg-muted">
		{#if line?.column === c.id && (line.before === it.id || (line.before === null && i === c.items.length - 1))}
			<span
				data-slot="board-drop-line"
				aria-hidden="true"
				class="pointer-events-none absolute inset-x-0 z-20 h-0.5 rounded-full bg-foreground {line.before === it.id ? '-top-1 -translate-y-1/2' : '-bottom-1 translate-y-1/2'}"
			></span>
		{/if}
		<div
			bind:this={shells[it.id]}
			data-slot="board-card"
			data-lifted={up || undefined}
			class="relative flex flex-col gap-1.5 rounded-lg bg-card p-2 text-sm text-card-foreground ring-1 ring-foreground/10 transition-[background-color,box-shadow] duration-fast ease-stack data-lifted:z-50 data-lifted:bg-popover data-lifted:text-popover-foreground data-lifted:shadow-md print:break-inside-avoid"
		>
			<div class="flex min-h-6 items-center gap-1">
				{#if wide.current}
					<!-- The tooltip closes while a card is lifted, so that it covers no card on the way. Undefined gives the
					     open state back to the tooltip. The type of bits-ui leaves undefined out, and "!" only satisfies that type. -->
					<Tooltip.Root disabled={lifted !== null} open={(lifted ? false : undefined) as boolean}>
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
									id={handleId(it.id)}
									data-slot="board-card-handle"
									variant="ghost"
									size="icon-xs"
									class="relative z-10 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground in-data-lifted:cursor-grabbing in-data-lifted:text-foreground"
									aria-label="Move {name(it)}"
									aria-describedby={hint}
								>
									<GripVerticalIcon class="size-4" />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Move {name(it)} <Kbd>Space</Kbd></Tooltip.Content>
					</Tooltip.Root>
				{/if}
				<div class={['flex min-w-0 flex-1 items-center gap-2', !wide.current && 'pl-1']}>{@render lead?.(it)}</div>
				{@render more(it, c, i)}
			</div>
			<div class={['flex min-w-0 flex-col gap-1.5 pr-1', wide.current ? 'pl-7' : 'pl-1']}>{@render card(it)}</div>
		</div>
	</li>
{/snippet}

{#snippet list(c: BoardColumn<T>)}
	<div bind:this={lists[c.id]} class="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pt-1 pb-2">
		{#if c.items.length > 0}
			<ol role="list" aria-labelledby={headId(c.id)} class="flex flex-col gap-2">
				{#each c.items as it, i (it.id)}{@render shell(it, c, i)}{/each}
			</ol>
			{@render foot?.(c)}
		{:else}
			{#if line?.column === c.id}
				<span data-slot="board-drop-line" aria-hidden="true" class="pointer-events-none absolute inset-x-2 top-0 z-20 h-0.5 rounded-full bg-foreground"></span>
			{/if}
			<div class="px-1 py-1 text-xs text-muted-foreground">
				{#if empty}{@render empty(c)}{:else}No cards.{/if}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet head(c: BoardColumn<T>)}
	<div data-slot="board-column-head" class="flex h-8 shrink-0 items-center gap-2 pr-1 pl-3 text-sm print:mb-3 print:break-after-avoid">
		{#if icon}<span class="flex shrink-0" aria-hidden="true">{@render icon(c)}</span>{/if}
		<h3 id={headId(c.id)} class="flex min-w-0 items-baseline gap-2 font-semibold" aria-label="{c.label}, {countName(c)}">
			<span class="truncate">{c.label}</span>
			<span data-slot="board-column-count" class={['flex shrink-0 items-center gap-1 self-center text-xs font-normal tabular-nums', over(c) ? 'text-foreground' : 'text-muted-foreground']}>
				{#if over(c)}<TriangleAlertIcon class="size-3.5 text-warning" />{/if}{shownCount(c)}
			</span>
		</h3>
		<div class="ml-auto flex shrink-0 items-center print:hidden">
			{#if onfold}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon-sm" aria-label="Fold {c.label}" onclick={() => onfold(c.id, true)}><FoldHorizontalIcon /></Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Fold {c.label}</Tooltip.Content>
				</Tooltip.Root>
			{/if}
			{@render actions?.(c)}
		</div>
	</div>
{/snippet}

{#snippet rail(c: BoardColumn<T>)}
	{#if icon}<span class="flex shrink-0" aria-hidden="true">{@render icon(c)}</span>{/if}
	<span class="vertical font-semibold">{c.label}</span>
	<span class={['vertical flex items-center gap-1 text-xs tabular-nums', over(c) ? 'text-foreground' : 'text-muted-foreground']}
		>{#if over(c)}<TriangleAlertIcon class="size-3.5 text-warning" />{/if}{shownCount(c)}</span
	>
{/snippet}

<Tooltip.Provider>
	<div
		bind:this={ref}
		data-slot="board"
		role="region"
		aria-label={label}
		class={cn(wide.current ? 'min-h-0 flex-1 overflow-x-auto bg-background' : 'flex min-h-0 flex-1 flex-col bg-background print:block', className)}
		{...rest}
	>
		<p id={hint} class="sr-only">Press Space to lift it. Then the arrow keys move it in its column and to the column before or after, Space drops it, and Escape puts it back.</p>
		<p role="status" class="sr-only">{said}</p>
		{#if wide.current}
			<div class="flex h-full w-max gap-2 p-3">
				{#each columns as c (c.id)}
					{#if c.folded && onfold}
						<button
							id={railId(c.id)}
							type="button"
							data-slot="board-rail"
							class="{RAIL} cursor-pointer hover:bg-muted"
							aria-label="Unfold {c.label}, {countName(c)}"
							onclick={() => onfold(c.id, false)}
						>
							{@render rail(c)}
						</button>
					{:else if c.folded}
						<!-- With no Fold the person cannot unfold the column, so the rail is no button. It still takes the focus after Move to and Undo. -->
						<section id={railId(c.id)} tabindex="-1" data-slot="board-rail" class={RAIL} aria-label="{c.label}, {countName(c)}">
							{@render rail(c)}
						</section>
					{:else}
						<section data-slot="board-column" aria-labelledby={headId(c.id)} class="flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/50">
							{@render head(c)}
							{@render list(c)}
						</section>
					{/if}
				{/each}
			</div>
		{:else if phoneColumn}
			<!-- Below 768 px: one column at a time, and a switch of the columns above it. In print the switch hides, and every column prints in turn with its head and its cards. In print the board and each column are blocks: a flex item keeps its height when a card moves to the next page, and the next column printed over that card (measured). The list takes no top padding in print and the head takes it as a margin, so that print:break-after-avoid keeps the head on the page of its first card. With the padding, a page could end inside the list, under the padding, and a head stood alone at the foot of a page (measured). -->
			<div class="shrink-0 border-b border-border print:hidden">
				<ScrollArea orientation="horizontal" class="w-full">
					<ToggleGroup.Root
						type="single"
						spacing={1}
						class="w-max p-2 pb-3"
						aria-label={field}
						bind:value={() => phoneColumn.id, (v) => v && (phoneShown = v)}
					>
						{#each columns as c (c.id)}
							<ToggleGroup.Item
								id={switchId(c.id)}
								value={c.id}
								class="data-[state=on]:bg-background data-[state=on]:inset-ring data-[state=on]:inset-ring-border-strong max-md:min-w-11"
								aria-label="{c.label}, {countName(c)}"
							>
								{#if icon}{@render icon(c)}{/if}{c.label}<span class={['flex items-center gap-1 tabular-nums', over(c) ? 'text-foreground' : 'text-muted-foreground']}
									>{#if over(c)}<TriangleAlertIcon class="size-3.5 text-warning" />{/if}{shownCount(c)}</span
								>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				</ScrollArea>
			</div>
			{#each isPrinting() ? columns : [phoneColumn] as c (c.id)}
				<section aria-labelledby={headId(c.id)} class="flex min-h-0 flex-1 flex-col print:block">
					{#if isPrinting()}{@render head(c)}{:else}<h3 id={headId(c.id)} class="sr-only">{c.label}, {countName(c)}</h3>{/if}
					{#if !(isPrinting() && c.folded)}
						<div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 print:pt-0">
							{#if c.items.length > 0}
								<ol role="list" aria-labelledby={headId(c.id)} class="flex flex-col gap-2">
									{#each c.items as it, i (it.id)}{@render shell(it, c, i)}{/each}
								</ol>
								{@render foot?.(c)}
								{#if isPrinting() && c.items.length < size(c)}<p class="mt-2 text-sm text-muted-foreground">First {NUMBER.format(c.items.length)} of {count(size(c))}</p>{/if}
							{:else}
								<div class="text-sm text-muted-foreground">
									{#if empty}{@render empty(c)}{:else}No cards.{/if}
								</div>
							{/if}
						</div>
					{/if}
				</section>
			{/each}
		{/if}
	</div>
</Tooltip.Provider>

<style>
	/* Tailwind 4.3.3 has no class for writing-mode, so the name and the count of a folded column
	   run from top to bottom here, as a style block writes the safe-area insets. */
	.vertical {
		writing-mode: vertical-rl;
	}
</style>
