// The tools of the rich text field (### rich-text-field in DESIGN.md) as data: the label and the kind of
// each one. The icons are in toolbar/icons.ts, so a part that shows no tool loads no icon, and the
// command of each tool is Engine.exec in engine/engine.ts, so the toolbar and its bars stay out of the
// chunk of the engine. The default keys of each tool are RICH_TEXT_KEYS of @stack-kit/stack/rich-text,
// and the field gives the keys of each command (keysOf of context.ts).
import type { RichTextCommand } from '#lib/stack/rich-text.js';
import type { Align, Block, EditorState, Mark } from '../engine/types.js';

export type Tool = {
	label: string;
	/**
	 * button: runs at once. toggle: on or off at the selection. choice: one item of a menu that shows the one at the
	 * selection. form: opens the link form. color: opens a color picker. file: opens the file chooser of the page.
	 */
	kind: 'button' | 'toggle' | 'choice' | 'form' | 'color' | 'file';
	/** A toggle or a choice is on, or the form has a value. */
	on?: (s: EditorState) => boolean;
	/** The tool can act; else it shows with aria-disabled. */
	enabled?: (s: EditorState) => boolean;
	/** Why the tool cannot act while `enabled` is false; none for a tool with no reason to give, such as Undo with no step. */
	reason?: string;
};

const block = (b: Block, label: string): Tool => ({ label, kind: 'choice', on: (s) => s.block === b });
const align = (a: Align, label: string): Tool => ({ label, kind: 'choice', on: (s) => s.align === a });
const mark = (m: Mark, label: string): Tool => ({ label, kind: 'toggle', on: (s) => s.marks.has(m) });
const inList = { enabled: (s: EditorState) => s.inList, reason: 'Put the caret in a list item first.' };

/** The id of a tool: each command of the field except toolbar, which is no tool. */
export type ToolId = Exclude<RichTextCommand, 'toolbar'>;

export const TOOLS = {
	undo: { label: 'Undo', kind: 'button', enabled: (s) => s.canUndo },
	redo: { label: 'Redo', kind: 'button', enabled: (s) => s.canRedo },
	paragraph: block('paragraph', 'Normal'),
	h1: block('h1', 'Heading 1'),
	h2: block('h2', 'Heading 2'),
	h3: block('h3', 'Heading 3'),
	'bullet-list': block('bullet-list', 'Bulleted list'),
	'numbered-list': block('numbered-list', 'Numbered list'),
	quote: block('quote', 'Quote'),
	'code-block': block('code-block', 'Code block'),
	bold: mark('bold', 'Bold'),
	italic: mark('italic', 'Italic'),
	underline: mark('underline', 'Underline'),
	strikethrough: mark('strikethrough', 'Strikethrough'),
	'inline-code': mark('code', 'Inline code'),
	subscript: mark('subscript', 'Subscript'),
	superscript: mark('superscript', 'Superscript'),
	link: { label: 'Link', kind: 'form', on: (s) => s.link !== null },
	'text-color': { label: 'Text color', kind: 'color', on: (s) => s.color !== null },
	'highlight-color': { label: 'Highlight', kind: 'color', on: (s) => s.highlight !== null },
	'clear-formatting': { label: 'Clear formatting', kind: 'button', enabled: (s) => s.selected, reason: 'Select text first.' },
	'align-left': align('left', 'Align left'),
	'align-center': align('center', 'Center'),
	'align-right': align('right', 'Align right'),
	'align-justify': align('justify', 'Justify'),
	outdent: { label: 'Outdent', kind: 'button', ...inList },
	indent: { label: 'Indent', kind: 'button', ...inList },
	hr: { label: 'Divider', kind: 'button' },
	picture: { label: 'Picture', kind: 'file' }
} satisfies Record<ToolId, Tool>;

/** The tool by its id, with the type of every tool. */
export const tool = (id: ToolId): Tool => TOOLS[id];
