// The five extension points of each STACK part: an exported <Name>Props type, the rest attributes
// of $props() spread on the root, the class prop merged with cn() on the root, a static data-slot on the
// root, and ref = $bindable() bound to the root. The check reads each .svelte file of
// preview/src/lib/stack/ and preview/src/lib/outside/ with the parser of Svelte.
//
//   node scripts/parts.mjs             exit 1 on a problem; the last line counts the parts
//   node scripts/parts.mjs --release   also exit 1 on each part that still carries the marker
//
// A part that is not converted yet carries the marker <!-- @parts pending --> on line 1. It may lack
// the five points until a release, and a part with the marker that has all five fails, so that the
// marker goes. DESIGN.md names each part with no marker by its export path, such as
// @stack-kit/stack/parts/ListSplit. The registry files of components/ui/ keep their form, and the
// contract records their extension points as data (scripts/contract.mjs).
//
// analyse() gives what one file holds, and the contract script records it for each component.
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const MARKER = '<!-- @parts pending -->';

/** The parse function of svelte/compiler, from the root node_modules or else from preview/node_modules. */
export function svelteParse() {
  for (const from of [join(ROOT, 'package.json'), join(ROOT, 'preview/package.json')]) {
    try {
      return createRequire(from)('svelte/compiler').parse;
    } catch {}
  }
  throw new Error('svelte is not installed. Run "npm ci" in the root of the repository.');
}

// Nodes that render no element of the part: they are never its root.
const NO_ROOT = new Set(['Comment', 'SnippetBlock', 'ConstTag', 'DebugTag', 'SvelteHead', 'SvelteWindow', 'SvelteDocument', 'SvelteBody', 'SvelteOptions']);
// Components of Bits UI that render only their children, with no element of their own, whatever their
// attributes: the root of the part is inside them.
const NO_ELEMENT = new Set(['Dialog.Root', 'AlertDialog.Root', 'Sheet.Root', 'Drawer.Root', 'Popover.Root', 'DropdownMenu.Root', 'Tooltip.Root', 'Tooltip.Provider']);

const text = (source, node) => source.slice(node.start, node.end).replace(/\s+/g, ' ').trim();
const attr = (node, name) => node.attributes?.find((a) => a.type === 'Attribute' && a.name === name);

/** The value of a static attribute, such as data-slot="list-split", or null for an expression or no value. */
function staticValue(a) {
  if (!a || !Array.isArray(a.value) || !a.value.every((v) => v.type === 'Text')) return null;
  const v = a.value.map((t) => t.data).join('');
  return v || null;
}

/**
 * The names that the tree of an ESTree node reads. The property of o.name and the key of { name: v }
 * are no names that it reads, unless they are computed, as in o[name] and { [name]: v }.
 */
function identifiers(node, out = new Set(), seen = new WeakSet()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return out;
  seen.add(node);
  if (node.type === 'Identifier') out.add(node.name);
  for (const [k, v] of Object.entries(node)) {
    if (!node.computed && ((node.type === 'MemberExpression' && k === 'property') || (node.type === 'Property' && k === 'key'))) continue;
    if (Array.isArray(v)) v.forEach((x) => identifiers(x, out, seen));
    else identifiers(v, out, seen);
  }
  return out;
}

/** True when the tree of an ESTree node reads the name. */
const mentions = (node, name) => identifiers(node).has(name);

/** True when a script exports the type name, as export type, export interface or export type { name }. */
function exportsType(programs, name) {
  return programs.some((p) =>
    p.body.some(
      (st) =>
        st.type === 'ExportNamedDeclaration' &&
        (['TSTypeAliasDeclaration', 'TSInterfaceDeclaration'].includes(st.declaration?.type) ? st.declaration.id.name === name : (st.specifiers ?? []).some((s) => (s.exported.name ?? s.exported.value) === name)),
    ),
  );
}

/** Each const and each function at the top of the scripts, by name: its text, and the node that its value reads. */
function declarations(source, programs) {
  const out = new Map();
  for (const st of programs.flatMap((p) => p.body)) {
    const d = st.type === 'ExportNamedDeclaration' ? st.declaration : st;
    if (d?.type === 'FunctionDeclaration' && d.id) out.set(d.id.name, { text: text(source, d), node: d });
    if (d?.type !== 'VariableDeclaration' || d.kind !== 'const') continue;
    for (const v of d.declarations) if (v.id.type === 'Identifier') out.set(v.id.name, { text: `const ${text(source, v)}`, node: v.init });
  }
  return out;
}

/** The text of each declaration that the node names, at any depth, by name: a change of one changes a default. */
function usesOf(node, decls) {
  const out = new Map();
  (function walk(n) {
    for (const name of identifiers(n)) {
      if (!decls.has(name) || out.has(name)) continue;
      out.set(name, decls.get(name).text);
      walk(decls.get(name).node);
    }
  })(node);
  return Object.fromEntries([...out].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * The props of the $props() call of the instance script: each name with its local name, default,
 * $bindable, and the declarations of the scripts that its default names.
 */
function propsOf(source, program, decls) {
  const props = new Map();
  let rest = null;
  for (const st of program?.body ?? []) {
    const decl = st.type === 'ExportNamedDeclaration' ? st.declaration : st;
    if (decl?.type !== 'VariableDeclaration') continue;
    for (const d of decl.declarations) {
      if (d.init?.type !== 'CallExpression' || d.init.callee.type !== 'Identifier' || d.init.callee.name !== '$props') continue;
      if (d.id.type !== 'ObjectPattern') continue;
      for (const p of d.id.properties) {
        if (p.type === 'RestElement') {
          rest = p.argument.type === 'Identifier' ? p.argument.name : null;
          continue;
        }
        const name = p.key.type === 'Identifier' ? p.key.name : String(p.key.value);
        const entry = { local: null, bindable: false, default: null, uses: {} };
        let value = p.value;
        if (value.type === 'AssignmentPattern') {
          const right = value.right;
          const bindable = right.type === 'CallExpression' && right.callee.type === 'Identifier' && right.callee.name === '$bindable';
          const def = bindable ? right.arguments[0] : right;
          entry.bindable = bindable;
          if (def) {
            entry.default = text(source, def);
            entry.uses = usesOf(def, decls);
          }
          value = value.left;
        }
        entry.local = value.type === 'Identifier' ? value.name : null;
        props.set(name, entry);
      }
    }
  }
  return { props, rest };
}

/**
 * The root of the template as a list of alternatives, such as the two branches of an {#if}. A root is
 * one node: a template with more nodes at its top gives { error }. A component with no attribute,
 * such as a tooltip provider, renders no element, so the search goes on inside it. So does a root of
 * Bits UI, such as Dialog.Root with bind:open (NO_ELEMENT).
 */
function rootOf(fragment) {
  const nodes = fragment.nodes.filter((n) => !(n.type === 'Text' && !n.data.trim()) && !NO_ROOT.has(n.type));
  if (nodes.length !== 1) return { error: nodes.length ? `the template has ${nodes.length} nodes at its top, and a part has one root` : 'the template has no root element' };
  const n = nodes[0];
  if (n.type === 'IfBlock') {
    const out = [];
    for (const f of [n.consequent, n.alternate]) {
      if (!f || !f.nodes.some((x) => !(x.type === 'Text' && !x.data.trim()))) continue;
      const r = rootOf(f);
      if (r.error) return r;
      out.push(...r.nodes);
    }
    return out.length ? { nodes: out } : { error: 'the template has no root element' };
  }
  if (n.type === 'KeyBlock') return rootOf(n.fragment);
  if (n.type === 'Component' && (n.attributes.length === 0 || NO_ELEMENT.has(n.name))) return rootOf(n.fragment);
  if (!['RegularElement', 'Component', 'SvelteElement'].includes(n.type)) return { error: `the root is a ${n.type}, not an element` };
  return { nodes: [n] };
}

/** Each static data-slot name of the template, sorted. */
function slotsOf(fragment) {
  const out = new Set();
  const seen = new WeakSet();
  (function walk(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node.attributes)) {
      const v = staticValue(attr(node, 'data-slot'));
      if (v) out.add(v);
    }
    for (const v of Object.values(node)) Array.isArray(v) ? v.forEach(walk) : walk(v);
  })(fragment);
  return [...out].sort();
}

/**
 * What a .svelte file gives for the extension points and the contract:
 *   props      Map of each prop of $props() to { local, default, bindable, uses }, where uses holds
 *              the text of each const and function of the scripts that the default names
 *   rest       the name of the rest element of $props(), or null
 *   propsType  true when a script exports the type <name>Props
 *   root       { rest, class, slot, ref }: true when every root alternative spreads the rest element,
 *              merges the class prop with cn(), carries a static data-slot, and binds ref ($bindable)
 *   rootError  why the template has no single root, or null
 *   slots      each static data-slot name of the template
 *   behaviour  the words of each @behaviour line, sorted
 *   marker     true when line 1 is the marker of a part that is not converted yet
 */
export function analyse(source, name, parse = svelteParse()) {
  const ast = parse(source, { modern: true });
  const programs = [ast.module, ast.instance].filter(Boolean).map((s) => s.content);
  const { props, rest } = propsOf(source, ast.instance?.content, declarations(source, programs));
  const propsType = exportsType(programs, `${name}Props`);
  const root = { rest: false, class: false, slot: false, ref: false };
  const found = rootOf(ast.fragment);
  if (found.nodes) {
    const classLocal = props.get('class')?.local;
    const ref = props.get('ref');
    const all = (test) => found.nodes.every(test);
    root.rest = !!rest && all((n) => n.attributes.some((a) => a.type === 'SpreadAttribute' && a.expression.type === 'Identifier' && a.expression.name === rest));
    root.class = !!classLocal && all((n) => {
      const a = attr(n, 'class');
      const tag = Array.isArray(a?.value) ? (a.value.length === 1 ? a.value[0] : null) : a?.value;
      const e = tag?.type === 'ExpressionTag' ? tag.expression : null;
      return e?.type === 'CallExpression' && e.callee.type === 'Identifier' && e.callee.name === 'cn' && mentions(e, classLocal);
    });
    root.slot = all((n) => staticValue(attr(n, 'data-slot')) !== null);
    root.ref = !!ref?.bindable && !!ref.local && all((n) => n.attributes.some((a) => a.type === 'BindDirective' && a.name === (n.type === 'Component' ? 'ref' : 'this') && a.expression.type === 'Identifier' && a.expression.name === ref.local));
  }
  const behaviour = new Set();
  for (const m of source.matchAll(/@behaviour\b([^\n]*)/g)) {
    for (const w of m[1].replace(/\*\/.*$|-->.*$/, '').trim().split(/\s+/)) if (w) behaviour.add(w);
  }
  return {
    props,
    rest,
    propsType,
    root,
    rootError: found.error ?? null,
    slots: slotsOf(ast.fragment),
    behaviour: [...behaviour].sort(),
    marker: source.split('\n', 1)[0].trim() === MARKER,
  };
}

const PROBLEMS = {
  propsType: (name) => `exports no type ${name}Props`,
  rest: 'the root does not spread the rest attributes of $props(), as {...rest}',
  class: 'the root does not merge the class prop with cn(), as class={cn(..., className)}',
  slot: 'the root has no static data-slot',
  ref: 'the root does not bind ref, and $props() needs ref = $bindable(null)',
};

/**
 * The problems of one part. name is its file name, such as ListSplit, and path its export path without
 * the package name, such as parts/ListSplit. design is the text of DESIGN.md. With release, the marker
 * is a problem too.
 */
export function checkPart(source, { name, path, design, release = false, parse }) {
  const a = analyse(source, name, parse);
  const misses = [];
  if (!a.propsType) misses.push(PROBLEMS.propsType(name));
  if (a.rootError) misses.push(a.rootError);
  else for (const point of ['rest', 'class', 'slot', 'ref']) if (!a.root[point]) misses.push(PROBLEMS[point]);
  if (a.marker) {
    if (release) return [`carries the marker ${MARKER}. A release ships no part with the marker: give the part its five extension points, then remove the marker.`];
    return misses.length ? [] : [`carries the marker ${MARKER}, and it has all five extension points. Remove the marker.`];
  }
  const named = new RegExp(`(?:^|[\\s\`'"(/])${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(design);
  if (!named) misses.push(`DESIGN.md does not name @stack-kit/stack/${path}. Name the part by its export path in its definition.`);
  return misses;
}

const FOLDERS = [
  ['preview/src/lib/stack', 'parts'],
  ['preview/src/lib/outside', 'outside'],
];

/** Each .svelte file of the part folders, with its name and export path, sorted. */
function partFiles() {
  const out = [];
  for (const [dir, prefix] of FOLDERS) {
    (function walk(d) {
      for (const e of readdirSync(join(ROOT, d), { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.svelte')) {
          const rel = relative(join(ROOT, dir), join(ROOT, p)).split(sep).join('/').replace(/\.svelte$/, '');
          out.push({ file: p.split(sep).join('/'), name: basename(e.name, '.svelte'), path: posix.join(prefix, rel) });
        }
      }
    })(dir);
  }
  return out.sort((x, y) => (x.file < y.file ? -1 : x.file > y.file ? 1 : 0));
}

function main(argv) {
  const unknown = argv.filter((a) => a !== '--release');
  if (unknown.length) throw new Error(`unknown argument "${unknown[0]}". Give no argument, or --release.`);
  const release = argv.includes('--release');
  const parse = svelteParse();
  const design = readFileSync(join(ROOT, 'DESIGN.md'), 'utf8');
  const files = partFiles();
  let failed = 0;
  let pending = 0;
  for (const f of files) {
    const source = readFileSync(join(ROOT, f.file), 'utf8');
    if (source.split('\n', 1)[0].trim() === MARKER) pending++;
    const problems = checkPart(source, { ...f, design, release, parse });
    if (problems.length) failed++;
    for (const p of problems) console.error(`parts: ${f.file}: ${p}`);
  }
  console.log(`parts: ${files.length} parts, ${files.length - pending} converted, pending ${pending}${failed ? `, ${failed} with a problem` : ''}`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`parts: ${e.message}`);
    process.exitCode = 1;
  }
}
