// The marks of a chart pattern as shapes, for a chart in a printed document ("### Charts in print" in
// ## Print of DESIGN.md). Chromium writes a <pattern> fill into a PDF as an image of 72 dpi, so a chart
// in a document draws each mark as a line, a circle or a rect, in a clip path of its shape. The marks
// stand where the tiles of <pattern patternUnits="userSpaceOnUse"> put them: tile (i, j) starts at
// (i × pitch, j × height) in the space that the angle turns about the origin. So on the screen the
// shapes and the pattern of chart-patterns.svg draw the same marks.
import { lineCenter, type ChartPattern } from '#lib/stack/patterns.js';

export type Box = { x: number; y: number; width: number; height: number };
export type Mark =
	| { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
	| { kind: 'circle'; cx: number; cy: number; r: number }
	| { kind: 'rect'; x: number; y: number; size: number };

/** The bounds of a box in the turned space of a pattern: the box turned by -angle about the origin. */
function turnedBounds(box: Box, angle: number) {
	const a = (-angle * Math.PI) / 180;
	const corners = (
		[
			[box.x, box.y],
			[box.x + box.width, box.y],
			[box.x, box.y + box.height],
			[box.x + box.width, box.y + box.height]
		] as const
	).map(([x, y]): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
	const xs = corners.map((c) => c[0]);
	const ys = corners.map((c) => c[1]);
	return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/**
 * The marks of pattern p that cover a box, in the turned space of the pattern. The caller draws them
 * in a group with transform="rotate(<p.angle>)", inside a clip path of the shape.
 */
export function patternMarks(p: ChartPattern, box: Box): Mark[] {
	const height = p.stagger ? p.pitch * 2 : p.pitch;
	const c = lineCenter(p.pitch, p.width);
	const b = turnedBounds(box, p.angle);
	const first = (from: number, step: number) => Math.floor(from / step) - 1;
	const last = (to: number, step: number) => Math.ceil(to / step) + 1;
	const marks: Mark[] = [];
	if (p.type === 'lines' || p.type === 'cross') {
		for (let i = first(b.x0, p.pitch); i <= last(b.x1, p.pitch); i++) {
			const x = i * p.pitch + c;
			marks.push({ kind: 'line', x1: x, y1: b.y0 - p.pitch, x2: x, y2: b.y1 + p.pitch, width: p.width });
		}
		if (p.type === 'cross') {
			for (let j = first(b.y0, p.pitch); j <= last(b.y1, p.pitch); j++) {
				const y = j * p.pitch + c;
				marks.push({ kind: 'line', x1: b.x0 - p.pitch, y1: y, x2: b.x1 + p.pitch, y2: y, width: p.width });
			}
		}
		return marks;
	}
	for (let i = first(b.x0, p.pitch); i <= last(b.x1, p.pitch); i++) {
		for (let j = first(b.y0, height); j <= last(b.y1, height); j++) {
			const x = i * p.pitch;
			const y = j * height;
			// The second row of a staggered tile moves by half a pitch along x.
			const centers: [number, number][] = p.stagger ? [[x + c, y + c], [x + c + p.pitch / 2, y + c + p.pitch]] : [[x + c, y + c]];
			for (const [cx, cy] of centers) {
				marks.push(
					p.type === 'dots'
						? { kind: 'circle', cx, cy, r: p.width / 2 }
						: { kind: 'rect', x: cx - p.width / 2, y: cy - p.width / 2, size: p.width }
				);
			}
		}
	}
	return marks;
}
