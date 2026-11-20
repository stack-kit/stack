<!--
	The send state of a message (### send-state in DESIGN.md): the furthest step that a chat service
	reported for a message of the team, Sent, Delivered or Seen, with its time by its age. It is a base
	part: it does one thing, and the product places it in Message.Footer.

	- The line shows the step of the highest rank, not the step that came last, so a report that comes out
	  of order cannot move it back. Two reports of one step count once, at the earlier time. A step that
	  the product does not give never shows, and with no step the part shows nothing.
	- No step takes a color: the shape of each icon and its words tell the steps apart, also in grayscale.
	- The line is a ghost button of size xs. A click, Enter or Space opens a popover that lists each given
	  step in the order of rank, with its icon, its words and its time. Esc closes it and gives the focus
	  back to the button. Print shows the line and no popover.
	- The line is no live region, so a screen reader reads a new step when the person comes to it.
	- Inside a message, the icon starts where the words of the header start, and on a message with
	  align="end" the time ends where the header ends, also with the padding of the button.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/** One step of the send state of a message, as the service reported it, with its time. */
	export type SendStep = { state: 'sent' | 'delivered' | 'seen'; at: Date };

	/** The words of the part, in the language of the product. */
	export type SendStateWords = {
		/** The words of each step with its time by its age, such as "Seen 10:31", in the line and in the list of the steps. The part puts the time in a <time> element where it finds the time in the words. */
		sent: (time: string) => string;
		delivered: (time: string) => string;
		seen: (time: string) => string;
		/** The name of the list of the steps, for a screen reader. */
		dialog: string;
	};

	export type SendStateProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
		/** The root element, which holds the button of the line. */
		ref?: HTMLSpanElement | null;
		/** The steps that the service reported for the message, in any order. The line shows the step of the highest rank. With no step, the part shows nothing. */
		steps: SendStep[];
		/** Now, for the time by its age. */
		now: Date;
		locale?: string | undefined;
		timeZone: string;
		/** The words of the part in the language of the product. Each word that the product does not give stays as in SEND_STATE_WORDS. */
		words?: Partial<SendStateWords> | undefined;
	};

	/** The words of the part in English, which the words of the product replace one by one. */
	export const SEND_STATE_WORDS: SendStateWords = {
		sent: (time) => `Sent ${time}`,
		delivered: (time) => `Delivered ${time}`,
		seen: (time) => `Seen ${time}`,
		dialog: 'Send state'
	};
</script>

<script lang="ts">
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { cn } from '#lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CheckCheckIcon from '@lucide/svelte/icons/check-check';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import { age } from './age.js';

	let { steps, now, locale = 'en-GB', timeZone, words, ref = $bindable(null), class: className, ...rest }: SendStateProps = $props();

	/** The steps in the order of rank. */
	const RANK: SendStep['state'][] = ['sent', 'delivered', 'seen'];
	const ICON = { sent: CheckIcon, delivered: CheckCheckIcon, seen: EyeIcon };
	const w = $derived({ ...SEND_STATE_WORDS, ...words });
	/** Each given step once, at its earliest time, in the order of rank. The last is the furthest. */
	const ranked = $derived(
		RANK.flatMap((state) => {
			const times = steps.filter((s) => s.state === state).map((s) => s.at.getTime());
			return times.length > 0 ? [{ state, at: new Date(Math.min(...times)) }] : [];
		})
	);
	const top = $derived(ranked.at(-1));
</script>

<!-- The words of a step with its time by its age. The time stands in a <time> element where the words hold it. -->
{#snippet stepWords(step: SendStep)}
	{@const shown = age(step.at, now, locale, timeZone)}
	{@const line = w[step.state](shown)}
	{@const i = line.indexOf(shown)}
	{#if i < 0}{line}{:else}{line.slice(0, i)}<time datetime={step.at.toISOString()}>{shown}</time>{line.slice(i + shown.length)}{/if}
{/snippet}

{#if top}
	{@const Icon = ICON[top.state]}
	<span bind:this={ref} data-slot="send-state" data-step={top.state} class={cn('inline-flex max-w-full min-w-0', className)} {...rest}>
		<Popover.Root>
			<!-- The negative margin takes off the padding and the edge of 1 px, so the icon starts where the words of the header start, and the time ends where they end on a message with align="end". The root is as wide as the button less that margin, so the button shrinks as a flex item (shrink) and takes no max-w-full: max-w-full cut the line by the margin. -->
			<Popover.Trigger class={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'shrink min-w-0 -ms-1.75 text-muted-foreground tabular-nums group-data-[align=end]/message:ms-0 group-data-[align=end]/message:-me-2.25')}>
				<Icon data-icon="inline-start" />
				<span class="min-w-0 truncate">{@render stepWords(top)}</span>
			</Popover.Trigger>
			<Popover.Content class="w-auto min-w-40" role="dialog" aria-label={w.dialog}>
				<ol data-slot="send-state-steps" class="flex flex-col gap-1.5">
					{#each ranked as step (step.state)}
						{@const StepIcon = ICON[step.state]}
						<li class="flex items-center gap-2 tabular-nums"><StepIcon class="size-4 shrink-0 text-muted-foreground" /><span>{@render stepWords(step)}</span></li>
					{/each}
				</ol>
			</Popover.Content>
		</Popover.Root>
	</span>
{/if}
