<script lang="ts">
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
</script>

<section id="showcase-collapsible" data-showcase="collapsible" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">collapsible</h2>
	<div class="flex flex-wrap gap-8">
		{#each [true, false] as open (open)}
			<Collapsible.Root {open} class="flex w-72 flex-col gap-2">
				<div class="flex items-center justify-between gap-4">
					<h3 class="text-sm font-semibold">{open ? 'Open' : 'Closed'}</h3>
					<Collapsible.Trigger class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
						<ChevronsUpDownIcon /><span class="sr-only">Toggle</span>
					</Collapsible.Trigger>
				</div>
				<div class="rounded-md border border-border px-3 py-2 text-sm">Always shown</div>
				<Collapsible.Content class="flex flex-col gap-2">
					<div class="rounded-md border border-border px-3 py-2 text-sm">Shown when open</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}
	</div>
</section>
