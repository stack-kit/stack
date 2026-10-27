<script lang="ts">
	import { Textarea } from '#lib/components/ui/textarea/index.js';
</script>

<section id="showcase-textarea" data-showcase="textarea" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">textarea</h2>
	<div class="grid max-w-3xl gap-3 sm:grid-cols-2">
		<Textarea placeholder="Placeholder" aria-label="Empty textarea" />
		<Textarea value="A value that runs over two lines, so that the line height shows." aria-label="Textarea with a value" />
		<Textarea value="Disabled" disabled aria-label="Disabled textarea" />
		<Textarea value="Invalid" aria-invalid="true" aria-label="Invalid textarea" />
	</div>
</section>
