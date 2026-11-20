// The tools that each preset of the rich text field turns on, and the groups of the toolbar and of the
// bar over selected text (### rich-text-field in DESIGN.md).
import type { RichTextPreset, SlashCommand } from '#lib/stack/rich-text.js';
import { TOOLS, type ToolId } from './commands.js';

const SLASH: ReadonlySet<ToolId> = new Set<SlashCommand>(['paragraph', 'h1', 'h2', 'h3', 'bullet-list', 'numbered-list', 'quote', 'code-block', 'hr', 'picture']);

/**
 * A group of the toolbar. `buttons` shows each tool as a button or a toggle; `menu` shows one trigger with
 * the tools as its items. `trigger` is what the trigger of a menu shows: `choice` the label of the item that
 * is on, `icon` the icon of the group. `fold` is the order in which the groups move into More when the bar
 * is too narrow, the lowest first.
 */
export type Group = {
	id: string;
	label: string;
	kind: 'buttons' | 'menu';
	trigger?: 'choice' | 'icon';
	tools: readonly ToolId[];
	fold: number;
};

export const GROUPS: readonly Group[] = [
	{ id: 'history', label: 'History', kind: 'buttons', tools: ['undo', 'redo'], fold: 2 },
	{ id: 'block', label: 'Text style', kind: 'menu', trigger: 'choice', tools: ['paragraph', 'h1', 'h2', 'h3', 'bullet-list', 'numbered-list', 'quote', 'code-block'], fold: 5 },
	{ id: 'format', label: 'Format', kind: 'buttons', tools: ['bold', 'italic', 'underline', 'strikethrough', 'inline-code', 'link'], fold: 8 },
	{ id: 'color', label: 'Color', kind: 'buttons', tools: ['text-color', 'highlight-color'], fold: 4 },
	{ id: 'align', label: 'Align', kind: 'menu', trigger: 'choice', tools: ['align-left', 'align-center', 'align-right', 'align-justify'], fold: 3 },
	{ id: 'list', label: 'List level', kind: 'buttons', tools: ['outdent', 'indent'], fold: 1 },
	{ id: 'insert', label: 'Insert', kind: 'menu', trigger: 'icon', tools: ['picture', 'hr'], fold: 6 },
	{ id: 'formats', label: 'More formats', kind: 'menu', trigger: 'icon', tools: ['subscript', 'superscript', 'clear-formatting'], fold: 7 }
];

/** Each tool in the order of the toolbar, group by group. When two commands get one key, the first one takes it. */
export const TOOL_ORDER: readonly ToolId[] = GROUPS.flatMap((g) => g.tools);

/** The tools that each preset turns on. A tool that is off does not show, and its key does nothing. */
export const PRESET_TOOLS: Readonly<Record<RichTextPreset, readonly ToolId[]>> = {
	simple: ['undo', 'redo', 'bold', 'italic', 'underline'],
	full: Object.keys(TOOLS) as ToolId[]
};

/** The block commands of the slash menu, in the order of the toolbar. The menu shows each one that the field turns on. */
export const SLASH_TOOLS: readonly SlashCommand[] = TOOL_ORDER.filter((id): id is SlashCommand => SLASH.has(id));

/** The tools of the bar over selected text, in groups, for the full preset. */
export const SELECTION_GROUPS: readonly { id: string; label: string; tools: readonly ToolId[] }[] = [
	{ id: 'format', label: 'Format', tools: ['bold', 'italic', 'underline', 'strikethrough'] },
	{ id: 'link', label: 'Link', tools: ['link'] },
	{ id: 'color', label: 'Color', tools: ['text-color', 'highlight-color'] },
	{ id: 'code', label: 'Code', tools: ['inline-code'] }
];

/** The groups of the toolbar with the tools that are on; a group with none drops out. */
export function groupsOf(on: ReadonlySet<ToolId>): Group[] {
	return GROUPS.map((g) => ({ ...g, tools: g.tools.filter((id) => on.has(id)) })).filter((g) => g.tools.length > 0);
}
