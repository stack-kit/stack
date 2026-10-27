<script lang="ts">
	import { AspectRatio } from '#lib/components/ui/aspect-ratio/index.js';

	const ratios = [
		['16 / 9', 16 / 9],
		['4 / 3', 4 / 3],
		['1 / 1', 1]
	] as const;
</script>

<section id="showcase-aspect-ratio" data-showcase="aspect-ratio" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">aspect-ratio</h2>
	<div class="grid max-w-3xl grid-cols-3 gap-4">
		{#each ratios as [label, ratio] (label)}
			<AspectRatio {ratio} class="rounded-lg bg-muted">
				<div class="flex size-full items-center justify-center text-sm text-muted-foreground">{label}</div>
			</AspectRatio>
		{/each}
	</div>
</section>
