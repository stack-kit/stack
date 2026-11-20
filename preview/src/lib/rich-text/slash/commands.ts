// The commands of the slash menu of the rich text field (### rich-text-field in DESIGN.md, "The slash
// menu"): the words in English, which the words of the page replace one by one, and the filter of the
// words after the slash. It needs no DOM, so node --test runs it (scripts/rich-text-field.test.mjs).
import type { SlashCommand, SlashWords } from '#lib/stack/rich-text.js';

export const SLASH_WORDS: SlashWords = {
	label: 'Commands',
	empty: 'No command matches.',
	commands: {
		paragraph: 'Normal',
		h1: 'Heading 1',
		h2: 'Heading 2',
		h3: 'Heading 3',
		'bullet-list': 'Bulleted list',
		'numbered-list': 'Numbered list',
		quote: 'Quote',
		'code-block': 'Code block',
		hr: 'Divider',
		picture: 'Picture'
	}
};

/** The words in lower case with no accent, so that a filter with no accent matches a name with one. */
const fold = (words: string) => words.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

/**
 * The commands that the filter matches, in their order: each command whose name holds the filter, or
 * whose id starts with it, such as "h2" or "hr". An empty filter matches every command.
 */
export function filterCommands(commands: readonly SlashCommand[], names: SlashWords['commands'], filter: string): SlashCommand[] {
	const q = fold(filter.trim());
	if (q === '') return [...commands];
	return commands.filter((c) => fold(names[c]).includes(q) || c.startsWith(q));
}

/**
 * True when the menu closes for the filter: a space right after the slash, or a filter that matches no
 * command and ends with a space. So a person who types a slash in words goes on writing.
 */
export function filterCloses(filter: string, matches: number): boolean {
	return /^\s/.test(filter) || (matches === 0 && /\s$/.test(filter));
}
