<!--
	The proposal of a whole text in the rich text field (### rich-text-field in DESIGN.md, "Writing
	tools"): a diff of kind text with the marks of the blocks, in the place of the text while the proposal
	waits. The field computes its lines (review/diff.ts). The diff stands on the ground of the group, not
	on the paper, because it holds no content color, and it keeps at least the height of the text. It
	takes the title of the proposal as its name, and every line shows. Its words come from the words of the
	writing tools: diff, with inserted and deleted.
-->
<script lang="ts" module>
	import type { DiffLine } from '#lib/stack/Diff.svelte';
	import type { RichTextPreset, WritingWords } from '#lib/stack/rich-text.js';

	export type ProposalProps = {
		lines: DiffLine[];
		title: string;
		preset: RichTextPreset;
		words: WritingWords;
	};
</script>

<script lang="ts">
	import Diff from '#lib/stack/Diff.svelte';
	import { cn } from '#lib/utils.js';

	let { lines, title, preset, words }: ProposalProps = $props();
</script>

<Diff
	kind="text"
	{lines}
	context={lines.length}
	aria-label={title}
	words={{ inserted: words.inserted, deleted: words.deleted, ...words.diff }}
	class={cn('w-full px-3 py-2.5', preset === 'simple' ? 'min-h-24' : 'min-h-40')}
/>
