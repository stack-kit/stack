<script lang="ts">
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { forcedOpen } from '#lib/stack/view.svelte.js';

	let open = $state(forcedOpen('popover'));
</script>

<section id="showcase-popover" data-showcase="popover" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">popover</h2>
	<div class="flex flex-wrap gap-3">
		<Popover.Root bind:open>
			<Popover.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="popover">Dimensions</Popover.Trigger>
			<Popover.Content role="dialog" aria-labelledby="popover-dimensions-title">
				<Popover.Header>
					<Popover.Title id="popover-dimensions-title">Dimensions</Popover.Title>
					<Popover.Description>Set the size of the layer.</Popover.Description>
				</Popover.Header>
				<div class="grid grid-cols-3 items-center gap-2">
					<Label for="popover-width">Width</Label>
					<Input id="popover-width" value="100%" class="col-span-2" />
					<Label for="popover-height">Height</Label>
					<Input id="popover-height" value="25px" class="col-span-2" />
				</div>
			</Popover.Content>
		</Popover.Root>
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ variant: 'outline' })}>Align start</Popover.Trigger>
			<Popover.Content align="start" role="dialog" aria-label="Align start">Content aligned to the start of the trigger.</Popover.Content>
		</Popover.Root>
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ variant: 'outline' })}>Side right</Popover.Trigger>
			<Popover.Content side="right" role="dialog" aria-label="Side right">Content on the right side.</Popover.Content>
		</Popover.Root>
	</div>
</section>
