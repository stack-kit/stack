// The item of a list in the web address ("Item column", "First row", "Read state" and "Esc and Close"
// in ### Detail pane of DESIGN.md). The address names the item of the column with one key, such as
// ?item=QUO-0042, so a reload and a link keep it. ?item= with no value is a column that the person
// closed, so a reload keeps it closed. With no key in the address, the column shows the first row that
// shows from 1024 px, the address does not change, and that item stays unread. A refresh that brings a
// new first row does not replace it: the column keeps the item until the person picks a row, or until
// its row leaves the list ("Item in a refresh" in ### Lists). Below 1024 px no item opens by itself,
// because the item covers the list there.
//
// A page calls itemInAddress in its script, where it holds the rows, and gives the result to ListSplit:
//   const split = itemInAddress({ shown: () => rows.map((r) => r.id), onread: markRead });
//   <ListSplit address={split} listLabel="Quotes" itemLabel="Quote {split.key}">
// The call adds an afterNavigate callback, so it runs while a component starts, as $props does.
//
// Each write of the address is goto(url, { replace: true, reset: false }), so the focus, the scroll and
// the length of the history stay. Each read of the address gives null while SvelteKit prerenders a page,
// so a prerendered page holds the list with no item, and the item shows after hydration.
import { getContext, setContext, tick } from 'svelte';
import { building } from '$app/env';
import { afterNavigate, goto } from '$app/navigation';
import { page } from '$app/state';
import { bands } from './width.js';

export type ItemInAddressOptions = {
	/** The keys of the rows that show, in order. A row of a folded group does not show. A function of the page. */
	shown: () => readonly string[];
	/** The name of the key in the address, 'item' by default. */
	param?: string;
	/** Other names in the address that hold a state of the open item, such as two versions that it compares. Each write of the key removes them. */
	itemParams?: readonly string[];
	/**
	 * Runs when the person opens an item: with a click, with J or K, or with an address that names it.
	 * It does not run for the first row that shows with no act of the person. A function of the page.
	 */
	onread?: (key: string) => void;
	/** The address of the full page of an item, which Enter opens. With no href, Enter on a row opens the item in the column. A function of the page. */
	href?: (key: string) => string;
	/**
	 * True while a key of the list would lose a change in the item, such as an open form. J, K, Down,
	 * Up, Enter and Esc of the list then do nothing. A function of the page.
	 */
	keysOff?: () => boolean;
};

export interface ItemInAddress {
	/**
	 * The item of the column. ?item=K gives K, and ?item= gives null. With no key in the address: from
	 * 1024 px the first row that shows, which stays while its row is in the list, also when a refresh
	 * brings a new first row. Else null.
	 */
	readonly key: string | null;
	/** True while the column shows an item. */
	readonly open: boolean;
	/** True while the column shows the first row, because the address names no item. A refresh that brings a new first row keeps the item. */
	readonly firstRow: boolean;
	/** True while the keysOff function of the page gives true. */
	readonly keysOff: boolean;
	/** Writes the key into the address, and the column shows it. onread runs for the key. */
	show(key: string): Promise<void>;
	/** Shows the next row (1) or the row before (-1), from the row that has focus or else from the item, and focuses its row. */
	step(by: 1 | -1): Promise<void>;
	/** Writes the key with no value into the address, so the column closes, and focuses the row of the item. */
	close(): Promise<void>;
	/** Opens the item on its full page. false when the options give no href. */
	openPage(key: string): boolean;
	/** The id of the row button of the key, which step and close focus. */
	rowId(key: string): string;
}

/** The item in the address of the page, for ListSplit and its rows. Call it in the script of a component. */
export function itemInAddress(o: ItemInAddressOptions): ItemInAddress {
	const param = o.param ?? 'item';
	/** The value of the key in the address: null when the address has no key, and '' for ?item=. */
	const named = () => (building ? null : page.url.searchParams.get(param));
	// The key of the first row that the column shows while the address names no item. It stays in
	// memory and never goes into the address, so onread does not run for it. A new first row of a
	// refresh does not replace it. When its row leaves the list, the column takes the first row again:
	// nobody chose that item, and the page holds the data of the rows that show. Each read of the key
	// reads shown() first, so an effect that reads key also runs again when the rows change.
	let held: string | null = null;
	const key = () => {
		const n = named();
		if (n !== null) return n || null;
		if (!bands.lg.current) return null;
		const rows = o.shown();
		if (held === null || !rows.includes(held)) held = rows[0] ?? null;
		return held;
	};
	const rowId = (k: string) => `${param}-row-${k}`;
	const write = (value: string) => {
		const url = new URL(page.url.href);
		url.searchParams.set(param, value);
		for (const n of o.itemParams ?? []) url.searchParams.delete(n);
		return goto(url, { replace: true, reset: false });
	};
	/** The key of the row that has focus: a row of the list carries data-key, as SplitRow does. */
	const focused = () => {
		const k = document.activeElement?.closest<HTMLElement>('[data-key]')?.dataset.key;
		return k !== undefined && o.shown().includes(k) ? k : null;
	};
	const focus = async (k: string) => {
		await tick();
		document.getElementById(rowId(k))?.focus();
	};
	const show = async (k: string) => {
		// afterNavigate runs onread after a write. With no change of the address, no navigation runs it.
		if (named() === k) o.onread?.(k);
		else await write(k);
	};

	// An address that names an item opens it: at the load of the page, and at each navigation that
	// changes the key, such as a click, J, K or a link. With ssr off, the first navigation has a from
	// with no url. A key in the address, also ?item=, ends the first row that the column holds, so an
	// address with no key later shows the first row of that moment.
	afterNavigate(({ from, to }) => {
		if (to?.url?.searchParams.has(param)) held = null;
		const k = to?.url?.searchParams.get(param) || null;
		const before = from?.url && from.url.pathname === to?.url?.pathname ? from.url.searchParams.get(param) || null : null;
		if (k !== null && k !== before) o.onread?.(k);
	});

	return {
		get key() {
			return key();
		},
		get open() {
			return key() !== null;
		},
		get firstRow() {
			return named() === null && key() !== null;
		},
		get keysOff() {
			return o.keysOff?.() ?? false;
		},
		show,
		async step(by) {
			const rows = o.shown();
			const from = focused() ?? key();
			const at = from === null ? -1 : rows.indexOf(from);
			const next = at < 0 ? rows[0] : rows[Math.min(rows.length - 1, Math.max(0, at + by))];
			if (next === undefined) return;
			await show(next);
			await focus(next);
		},
		async close() {
			const k = key();
			await write('');
			if (k !== null) await focus(k);
		},
		openPage(k) {
			if (!o.href) return false;
			void goto(o.href(k));
			return true;
		},
		rowId
	};
}

const CONTEXT = Symbol('item-in-address');

/** Gives the item in the address to the rows inside the component. ListSplit calls it with its address. */
export function setItemContext(a: ItemInAddress): void {
	setContext(CONTEXT, a);
}

/** The item in the address of the ListSplit around the component, or null outside one. */
export function getItemContext(): ItemInAddress | null {
	return getContext<ItemInAddress | undefined>(CONTEXT) ?? null;
}
