<script lang="ts">
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
</script>

<section id="showcase-spinner" data-showcase="spinner" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">spinner</h2>
	<div class="flex flex-wrap items-center gap-6">
		<Spinner class="size-3" />
		<Spinner />
		<Spinner class="size-6" />
		<Spinner class="size-8 text-muted-foreground" />
		<Button disabled><Spinner data-icon="inline-start" />Loading</Button>
		<Button variant="outline" disabled><Spinner data-icon="inline-start" />Loading</Button>
	</div>
</section>
