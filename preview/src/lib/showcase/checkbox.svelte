<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import HeldCheckbox from '#lib/stack/HeldCheckbox.svelte';

	const states = [
		{ id: 'unchecked', checked: false, indeterminate: false, disabled: false, invalid: false },
		{ id: 'checked', checked: true, indeterminate: false, disabled: false, invalid: false },
		{ id: 'indeterminate', checked: false, indeterminate: true, disabled: false, invalid: false },
		{ id: 'disabled', checked: false, indeterminate: false, disabled: true, invalid: false },
		{ id: 'checked-disabled', checked: true, indeterminate: false, disabled: true, invalid: false },
		{ id: 'invalid', checked: false, indeterminate: false, disabled: false, invalid: true },
		{ id: 'checked-invalid', checked: true, indeterminate: false, disabled: false, invalid: true },
		{ id: 'readonly', checked: false, indeterminate: false, disabled: false, invalid: false, readonly: true },
		{ id: 'checked-readonly', checked: true, indeterminate: false, disabled: false, invalid: false, readonly: true }
	];
</script>

<section id="showcase-checkbox" data-showcase="checkbox" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">checkbox</h2>
	<div class="flex flex-wrap gap-6">
		{#each states as s (s.id)}
			<div class="flex items-center gap-2">
				{#if s.readonly}
					<!-- A box that a rule holds is a HeldCheckbox, with its reason. -->
					<HeldCheckbox id="checkbox-{s.id}" checked={s.checked} reason="Set by Sales. Change it in the Sales row." />
				{:else}
					<Checkbox
						id="checkbox-{s.id}"
						checked={s.checked}
						indeterminate={s.indeterminate}
						disabled={s.disabled}
						aria-invalid={s.invalid || undefined}
					/>
				{/if}
				<Label for="checkbox-{s.id}">{s.id}</Label>
			</div>
		{/each}
	</div>
</section>
