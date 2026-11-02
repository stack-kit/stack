<script lang="ts">
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';

	const sides = ['top', 'right', 'bottom', 'left'] as const;
	let open = $state(forcedOpen('tooltip'));
</script>

<section id="showcase-tooltip" data-showcase="tooltip" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">tooltip</h2>
	<Tooltip.Provider>
		<div class="flex flex-wrap gap-3">
			<Tooltip.Root bind:open>
				<Tooltip.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="tooltip">With a shortcut</Tooltip.Trigger>
				<Tooltip.Content>Save the draft <Kbd>⌘S</Kbd></Tooltip.Content>
			</Tooltip.Root>
			{#each sides as side (side)}
				<Tooltip.Root>
					<Tooltip.Trigger class={buttonVariants({ variant: 'outline' })}>Side {side}</Tooltip.Trigger>
					<Tooltip.Content {side}>A tooltip on the {side}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</div>
	</Tooltip.Provider>
</section>
