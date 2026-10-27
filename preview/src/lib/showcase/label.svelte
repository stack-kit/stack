<script lang="ts">
	import { Label } from '#lib/components/ui/label/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
</script>

<section id="showcase-label" data-showcase="label" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">label</h2>
	<div class="flex max-w-sm flex-col gap-2">
		<Label for="label-name">Name</Label>
		<Input id="label-name" placeholder="Ana" />
	</div>
	<div class="flex items-center gap-2">
		<Checkbox id="label-terms" />
		<Label for="label-terms">Accept the terms</Label>
	</div>
	<div class="flex items-center gap-2">
		<Checkbox id="label-disabled" disabled />
		<Label for="label-disabled">Disabled peer</Label>
	</div>
	<div class="group flex items-center gap-2" data-disabled="true">
		<Label>Inside a disabled group</Label>
	</div>
</section>
