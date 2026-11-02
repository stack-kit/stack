// The toast with Undo ("### sonner" in DESIGN.md, and "Cmd+Z" in the shared keys of
// architecture/web-app.md). One svelte-sonner toast for each id. While it shows, the key of the action
// 'undo' runs its undo. The binding ends when the toast goes: on Undo, on Cmd+Z, on its close button or
// a swipe (onDismiss), and when its time runs out (onAutoClose). A new toast with the same id takes the
// place of the old one, and ends the binding of the old one.
//
// The root layout renders the Toaster of ui/sonner once. A Toaster in a page ends with the page:
// svelte-sonner then clears the timer of the toast, onAutoClose never runs, and the key stays bound
// to the undo of the old page.
import { toast } from 'svelte-sonner';
import { bindKey } from './keys.js';

export type UndoOptions = {
	/** Puts the change back. A function of the page. */
	undo: () => void | Promise<void>;
	/** One toast for each id: a new toast with the id takes the place of the shown one. */
	id?: string;
	/** In ms, 10000 by default ("### sonner" in DESIGN.md). */
	duration?: number;
};

/** The end of the binding of each shown toast, by its id. Only an event of the page adds one. */
const shown = new Map<string | number, () => void>();

/** Shows the text with an Undo button. While the toast shows, the key of 'undo' runs o.undo too. */
export function undoToast(text: string, o: UndoOptions): void {
	if (o.id !== undefined) shown.get(o.id)?.();
	let unbind: (() => void) | null = null;
	let id: string | number = '';
	const end = () => {
		unbind?.();
		unbind = null;
		if (shown.get(id) === end) shown.delete(id);
	};
	const run = () => {
		end();
		toast.dismiss(id);
		void o.undo();
	};
	id = toast(text, {
		...(o.id === undefined ? {} : { id: o.id }),
		duration: o.duration ?? 10000,
		action: { label: 'Undo', onClick: run },
		onDismiss: end,
		onAutoClose: end
	});
	unbind = bindKey('undo', run);
	shown.set(id, end);
}
