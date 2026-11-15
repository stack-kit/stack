// The paper of rich text content (### rich-text-field and ### rich-text-view in DESIGN.md): the ground, the
// ink and the link of the text. The roles rich-text-paper, rich-text-ink and rich-text-link give them, and
// a page can give a field or a view its own with the paper prop, which sets the three custom properties on
// the root of the part. A color picker in a popover stands outside the part, so it gets the colors of the
// paper as "#rrggbb" from a probe inside the part.
//
// - A color with alpha reads as the browser draws it: the paper over the ground under the part, and the
//   ink and the link over the paper. So a transparent paper reads as the ground of the page.
// - A color that the canvas cannot paint gives no colors, and so no pair: the check never reports a weak
//   pair that it did not read.
// - The pairs are each text of the content on the paper: the ink, the link, the ink at 70% of the
//   placeholder and a quote (muted), and the ink on the ground of code, the ink at 6% (code).
import type { PaperPair, RichTextPaper } from '#lib/stack/rich-text.js';
import { contrastRatio } from './contrast.js';

/** The three colors of a paper as "#rrggbb", each as the browser draws it. */
export type PaperColors = { paper: string; ink: string; link: string };

/** The classes of a probe of the paper: its ground is the paper, its color the ink, and its edge the link. */
export const PROBE = 'hidden border-rich-text-link bg-rich-text-paper text-rich-text-ink';

/** A color as red, green and blue from 0 to 255, and alpha from 0 to 1. */
type Rgba = [number, number, number, number];
type Rgb = [number, number, number];

/** A CSS color as a canvas paints it in sRGB, or null when the canvas cannot parse it. A browser gives a color such as oklch(1 0 0) in its own form. */
function rgba(css: string, ctx: CanvasRenderingContext2D): Rgba | null {
	// A value that the canvas cannot parse leaves fillStyle as it was, so two marks tell it from a real color.
	const kept = ['#010203', '#040506'].every((mark) => {
		ctx.fillStyle = mark;
		ctx.fillStyle = css;
		return ctx.fillStyle === mark;
	});
	if (kept) return null;
	ctx.clearRect(0, 0, 1, 1);
	ctx.fillStyle = css;
	ctx.fillRect(0, 0, 1, 1);
	const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
	return [r, g, b, a / 255];
}

/** The color `top` drawn over `under`, as the browser composites it in sRGB. */
const over = (top: Rgba, under: Rgb): Rgb => [0, 1, 2].map((k) => Math.round((top[k] ?? 0) * top[3] + (under[k] ?? 0) * (1 - top[3]))) as Rgb;

const hex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/** The ground of the page at `el`: its background and the backgrounds around it, over the white canvas of a page. */
function groundOf(el: Element | null, ctx: CanvasRenderingContext2D): Rgb {
	const layers: Rgba[] = [];
	for (let e = el; e; e = e.parentElement) {
		const c = rgba(getComputedStyle(e).backgroundColor, ctx);
		if (!c || c[3] === 0) continue;
		layers.push(c);
		if (c[3] === 1) break;
	}
	return layers.reduceRight<Rgb>((under, top) => over(top, under), [255, 255, 255]);
}

/**
 * The colors of the paper where a probe with the classes of PROBE stands, as the browser draws them, or null
 * with no canvas or with a color that the canvas cannot paint. `under` is the element whose ground the paper
 * stands on.
 */
export function readPaper(probe: HTMLElement, under: Element | null = probe.parentElement): PaperColors | null {
	const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
	if (!ctx) return null;
	const style = getComputedStyle(probe);
	const [paper, ink, link] = [style.backgroundColor, style.color, style.borderTopColor].map((css) => rgba(css, ctx));
	if (!paper || !ink || !link) return null;
	const ground = over(paper, groundOf(under, ctx));
	return { paper: hex(ground), ink: hex(over(ink, ground)), link: hex(over(link, ground)) };
}

/** The pairs of a paper with their ratios: the ink, the link, the ink at 70% (muted) and the ink on the ground of code (code). */
export function pairsOf(colors: PaperColors): PaperPair[] {
	const rgb = (h: string): Rgb => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)) as Rgb;
	const paper = rgb(colors.paper);
	const ink = rgb(colors.ink);
	const muted = hex(over([...ink, 0.7], paper));
	const code = hex(over([...ink, 0.06], paper));
	const ratio = (a: string, b: string) => Math.round(contrastRatio(a, b) * 100) / 100;
	return [
		{ pair: 'ink', ratio: ratio(colors.ink, colors.paper) },
		{ pair: 'link', ratio: ratio(colors.link, colors.paper) },
		{ pair: 'muted', ratio: ratio(muted, colors.paper) },
		{ pair: 'code', ratio: ratio(colors.ink, code) }
	];
}

/** Each pair that reads under 4.5:1 on the paper. */
export function weakPairs(colors: PaperColors): PaperPair[] {
	return pairsOf(colors).filter((p) => p.ratio < 4.5);
}

/** The words of the warning of development for a paper with weak pairs. */
export function paperWarning(part: string, pairs: readonly PaperPair[], paper: RichTextPaper): string {
	const read = pairs.map((p) => `${p.pair} ${p.ratio.toFixed(2)}:1`).join(', ');
	return `The paper of the ${part} reads under 4.5:1 (${read}) with ${JSON.stringify(paper)}. Give an ink and a link that read at 4.5:1 or more on the paper, also the ink at 70% and on the ground of code.`;
}
