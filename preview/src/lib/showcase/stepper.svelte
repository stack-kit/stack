<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import Stepper, { type Step } from '#lib/stack/Stepper.svelte';

	// An import of four steps across a page, in each state, and a sign-in of four steps down a page.
	const names = ['Source', 'Mapping', 'Dry run', 'Import'];
	const across = (states: Step['state'][]): Step[] =>
		names.map((label, i) => ({ label, state: states[i], href: states[i] === 'done' ? `#showcase-stepper` : undefined }));
	const start = across(['current', 'next', 'next', 'next']);
	const middle = across(['done', 'current', 'next', 'next']);
	const stopped = across(['done', 'done', 'done', 'failed']);
	const finished: Step[] = names.map((label) => ({ label, state: 'done' }));
</script>

{#snippet started()}
	<p class="tabular-nums">Started at 13:52 on rack-2.</p>
{/snippet}
{#snippet signIn()}
	<Button variant="outline" size="sm" class="w-fit">Open the sign-in page</Button>
{/snippet}
{#snippet paste()}
	<form class="flex max-w-sm gap-2" onsubmit={(e) => e.preventDefault()}>
		<Input aria-label="Code from the sign-in page" placeholder="The code" autocomplete="off" />
		<Button type="submit">Send code</Button>
	</form>
{/snippet}
{#snippet result()}
	<p>With the right code, rack-2 takes work again.</p>
{/snippet}

<section id="showcase-stepper" data-showcase="stepper" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">stepper</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		Across a page, a done step is a link back to it. Below 768 px the steps stand in a column. Down a page, each step holds
		its body under its name.
	</p>
	<div class="flex max-w-3xl flex-col gap-3" data-stepper-case="across">
		<h3 class="text-xs font-medium text-muted-foreground">horizontal: the first step, a step in the middle, a failed step, and the end</h3>
		{#each [start, middle, stopped, finished] as steps, k (k)}
			<div class="rounded-lg border border-border px-6 py-3 max-md:px-4 max-md:py-1">
				<Stepper label="Import steps" {steps} />
			</div>
		{/each}
	</div>
	<div class="flex max-w-xl flex-col gap-3" data-stepper-case="down">
		<h3 class="text-xs font-medium text-muted-foreground">vertical: steps with a body</h3>
		<Stepper
			label="Sign-in steps"
			orientation="vertical"
			steps={[
				{ label: 'Start the sign-in', state: 'done', body: started },
				{ label: 'Sign in on the sign-in page', state: 'done', body: signIn },
				{ label: 'Paste the code', state: 'current', body: paste },
				{ label: 'Result', state: 'next', body: result }
			]}
		/>
	</div>
</section>
