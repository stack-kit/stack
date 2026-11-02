<script lang="ts">
	import { Button, type ButtonVariant } from '#lib/components/ui/button/index.js';
	import ReasonButton from '#lib/stack/ReasonButton.svelte';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import PlusIcon from '@lucide/svelte/icons/plus';

	const variants: ButtonVariant[] = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'];
	const sizes = ['xs', 'sm', 'default', 'lg'] as const;
	const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;

	// A disabled action with a reason is a ReasonButton: it stays in the tab order with aria-disabled,
	// and it stops its click, so a submit button does not submit. The second Accept has no reason, so it
	// is a plain button with no tooltip.
	const accepts = $state([
		{ id: 'showcase-button-reasoned', reason: 'Refresh the stale proposal first.', runs: 0 },
		{ id: 'showcase-button-free', reason: '', runs: 0 }
	]);
	let submits = $state(0);
</script>

<section id="showcase-button" data-showcase="button" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">button</h2>
	<div class="flex flex-wrap items-center gap-2">
		<Button id="btn-primary">Primary</Button>
		<Button href="#showcase-button">As a link</Button>
		<Button><PlusIcon data-icon="inline-start" />Icon start</Button>
		<Button variant="outline">Icon end<ArrowRightIcon data-icon="inline-end" /></Button>
	</div>
	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-medium text-muted-foreground">disabled with a reason, the same button with no reason, and disabled with no reason</h3>
		<div class="flex flex-wrap items-start gap-2">
			<!-- One form holds both Accept buttons, so that a probe can check that a blocked submit button stops the form. -->
			<form
				id="showcase-button-form"
				class="flex flex-wrap items-start gap-2"
				data-submits={submits}
				onsubmit={(e) => {
					e.preventDefault();
					submits++;
				}}
			>
				<input aria-label="Note" id="showcase-button-note" class="h-8 rounded-md border border-input px-2 text-sm" />
				{#each accepts as a (a.id)}
					<!-- Below 768 px, or on a touch screen, a tap shows no tooltip, so the reason line shows. -->
					<ReasonButton id={a.id} type="submit" reason={a.reason || undefined} data-runs={a.runs} onclick={() => a.runs++}>Accept</ReasonButton>
				{/each}
			</form>
			<Button id="showcase-button-unchanged" disabled>Save</Button>
			<Button id="showcase-button-link-disabled" href="#showcase-button" disabled>Link, disabled</Button>
		</div>
	</div>
	{#each variants as variant (variant)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">{variant}</h3>
			<div class="flex flex-wrap items-center gap-2">
				{#each sizes as size (size)}
					<Button {variant} {size}>Size {size}</Button>
				{/each}
				{#each iconSizes as size (size)}
					<Button {variant} {size} aria-label="Add, {size}"><PlusIcon /></Button>
				{/each}
				<Button {variant} disabled>Disabled</Button>
				<Button {variant} aria-invalid="true">Invalid</Button>
				<Button {variant} aria-expanded="true" aria-haspopup="menu">Expanded</Button>
			</div>
		</div>
	{/each}
</section>
