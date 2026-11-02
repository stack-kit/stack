<script lang="ts" module>
	import type { PinInput } from 'bits-ui';

	/**
	 * The props of the Bits UI root, less those that kind sets. Bits UI 2.19.5 gives each other
	 * attribute, data-slot and aria-describedby included, to the hidden <input>, and only class to the
	 * root div, which ref binds. So input[data-slot=code-input] finds the input.
	 */
	export type CodeInputProps = Omit<PinInput.RootProps, 'value' | 'maxlength' | 'pattern' | 'pasteTransformer' | 'children' | 'ref'> & {
		ref?: HTMLElement | null;
		/** device: the code for a new device, 8 characters in two groups of four. app: the 6 digits of an authenticator app in two groups of three. */
		kind: 'device' | 'app';
		/** The code, with no space and no hyphen. A device code reads as Crockford base32 does. */
		value?: string;
		/** True while the server refuses the code: the hidden input and each cell take aria-invalid. */
		invalid?: boolean;
	};
</script>

<script lang="ts">
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import * as InputOTP from '#lib/components/ui/input-otp/index.js';
	import { cn } from '#lib/utils.js';
	import { CODE_PATTERN, pasteCode, readCode } from './codes.js';

	// The code input of ### input-otp in DESIGN.md, in its two kinds. A device code takes the 32
	// symbols of Crockford base32 in both cases, and I, L and O, and the binding writes each letter as
	// a capital, O as 0, and I and L as 1; a phone shows letters. An app code takes digits, and a
	// phone shows the number keys. A paste drops the spaces and the hyphens, because Bits UI refuses
	// a whole paste when one character fails the pattern. Each group and the separator take
	// aria-hidden, so a screen reader reads only the hidden input, its name and its value. A label
	// points at the hidden input through inputId.
	let { kind, value = $bindable(''), invalid = false, class: className, ref = $bindable(null), ...rest }: CodeInputProps = $props();

	// Plain reads of kind, not $derived: Bits UI can write the value after the part is destroyed, and a
	// derived of a destroyed part warns when it is read.
	const device = () => kind === 'device';
	/** The focus ring of the active cell, from the input-otp definition of DESIGN.md. */
	const slot = 'data-active:z-10 data-active:border-ring data-active:ring-3 data-active:ring-ring/50';
</script>

<InputOTP.Root
	bind:ref
	bind:value={() => value, (v) => (value = device() ? readCode(v) : v)}
	data-slot="code-input"
	maxlength={device() ? 8 : 6}
	pattern={device() ? CODE_PATTERN : REGEXP_ONLY_DIGITS}
	inputmode={device() ? 'text' : 'numeric'}
	autocapitalize={device() ? 'characters' : undefined}
	pasteTransformer={pasteCode}
	aria-invalid={invalid || undefined}
	class={cn('tabular-nums', className)}
	{...rest}
>
	{#snippet children({ cells })}
		{@const half = device() ? 4 : 3}
		<InputOTP.Group aria-hidden="true">
			{#each cells.slice(0, half) as cell, i (i)}
				<InputOTP.Slot {cell} class={slot} aria-invalid={invalid || undefined} />
			{/each}
		</InputOTP.Group>
		<InputOTP.Separator aria-hidden="true" />
		<InputOTP.Group aria-hidden="true">
			{#each cells.slice(half) as cell, i (i)}
				<InputOTP.Slot {cell} class={slot} aria-invalid={invalid || undefined} />
			{/each}
		</InputOTP.Group>
	{/snippet}
</InputOTP.Root>
