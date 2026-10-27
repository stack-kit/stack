<script lang="ts">
	import { Separator } from '#lib/components/ui/separator/index.js';
</script>

<section id="showcase-separator" data-showcase="separator" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">separator</h2>
	<div class="max-w-sm">
		<p class="text-sm font-medium">Horizontal</p>
		<p class="text-sm text-muted-foreground">Above the line.</p>
		<Separator class="my-3" />
		<div class="flex h-5 items-center gap-3 text-sm">
			<span>Blog</span>
			<Separator orientation="vertical" />
			<span>Docs</span>
			<Separator orientation="vertical" />
			<span>Vertical</span>
		</div>
	</div>
</section>
