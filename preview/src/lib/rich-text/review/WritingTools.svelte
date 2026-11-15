<!--
	The writing tools of the rich text field (### rich-text-field in DESIGN.md, "Writing tools"), at the end
	of its toolbar, outside the arrow order of the bar. Each tool asks the service of the page: Check, Rewrite
	and Structure, each an outline button of size sm with an icon and a word. Structure has a tooltip that
	says what it does, which mounts when a person first uses the field, as the tooltip of the toolbar does. A tool that the page leaves out does
	not show, and Rewrite shows only when the page gives modes.

	| Moment | The tools |
	| At rest | Check, Rewrite with a chevron, Structure |
	| A request runs | The busy button of its kind, such as "Checking", with the spinner inside it, aria-disabled and aria-busy, then Stop. The other tools are off with a reason. |

	Below 768 px each tool shows its icon only, and its word stays for a screen reader, so the toolbar keeps
	its room. A tool that cannot act names one reason for all the tools there, in place of a line under
	each, because the request bar or the read-only text shows the state already.

	Rewrite is a dropdown menu aligned to the end of its trigger. Its first row says what the rewrite acts on,
	the whole text or the selected words, then the modes, in the groups that the page gives. A pick sends the
	id of the mode with the scope when the menu has closed, and the focus goes to Stop.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TextRange, WritingKind, WritingMode, WritingWords } from '#lib/stack/rich-text.js';

	export type WritingToolsProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		words: WritingWords;
		/** The tools that show. */
		tools: readonly WritingKind[];
		modes: readonly WritingMode[];
		/** The kind of the request that runs, or null. */
		running: WritingKind | null;
		/** Why the tools are off, such as "Write the text first."; undefined while they can run. */
		off?: string | undefined;
		/** The selected words that a rewrite is for, or null for the whole text. */
		scope: TextRange | null;
		/** True from the first focus or pointer in the field; the tooltip mounts then. */
		armed: boolean;
		onrun: (kind: WritingKind, mode?: string) => void;
		onstop: () => void;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LayoutListIcon from '@lucide/svelte/icons/layout-list';
	import SpellCheckIcon from '@lucide/svelte/icons/spell-check';
	import SquareIcon from '@lucide/svelte/icons/square';
	import WandSparklesIcon from '@lucide/svelte/icons/wand-sparkles';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { bands } from '#lib/stack/behaviour/width.js';
	import { tick } from 'svelte';
	import { cn } from '#lib/utils.js';
	import ReasonButton from '#lib/stack/ReasonButton.svelte';

	let { words: w, tools, modes, running, off, scope, armed, onrun, onstop, class: className, ref = $bindable(null), ...rest }: WritingToolsProps = $props();

	/** The one tooltip of the tools, which only Structure takes. */
	const tip = TooltipPrimitive.createTether<'structure'>();
	const uid = $props.id();
	const why = $derived(off ?? (running ? w.wait : undefined));
	/** Below 768 px the tools name one reason, in place of a line under each tool. */
	const shared = $derived(why !== undefined && !bands.md.current);
	const reason = $derived(why === undefined ? {} : shared ? { reason: why, describedby: `${uid}-why` } : { reason: why });

	// A pick in the menu of Rewrite runs once the menu has closed, because the request hides the menu with
	// its trigger. The focus then goes to Stop, so it never falls to the page.
	let picked: string | null = null;
	async function closed(e: Event) {
		const id = picked;
		picked = null;
		if (id === null) return;
		e.preventDefault();
		onrun('rewrite', id);
		await tick();
		(ref?.querySelector<HTMLElement>('[data-action="stop"]') ?? ref?.querySelector<HTMLElement>('[data-tool="rewrite"]'))?.focus();
	}
	/** The modes in the groups of the page, in the order of their first mode; a mode with no group comes first. */
	const groups = $derived.by(() => {
		const out = new Map<string, WritingMode[]>();
		for (const m of [...modes].sort((a, b) => Number(a.group !== undefined) - Number(b.group !== undefined))) {
			const key = m.group ?? '';
			out.set(key, [...(out.get(key) ?? []), m]);
		}
		return [...out];
	});
</script>

<div bind:this={ref} data-slot="rich-text-writing-tools" role="group" aria-label={w.tools} class={cn('flex items-center gap-1', className)} {...rest}>
	{#if running}
		<!-- The busy button of ### button. aria-disabled and not disabled, because a disabled control dims the whole input group. -->
		<Button variant="outline" size="sm" aria-disabled="true" aria-busy="true" class="aria-disabled:cursor-not-allowed">
			<Spinner data-icon="inline-start" aria-hidden="true" role="presentation" /><span class="max-md:sr-only">{w.running[running]}</span>
		</Button>
		<Button variant="outline" size="sm" data-action="stop" onclick={onstop}><SquareIcon data-icon="inline-start" /><span class="max-md:sr-only">{w.stop}</span></Button>
	{/if}
	{#if tools.includes('check') && running !== 'check'}
		<ReasonButton variant="outline" size="sm" data-tool="check" {...reason} onclick={() => onrun('check')}>
			<SpellCheckIcon data-icon="inline-start" /><span class="max-md:sr-only">{w.check}</span>
		</ReasonButton>
	{/if}
	{#if tools.includes('rewrite') && modes.length > 0 && running !== 'rewrite'}
		{#if why}
			<ReasonButton variant="outline" size="sm" data-tool="rewrite" {...reason}>
				<WandSparklesIcon data-icon="inline-start" /><span class="max-md:sr-only">{w.rewrite}</span><ChevronDownIcon data-icon="inline-end" />
			</ReasonButton>
		{:else}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger data-tool="rewrite" class={buttonVariants({ variant: 'outline', size: 'sm' })}>
					<WandSparklesIcon data-icon="inline-start" /><span class="max-md:sr-only">{w.rewrite}</span><ChevronDownIcon data-icon="inline-end" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="w-56 max-md:*:data-[slot=dropdown-menu-item]:min-h-11" onCloseAutoFocus={closed}>
					<DropdownMenu.Label class="text-xs text-muted-foreground">{scope ? w.forSelection : w.forWhole}</DropdownMenu.Label>
					{#each groups as [group, list] (group)}
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							{#if group}<DropdownMenu.GroupHeading>{group}</DropdownMenu.GroupHeading>{/if}
							{#each list as mode (mode.id)}
								<DropdownMenu.Item onSelect={() => (picked = mode.id)}>{mode.label}</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
	{/if}
	{#if tools.includes('structure') && running !== 'structure'}
		{#if why}
			<ReasonButton variant="outline" size="sm" data-tool="structure" {...reason}><LayoutListIcon data-icon="inline-start" /><span class="max-md:sr-only">{w.structure}</span></ReasonButton>
		{:else}
			<Tooltip.Trigger tether={tip} payload="structure" type="button" data-tool="structure" class={buttonVariants({ variant: 'outline', size: 'sm' })} onclick={() => onrun('structure')}>
				<LayoutListIcon data-icon="inline-start" /><span class="max-md:sr-only">{w.structure}</span>
			</Tooltip.Trigger>
		{/if}
	{/if}
	{#if shared}<span id="{uid}-why" class="sr-only">{why}</span>{/if}
</div>

<!-- The tooltip mounts when a person first uses the field, so a field that nobody uses adds no listener. -->
{#if armed}
	<Tooltip.Provider>
		<Tooltip.Root tether={tip}>
			{#snippet children({ payload })}
				{#if payload}<Tooltip.Content>{w.structureHint}</Tooltip.Content>{/if}
			{/snippet}
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
