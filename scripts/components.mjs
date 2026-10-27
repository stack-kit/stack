// The completeness check of "## Components" in DESIGN.md.
//
//   node scripts/components.mjs [--only a,b]   exit 1 on a problem; the last line is
//                                              "defined n/N, complete m/N"
//
// N counts the registry snapshot and the parts of STACK. A definition opens with "### <name>". Its parts are paragraphs that start with
// "**<Part>.**", in the order of PARTS. The Tokens part names `components` keys in backticks.
import { existsSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readSource, readDesign, section } from './lib/design.mjs';

export const SHADCN_SVELTE = '1.7.0';
// The 61 items of the live registry, styles/nova/index.json, fetched 2026-10-13.
export const REGISTRY_SNAPSHOT = '2026-10-13';
export const COMPONENTS = [
  // forms and controls
  'button', 'button-group', 'toggle', 'toggle-group', 'input', 'input-group', 'input-otp', 'textarea', 'label',
  'field', 'form', 'native-select', 'select', 'checkbox', 'radio-group', 'switch', 'slider',
  // overlays and menus
  'dialog', 'alert-dialog', 'sheet', 'drawer', 'popover', 'hover-card', 'tooltip', 'dropdown-menu',
  'context-menu', 'menubar', 'command', 'navigation-menu',
  // navigation and structure
  'sidebar', 'tabs', 'breadcrumb', 'pagination', 'accordion', 'collapsible', 'card', 'separator',
  'aspect-ratio', 'resizable', 'scroll-area', 'carousel', 'calendar', 'range-calendar',
  // data and feedback
  'table', 'badge', 'avatar', 'item', 'empty', 'kbd', 'alert', 'sonner', 'progress', 'skeleton', 'spinner',
  'attachment', 'bubble', 'marker', 'message', 'message-scroller', 'questionnaire',
  // charts
  'chart',
];
// The parts that STACK adds because the registry lacks them. Each has a definition with the nine
// parts and a showcase, and no folder in preview/src/lib/components/ui/: a product builds it from
// Bits UI, from other components or from the library of its record. The preview may keep a
// component of its own for it in preview/src/lib/stack/, as it does for the code editor.
export const STACK_PARTS = ['code-editor', 'code-block', 'diff', 'time-field', 'time-zone-field', 'selection-bar', 'reorder-list', 'stepper', 'board', 'month-view', 'day-log', 'unread-mark', 'mail-message', 'figure-band', 'qr-code'];
export const DEFINED = [...COMPONENTS, ...STACK_PARTS];
export const PARTS = ['Purpose', 'Anatomy', 'Variants', 'Sizes', 'States', 'Tokens', 'Accessibility', 'Example', 'Phone'];

/** The definitions of one "## Components" text. line0 is the file line of the first line of the text. */
export function definitions(componentsSection, line0) {
  const defs = new Map();
  let cur = null;
  let fence = null;
  let para = [];
  const flush = () => {
    if (cur && para.length) {
      const m = /^\*\*([A-Za-z]+)\.\*\*/.exec(para[0].text);
      if (m) {
        cur.parts.push({ part: m[1], line: para[0].line });
        if (m[1] === 'Tokens') {
          for (const t of para.map((p) => p.text).join(' ').matchAll(/`([^`]+)`/g)) cur.tokens.push(t[1]);
        }
      }
    }
    para = [];
  };
  componentsSection.split('\n').forEach((l, i) => {
    const line = line0 + i;
    const f = /^\s*(```+|~~~+)/.exec(l);
    if (f) {
      flush();
      if (!fence) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      return;
    }
    if (fence) return;
    const h = /^### (.+?)\s*$/.exec(l);
    if (h) {
      flush();
      cur = { line, parts: [], tokens: [] };
      if (!defs.has(h[1])) defs.set(h[1], cur);
      else defs.get(h[1]).twice = line;
      return;
    }
    if (/^\s*$/.test(l)) flush();
    else para.push({ text: l, line });
  });
  flush();
  return defs;
}

export function audit(defs, front, only) {
  const names = only ?? DEFINED;
  const keys = new Set(Object.keys(front.components ?? {}));
  const problems = [];
  for (const name of names) {
    if (!DEFINED.includes(name)) problems.push({ name, problem: 'unknown', detail: 'not in the registry snapshot and not a part of STACK' });
    const d = defs.get(name);
    if (!d) {
      problems.push({ name, problem: 'missing', detail: `no "### ${name}"` });
      continue;
    }
    if (d.twice) problems.push({ name, problem: 'part-twice', detail: `a second "### ${name}" at line ${d.twice}` });
    const seen = d.parts.map((p) => p.part);
    for (const part of PARTS) {
      const n = seen.filter((s) => s === part).length;
      if (n === 0) problems.push({ name, problem: 'part-missing', detail: `no **${part}.** part` });
      if (n > 1) problems.push({ name, problem: 'part-twice', detail: `**${part}.** appears ${n} times` });
    }
    const order = seen.filter((s) => PARTS.includes(s));
    const sorted = [...order].sort((a, b) => PARTS.indexOf(a) - PARTS.indexOf(b));
    if (order.join() !== sorted.join()) problems.push({ name, problem: 'part-order', detail: `the parts must come in the order ${PARTS.join(', ')}` });
    for (const t of d.tokens) if (!keys.has(t)) problems.push({ name, problem: 'token-unknown', detail: `\`${t}\` is not a key of components` });
  }
  if (!only) {
    for (const [name, d] of defs) if (!DEFINED.includes(name)) problems.push({ name, problem: 'unknown', detail: `"### ${name}" at line ${d.line} is not in the registry snapshot and not a part of STACK` });
  }
  return problems;
}

function main(argv) {
  const text = readSource('DESIGN.md');
  if (text === null) throw new Error('DESIGN.md not found. Run this from the root of the repository.');
  const { front, body, bodyLine } = readDesign(text);
  const sec = section(body, 'Components');
  if (sec.line < 0) throw new Error('DESIGN.md has no "## Components" section.');
  const defs = definitions(sec.text, bodyLine + sec.line);
  const i = argv.indexOf('--only');
  const only = i >= 0 ? String(argv[i + 1] ?? '').split(',').filter(Boolean) : undefined;
  const problems = audit(defs, front, only);

  const ui = 'preview/src/lib/components/ui';
  if (existsSync(ui)) {
    const dirs = readdirSync(ui, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
    for (const d of dirs) if (!COMPONENTS.includes(d)) problems.push({ name: d, problem: 'unknown', detail: `${ui}/${d} is not in the registry snapshot` });
    for (const c of COMPONENTS) if (!dirs.includes(c)) problems.push({ name: c, problem: 'missing', detail: `${ui}/${c} does not exist` });
  }

  for (const p of problems) console.log(`components: ${p.name}: ${p.problem}: ${p.detail}`);
  const names = only ?? DEFINED;
  const defined = names.filter((n) => defs.has(n)).length;
  const complete = names.filter((n) => defs.has(n) && !problems.some((p) => p.name === n)).length;
  console.log(`components: shadcn-svelte ${SHADCN_SVELTE}, registry snapshot ${REGISTRY_SNAPSHOT}`);
  console.log(`defined ${defined}/${names.length}, complete ${complete}/${names.length}`);
  return problems.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`components: ${e.message}`);
    process.exitCode = 1;
  }
}
