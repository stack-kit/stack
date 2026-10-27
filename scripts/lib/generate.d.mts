// The types of the exports of generate.mjs that the preview reads. TypeScript takes this file in place
// of generate.mjs, so svelte-check does not check the JavaScript of the generator, which has no types.
export type Oklch = { l: number; c: number; h: number; a: number };
export type Inputs = { base: string; accent: string; contrast: number | string };
export type Mode = 'light' | 'dark';
export type Scale = {
  base: Oklch[];
  accent: (Oklch | null)[];
  strong: Oklch;
  ground: Record<'base' | 'sunken' | 'raised' | 'overlay' | 'fill', Oklch>;
  dark: Oklch;
};
export type Lift = { mode: Mode; role: string; from: string; to: string; pairs: string[] };
export type Generated = {
  inputs: { base: Oklch; accent: Oklch; contrast: number };
  light: Map<string, string>;
  dark: Map<string, string>;
  scales: Record<Mode, Scale>;
  lifts: Lift[];
  problems: string[];
  flipped: string[];
};
export type Theme = { root: Map<string, string>; dark: Map<string, string> };
export type Delta = { role: string; mode: Mode; from: string; to: string; dl: number; dc: number; dh: number | null; da: number };

export const STEPS: number[];
export const THEME_INPUTS: Record<string, { base: string; accent: string; contrast: number; charts?: string }>;
export const CHARTS: string[];
export function withCharts(front: Record<string, unknown>, theme: Theme, file?: string): Record<string, unknown>;
export function formatOklch(o: Oklch): string;
export function generate(inputs: Inputs, front: Record<string, unknown>, flip?: Set<string>): Generated;
export function compare(current: Theme, generated: Theme): Delta[];
