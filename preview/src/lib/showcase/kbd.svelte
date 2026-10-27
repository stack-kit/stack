<script lang="ts">
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
</script>

<section id="showcase-kbd" data-showcase="kbd" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">kbd</h2>
	<div class="flex flex-wrap items-center gap-4 text-sm">
		<Kbd.Root>Esc</Kbd.Root>
		<Kbd.Root>⌘</Kbd.Root>
		<Kbd.Group><Kbd.Root>⌘</Kbd.Root><Kbd.Root>⇧</Kbd.Root><Kbd.Root>P</Kbd.Root></Kbd.Group>
		<span>Press <Kbd.Group><Kbd.Root>Ctrl</Kbd.Root><span>+</span><Kbd.Root>B</Kbd.Root></Kbd.Group> to toggle.</span>
		<Button variant="outline" size="sm">Save <Kbd.Root>⌘S</Kbd.Root></Button>
	</div>
</section>
