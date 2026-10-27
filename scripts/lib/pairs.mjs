// The pairs of the contrast check, and the audit of one theme against them. This module imports only
// lib/color.mjs, so the preview runs it in the browser too, and the theme generator of
// lib/generate.mjs checks each theme that it writes against the same pairs.
import { parseOklch, oklchToSrgb, over, ratio } from './color.mjs';

// The grounds that the icon of a state, the dot of a label and a product color sit on.
export const MARK_GROUNDS = ['background', 'card', 'popover', 'muted', 'selected', 'sidebar'];

/**
 * The pairs to check, from the front matter:
 * - each role against its "-foreground" role, and foreground on background, at 4.5;
 * - each `components` key with a backgroundColor and a textColor, at 4.5. A key that sets one side
 *   takes the other side from the nearest ancestor key (the key minus its last segment);
 * - on each ground that a chart sits on (background, card and popover): chart-ink at 3, the ink of the
 *   pattern style (the pattern marks, the lines and the leader lines of a donut); chart-1 to chart-8 at 3, the
 *   marks of the color pattern style, the fills of the color style and the lines of the two color styles; and
 *   foreground and muted-foreground at 4.5, the labels, the values and the axis text of a chart. The same two
 *   pairs cover the comparison line and a reference line (muted-foreground) and the mark of an annotation
 *   (foreground) at 3. The pairs on background come from the rules below, and add() drops a pair that it
 *   already holds;
 * - the lightest of the five steps of a heat map, at 3 on the same three grounds: chart-ink/50 (the pattern
 *   style) and chart-heat/50 (the two color styles); and chart-heat at 3, the edge of a cell in the two
 *   color styles. The edge in the pattern style is chart-ink, which the rule above already reads;
 * - pairs that no component shows: muted-foreground, faint-foreground, strong-foreground and link on
 *   background at 4.5; border-strong, input and ring on background at 3;
 * - the text of a list row, at 4.5: muted-foreground on selected (a closed row that is selected) and on
 *   muted/50 (the hover of a row). faint-foreground serves on background only, so it has no other pair;
 * - the value of a key figure that is a link, under the pointer, at 4.5: strong-foreground on muted/50;
 * - the unread mark, at 3: foreground on muted/50 (a row under the pointer) and on sidebar-accent (a menu
 *   button under the pointer or current). The rules here and below read foreground on its other grounds:
 *   background, muted, selected, popover and sidebar. The pair on muted/50 is read at 4.5, because the
 *   name on the folded line of a mail message under the pointer is text on the same ground. In band 2 that
 *   line sits on popover, so foreground and muted-foreground on muted/50 over popover are read at 4.5 too;
 * - the count of a menu item in the sidebar, at 4.5: muted-foreground on sidebar;
 * - warning and destructive on selected, at 4.5: the text of a due date in a selected row;
 * - each status role (success, warning, info) as text and as an icon, at 4.5: on background, and on
 *   its own 10% tint (bg-<role>/10). Its "-foreground" on the role as a fill comes from the first rule;
 * - the grounds that the nova components make with an opacity modifier, at 4.5: primary-foreground on
 *   primary/80 (hover:bg-primary/80), destructive on destructive/10 and /20 (the destructive button and
 *   menu item), and in dark only destructive on destructive/30 (dark:hover:bg-destructive/30 on the
 *   destructive button) and foreground on input/30 (dark:bg-input/30 on inputs and outline buttons);
 * - the icon of the copy button of a code block, an outline button on the muted ground of the block, at 3
 *   in dark only: foreground on input/30 over muted at rest and on input/50 over muted under the pointer.
 *   In light the button has the background ground and the muted hover, which the rules above read;
 * - the text of the floating layers (menus, popovers, dialogs) on popover, at 4.5: muted-foreground and
 *   destructive, and destructive on the focus tint of a destructive menu item over popover
 *   (focus:bg-destructive/10, and /20 in dark);
 * - the text that the nova components draw with an opacity modifier, at 4.5: sidebar-foreground/70 on
 *   sidebar (text-sidebar-foreground/70, a sidebar group label), destructive/90 on card (the description
 *   of a destructive alert) and destructive/80 on card (the description of an attachment that failed);
 * - destructive on background at 4.5 (an error text, and a meter fill past its limit), and the fills of a
 *   meter at 3: primary on muted (a progress bar on its track) and primary on background (a meter on its
 *   outlined track);
 * - destructive on destructive/10 over card at 3 (the icon of an attachment that failed), and the text of a
 *   Kbd in a tooltip at 4.5: background on background/20 over foreground, and /10 in dark;
 * - success, warning and destructive as the icon of a state (a job, a device, a connection or a check) at 3,
 *   on background, card, popover, muted, selected and sidebar. A pair of the same role on the same ground
 *   at 4.5 or 3 that the rules above already hold covers the icon, so the icon pair is left out there;
 * - the parts of a meter at 3 on the same six grounds: background is the ground of its outlined track, and
 *   the others are the grounds that a meter sits on. primary and muted-foreground are the two safe fills,
 *   and foreground is a threshold tick and a forecast marker, whose ends stand on the ground. The hatch of
 *   a pending segment is muted-foreground on the track. A pair that the rules above already hold covers
 *   the part, as for the icon;
 * - each tag-<color> role, the dot of a label, at 3 on the same six grounds;
 * - the text of a diff, at 4.5: foreground on the tint of an added or a removed line (diff-added/10 and
 *   diff-removed/10) and on the tint of a changed word (/37), over muted, background, card and popover,
 *   and muted-foreground, the line numbers, on the tint of a line over muted.
 *
 * A pair is { id, bg, fg, min, alpha, fgAlpha, modes, under }. alpha scales the alpha of bg, as Tailwind
 * does when it mixes the role with transparent, and fgAlpha scales the alpha of fg in the same way. modes
 * is null for both modes, or the list of modes to check. under is null when bg sits on background, or the
 * role of the layer that bg sits on.
 */
export function pairs(front) {
  const names = new Set(Object.keys(front.colors ?? {}).filter((n) => n !== 'dark'));
  const out = [];
  const seen = new Set();
  const add = (id, bg, fg, min, { alpha = 1, fgAlpha = 1, modes = null, under = null } = {}) => {
    if (!names.has(bg) || !names.has(fg) || (under && !names.has(under))) return;
    const k = `${bg}|${fg}|${min}|${alpha}|${fgAlpha}|${modes ?? ''}|${under ?? ''}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ id, bg, fg, min, alpha, fgAlpha, modes, under });
  };
  add('foreground on background', 'background', 'foreground', 4.5);
  for (const n of names) if (names.has(`${n}-foreground`)) add(`${n}-foreground on ${n}`, n, `${n}-foreground`, 4.5);

  const comps = front.components ?? {};
  const ref = (v) => {
    const m = /^\{colors\.([a-z0-9-]+)\}$/.exec(String(v ?? ''));
    return m ? m[1] : null;
  };
  const inherit = (key, prop) => {
    let k = key;
    while (k.includes('-')) {
      k = k.slice(0, k.lastIndexOf('-'));
      if (comps[k] && comps[k][prop]) return ref(comps[k][prop]);
    }
    return null;
  };
  for (const [key, v] of Object.entries(comps)) {
    const ownBg = ref(v.backgroundColor);
    const ownFg = ref(v.textColor);
    if (!ownBg && !ownFg) continue;
    const bg = ownBg ?? inherit(key, 'backgroundColor');
    const fg = ownFg ?? inherit(key, 'textColor');
    if (bg && fg) add(`components.${key}`, bg, fg, 4.5);
  }

  for (const ground of ['background', 'card', 'popover']) {
    add(`chart-ink on ${ground}`, ground, 'chart-ink', 3);
    for (let n = 1; n <= 8; n++) add(`chart-${n} on ${ground}`, ground, `chart-${n}`, 3);
    for (const fg of ['foreground', 'muted-foreground']) add(`${fg} on ${ground}`, ground, fg, 4.5);
    add(`chart-ink/50 on ${ground}`, ground, 'chart-ink', 3, { fgAlpha: 0.5 });
    add(`chart-heat/50 on ${ground}`, ground, 'chart-heat', 3, { fgAlpha: 0.5 });
    add(`chart-heat on ${ground}`, ground, 'chart-heat', 3);
  }

  for (const fg of ['muted-foreground', 'faint-foreground', 'strong-foreground', 'link']) add(`${fg} on background`, 'background', fg, 4.5);
  for (const fg of ['border-strong', 'input', 'ring']) add(`${fg} on background`, 'background', fg, 3);
  add('muted-foreground on selected', 'selected', 'muted-foreground', 4.5);
  add('muted-foreground on muted/50', 'muted', 'muted-foreground', 4.5, { alpha: 0.5 });
  add('strong-foreground on muted/50', 'muted', 'strong-foreground', 4.5, { alpha: 0.5 });
  add('foreground on muted/50', 'muted', 'foreground', 4.5, { alpha: 0.5 });
  add('foreground on sidebar-accent', 'sidebar-accent', 'foreground', 3);
  add('foreground on muted/50 over popover', 'muted', 'foreground', 4.5, { alpha: 0.5, under: 'popover' });
  add('muted-foreground on muted/50 over popover', 'muted', 'muted-foreground', 4.5, { alpha: 0.5, under: 'popover' });
  add('muted-foreground on sidebar', 'sidebar', 'muted-foreground', 4.5);
  for (const fg of ['warning', 'destructive']) add(`${fg} on selected`, 'selected', fg, 4.5);
  for (const role of ['success', 'warning', 'info']) {
    add(`${role} on background`, 'background', role, 4.5);
    add(`${role} on ${role}/10`, role, role, 4.5, { alpha: 0.1 });
  }

  add('primary-foreground on primary/80', 'primary', 'primary-foreground', 4.5, { alpha: 0.8 });
  add('destructive on destructive/10', 'destructive', 'destructive', 4.5, { alpha: 0.1 });
  add('destructive on destructive/20', 'destructive', 'destructive', 4.5, { alpha: 0.2 });
  add('destructive on destructive/30', 'destructive', 'destructive', 4.5, { alpha: 0.3, modes: ['dark'] });
  add('foreground on input/30', 'input', 'foreground', 4.5, { alpha: 0.3, modes: ['dark'] });
  add('foreground on input/30 over muted', 'input', 'foreground', 3, { alpha: 0.3, modes: ['dark'], under: 'muted' });
  add('foreground on input/50 over muted', 'input', 'foreground', 3, { alpha: 0.5, modes: ['dark'], under: 'muted' });
  add('muted-foreground on popover', 'popover', 'muted-foreground', 4.5);
  add('destructive on popover', 'popover', 'destructive', 4.5);
  add('destructive on destructive/10 over popover', 'destructive', 'destructive', 4.5, { alpha: 0.1, modes: ['light'], under: 'popover' });
  add('destructive on destructive/20 over popover', 'destructive', 'destructive', 4.5, { alpha: 0.2, modes: ['dark'], under: 'popover' });
  add('sidebar-foreground/70 on sidebar', 'sidebar', 'sidebar-foreground', 4.5, { fgAlpha: 0.7 });
  add('destructive/90 on card', 'card', 'destructive', 4.5, { fgAlpha: 0.9 });
  add('destructive/80 on card', 'card', 'destructive', 4.5, { fgAlpha: 0.8 });
  add('destructive on background', 'background', 'destructive', 4.5);
  add('primary on muted', 'muted', 'primary', 3);
  add('primary on background', 'background', 'primary', 3);
  add('destructive on destructive/10 over card', 'destructive', 'destructive', 3, { alpha: 0.1, under: 'card' });
  add('background on background/20 over foreground', 'background', 'background', 4.5, { alpha: 0.2, modes: ['light'], under: 'foreground' });
  add('background on background/10 over foreground', 'background', 'background', 4.5, { alpha: 0.1, modes: ['dark'], under: 'foreground' });
  // The grounds that the icon of a state and the dot of a label sit on.
  // True when a pair above already checks the role on the ground at full strength, at 3 or more.
  const held = (ground, role) => out.some((x) => x.bg === ground && x.fg === role && x.min >= 3 && x.alpha === 1 && x.fgAlpha === 1 && !x.modes && !x.under);
  for (const role of ['success', 'warning', 'destructive']) {
    for (const ground of MARK_GROUNDS) {
      if (!held(ground, role)) add(`${role} icon on ${ground}`, ground, role, 3);
    }
  }
  // The parts of a meter: the two safe fills, and the tick and the forecast marker in foreground.
  for (const role of ['primary', 'muted-foreground', 'foreground']) {
    for (const ground of MARK_GROUNDS) {
      if (!held(ground, role)) add(`${role} meter part on ${ground}`, ground, role, 3);
    }
  }
  for (const tag of [...names].filter((n) => n.startsWith('tag-'))) {
    for (const ground of MARK_GROUNDS) add(`${tag} dot on ${ground}`, ground, tag, 3);
  }
  // The tints of a diff. A changed line takes its role at 10%, and a changed word in it takes the role
  // at 30% over the line, which is the role at 37% over the ground (1 - 0.9 * 0.7). The box of a diff
  // of code is muted, and a diff of text sits on background, card or popover. The text and the sign
  // are foreground, and the line numbers of code are muted-foreground.
  for (const role of ['diff-added', 'diff-removed']) {
    for (const ground of ['muted', 'background', 'card', 'popover']) {
      const under = ground === 'background' ? null : ground;
      add(`foreground on ${role}/10 over ${ground}`, role, 'foreground', 4.5, { alpha: 0.1, under });
      add(`foreground on ${role}/37 over ${ground}`, role, 'foreground', 4.5, { alpha: 0.37, under });
    }
    add(`muted-foreground on ${role}/10 over muted`, role, 'muted-foreground', 4.5, { alpha: 0.1, under: 'muted' });
  }
  return out;
}

/** The text of a pair as the output names it: "foreground", or "foreground/60" for a modifier. */
export function textLabel(pair) {
  return pair.fgAlpha === 1 ? pair.fg : `${pair.fg}/${Math.round(pair.fgAlpha * 100)}`;
}

/** The ground of a pair as the output names it: "primary", or "primary/80" for a modifier. */
export function groundLabel(pair) {
  const g = pair.alpha === 1 ? pair.bg : `${pair.bg}/${Math.round(pair.alpha * 100)}`;
  return pair.under ? `${g} over ${pair.under}` : g;
}

/**
 * Resolves each pair in each mode of one theme file. A name that the block lacks takes the :root
 * value (dark only), then the value of `theme-fallbacks`. An alpha colour, and a ground with a pair
 * alpha below 1, is composited over the background of the same mode first, or over the "under" layer
 * of the pair, which itself sits on that background. The text, with its fgAlpha, is composited over
 * that ground.
 */
export function audit(t, p, fallbacks = {}) {
  const rows = [];
  const used = { light: new Set(), dark: new Set() };
  for (const mode of ['light', 'dark']) {
    const lookup = (n) => (mode === 'dark' ? t.dark.get(n) ?? t.root.get(n) : t.root.get(n));
    const value = (n, depth = 0) => {
      const v = lookup(n);
      if (v !== undefined) return v;
      const fb = fallbacks[n];
      if (fb === undefined || depth > 2) throw new Error(`--${n} is not set, and theme-fallbacks has no entry for it.`);
      used[mode].add(n);
      return String(fb).startsWith('oklch(') ? fb : value(fb, depth + 1);
    };
    const color = (n) => {
      try {
        const v = value(n);
        return oklchToSrgb(parseOklch(v));
      } catch (e) {
        throw new Error(`--${n} (${mode}): ${e.message}`);
      }
    };
    const ground = over(color('background'), { r: 1, g: 1, b: 1, a: 1, clipped: false });
    for (const pair of p) {
      if (pair.modes && !pair.modes.includes(mode)) continue;
      const base = color(pair.bg);
      const floor = pair.under ? over(color(pair.under), ground) : ground;
      const bg = over({ ...base, a: base.a * pair.alpha }, floor);
      const text = color(pair.fg);
      const fg = over({ ...text, a: text.a * (pair.fgAlpha ?? 1) }, bg);
      const r = ratio(fg, bg);
      rows.push({ mode, pair, ratio: r, ok: r >= pair.min, clipped: bg.clipped || fg.clipped });
    }
  }
  return { rows, used };
}
