<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Banner, { type BannerRole } from '#lib/stack/Banner.svelte';

	const variants = ['default', 'destructive'] as const;
	const banners: { tint?: BannerRole; title: string; key: string; text: string }[] = [
		{ tint: 'warning', title: 'The bank sync stopped 2 hours ago.', key: 'New payments', text: 'do not show until it runs again.' },
		{ tint: 'destructive', title: 'The import failed.', key: 'No row', text: 'of the file came in.' },
		{ tint: 'success', title: 'The check passed.', key: 'Each row', text: 'of the file is valid.' },
		{ tint: 'info', title: 'A new version of the app is ready.', key: 'Reload the page', text: 'to take it.' },
		{ title: 'This is a copy of the workspace.', key: 'A change here', text: 'does not reach the workspace.' }
	];
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
	<h3 class="text-xs font-medium text-muted-foreground">banner: a feedback role, and neutral</h3>
	<div class="flex max-w-4xl flex-col">
		{#each banners as b (b.title)}
			<Banner tint={b.tint} title={b.title}>
				{#snippet icon()}
					{#if b.tint === 'success'}<CircleCheckIcon />{:else if b.tint === 'info' || !b.tint}<InfoIcon />{:else if b.tint === 'warning'}<TriangleAlertIcon />{:else}<CircleAlertIcon />{/if}
				{/snippet}
				<strong>{b.key}</strong> {b.text}
				{#snippet action()}<Button size="xs" variant="outline">Open</Button>{/snippet}
			</Banner>
		{/each}
	</div>
</section>
