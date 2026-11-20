<!--
	A stretch of activity lines (### activity-lines in DESIGN.md), such as the changes of a record between two
	comments, or the events of a conversation between two mails of a thread. Each line is a marker of the
	default variant with the icon of its event, its words and its time by its age. The part sorts a copy of
	the lines by their time, the oldest first. It is a base part: it does one thing, and CommentList, the
	snippet after of MailThread and Conversation place it.

	- A stretch of more than 8 lines shows its last 3, and a ghost button before them shows the rest: the
	  fold of "Variants" of ### item, from fold.ts. The button stays, with the words to hide them again, so
	  the focus stays on it.
	- Every line prints, also the lines of a folded stretch.
-->
<script lang="ts" module>
	import type { Component } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** One line of activity, such as a change of the status: its words, its time and the icon of its event. */
	export type ActivityLine = {
		id: string;
		at: Date;
		/** The words of the event, such as "Morgan Lee set the status to Waiting". */
		text: string;
		/** The icon of the event, such as the icon of the new status, at 14 px in the 16 px box of the marker icon. With none, the line shows no icon. */
		icon?: Component | undefined;
	};
	/** The words of the part, in the language of the product. */
	export type ActivityLinesWords = {
		/** The button of the lines that a stretch folds, and the button that folds them again. */
		showLines: (n: number) => string;
		hideLines: (n: number) => string;
	};

	/** @behaviour fold:activity */
	export type ActivityLinesProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, the column of the lines. */
		ref?: HTMLDivElement | null;
		/** The lines of one stretch, one line or more, in any order: the part sorts a copy by time, the oldest first, and keeps the given order of two lines of the same time. */
		lines: ActivityLine[];
		/** Now, for the time by its age. */
		now: Date;
		locale?: string | undefined;
		timeZone: string;
		words?: Partial<ActivityLinesWords> | undefined;
	};

	/** The words of the part in English, which the words of the product replace one by one. */
	export const ACTIVITY_LINES_WORDS: ActivityLinesWords = {
		showLines: (n) => `Show ${n} earlier ${n === 1 ? 'line' : 'lines'}`,
		hideLines: (n) => `Hide ${n} earlier ${n === 1 ? 'line' : 'lines'}`
	};
</script>

<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Marker from '#lib/components/ui/marker/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { age } from './age.js';
	import { fold } from './fold.js';

	let { lines, now, locale = 'en-GB', timeZone, words, ref = $bindable(null), class: className, ...rest }: ActivityLinesProps = $props();

	const uid = $props.id();
	const w = $derived({ ...ACTIVITY_LINES_WORDS, ...words });
	const full = $derived(new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full', timeStyle: 'short' }));
	/** True after the person showed the earlier lines. */
	let open = $state(false);
	const f = $derived(fold([...lines].sort((a, b) => a.at.getTime() - b.at.getTime()), open));
</script>

{#snippet line(l: ActivityLine)}
	<Marker.Root>
		{#if l.icon}{@const Icon = l.icon}<Marker.Icon class="flex items-center justify-center"><Icon class="size-3.5" /></Marker.Icon>{/if}
		<Marker.Content>
			{l.text},
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<time {...props} tabindex="-1" datetime={l.at.toISOString()} class="tabular-nums">{age(l.at, now, locale, timeZone)}</time>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>{full.format(l.at)}</Tooltip.Content>
			</Tooltip.Root>
		</Marker.Content>
	</Marker.Root>
{/snippet}

<!-- The part gives its tooltips their provider, so it works on a page with none. -->
<Tooltip.Provider>
	<div bind:this={ref} data-slot="activity-lines" class={cn('flex flex-col items-start gap-2', className)} {...rest}>
		{#if f.earlier.length > 0}
			<Button variant="ghost" size="xs" class="text-muted-foreground print:hidden" aria-expanded={open} aria-controls="{uid}-earlier" onclick={() => (open = !open)}>
				{open ? w.hideLines(f.earlier.length) : w.showLines(f.earlier.length)}
			</Button>
			<!-- The folded lines print, because paper cannot open a fold. -->
			<div id="{uid}-earlier" class={cn('w-full flex-col gap-2 print:flex', f.hidden > 0 ? 'hidden' : 'flex')}>
				{#each f.earlier as l (l.id)}{@render line(l)}{/each}
			</div>
		{/if}
		{#each f.last as l (l.id)}{@render line(l)}{/each}
	</div>
</Tooltip.Provider>
