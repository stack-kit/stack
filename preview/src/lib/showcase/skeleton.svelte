<script lang="ts">
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
</script>

<section id="showcase-skeleton" data-showcase="skeleton" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">skeleton</h2>
	<div class="flex items-center gap-4">
		<Skeleton class="size-10 rounded-full" />
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-56" />
			<Skeleton class="h-4 w-40" />
		</div>
	</div>
	<Skeleton class="h-32 w-full max-w-md rounded-xl" />
</section>
