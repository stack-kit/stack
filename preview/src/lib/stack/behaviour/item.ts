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
// The path form names the item with the segment after the path of the list, such as /quotes/QUO-0042,
// for a product whose addresses hold no query string. The page gives path, a function that gives the
// path of the list, and the list and the item are one route, such as /quotes/[[key]], so SvelteKit
// keeps the page and the list keeps its scroll. The path of the list alone names no item, so close()
// writes that path with a closed mark in the history state (page.state), such as { item: '' } with
// the name of param, and with persistState, so a reload keeps the column closed. A link to the list
// carries no mark, so it shows the first row.
//
// close() moves the focus to the row of the item. When the list holds no row of the item, such as in an
// empty view, for an item of another view or while the rows load, it moves the focus to the empty state
// in the list column of ListSplit, else to that list column, so the focus never falls to the page.
//
// The page form opens the item as a page in place of the list ("Page form" in ### App shell, and
// "Item page" in ### Detail pane). The page gives pageForm, a function that gives true while the list
// takes that form, and it shows ItemPage in place of ListSplit while the address names an item. No item
// then opens by itself. A click or Enter on a row opens the item as a new entry of the history. On the
// list, J and K move the focus between the rows. On the page, J and K show the next or the previous
// item in the place of the entry, so the entry before it stays the list. close() goes back to that
// entry, or else writes the address of the list. Each way back to the list, also the back button of
// the browser, gives the list the scroll position that it had when the item opened, and moves the
// focus to the row of the item, else to the empty state or the list column, as close() does.
//
// Each write of the address is goto(url, { replace: true, reset: false }), so the focus, the scroll and
// the length of the history stay. Only the page form opens an item, or writes the list again after a
// visit from a link, as a new entry. Each read of the address gives null while SvelteKit prerenders a
// page, so a prerendered page holds the list with no item, and the item shows after hydration.
import { getContext, setContext, tick } from 'svelte';
import { building } from '$app/env';
import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
import { page } from '$app/state';
import { listColumns } from '../list-column.js';
import { bands } from './width.js';

export type ItemInAddressOptions = {
	/** The keys of the rows that show, in order. A row of a folded group does not show. A function of the page. */
	shown: () => readonly string[];
	/** The name of the key in the address, 'item' by default. In the path form, the name of the mark of a closed column in the history state. */
	param?: string;
	/** Other names in the address that hold a state of the open item, such as two versions that it compares. Each write of the key removes them. */
	itemParams?: readonly string[];
	/**
	 * The path of the list, such as '/quotes', with no slash at its end. A function of the page. With
	 * path, the address names the item with the segment after it, such as /quotes/QUO-0042, and not
	 * with ?item=. The list and the item are then one route, such as /quotes/[[key]].
	 */
	path?: () => string;
	/**
	 * True while the list opens its item as a page in place of the list: the page form. A function of
	 * the page, so the form can follow the width. No item then opens by itself, a row opens its item
	 * as a new entry of the history, and close() goes back to the list, at its scroll position.
	 */
	pageForm?: () => boolean;
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
	 * The item of the column. ?item=K gives K, and ?item= gives null. In the path form, /quotes/K gives
	 * K, and the path of the list with the closed mark gives null. With no key in the address: from
	 * 1024 px the first row that shows, which stays while its row is in the list, also when a refresh
	 * brings a new first row. Else null. In the page form, the item of the page, and else null.
	 */
	readonly key: string | null;
	/** True while the column shows an item. In the page form, true while the page shows an item. */
	readonly open: boolean;
	/** True while the column shows the first row, because the address names no item. A refresh that brings a new first row keeps the item. */
	readonly firstRow: boolean;
	/** True while the keysOff function of the page gives true. */
	readonly keysOff: boolean;
	/**
	 * Writes the key into the address, and the column shows it. onread runs for the key. In the page
	 * form, from the list, the item opens as a new entry of the history.
	 */
	show(key: string): Promise<void>;
	/**
	 * Shows the next row (1) or the row before (-1), from the row that has focus or else from the item,
	 * and focuses its row. In the page form, on the list it only focuses the row, and on the page it
	 * shows the item of that row in the place of the entry of the history.
	 */
	step(by: 1 | -1): Promise<void>;
	/**
	 * Writes the key with no value into the address, so the column closes, and focuses the row of the
	 * item. With no row of the item in the list, it focuses the empty state in the list column of
	 * ListSplit, else that list column. In the path form it writes the path of the list and the closed
	 * mark in the history state. In the page form it goes back to the list, which gets back its scroll
	 * position and focuses the row of the item, else the empty state or the list column.
	 */
	close(): Promise<void>;
	/** Opens the item on its full page. false when the options give no href. */
	openPage(key: string): boolean;
	/** The id of the row button of the key, which step and close focus. */
	rowId(key: string): string;
}

/** The item in the address of the page, for ListSplit and its rows. Call it in the script of a component. */
export function itemInAddress(o: ItemInAddressOptions): ItemInAddress {
	const param = o.param ?? 'item';
	const path = o.path;
	const asPage = () => o.pageForm?.() ?? false;
	/** True while the history state holds the closed mark of the path form. The query form never reads the state. */
	const marked = () => !!path && (page.state as Record<string, unknown>)[param] === '';
	/**
	 * The value of the key in an address: null when the address names no key, and '' for a closed
	 * column. The query form reads ?item=. The path form reads the segment after the path of the list,
	 * and with no segment, the closed mark. A malformed escape, such as %E0, stays as it is.
	 */
	const keyIn = (url: { readonly pathname: string; readonly searchParams: Pick<URLSearchParams, 'get'> }, closed: boolean): string | null => {
		if (!path) return url.searchParams.get(param);
		const list = path();
		if (!url.pathname.startsWith(`${list}/`)) return url.pathname === list && closed ? '' : null;
		const segment = url.pathname.slice(list.length + 1).split('/')[0];
		if (!segment) return closed ? '' : null;
		try {
			return decodeURIComponent(segment);
		} catch {
			return segment;
		}
	};
	/** The value of the key in the address of the page. */
	const named = () => (building ? null : keyIn(page.url, marked()));
	// The key of the first row that the column shows while the address names no item. It stays in
	// memory and never goes into the address, so onread does not run for it. A new first row of a
	// refresh does not replace it. When its row leaves the list, the column takes the first row again:
	// nobody chose that item, and the page holds the data of the rows that show. Each read of the key
	// reads shown() first, so an effect that reads key also runs again when the rows change.
	let held: string | null = null;
	const key = () => {
		const n = named();
		if (n !== null) return n || null;
		if (asPage() || !bands.lg.current) return null;
		const rows = o.shown();
		if (held === null || !rows.includes(held)) held = rows[0] ?? null;
		return held;
	};
	const rowId = (k: string) => `${param}-row-${k}`;
	/**
	 * Writes the key into the address, in the place of the entry of the history. With push, it writes a
	 * new entry, and SvelteKit resets the focus and the scroll of the document, as for a new page.
	 */
	const write = (value: string, push = false) => {
		const url = new URL(page.url.href);
		if (path) url.pathname = value ? `${path()}/${encodeURIComponent(value)}` : path();
		else if (value || !asPage()) url.searchParams.set(param, value);
		else url.searchParams.delete(param);
		for (const n of o.itemParams ?? []) url.searchParams.delete(n);
		if (push) return goto(url);
		// The path of the list alone names no item, so the path form closes the column with a mark in
		// the history state. persistState keeps the mark through a reload. The page form has no column,
		// so its list takes no mark and no ?item=.
		const mark = path && !value && !asPage() ? { state: { [param]: '' }, persistState: true } : {};
		return goto(url, { replace: true, reset: false, ...mark });
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
	/**
	 * The focus after Esc or Close, and on the list of the page form after each way back to it: the row
	 * of the item, else the empty state in the list column of ListSplit, else that list column, so the
	 * focus never falls to the page. It reads inAddress, the result of itemInAddress, only when it runs.
	 */
	const focusBack = (k: string) => {
		const row = document.getElementById(rowId(k));
		row?.focus();
		if (row && document.activeElement === row) return;
		// No row of the item takes the focus: none is in the list, or a folded group hides it. The
		// empty state and the list column are no controls, so each one takes tabindex -1 here before it
		// takes the focus, and it gives the attribute back at its first blur.
		const list = listColumns.get(inAddress)?.();
		const target = list?.querySelector<HTMLElement>('[data-slot=empty]') ?? list;
		if (!target) return;
		if (!target.hasAttribute('tabindex')) {
			target.tabIndex = -1;
			target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
		}
		target.focus();
	};
	const show = async (k: string) => {
		// afterNavigate runs onread after a write. With no change of the address, no navigation runs it.
		// In the page form, an item opens from the list as a new entry of the history.
		if (named() === k) o.onread?.(k);
		else await write(k, asPage() && !named());
	};

	// The page form. listScroll is the scroll position of the list at the moment an item opened from it.
	// fromList is true while the entry before the page of the item is the list, so close() goes back to
	// it, and the history does not grow. Both stay in memory, so a reload of the page of the item ends
	// them, and close() then writes the address of the list as a new entry. stepTo is the key that
	// step() writes on the page, in the place of the entry, until its navigation ends. Only that write
	// keeps fromList: a link from one item to another is a new entry, so the list is not before it.
	let listScroll: number | null = null;
	let fromList = false;
	let stepTo: string | null = null;
	/** True when the address is an address of this list or of one of its items. */
	const ours = (url: URL, here: URL) => (path ? url.pathname === path() || url.pathname.startsWith(`${path()}/`) : url.pathname === here.pathname);
	/** The scroll box of the list: the list column of ListSplit around the row of the key, or else around the first row. */
	const listBox = (k: string | null) => {
		const row = (k !== null ? document.getElementById(rowId(k)) : null) ?? document.getElementById(rowId(o.shown()[0] ?? ''));
		return row?.closest<HTMLElement>('[data-slot=list-split-list]') ?? null;
	};
	/**
	 * Back on the list: the scroll position of the list from the moment the item opened, and the focus
	 * on the row of the item, else on the empty state or the list column, as after close().
	 */
	const toList = async (k: string) => {
		await tick();
		const box = listBox(k);
		if (box && listScroll !== null) box.scrollTop = listScroll;
		listScroll = null;
		focusBack(k);
	};

	// The page form keeps the scroll position of the list when an item opens from it: with a row, a
	// link or the forward button of the browser. The list leaves the page then, and its box with it.
	beforeNavigate(({ from, to }) => {
		if (!asPage() || !from?.url || !to?.url || !ours(to.url, from.url)) return;
		const k = keyIn(to.url, false);
		if (!keyIn(from.url, false) && k) listScroll = listBox(k)?.scrollTop ?? null;
	});

	// An address that names an item opens it: at the load of the page, and at each navigation that
	// changes the key, such as a click, J, K or a link. With ssr off, the first navigation has a from
	// with no url. A key in the address, also ?item= or the closed mark, ends the first row that the
	// column holds, so an address with no key later shows the first row of that moment. When the hook
	// runs, page.state is the state of to.
	afterNavigate(({ from, to }) => {
		const n = to?.url ? keyIn(to.url, marked()) : null;
		if (n !== null) held = null;
		const k = n || null;
		// Only a move inside the one page counts as a change of the key. The query form compares the paths.
		// The path form compares the route, so a move from another route under the list path, such as
		// /quotes/QUO-1/history, reads the item again.
		const same = path ? from?.route.id === to?.route.id : from?.url?.pathname === to?.url?.pathname;
		const before = from?.url && same ? keyIn(from.url, false) || null : null;
		if (k !== null && k !== before) o.onread?.(k);
		// The page form: an item that opens from the list marks the entry before it, J and K on the page
		// keep the mark, and each way back to the list, also the back button of the browser, gives the
		// list its scroll position and focuses the row of the item. The list is the one route with no
		// key, so a move from another route under the list path, such as /quotes/QUO-1/history, or from
		// another item by a link, does not mark the entry.
		if (!asPage() || !to?.url) return;
		const listBefore = !!from?.url && same && !keyIn(from.url, false);
		if (k !== null) fromList = listBefore || (fromList && k === stepTo);
		else {
			fromList = false;
			if (before !== null) void toList(before);
		}
	});

	const inAddress: ItemInAddress = {
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
			// On the page of the page form, no row shows, so the step starts from the item.
			const onPage = asPage() && !!named();
			const from = onPage ? key() : (focused() ?? key());
			const at = from === null ? -1 : rows.indexOf(from);
			const next = at < 0 ? rows[0] : rows[Math.min(rows.length - 1, Math.max(0, at + by))];
			if (next === undefined) return;
			// On the list of the page form, J and K only move the focus. A click or Enter opens the item.
			// On the page, afterNavigate runs before the write ends, so it reads stepTo.
			if (onPage) {
				stepTo = next;
				try {
					await show(next);
				} finally {
					stepTo = null;
				}
			} else if (!asPage()) await show(next);
			await focus(next);
		},
		async close() {
			const k = key();
			if (asPage()) {
				// afterNavigate gives the list its scroll position and focuses the row.
				if (k === null) return;
				if (fromList) history.back();
				else await write('', true);
				return;
			}
			await write('');
			if (k === null) return;
			await tick();
			focusBack(k);
		},
		openPage(k) {
			if (!o.href) return false;
			void goto(o.href(k));
			return true;
		},
		rowId
	};
	return inAddress;
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
