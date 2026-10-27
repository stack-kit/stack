<script lang="ts">
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { MENU_GROUPS, MENU_NAMES } from './component-menu.js';

	// The side menu of the component page: one link per showcase, to the section that each
	// showcase file marks with the id showcase-<name>. From 768 px the nova sidebar holds the
	// menu under the top bar of the layout, and the menu scrolls on its own. Below 768 px the
	// sidebar is a sheet, and the menu button of the top bar opens it.
	const sidebar = Sidebar.useSidebar();
	let current = $state(MENU_NAMES[0]);
	let content = $state<HTMLElement | null>(null);

	// A jump from the menu stops a section at its scroll margin, under the top bar. So the current
	// showcase is the one whose top is closest above that line.
	function findCurrent(): string {
		let found = MENU_NAMES[0];
		let foundTop = -Infinity;
		let line: number | undefined;
		for (const name of MENU_NAMES) {
			const section = document.getElementById(`showcase-${name}`);
			if (!section) continue;
			line ??= parseFloat(getComputedStyle(section).scrollMarginTop) + 1;
			const top = section.getBoundingClientRect().top;
			if (top <= line && top > foundTop) {
				found = name;
				foundTop = top;
			}
		}
		return found;
	}

	$effect(() => {
		let frame = 0;
		const update = () => {
			frame = 0;
			current = findCurrent();
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		addEventListener('scroll', schedule, { passive: true });
		addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(frame);
			removeEventListener('scroll', schedule);
			removeEventListener('resize', schedule);
		};
	});

	// Keep the current link in view inside the menu. The menu scrolls only its own box, never the
	// window, so the page does not move under the reader. The sheet lays out its content one frame
	// after it mounts, so the menu measures in the next frame.
	$effect(() => {
		const box = content;
		const href = `#showcase-${current}`;
		if (!box) return;
		const frame = requestAnimationFrame(() => {
			const link = box.querySelector(`a[href="${href}"]`);
			if (!link) return;
			const outer = box.getBoundingClientRect();
			const row = link.getBoundingClientRect();
			if (row.top < outer.top) box.scrollTop -= outer.top - row.top;
			else if (row.bottom > outer.bottom) box.scrollTop += row.bottom - outer.bottom;
		});
		return () => cancelAnimationFrame(frame);
	});

	function jumped() {
		if (sidebar.isMobile) sidebar.setOpenMobile(false);
	}
</script>

<Sidebar.Root class="print:hidden md:top-(--top-bar-height) md:h-auto">
	<nav aria-label="Components" class="menu-insets flex min-h-0 flex-1 flex-col">
		<Sidebar.Content bind:ref={content}>
			{#each MENU_GROUPS as group (group.label)}
				<Sidebar.Group>
					<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each group.names as name (name)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={name === current}>
										{#snippet child({ props })}
											<a
												{...props}
												href="#showcase-{name}"
												aria-current={name === current ? 'location' : undefined}
												onclick={jumped}>{name}</a
											>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			{/each}
		</Sidebar.Content>
	</nav>
</Sidebar.Root>

<style>
	/* The menu touches the left and the bottom edge of the screen. Below 768 px its sheet touches
	   the top edge too, and from 768 px the top bar above it holds the top inset. No Tailwind
	   class writes env(), so the insets are written here. With no inset, nothing moves. */
	.menu-insets {
		padding-bottom: env(safe-area-inset-bottom);
		padding-left: env(safe-area-inset-left);
	}
	@media (max-width: 767px) {
		.menu-insets {
			padding-top: env(safe-area-inset-top);
		}
	}
</style>
