<script lang="ts">
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import HomeIcon from '@lucide/svelte/icons/house';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import MoreHorizontalIcon from '@lucide/svelte/icons/ellipsis';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { Kbd } from '#lib/components/ui/kbd/index.js';

	// Each frame has a transform, so the fixed desktop sidebar is placed in the frame and not
	// in the window. Below 768 px the sidebar is a sheet, as in a product.
	const frames = [
		{ variant: 'sidebar', collapsible: 'offcanvas', side: 'left', open: true },
		{ variant: 'floating', collapsible: 'offcanvas', side: 'left', open: true },
		{ variant: 'inset', collapsible: 'offcanvas', side: 'left', open: true },
		{ variant: 'sidebar', collapsible: 'icon', side: 'left', open: false },
		{ variant: 'sidebar', collapsible: 'offcanvas', side: 'right', open: true }
	] as const;
</script>

<!-- The head of the app shell in an app with one workspace: no switcher, but the mark and the
     name of the product, 48 px high, as a link to the first page. The mark is one color, the
     sidebar text through currentColor, and it never moves. Nova sets every SVG in a menu button
     to 16 px, so the mark takes size-8!. -->
{#snippet productHead()}
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" tooltipContent="Product">
					{#snippet child({ props })}
						<a href="#showcase-sidebar" {...props} data-product-head>
							<svg viewBox="0 0 32 32" fill="currentColor" class="size-8! shrink-0" aria-hidden="true">
								<path fill-rule="evenodd" d="M6 4h12a10 10 0 0 1 0 20h-4v4H6zm8 6v8h4a4 4 0 0 0 0-8z" />
							</svg>
							<span class="truncate font-semibold">Product</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent="Search ⌘K"><SearchIcon /><span>Search</span></Sidebar.MenuButton>
				<Sidebar.MenuBadge class="max-md:top-3!"><Kbd>⌘K</Kbd></Sidebar.MenuBadge>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent="New invoice C"><PlusIcon /><span>New invoice</span></Sidebar.MenuButton>
				<Sidebar.MenuBadge class="max-md:top-3!"><Kbd>C</Kbd></Sidebar.MenuBadge>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive tooltipContent="Home"><HomeIcon /><span>Home</span></Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent="Inbox"><InboxIcon /><span>Inbox</span></Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>
{/snippet}

{#snippet body()}
	<Sidebar.Header><Sidebar.Input placeholder="Search" aria-label="Search" /></Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
			<Sidebar.GroupAction title="Add a project"><PlusIcon /><span class="sr-only">Add a project</span></Sidebar.GroupAction>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive tooltipContent="Home"><HomeIcon /><span>Home, active</span></Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton tooltipContent="Inbox"><InboxIcon /><span>Inbox, with a badge</span></Sidebar.MenuButton>
						<Sidebar.MenuBadge class="text-muted-foreground">24</Sidebar.MenuBadge>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton variant="outline" tooltipContent="Outline"><FolderIcon /><span>Variant outline</span></Sidebar.MenuButton>
						<Sidebar.MenuAction><MoreHorizontalIcon /><span class="sr-only">More</span></Sidebar.MenuAction>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton size="sm" tooltipContent="Small"><FolderIcon /><span>Size sm</span></Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton size="lg" tooltipContent="Large"><FolderIcon /><span>Size lg</span></Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton aria-disabled="true" tooltipContent="Disabled"><FolderIcon /><span>Disabled</span></Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton tooltipContent="Projects"><FolderIcon /><span>Projects</span></Sidebar.MenuButton>
						<Sidebar.MenuSub>
							<Sidebar.MenuSubItem>
								<Sidebar.MenuSubButton href="#showcase-sidebar" isActive>Sub item, active</Sidebar.MenuSubButton>
							</Sidebar.MenuSubItem>
							<Sidebar.MenuSubItem>
								<Sidebar.MenuSubButton href="#showcase-sidebar" size="sm">Sub item, size sm</Sidebar.MenuSubButton>
							</Sidebar.MenuSubItem>
						</Sidebar.MenuSub>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem><Sidebar.MenuSkeleton showIcon /></Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Separator />
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent="Settings"><SettingsIcon /><span>Settings</span></Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
{/snippet}

<section id="showcase-sidebar" data-showcase="sidebar" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">sidebar</h2>
	{#each frames as f, i (i)}
		<h3 class="text-xs font-medium text-muted-foreground">
			variant {f.variant}, collapsible {f.collapsible}, side {f.side}, {f.open ? 'open' : 'collapsed'}
		</h3>
		<div class="relative h-[30rem] overflow-hidden rounded-lg border border-border [transform:translateZ(0)]">
			<Sidebar.Provider open={f.open} class="h-full min-h-0">
				<Sidebar.Root variant={f.variant} collapsible={f.collapsible} side={f.side}>
					{@render body()}
					<Sidebar.Rail />
				</Sidebar.Root>
				<Sidebar.Inset>
					<header class="flex h-12 items-center gap-2 border-b border-border px-3">
						<Sidebar.Trigger />
						<span class="text-sm">The main area</span>
					</header>
				</Sidebar.Inset>
			</Sidebar.Provider>
		</div>
	{/each}
	{#each [true, false] as open (open)}
		<h3 class="text-xs font-medium text-muted-foreground">the head of an app with one workspace, {open ? 'open' : 'collapsed'}</h3>
		<div class="relative h-[30rem] overflow-hidden rounded-lg border border-border [transform:translateZ(0)]" data-product-frame={open ? 'open' : 'collapsed'}>
			<Sidebar.Provider {open} class="h-full min-h-0" style="--sidebar-width: 15rem; --sidebar-width-icon: 3.5rem">
				<Sidebar.Root collapsible="icon" class="group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:bg-sidebar">
					<nav aria-label="Main" class="flex min-h-0 flex-1 flex-col">{@render productHead()}</nav>
				</Sidebar.Root>
				<Sidebar.Inset>
					<header class="flex h-12 items-center gap-2 border-b border-border px-3">
						<Sidebar.Trigger />
						<span class="text-sm">The main area</span>
					</header>
				</Sidebar.Inset>
			</Sidebar.Provider>
		</div>
	{/each}
	<h3 class="text-xs font-medium text-muted-foreground">collapsible none, in the flow at every width</h3>
	<div class="h-[30rem] overflow-hidden rounded-lg border border-border">
		<Sidebar.Provider class="h-full min-h-0">
			<Sidebar.Root collapsible="none">{@render body()}</Sidebar.Root>
		</Sidebar.Provider>
	</div>
</section>
