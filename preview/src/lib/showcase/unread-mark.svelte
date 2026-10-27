<script lang="ts">
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import ItemColumns from '#lib/stack/ItemColumns.svelte';
	import ListSplit, { itemDocks } from '#lib/stack/ListSplit.svelte';
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
	import SplitRow from '#lib/stack/SplitRow.svelte';
	import UnreadMark from '#lib/stack/UnreadMark.svelte';
	import BellIcon from '@lucide/svelte/icons/bell';
	import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ListFilterIcon from '@lucide/svelte/icons/list-filter';
	import MailIcon from '@lucide/svelte/icons/mail';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import XIcon from '@lucide/svelte/icons/x';

	// A list of notices in the work form, grouped by day under the head of a day of day-log. An
	// unread row ends line 1 in the unread mark and sets its title at 500. From 1024 px the item
	// column shows the first row with no click, and that row stays unread. A click, J or K, or the
	// arrow keys open a row, and it counts as read. Mark as unread in More gives the mark back.
	// Mark 4 as read marks every unread row, and its toast offers Undo. Below 768 px the list is
	// the whole screen, a tap counts as an open, and the action is an icon button in the header.
	// Under the list: the mark on each ground of a row, the count of the sidebar and of its rail,
	// and the count of the phone tab bar. Every notice, person and record is invented.
	type Notice = { key: string; actor?: string; text: string; kind: string; record: string; at: Date; unread: boolean };
	const ZONE = 'Europe/Belgrade';
	/** A time in Belgrade in November, which is UTC+1. */
	const at = (s: string) => new Date(`${s}+01:00`);
	const notice = (key: string, actor: string | undefined, text: string, kind: string, record: string, time: string, unread: boolean): Notice => ({
		key,
		actor,
		text,
		kind,
		record,
		at: at(time),
		unread
	});

	let notices = $state<Notice[]>([
		notice('N-0412', 'Ana Turner', 'assigned CASE-0142 to you', 'Case', 'Refund for order 8841', '2026-11-18T13:52:00', true),
		notice('N-0411', undefined, 'The export of October failed', 'Job', 'Export of the invoice list', '2026-11-18T13:10:00', true),
		notice('N-0410', 'Marko Ellis', 'replied on CASE-0139', 'Case', 'Change of the delivery address', '2026-11-18T11:45:00', false),
		notice('N-0409', undefined, 'The draft of QUO-0088 waits for your review', 'Quote', 'Harbour Studio', '2026-11-18T09:30:00', true),
		notice('N-0408', undefined, 'The report of week 46 is ready', 'Report', 'Week 46', '2026-11-17T16:40:00', false),
		notice('N-0407', 'Jelena Brandt', 'changed the due time of CASE-0137', 'Case', 'Damaged parcel', '2026-11-17T10:05:00', true),
		notice('N-0406', undefined, 'A request for access to data came in', 'Request', 'REQ-0019', '2026-11-17T08:15:00', false)
	]);

	const uid = $props.id();
	const rowId = (key: string) => `${uid}-row-${key}`;
	const phone = new ScreenQuery('max-width: 767px');
	const today = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit' });
	const thisYear = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	const fullTime = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, dateStyle: 'full', timeStyle: 'short' });
	const dayOf = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: ZONE });
	/** A time by its age, as "Formats" in architecture/web-app.md says. Now is 2026-11-18 in Belgrade. */
	const age = (d: Date) => (dayOf(d) === '2026-11-18' ? today.format(d) : thisYear.format(d));

	const days = $derived(
		[
			{ name: 'Today', date: '2026-11-18' },
			{ name: 'Yesterday', date: '2026-11-17' }
		].map((d) => ({ ...d, rows: notices.filter((n) => dayOf(n.at) === d.date) }))
	);
	const unreadCount = $derived(notices.filter((n) => n.unread).length);

	/** The notice that the person opened, '' after Esc or Close, and undefined before any choice. */
	let opened = $state<string | undefined>(undefined);
	const shown = $derived(opened === undefined ? (itemDocks.current && !phone.current ? notices[0].key : undefined) : opened || undefined);
	const shownNotice = $derived(notices.find((n) => n.key === shown));

	function open(key: string) {
		opened = key;
		const n = notices.find((x) => x.key === key);
		if (n) n.unread = false;
	}

	async function focusRow(key: string | undefined) {
		await tick();
		document.getElementById(rowId(key ?? notices[0].key))?.focus();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const next = e.key === 'j' || e.key === 'ArrowDown' ? 1 : e.key === 'k' || e.key === 'ArrowUp' ? -1 : 0;
		if (next) {
			e.preventDefault();
			const from = notices.findIndex((n) => n.key === (document.activeElement?.id.slice(`${uid}-row-`.length) || shown));
			const to = notices[Math.min(notices.length - 1, Math.max(0, from + next))];
			open(to.key);
			focusRow(to.key);
		} else if (e.key === 'Escape' && shown) {
			e.preventDefault();
			close();
		}
	}

	function close() {
		const key = shown;
		opened = '';
		focusRow(key);
	}

	async function markAll() {
		const keys = notices.filter((n) => n.unread).map((n) => n.key);
		for (const n of notices) n.unread = false;
		toast(`${keys.length} marked as read`, {
			action: { label: 'Undo', onClick: () => notices.forEach((n) => keys.includes(n.key) && (n.unread = true)) },
			duration: 10000
		});
		// The button goes with the last unread row, so the focus moves to the current row, or to the
		// first row while the item column is closed.
		focusRow(shown);
	}
</script>

{#snippet sentence(n: Notice)}{#if n.actor}<span class="font-medium">{n.actor}</span>{' '}{/if}{n.text}{/snippet}

{#snippet rows()}
	{#each days as d (d.date)}
		<section aria-labelledby="{uid}-day-{d.date}">
			<h3 id="{uid}-day-{d.date}" class="sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-border bg-muted pr-4 pl-3 text-sm">
				<span class="font-semibold">{d.name}</span>
				<span class="text-muted-foreground"><time datetime={d.date} class="tabular-nums">{d.date}</time> · {d.rows.length} notices</span>
			</h3>
			<ul role="list" aria-labelledby="{uid}-day-{d.date}">
				{#each d.rows as n (n.key)}
					<SplitRow id={rowId(n.key)} current={n.key === shown} unread={n.unread} onopen={() => open(n.key)}>
						{#snippet line1()}{@render sentence(n)}{/snippet}
						{#snippet end1()}<time datetime={n.at.toISOString()} title={fullTime.format(n.at)}>{age(n.at)}</time>{/snippet}
						{#snippet line2()}<span class="text-muted-foreground">{n.kind}</span> · {n.record}{/snippet}
					</SplitRow>
				{/each}
			</ul>
		</section>
	{/each}
{/snippet}

{#snippet markButton()}
	{#if unreadCount > 0}
		{#if phone.current}
			<Button variant="ghost" size="icon" class="size-11" aria-label="Mark {unreadCount} as read" onclick={markAll}><CheckCheckIcon /></Button>
		{:else}
			<Button variant="outline" size="sm" class="tabular-nums" onclick={markAll}><CheckCheckIcon data-icon="inline-start" />Mark {unreadCount} as read</Button>
		{/if}
	{/if}
{/snippet}

<section id="showcase-unread-mark" data-showcase="unread-mark" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">unread-mark</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		A list of notices in the work form. An unread row ends line 1 in the mark, and its title takes 500. From 1024 px the item column shows the
		first row, which stays unread until a click, J or K opens it. More holds Mark as unread. Mark all as read offers Undo in its toast.
	</p>

	<!-- The top bar and the list of notices. The box is the window of the list, so it holds its own scroll. -->
	<div class="flex h-[28rem] flex-col overflow-hidden rounded-lg border border-border print:h-auto">
		{#if phone.current}
			<div class="flex h-13 shrink-0 items-center gap-1 border-b border-border pr-1 pl-4">
				<h3 class="min-w-0 flex-1 truncate text-xl font-semibold">Notices</h3>
				<div class="print:hidden">{@render markButton()}</div>
			</div>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="min-h-0 flex-1 overflow-y-auto print:overflow-visible" {onkeydown}>{@render rows()}</div>
		{:else}
			<div class="flex h-11 shrink-0 items-center gap-2 border-b border-border pr-4 pl-3">
				<h3 class="text-sm font-medium">Notices</h3>
				<div class="ml-auto flex items-center gap-2 print:hidden">
					{@render markButton()}
					<Button variant="outline" size="sm"><ListFilterIcon data-icon="inline-start" />Filter</Button>
				</div>
			</div>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="flex min-h-0 flex-1 print:block" {onkeydown}>
				<ListSplit open={!!shownNotice} key={shownNotice?.key} listLabel="Notices" itemLabel={shownNotice ? `Notice ${shownNotice.key}` : 'Notice'} list={rows}>
					{#snippet item()}
						{#if shownNotice}
							{@const n = shownNotice}
							<ItemColumns>
								{#snippet header()}
									<div class="flex items-center gap-2">
										<span class="text-base font-semibold tabular-nums">{n.key}</span>
										<span class="ml-auto text-xs text-muted-foreground tabular-nums">{notices.indexOf(n) + 1} / {notices.length}</span>
										<DropdownMenu.Root>
											<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })} aria-label="More actions for {n.key}">
												<EllipsisIcon />
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end" class="w-48">
												<DropdownMenu.Item onSelect={() => (n.unread = !n.unread)}><MailIcon />{n.unread ? 'Mark as read' : 'Mark as unread'}</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
										<Button variant="ghost" size="icon-sm" aria-label="Close" aria-keyshortcuts="Escape" onclick={close}><XIcon /></Button>
									</div>
								{/snippet}
								{#snippet content()}
									<p class="text-md">{#if n.actor}{n.actor}{' '}{/if}{n.text}.</p>
									<p class="text-sm text-muted-foreground">{n.kind} · {n.record} · {fullTime.format(n.at)}</p>
								{/snippet}
							</ItemColumns>
						{/if}
					{/snippet}
				</ListSplit>
			</div>
		{/if}
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">The mark on each ground of a row, and a list with no read state</h3>
	<ul role="list" aria-label="The unread mark on each ground" class="max-w-xl overflow-hidden rounded-lg border border-border">
		<SplitRow id="{uid}-g1" unread={true}>
			{#snippet line1()}A row at rest{/snippet}
			{#snippet end1()}14:02{/snippet}
			{#snippet line2()}The background ground{/snippet}
		</SplitRow>
		<SplitRow id="{uid}-g2" unread={true} current>
			{#snippet line1()}The current row{/snippet}
			{#snippet end1()}13:52{/snippet}
			{#snippet line2()}The muted ground{/snippet}
		</SplitRow>
		<SplitRow id="{uid}-g3" unread={true} selected>
			{#snippet line1()}A selected row{/snippet}
			{#snippet end1()}13:10{/snippet}
			{#snippet line2()}The selected ground{/snippet}
		</SplitRow>
		<SplitRow id="{uid}-g4" unread={false}>
			{#snippet line1()}A read row keeps the place of the mark{/snippet}
			{#snippet end1()}11:45{/snippet}
			{#snippet line2()}The time keeps the column of the times above{/snippet}
		</SplitRow>
		<SplitRow id="{uid}-g5">
			{#snippet line1()}A list with no read state{/snippet}
			{#snippet end1()}09:30{/snippet}
			{#snippet line2()}No place for the mark{/snippet}
		</SplitRow>
	</ul>

	<h3 class="text-xs font-medium text-muted-foreground">The count of the sidebar, the mark in its rail, and the phone tab bar</h3>
	<div class="flex flex-wrap items-start gap-6">
		{#if !phone.current}
			{#each [true, false] as expanded (expanded)}
				<div class="relative h-40 w-96 overflow-hidden rounded-lg border border-border [transform:translateZ(0)] print:hidden">
					<Sidebar.Provider open={expanded} class="h-full min-h-0" style="--sidebar-width: 15rem; --sidebar-width-icon: 3.5rem">
						<Sidebar.Root collapsible="icon" class="group-data-[collapsible=icon]:bg-sidebar group-data-[collapsible=icon]:px-1">
							<Sidebar.Content>
								<Sidebar.Group>
									<Sidebar.Menu>
										<Sidebar.MenuItem>
											<Sidebar.MenuButton tooltipContent="Notices, {unreadCount} unread" aria-label={unreadCount > 0 ? `Notices, ${unreadCount} unread` : undefined}>
												<span class="relative flex">
													<BellIcon />
													{#if unreadCount > 0}
														<UnreadMark
															class="absolute -top-0.5 -right-0.5 hidden ring-2 ring-sidebar group-hover/menu-button:ring-sidebar-accent group-data-[active=true]/menu-button:ring-sidebar-accent group-data-[collapsible=icon]:block"
														/>
													{/if}
												</span>
												<span>Notices</span>
											</Sidebar.MenuButton>
											{#if unreadCount > 0}<Sidebar.MenuBadge aria-hidden="true" class="text-muted-foreground max-md:top-3!">{unreadCount}</Sidebar.MenuBadge>{/if}
										</Sidebar.MenuItem>
										<Sidebar.MenuItem>
											<Sidebar.MenuButton isActive aria-current="page" tooltipContent="Cases"><BriefcaseIcon /><span>Cases</span></Sidebar.MenuButton>
										</Sidebar.MenuItem>
										<Sidebar.MenuItem>
											<Sidebar.MenuButton tooltipContent="Settings"><SettingsIcon /><span>Settings</span></Sidebar.MenuButton>
										</Sidebar.MenuItem>
									</Sidebar.Menu>
								</Sidebar.Group>
							</Sidebar.Content>
						</Sidebar.Root>
						<Sidebar.Inset>
							<p class="p-3 text-xs text-muted-foreground">{expanded ? 'The sidebar: the count beside the page' : 'The rail: the mark on the icon'}</p>
						</Sidebar.Inset>
					</Sidebar.Provider>
				</div>
			{/each}
		{/if}

		<!-- The tab bar of band 1: the count on the icon of the page, and the mark on More, which stands for several pages. -->
		<nav aria-label="Tabs of the phone" class="flex h-14 w-full max-w-sm rounded-lg border border-border print:hidden">
			{#each [{ label: 'Notices', icon: BellIcon, count: unreadCount, current: true }, { label: 'Cases', icon: BriefcaseIcon, count: 0, current: false }, { label: 'Quotes', icon: FileTextIcon, count: 0, current: false }] as t (t.label)}
				<a
					href="#showcase-unread-mark"
					aria-current={t.current ? 'page' : undefined}
					aria-label={t.count ? `${t.label}, ${t.count} unread` : undefined}
					class={['flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-2xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset', t.current ? 'font-medium text-foreground' : 'text-muted-foreground']}
				>
					<span class="relative flex">
						<t.icon class="size-5" />
						{#if t.count}<Badge variant="secondary" aria-hidden="true" class="absolute -top-1.5 left-3 min-w-5 justify-center px-1 tabular-nums">{t.count}</Badge>{/if}
					</span>
					<span class="truncate">{t.label}</span>
				</a>
			{/each}
			<button type="button" aria-label="More, unread" class="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-2xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
				<span class="relative flex">
					<EllipsisIcon class="size-5" />
					<UnreadMark class="absolute -top-0.5 -right-0.5 ring-2 ring-background" />
				</span>
				<span class="truncate">More</span>
			</button>
		</nav>
	</div>
</section>
