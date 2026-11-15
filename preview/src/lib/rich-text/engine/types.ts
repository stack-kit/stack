// The interface of the editor of the rich text field (### rich-text-field in DESIGN.md), and the state
// that the toolbar shows. Only engine.ts implements it, with Squire, and it loads with a dynamic import.
// The parts of the field import only these types, so they stay out of the chunk of the engine.
import type { ColorKind, TextRange } from '#lib/stack/rich-text.js';
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

/** Where a change stands now: its words, its line in words(), and the place of its words in that line, in UTF-16 code units. */
export type FoundChange = { range: Range; line: number; at: number };

/** The editor behind one interface. Only engine.ts implements it, with Squire. */
export interface Engine {
	/** Sets the content through the load list, with a new undo history. It fires no change. */
	load(html: string): void;
	/** The HTML of the content, through the load list. */
	html(): string;
	words(): string;
	/** True when the content holds no text and no picture. */
	empty(): boolean;
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
	/**
	 * Where each change stands now. A change keeps the words that it marked while they stay as they were and
	 * stand once in their line; else it is found again in its line. A change that is not found is missing.
	 */
	find(changes: readonly ChangeSpot[]): Map<number, FoundChange>;
	/** Puts each text in the place of its range, as one undo step. */
	replace(parts: readonly { range: Range; text: string }[]): void;
	/** The whole content becomes `html` through the load list, as one undo step. */
	replaceAll(html: string): void;
	/** Marks the words of the proposed changes, and the one change that the person looks at, outside the content. */
	mark(ranges: readonly Range[], active: Range | null): void;
	/** `change`: the person changed the content. `state`: the caret, the selection or the undo history moved. `selection`: selection() changed. */
	on(event: 'change' | 'state' | 'selection', fn: () => void): () => void;
	/** Runs on each keydown in the text before the engine; true takes the key, which then stops at the text. */
	onKey(fn: (e: KeyboardEvent) => boolean): () => void;
	/** Runs with the files of a drop from outside the text and with the pictures of a paste that holds no text. */
	onFiles(fn: (files: File[]) => void): () => void;
	destroy(): void;
}
