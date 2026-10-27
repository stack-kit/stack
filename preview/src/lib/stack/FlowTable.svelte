<!--
	A flow: the transitions from one page or state to the next, as a table of from, to and count
	(DESIGN.md, `### Flow`). It is no Sankey diagram. The rows are sorted by the count, largest first,
	and the count column says so with aria-sort. The table takes the look of `### table`, and its
	caption names it.
-->
<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';

	type Transition = { from: string; to: string; count: number };

	let {
		title,
		rows,
		fromLabel = 'From',
		toLabel = 'To',
		countLabel = 'Count',
		format = (v: number) => v.toLocaleString('en')
	}: {
		/** The name of the flow: the caption of the table. */
		title: string;
		rows: Transition[];
		fromLabel?: string;
		toLabel?: string;
		countLabel?: string;
		format?: (value: number) => string;
	} = $props();

	const sorted = $derived([...rows].sort((a, b) => b.count - a.count));
</script>

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
