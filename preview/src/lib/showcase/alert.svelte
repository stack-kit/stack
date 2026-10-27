<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

	const variants = ['default', 'destructive'] as const;
</script>

<section id="showcase-alert" data-showcase="alert" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">alert</h2>
	<div class="grid max-w-4xl gap-4 lg:grid-cols-2">
		{#each variants as variant (variant)}
			<Alert.Root {variant}>
				{#if variant === 'default'}<CircleCheckIcon />{:else}<CircleAlertIcon />{/if}
				<Alert.Title>Variant {variant}, with an icon</Alert.Title>
				<Alert.Description>The description sits under the title and wraps at the width of the alert.</Alert.Description>
			</Alert.Root>
			<Alert.Root {variant}>
				<Alert.Title>Variant {variant}, with an action</Alert.Title>
				<Alert.Description>No icon.</Alert.Description>
				<Alert.Action><Button size="xs" variant="outline">Undo</Button></Alert.Action>
			</Alert.Root>
		{/each}
	</div>
</section>
