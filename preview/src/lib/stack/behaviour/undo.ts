// The toasts of a product ("### sonner" in DESIGN.md). A part never shows a toast by itself: the product
// shows each toast through undoToast or plainToast, so that STACK can change the toast library later.
//
// plainToast shows a text with no Undo, such as a failure that the person need not fix in place.
//
// The toast with Undo ("Cmd+Z" in the shared keys of architecture/web-app.md). While it shows, the key of
// the action 'undo' runs its undo. The binding ends when the toast goes: on Undo, on Cmd+Z, on Open, on
// its close button or a swipe (onDismiss), when its time runs out (onAutoClose or the timer of until), on
// endToast, and when a new toast with the same id takes its place. Each toast runs its undo or its onend
// once, never both: undo on Undo and Cmd+Z, and onend on every other end.
//
// The id of the product is not the id of svelte-sonner. svelte-sonner merges a new toast into the shown
// toast of its id, at the place of that toast in the stack, so a new toast in the place of a hidden toast
// stayed hidden. So each toast gets a new id of svelte-sonner. A new toast with the id of the product ends
// the shown toast of that id, and svelte-sonner shows the new one in front.
//
// Open is the cancel button of svelte-sonner, because svelte-sonner draws it before the action, so Undo
// stays last. That button removes the toast with no onDismiss, so Open ends the binding itself. The
// words of the two buttons are Undo and Open, or undoLabel and openLabel of the call, in the language
// of the product. svelte-sonner takes each label with the call, so the words come with each call.
//
// The root layout renders the Toaster of ui/sonner once. A Toaster in a page ends with the page:
// svelte-sonner then clears the timer of the toast, onAutoClose never runs, and the key stays bound
// to the undo of the old page. The timer of until is not in svelte-sonner, so it still runs.
import { toast } from 'svelte-sonner';
import { bindKey } from './keys.js';

export type UndoOptions = {
	/** Puts the change back. A function of the page. */
	undo: () => void | Promise<void>;
	/** One toast for each id: a new toast with the id takes the place of the shown one. */
	id?: string;
	/** In ms, 10000 by default ("### sonner" in DESIGN.md). Hover pauses it. until replaces it. */
	duration?: number;
	/**
	 * The time at which the toast ends, in place of duration, such as the end of the hold of a send.
	 * Hover and focus do not pause it. A time that is already past shows no toast and runs onend at once.
	 * Undo and Cmd+Z after this time run no undo: they end the toast as the timer does. Throws a RangeError
	 * for an invalid Date and for a time more than 2^31-1 ms (about 24.8 days) ahead.
	 */
	until?: Date;
	/**
	 * Runs once when the toast ends with no Undo: at the end of its time, on Open, on its close button,
	 * on a swipe, on endToast, and when a new toast with the same id takes its place. With until, the
	 * action takes effect at until whatever the end: onend means that the chance to undo ended.
	 */
	onend?: () => void;
	/**
	 * Opens the result of the change, such as with goto to the address of the group that the items moved
	 * into. A function of the page. It adds an Open button before Undo. Open ends the toast, runs onend
	 * and then open, and runs no undo. Open removes the toast with its focused button, so open moves the
	 * focus into the result, such as to its title, also when it does not change the page. Else the focus
	 * falls to the page.
	 */
	open?: () => void | Promise<void>;
	/** The word of the Undo button, in the language of the product. "Undo" by default. */
	undoLabel?: string;
	/**
	 * The word of the Open button, in the language of the product. "Open" by default. It counts only
	 * with open. The word never names the result: the text of the toast names it.
	 */
	openLabel?: string;
};

/**
 * The end of each shown toast with an id, by the id of the product. Only an event of the page adds one.
 * With dismiss true, the end also removes the toast of svelte-sonner. A callback of svelte-sonner passes
 * false, because the toast is already going.
 */
const shown = new Map<string, (dismiss: boolean) => void>();

/**
 * Ends the shown toast of the id, then shows the new toast with show and keeps its end by the id. The new
 * toast shows also when the onend of the old toast throws, and the error then goes on to the caller.
 */
function replace(id: string | undefined, show: () => (dismiss: boolean) => void): void {
	try {
		if (id !== undefined) shown.get(id)?.(true);
	} finally {
		const end = show();
		if (id !== undefined) shown.set(id, end);
	}
}

/** The longest delay that a browser timer takes: 2^31-1 ms, about 24.8 days. A longer one runs at once. */
const MAX_DELAY = 2 ** 31 - 1;

/** Shows the text with an Undo button. While the toast shows, the key of 'undo' runs o.undo too. */
export function undoToast(text: string, o: UndoOptions): void {
	const left = o.until === undefined ? undefined : o.until.getTime() - Date.now();
	if (Number.isNaN(left)) throw new RangeError('undoToast: until is an invalid Date. Give a Date with a time.');
	if (left !== undefined && left > MAX_DELAY) {
		throw new RangeError('undoToast: until is more than 2^31-1 ms (about 24.8 days) ahead. Give a nearer time.');
	}
	if (left !== undefined && left <= 0) {
		try {
			if (o.id !== undefined) endToast(o.id);
		} finally {
			o.onend?.();
		}
		return;
	}
	replace(o.id, () => {
		let ended = false;
		let unbind: (() => void) | null = null;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let sonnerId: string | number = '';
		// The first end counts and returns true. Each later call does nothing and returns false, so an
		// Undo during the exit of the toast runs no undo after onend.
		const finish = (): boolean => {
			if (ended) return false;
			ended = true;
			unbind?.();
			unbind = null;
			clearTimeout(timer);
			if (o.id !== undefined && shown.get(o.id) === end) shown.delete(o.id);
			return true;
		};
		// The toast goes before onend runs, so an onend that throws leaves no toast behind. after runs
		// once onend has run, also when onend throws. It returns true for the first end.
		const end = (dismiss: boolean, after?: () => void): boolean => {
			if (!finish()) return false;
			if (dismiss) toast.dismiss(sonnerId);
			try {
				o.onend?.();
			} finally {
				after?.();
			}
			return true;
		};
		const run = () => {
			// A late timer (a background tab, a sleeping laptop) must not leave an Undo after until.
			if (o.until !== undefined && Date.now() >= o.until.getTime()) {
				end(true);
				return;
			}
			if (!finish()) return;
			toast.dismiss(sonnerId);
			void o.undo();
		};
		// Open ends the toast and the binding as endToast does, then opens the result. An Open during the
		// exit of the toast runs no open, as an Undo then runs no undo.
		const openResult = () => {
			end(true, () => void o.open?.());
		};
		sonnerId = toast(text, {
			// With until, svelte-sonner runs no timer of its own, so hover does not pause the end.
			duration: left === undefined ? (o.duration ?? 10000) : Number.POSITIVE_INFINITY,
			...(o.open === undefined ? {} : { cancel: { label: o.openLabel ?? 'Open', onClick: openResult } }),
			action: { label: o.undoLabel ?? 'Undo', onClick: run },
			onDismiss: () => end(false),
			onAutoClose: () => end(false)
		});
		unbind = bindKey('undo', run);
		if (left !== undefined) {
			timer = setTimeout(() => end(true), left);
		}
		return end;
	});
}

export type PlainOptions = {
	/** One toast for each id: a new toast with the id takes the place of the shown one, also of an Undo toast. */
	id?: string;
	/** In ms. The duration of the Toaster by default. Hover pauses it. */
	duration?: number;
	/** Adds the icon of the kind, such as 'error' for a failure. The text names the kind too. */
	kind?: 'success' | 'info' | 'warning' | 'error';
	/** A second line under the text, such as the next step after a failure. */
	description?: string;
	/** Makes a screen reader read the toast at once, in place of after the current speech. */
	important?: boolean;
};

/**
 * Shows the text with no Undo, such as "The card did not move. The service did not answer." An Undo toast
 * with the same id ends as a new Undo toast ends it: its onend runs, and its Undo and its key go.
 */
export function plainToast(text: string, o: PlainOptions = {}): void {
	replace(o.id, () => {
		let sonnerId: string | number = '';
		const end = (dismiss: boolean) => {
			if (o.id !== undefined && shown.get(o.id) === end) shown.delete(o.id);
			if (dismiss) toast.dismiss(sonnerId);
		};
		sonnerId = (o.kind === undefined ? toast : toast[o.kind])(text, {
			...(o.duration === undefined ? {} : { duration: o.duration }),
			...(o.description === undefined ? {} : { description: o.description }),
			...(o.important === undefined ? {} : { important: o.important }),
			onDismiss: () => end(false),
			onAutoClose: () => end(false)
		});
		return end;
	});
}

/**
 * Ends the shown toast of the id, of undoToast or of plainToast, such as when the action of an Undo toast
 * took effect before its time. An Undo toast runs its onend, and the key of 'undo' no longer runs its
 * undo. With no shown toast of the id, it does nothing.
 */
export function endToast(id: string): void {
	shown.get(id)?.(true);
}
