// The theme generator. Three inputs, a base color, an accent color and a contrast level, give the value
// of every color role of DESIGN.md in light and in dark. It works in OKLCH on two scales of 10 steps,
// 100 to 1000, and each step has one role. Then it checks its own values against the pairs of the
// contrast check, and it lifts the lightness of a text, an edge or a mark until each pair passes.
// This module imports only lib/color.mjs and lib/pairs.mjs, so the preview runs it in the browser too.
// scripts/generate.mjs is its command.
import { oklchToSrgb, paint, ratio, parseColor, parseOklch, fitGamut, formatOklch } from './color.mjs';
import { pairs as contrastPairs, audit } from './pairs.mjs';

// The preview formats the steps of a scale with the same function.
export { formatOklch } from './color.mjs';

export const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

// The inputs of the graphite theme: the page and the indigo of its source, converted to OKLCH, its
// contrast level, and its own chart colors. They give a theme near graphite, not graphite itself. The
// default theme takes theme-inputs of the front matter.
export const THEME_INPUTS = { graphite: { base: 'oklch(0.982 0.001 282.734)', accent: 'oklch(0.608 0.14 276.289)', contrast: 30, charts: 'graphite' } };

// The chart colors of a set: chart-1 to chart-8 and chart-heat. chart-ink follows strong-foreground, so
// no set gives it.
export const CHARTS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8', 'chart-heat'];

/**
 * The front matter with the chart colors of a theme file in place of its own, in light and in dark. theme
 * is the { root, dark } of a parsed theme file. Every generated theme takes the chart colors of the front
 * matter, the default set, unless the command names another set, such as the set of graphite. The lift
 * still moves a chart color of the set when a pair fails on the new grounds.
 */
export function withCharts(front, theme, file = 'the theme file') {
  const colors = { ...front.colors, dark: { ...front.colors.dark } };
  for (const n of CHARTS) {
    const v = theme.root.get(n);
    if (v === undefined) throw new Error(`${file} lacks --${n} in :root, so it gives no set of chart colors.`);
    colors[n] = v;
    colors.dark[n] = theme.dark.get(n) ?? v;
  }
  return { ...front, colors };
}

// The contrast of each step against step 100, the ground, at contrast 30. The role of each step:
// 100 the page, 200 the hover ground, 300 the active ground, 400 the border, 500 the edge of a control,
// 600 the strong edge, 700 the faint text, 800 none, 900 the muted text, 1000 the text. The values are
// the ratios of the graphite theme, except step 300 in dark (graphite has 1.04). A dark page needs a
// higher ratio for the same look, so the border and the text are higher in dark.
const RATIO = {
  light: [1, 1.09, 1.14, 1.27, 3.05, 3.9, 4.6, 5.3, 6.3, 12.6],
  dark: [1, 1.08, 1.14, 1.37, 3.05, 3.9, 4.6, 5.3, 6.3, 14.6],
};
// The least ratio of each step: the edge of a control at 3:1, and a text at 4.5:1.
const FLOOR = [1, 1, 1, 1, 3, 3, 4.5, 4.5, 4.5, 4.5];
// From step 400 up, the contrast level k raises each ratio R to a power: R^0.89 at 0, R at 30 and R^1.25
// at 100. The grounds, 100 to 300, keep their ratios at every level.
const power = (k) => 1 + (k - 30) / 280;
// The strong text takes the ratio of step 1000 to the power 1.1: 16.2 over 12.6 in light at contrast 30.
const STRONG = 1.1;

// The four grounds, as a lightness offset from the page in each mode: the sidebar one level darker, a
// card one level lighter, and a menu two levels lighter in dark. A menu in light mode shows by its shadow,
// so it keeps the card ground. An offset, and not a ratio, because a ratio near black cannot go darker.
const LADDER = { sunken: { light: -0.03, dark: -0.04 }, raised: { light: 0.018, dark: 0.033 }, overlay: { light: 0.018, dark: 0.07 } };
// The least room by which the card ground must be lighter than the page for the secondary fill to take it.
const SECONDARY_ROOM = 0.01;
// The share of the accent chroma that the active ground of the accent scale keeps (the selected row).
const TINT = { light: 0.11, dark: 0.33 };
// A fill takes white text below this lightness, and the dark page as its text from it up.
const WHITE_BELOW = 0.7;
const WHITE = { l: 1, c: 0, h: 0, a: 1 };
// The step of one lift, in OKLCH lightness, and the most rounds of lifts.
const LIFT = 0.005;
const MAX_LIFTS = 200;

// The source of each role. base and accent: a step of that scale; ground: a level of the ground ladder;
// fixed: the hue and the chroma of the role in the front matter, which the lift may make lighter or
// darker; ink: the text on that fill; same: the value of that role.
const ROLES = {
  background: { ground: 'base' },
  foreground: { base: 1000 },
  card: { ground: 'raised' },
  'card-foreground': { same: 'foreground' },
  popover: { ground: 'overlay' },
  'popover-foreground': { same: 'foreground' },
  primary: { accent: 700 },
  'primary-foreground': { ink: 'primary' },
  secondary: { ground: 'fill' },
  'secondary-foreground': { same: 'foreground' },
  muted: { base: 300 },
  'muted-foreground': { base: 900 },
  accent: { base: 200 },
  'accent-foreground': { same: 'foreground' },
  destructive: { fixed: true },
  border: { base: 400 },
  input: { base: 500 },
  ring: { same: 'primary' },
  'chart-1': { fixed: true },
  'chart-2': { fixed: true },
  'chart-3': { fixed: true },
  'chart-4': { fixed: true },
  'chart-5': { fixed: true },
  sidebar: { ground: 'sunken' },
  'sidebar-foreground': { same: 'foreground' },
  'sidebar-primary': { same: 'primary' },
  'sidebar-primary-foreground': { same: 'primary-foreground' },
  'sidebar-accent': { base: 300 },
  'sidebar-accent-foreground': { same: 'foreground' },
  'sidebar-border': { same: 'border' },
  'sidebar-ring': { same: 'primary' },
  selected: { accent: 300 },
  'selected-foreground': { same: 'foreground' },
  'strong-foreground': { base: 1000, strong: true },
  'faint-foreground': { base: 700 },
  link: { fixed: true },
  'border-faint': { base: 200 },
  'border-strong': { base: 600 },
  success: { fixed: true },
  'success-foreground': { ink: 'success' },
  warning: { fixed: true },
  'warning-foreground': { ink: 'warning' },
  info: { fixed: true },
  'info-foreground': { ink: 'info' },
  overlay: { fixed: true, still: true },
  'chart-6': { fixed: true },
  'chart-7': { fixed: true },
  'chart-8': { fixed: true },
  'chart-ink': { same: 'strong-foreground' },
  'chart-heat': { fixed: true },
  'tag-grey': { fixed: true },
  'tag-blue': { fixed: true },
  'tag-violet': { fixed: true },
  'tag-pink': { fixed: true },
  'tag-red': { fixed: true },
  'tag-orange': { fixed: true },
  'tag-yellow': { fixed: true },
  'tag-green': { fixed: true },
  'diff-added': { fixed: true },
  'diff-removed': { fixed: true },
};

/** True when the lift may change the role: a text, an edge, a mark or a fill, never a ground or a divider. */
function movable(s) {
  if (s.fixed) return !s.still;
  if (s.accent) return s.accent === 700;
  if (s.base) return s.base >= 500;
  return false;
}

const painted = (o) => paint(oklchToSrgb(fitGamut(o)));
const round = (v) => Math.round(v * 1000) / 1000;

/**
 * The lightness, from the ground to the end of the range on one side (-1 darker, 1 lighter), that
 * reaches the target ratio against the ground with the given hue and chroma. The end, when no lightness
 * reaches it. The 8-bit paint of a browser decides, as in the contrast check.
 */
function solve(target, ground, { c, h }, side) {
  const g = painted(ground);
  const at = (l) => ratio(painted({ l, c, h, a: 1 }), g);
  const end = side < 0 ? 0 : 1;
  if (at(end) < target) return end;
  let near = ground.l;
  let far = end;
  for (let i = 0; i < 32; i++) {
    const mid = (near + far) / 2;
    if (at(mid) >= target) far = mid;
    else near = mid;
  }
  // Round toward the end, so that the rounded value still reaches the target.
  const l = side < 0 ? Math.floor(far * 1000) / 1000 : Math.ceil(far * 1000) / 1000;
  return Math.min(1, Math.max(0, l));
}

/** Reads and checks the three inputs. Throws with the form that each input takes. */
function readInputs({ base, accent, contrast }) {
  const k = Number(contrast);
  if (contrast === undefined || contrast === null || contrast === '' || !Number.isFinite(k) || k < 0 || k > 100) {
    throw new Error(`the contrast level "${contrast}" must be a number from 0 to 100, such as 30.`);
  }
  const color = (name, v) => {
    if (v === undefined || v === '') throw new Error(`the ${name} color is missing. Give it as "oklch(L C H)" or "#rrggbb".`);
    const o = parseColor(v);
    if (!(o.l >= 0 && o.l <= 1)) throw new Error(`the ${name} color "${v}" has a lightness outside 0 to 1.`);
    if (o.a !== 1) throw new Error(`the ${name} color "${v}" has an alpha. Give an opaque color.`);
    return fitGamut({ l: round(o.l), c: round(o.c), h: round(o.h), a: 1 });
  };
  return { base: color('base', base), accent: color('accent', accent), contrast: k };
}

/**
 * The two scales, the four grounds and the secondary fill of each mode. The base color is the page of the
 * mode that its lightness belongs to: light from 0.5 up, dark below. The page of the other mode keeps the
 * same softness: a light page at 1 - d gives a dark page at 0.145 + 1.7 d, so white gives 0.145, the dark
 * page of the default theme, and 0.98 gives 0.179. The accent color is step 700 of the accent scale in
 * the mode of the base, and the other mode takes the lightness that gives it the same ratio against
 * its page.
 */
function scales({ base, accent, contrast }) {
  const lightBase = base.l >= 0.5;
  const softness = lightBase ? 1 - base.l : (base.l - 0.145) / 1.7;
  const pages = {
    light: lightBase ? base.l : round(Math.min(1, Math.max(0.85, 1 - softness))),
    dark: lightBase ? round(Math.min(0.3, Math.max(0.1, 0.145 + 1.7 * softness))) : base.l,
  };
  const home = lightBase ? 'light' : 'dark';
  const homePage = { l: pages[home], c: base.c, h: base.h, a: 1 };
  const accentRatio = ratio(painted(accent), painted(homePage));
  const out = {};
  for (const mode of ['light', 'dark']) {
    const page = { l: pages[mode], c: base.c, h: base.h, a: 1 };
    const side = mode === 'light' ? -1 : 1;
    const ratios = RATIO[mode].map((r, i) => (i < 3 ? r : Math.max(FLOOR[i], r ** power(contrast))));
    const at = (r, c, h) => fitGamut({ l: solve(r, page, { c, h }, side), c, h, a: 1 });
    const offset = (d) => fitGamut({ ...page, l: round(Math.min(1, Math.max(0, page.l + d))) });
    const baseSteps = ratios.map((r, i) => (i === 0 ? fitGamut(page) : at(r, base.c, base.h)));
    const accentSteps = STEPS.map((step, i) => {
      if (step === 700) return mode === home ? accent : at(accentRatio, accent.c, accent.h);
      if (step === 300) return at(ratios[2], accent.c * TINT[mode], accent.h);
      return null;
    });
    const raised = offset(LADDER.raised[mode]);
    // The fill of a secondary control is lighter than the page in both modes, as a card is. In dark, step 200
    // is lighter than the page, so the fill takes step 200. In light, step 200 is darker, so the fill takes
    // the card ground. When the card ground is less than SECONDARY_ROOM lighter than the page, the fill takes
    // step 200 there, which is darker than the page.
    const rises = mode === 'light' && round(raised.l - page.l) >= SECONDARY_ROOM;
    out[mode] = {
      base: baseSteps,
      accent: accentSteps,
      strong: at(ratios[9] ** STRONG, base.c, base.h),
      ground: { base: baseSteps[0], sunken: offset(LADDER.sunken[mode]), raised, overlay: offset(LADDER.overlay[mode]), fill: rises ? raised : baseSteps[1] },
      dark: fitGamut({ l: pages.dark, c: base.c, h: base.h, a: 1 }),
    };
  }
  return out;
}

/**
 * Writes every role of the front matter in light and in dark from the three inputs, then lifts until
 * each pair of the contrast check passes. Returns { light, dark } as maps of role to an oklch() value,
 * in the order of the front matter, the lifts, and the problems. A problem means that the theme fails
 * a pair; the command refuses to keep such a file. flip names the texts on a fill, as "<mode> <role>",
 * that take the other text color.
 */
export function generate(rawInputs, front, flip = new Set()) {
  const inputs = readInputs(rawInputs);
  const names = Object.keys(front.colors ?? {}).filter((n) => n !== 'dark');
  const unknown = names.filter((n) => !ROLES[n]);
  const absent = Object.keys(ROLES).filter((n) => !names.includes(n));
  if (unknown.length) throw new Error(`the generator has no source for ${unknown.join(', ')}. Give each new role its source in ROLES of scripts/lib/generate.mjs.`);
  if (absent.length) throw new Error(`ROLES of scripts/lib/generate.mjs names ${absent.join(', ')}, which the front matter lacks.`);
  const sc = scales(inputs);
  const source = (n) => (ROLES[n].same ? source(ROLES[n].same) : n);

  // One value for each role that is its own source, in each mode.
  const values = { light: new Map(), dark: new Map() };
  for (const mode of ['light', 'dark']) {
    const s = sc[mode];
    const fm = mode === 'light' ? front.colors : front.colors.dark;
    for (const n of names) {
      const r = ROLES[n];
      if (r.same) continue;
      let v;
      if (r.ground) v = s.ground[r.ground];
      else if (r.base) v = r.strong ? s.strong : s.base[STEPS.indexOf(r.base)];
      else if (r.accent) v = s.accent[STEPS.indexOf(r.accent)];
      else if (r.fixed) v = parseOklch(fm[n]);
      if (v) values[mode].set(n, { ...v });
    }
    // The text on a fill: white on a dark fill, and the dark page on a light fill, or the other one when
    // flip names it.
    for (const n of names) {
      const r = ROLES[n];
      if (r.ink) { const white = values[mode].get(source(r.ink)).l < WHITE_BELOW; values[mode].set(n, white !== flip.has(`${mode} ${n}`) ? { ...WHITE } : { ...s.dark }); }
    }
  }
  const copy = (m) => new Map([...m].map(([n, v]) => [n, { ...v }]));
  const start = { light: copy(values.light), dark: copy(values.dark) };
  // A value of the front matter keeps its chroma, also outside sRGB, until a lift moves it.
  const block = (mode) => new Map(names.map((n) => [n, formatOklch(values[mode].get(source(n)))]));
  const theme = () => ({ root: block('light'), dark: block('dark') });

  const list = contrastPairs(front);
  const problems = [];
  const moved = new Map();
  for (let step = 0; ; step++) {
    const failing = audit(theme(), list).rows.filter((r) => !r.ok);
    if (!failing.length) break;
    if (step === MAX_LIFTS) {
      problems.push(...failing.map((r) => `${r.mode}: ${r.pair.id} is ${r.ratio.toFixed(2)}, below ${r.pair.min}, after ${MAX_LIFTS} rounds of lifts.`));
      break;
    }
    const lifts = new Map();
    for (const r of failing) {
      const textSide = r.mode === 'light' ? -1 : 1;
      const fg = source(r.pair.fg);
      const bg = source(r.pair.bg);
      const under = r.pair.under ? source(r.pair.under) : null;
      let role = null;
      let dir = 0;
      // A text, an edge or a mark moves away from its ground. A fill under a fixed text moves away
      // from that text. A pair with a fixed text on a fixed ground moves the layer under the ground.
      if (movable(ROLES[fg])) [role, dir] = [fg, textSide];
      else if (movable(ROLES[bg])) [role, dir] = [bg, values[r.mode].get(fg).l >= 0.5 ? -1 : 1];
      else if (under && movable(ROLES[under])) [role, dir] = [under, textSide];
      if (!role) {
        problems.push(`${r.mode}: ${r.pair.id} is ${r.ratio.toFixed(2)}, below ${r.pair.min}, and the generator moves no role of it.`);
        continue;
      }
      const key = `${r.mode} ${role}`;
      const before = moved.get(key);
      if ((before && before.dir !== dir) || (lifts.has(key) && lifts.get(key).dir !== dir)) {
        const other = before && before.dir !== dir ? before : lifts.get(key);
        problems.push(`${r.mode}: ${role} must be lighter for one pair and darker for another (${[...other.pairs][0]}, ${r.pair.id}), so no value passes both.`);
        continue;
      }
      if (!lifts.has(key)) lifts.set(key, { mode: r.mode, role, dir, pairs: new Set() });
      lifts.get(key).pairs.add(r.pair.id);
    }
    if (problems.length) break;
    for (const [key, x] of lifts) {
      const v = values[x.mode].get(x.role);
      const l = round(Math.min(1, Math.max(0, v.l + x.dir * LIFT)));
      if (l === v.l) {
        problems.push(`${x.mode}: ${x.role} is at the end of the range, and ${[...x.pairs][0]} still fails.`);
        continue;
      }
      values[x.mode].set(x.role, fitGamut({ ...v, l }));
      const m = moved.get(key) ?? { ...x, pairs: new Set() };
      for (const p of x.pairs) m.pairs.add(p);
      moved.set(key, m);
    }
    if (problems.length) break;
  }
  // A fill that must be lighter for one pair and darker for another: try the other text on it, once for
  // each text in each mode. The lift stops at the first conflict, so a conflict of the other mode shows
  // only in the next try. Each try adds a text, so there are at most eight.
  if (problems.length) {
    const more = names.filter((n) => ROLES[n].ink).flatMap((n) => ['light', 'dark'].filter((m) => !flip.has(`${m} ${n}`) && problems.some((p) => p.startsWith(`${m}: ${source(ROLES[n].ink)} must be`))).map((m) => `${m} ${n}`));
    if (more.length) { const again = generate(rawInputs, front, new Set([...flip, ...more])); if (!again.problems.length) return again; }
  }
  const t = theme();
  const lifts = [...moved.values()].map((m) => ({
    mode: m.mode,
    role: m.role,
    from: formatOklch(start[m.mode].get(m.role)),
    to: formatOklch(values[m.mode].get(m.role)),
    pairs: [...m.pairs],
  }));
  return { inputs, light: t.root, dark: t.dark, scales: sc, lifts, problems, flipped: [...flip] };
}

/** The difference of each role between two themes, as { role, mode, from, to, dl, dc, dh, da }. */
export function compare(current, generated) {
  const rows = [];
  for (const mode of ['light', 'dark']) {
    const a = mode === 'light' ? current.root : new Map([...current.root, ...current.dark]);
    const b = mode === 'light' ? generated.root : new Map([...generated.root, ...generated.dark]);
    for (const [role, to] of b) {
      const from = a.get(role);
      // --radius is no color.
      if (from === undefined || role === 'radius') continue;
      const x = parseOklch(from);
      const y = parseOklch(to);
      // A hue means nothing on a gray, so a gray on either side has no hue difference.
      const gray = x.c < 0.005 || y.c < 0.005;
      const dh = gray ? null : round(((((y.h - x.h) % 360) + 540) % 360) - 180);
      rows.push({ role, mode, from, to, dl: round(y.l - x.l), dc: round(y.c - x.c), dh, da: round(y.a - x.a) });
    }
  }
  return rows;
}
