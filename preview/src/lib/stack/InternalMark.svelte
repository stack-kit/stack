<!--
	The mark of content that stays inside the team (### internal-mark in DESIGN.md), such as a comment
	between the mails of a thread, the comments of a record, or a note that no customer sees. The content
	stands in a block on background with a border edge and the 8 px radius. An outline badge with a lock
	and the word "Internal" stands on the top edge, 12 px from the start, so the mark reads in grayscale
	and to a screen reader. It is a base part: it does one thing, and the other parts place it.

	- The word is text, first in the order of the block, so a screen reader reads it before the content.
	  A part that says the word itself, such as the heading of an internal comment, gives badgeHidden, and
	  the badge then takes aria-hidden.
	- proposal marks content that no person confirmed yet, such as a summary from a service of the
	  product: the dashed edge in input, the text in muted-foreground, and a second badge with the words of
	  proposal, as "Do's and Don'ts" of DESIGN.md says.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type InternalMarkProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element: the block. */
		ref?: HTMLDivElement | null;
		/** The content that stays inside the team. */
		children: Snippet;
		/** The word of the badge in the language of the product. "Internal" by default. */
		label?: string | undefined;
		/**
		 * The words of the badge of content that no person confirmed yet, which name its source, such as
		 * "Summary by Mail agent". The block then takes the dashed edge in input and the text in
		 * muted-foreground. Leave it undefined after a person confirmed the content.
		 */
		proposal?: string | undefined;
		/** True when the content says the word itself, such as the heading of an internal comment. The badge then takes aria-hidden, so a screen reader reads the word once. */
		badgeHidden?: boolean | undefined;
	};
</script>

<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { cn } from '#lib/utils.js';
	import LockIcon from '@lucide/svelte/icons/lock';

	let { children, label = 'Internal', proposal, badgeHidden = false, class: className, ref = $bindable(null), ...rest }: InternalMarkProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="internal-mark"
	data-proposal={proposal ? '' : undefined}
	class={cn('relative min-w-0 rounded-lg border border-border bg-background px-3 pt-4 pb-3', proposal && 'border-dashed border-input text-muted-foreground', className)}
	{...rest}
>
	<!-- On the top edge. The badges take the ground of the block, so the edge does not cross the words. -->
	<span data-slot="internal-mark-badges" class="absolute -top-2.5 start-3 end-3 flex min-w-0 items-center gap-1.5">
		<Badge variant="outline" aria-hidden={badgeHidden ? 'true' : undefined} class="bg-background"><LockIcon data-icon="inline-start" />{label}</Badge>
		{#if proposal}<Badge variant="outline" class="min-w-0 border-input bg-background"><span class="truncate">{proposal}</span></Badge>{/if}
	</span>
	{@render children()}
</div>
