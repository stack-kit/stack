<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// The summary grid of the alert-dialog definition in DESIGN.md: a <dl> with a 112 px label
	// column in muted-foreground and rows of at least 28 px. A fact with "was" changed after the
	// email: it shows a warning icon, the value now, and the value of the email after it.
	export interface Fact {
		label: string;
		value: string;
		/** The value of the email, when the value changed after the email. */
		was?: string;
		/** An identifier: Inter 500 in foreground, with proportional figures. */
		id?: boolean;
	}

	let { facts }: { facts: Fact[] } = $props();
</script>

<dl class="flex flex-col text-sm">
	{#each facts as f (f.label)}
		<div class="flex min-h-7 gap-2 py-1">
			<dt class="w-28 shrink-0 text-muted-foreground">{f.label}</dt>
			{#if f.was}
				<dd class="flex min-w-0 items-start gap-1.5">
					<TriangleAlertIcon class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
					<span><span class="tabular-nums">{f.value}</span> <span class="text-muted-foreground">· <span class="tabular-nums">{f.was}</span> in the email</span></span>
				</dd>
			{:else}
				<dd class={['min-w-0', f.id ? 'font-medium' : 'tabular-nums']}>{f.value}</dd>
			{/if}
		</div>
	{/each}
</dl>
