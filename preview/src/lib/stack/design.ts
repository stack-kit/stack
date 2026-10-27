// The front matter of DESIGN.md, read at build time. The preview shows these values and
// never keeps a copy of them.
import raw from '../../../../DESIGN.md?raw';
import { parse } from 'yaml';

export type Front = Record<string, unknown>;
export type TypeStep = {
	fontFamily: string;
	fontSize: string;
	fontWeight: number;
	lineHeight: string;
	letterSpacing?: string;
};
export type ChartPattern = {
	type: 'lines' | 'cross' | 'dots' | 'squares';
	angle: number;
	width: number;
	pitch: number;
	stagger: boolean;
};

function frontMatter(text: string): Front {
	const lines = text.split('\n');
	const end = lines.indexOf('---', 1);
	if (lines[0] !== '---' || end < 0) {
		throw new Error('DESIGN.md: the front matter must sit between two "---" lines at the top.');
	}
	return parse(lines.slice(1, end).join('\n')) as Front;
}

export const front = frontMatter(raw);

const { dark, ...light } = front.colors as Record<string, string> & { dark: Record<string, string> };
export const colors = { light: light as Record<string, string>, dark };
export const typography = front.typography as Record<string, TypeStep>;
export const spacing = front.spacing as Record<string, string>;
export const rounded = front.rounded as Record<string, string>;
export const themeFallbacks = front['theme-fallbacks'] as Record<string, string>;

const PATTERN_TYPES = ['lines', 'cross', 'dots', 'squares'];

// The chart code draws from these numbers, so a wrong field stops the build here with its name.
function readChartPatterns(value: unknown): Record<string, ChartPattern> {
	const patterns = value as Record<string, Record<string, unknown>>;
	Object.entries(patterns).forEach(([name, p], i) => {
		const valid =
			name === `pattern-${i + 1}` &&
			PATTERN_TYPES.includes(p.type as string) &&
			['angle', 'width', 'pitch'].every((field) => typeof p[field] === 'number') &&
			typeof p.stagger === 'boolean';
		if (!valid) {
			throw new Error(
				`DESIGN.md: chart-patterns entry ${i + 1} must be named pattern-${i + 1} and hold type (${PATTERN_TYPES.join(', ')}), angle, width and pitch as numbers, and stagger as true or false. It is ${name}: ${JSON.stringify(p)}.`
			);
		}
	});
	return patterns as Record<string, ChartPattern>;
}

export const chartPatterns = readChartPatterns(front['chart-patterns']);
