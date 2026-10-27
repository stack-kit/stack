// The pattern fills of a screen page as shapes in print ("### A screen page in print" in ## Print of
// DESIGN.md). Chromium writes a <pattern> fill into a PDF as an image of 72 dpi, so a 1 px line of
// patterns 1, 5 and 7 prints gray. A listener of beforeprint calls drawFillsAsShapes(), and a listener
// of afterprint calls restoreFills(). The chart library draws the shapes, so the page reads each shape
// that paints with a chart pattern from the DOM: in front of the shape it draws the marks of
// marks.ts, in a clip path of a copy of the shape, and it sets the fill of the shape to none. The
// marks stand in the user space of the shape, where the tiles of the pattern stand, and the edge of
// the shape stays over them. A pattern of StackPatternDefs names its number in data-pattern. A printed
// chart takes the pattern style, so the marks never take crispEdges. The hatch of a meter names its
// number too, and it keeps the marks of the color pattern style in muted-foreground: its pattern names
// that style in data-pattern-style and that ink in data-pattern-ink.
import { PATTERNS, markColor, styledPattern } from '#lib/stack/patterns.js';
import { patternMarks, type Mark } from './marks.js';

const SVG = 'http://www.w3.org/2000/svg';
/** The <defs> and the outer <g> that drawFillsAsShapes adds carry this attribute, so that restoreFills finds them. */
const ADDED = 'data-print-marks';
/** The shapes whose fill is none, with their inline fill from before. */
let changed: { shape: SVGGeometryElement; fill: string; priority: string }[] = [];
/** The number of the last clip path, so that no two clip paths share an id. */
let clips = 0;

function svgElement(tag: string, attributes: Record<string, string | number | undefined>): SVGElement {
	const el = document.createElementNS(SVG, tag);
	for (const [name, value] of Object.entries(attributes)) if (value !== undefined) el.setAttribute(name, String(value));
	return el;
}

/** The chart pattern that the computed fill of a shape points to, or null for any other fill. */
function chartPattern(shape: SVGGeometryElement): SVGPatternElement | null {
	const id = /^url\("?#([^")]+)"?\)$/.exec(getComputedStyle(shape).fill)?.[1];
	const pattern = id ? document.getElementById(id) : null;
	return pattern instanceof SVGPatternElement && pattern.dataset.pattern ? pattern : null;
}

/** The marks as the data of one path: a line, a circle or a square for each mark. */
function pathData(marks: Mark[]): string {
	// The ends of a line lie outside the shape, so two decimals lose nothing.
	const r = (v: number) => Math.round(v * 100) / 100;
	return marks
		.map((m) => {
			if (m.kind === 'line') return `M${r(m.x1)} ${r(m.y1)}L${r(m.x2)} ${r(m.y2)}`;
			if (m.kind === 'circle') return `M${m.cx - m.r} ${m.cy}a${m.r} ${m.r} 0 1 0 ${2 * m.r} 0a${m.r} ${m.r} 0 1 0 ${-2 * m.r} 0Z`;
			return `M${m.x} ${m.y}h${m.size}v${m.size}h${-m.size}Z`;
		})
		.join('');
}

/**
 * The marks of pattern p over a box, as paths. The lines of each direction take their own path:
 * the crossing strokes of one path drew dark seams on the screen of Chromium (measured on pattern 3).
 */
function markPaths(p: ReturnType<typeof styledPattern>, ink: string, box: DOMRect): SVGElement[] {
	const marks = patternMarks(p, box);
	if (p.type === 'dots' || p.type === 'squares') return [svgElement('path', { d: pathData(marks), fill: ink })];
	const along = marks.filter((m) => m.kind === 'line' && m.x1 === m.x2);
	const across = marks.filter((m) => m.kind === 'line' && m.x1 !== m.x2);
	return [along, across]
		.filter((set) => set.length)
		.map((set) =>
			svgElement('path', {
				d: pathData(set),
				fill: 'none',
				stroke: ink,
				'stroke-width': p.width
			})
		);
}

/** Removes the marks of drawFillsAsShapes and gives each shape its fill back. A second call does nothing. */
export function restoreFills(): void {
	for (const node of document.querySelectorAll(`[${ADDED}]`)) node.remove();
	for (const { shape, fill, priority } of changed) {
		if (fill) shape.style.setProperty('fill', fill, priority);
		else shape.style.removeProperty('fill');
		if (!shape.getAttribute('style')) shape.removeAttribute('style');
	}
	changed = [];
}

/**
 * Draws the marks of each chart pattern fill of the page as shapes. It restores the fills of an
 * earlier call first, so a second beforeprint with no afterprint draws each mark once.
 */
export function drawFillsAsShapes(): void {
	restoreFills();
	const shapes = [...document.querySelectorAll<SVGGeometryElement>('svg :is(path, rect, circle, ellipse, polygon)')];
	const defsOf = new Map<SVGSVGElement, SVGElement>();
	for (const shape of shapes) {
		if (shape.closest(`clipPath, pattern, mask, [${ADDED}]`)) continue;
		const pattern = chartPattern(shape);
		const owner = shape.ownerSVGElement;
		if (!pattern || !owner) continue;
		const n = Number(pattern.dataset.pattern);
		const base = PATTERNS[n - 1];
		if (!base) continue;
		const p = styledPattern(pattern.dataset.patternStyle === 'color-pattern' ? 'color-pattern' : 'pattern', base);
		const ink = pattern.dataset.patternInk ?? markColor('pattern', n);

		let defs = defsOf.get(owner);
		if (!defs) {
			defs = svgElement('defs', { [ADDED]: '' });
			owner.append(defs);
			defsOf.set(owner, defs);
		}
		// The clip path holds a copy of the shape in the user space of its parent, with the transform
		// of the shape.
		const clipId = `${pattern.id}-print-${++clips}`;
		const copy = shape.cloneNode(false) as SVGGeometryElement;
		copy.removeAttribute('id');
		const clip = svgElement('clipPath', { id: clipId });
		clip.append(copy);
		defs.append(clip);

		const transform = [shape.getAttribute('transform'), p.angle ? `rotate(${p.angle})` : null].filter(Boolean).join(' ');
		const turned = svgElement('g', { transform: transform || undefined });
		turned.append(...markPaths(p, ink, shape.getBBox()));
		const computed = getComputedStyle(shape);
		const opacity = Number(computed.opacity) * Number(computed.fillOpacity);
		const group = svgElement('g', { [ADDED]: '', 'clip-path': `url(#${clipId})`, opacity: opacity < 1 ? opacity : undefined });
		group.append(turned);
		shape.before(group);

		changed.push({ shape, fill: shape.style.getPropertyValue('fill'), priority: shape.style.getPropertyPriority('fill') });
		shape.style.setProperty('fill', 'none', 'important');
	}
}
