// The width of a chart of a screen page in print ("### A screen page in print" in ## Print of
// DESIGN.md). LayerChart draws each chart svg at the size in px that it measured on the screen, and it
// writes that size on the boxes around the svg too. It measures again only in a ResizeObserver, which
// does not run in the print layout. So a chart whose column is narrower on the paper kept its screen
// width and reached past the paper.
//
// A listener of beforeprint calls fitChartsToColumns(): each chart svg takes a viewBox of its size on
// the screen, and the svg and its boxes fill the box of the chart. The drawing then shrinks to the
// width of its column, with its marks and its text. This is the fallback, because the column has no
// print width yet in beforeprint.
//
// The listener of beforeprint also makes a matchMedia('print') query, and its change listener runs in
// the print layout. A query made then is the newest of the page, so its listener runs after the
// listeners of the other queries, such as the breakpoint of a sidebar, and reads the final layout. It
// calls measureCharts() between restoreChartSizes() and fitChartsToColumns(). measureCharts() writes
// the width and the height of each registered chart root, at most the width on the screen, into the
// state of its chart, and flushes Svelte. The chart draws again at that width with its text at its own
// size. The fit after it changes nothing on a chart that drew again. A listener of afterprint calls
// restoreChartSizes() and restoreChartWidths(), which gives each chart its size on the screen back.
//
// Each chart binds its context and registers it with registerChart() in an $effect.
import { flushSync } from 'svelte';

/** The part of the ChartState of LayerChart 2.7.0 that measureCharts reads and writes. */
type ChartSize = { containerRef?: HTMLElement; _containerWidth: number; _containerHeight: number };
/** The charts of the page. Each chart registers the context that it binds. */
const charts = new Set<ChartSize>();
/** The size of each chart on the screen, from before the first redraw of a print. */
let screenSizes: [ChartSize, number, number][] = [];

/**
 * A chart calls it with the context that it binds, in an $effect that returns the result:
 * `$effect(() => (context ? registerChart(context) : undefined));`
 */
export function registerChart(context: ChartSize): () => void {
	charts.add(context);
	return () => charts.delete(context);
}

/**
 * Draws each registered chart again at the size of its root in the current layout, before the function
 * returns. A root reads at most the width of the drawing before it, so a chart never grows past its size
 * on the screen: a full-width chart of the chart page grew to the paper of 794 px with no margin, and its
 * last axis label printed past the paper (measured).
 */
export function measureCharts(): void {
	flushSync();
	if (!screenSizes.length) screenSizes = [...charts].map((c) => [c, c._containerWidth, c._containerHeight]);
	const known = new Set<Element>();
	for (const chart of charts) {
		const root = chart.containerRef;
		if (!root?.isConnected) continue;
		known.add(root);
		const width = Number(root.querySelector('svg.lc-layout-svg')?.getAttribute('width'));
		const cap = width > 0 && !root.style.maxWidth;
		if (cap) root.style.maxWidth = `${width}px`;
		chart._containerWidth = root.clientWidth;
		chart._containerHeight = root.clientHeight;
		if (cap) root.style.removeProperty('max-width');
	}
	flushSync();
	const missing = [...document.querySelectorAll('.lc-root-container')].filter((root) => !known.has(root)).length;
	if (missing) console.warn(`measureCharts: ${missing} chart roots have no registered context. Bind the context of each chart and call registerChart(context) in an $effect. Until then, such a chart shrinks to its column in print, with its text.`);
}

/**
 * Gives each chart its size on the screen back. Its ResizeObserver does not report that size again,
 * because it reports a size only when the size differs from its last report, which is from the screen
 * before the print. A chart that read its width in afterprint kept a size from the print (measured).
 */
export function restoreChartWidths(): void {
	for (const [chart, width, height] of screenSizes) {
		chart._containerWidth = width;
		chart._containerHeight = height;
	}
	screenSizes = [];
}

/** The inline values that fitChartsToColumns replaced, so that restoreChartSizes puts them back. */
let changed: { el: HTMLElement | SVGElement; props: [name: string, value: string, priority: string][] }[] = [];
/** The svgs that took a viewBox from fitChartsToColumns. */
let boxed: SVGSVGElement[] = [];

function setSize(el: HTMLElement | SVGElement, values: Record<string, string>): void {
	changed.push({
		el,
		props: Object.keys(values).map((name) => [name, el.style.getPropertyValue(name), el.style.getPropertyPriority(name)])
	});
	for (const [name, value] of Object.entries(values)) el.style.setProperty(name, value, 'important');
}

/** Removes the viewBox of fitChartsToColumns and gives each box its size back. A second call does nothing. */
export function restoreChartSizes(): void {
	for (const svg of boxed) {
		svg.removeAttribute('viewBox');
		svg.removeAttribute('preserveAspectRatio');
	}
	for (const { el, props } of changed) {
		for (const [name, value, priority] of props) {
			if (value) el.style.setProperty(name, value, priority);
			else el.style.removeProperty(name);
		}
		if (!el.getAttribute('style')) el.removeAttribute('style');
	}
	changed = [];
	boxed = [];
}

/**
 * Lets each chart svg of the page shrink to the width of its column in print. It restores the sizes
 * of an earlier call first, so a second beforeprint with no afterprint changes each box once.
 */
export function fitChartsToColumns(): void {
	restoreChartSizes();
	const done = new Set<Element>();
	for (const root of document.querySelectorAll<HTMLElement>('.lc-root-container')) {
		for (const svg of root.querySelectorAll<SVGSVGElement>('svg.lc-layout-svg')) {
			const width = Number(svg.getAttribute('width'));
			const height = Number(svg.getAttribute('height'));
			if (!(width > 0 && height > 0) || svg.hasAttribute('viewBox')) continue;
			// The drawing keeps the top left corner of its box, where it stands on the screen.
			svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
			svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
			boxed.push(svg);
			setSize(svg, { width: '100%', height: '100%', 'max-width': `${width}px`, 'max-height': `${height}px` });
			// LayerChart puts the svg in boxes with a top, a left, a width and a height in px.
			for (let box = svg.parentElement; box && box !== root && !done.has(box); box = box.parentElement) {
				done.add(box);
				setSize(box, { top: '0', left: '0', width: '100%', height: '100%' });
			}
		}
	}
	if (!boxed.length && document.querySelector('[data-slot="chart"] svg')) console.warn('fitChartsToColumns: a chart is on the page, but no svg.lc-layout-svg in a .lc-root-container. The chart keeps its screen width in print.');
}
