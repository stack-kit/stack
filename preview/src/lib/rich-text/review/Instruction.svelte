<!--
	The instruction row of the rich text field (### rich-text-field in DESIGN.md, "Writing tools"): a row
	under the text, in the input group of the field, with a border edge on top, where a person tells the
	service of the page what to change, such as "make the second paragraph shorter". A pen icon, then the
	chip of the selection when words are selected, a text area of one row that grows to 160 px, and the send
	button. The chip is a secondary badge with the selected words in quotes on one line, and a round cross
	that clears the selection, so the instruction is for the whole text.

	The field is a text area, so it follows "Rules" of "Keyboard model" in architecture/web-app.md: Enter
	adds a line and Cmd+Enter sends. While the tools are off, such as while a request runs, the field is
	read-only with aria-disabled, never disabled, because it stands in the input group, and its placeholder
	and the send button give the reason. An instruction whose request did not start stays in the field.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TextRange, WritingWords } from '#lib/stack/rich-text.js';

	export type InstructionProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		words: WritingWords;
		/** The selected words that the instruction is for, or null for the whole text. */
		scope: TextRange | null;
		/** Why the field is off now, such as while a request runs; undefined while it can send. */
		off?: string | undefined;
		/** Sends the instruction; true when the request started, and the field then clears. */
		onask: (instruction: string) => boolean;
		onclearscope: () => void;
	};
</script>

<script lang="ts">
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import XIcon from '@lucide/svelte/icons/x';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { cn } from '#lib/utils.js';
	import ReasonButton from '#lib/stack/ReasonButton.svelte';
	import { reasonOf } from '../reason.js';
	import { isKey, keyParts } from '../tools/keys.js';

	let { words: w, scope, off, onask, onclearscope, class: className, ref = $bindable(null), ...rest }: InstructionProps = $props();

	const uid = $props.id();
	let value = $state('');
	const why = $derived(off ?? (!value.trim() ? w.instructionEmpty : undefined));

	function send() {
		if (why) return;
		if (onask(value.trim())) value = '';
	}

	function onkeydown(e: KeyboardEvent) {
		if (!isKey(e, 'Cmd+Enter')) return;
		e.preventDefault();
		e.stopPropagation();
		send();
	}
</script>

<div bind:this={ref} data-slot="rich-text-instruction" class={cn('flex w-full items-start gap-2 border-t border-border px-3 py-2', className)} {...rest}>
	<PenLineIcon aria-hidden="true" class="mt-1.5 size-4 shrink-0 text-muted-foreground" />
	{#if scope}
		<Badge variant="secondary" class="mt-1 max-w-64 shrink-0 gap-1 pr-0.5" title={scope.text}>
			<span class="sr-only">{w.onlySelected}</span>
			<span class="truncate">“{scope.text.replace(/\s+/g, ' ')}”</span>
			<button type="button" class="grid size-4 place-items-center rounded-full hover:bg-foreground/10" aria-label={w.clearScope} onclick={onclearscope}>
				<XIcon class="size-3" aria-hidden="true" />
			</button>
		</Badge>
	{/if}
	<label for="{uid}-text" class="sr-only">{w.instruction}</label>
	<textarea
		id="{uid}-text"
		rows="1"
		maxlength="1000"
		bind:value
		readonly={off !== undefined}
		aria-disabled={off !== undefined ? 'true' : undefined}
		aria-describedby="{uid}-keys"
		placeholder={off ?? w.instructionPlaceholder}
		class="field-sizing-content max-h-40 min-h-7 flex-1 resize-none bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
		{onkeydown}
	></textarea>
	<span id="{uid}-keys" class="mt-1.5 hidden shrink-0 items-center gap-1 text-xs text-muted-foreground md:flex">
		<Kbd.Group>{#each keyParts('Cmd+Enter') as part (part)}<Kbd.Root>{part}</Kbd.Root>{/each}</Kbd.Group><span class="sr-only">{w.sendKey}</span>
	</span>
	<ReasonButton variant="outline" size="icon-sm" aria-label={w.send} data-action="send" {...reasonOf(why)} onclick={send}>
		<ArrowUpIcon />
	</ReasonButton>
</div>
