<script lang="ts">
	import * as Marker from '#lib/components/ui/marker/index.js';
	import ClockIcon from '@lucide/svelte/icons/clock';

	const variants = ['default', 'separator', 'border'] as const;
</script>

<section id="showcase-marker" data-showcase="marker" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">marker</h2>
	<div class="flex max-w-md flex-col gap-6">
		{#each variants as variant (variant)}
			<Marker.Root {variant}>
				<Marker.Icon><ClockIcon /></Marker.Icon>
				<Marker.Content>Variant {variant}, with an icon</Marker.Content>
			</Marker.Root>
			<Marker.Root {variant}>
				<Marker.Content>Variant {variant}, with <a href="#showcase-marker">a link</a></Marker.Content>
			</Marker.Root>
		{/each}
	</div>
</section>
