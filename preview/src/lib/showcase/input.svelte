<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
</script>

<section id="showcase-input" data-showcase="input" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">input</h2>
	<div class="grid max-w-3xl gap-3 sm:grid-cols-2">
		<Input placeholder="Placeholder" aria-label="Empty input" />
		<Input value="A value" aria-label="Input with a value" />
		<Input value="Disabled" disabled aria-label="Disabled input" />
		<Input value="Read only" readonly aria-label="Read-only input" />
		<Input value="Invalid" aria-invalid="true" aria-label="Invalid input" />
		<Input type="password" value="secret" aria-label="Password input" />
		<Input type="number" value="42" aria-label="Number input" />
		<Input type="file" aria-label="File input" />
	</div>
</section>
