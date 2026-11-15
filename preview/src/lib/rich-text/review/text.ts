// The chunk of the diff of a whole text in the rich text field (### rich-text-field in DESIGN.md,
// "Writing tools"). The writing tools load it with a dynamic import at the first whole text that a
// service gives, so the diff, its part and the load list stay out of the review chunk.
import { diffChanges } from '#lib/stack/Diff.svelte';
import { richTextFragment, type SanitizeOptions } from '#lib/stack/rich-text.js';
import type { WritingWords } from '#lib/stack/rich-text.js';
import { blockMarks, blocksOf, diffBlocks } from './diff.js';

export { default as Proposal } from './Proposal.svelte';

/**
 * The lines of the diff from the content `old` to the whole text `now`, both through the load list of the
 * field, and the count of its changes. `words` gives the words of a picture, a divider and an address.
 */
export function linesOf(old: string, now: string, options: SanitizeOptions, words: WritingWords) {
	const load = (html: string) => richTextFragment(html, options);
	const marks = blockMarks(words);
	const lines = diffBlocks(blocksOf(old, load, marks), blocksOf(now, load, marks));
	return { lines, count: diffChanges(lines, 'text').length };
}
