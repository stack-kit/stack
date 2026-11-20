// The fold of a long activity ("Variants" of ### item in DESIGN.md): a stretch of more than 8 lines
// shows its last 3, and a button before them shows the rest. ActivityLines folds its lines with it, and
// CommentList, a mail thread and Conversation place ActivityLines. The package exports no path to this file.

/** The most lines of a stretch that show whole, and the lines that a longer stretch shows. */
const FOLD_OVER = 8;
const FOLD_SHOWS = 3;

/** A stretch of lines in the order of their time, after the fold. */
export type Folded<T> = {
	/**
	 * The lines before the last 3 of a stretch that folds, which the button shows and hides. None for a
	 * stretch of 8 lines or fewer, which shows no button. The part keeps them in the page, so that they print.
	 */
	earlier: T[];
	/** The lines that show at all times: the last 3 of a stretch that folds, or every line. */
	last: T[];
	/** The count of the lines that the screen hides: the earlier lines while the fold is closed, and 0 while it is open. */
	hidden: number;
};

/** Folds a stretch of lines in the order of their time. open is true after the person showed the earlier lines. */
export function fold<T>(lines: readonly T[], open: boolean): Folded<T> {
	if (lines.length <= FOLD_OVER) return { earlier: [], last: [...lines], hidden: 0 };
	const earlier = lines.slice(0, -FOLD_SHOWS);
	return { earlier, last: lines.slice(-FOLD_SHOWS), hidden: open ? 0 : earlier.length };
}
