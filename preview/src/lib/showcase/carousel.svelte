<script lang="ts">
	import * as Carousel from '#lib/components/ui/carousel/index.js';

	const slides = [1, 2, 3, 4, 5];
</script>

<section id="showcase-carousel" data-showcase="carousel" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">carousel</h2>
	<div class="flex flex-wrap gap-16 px-12">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">horizontal</h3>
			<Carousel.Root class="w-56">
				<Carousel.Content>
					{#each slides as n (n)}
						<Carousel.Item>
							<div class="flex aspect-square items-center justify-center rounded-lg border border-border text-3xl font-semibold">{n}</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">vertical</h3>
			<Carousel.Root orientation="vertical" opts={{ align: 'start' }} class="my-12 w-56">
				<Carousel.Content class="h-48">
					{#each slides as n (n)}
						<Carousel.Item class="basis-1/2">
							<div class="flex h-full items-center justify-center rounded-lg border border-border text-xl font-semibold">{n}</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
		</div>
	</div>
</section>
