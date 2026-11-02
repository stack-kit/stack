<script lang="ts">
	import * as HoverCard from '#lib/components/ui/hover-card/index.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';

	let open = $state(forcedOpen('hover-card'));
</script>

<section id="showcase-hover-card" data-showcase="hover-card" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">hover-card</h2>
	<HoverCard.Root bind:open>
		<HoverCard.Trigger href="#showcase-hover-card" class="w-fit text-sm underline underline-offset-4" data-open-id="hover-card">
			@ana
		</HoverCard.Trigger>
		<HoverCard.Content>
			<div class="flex gap-3">
				<Avatar.Root><Avatar.Fallback>AN</Avatar.Fallback></Avatar.Root>
				<div class="flex flex-col gap-1">
					<p class="text-sm font-semibold">Ana Novak</p>
					<p class="text-sm">Writes the release notes.</p>
					<p class="text-xs text-muted-foreground">Joined in March 2026</p>
				</div>
			</div>
		</HoverCard.Content>
	</HoverCard.Root>
</section>
