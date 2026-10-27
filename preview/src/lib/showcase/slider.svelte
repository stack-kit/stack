<script lang="ts">
	import { Slider } from '#lib/components/ui/slider/index.js';
</script>

<section id="showcase-slider" data-showcase="slider" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">slider</h2>
	<div class="flex max-w-md flex-col gap-6">
		<Slider type="single" value={40} max={100} aria-label="Single value" />
		<Slider type="multiple" value={[20, 70]} max={100} aria-label="Range" />
		<Slider type="single" value={60} max={100} disabled aria-label="Disabled" />
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">vertical</h3>
	<div class="flex h-40 gap-8">
		<Slider type="single" value={30} max={100} orientation="vertical" aria-label="Vertical" />
		<Slider type="multiple" value={[25, 75]} max={100} orientation="vertical" aria-label="Vertical range" />
	</div>
</section>
