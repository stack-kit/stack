<!--
	A flow: the transitions from one page or state to the next, as a table of from, to and count
	(DESIGN.md, `### Flow`). It is no Sankey diagram. The rows are sorted by the count, largest first,
	and the count column says so with aria-sort. The table takes the look of `### table`, and its
	caption names it. A <div> is the root of the part: it takes the class, the other attributes and
	ref, and its data-slot is flow-table. It holds the scroll box of Table.Root, so the <table> keeps
	its data-slot table.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type Transition = { from: string; to: string; count: number };

	// title is the caption, so the table takes no title attribute.
	export type FlowTableProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'title'> & {
		/** The root element of the part: the box of the table. */
		ref?: HTMLDivElement | null;
		/** The name of the flow: the caption of the table. */
		title: string;
		rows: Transition[];
		fromLabel?: string;
		toLabel?: string;
		countLabel?: string;
		format?: (value: number) => string;
		/** A class for the root. */
		class?: string;
	};
</script>

<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import { cn } from '#lib/utils.js';

	let {
		title,
		rows,
		fromLabel = 'From',
		toLabel = 'To',
		countLabel = 'Count',
		format = (v: number) => v.toLocaleString('en'),
		class: className,
		ref = $bindable(null),
		...rest
	}: FlowTableProps = $props();

	const sorted = $derived([...rows].sort((a, b) => b.count - a.count));
</script>

<div bind:this={ref} data-slot="flow-table" class={cn('w-full min-w-0', className)} {...rest}>
<Table.Root data-flow-table>
	<Table.Caption class="text-left">{title}</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head scope="col">{fromLabel}</Table.Head>
			<Table.Head scope="col">{toLabel}</Table.Head>
			<Table.Head scope="col" class="text-right" aria-sort="descending">{countLabel}</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each sorted as row (`${row.from}|${row.to}`)}
			<Table.Row>
				<Table.Cell>{row.from}</Table.Cell>
				<Table.Cell>{row.to}</Table.Cell>
				<Table.Cell class="text-right tabular-nums">{format(row.count)}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
</div>
