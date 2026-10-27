<script lang="ts">
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { forcedOpen } from '#lib/stack/view.svelte.js';

	const sides = ['top', 'right', 'bottom', 'left'] as const;
	let open = $state(Object.fromEntries(sides.map((s) => [s, forcedOpen(`sheet-${s}`)])));
</script>

<section id="showcase-sheet" data-showcase="sheet" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">sheet</h2>
	<div class="flex flex-wrap gap-3">
		{#each sides as side (side)}
			<Sheet.Root bind:open={open[side]}>
				<Sheet.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="sheet-{side}">Side {side}</Sheet.Trigger>
				<Sheet.Content {side}>
					<Sheet.Header>
						<Sheet.Title>Edit the profile</Sheet.Title>
						<Sheet.Description>A sheet on the {side} side.</Sheet.Description>
					</Sheet.Header>
					<div class="flex flex-col gap-2 px-4">
						<Label for="sheet-name-{side}">Name</Label>
						<Input id="sheet-name-{side}" value="Ana" />
					</div>
					<Sheet.Footer>
						<Button>Save</Button>
						<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Close</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		{/each}
	</div>
</section>
