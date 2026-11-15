// What the parts of one rich text field share (### rich-text-field in DESIGN.md). RichTextField.svelte
// owns each value and sets the context; the toolbar, the bar over selected text, the forms and the
// picture read it. So the lock has one owner, every tool runs through one function, and no callback of
// the page passes through a part.
import { createContext } from 'svelte';
import type { ColorKind, RichTextCommand, RichTextPreset } from '#lib/stack/rich-text.js';
import type { EditorState, Engine } from './engine/types.js';
import type { PaperColors } from './paper.js';
import type { ToolId } from './tools/commands.js';

/** A place for a form that is no element, such as the selected words in a field with no toolbar. */
export type FormAnchor = { getBoundingClientRect(): DOMRect };

/** The tools that open a form: the link form and the two color pickers. */
export type FormId = 'link' | 'text-color' | 'highlight-color';

export const isForm = (id: ToolId): id is FormId => id === 'link' || id === 'text-color' || id === 'highlight-color';

export type FieldContext = {
	/** The engine once it loaded; null until then and after a failure. */
	readonly engine: Engine | null;
	/** The state at the caret, or null while the text is locked or the engine loads. */
	readonly state: EditorState | null;
	/** True while the text is read-only, a request of the writing tools runs or a whole text waits. It is the one lock of the field. */
	readonly locked: boolean;
	readonly preset: RichTextPreset;
	/** The tools that are on, in any order. */
	readonly tools: readonly ToolId[];
	/** The id of the text, which the toolbar controls. */
	readonly textId: string;
	/** The text, and the element around it with position: relative, where the bars draw. */
	readonly text: HTMLElement | null;
	readonly host: HTMLElement | null;
	/** True from the first focus or pointer in the field. The tooltips and the bars mount then. */
	readonly armed: boolean;
	/**
	 * The keys of a command that are on: the keys of the page, else RICH_TEXT_KEYS, with no key of characters
	 * alone. The first one is the key that a tooltip or a menu shows; [] when the command has no key.
	 */
	keysOf(command: RichTextCommand): readonly string[];
	/** The form that is open, and the control or the place that it opens at. */
	readonly form: FormId | null;
	readonly formAt: HTMLElement | FormAnchor | null;
	/** True while a picture is selected; the bar over selected text hides then. */
	readonly pictureSelected: boolean;
	/** Runs a tool: its command, its form or the file chooser. `at` is the control that a form opens at. Nothing runs while the text is locked. */
	exec(id: ToolId, at?: HTMLElement | null): void;
	closeForm(): void;
	/** Sets the link of the selection, or removes it with null. A form that was open when the lock started writes nothing. */
	setLink(url: string | null): void;
	setColor(kind: ColorKind, hex: string | null): void;
	selectPicture(selected: boolean): void;
	/** The paper, the ink and the link where the text stands, as "#rrggbb", for a color picker in a popover outside the field. */
	paperColors(): PaperColors | null;
	/** Moves the focus back to the text, or where the field puts it while a whole text hides the text. */
	back(): void;
	/** A part of the toolbar that loads later, such as a menu or the forms, did not load. The field reports it as the kind load. */
	loadFailed(error: unknown): void;
};

export const [getField, setField] = createContext<FieldContext>();
