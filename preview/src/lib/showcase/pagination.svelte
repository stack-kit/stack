<script lang="ts">
	import * as Pagination from '#lib/components/ui/pagination/index.js';

	// The first page shows a disabled Previous, a middle page shows both ellipses.
	const pages = [1, 5];
</script>

<section id="showcase-pagination" data-showcase="pagination" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">pagination</h2>
	{#each pages as start (start)}
		<h3 class="text-xs font-medium text-muted-foreground">page {start} of 10</h3>
		<Pagination.Root count={100} perPage={10} page={start}>
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item><Pagination.Previous /></Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === 'ellipsis'}
							<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link {page} isActive={currentPage === page.value}>{page.value}</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item><Pagination.Next /></Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	{/each}
</section>
