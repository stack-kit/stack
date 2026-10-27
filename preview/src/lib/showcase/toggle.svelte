<script lang="ts">
	import { Toggle } from '#lib/components/ui/toggle/index.js';
	import BoldIcon from '@lucide/svelte/icons/bold';
	import ItalicIcon from '@lucide/svelte/icons/italic';

	const variants = ['default', 'outline'] as const;
	const sizes = ['sm', 'default', 'lg'] as const;
</script>

<section id="showcase-toggle" data-showcase="toggle" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">toggle</h2>
	{#each variants as variant (variant)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">{variant}</h3>
			<div class="flex flex-wrap items-center gap-2">
				{#each sizes as size (size)}
					<Toggle {variant} {size} aria-label="Bold, {size}"><BoldIcon /></Toggle>
					<Toggle {variant} {size} pressed aria-label="Italic, {size}, on"><ItalicIcon /></Toggle>
					<Toggle {variant} {size}><BoldIcon data-icon="inline-start" />Text {size}</Toggle>
				{/each}
				<Toggle {variant} disabled aria-label="Bold, disabled"><BoldIcon /></Toggle>
				<Toggle {variant} aria-invalid="true" aria-label="Bold, invalid"><BoldIcon /></Toggle>
			</div>
		</div>
	{/each}
</section>
