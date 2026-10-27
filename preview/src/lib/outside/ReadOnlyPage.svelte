<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import OutsidePage from './OutsidePage.svelte';
	import { VISITS, count, percent } from './data.js';

	// A read-only link: content and no action. The text says who can see the page and until
	// when. Its other states, Expired and Not valid, are those of the link page.
	const title = `Visits in ${VISITS.month}`;
	/** A true minus sign (U+2212), as the table definition asks for a negative number. */
	const change = (n: number) => percent(n).replace('-', '−');
</script>

<OutsidePage {title}>
	<div class="flex flex-col gap-2">
		<h1 class="text-xl font-semibold">{title}</h1>
		<p class="text-sm text-muted-foreground">
			Anyone with this link can see this page until {VISITS.until}. It shows counts only, and no data of a person.
		</p>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Page</Table.Head>
				<Table.Head class="text-right">Visits</Table.Head>
				<Table.Head class="text-right">Change from September</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each VISITS.rows as r (r.page)}
				<Table.Row>
					<Table.Cell class="font-mono text-xs">{r.page}</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{count(r.visits)}</Table.Cell>
					<Table.Cell class={['text-right tabular-nums', r.change === 0 && 'text-muted-foreground']}>{change(r.change)}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</OutsidePage>
