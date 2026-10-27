<script lang="ts">
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';

	const sizes = ['sm', 'default'] as const;
</script>

{#snippet options()}
	<NativeSelect.Option value="">Choose a fruit</NativeSelect.Option>
	<NativeSelect.OptGroup label="Common">
		<NativeSelect.Option value="apple">Apple</NativeSelect.Option>
		<NativeSelect.Option value="pear">Pear</NativeSelect.Option>
	</NativeSelect.OptGroup>
	<NativeSelect.Option value="quince" disabled>Quince</NativeSelect.Option>
{/snippet}

<section id="showcase-native-select" data-showcase="native-select" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">native-select</h2>
	{#each sizes as size (size)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">size {size}</h3>
			<div class="flex flex-wrap items-center gap-3">
				<NativeSelect.Root {size} aria-label="Fruit, {size}">{@render options()}</NativeSelect.Root>
				<NativeSelect.Root {size} value="apple" aria-label="Fruit, {size}, chosen">{@render options()}</NativeSelect.Root>
				<NativeSelect.Root {size} value="apple" disabled aria-label="Fruit, {size}, disabled">{@render options()}</NativeSelect.Root>
				<NativeSelect.Root {size} aria-invalid="true" aria-label="Fruit, {size}, invalid">{@render options()}</NativeSelect.Root>
			</div>
		</div>
	{/each}
</section>
