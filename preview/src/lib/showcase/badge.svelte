<script lang="ts">
	import { Badge, type BadgeVariant } from '#lib/components/ui/badge/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import CheckIcon from '@lucide/svelte/icons/badge-check';

	const variants: BadgeVariant[] = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'];
	// One label for each tag role. Each class is written out, so that Tailwind finds it.
	const labels = [
		{ name: 'Grey', dot: 'bg-tag-grey' },
		{ name: 'Blue', dot: 'bg-tag-blue' },
		{ name: 'Violet', dot: 'bg-tag-violet' },
		{ name: 'Pink', dot: 'bg-tag-pink' },
		{ name: 'Red', dot: 'bg-tag-red' },
		{ name: 'Orange', dot: 'bg-tag-orange' },
		{ name: 'Yellow', dot: 'bg-tag-yellow' },
		{ name: 'Green', dot: 'bg-tag-green' }
	];
</script>

<section id="showcase-badge" data-showcase="badge" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">badge</h2>
	{#each variants as variant (variant)}
		<div class="flex flex-wrap items-center gap-2">
			<Badge {variant}>{variant}</Badge>
			<Badge {variant}><CheckIcon data-icon="inline-start" />With an icon</Badge>
			<Badge {variant} href="#showcase-badge">As a link</Badge>
			<Badge {variant} class="rounded-full">Rounded full</Badge>
			<Badge {variant} class="min-w-5 justify-center px-1 tabular-nums">8</Badge>
			<Badge {variant} aria-invalid="true">Invalid</Badge>
		</div>
	{/each}
	<div class="flex flex-wrap items-center gap-2">
		<Badge variant="secondary"><Spinner data-icon="inline-start" />Syncing</Badge>
	</div>
	<!-- A label badge: an outline badge with the 6 px dot of its label color before the name. -->
	<div class="flex flex-wrap items-center gap-2">
		{#each labels as l (l.name)}
			<Badge variant="outline"><span data-icon="inline-start" class="size-1.5 rounded-full {l.dot}" aria-hidden="true"></span>{l.name}</Badge>
		{/each}
	</div>
</section>
