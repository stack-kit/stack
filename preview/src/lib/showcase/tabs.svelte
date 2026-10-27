<script lang="ts">
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChartGanttIcon from '@lucide/svelte/icons/chart-gantt';
	import ListIcon from '@lucide/svelte/icons/list';
	import SquareKanbanIcon from '@lucide/svelte/icons/square-kanban';

	const variants = ['default', 'line'] as const;
	const orientations = ['horizontal', 'vertical'] as const;

	// Four view tabs show the icons only below lg (DESIGN.md, ### tabs). The label stays in the
	// accessible name, and the tooltip holds it only while the label is hidden. The query is in rem,
	// as --breakpoint-lg is, so that it follows the browser font size as the max-lg: class does.
	// The props of Tooltip.Trigger carry its own id and data-slot, and data-disabled while the
	// tooltip is disabled. The roving focus of the tab list skips [data-disabled], so the three
	// attributes after the spread give the tab back its own id, slot and keyboard focus.
	const VIEWS = [
		{ value: 'board', label: 'Board', icon: SquareKanbanIcon },
		{ value: 'list', label: 'List', icon: ListIcon },
		{ value: 'calendar', label: 'Calendar', icon: CalendarIcon },
		{ value: 'timeline', label: 'Timeline', icon: ChartGanttIcon }
	];
	const wide = new ScreenQuery('min-width: 64rem');
	let view = $state('board');
</script>

<section id="showcase-tabs" data-showcase="tabs" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">tabs</h2>
	<div class="grid gap-8 lg:grid-cols-2">
		{#each variants as variant (variant)}
			{#each orientations as orientation (orientation)}
				<div class="flex flex-col gap-2">
					<h3 class="text-xs font-medium text-muted-foreground">variant {variant}, {orientation}</h3>
					<Tabs.Root value="account" {orientation}>
						<Tabs.List {variant}>
							<Tabs.Trigger value="account">Account</Tabs.Trigger>
							<Tabs.Trigger value="password">Password</Tabs.Trigger>
							<Tabs.Trigger value="team" disabled>Team, disabled</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="account" class="text-sm">The account panel.</Tabs.Content>
						<Tabs.Content value="password" class="text-sm">The password panel.</Tabs.Content>
					</Tabs.Root>
				</div>
			{/each}
		{/each}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">four view tabs, the icons only below lg</h3>
			<Tooltip.Provider>
				<Tabs.Root bind:value={view}>
					<Tabs.List aria-label="View" data-showcase-four-views>
						{#each VIEWS as v (v.value)}
							<Tooltip.Root disabled={wide.current}>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<Tabs.Trigger
											{...props}
											id={undefined}
											data-slot="tabs-trigger"
											data-disabled={undefined}
											value={v.value}
											class="text-muted-foreground"
											><v.icon data-icon="inline-start" /><span class="max-lg:sr-only">{v.label}</span></Tabs.Trigger
										>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>{v.label}</Tooltip.Content>
							</Tooltip.Root>
						{/each}
					</Tabs.List>
					{#each VIEWS as v (v.value)}
						<Tabs.Content value={v.value} class="text-sm">The {v.label.toLowerCase()} view.</Tabs.Content>
					{/each}
				</Tabs.Root>
			</Tooltip.Provider>
		</div>
	</div>
</section>
