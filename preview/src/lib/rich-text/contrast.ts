// The WCAG 2.2 contrast ratio of two colors, for the content colors and the paper of the rich text field.
// @stack-kit/stack/rich-text gives it to a page as contrastRatio, and paper.ts reads the pairs of a paper
// with it, so the two modules import this one and not each other.

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(hex: string): number {
	const n = parseInt(hex.slice(1), 16);
	return 0.2126 * linear(((n >> 16) & 255) / 255) + 0.7152 * linear(((n >> 8) & 255) / 255) + 0.0722 * linear((n & 255) / 255);
}

/** The WCAG 2.2 contrast ratio of two "#rrggbb" colors. */
export function contrastRatio(a: string, b: string): number {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
	return (x + 0.05) / (y + 0.05);
}
