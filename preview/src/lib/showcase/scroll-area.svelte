<script lang="ts">
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';

	const tags = Array.from({ length: 40 }, (_, i) => `Tag ${i + 1}`);
</script>

<section id="showcase-scroll-area" data-showcase="scroll-area" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">scroll-area</h2>
	<div class="flex flex-wrap gap-6">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">vertical</h3>
			<ScrollArea class="h-56 w-48 rounded-md border border-border">
				<div class="p-3 text-sm">
					{#each tags as tag (tag)}<div class="border-b border-border py-1.5">{tag}</div>{/each}
				</div>
			</ScrollArea>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">horizontal</h3>
			<ScrollArea orientation="horizontal" class="w-80 rounded-md border border-border whitespace-nowrap">
				<div class="flex gap-3 p-3">
					{#each tags.slice(0, 12) as tag (tag)}<div class="h-20 w-28 shrink-0 rounded-md bg-muted p-2 text-sm">{tag}</div>{/each}
				</div>
			</ScrollArea>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">both</h3>
			<ScrollArea orientation="both" class="h-56 w-64 rounded-md border border-border">
				<div class="w-[32rem] p-3 text-sm">
					{#each tags as tag (tag)}<div class="py-1.5">{tag}, a long line that runs past the right edge of the area</div>{/each}
				</div>
			</ScrollArea>
		</div>
	</div>
</section>
