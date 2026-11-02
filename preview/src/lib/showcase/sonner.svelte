<script lang="ts">
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const kinds = [
		['message', () => toast('A plain message', { description: 'With a description.' })],
		['success', () => toast.success('Saved')],
		['info', () => toast.info('Two people are editing')],
		['warning', () => toast.warning('The link expires today')],
		['error', () => toast.error('The upload failed')],
		['loading', () => toast.loading('Uploading')],
		['action', () => toast('The file moved', { action: { label: 'Undo', onClick: () => {} } })]
	] as const;

	// With ?open=sonner every kind shows at once and stays for ten minutes, so that the probe
	// can measure it. Not Infinity: a browser timer runs an infinite delay at once.
	const forced = forcedOpen('sonner');
	onMount(() => {
		if (forced) for (const [, show] of kinds) show();
	});
</script>

<section id="showcase-sonner" data-showcase="sonner" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">sonner</h2>
	<Toaster expand={forced} duration={forced ? 600_000 : 4000} visibleToasts={kinds.length} />
	<div class="flex flex-wrap gap-2">
		{#each kinds as [kind, show], i (kind)}
			<Button variant="outline" onclick={show} data-open-id={i === 0 ? 'sonner' : undefined}>Show {kind}</Button>
		{/each}
	</div>
</section>
