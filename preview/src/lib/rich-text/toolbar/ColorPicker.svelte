<!--
	The color picker of content (### rich-text-field in DESIGN.md): the color of a text or of a highlight
	that a person writes into content, such as a mail. Such a color is content, not a role: it goes out as
	"#rrggbb" in a style attribute and keeps its value in every theme and mode. So each disc takes its color
	as a style, with a foreground/10 inset edge, because a content color can match the ground.

	The discs are the color picker of ### radio-group, 16 in two rows of eight, and six columns below
	768 px. The value flows one way: the color at the selection checks a disc, and the arrow keys only move
	between the discs. Bits UI checks the disc that an arrow key reaches, so the group takes a binding whose
	setter does nothing. A click, Enter or Space applies the color of the disc. A hex field takes 3 or 6
	digits, with or without "#", the color input of the browser takes any other color, and a ghost button
	removes the color. A line in small gives the contrast of the color in the field, with a warning icon
	under 4.5:1: a text color on the paper, and the ink on a highlight. The field gives the paper and the
	ink where its text stands, because the picker shows in a popover outside the field. With none, the
	picker reads the roles rich-text-paper and rich-text-ink where it shows, at its mount. The picker gives
	"#rrggbb" or null, and the field writes no other value.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ColorKind, ColorSwatch } from '#lib/stack/rich-text.js';

	export type ColorPickerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		kind: ColorKind;
		/** The name of the tool that opened the picker, such as "Text color". */
		label?: string | undefined;
		/** The color at the selection as "#rrggbb", or null with none. */
		value: string | null;
		/** The discs. By default TEXT_COLORS or HIGHLIGHT_COLORS of @stack-kit/stack/rich-text. */
		swatches?: readonly ColorSwatch[] | undefined;
		/** The ground and the ink of the content as "#rrggbb", for the contrast line. By default the roles rich-text-paper and rich-text-ink where the picker shows. */
		paper?: string | undefined;
		ink?: string | undefined;
		/** A color as "#rrggbb", or null to remove the color. */
		onpick: (hex: string | null) => void;
	};
</script>

<script lang="ts">
	import BanIcon from '@lucide/svelte/icons/ban';
	import CheckIcon from '@lucide/svelte/icons/check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { onMount, untrack } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';
	import { cn } from '#lib/utils.js';
	import { CONTENT_INK, CONTENT_PAPER, HIGHLIGHT_COLORS, TEXT_COLORS, contrastRatio, parseHex } from '#lib/stack/rich-text.js';
	import { PROBE, readPaper } from '../paper.js';

	let {
		kind,
		label,
		value,
		swatches,
		paper,
		ink,
		onpick,
		class: className,
		ref = $bindable(null),
		...rest
	}: ColorPickerProps = $props();

	const uid = $props.id();
	const name = $derived(label ?? (kind === 'text' ? 'Text color' : 'Highlight'));
	const discs = $derived(swatches ?? (kind === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS));
	// The picker mounts fresh at each open, so the field takes the color at the selection once.
	let typed = $state(untrack(() => (value ? value.slice(1) : '')));
	const hex = $derived(parseHex(typed));

	// With no paper and ink of the field, the pair of the content is the roles where the picker shows,
	// which a probe reads at the mount (paper.ts). Until the mount, such as in the HTML of the server, the
	// constants hold, which are the fallbacks of the two roles.
	let probe = $state<HTMLSpanElement | null>(null);
	let roles = $state<{ paper: string; ink: string } | null>(null);
	onMount(() => {
		if (probe) roles = readPaper(probe);
	});
	const ground = $derived(paper ?? roles?.paper ?? CONTENT_PAPER);
	const text = $derived(ink ?? roles?.ink ?? CONTENT_INK);
	// A text color stands on the paper; the ink stands on a highlight.
	const ratio = $derived(hex === null ? null : kind === 'text' ? contrastRatio(hex, ground) : contrastRatio(text, hex));

	function apply(e: SubmitEvent) {
		e.preventDefault();
		if (hex !== null) onpick(hex);
	}
</script>

<div bind:this={ref} data-slot="content-color-picker" class={cn('flex w-60 flex-col gap-2.5', className)} {...rest}>
	<span bind:this={probe} aria-hidden="true" class={PROBE}></span>
	<RadioGroup.Root aria-label={name} orientation="horizontal" class="grid grid-cols-8 gap-2 max-md:grid-cols-6 max-md:gap-7" bind:value={() => value ?? '', () => {}}>
		{#each discs as s (s.hex)}
			<div class="relative flex">
				<RadioGroup.Item
					value={s.hex}
					aria-label={s.name}
					style="background-color: {s.hex}"
					class="border-0 inset-ring inset-ring-foreground/10 after:-inset-1 focus-visible:inset-ring-ring max-md:after:-inset-3.5 *:data-[slot=radio-group-indicator]:hidden"
					onclick={() => onpick(s.hex)}
					onkeydown={(e: KeyboardEvent) => {
						// Bits UI takes Space to check the item, so no click follows it; Enter clicks the button.
						if (e.key === ' ') onpick(s.hex);
					}}
				/>
				{#if value === s.hex}
					<!-- The text colors are dark and the highlights light, so the check takes the paper or the ink. -->
					<CheckIcon class="pointer-events-none absolute inset-0.5 size-3" style="color: {kind === 'text' ? ground : text}" aria-hidden="true" />
				{/if}
			</div>
		{/each}
	</RadioGroup.Root>

	<form class="flex items-center gap-2" onsubmit={apply}>
		<InputGroup.Root class="flex-1">
			<InputGroup.Addon>#</InputGroup.Addon>
			<InputGroup.Input
				aria-label="{name}, hex value"
				placeholder="b91c1c"
				maxlength={7}
				autocomplete="off"
				spellcheck="false"
				class="tabular-nums"
				bind:value={typed}
				aria-invalid={typed && hex === null ? true : undefined}
			/>
			<InputGroup.Addon align="inline-end">
				<!-- Never disabled: a disabled control dims its whole input group (### input-group, States). -->
				<InputGroup.Button type="submit" size="xs">Apply</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
		<!-- Any other color: the picker of the browser and of the system, which gives "#rrggbb" in lower case. -->
		<label for="{uid}-any" class="relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-input max-md:size-11">
			<span class="sr-only">{name}, any color</span>
			<input
				id="{uid}-any"
				type="color"
				class="size-5 cursor-pointer"
				value={hex ?? (kind === 'text' ? TEXT_COLORS[0]?.hex : HIGHLIGHT_COLORS[0]?.hex)}
				oninput={(e) => (typed = e.currentTarget.value.slice(1))}
				onchange={(e) => onpick(e.currentTarget.value.toLowerCase())}
			/>
		</label>
	</form>

	{#if ratio !== null}
		<p class="flex items-center gap-1.5 text-xs {ratio < 4.5 ? 'text-foreground' : 'text-muted-foreground'}">
			{#if ratio < 4.5}<TriangleAlertIcon class="size-3.5 shrink-0 text-warning" aria-hidden="true" />{/if}
			<span class="tabular-nums">
				{kind === 'text' ? 'On the paper' : 'Text on this ground'}: {ratio.toFixed(1)}:1{ratio < 4.5 ? ', under 4.5:1 and hard to read' : ''}
			</span>
		</p>
	{/if}

	<Button variant="ghost" size="sm" class="justify-start" onclick={() => onpick(null)}>
		<BanIcon data-icon="inline-start" />{kind === 'text' ? 'Remove color' : 'Remove highlight'}
	</Button>
</div>
