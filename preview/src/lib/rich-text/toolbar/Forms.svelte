<!--
	The forms of the rich text field (### rich-text-field in DESIGN.md): the link form and the two color
	pickers, in one popover with role="dialog" and the name of the tool. The popover opens at the control
	that the field gives (formAt of context.ts): the tool in the toolbar or in More, or a button of the bar
	over selected text. A form that was open when the lock started writes nothing (setLink and setColor of
	the field). The color picker reads its contrast against the paper and the ink of the field, which can
	be a paper of the page. The toolbar mounts this part when a form first opens.
-->
<script lang="ts" module>
	export type FormsProps = {
		/** True while a menu of the toolbar is open, so that the focus stays in the menu when the form closes. */
		menuOpen: boolean;
	};
</script>

<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { LINK } from '#lib/stack/rich-text.js';
	import { untrack } from 'svelte';
	import { getField } from '../context.js';
	import { tool } from '../tools/commands.js';
	import ColorPicker from './ColorPicker.svelte';

	let { menuOpen }: FormsProps = $props();

	const uid = $props.id();
	const field = getField();
	let url = $state('');
	let urlError = $state<string | null>(null);

	// Each open of the link form starts from the link at the selection.
	$effect(() => {
		if (field.form !== 'link') return;
		untrack(() => {
			url = field.state?.link ?? '';
			urlError = null;
		});
	});

	/** An address that a person typed: a domain becomes https, and an address of a mailbox becomes mailto. */
	function address(text: string): string | null {
		const t = text.trim();
		if (!t) return null;
		if (LINK.test(t)) return t;
		if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(t)) return `mailto:${t}`;
		if (/^[^\s/:]+\.[^\s/:]+(?:[/?#].*)?$/.test(t)) return `https://${t}`;
		return null;
	}

	function applyLink(e: SubmitEvent) {
		e.preventDefault();
		const href = address(url);
		if (href === null) {
			urlError = 'Give an address that starts with https://, http:// or mailto:, or a domain such as example.com.';
			return;
		}
		field.setLink(href);
		field.closeForm();
	}

	/** After the form closes, the focus goes back to the text, unless a menu of the toolbar opened. */
	function closeFocus(e: Event) {
		e.preventDefault();
		if (field.form === null && !menuOpen) field.back();
	}
</script>

<Popover.Root bind:open={() => field.form !== null, (v) => !v && field.closeForm()}>
	<Popover.Content customAnchor={field.formAt} align="start" class="w-auto" role="dialog" aria-label={field.form ? tool(field.form).label : undefined} onCloseAutoFocus={closeFocus}>
		{#if field.form === 'link'}
			<form class="flex w-72 flex-col gap-2" onsubmit={applyLink}>
				<Field.Field data-invalid={urlError ? 'true' : undefined}>
					<Field.Label for="{uid}-url">Address of the link</Field.Label>
					<Input id="{uid}-url" bind:value={url} placeholder="https://example.com" autocomplete="off" spellcheck="false" aria-invalid={urlError ? true : undefined} aria-describedby={urlError ? `${uid}-url-error` : undefined} />
					{#if urlError}<Field.Error id="{uid}-url-error">{urlError}</Field.Error>{/if}
				</Field.Field>
				<div class="flex items-center justify-end gap-2">
					{#if field.state?.link}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								field.setLink(null);
								field.closeForm();
							}}>Remove link</Button
						>
					{/if}
					<Button type="submit" size="sm">Apply</Button>
				</div>
			</form>
		{:else if field.form === 'text-color' || field.form === 'highlight-color'}
			{@const kind = field.form === 'text-color' ? 'text' : 'highlight'}
			{@const colors = field.paperColors()}
			<!-- The popover stands outside the field, so the picker gets the paper and the ink of the field. -->
			<ColorPicker
				{kind}
				paper={colors?.paper}
				ink={colors?.ink}
				value={kind === 'text' ? (field.state?.color ?? null) : (field.state?.highlight ?? null)}
				onpick={(hex) => {
					field.setColor(kind, hex);
					field.closeForm();
				}}
			/>
		{/if}
	</Popover.Content>
</Popover.Root>
