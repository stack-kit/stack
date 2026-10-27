<!--
	A QR code that a phone scans from the screen, with its value beside it as text that a person
	copies (DESIGN.md, `### qr-code`). lean-qr computes the modules at level M, and this component
	draws them as one SVG path, so the code renders on the server too. The tile is 224 px, the quiet
	zone of 4 modules included, and each module is a whole px, at least 4 px. A value that needs more
	modules than that shows a note in the place of the code, and its text stays. The tile is dark on
	light in both modes, because a camera reads dark modules on a light ground: in dark mode the two
	roles swap. The part reads its own box for its columns, and the window for its order: below
	768 px the value comes first, because a phone cannot scan its own screen.
-->
<script lang="ts" module>
	import { correction, generate } from 'lean-qr';

	/** The side of the tile in px, the quiet zone included. */
	export const QR_TILE = 224;
	/** The smallest module in px. */
	export const QR_MIN_MODULE = 4;
	/** The quiet zone around the code, in modules. */
	export const QR_QUIET = 4;
	/** The largest version whose modules stay QR_MIN_MODULE px in the tile: version 7, of 45 modules. */
	export const QR_MAX_VERSION = Math.floor((QR_TILE / QR_MIN_MODULE - 2 * QR_QUIET - 17) / 4);

	export type QrSymbol = {
		/** The version of the code, 1 to QR_MAX_VERSION. */
		version: number;
		/** The side of the module in px. */
		module: number;
		/** The dark modules as one path, in px of the tile. */
		path: string;
	};

	/**
	 * The code of a value at level M or higher, or null when the value needs a version past
	 * QR_MAX_VERSION. lean-qr raises the level when a higher level fits in the same version. The
	 * maxVersion option stops it before the modules shrink under QR_MIN_MODULE.
	 */
	export function qrSymbol(value: string): QrSymbol | null {
		let code;
		try {
			code = generate(value, { minCorrectionLevel: correction.M, maxVersion: QR_MAX_VERSION });
		} catch (e) {
			// lean-qr throws code 4, "Too much data", for a value past the largest version.
			if ((e as { code?: number }).code === 4) return null;
			throw e;
		}
		const n = code.size;
		const module = Math.floor(QR_TILE / (n + 2 * QR_QUIET));
		// A whole px for the offset too, so that each edge of a module falls on a px at 1x.
		const offset = Math.floor((QR_TILE - n * module) / 2);
		let path = '';
		for (let y = 0; y < n; y++) {
			for (let x = 0; x < n; ) {
				if (!code.get(x, y)) {
					x++;
					continue;
				}
				let end = x;
				while (end < n && code.get(end, y)) end++;
				path += `M${offset + x * module} ${offset + y * module}h${(end - x) * module}v${module}h${(x - end) * module}z`;
				x = end;
			}
		}
		return { version: (n - 17) / 4, module, path };
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { cn } from '#lib/utils.js';
	import CodeBlock from './CodeBlock.svelte';

	let {
		value,
		label,
		valueLabel,
		kind = 'text',
		text,
		copyValue,
		copyLabel = 'Copy',
		openLabel = 'Open the link',
		tooLongLabel = 'This value is too long for a QR code. Copy it as text.',
		loading = false,
		children,
		class: className
	}: {
		/** The text that the code holds: an address, or a key that an app reads. */
		value: string;
		/** The accessible name of the code: what it opens or holds, never the value. */
		label: string;
		/** The caption of the value, which also names its code block, such as "Pairing link". */
		valueLabel: string;
		/** "link" for an address that a phone opens: the part adds a link that opens it. */
		kind?: 'text' | 'link';
		/**
		 * The text of the code block, when a person types something other than the value in place of a scan:
		 * the setup key of an otpauth:// address, in groups of four.
		 */
		text?: string;
		/** The text that the copy button writes, such as the setup key with no space. */
		copyValue?: string;
		/** The name and the tooltip of the copy button, such as "Copy the pairing link". */
		copyLabel?: string;
		openLabel?: string;
		tooLongLabel?: string;
		/** True until the value arrives. The tile and the value show a still skeleton. */
		loading?: boolean;
		/** The instruction above the value, such as "Scan the code with the camera of the phone." */
		children?: Snippet;
		class?: string;
	} = $props();

	const uid = $props.id();
	const symbol = $derived(loading ? null : qrSymbol(value));
	const tile = `width: ${QR_TILE}px; height: ${QR_TILE}px`;
</script>

<div data-slot="qr-code" class={cn('@container print:break-inside-avoid', className)} aria-busy={loading ? 'true' : undefined}>
	<div class="flex flex-col gap-4 @lg:flex-row @lg:items-start @lg:gap-6">
		{#if loading}
			<Skeleton class="shrink-0 rounded-lg" style={tile} />
		{:else if symbol}
			<div data-slot="qr-code-tile" class="w-fit shrink-0 rounded-lg bg-background text-foreground forced-color-adjust-none dark:bg-foreground dark:text-background">
				<svg role="img" aria-label={label} width={QR_TILE} height={QR_TILE} viewBox="0 0 {QR_TILE} {QR_TILE}" class="block">
					<path d={symbol.path} fill="currentColor" shape-rendering="crispEdges" />
				</svg>
			</div>
		{:else}
			<p data-slot="qr-code-note" class="flex shrink-0 items-center rounded-lg bg-muted p-4 text-xs text-muted-foreground" style={tile}>{tooLongLabel}</p>
		{/if}
		<div class="flex min-w-0 flex-1 flex-col gap-2 max-md:order-first print:order-none">
			{@render children?.()}
			<span id="{uid}-value" class="text-xs font-semibold text-muted-foreground">{valueLabel}</span>
			{#if loading}
				<Skeleton class="h-8 w-full rounded-lg max-md:h-13" />
			{:else}
				<CodeBlock kind="log" code={text ?? value} {copyValue} aria-labelledby="{uid}-value" {copyLabel} />
				{#if kind === 'link'}
					<Button href={value} variant="outline" class="self-start print:hidden">{openLabel}</Button>
				{/if}
			{/if}
		</div>
	</div>
</div>
