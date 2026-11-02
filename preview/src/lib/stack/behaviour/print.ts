// A screen page in print ("### A screen page in print" in DESIGN.md). listenForPrint adds the listeners
// of beforeprint and afterprint that the page needs: the width bands take the column of the paper, the
// page prints in light mode, the marks of each chart pattern become shapes, and each chart fits its
// column. Call it once, in onMount of the root layout, and return its result.
//
// A chart of a product registers the context that it binds, as the charts of STACK do:
//   $effect(() => (context ? registerChart(context) : undefined));
import { setPrinting } from '../screen-query.svelte.js';
import { fitChartsToColumns, measureCharts, restoreChartSizes, restoreChartWidths } from '#lib/print/chart-width.js';
import { drawFillsAsShapes, restoreFills } from '#lib/print/pattern-fills.js';

export { registerChart } from '#lib/print/chart-width.js';

/** The end of the listeners, while they listen. A second call gives the same end and adds no listener. */
let listening: (() => void) | null = null;

/** Adds the print listeners and returns the function that removes them. */
export function listenForPrint(): () => void {
	if (listening) return listening;
	const root = document.documentElement;
	let wasDark = false;
	let prev = '';
	let printQuery: MediaQueryList | undefined;
	// The query is made in beforeprint, so it is the newest query of the page, and its listener runs in
	// the print layout after the listener of every other query.
	const inPrintLayout = (event: MediaQueryListEvent) => {
		if (!event.matches) return;
		restoreFills();
		restoreChartSizes();
		measureCharts();
		fitChartsToColumns();
		drawFillsAsShapes();
	};
	const before = () => {
		setPrinting(true);
		// Only the first beforeprint of a print reads the mode. A second one before afterprint finds the
		// light page, and afterprint would then leave a dark page light.
		if (printQuery === undefined) {
			wasDark = root.classList.contains('dark');
			prev = root.style.colorScheme;
		}
		root.classList.remove('dark');
		root.style.colorScheme = 'light';
		drawFillsAsShapes();
		fitChartsToColumns();
		printQuery?.removeEventListener('change', inPrintLayout);
		printQuery = matchMedia('print');
		printQuery.addEventListener('change', inPrintLayout);
	};
	const after = () => {
		setPrinting(false);
		printQuery?.removeEventListener('change', inPrintLayout);
		printQuery = undefined;
		restoreFills();
		restoreChartSizes();
		restoreChartWidths();
		root.style.colorScheme = prev;
		if (wasDark) {
			root.classList.add('dark');
			root.style.colorScheme = 'dark';
		}
	};
	addEventListener('beforeprint', before);
	addEventListener('afterprint', after);
	const end = () => {
		if (listening !== end) return;
		removeEventListener('beforeprint', before);
		removeEventListener('afterprint', after);
		printQuery?.removeEventListener('change', inPrintLayout);
		printQuery = undefined;
		listening = null;
	};
	listening = end;
	return end;
}
