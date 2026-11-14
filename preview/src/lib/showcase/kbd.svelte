<script lang="ts">
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { matches, takePress } from '#lib/stack/behaviour/keys.js';

	// While the focus is in this example and not in the reply, R moves the focus into the reply. A held
	// R repeats its keydown, and takePress stops the repeats, so the reply types no letter.
	let scope: HTMLDivElement;
	let field = $state<HTMLTextAreaElement | null>(null);
	function onkeydown(e: KeyboardEvent) {
		if (e.defaultPrevented || !scope.contains(e.target as Node) || !matches(e, 'R')) return;
		e.preventDefault();
		takePress(e);
		field?.focus();
	}
</script>

<svelte:window {onkeydown} />

<section id="showcase-kbd" data-showcase="kbd" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">kbd</h2>
	<div class="flex flex-wrap items-center gap-4 text-sm">
		<Kbd.Root>Esc</Kbd.Root>
		<Kbd.Root>⌘</Kbd.Root>
		<Kbd.Group><Kbd.Root>⌘</Kbd.Root><Kbd.Root>⇧</Kbd.Root><Kbd.Root>P</Kbd.Root></Kbd.Group>
		<span>Press <Kbd.Group><Kbd.Root>Ctrl</Kbd.Root><span>+</span><Kbd.Root>B</Kbd.Root></Kbd.Group> to toggle.</span>
		<Button variant="outline" size="sm">Save <Kbd.Root>⌘S</Kbd.Root></Button>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">A key that moves the focus into a field takes the whole press</h3>
	<div bind:this={scope} class="flex max-w-xl flex-col items-start gap-2 text-sm">
		<Button variant="outline" size="sm" aria-keyshortcuts="R" onclick={() => field?.focus()}>Reply <Kbd.Root>R</Kbd.Root></Button>
		<Textarea bind:ref={field} aria-label="Reply to Ruth Fenwick" placeholder="Focus Reply, then hold R. The reply stays empty." />
	</div>
</section>
