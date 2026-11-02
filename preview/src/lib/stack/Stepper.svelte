<!--
	The stepper of DESIGN.md (### stepper): the steps of a process that a person does in order, as an
	ordered list. Each step has a mark and a name. The mark holds the number of a next step, a check
	when the step is done, and an X when the step failed. The current step has the filled mark, its
	name at 600 and aria-current="step". A step that failed is the current step, because the process
	stops there, and its name ends with the word Failed.

	orientation="horizontal" puts the steps in one row with a 24 px line between them, such as under
	the top bar of a flow of pages. A done step with an address is a link back to that step. Below
	768 px the row turns into a column of 44 px rows. orientation="vertical" puts the steps down a page,
	each with its body under its name, and a line joins each mark to the next mark.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLOlAttributes } from 'svelte/elements';

	export type StepState = 'done' | 'current' | 'failed' | 'next';
	export interface Step {
		label: string;
		state: StepState;
		/** The address of a done step that the person may go back to. */
		href?: string;
		/** Down the page, what the step holds under its name: a line, a button or a field. */
		body?: Snippet;
	}

	export type StepperProps = Omit<HTMLOlAttributes, 'children' | 'class'> & {
		/** The root element, the ordered list of the steps. */
		ref?: HTMLOListElement | null;
		/** The name of the list, such as "Import steps". */
		label: string;
		steps: Step[];
		orientation?: 'horizontal' | 'vertical';
		/** Classes for the list, such as its padding in a band under the top bar. */
		class?: string;
		/** The words for a screen reader and the word of a failed step, in the language of the product. */
		words?: { done?: string; failed?: string };
	};
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '#lib/utils.js';

	let {
		label,
		steps,
		orientation = 'horizontal',
		class: className,
		words = {},
		ref = $bindable(null),
		...rest
	}: StepperProps = $props();

	const done = $derived(words.done ?? 'done');
	const failed = $derived(words.failed ?? 'Failed');
	const across = $derived(orientation === 'horizontal');
	const at = (s: Step) => s.state === 'current' || s.state === 'failed';
</script>

{#snippet mark(s: Step, i: number)}
	<span
		data-slot="stepper-mark"
		data-state={s.state}
		aria-hidden="true"
		class="flex size-5 shrink-0 items-center justify-center rounded-lg border border-border text-xs font-medium text-muted-foreground tabular-nums [&>svg]:size-3 data-[state=current]:border-foreground data-[state=current]:bg-foreground data-[state=current]:text-background data-[state=done]:text-foreground data-[state=failed]:border-transparent data-[state=failed]:bg-destructive/10 data-[state=failed]:text-destructive dark:data-[state=failed]:bg-destructive/20"
	>
		{#if s.state === 'done'}<CheckIcon />{:else if s.state === 'failed'}<XIcon />{:else}{i + 1}{/if}
	</span>
{/snippet}

{#snippet name(s: Step)}
	<span data-slot="stepper-label" class={cn('min-w-0', across ? at(s) && 'font-semibold text-foreground' : ['font-semibold', s.state !== 'next' && 'text-foreground'])}>
		<!-- The name in one text for a screen reader, because Chromium puts a space before a comma in a span of its own. -->
		{#if s.state === 'done' || s.state === 'failed'}
			<span aria-hidden="true">{s.label}{#if s.state === 'failed'}{' · '}<span class="font-normal text-muted-foreground">{failed}</span>{/if}</span><span class="sr-only"
				>{s.label}, {s.state === 'done' ? done : failed}</span
			>
		{:else}{s.label}{/if}
	</span>
{/snippet}

<ol
	bind:this={ref}
	data-slot="stepper"
	data-orientation={orientation}
	role="list"
	aria-label={label}
	class={cn(
		'flex text-sm text-muted-foreground',
		across ? 'flex-wrap items-center gap-x-3 gap-y-1 max-md:flex-col max-md:flex-nowrap max-md:items-stretch max-md:gap-0' : 'flex-col',
		className
	)}
	{...rest}
>
	{#each steps as s, i (i)}
		{@const last = i === steps.length - 1}
		<li
			data-slot="stepper-item"
			data-state={s.state}
			aria-current={at(s) ? 'step' : undefined}
			class={cn('relative flex', across ? 'items-center gap-3' : 'gap-3 pb-5 last:pb-0')}
		>
			{#if across}
				{#if i > 0}<span data-slot="stepper-line" aria-hidden="true" class="h-px w-6 shrink-0 bg-border max-md:hidden"></span>{/if}
				<!-- Below 768 px the steps stand in a column, and a line joins each mark to the next. -->
				{#if !last}<span aria-hidden="true" class="absolute top-9 -bottom-2 left-2.25 hidden w-px bg-border max-md:block"></span>{/if}
				{#if s.state === 'done' && s.href}
					<a
						href={s.href}
						class="flex items-center gap-2 rounded-md underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-solid focus-visible:ring-3 focus-visible:ring-ring/50 max-md:self-stretch"
					>
						{@render mark(s, i)}{@render name(s)}
					</a>
				{:else}
					<span class="flex items-center gap-2">{@render mark(s, i)}{@render name(s)}</span>
				{/if}
			{:else}
				{#if !last}<span data-slot="stepper-line" aria-hidden="true" class="absolute top-6 bottom-1 left-2.25 w-px bg-border"></span>{/if}
				{@render mark(s, i)}
				<div class="flex min-w-0 flex-1 flex-col gap-2">
					{#if s.state === 'done' && s.href}
						<a href={s.href} class="flex min-h-5 items-center self-start rounded-md underline-offset-4 outline-none hover:underline focus-visible:outline-1 focus-visible:outline-ring focus-visible:outline-solid focus-visible:ring-3 focus-visible:ring-ring/50">{@render name(s)}</a>
					{:else}
						<span class="flex min-h-5 items-center">{@render name(s)}</span>
					{/if}
					{@render s.body?.()}
				</div>
			{/if}
		</li>
	{/each}
</ol>
