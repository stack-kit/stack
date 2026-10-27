<script lang="ts">
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { Label } from '#lib/components/ui/label/index.js';

	const sizes = ['sm', 'default'] as const;
	const states = [
		{ id: 'off', checked: false, disabled: false, invalid: false },
		{ id: 'on', checked: true, disabled: false, invalid: false },
		{ id: 'off-disabled', checked: false, disabled: true, invalid: false },
		{ id: 'on-disabled', checked: true, disabled: true, invalid: false },
		{ id: 'invalid', checked: false, disabled: false, invalid: true }
	];
</script>

<section id="showcase-switch" data-showcase="switch" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">switch</h2>
	{#each sizes as size (size)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">size {size}</h3>
			<div class="flex flex-wrap gap-6">
				{#each states as s (s.id)}
					<div class="flex items-center gap-2">
						<Switch
							id="switch-{size}-{s.id}"
							{size}
							checked={s.checked}
							disabled={s.disabled}
							aria-invalid={s.invalid || undefined}
						/>
						<Label for="switch-{size}-{s.id}">{s.id}</Label>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</section>
