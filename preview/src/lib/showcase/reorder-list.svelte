<script lang="ts">
	import ReorderList from '#lib/stack/ReorderList.svelte';

	// The steps of a sequence, in the order that the person sets. The handle drags with a pointer,
	// lifts with Space, and More holds Move up and Move down. Each saved order counts in
	// data-saves, so that a probe can read it.
	type Step = { id: string; label: string; kind: string };
	let steps = $state<Step[]>(
		[
			['Send the welcome email', 'Email'],
			['Wait 2 days', 'Wait'],
			['Send the setup guide', 'Email'],
			['Wait 3 days', 'Wait'],
			['Book a call', 'Task'],
			['Send the reminder', 'Email'],
			['Wait 1 week', 'Wait'],
			['Close the sequence', 'End']
		].map(([label, kind], i) => ({ id: `step-${i + 1}`, label, kind }))
	);
	let saves = $state(0);
</script>

<section id="showcase-reorder-list" data-showcase="reorder-list" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">reorder-list</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		Drag a handle, or press Space on it and move the step with the arrow keys. More holds Move up and Move down. Each drop
		saves the order, and the toast offers Undo.
	</p>
	<div class="max-w-xl overflow-hidden rounded-lg border border-border" data-saves={saves}>
		<ReorderList bind:items={steps} label="Steps of the sequence" name={(s) => s.label} onsave={() => saves++}>
			{#snippet item(s, i)}
				<span aria-hidden="true" class="w-4 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
				<span class="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-3">
					<span class="truncate font-medium">{s.label}</span>
					<span class="text-xs text-muted-foreground">{s.kind}</span>
				</span>
			{/snippet}
		</ReorderList>
	</div>
</section>
