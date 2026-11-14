<script lang="ts">
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import PropertyStrip, { type StripProperty } from '#lib/stack/PropertyStrip.svelte';
	import { cn } from '#lib/utils.js';

	// The properties of a case as one row of values under its title: in the pane of band 2, which lies
	// over the list at 420 px, and in a wide item with no properties panel. Status and Owner are values
	// that the person changes, so each is a ghost button of size xs that opens a menu, with the strong
	// edge under the pointer. Created is a value that the system sets, so it is plain text. Due is
	// empty, so it shows a placeholder word. Terms is a long value: it takes a line of its own and
	// wraps. Every case, person and value is invented.
	const STATUSES = ['Open', 'Waiting', 'Closed'];
	const OWNERS = ['Emma Hart', 'Oliver Grant', 'Nora Blake'];
	let status = $state('Open');
	let owner = $state('Emma Hart');
	const valueButton = cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'max-w-full font-normal hover:border-border-strong');

	const properties: StripProperty[] = $derived([
		{ label: 'Status', value: statusValue },
		{ label: 'Owner', value: ownerValue },
		{ label: 'Created', value: '18 Nov 13:52' },
		{ label: 'Due', value: dueValue },
		{ label: 'Terms', value: 'Refund within 14 days of the return of the goods, to the card of the order, less the cost of the return label.' }
	]);
	const short = $derived(properties.slice(0, 4));
</script>

{#snippet pick(name: string, value: string, options: string[], set: (v: string) => void)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class={valueButton} aria-label="{name}: {value}">{value}</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-40">
			<DropdownMenu.RadioGroup {value} onValueChange={set}>
				{#each options as o (o)}<DropdownMenu.RadioItem value={o}>{o}</DropdownMenu.RadioItem>{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
{#snippet statusValue()}{@render pick('Status', status, STATUSES, (v) => (status = v))}{/snippet}
{#snippet ownerValue()}{@render pick('Owner', owner, OWNERS, (v) => (owner = v))}{/snippet}
{#snippet dueValue()}<span class="text-muted-foreground">No date</span>{/snippet}

<section id="showcase-property-strip" data-showcase="property-strip" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">property-strip</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		The properties of an item as one row of values under its title, in the pane of band 2 and in an item with no properties panel. A value
		that the person changes opens a menu. A long value takes a line of its own and wraps.
	</p>

	<div class="flex flex-wrap items-start gap-6">
		<h3 class="sr-only">In the pane of band 2</h3>
		<div data-probe="strip-pane" class="flex w-105 max-w-full flex-col gap-1 rounded-lg border border-border bg-popover p-4 shadow-lg">
			<p class="text-base font-semibold tabular-nums">CASE-0142</p>
			<p class="text-xl font-semibold text-strong-foreground">Refund for order 8841</p>
			<PropertyStrip label="Properties" {properties} />
		</div>

		<h3 class="sr-only">In a wide item with no properties panel</h3>
		<div data-probe="strip-wide" class="flex max-w-3xl min-w-0 flex-1 flex-col gap-1 rounded-lg border border-border p-4">
			<p class="text-xl font-semibold text-strong-foreground">Refund for order 8841</p>
			<PropertyStrip label="Properties" properties={short} />
		</div>
	</div>
</section>
