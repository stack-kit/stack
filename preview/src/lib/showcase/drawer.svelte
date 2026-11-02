<script lang="ts">
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';

	const directions = ['bottom', 'top', 'right', 'left'] as const;
	let open = $state(Object.fromEntries(directions.map((d) => [d, forcedOpen(`drawer-${d}`)])));
</script>

<section id="showcase-drawer" data-showcase="drawer" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">drawer</h2>
	<div class="flex flex-wrap gap-3">
		{#each directions as direction (direction)}
			<Drawer.Root bind:open={open[direction]} {direction}>
				<Drawer.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="drawer-{direction}">
					Direction {direction}
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Move the goal</Drawer.Title>
						<Drawer.Description>A drawer from the {direction} edge.</Drawer.Description>
					</Drawer.Header>
					<p class="px-4 text-sm">The body of the drawer.</p>
					<Drawer.Footer>
						<Button>Submit</Button>
						<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Drawer.Close>
					</Drawer.Footer>
				</Drawer.Content>
			</Drawer.Root>
		{/each}
	</div>
</section>
