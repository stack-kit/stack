<script lang="ts">
	import * as NavigationMenu from '#lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '#lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import { forcedOpen } from '#lib/stack/view.svelte.js';
	import { onMount } from 'svelte';

	// The menu ignores a value that is set before its items register, so the forced value
	// waits one frame after the mount.
	let value = $state('');
	onMount(() => {
		if (forcedOpen('navigation-menu')) requestAnimationFrame(() => (value = 'start'));
	});
	const links = [
		['Introduction', 'What the library is, and what it is not.'],
		['Installation', 'How to add it to a project.'],
		['Typography', 'Headings, paragraphs and lists.']
	];
</script>

<section id="showcase-navigation-menu" data-showcase="navigation-menu" class="flex flex-col gap-4 border-t border-border py-8 pb-64">
	<h2 class="font-mono text-sm font-semibold">navigation-menu</h2>
	<NavigationMenu.Root {value} onValueChange={(v) => (value = v)}>
		<NavigationMenu.List>
			<NavigationMenu.Item value="start">
				<NavigationMenu.Trigger data-open-id="navigation-menu">Getting started</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="grid w-96 gap-1">
						{#each links as [title, text] (title)}
							<li>
								<NavigationMenu.Link href="#showcase-navigation-menu">
									<div class="flex flex-col gap-1">
										<span class="font-medium">{title}</span>
										<span class="text-muted-foreground">{text}</span>
									</div>
								</NavigationMenu.Link>
							</li>
						{/each}
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item>
			<NavigationMenu.Item value="components">
				<NavigationMenu.Trigger>Components</NavigationMenu.Trigger>
				<NavigationMenu.Content>
					<ul class="grid w-72 gap-1">
						<li><NavigationMenu.Link href="#showcase-navigation-menu">Alert dialog</NavigationMenu.Link></li>
						<li><NavigationMenu.Link href="#showcase-navigation-menu">Hover card</NavigationMenu.Link></li>
					</ul>
				</NavigationMenu.Content>
			</NavigationMenu.Item>
			<NavigationMenu.Item>
				<NavigationMenu.Link href="#showcase-navigation-menu" class={navigationMenuTriggerStyle()}>Docs</NavigationMenu.Link>
			</NavigationMenu.Item>
		</NavigationMenu.List>
	</NavigationMenu.Root>
</section>
