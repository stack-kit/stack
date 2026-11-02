<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ButtonSize, ButtonVariant } from '#lib/components/ui/button/index.js';

	/** @behaviour reason:tooltip,line stopped-click */
	export type ReasonButtonProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'id' | 'onclick'> & {
		/** The root: the button, or the box of the button and its reason line while a reason shows with no describedby. */
		ref?: HTMLElement | null;
		/** Why a rule blocks the action, as a sentence. Leave it undefined while the action may run. */
		reason?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		/** The address of a link button. While a reason shows, the part renders a button with no address. */
		href?: string;
		/** Runs on a click, and never while a reason shows. */
		onclick?: (e: MouseEvent) => void;
		type?: 'button' | 'submit';
		/** True when the action has no reason to give, such as a save before a change: the button leaves the tab order. */
		disabled?: boolean;
		/** The id of a text on the page that gives the reason already. The button then shows no tooltip and no line. */
		describedby?: string;
		/** The name, when the label is an icon or a short verb. */
		'aria-label'?: string;
		'aria-keyshortcuts'?: string;
		/** The id of the form that a submit button submits from outside it. */
		form?: string;
		/** The id of the button. It goes to the button in each form, and never to the box of the reason line. */
		id?: string;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';

	// A button that a rule can block ("Disabled with a reason" in ### button of DESIGN.md). With no
	// reason it is the button of the kit, a link when it has an href. With a reason it stays in the tab
	// order with aria-disabled="true", so a keyboard user reaches it and learns why it does not act. The
	// reason is in a tooltip on hover and on keyboard focus, and in a line that aria-describedby names.
	// The line shows below 768 px and on a touch screen, where a tap opens no tooltip. Where the page
	// shows the reason as text already, describedby names that text, and the button needs no tooltip
	// and no line. The browser still fires a click on Enter and on Space, and a submit button still
	// submits its form, so the part stops the click while a reason shows, and onclick does not run.
	// The part gives its own tooltip provider, so it needs none around it.
	let {
		reason,
		variant = 'default',
		size = 'default',
		href,
		onclick,
		type = 'button',
		disabled = false,
		describedby,
		'aria-label': ariaLabel,
		'aria-keyshortcuts': ariaKeyshortcuts,
		form,
		id,
		children,
		class: className,
		ref = $bindable(null),
		...rest
	}: ReasonButtonProps = $props();

	const uid = $props.id();
	// Nova draws only :disabled, so a button with aria-disabled takes these two classes.
	const blocked = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50';
	const stop = (e: MouseEvent) => e.preventDefault();
</script>

{#if !reason}
	<Button bind:ref data-slot="button" class={cn(className)} {...rest} {id} {variant} {size} {href} {onclick} {type} {disabled} {form} aria-label={ariaLabel} aria-keyshortcuts={ariaKeyshortcuts}>{@render children()}</Button>
{:else if describedby}
	<Button bind:ref data-slot="button" class={cn(blocked, className)} {...rest} {id} {variant} {size} {type} {form} aria-label={ariaLabel} aria-keyshortcuts={ariaKeyshortcuts} aria-disabled="true" aria-describedby={describedby} onclick={stop}>{@render children()}</Button>
{:else}
	<span bind:this={ref} data-slot="reason-button" class={cn('inline-flex flex-col items-start gap-1', className)} {...rest}>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class={cn(buttonVariants({ variant, size }), blocked)} {...id === undefined ? {} : { id }} {type} {form} aria-label={ariaLabel} aria-keyshortcuts={ariaKeyshortcuts} aria-disabled="true" aria-describedby="{uid}-reason" onclick={stop}>
					{@render children()}
				</Tooltip.Trigger>
				<Tooltip.Content>{reason}</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
		<span id="{uid}-reason" data-slot="reason-button-line" class="hidden text-xs text-muted-foreground max-md:block pointer-coarse:block">{reason}</span>
	</span>
{/if}
