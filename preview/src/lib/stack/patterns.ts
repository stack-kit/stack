// The chart patterns of DESIGN.md (`chart-patterns`) and the geometry that draws them.
// Category n of a chart takes the pattern `pattern-n` in the pattern style, the default: marks in
// `chart-ink` on the ground under the chart. The color pattern style draws the same patterns in
// `chart-n`, with thicker marks where the pattern style draws them thin (see `styledPattern`), and the
// color style fills the shape with the solid color `chart-n`.
//
// Geometry, in SVG user units (1 unit is 1 px at 1x):
// - The tile is square with side `pitch`, the distance from the center of one mark to the
//   center of the next. `stagger` doubles the tile height for a second row.
// - `lines`: one line parallel to the y axis, so angle 0 draws vertical lines. `angle` turns the
//   whole tiling clockwise through `patternTransform`, so 45 leans like `/`. The tile is drawn
//   here and never with the `lines` option of the LayerChart Pattern, which cannot draw an angle.
// - `cross`: the same line plus a second line at angle + 90.
// - `dots`: one circle of diameter `width`. `squares`: one square of side `width`.
// - The center of a line or a mark comes from `lineCenter`, so its edges fall on whole pixels.
// - With `stagger`, the second row moves by half a pitch in x. Its mark is drawn at both
//   vertical tile edges, because the tile clips its content.
import { chartPatterns, spacing, themeFallbacks, type ChartPattern } from './design-values.js';

export type { ChartPattern };

/** A category of a chart. The category at index i takes `pattern-(i+1)`, or `chart-(i+1)` in the color style. */
export type Category = { key: string; label: string };

/**
 * The style of a chart: `pattern`, the default (patterns in chart-ink), `color-pattern` (patterns
 * in chart-n) or `color` (solid chart-n). A product takes one as its default, and a person may pick one.
 */
export type ChartStyle = 'pattern' | 'color-pattern' | 'color';

/** The ground under a chart. Every style draws its 1 px gaps in it. */
export type ChartGround = 'background' | 'card' | 'popover';

/** The patterns in category order: PATTERNS[0] is pattern-1. */
export const PATTERNS: ChartPattern[] = Object.keys(chartPatterns).map(
	(_, i) => chartPatterns[`pattern-${i + 1}`]!
);

/** The side of the legend tile in px (`spacing.legend-tile`). */
export const LEGEND_TILE = Number.parseFloat(spacing['legend-tile']!);

/**
 * The center of a line or a mark of `width` in a tile of `pitch`: on a half unit when the width
 * is odd, on a whole unit when it is even. Pitch 4 and width 1 give 2.5, so the line covers one
 * whole pixel at 1x. At 2 it would cover two pixels at half strength.
 */
export function lineCenter(pitch: number, width: number): number {
	return Math.floor(pitch / 2) + (width % 2) / 2;
}

/** The id prefix of the patterns of one chart, from `$props.id()` of the component that owns them. */
export function patternPrefix(uid: string): string {
	return `p${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** The `url()` paint of pattern n (1-based) under a prefix. */
export function patternUrl(prefix: string, n: number): string {
	return `url(#${prefix}-pattern-${n})`;
}

// A theme may lack an added role. The value then falls back as `theme-fallbacks` says.
function token(name: string): string {
	const fallback = themeFallbacks[name];
	if (fallback === undefined) return `var(--${name})`;
	return `var(--${name}, ${fallback.startsWith('oklch(') ? fallback : `var(--${fallback})`})`;
}

/** The color of category n (1-based). */
export function chartColor(n: number): string {
	return token(`chart-${n}`);
}

/** The color of the pattern marks and of the leader lines of a donut. */
export const CHART_INK = token('chart-ink');

/** The hue of a heat map in the two color styles. */
export const CHART_HEAT = token('chart-heat');

/**
 * The opacity of each of the five steps of a heat map, from the smallest count to the largest
 * (DESIGN.md, `### Heat map`).
 */
export const HEAT_STEPS = [0.5, 0.62, 0.75, 0.88, 1];

/** The color of a heat map: chart-ink in the pattern style, chart-heat in the two color styles. */
export function heatColor(style: ChartStyle): string {
	return style === 'pattern' ? CHART_INK : CHART_HEAT;
}

/** The fill of category n (1-based): its pattern in the two pattern styles, its color in the color style. */
export function categoryFill(style: ChartStyle, prefix: string, n: number): string {
	return style === 'color' ? chartColor(n) : patternUrl(prefix, n);
}

/** The paint of the marks of pattern n (1-based): chart-n in the color pattern style, else chart-ink. */
export function markColor(style: ChartStyle, n: number): string {
	return style === 'color-pattern' ? chartColor(n) : CHART_INK;
}

/** The least width of a mark in the color pattern style, by type (DESIGN.md, `### Patterns`). */
const COLOR_PATTERN_WIDTH: Record<ChartPattern['type'], number> = { lines: 2, cross: 2, dots: 3, squares: 3 };

/**
 * Pattern p as a style draws it. The pattern style draws p as it is. A mark in chart-n has little
 * margin over its 3:1 pair, and a thin mark mixes with the ground where the browser resamples the
 * tile, so the color pattern style draws each line at least 2 px wide and each dot or square at
 * least 3 px wide.
 */
export function styledPattern(style: ChartStyle, p: ChartPattern): ChartPattern {
	if (style !== 'color-pattern') return p;
	return { ...p, width: Math.max(p.width, COLOR_PATTERN_WIDTH[p.type]) };
}

/** The ground under a chart as a paint. */
export function groundColor(ground: ChartGround): string {
	return `var(--${ground})`;
}

/** The stroke of a line of a chart: its paint, its width, its dashes and the shape of its ends. */
export type LineLook = { stroke: string; width: number; dash?: string; cap: 'round' | 'butt' };

/**
 * The line of category n (1-based) of a line chart, an area or a sparkline (DESIGN.md, `### Line
 * chart`). A line has no area to fill, so its stroke takes the place of a pattern: line 1 is solid
 * and 2 px wide, and line 2 is dotted, with dots of 3 px whose centers are 6 px apart. The color is
 * chart-ink in the pattern style and chart-n in the two color styles. Line 2 is dotted in every
 * style, because two lines can cross, and where they cross a color alone does not tell them apart.
 */
export function lineLook(style: ChartStyle, n: number): LineLook {
	const stroke = style === 'pattern' ? CHART_INK : chartColor(n);
	if (n === 2) return { stroke, width: 3, dash: '0 6', cap: 'round' };
	return { stroke, width: 2, cap: 'round' };
}

/**
 * The line of the previous period: dashes of 6 px with gaps of 4 px, 2 px wide, in muted-foreground
 * in every style. No category takes a dash or muted-foreground, so the comparison never looks like
 * a category.
 */
export const COMPARISON_LOOK: LineLook = { stroke: 'var(--muted-foreground)', width: 2, dash: '6 4', cap: 'butt' };

/** A line look as the props of a LayerChart mark, which maps `strokeWidth` and passes the rest on to the `<path>`. */
export function markProps(look: LineLook) {
	return {
		stroke: look.stroke,
		strokeWidth: look.width,
		fill: 'none',
		'stroke-dasharray': look.dash,
		'stroke-linecap': look.cap,
		'stroke-linejoin': 'round' as const
	};
}

/** A line look as the attributes of a plain SVG element. */
export function strokeAttributes(look: LineLook) {
	return {
		stroke: look.stroke,
		'stroke-width': look.width,
		'stroke-dasharray': look.dash,
		'stroke-linecap': look.cap
	};
}

/** The paint of a reference line: a crisp 1 px line in muted-foreground in every style. */
export const REFERENCE_STROKE = 'var(--muted-foreground)';

/** The most reference lines and annotations that one chart holds. */
export const MAX_REFERENCES = 4;
export const MAX_ANNOTATIONS = 9;

/**
 * The three ticks of a value axis: 0, the middle and the maximum. The maximum is the largest value
 * rounded up to a whole number of units. The unit is a fifth of the power of ten of the largest
 * value, and 2 below 10, so the middle is a whole number: 138 gives 140, 101 gives 120, 7 gives 8.
 */
export function threeTicks(largest: number): [number, number, number] {
	if (!(largest > 0)) return [0, 1, 2];
	const power = 10 ** Math.floor(Math.log10(largest));
	const unit = power >= 10 ? power / 5 : power * 2;
	const max = Number((Math.ceil(largest / unit) * unit).toPrecision(12));
	return [0, max / 2, max];
}
