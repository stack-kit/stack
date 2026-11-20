// The interface of the editor of the rich text field (### rich-text-field in DESIGN.md), the state that
// the toolbar shows, and the text model that the writing tools run on. Only engine.ts implements the
// editor, with Squire, and it loads with a dynamic import. The parts of the field import only these
// types, so they stay out of the chunk of the engine.
import type { ColorKind, RichTextPreset, TextRange } from '#lib/stack/rich-text.js';
import type { ToolId } from '../tools/commands.js';

/** A mark of the text that a toggle turns on and off. */
export type Mark = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'subscript' | 'superscript' | 'code';

/** The kind of the line at the caret, which the Text style menu shows. */
export type Block = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet-list' | 'numbered-list' | 'quote' | 'code-block';

export type Align = 'left' | 'center' | 'right' | 'justify';

/** What the toolbar shows: the state at the caret, or at the start of the selection. */
export type EditorState = {
	marks: ReadonlySet<Mark>;
	/** The kind of the line, or null for one that no tool makes, such as a heading 4 of a loaded text. */
	block: Block | null;
	align: Align;
	/** The address of the link at the caret, or of the one link that the selection meets. */
	link: string | null;
	/** True when text is selected. */
	selected: boolean;
	/** True when the caret is in a list item, where Indent and Outdent act. */
	inList: boolean;
	/** The text color and the highlight at the caret, as "#rrggbb", or null. */
	color: string | null;
	highlight: string | null;
	canUndo: boolean;
	canRedo: boolean;
};

/** A change to find in the text: the words `old` in the line `block` of words(). */
export type ChangeSpot = { n: number; block: number; old: string };

/**
 * Where a change stands now: `range`, the handle of its words in the text model, such as a DOM Range of
 * the engine; its line in words(); and the place of its words in that line, in UTF-16 code units.
 */
export type FoundChange<R = Range> = { range: R; line: number; at: number };

/**
 * The text that the writing tools run on (review/writing.svelte.js), with only the members that a
 * request, a Take and the marks read. Its words are lines, as words() gives them, and `R` is the handle
 * of a part of a line: a DOM Range of the engine, or { line, from, to } of a plain text.
 */
export interface TextModel<R> {
	/** The HTML of the content through the load list, which a request carries. */
	html(): string;
	/** The lines of the content joined by "\n", which a request carries and a change counts. */
	words(): string;
	/** True when the content holds no text and no picture. */
	empty(): boolean;
	/**
	 * Where each change stands now. A change keeps the words that it marked while they stay as they were and
	 * stand once in their line; else it is found again in its line. A change that is not found is missing.
	 */
	find(changes: readonly ChangeSpot[]): Map<number, FoundChange<R>>;
	/** Puts each text in the place of its range, as one undo step. */
	replace(parts: readonly { range: R; text: string }[]): void;
	/**
	 * The whole content becomes a whole text of a result, as one undo step. `html` is that text as HTML, and
	 * `plain` is the plain text that the service gave, or null for a text that it gave as HTML. Only a field
	 * that takes a plain whole text gets a `plain` (PlainResult of review/plain.ts), and the writing tools
	 * build `html` from it with plainHtml().
	 */
	replaceAll(html: string, plain: string | null): void;
	/** Marks the words of the proposed changes, and the one change that the person looks at, outside the content. */
	mark(ranges: readonly R[], active: R | null): void;
}

/** The editor behind one interface. Only engine.ts implements it, with Squire. It is the text model of the rich text field. */
export interface Engine extends TextModel<Range> {
	/** Sets the content through the load list, with a new undo history. It fires no change. */
	load(html: string): void;
	focus(): void;
	/** Read-only: the text can be selected and copied, and no input, paste, drop or key changes it. */
	setReadonly(readonly: boolean): void;
	/** Sets an attribute of the text, such as aria-invalid. Squire hears each change of its root, so it goes through here. */
	setAttribute(name: string, value: string | null): void;
	state(): EditorState;
	/**
	 * Runs the command of a tool that acts at once: a button, a toggle or a choice, such as bold or
	 * Heading 2. A form, a color and a file are no command, and do nothing here.
	 */
	exec(tool: ToolId): void;
	/** Makes the selection a link to `url`, or removes the link with null. Only an http, https or mailto address passes. */
	setLink(url: string | null): void;
	/** The color of the selection as "#rrggbb", or none with null. Any other value does nothing. */
	setColor(kind: ColorKind, hex: string | null): void;
	/** A picture at the caret, in one undo step; null when the field does not keep the address. */
	insertPicture(src: string, width: number, height: number): HTMLImageElement | null;
	/** The width that a picture shows, with its height to the same ratio. */
	setPictureWidth(img: HTMLImageElement, width: number): void;
	/** Takes the picture out, in one undo step. */
	removePicture(img: HTMLImageElement): void;
	/** The content as it stands is one undo step, before a change that no tool makes, such as a drag of a grip. */
	saveUndo(): void;
	/** The last selection in the text as a part of words(), or null after a caret. */
	selection(): TextRange | null;
	/** The whole content becomes `html` through the load list, as one undo step. The rich text field takes no plain whole text, so the engine reads `html` only. */
	replaceAll(html: string): void;
	/** Puts the caret before the character `col` of the line `line` of words(). A line with no character keeps the caret where it is. */
	caret(line: number, col: number): void;
	/** `change`: the person changed the content. `state`: the caret, the selection or the undo history moved. `selection`: selection() changed. */
	on(event: 'change' | 'state' | 'selection', fn: () => void): () => void;
	/** Runs on each keydown in the text before the engine; true takes the key, which then stops at the text. */
	onKey(fn: (e: KeyboardEvent) => boolean): () => void;
	/** Runs with the files of a drop from outside the text and with the pictures of a paste that holds no text. */
	onFiles(fn: (files: File[]) => void): () => void;
	/** Runs with the range of a slash that a person typed at the start of an empty line or after a space, outside code. */
	onSlash(fn: (slash: Range) => void): () => void;
	/**
	 * A command that typed words ask for, such as a slash and its filter: the words of `typed` go, and the
	 * command of `tool` runs on the line, in one undo step that gives the words back. A divider takes the
	 * place of a line of its own that is empty then. null takes the words out only.
	 */
	take(typed: Range, tool: ToolId | null): void;
	destroy(): void;
}

/** The options of createEngine: the preset, the picture test, and whether the Markdown marks of typed text act now. */
export type EngineOptions = { preset: RichTextPreset; picture: (src: string) => boolean; markdown?: () => boolean };
