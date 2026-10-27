// The color math of the contrast check and of the theme generator: OKLCH to sRGB and back, the paint
// of an 8-bit browser, and the contrast ratio of WCAG 2.2. This module imports nothing, so the preview
// runs it in the browser too.

/** "oklch(L C H)" or "oklch(L C H / A)" with A as a number or a percentage. */
export function parseOklch(s) {
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/.exec(String(s).trim());
  if (!m) throw new Error(`"${s}" is not an oklch() value of the form "oklch(L C H)" or "oklch(L C H / A)".`);
  const num = (v, scale) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / scale);
  return { l: num(m[1], 1), c: parseFloat(m[2]), h: parseFloat(m[3]), a: m[4] === undefined ? 1 : num(m[4], 1) };
}

/** OKLCH to gamma sRGB, 0..1, clipped to the gamut. `clipped` marks a value outside the gamut. */
export function oklchToSrgb(o) {
  const hr = (o.h * Math.PI) / 180;
  const A = o.c * Math.cos(hr);
  const B = o.c * Math.sin(hr);
  const l = (o.l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (o.l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (o.l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  let clipped = false;
  const [r, g, b] = lin.map((v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.sign(v) * Math.abs(v) ** (1 / 2.4) - 0.055;
    if (c < -0.5 / 255 || c > 1 + 0.5 / 255) clipped = true;
    return Math.min(1, Math.max(0, c));
  });
  return { r, g, b, a: o.a, clipped };
}

/** The 8-bit value that a browser paints. */
export function paint(c) {
  const q = (v) => Math.round(v * 255) / 255;
  return { r: q(c.r), g: q(c.g), b: q(c.b), a: 1, clipped: c.clipped };
}

/** fg with its alpha over an opaque bg, in gamma space, as a browser paints it. */
export function over(fg, bg) {
  const a = fg.a;
  return paint({
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    clipped: fg.clipped || bg.clipped,
  });
}

/** WCAG 2.2 relative luminance. */
export function luminance(c) {
  const f = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

export function ratio(x, y) {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** The 8-bit hex value of a painted color, such as "#e5e5e5". */
export function hex(c) {
  return `#${[c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** Gamma sRGB, 0..1, to OKLCH. The inverse of oklchToSrgb, with the matrices of the same source. */
export function srgbToOklch({ r, g, b }) {
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, Bb);
  return { l: L, c: c < 1e-4 ? 0 : c, h: c < 1e-4 ? 0 : ((Math.atan2(Bb, A) * 180) / Math.PI + 360) % 360, a: 1 };
}

/** A color as a person writes it: "oklch(L C H)", "#rgb" or "#rrggbb". */
export function parseColor(s) {
  const text = String(s).trim();
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1];
    return srgbToOklch({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 });
  }
  if (text.startsWith('oklch(')) return parseOklch(text);
  throw new Error(`"${s}" is not a color of the form "oklch(L C H)", "#rgb" or "#rrggbb".`);
}

/** The color with its chroma lowered until it is inside sRGB. The lightness and the hue stay. */
export function fitGamut(o) {
  if (!oklchToSrgb(o).clipped) return o;
  let lo = 0;
  let hi = o.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (oklchToSrgb({ ...o, c: mid }).clipped) hi = mid;
    else lo = mid;
  }
  return { ...o, c: Math.floor(lo * 1000) / 1000 };
}

/** "oklch(L C H)" with three decimals, the form of the theme files, and "oklch(L 0 0)" for a gray. */
export function formatOklch(o) {
  const n = (v) => String(+v.toFixed(3));
  const alpha = o.a === undefined || o.a === 1 ? '' : ` / ${Math.round(o.a * 100)}%`;
  return +o.c.toFixed(3) === 0 ? `oklch(${n(o.l)} 0 0${alpha})` : `oklch(${n(o.l)} ${n(o.c)} ${n(o.h)}${alpha})`;
}
