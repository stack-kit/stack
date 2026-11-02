import { flushSync } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';

// A width query of a component that picks its layout in script ("### A screen page in print" in
// ## Print of DESIGN.md). On the screen it answers as MediaQuery of svelte/reactivity. From
// beforeprint to afterprint it answers as the query does at a viewport of PRINT_COLUMN px.
//
// Chromium counts the pages of a print before the change listeners of the print layout run. A
// MediaQuery answers the width of the paper only in those listeners, so Svelte swapped in the phone
// markup after the count, and Chromium kept the page count of the desktop markup: the board of an
// example printed 3 pages, and 2 of them were blank (measured). So the listener of beforeprint sets
// the print answer and calls flushSync(), and the layout of the column is in place before Chromium
// lays out the print. The CSS takes the real width of the paper, so on paper whose column reaches
// 768 px, such as A4 landscape, the CSS can take md: while the script takes the phone layout.
//
// The module adds its listeners when it loads. Chromium runs the listeners of the window in the order
// that they were added, and the capture phase does not change that order (measured in Chromium 148).
// So a print listener that reads the layout calls setPrinting() first (listenForPrint of
// behaviour/print.ts does), and the layout of the column is in place before it draws the fills and
// fits the charts, whatever the order of the imports. In afterprint the layout of the screen comes
// back first, and the listener of behaviour/print.ts then gives each chart its size on the screen back.

/**
 * The column of A4 portrait with the margins of `### Paper`, in CSS px. The text box is 174 mm, and
 * Chromium lays it out 658 px wide (measured with `page.pdf()`).
 */
export const PRINT_COLUMN = 658;

/** The size of 1rem in a media query: the initial font size of the browser, 16 px by default. */
const REM = 16;

/** One width feature, in parentheses or not: min-width or max-width, or the range syntax. */
const WIDTH = /^(?:(min|max)-width\s*:|width\s*(<=|>=|<|>))\s*(\d+(?:\.\d+)?)(px|rem)$/;

/**
 * The answer of the query at a viewport of PRINT_COLUMN px. Throws for a query that is not one width feature.
 * @param {string} query
 * @returns {boolean}
 */
function atPrintColumn(query) {
	const trimmed = query.trim();
	const feature = WIDTH.exec(/^\((.*)\)$/.exec(trimmed)?.[1]?.trim() ?? trimmed);
	if (!feature) {
		throw new Error(
			`ScreenQuery reads one width feature in px or rem, such as "min-width: 768px", "max-width: 767px" or "(width < 48rem)", and "${query}" is not one. Use MediaQuery of svelte/reactivity for a query that is not about the width, such as "prefers-reduced-motion: reduce". For a band of widths, use two ScreenQuery, such as "md.current && !lg.current".`
		);
	}
	const [, minMax, range, value, unit] = feature;
	const px = Number(value) * (unit === 'rem' ? REM : 1);
	switch (minMax ?? range) {
		case 'min':
		case '>=':
			return PRINT_COLUMN >= px;
		case 'max':
		case '<=':
			return PRINT_COLUMN <= px;
		case '>':
			return PRINT_COLUMN > px;
		default:
			return PRINT_COLUMN < px;
	}
}

let printing = $state(false);

/**
 * Sets the print answer of every ScreenQuery and applies it at once. A print listener that reads the
 * layout calls it first, so the order of the listeners and of the imports does not matter.
 * @param {boolean} on
 * @returns {void}
 */
export function setPrinting(on) {
	if (printing === on) return;
	printing = on;
	flushSync();
}

/**
 * True from beforeprint to afterprint. A state that the person can change and that follows a
 * ScreenQuery, such as an open sidebar, keeps its value across a print in this form:
 *
 *   const wide = new ScreenQuery('min-width: 1024px');
 *   let lastScreen = wide.current;
 *   const screenWide = $derived(isPrinting() ? lastScreen : (lastScreen = wide.current));
 *   let sidebarOpen = $derived(screenWide);
 *   // bind:open={() => (isPrinting() ? wide.current : sidebarOpen), (v) => (sidebarOpen = v)}
 *
 * sidebarOpen computes again only when screenWide changes, and a print does not change it.
 * A single $derived that reads isPrinting() resets the choice after each print.
 * @returns {boolean}
 */
export function isPrinting() {
	return printing;
}

// The server has no window, and with ssr on a page renders there first.
if (typeof window !== 'undefined') {
	addEventListener('beforeprint', () => setPrinting(true));
	addEventListener('afterprint', () => setPrinting(false));
}

/**
 * A width query that a component reads in script to pick its layout, in place of MediaQuery:
 * `const wide = new ScreenQuery('min-width: 768px');`. Its print answer comes from the query, so no
 * call site passes it.
 */
export class ScreenQuery {
	/** @readonly @type {MediaQuery} */
	#screen;
	/** @readonly @type {boolean} */
	#print;

	/** @param {string} query One width feature in px or rem, such as "min-width: 768px" or "(width < 48rem)". */
	constructor(query) {
		this.#print = atPrintColumn(query);
		this.#screen = new MediaQuery(query);
	}

	/** @returns {boolean} */
	get current() {
		// The query of the screen is read in print too, so that its listener stays.
		const screen = this.#screen.current;
		return printing ? this.#print : screen;
	}
}
