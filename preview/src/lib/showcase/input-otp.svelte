<script lang="ts">
	import * as InputOTP from '#lib/components/ui/input-otp/index.js';

	const states = [
		{ label: 'empty', value: '', disabled: false, invalid: false },
		{ label: 'partly filled', value: '7K4', disabled: false, invalid: false },
		{ label: 'invalid', value: '7K4QX2MD', disabled: false, invalid: true },
		{ label: 'disabled', value: '7K', disabled: true, invalid: false }
	];
</script>

<section id="showcase-input-otp" data-showcase="input-otp" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">input-otp</h2>
	{#each states as s (s.label)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">{s.label}</h3>
			<!-- The hidden input carries the value, so the groups and the separator, which show a copy of it, are aria-hidden. -->
			<InputOTP.Root maxlength={8} value={s.value} disabled={s.disabled} aria-invalid={s.invalid || undefined} aria-label="Code, {s.label}">
				{#snippet children({ cells })}
					<InputOTP.Group aria-hidden="true">
						{#each cells.slice(0, 4) as cell, i (i)}
							<InputOTP.Slot {cell} aria-invalid={s.invalid || undefined} />
						{/each}
					</InputOTP.Group>
					<InputOTP.Separator aria-hidden="true" />
					<InputOTP.Group aria-hidden="true">
						{#each cells.slice(4, 8) as cell, i (i)}
							<InputOTP.Slot {cell} aria-invalid={s.invalid || undefined} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
		</div>
	{/each}
</section>
