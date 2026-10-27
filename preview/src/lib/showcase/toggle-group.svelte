<script lang="ts">
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import AlignCenterIcon from '@lucide/svelte/icons/align-center';
	import AlignLeftIcon from '@lucide/svelte/icons/align-left';
	import AlignRightIcon from '@lucide/svelte/icons/align-right';

	const variants = ['default', 'outline'] as const;
	const sizes = ['sm', 'default', 'lg'] as const;
</script>

{#snippet items()}
	<ToggleGroup.Item value="left" aria-label="Align left"><AlignLeftIcon /></ToggleGroup.Item>
	<ToggleGroup.Item value="center" aria-label="Align center"><AlignCenterIcon /></ToggleGroup.Item>
	<ToggleGroup.Item value="right" aria-label="Align right" disabled><AlignRightIcon /></ToggleGroup.Item>
{/snippet}

<section id="showcase-toggle-group" data-showcase="toggle-group" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">toggle-group</h2>
	{#each variants as variant (variant)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">{variant}</h3>
			<div class="flex flex-wrap items-center gap-4">
				{#each sizes as size (size)}
					<ToggleGroup.Root type="single" value="center" {variant} {size}>{@render items()}</ToggleGroup.Root>
				{/each}
				<ToggleGroup.Root type="multiple" value={['left', 'center']} {variant} spacing={1}>
					{@render items()}
				</ToggleGroup.Root>
				<ToggleGroup.Root type="single" value="left" {variant} orientation="vertical">
					{@render items()}
				</ToggleGroup.Root>
				<ToggleGroup.Root type="single" {variant} disabled>{@render items()}</ToggleGroup.Root>
			</div>
		</div>
	{/each}
</section>
