<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import * as Table from '#lib/components/ui/table/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import TableTree, { type TreeRow } from '#lib/stack/TableTree.svelte';
	import { checkboxReadonly } from '#lib/stack/checkbox-readonly.js';

	const invoices = [
		{ id: 'INV001', status: 'Paid', method: 'Card', amount: '$250.00', selected: false },
		{ id: 'INV002', status: 'Pending', method: 'Transfer', amount: '$150.00', selected: true },
		{ id: 'INV003', status: 'Unpaid', method: 'Card', amount: '$350.00', selected: false }
	];

	// A tree of roles and permissions in three levels. Each box of a parent row acts on its row and on
	// every row under it that has the permission. A child row keeps its own value under a parent row
	// that holds the permission, and it shows again when the parent row clears the box.
	const PERMS = [
		{ id: 'see', label: 'See' },
		{ id: 'create', label: 'Create' },
		{ id: 'change', label: 'Change' },
		{ id: 'delete', label: 'Delete' },
		{ id: 'export', label: 'Export' }
	] as const;
	type Perm = (typeof PERMS)[number]['id'];
	type Feature = TreeRow & { perms: Perm[] };
	const ALL: Perm[] = ['see', 'create', 'change', 'delete', 'export'];
	const features: Feature[] = [
		{ id: 'sales', name: 'Sales', note: 'every part', perms: ALL },
		{ id: 'invoices', parent: 'sales', name: 'Invoices', perms: ALL },
		{ id: 'drafts', parent: 'invoices', name: 'Drafts', perms: ALL },
		{ id: 'sent', parent: 'invoices', name: 'Sent invoices', perms: ALL },
		{ id: 'credit', parent: 'invoices', name: 'Credit notes', perms: ALL },
		{ id: 'quotes', parent: 'sales', name: 'Quotes', perms: ALL },
		{ id: 'customers', parent: 'sales', name: 'Customers', perms: ALL },
		{ id: 'settings', name: 'Settings', note: 'every part', perms: ALL },
		{ id: 'users', parent: 'settings', name: 'Users', perms: ALL },
		{ id: 'roles', parent: 'settings', name: 'Roles', perms: ALL },
		{ id: 'audit', parent: 'settings', name: 'Audit log', perms: ['see', 'export'] },
		{ id: 'reports', name: 'Reports', note: 'every part', perms: ['see', 'export'] },
		{ id: 'monthly', parent: 'reports', name: 'Monthly', perms: ['see', 'export'] },
		{ id: 'yearly', parent: 'reports', name: 'Yearly', perms: ['see', 'export'] }
	];
	const byId = new Map(features.map((f) => [f.id, f]));
	const granted = new SvelteSet<string>([
		'sales:see',
		'invoices:change',
		'drafts:delete',
		'customers:export',
		'users:see',
		'audit:export',
		'monthly:export'
	]);
	const featuresFolded = new SvelteSet<string>(['reports']);

	const key = (f: Feature, p: Perm) => `${f.id}:${p}`;
	const holds = (f: Feature, p: Perm) => f.perms.includes(p) && granted.has(key(f, p));
	/** The parent rows above the row, the top one first. */
	function above(f: Feature): Feature[] {
		const out: Feature[] = [];
		for (let id = f.parent; id !== undefined; id = byId.get(id)!.parent) out.unshift(byId.get(id)!);
		return out;
	}
	/** The rows under the row, at every depth. */
	const under = (f: Feature): Feature[] => features.filter((g) => above(g).includes(f));

	type Box =
		| { kind: 'none' }
		| { kind: 'set'; by: Feature }
		| { kind: 'own'; checked: boolean; mixed: boolean };
	function box(f: Feature, p: Perm): Box {
		if (!f.perms.includes(p)) return { kind: 'none' };
		const by = above(f).find((h) => holds(h, p));
		if (by) return { kind: 'set', by };
		const checked = holds(f, p);
		return { kind: 'own', checked, mixed: !checked && under(f).some((g) => holds(g, p)) };
	}
	function grant(f: Feature, p: Perm, on: boolean) {
		if (on) granted.add(key(f, p));
		else granted.delete(key(f, p));
	}
	const isHeadFeature = (f: Feature) => f.parent === undefined || features.some((g) => g.parent === f.id);
	const boxName = (f: Feature, label: string) => (isHeadFeature(f) ? `${label} all of ${f.name}` : `${label} ${f.name}`);
	// A box that a parent row sets: read-only, so that Bits UI does not change it, and aria-disabled,
	// which Chromium gives as the state. It stays in the tab order, with the reason in a tooltip and
	// in aria-describedby.

	// A tree of accounts with the selection of ### table. A parent row sums the balances of its rows.
	type Account = TreeRow & { balance?: number; budget?: number };
	const accounts: Account[] = [
		{ id: 'assets', name: 'Assets' },
		{ id: 'current', parent: 'assets', name: 'Current assets' },
		{ id: 'bank', parent: 'current', name: 'Bank account', balance: 48250.4, budget: 50000 },
		{ id: 'cash', parent: 'current', name: 'Cash', balance: 1320 },
		{ id: 'fixed', parent: 'assets', name: 'Fixed assets', balance: 21800, budget: 25000 },
		{ id: 'liabilities', name: 'Liabilities' },
		{ id: 'payables', parent: 'liabilities', name: 'Supplier payables', balance: 9410.75, budget: 12000 },
		{ id: 'loans', parent: 'liabilities', name: 'Loans', balance: -12000 }
	];
	const accountsFolded = new SvelteSet<string>();
	const picked = new SvelteSet<string>(['current', 'payables']);
	const leafSum = (a: Account): number =>
		a.balance ?? accounts.filter((b) => b.parent === a.id).reduce((s, b) => s + leafSum(b), 0);
	const number = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	// A negative amount takes the minus sign U+2212, not the hyphen of Intl.
	const money = (n: number) => `${n < 0 ? '−' : ''}${number.format(Math.abs(n))}`;
</script>

{#snippet none()}
	<span aria-hidden="true" class="text-muted-foreground">&mdash;</span><span class="sr-only">Does not apply</span>
{/snippet}

<section id="showcase-table" data-showcase="table" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">table</h2>
	<div class="max-w-3xl">
		<Table.Root>
			<Table.Caption>Recent invoices. The second row is selected.</Table.Caption>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-8"><Checkbox aria-label="Select all" indeterminate /></Table.Head>
					<Table.Head>Invoice</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Method</Table.Head>
					<Table.Head class="text-right">Amount</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each invoices as row (row.id)}
					<Table.Row data-state={row.selected ? 'selected' : undefined}>
						<Table.Cell><Checkbox aria-label="Select {row.id}" checked={row.selected} /></Table.Cell>
						<Table.Cell class="font-medium">{row.id}</Table.Cell>
						<Table.Cell>{row.status}</Table.Cell>
						<Table.Cell>{row.method}</Table.Cell>
						<Table.Cell class="text-right">{row.amount}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
			<Table.Footer>
				<Table.Row>
					<Table.Cell colspan={4}>Total</Table.Cell>
					<Table.Cell class="text-right">$750.00</Table.Cell>
				</Table.Row>
			</Table.Footer>
		</Table.Root>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-medium text-muted-foreground">tree: the permissions of a role in three levels</h3>
		<p class="max-w-3xl text-xs text-muted-foreground">
			A box of a parent row acts on every row under it. It is mixed while only some rows under it hold the permission.
			A box that a parent row sets is read-only, with the reason in its tooltip. Reports starts folded.
		</p>
		<div id="showcase-table-tree" class="max-w-3xl" data-grants={granted.size}>
			<Tooltip.Provider>
				<TableTree rows={features} folded={featuresFolded} caption="The permissions of the role Sales team.">
					{#snippet head()}
						<Table.Head>Feature</Table.Head>
						{#each PERMS as p (p.id)}<Table.Head class="min-w-[44px]">{p.label}</Table.Head>{/each}
					{/snippet}
					{#snippet cells(f)}
						{#each PERMS as p (p.id)}
							{@const b = box(f, p.id)}
							<Table.Cell>
								{#if b.kind === 'none'}
									{@render none()}
								{:else if b.kind === 'set'}
									{@const reason = `Set by ${b.by.name}. Change it in the ${b.by.name} row.`}
									{@const rid = `showcase-table-tree-${f.id}-${p.id}-reason`}
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<Checkbox
													{...props}
													data-slot="checkbox"
													checked
													readonly
													aria-disabled="true"
													aria-label={boxName(f, p.label)}
													aria-describedby={rid}
													class={checkboxReadonly}
												/>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>{reason}</Tooltip.Content>
									</Tooltip.Root>
									<span id={rid} hidden>{reason}</span>
								{:else}
									<Checkbox
										aria-label={boxName(f, p.label)}
										checked={b.checked}
										indeterminate={b.mixed}
										onCheckedChange={(on) => grant(f, p.id, on)}
									/>
								{/if}
							</Table.Cell>
						{/each}
					{/snippet}
				</TableTree>
			</Tooltip.Provider>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-medium text-muted-foreground">tree: accounts with the selection, a selected parent row and a selected child row</h3>
		<div id="showcase-table-accounts" class="max-w-3xl">
			<TableTree
				rows={accounts}
				folded={accountsFolded}
				caption="Accounts on 31 October 2026, in EUR."
				selected={(a) => picked.has(a.id)}
			>
				{#snippet head()}
					<Table.Head class="w-[44px] min-w-[44px]">
						<Checkbox
							aria-label="Select all"
							checked={picked.size === accounts.length}
							indeterminate={picked.size > 0 && picked.size < accounts.length}
							onCheckedChange={(on) => {
								picked.clear();
								if (on) for (const a of accounts) picked.add(a.id);
							}}
						/>
					</Table.Head>
					<Table.Head>Account</Table.Head>
					<Table.Head class="text-right">Balance</Table.Head>
					<Table.Head class="text-right">Budget</Table.Head>
				{/snippet}
				{#snippet start(a)}
					<Table.Cell>
						<Checkbox
							aria-label="Select {a.name}"
							checked={picked.has(a.id)}
							onCheckedChange={(on) => (on ? picked.add(a.id) : picked.delete(a.id))}
						/>
					</Table.Cell>
				{/snippet}
				{#snippet cells(a)}
					<Table.Cell class="text-right tabular-nums"><span class="font-medium">{money(leafSum(a))}</span></Table.Cell>
					<Table.Cell class="text-right tabular-nums">
						{#if a.budget === undefined}{@render none()}{:else}{money(a.budget)}{/if}
					</Table.Cell>
				{/snippet}
			</TableTree>
		</div>
	</div>
</section>
