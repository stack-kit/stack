<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
	import { toast } from 'svelte-sonner';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import SelectionBar, { fmt, selectionText, type SelectionAction } from '#lib/stack/SelectionBar.svelte';
	import { cn } from '#lib/utils.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import ListFilterIcon from '@lucide/svelte/icons/list-filter';
	import PrinterIcon from '@lucide/svelte/icons/printer';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// A list of invoices under a top bar. While a row is selected, the selection bar takes the place
	// of the content of the top bar. The list shows the first 8 of the 214 invoices of the filter.
	// The keys of architecture/web-app.md work on the box of a row: J and K or the arrow keys move,
	// X selects, Shift+X and Shift with a click or Space select a range, Shift with an arrow key
	// extends, Cmd+A selects the page, and Esc clears. Below 768 px a long press on a row selects it.
	type Status = 'Draft' | 'Sent' | 'Paid';
	type Row = { id: string; number: string; client: string; status: Status; amount: number };

	const start: Row[] = [
		['0041', 'Northwind Trading', 'Sent', 1240],
		['0042', 'Harbour Studio', 'Draft', 860.5],
		['0043', 'Atlas Engineering', 'Sent', 4300],
		['0044', 'Linden Bakery', 'Paid', 312],
		['0045', 'Quarry Lane Dental', 'Sent', 2075.25],
		['0046', 'Meridian Freight', 'Draft', 9800],
		['0047', 'Copperleaf Books', 'Sent', 145.9],
		['0048', 'Silver Birch Hotel', 'Paid', 5620]
	].map(([n, client, status, amount]) => ({ id: `inv-${n}`, number: n as string, client: client as string, status: status as Status, amount: amount as number }));

	const money = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const uid = $props.id();
	const barId = `${uid}-bar`;
	const boxId = (r: Row) => `${uid}-box-${r.id}`;
	const phone = new ScreenQuery('max-width: 767px');

	let rows = $state<Row[]>(start);
	/** The invoices of the filter, the rows not loaded too, and how many of them are sent. */
	let total = $state(214);
	let sentInFilter = $state(97);
	const selected = new SvelteSet<string>();
	/** True after Select all: every invoice of the filter is selected. */
	let all = $state(false);
	/** The last row that a person selected or cleared: the start of a range. */
	let anchor = $state<number | null>(null);
	/** The last row whose box had the focus. */
	let lastRow = $state<string | null>(null);
	/** The text of the live region. */
	let said = $state('');

	const count = $derived(all ? total : selected.size);
	const page = $derived(rows.length);
	const chosen = $derived(all ? rows : rows.filter((r) => selected.has(r.id)));
	const notSent = $derived(all ? total - sentInFilter : chosen.filter((r) => r.status !== 'Sent').length);
	const noun = (n: number) => `${fmt(n)} ${n === 1 ? 'invoice' : 'invoices'}`;

	function announce() {
		said = selectionText(count, page, total, all);
	}
	function setRow(r: Row, on: boolean) {
		if (all) {
			all = false;
			for (const x of rows) selected.add(x.id);
		}
		if (on) selected.add(r.id);
		else selected.delete(r.id);
		anchor = rows.indexOf(r);
		announce();
	}
	function selectRange(from: number, to: number) {
		all = false;
		const [a, b] = from < to ? [from, to] : [to, from];
		for (let i = a; i <= b; i++) selected.add(rows[i].id);
		announce();
	}
	function selectPage(on: boolean) {
		all = false;
		selected.clear();
		if (on) for (const r of rows) selected.add(r.id);
		announce();
	}
	function selectAll() {
		all = true;
		announce();
	}
	/** Clears the selection and puts the focus back on the row that had it last. */
	async function clear() {
		all = false;
		selected.clear();
		anchor = null;
		announce();
		await tick();
		const back = rows.find((r) => r.id === lastRow) ?? rows[0];
		if (back) document.getElementById(boxId(back))?.focus();
	}

	/**
	 * Takes the chosen rows out of the page, and puts the focus on the row that takes the place of
	 * the first one. From a dialog, the focus moves when the dialog has closed, so `focus` is false.
	 */
	let after: Row | undefined;
	async function takeOut(focus = true): Promise<{ gone: { row: Row; at: number }[]; n: number; wasAll: boolean }> {
		const gone = chosen.map((row) => ({ row, at: rows.indexOf(row) }));
		const n = count;
		const wasAll = all;
		const first = gone.length ? gone[0].at : 0;
		rows = rows.filter((r) => !gone.some((g) => g.row.id === r.id));
		total -= n;
		sentInFilter -= wasAll ? sentInFilter : gone.filter((g) => g.row.status === 'Sent').length;
		all = false;
		selected.clear();
		anchor = null;
		said = '';
		await tick();
		after = rows[Math.min(first, rows.length - 1)];
		if (focus && after) document.getElementById(boxId(after))?.focus();
		return { gone, n, wasAll };
	}
	async function putBack(gone: { row: Row; at: number }[], n: number, wasAll: boolean, sent: number) {
		const next = [...rows];
		for (const g of gone) next.splice(g.at, 0, g.row);
		rows = next;
		total += n;
		sentInFilter = sent;
		if (wasAll) all = true;
		else for (const g of gone) selected.add(g.row.id);
		said = `${noun(n)} back, and selected again`;
		// The toast leaves with its Undo button, so the focus moves to the first row that came back.
		await tick();
		if (gone[0]) document.getElementById(boxId(gone[0].row))?.focus();
	}

	async function archive() {
		const sent = sentInFilter;
		const { gone, n, wasAll } = await takeOut();
		toast(`${noun(n)} archived`, { action: { label: 'Undo', onClick: () => putBack(gone, n, wasAll, sent) }, duration: 10000 });
	}
	function markPaid() {
		const changed = chosen.filter((r) => r.status === 'Sent').map((r) => r.id);
		const n = count;
		rows = rows.map((r) => (changed.includes(r.id) ? { ...r, status: 'Paid' } : r));
		toast(`${noun(n)} marked as paid`, {
			action: { label: 'Undo', onClick: () => (rows = rows.map((r) => (changed.includes(r.id) ? { ...r, status: 'Sent' } : r))) },
			duration: 10000
		});
	}

	// Delete has no Undo, so it asks first. The dialog keeps the words of the moment that it opened,
	// so that they do not change while it closes.
	let confirming = $state(false);
	let confirmTitle = $state('');
	let confirmAction = $state('');
	let confirmDescription = $state('');
	let deleted = false;
	function askDelete() {
		confirmTitle = `Delete ${noun(count)}?`;
		confirmAction = `Delete ${noun(count)}`;
		confirmDescription = confirmText();
		confirming = true;
	}
	function confirmText() {
		if (all) return `This deletes the ${noun(total)} of the filter Year is 2026. It cannot be undone.`;
		const names = chosen.map((r) => `INV-${r.number}`);
		const list =
			names.length <= 3
				? names.length === 1
					? names[0]
					: `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
				: `${names.slice(0, 3).join(', ')} and ${fmt(names.length - 3)} more`;
		return `This deletes ${list}. It cannot be undone.`;
	}
	async function remove() {
		deleted = true;
		const { n } = await takeOut(false);
		confirming = false;
		said = `${noun(n)} deleted`;
	}

	const actions = $derived<SelectionAction[]>([
		{
			id: 'paid',
			label: 'Mark as paid',
			icon: CircleCheckIcon,
			reason: !notSent
				? undefined
				: count === 1
					? 'Mark as paid takes a sent invoice only.'
					: notSent === count
						? `Mark as paid takes sent invoices only, and none of the ${fmt(count)} is sent.`
						: `Mark as paid takes sent invoices only, and ${fmt(notSent)} of the ${fmt(count)} ${notSent === 1 ? 'is' : 'are'} not sent.`,
			run: markPaid
		},
		{ id: 'archive', label: 'Archive', icon: ArchiveIcon, run: archive },
		{ id: 'download', label: 'Download', icon: DownloadIcon, run: () => (said = `The download of ${noun(count)} started`) },
		{ id: 'print', label: 'Print', icon: PrinterIcon, run: () => (said = `${noun(count)} went to the printer`) },
		{ id: 'delete', label: 'Delete…', icon: Trash2Icon, destructive: true, run: askDelete }
	]);

	/** The keys of a list, on the box of a row. */
	function onListKey(e: KeyboardEvent) {
		const i = rows.findIndex((r) => boxId(r) === (e.target as HTMLElement).id);
		if (i < 0) return;
		const mod = e.metaKey || e.ctrlKey;
		const focus = (j: number) => document.getElementById(boxId(rows[j]))?.focus();
		if (mod && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			selectPage(true);
			return;
		}
		if (mod || e.altKey) return;
		const down = e.key === 'ArrowDown' || (e.key === 'j' && !e.shiftKey);
		const up = e.key === 'ArrowUp' || (e.key === 'k' && !e.shiftKey);
		if (down || up) {
			e.preventDefault();
			const j = Math.max(0, Math.min(rows.length - 1, i + (down ? 1 : -1)));
			if (e.shiftKey && j !== i) {
				// Shift with an arrow key extends the range from the anchor by one row, and shrinks it
				// on the way back to the anchor.
				if (all) setRow(rows[i], true);
				if (anchor === null) {
					anchor = i;
					selected.add(rows[i].id);
				}
				if (Math.abs(j - anchor) < Math.abs(i - anchor)) selected.delete(rows[i].id);
				else selected.add(rows[j].id);
				announce();
			}
			focus(j);
			return;
		}
		if (e.key.toLowerCase() === 'x') {
			e.preventDefault();
			if (e.shiftKey && anchor !== null) selectRange(anchor, i);
			else setRow(rows[i], !(all || selected.has(rows[i].id)));
		}
	}
	// Shift with a click or with Space on a box selects the range. The handler runs before the one of
	// Bits UI, and preventDefault keeps Bits UI from toggling the box.
	function onBoxClick(e: MouseEvent, i: number) {
		if (!e.shiftKey || anchor === null) return;
		e.preventDefault();
		selectRange(anchor, i);
	}
	function onBoxKey(e: KeyboardEvent, i: number) {
		if (e.key !== ' ' || !e.shiftKey || anchor === null) return;
		e.preventDefault();
		selectRange(anchor, i);
	}
	function onFrameKey(e: KeyboardEvent) {
		if (e.key !== 'Escape' || e.defaultPrevented || count === 0) return;
		e.preventDefault();
		clear();
	}

	// Below 768 px a phone has no hover, so a long press of 500 ms on a row selects it. While a row
	// is selected, a tap on a row selects or clears it.
	let press: { timer: ReturnType<typeof setTimeout>; x: number; y: number } | null = null;
	let swallow = false;
	function onRowDown(e: PointerEvent, r: Row) {
		// A long press that no click follows must not swallow the next tap.
		swallow = false;
		if (e.pointerType !== 'touch') return;
		press = { x: e.clientX, y: e.clientY, timer: setTimeout(() => ((press = null), (swallow = true), setRow(r, true)), 500) };
	}
	function onRowMove(e: PointerEvent) {
		if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) onRowEnd();
	}
	function onRowEnd() {
		if (press) clearTimeout(press.timer);
		press = null;
	}
	function onRowClick(e: MouseEvent, r: Row) {
		if ((e.target as HTMLElement).closest('[data-slot=checkbox]')) return;
		if (swallow) {
			swallow = false;
			return;
		}
		if (phone.current && count > 0) setRow(r, !(all || selected.has(r.id)));
	}
</script>

<section id="showcase-selection-bar" data-showcase="selection-bar" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">selection-bar</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		The first 8 of the 214 invoices of the filter. Select a row with its box, X, or a long press on a phone. Mark as paid
		takes sent invoices only, so it is blocked while a draft or a paid invoice is selected.
	</p>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div id="{uid}-frame" class="max-w-4xl overflow-hidden rounded-lg border border-border" onkeydown={onFrameKey}>
		<div class="flex h-11 items-stretch border-b border-border max-md:h-13">
			{#if count > 0}
				<SelectionBar id={barId} {count} {page} {total} {all} {actions} onpage={() => selectPage(true)} onall={selectAll} onclear={clear} />
			{:else}
				<div class="flex flex-1 items-center gap-2 pr-4 pl-3 text-sm max-md:px-4">
					<span class="font-medium max-md:text-base">Invoices</span>
					<Badge variant="outline" class="max-md:hidden"><span class="text-muted-foreground">Year</span> is 2026</Badge>
					<Button variant="outline" size="sm" class="ml-auto max-md:hidden"><ListFilterIcon data-icon="inline-start" />Filter</Button>
				</div>
			{/if}
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<ul role="list" aria-label="Invoices" class="flex flex-col" onkeydown={onListKey}>
			{#each rows as r, i (r.id)}
				{@const on = all || selected.has(r.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					data-selected={on || undefined}
					class="group/row no-callout flex h-8 items-center gap-3 border-b border-border-faint pr-4 pl-3 text-sm select-none hover:bg-muted/50 data-selected:bg-selected max-md:h-13"
					onpointerdown={(e) => onRowDown(e, r)}
					onpointermove={onRowMove}
					onpointerup={onRowEnd}
					onpointercancel={onRowEnd}
					oncontextmenu={(e) => phone.current && e.preventDefault()}
					onclick={(e) => onRowClick(e, r)}
				>
					<Checkbox
						id={boxId(r)}
						aria-label="Select INV-{r.number}"
						class={cn('opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100', count > 0 && 'opacity-100')}
						bind:checked={() => on, (v) => setRow(r, v)}
						onclick={(e: MouseEvent) => onBoxClick(e, i)}
						onkeydown={(e: KeyboardEvent) => onBoxKey(e, i)}
						onfocus={() => (lastRow = r.id)}
					/>
					<div class="flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3">
						<div class="flex min-w-0 flex-1 items-center gap-3">
							<span class="w-18 shrink-0 font-medium">INV-<span class="tabular-nums">{r.number}</span></span>
							<span class="min-w-0 flex-1 truncate">{r.client}</span>
						</div>
						<div class="flex items-center gap-3 max-md:text-xs max-md:text-muted-foreground">
							<span class="md:w-12 md:text-xs md:text-muted-foreground">{r.status}</span>
							<span class="tabular-nums md:w-24 md:text-right"><span class="md:font-medium">{money.format(r.amount)}</span> <span class="text-muted-foreground">EUR</span></span>
						</div>
					</div>
				</li>
			{:else}
				<li class="px-3 py-2 text-xs text-muted-foreground">No invoices match the filter.</li>
			{/each}
		</ul>
		<p class="px-3 py-2 text-xs text-muted-foreground tabular-nums">{fmt(page)} of {fmt(total)} invoices</p>
	</div>
	<!-- The live region is in the page before the first row is selected, so a screen reader reads each change. -->
	<p id="{uid}-said" role="status" class="sr-only">{said}</p>

	<AlertDialog.Root bind:open={confirming}>
		<AlertDialog.Content
			onCloseAutoFocus={(e: Event) => {
				// Cancel gives the focus back to More. After Delete it goes to the row that takes the place of the first deleted row.
				e.preventDefault();
				const to = deleted ? (after ? boxId(after) : `${uid}-frame`) : `${barId}-more`;
				document.getElementById(to)?.focus();
				deleted = false;
			}}
		>
			<AlertDialog.Header>
				<AlertDialog.Title>{confirmTitle}</AlertDialog.Title>
				<AlertDialog.Description>{confirmDescription}</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action variant="destructive" onclick={remove}>{confirmAction}</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</section>

<style>
	/* A long press on a row selects it, so iOS shows no callout menu over the row. No Tailwind class
	   writes this property, so it is written here. */
	.no-callout {
		-webkit-touch-callout: none;
	}
</style>
