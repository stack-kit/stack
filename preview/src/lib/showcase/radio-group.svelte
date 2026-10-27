<script lang="ts">
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';

	const groups = [
		{ id: 'default', disabled: false, invalid: false },
		{ id: 'disabled', disabled: true, invalid: false },
		{ id: 'invalid', disabled: false, invalid: true }
	];
	// A color picker: one disc for each tag role. Each class is written out, so that Tailwind finds
	// it, and each one replaces a class of the item with the same variant.
	const discs = [
		{ value: 'grey', name: 'Grey', fill: 'bg-tag-grey data-checked:bg-tag-grey dark:bg-tag-grey dark:data-checked:bg-tag-grey' },
		{ value: 'blue', name: 'Blue', fill: 'bg-tag-blue data-checked:bg-tag-blue dark:bg-tag-blue dark:data-checked:bg-tag-blue' },
		{ value: 'violet', name: 'Violet', fill: 'bg-tag-violet data-checked:bg-tag-violet dark:bg-tag-violet dark:data-checked:bg-tag-violet' },
		{ value: 'pink', name: 'Pink', fill: 'bg-tag-pink data-checked:bg-tag-pink dark:bg-tag-pink dark:data-checked:bg-tag-pink' },
		{ value: 'red', name: 'Red', fill: 'bg-tag-red data-checked:bg-tag-red dark:bg-tag-red dark:data-checked:bg-tag-red' },
		{ value: 'orange', name: 'Orange', fill: 'bg-tag-orange data-checked:bg-tag-orange dark:bg-tag-orange dark:data-checked:bg-tag-orange' },
		{ value: 'yellow', name: 'Yellow', fill: 'bg-tag-yellow data-checked:bg-tag-yellow dark:bg-tag-yellow dark:data-checked:bg-tag-yellow' },
		{ value: 'green', name: 'Green', fill: 'bg-tag-green data-checked:bg-tag-green dark:bg-tag-green dark:data-checked:bg-tag-green' }
	];
	let color = $state('blue');
</script>

<section id="showcase-radio-group" data-showcase="radio-group" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">radio-group</h2>
	<div class="flex flex-wrap gap-10">
		{#each groups as g (g.id)}
			<div class="flex flex-col gap-2">
				<h3 class="text-xs font-medium text-muted-foreground">{g.id}</h3>
				<RadioGroup.Root value="comfortable" disabled={g.disabled} aria-label="Density, {g.id}">
					{#each ['compact', 'comfortable', 'spacious'] as value (value)}
						<div class="flex items-center gap-2">
							<RadioGroup.Item {value} id="radio-{g.id}-{value}" aria-invalid={g.invalid || undefined} disabled={value === 'spacious' || undefined} />
							<Label for="radio-{g.id}-{value}">{value}</Label>
						</div>
					{/each}
				</RadioGroup.Root>
			</div>
		{/each}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">horizontal</h3>
			<RadioGroup.Root value="b" orientation="horizontal" class="flex" aria-label="Horizontal group">
				{#each ['a', 'b', 'c'] as value (value)}
					<div class="flex items-center gap-2">
						<RadioGroup.Item {value} id="radio-h-{value}" />
						<Label for="radio-h-{value}">{value}</Label>
					</div>
				{/each}
			</RadioGroup.Root>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">color picker</h3>
			<RadioGroup.Root bind:value={color} orientation="horizontal" class="flex gap-2 max-md:gap-7" aria-label="Color">
				{#each discs as d (d.value)}
					<div class="relative flex">
						<RadioGroup.Item value={d.value} aria-label={d.name} class="{d.fill} border-0 focus-visible:inset-ring focus-visible:inset-ring-ring after:-inset-1 max-md:after:-inset-3.5 *:data-[slot=radio-group-indicator]:hidden" />
						{#if color === d.value}<CheckIcon class="pointer-events-none absolute inset-0.5 size-3 text-background" aria-hidden="true" />{/if}
					</div>
				{/each}
			</RadioGroup.Root>
		</div>
	</div>
</section>
