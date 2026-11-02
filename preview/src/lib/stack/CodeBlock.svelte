<!--
	The code block of DESIGN.md (### code-block): a text that a person reads and copies, and never
	changes. kind="code" keeps each line as it is, with an optional gutter of line numbers: from
	768 px a long line scrolls sideways, and below 768 px it wraps and the gutter hides, as in the code
	editor. kind="command" shows a prompt sign before each command, and kind="log" can show a column
	of times. Both wrap a long line at every width. The box stops at 320 px (max-h-80), and a class on
	the part sets another height. The root (code-block-wrapper) holds that height and the class, so a
	product places the part and sets the height with one class. In print the root has no height cap.

	The copy button sits in a column of its own, outside the scroll area, so it never covers a line
	and it stays in place while the text scrolls. It copies the text with no prompt sign, no line
	number and no line break at the end. A click turns its icon to a check for 2 s, and a polite live
	region says the result. When the browser refuses the write, the block selects its text, so that
	the person can copy it with the keys of the system. Below 768 px the button is 44 px, and the text
	has 16 px of padding at the top and the bottom, so that its first line sits level with the icon.

	The viewport of the scroll area takes tabindex="0", the region role and the name of the block
	only while the text overflows the box, so that a keyboard can reach it and scroll it. A block
	whose text fits adds no stop to the tab order.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type LogEntry = {
		/** The time as it shows, in the form of a log in architecture/web-app.md. */
		time: string;
		/** The machine form of the time, for the datetime attribute. */
		datetime: string;
		/** The full date and time in the locale, for the tooltip of the time. */
		full?: string;
		text: string;
	};

	export type CodeBlockProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** The root element of the part, which holds the box and the status line. */
		ref?: HTMLDivElement | null;
		/** The text. A log with a column of times passes entries instead. */
		code?: string;
		kind?: 'code' | 'command' | 'log';
		/** The lines of a log, each with its time. */
		entries?: LogEntry[];
		/** True to number the lines of code in a gutter, from 768 px. */
		numbers?: boolean;
		/** Classes for the root: a place, such as a margin, and the height where the box stops growing: max-h-30. */
		class?: string;
		'aria-label'?: string;
		'aria-labelledby'?: string;
		/** The text that the copy button writes, when it differs from the text that shows, such as a key with no space. */
		copyValue?: string | undefined;
		/** The name and the tooltip of the copy button, in the language of the product. */
		copyLabel?: string;
		copiedLabel?: string;
		failedLabel?: string;
	};
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';

	let {
		code = '',
		kind = 'code',
		entries,
		numbers = false,
		class: className,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		copyValue,
		copyLabel = 'Copy',
		copiedLabel = 'Copied',
		failedLabel = 'The browser did not copy the text. The text is selected, so copy it by hand.',
		ref = $bindable(null),
		...rest
	}: CodeBlockProps = $props();

	// A line break at the end shows no line, so every one leaves the lines and the copy, and a
	// carriage return becomes a line break. A command that ends in a line break would run at once
	// when a person pastes it into a terminal.
	const text = $derived(code.replace(/\r\n?/g, '\n').replace(/\n+$/, ''));
	const lines = $derived(text.split('\n'));
	const timed = $derived(kind === 'log' && entries !== undefined);
	// A time and its text are two spaces apart, on the screen and in the copy.
	const copyText = $derived(copyValue ?? (timed ? entries!.map((e) => `${e.time}  ${e.text}`).join('\n') : text));
	// A line after a line that ends in a backslash goes on with the same command, so it takes no sign.
	const prompted = $derived(lines.map((l, i) => i === 0 || !lines[i - 1]!.endsWith('\\')));
	// From 768 px a wrapped line of a log starts under the text, not under the time: a hanging indent
	// as wide as the longest time and its two spaces. The text stays inline, so a selection by hand
	// gives the time and the text on one line, as the copy does. Below 768 px a wrapped line starts
	// at the left edge, so that the text keeps the width of the screen.
	const lead = $derived(`${Math.max(0, ...(entries ?? []).map((e) => e.time.length)) + 2}ch`);

	let textNode = $state<HTMLElement | null>(null);
	let viewport = $state<HTMLElement | null>(null);
	let overflows = $state(false);

	// The overflow changes with the width of the box and with the text, so a ResizeObserver reads it
	// on the viewport and on its content. A tolerance of 1 px keeps a subpixel width out of it.
	$effect(() => {
		const el = viewport;
		if (!el) return;
		const measure = () => {
			overflows = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		if (el.firstElementChild) observer.observe(el.firstElementChild);
		measure();
		return () => observer.disconnect();
	});

	// The nova scroll area passes no attribute to its viewport, so the component sets them on it.
	$effect(() => {
		const el = viewport;
		if (!el) return;
		const set = (name: string, value: string | undefined) => {
			if (overflows && value !== undefined) el.setAttribute(name, value);
			else el.removeAttribute(name);
		};
		set('tabindex', '0');
		set('role', 'region');
		set('aria-label', ariaLabel);
		set('aria-labelledby', ariaLabelledby);
	});

	let result = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		clearTimeout(timer);
		try {
			await navigator.clipboard.writeText(copyText);
			result = 'copied';
			timer = setTimeout(() => (result = 'idle'), 2000);
		} catch {
			// No clipboard, as on a page that is not secure, or a write that the browser refused.
			result = 'failed';
			timer = setTimeout(() => (result = 'idle'), 2000);
			if (textNode) getSelection()?.selectAllChildren(textNode);
		}
	}

	$effect(() => () => clearTimeout(timer));

	const tip = $derived(result === 'copied' ? copiedLabel : result === 'failed' ? failedLabel : copyLabel);
	const wrap = 'whitespace-pre-wrap wrap-break-word';
	const sign = 'text-muted-foreground select-none';
</script>

<!-- The part gives its tooltips their provider, so it works on a page with none. -->
<Tooltip.Provider>
<div bind:this={ref} data-slot="code-block-wrapper" dir="ltr" class={cn('flex max-h-80 min-w-0 flex-col gap-1 print:max-h-none', className)} {...rest}>
<div data-slot="code-block" class="flex min-h-0 rounded-lg bg-muted font-mono text-xs text-foreground">
	<ScrollArea
		bind:viewportRef={viewport}
		orientation={kind === 'code' ? 'both' : 'vertical'}
		class="flex min-w-0 flex-1 rounded-l-lg [&>[data-slot=scroll-area-viewport]:focus-visible]:-outline-offset-1 [&>[data-slot=scroll-area-viewport]:focus-visible]:outline-solid [&>[data-slot=scroll-area-viewport]:focus-visible]:outline-ring"
	>
		{#if kind === 'code'}
			<div class="flex min-w-fit">
				{#if numbers}
					<div
						data-slot="code-block-gutter"
						aria-hidden="true"
						class="sticky left-0 min-w-9 shrink-0 border-r border-border bg-muted py-2 pr-2 pl-1 text-right text-muted-foreground select-none max-md:hidden"
					>
						{#each lines as _, i (i)}<div>{i + 1}</div>{/each}
					</div>
				{/if}
				<!-- A word that is wider than the box breaks anywhere below 768 px, so that its minimum width
				     never makes the box scroll sideways. -->
				<pre bind:this={textNode} data-slot="code-block-text" class="flex-1 px-2.5 py-2 max-md:py-4 max-md:whitespace-pre-wrap max-md:wrap-anywhere"><code>{text}</code></pre>
			</div>
		{:else if kind === 'command'}
			<div bind:this={textNode} data-slot="code-block-text" class="py-2 max-md:py-4">
				{#each lines as line, i (i)}
					<div class="flex min-h-lh px-2.5">
						<span data-slot="code-block-prompt" aria-hidden="true" class="shrink-0 whitespace-pre {sign}">{prompted[i] ? '$ ' : '  '}</span><span
							class="min-w-0 flex-1 {wrap}">{line}</span
						>
					</div>
				{/each}
			</div>
		{:else if timed}
			<div bind:this={textNode} data-slot="code-block-text" class="px-2.5 py-2 max-md:py-4" style:--lead={lead}>
				{#each entries! as e, i (i)}
					<div class="min-h-lh {wrap} md:pl-(--lead) md:-indent-(--lead)">
						<time data-slot="code-block-time" datetime={e.datetime} title={e.full} class="text-muted-foreground">{e.time}</time>{'  ' + e.text}
					</div>
				{/each}
			</div>
		{:else}
			<pre bind:this={textNode} data-slot="code-block-text" class="px-2.5 py-2 max-md:py-4 {wrap}"><code>{text}</code></pre>
		{/if}
	</ScrollArea>
	<div class="shrink-0 p-1 print:hidden">
		<Tooltip.Root disableCloseOnTriggerClick>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" size="icon-xs" aria-label={copyLabel} onclick={copy}>
						{#if result === 'copied'}<CheckIcon />{:else}<CopyIcon />{/if}
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{tip}</Tooltip.Content>
		</Tooltip.Root>
	</div>
</div>
<span role="status" class={result === 'failed' ? 'text-xs text-muted-foreground' : 'sr-only'}>{result === 'copied' ? copiedLabel : result === 'failed' ? failedLabel : ''}</span>
</div>
</Tooltip.Provider>
