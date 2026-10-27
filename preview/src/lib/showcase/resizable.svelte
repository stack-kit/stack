<script lang="ts">
	import * as Resizable from '#lib/components/ui/resizable/index.js';
</script>

<section id="showcase-resizable" data-showcase="resizable" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">resizable</h2>
	<div class="grid max-w-4xl gap-6 lg:grid-cols-2">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">horizontal, with a handle</h3>
			<Resizable.PaneGroup direction="horizontal" class="min-h-40 rounded-lg border border-border">
				<Resizable.Pane defaultSize={40}><div class="p-4 text-sm">One</div></Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane defaultSize={60}><div class="p-4 text-sm">Two</div></Resizable.Pane>
			</Resizable.PaneGroup>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">vertical, without a handle</h3>
			<Resizable.PaneGroup direction="vertical" class="min-h-40 rounded-lg border border-border">
				<Resizable.Pane defaultSize={50}><div class="p-4 text-sm">Top</div></Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane defaultSize={50}><div class="p-4 text-sm">Bottom</div></Resizable.Pane>
			</Resizable.PaneGroup>
		</div>
	</div>
</section>
