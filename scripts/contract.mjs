// The contract of the release: for each export path of package.json that holds code, each name that it
// exports. A component gives its type parameters with their constraints and defaults, its props (type,
// required, default, bindable), its callbacks, its snippets with their arguments, the type of its rest
// attributes, the extension points of its root, its static data-slot names and the words of its
// @behaviour lines. A type or a value gives its type. Each record also gives the members of each local
// type that its types name, such as a type Transition of one file that no export path records.
//
//   node scripts/contract.mjs write          writes preview/contract.json from the files
//   node scripts/contract.mjs check          writes nothing, and exits 1 when preview/contract.json
//                                            differs from a fresh write
//   node scripts/contract.mjs diff <a> <b>   prints the changes from a to b under Breaking, Behaviour
//                                            and Added, and exits 1 on a change of level major. a and b
//                                            are contract files or git revisions, such as v1.0.0 HEAD.
//                                            A warning line names the tool versions that differ.
//   node scripts/contract.mjs gate [v]       exits 1 when the version v, or else the version of
//                                            package.json, is below the level of the diff from the last
//                                            release tag to the files, and when the clone did not fetch
//                                            the release tags. The preversion script of npm version
//                                            gives v, before npm writes it into package.json.
//
// The levels follow the version rules of the release. Major: a removed export path, name, prop,
// callback, snippet or data-slot; a narrowed or changed type; a changed type parameter of a component;
// a new required input; a changed default, because a script cannot judge what a page shows; a root that
// loses an extension point. Behaviour, level minor: a word of an @behaviour line that comes or goes.
// Added, level minor: a new export path, name, optional prop, callback, snippet or data-slot, a widened
// type, a function type that takes an optional parameter at its end or returns a wider type, an
// extension point that the root gains. A changed parameter type of a function stays major. A member of
// a local type of a component follows the rules of a prop. An exported type that is a plain object type
// compares member by member: a new optional member is Added, and a removed or renamed member, a new
// required member, a changed or widened member type and a member that becomes required or optional are
// major. A member that is a plain object type in its turn follows the same rules, at any depth. Any
// other change of the type of a value, a class or a type is major, and so is any change of a local type
// that it names. Any type change of a bindable prop is major, because its value flows back to the
// product. No change gives level patch. A revision with no preview/contract.json, such as v1.0.0, gets
// its contract from git archive, with the "exports" of that revision, or else of the files.
//
// svelte2tsx writes the declarations of a copy of the shipped files, and TypeScript reads the types from
// them. The parser of Svelte gives the defaults, the root and the data-slot names (scripts/parts.mjs).
// The script loads svelte2tsx, TypeScript and Svelte from preview/node_modules, and it runs from any
// folder.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { analyse } from './parts.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = 'preview/contract.json';
const LIB = 'preview/src/lib';
const CODE = /\.(svelte|ts|js)$/;
const TSCONFIG = {
  compilerOptions: {
    module: 'esnext',
    moduleResolution: 'bundler',
    target: 'esnext',
    strict: true,
    exactOptionalPropertyTypes: true,
    allowJs: true,
    skipLibCheck: true,
    allowImportingTsExtensions: true,
    verbatimModuleSyntax: true,
    types: [],
  },
};

// sortUnions(s) returns the type string s with the members of every union, at every depth, sorted,
// so that two strings of one type compare equal whatever the order in which TypeScript made them.
const OPEN = { '(': ')', '[': ']', '{': '}', '<': '>' };

// splitTop(s, sep) splits s at each sep outside brackets and quotes. The > of => closes no bracket. A
// union ends at a top-level =>, because the rest is the return type of a function: so splitTop(s, '|')
// keeps "(v: number) => 'md' | 'sm'" whole, and splitTop(s, '=>') splits the function there.
function splitTop(s, sep) {
  const out = [];
  let depth = [], cur = '', q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { cur += c; if (c === '\\') { cur += s[++i] ?? ''; } else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; cur += c; continue; }
    if (!depth.length && s.startsWith(sep, i) && !(sep === '|' && s[i + 1] === '|')) {
      out.push(cur); cur = ''; i += sep.length - 1; continue;
    }
    if (c === '=' && s[i + 1] === '>') {
      if (!depth.length && sep === '|') { cur += s.slice(i); break; }
      cur += '=>'; i++; continue;
    }
    if (OPEN[c]) depth.push(OPEN[c]);
    else if (depth.length && c === depth[depth.length - 1]) depth.pop();
    cur += c;
  }
  out.push(cur);
  return out;
}

function inner(p) {
  let out = '', q = null;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (q) { out += c; if (c === '\\') { out += p[++i] ?? ''; } else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; continue; }
    if (OPEN[c] && !(c === '<' && p[i - 1] === '=')) {
      const stack = [OPEN[c]];
      let j = i + 1, qq = null;
      for (; j < p.length && stack.length; j++) {
        const d = p[j];
        if (qq) { if (d === '\\') j++; else if (d === qq) qq = null; continue; }
        if (d === '"' || d === "'" || d === '`') { qq = d; continue; }
        if (OPEN[d]) stack.push(OPEN[d]);
        else if (d === stack[stack.length - 1] && !(d === '>' && p[j - 1] === '=')) stack.pop();
      }
      const body = p.slice(i + 1, j - 1);
      out += c + list(body) + p[j - 1];
      i = j - 1;
      continue;
    }
    out += c;
  }
  return out;
}

function list(body) {
  const sep = splitTop(body, ';').length > 1 ? ';' : ',';
  const els = splitTop(body, sep).map((el) => {
    const k = splitTop(el, ':');
    if (k.length > 1) return k[0] + ':' + sortUnions(k.slice(1).join(':'));
    return sortUnions(el);
  });
  if (sep !== ';') return els.join(sep);
  // The members of an object type, sorted: their order has no meaning, and TypeScript prints them in
  // the order in which it made the type, which a change of another file can change. A call or a
  // construct signature is an overload, and the order of overloads has a meaning: the signatures come
  // first, in their own order.
  const all = els.map((e) => e.trim()).filter(Boolean);
  const isSignature = (e) => /^(new\s*)?[(<]/.test(e);
  const items = [...all.filter(isSignature), ...all.filter((e) => !isSignature(e)).sort(byName)];
  const end = !els[els.length - 1].trim() ? ';' : '';
  return body.match(/^\s*/)[0] + items.join('; ') + end + body.match(/\s*$/)[0];
}

/** A member of a union: a function sorts its parameters and the unions of its return type. */
function member(p) {
  const [head, ...rest] = splitTop(p, '=>');
  return rest.length ? `${inner(head)}=>${sortUnions(rest.join('=>'))}` : inner(p);
}

export function sortUnions(s) {
  if (!s.trim()) return s;
  const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
  const parts = splitTop(s.trim(), '|').map((p) => member(p.trim()));
  return lead + (parts.length > 1 ? parts.sort().join(' | ') : parts[0]) + tail;
}

let tools = null;
/** svelte2tsx, TypeScript and the parser of Svelte, from preview/node_modules, with their versions. */
function load() {
  if (tools) return tools;
  const require = createRequire(join(ROOT, 'preview/package.json'));
  const version = (name) => {
    try {
      return JSON.parse(readFileSync(require.resolve(`${name}/package.json`), 'utf8')).version;
    } catch {
      throw new Error(`${name} is not installed in preview/. Run "npm ci" in preview/.`);
    }
  };
  const versions = { svelte2tsx: version('svelte2tsx'), typescript: version('typescript'), svelte: version('svelte') };
  tools = {
    versions,
    emitDts: require('svelte2tsx').emitDts,
    shims: require.resolve('svelte2tsx/svelte-shims-v4.d.ts'),
    ts: require('typescript'),
    parse: require('svelte/compiler').parse,
  };
  return tools;
}

/** The files under dir, as sorted paths relative to dir. Finder writes .DS_Store, and npm never packs it. */
function walk(dir, base = dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.DS_Store' || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out.sort();
}

/** The paths under LIB that "files" of package.json ships, relative to LIB, such as stack and utils.ts. */
function shippedPaths(pkg) {
  return (pkg.files ?? []).filter((f) => f.startsWith(`${LIB}/`)).map((f) => f.slice(LIB.length + 1).replace(/\/$/, ''));
}

/** The files that "files" of package.json names by their own path outside LIB, such as scripts/lib/email-roles.mjs. */
function shippedOutside(pkg) {
  return (pkg.files ?? []).filter((f) => !f.startsWith(`${LIB}/`) && !f.endsWith('/') && /\.m?[jt]s$/.test(f));
}

/**
 * A new folder that holds LIB, a copy of the shipped sources, and a link to preview/node_modules, so
 * that the packages resolve as they do in the preview. LIB has the depth that it has in the package,
 * so that an import of a shipped file outside LIB, such as ../../../../scripts/lib/email-roles.mjs,
 * resolves in the folder. fill(lib, dir) puts the sources into lib, and a file outside LIB into dir.
 */
function workspace(fill) {
  // The real path, because TypeScript resolves an import to a real path, and /tmp can be a link.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'stack-contract-')));
  const lib = join(dir, LIB);
  mkdirSync(lib, { recursive: true });
  symlinkSync(join(ROOT, 'preview/node_modules'), join(dir, 'node_modules'), 'dir');
  try {
    fill(lib, dir);
    // The sources import #lib/*, as the package does. Map it to the copy.
    writeFileSync(join(lib, 'package.json'), `${JSON.stringify({ type: 'module', imports: { '#lib/*': './*' } })}\n`);
    writeFileSync(join(dir, 'tsconfig.json'), `${JSON.stringify(TSCONFIG)}\n`);
  } catch (e) {
    rmSync(dir, { recursive: true, force: true });
    throw e;
  }
  return dir;
}

/** The workspace of the files on disk. */
function fromFiles(pkg) {
  return workspace((lib, dir) => {
    for (const p of shippedPaths(pkg)) {
      const from = join(ROOT, LIB, p);
      if (!existsSync(from)) throw new Error(`"files" of package.json names ${LIB}/${p}, which does not exist.`);
      cpSync(from, join(lib, p), { recursive: true, filter: (f) => !f.endsWith('.DS_Store') });
    }
    for (const f of shippedOutside(pkg)) cpSync(join(ROOT, f), join(dir, f));
  });
}

/** The workspace of a folder whose layout is that of LIB, such as a test case. */
export function fromFolder(...folders) {
  return workspace((lib) => folders.forEach((f) => cpSync(f, lib, { recursive: true })));
}

/**
 * The export paths that hold code, each with its file relative to LIB. A "*" matches each shipped file
 * that fits. A target that ends with .js also matches the .ts file of that name, which an older release
 * shipped for some rune modules.
 */
function exportFiles(exportsMap, files) {
  const out = new Map();
  for (const [key, target] of Object.entries(exportsMap ?? {})) {
    if (typeof target !== 'string' || !CODE.test(target)) continue;
    if (!target.startsWith(`./${LIB}/`)) throw new Error(`"exports" of package.json maps ${key} to ${target}, outside ${LIB}.`);
    const t = target.slice(LIB.length + 3);
    const forms = t.endsWith('.js') ? [t, `${t.slice(0, -3)}.ts`] : [t];
    for (const form of forms) {
      const star = form.indexOf('*');
      if (star < 0) {
        if (files.includes(form) && !out.has(key)) out.set(key, form);
        continue;
      }
      const [head, tail] = [form.slice(0, star), form.slice(star + 1)];
      for (const f of files) {
        if (f.length <= head.length + tail.length || !f.startsWith(head) || !f.endsWith(tail)) continue;
        const name = key.replace('*', f.slice(head.length, f.length - tail.length));
        if (!out.has(name)) out.set(name, f);
      }
    }
  }
  return new Map([...out].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const declarationOf = (file) => (file.endsWith('.svelte') ? `${file}.d.ts` : file.replace(/\.(ts|js)$/, '.d.ts'));
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sorted = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => byName(a, b)));

/** The contract object of a workspace. exportsMap is "exports" of package.json; version is the release. */
export async function contractOf(dir, exportsMap, version) {
  const { versions, emitDts, shims, ts, parse } = load();
  const lib = join(dir, LIB);
  const types = join(dir, 'types');
  const files = walk(lib);
  const entries = exportFiles(exportsMap, files);
  await emitDts({ libRoot: lib, declarationDir: types, svelteShimsPath: shims, tsconfig: join(dir, 'tsconfig.json') });
  // The declarations keep the #lib imports of the sources. Map #lib/* to the folder of the declarations.
  writeFileSync(join(types, 'package.json'), `${JSON.stringify({ type: 'module', imports: { '#lib/*': './*' } })}\n`);
  // skipLibCheck is off, because TypeScript reports no TS2307 in a declaration file with it on. It
  // changes no type: only the declarations under types/ are checked, below.
  const program = ts.createProgram(
    walk(types).filter((f) => f.endsWith('.d.ts')).map((f) => join(types, f)),
    { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ESNext, strict: true, exactOptionalPropertyTypes: true, skipLibCheck: false, types: [] },
  );
  const checker = program.getTypeChecker();
  const typesDir = `${types}/`;
  const own = (decl) => decl.getSourceFile().fileName.startsWith(typesDir);
  const FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType;
  // A type string names no absolute path: a declaration becomes lib/, and a package keeps its name.
  const norm = (s) => s.split(typesDir).join('lib/').replace(/import\("[^"]*\/node_modules\//g, 'import("');
  const show = (t, flags = 0) => sortUnions(norm(checker.typeToString(t, undefined, FLAGS | flags)));
  const signature = (g) => sortUnions(norm(checker.signatureToString(g, undefined, FLAGS)));
  const isUndefined = (t) => (t.flags & ts.TypeFlags.Undefined) !== 0;
  const core = (t) => {
    if (!t.isUnion()) return t;
    const rest = t.types.filter((m) => !isUndefined(m));
    return rest.length === 1 ? rest[0] : t;
  };
  const isSnippet = (t) => t.symbol?.name === 'Snippet' && /[\\/]svelte[\\/]/.test(t.symbol.declarations?.[0]?.getSourceFile().fileName ?? '');
  const snippetArgs = (t) => {
    const [tuple] = checker.getTypeArguments(t);
    return tuple ? checker.getTypeArguments(tuple).map((a) => show(a)) : [];
  };
  /** An object type as its members, sorted: { a: T; b?: U; (x: X): Y }. */
  const expand = (t) => {
    const members = checker
      .getPropertiesOfType(t)
      .filter((p) => !p.name.startsWith('#') && !p.name.startsWith('__@'))
      .map((p) => {
        const d = p.declarations?.[0];
        const ro = d && ts.getCombinedModifierFlags(d) & ts.ModifierFlags.Readonly ? 'readonly ' : '';
        if (d && ts.getCombinedModifierFlags(d) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) return null;
        return `${ro}${p.name}${p.flags & ts.SymbolFlags.Optional ? '?' : ''}: ${show(checker.getTypeOfSymbolAtLocation(p, d))}`;
      })
      .filter(Boolean)
      .sort(byName);
    for (const g of t.getCallSignatures()) members.push(signature(g));
    for (const info of checker.getIndexInfosOfType(t)) members.push(`[key: ${show(info.keyType)}]: ${show(info.type)}`);
    return `{ ${members.join('; ')} }`;
  };
  /** The type parameters of a declaration, such as <T extends { id: string }>, or ''. */
  const params = (d) => (d?.typeParameters?.length ? `<${d.typeParameters.map((p) => p.getText().replace(/\s+/g, ' ')).join(', ')}> ` : '');

  /** The type of the rest attributes: the parts of the props type that hold props from outside the release. */
  const restOf = (propsType) => {
    const out = new Set();
    const visit = (t) => {
      const alias = t.aliasSymbol?.declarations?.[0];
      if (!(alias && !own(alias)) && (t.isUnion() || t.isIntersection())) return t.types.forEach(visit);
      const inherited = checker.getPropertiesOfType(t).some((p) => !(p.declarations ?? []).some(own));
      if (inherited) out.add(show(t));
    };
    visit(propsType);
    return out.size ? [...out].sort(byName).join(' & ') : null;
  };

  // Each symbol that an export path records. The loop of the records fills it, and the local types
  // come after that loop: an alias that resolves in another order can resolve to any, as Calendar of
  // ./ui/calendar did.
  const recorded = new Set();
  const visible = (p) => {
    const d = p.declarations?.[0];
    return !p.name.startsWith('#') && !p.name.startsWith('__@') && !(d && ts.getCombinedModifierFlags(d) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected));
  };
  /** True when sym is a type of the release that no export path records, such as a type Transition of one file. */
  const local = (sym) => !!sym && !recorded.has(sym) && !sym.name.startsWith('$$') && !sym.name.startsWith('__') && (sym.declarations ?? []).some(own);
  /** A local type as its members, each with its type and need, or else as its type string. */
  const localEntry = (sym, declared) => {
    const p = params(sym.declarations[0]).trim();
    const props = checker.getPropertiesOfType(declared).filter(visible);
    const plain = !declared.isUnionOrIntersection() && declared.flags & ts.TypeFlags.Object && props.length && !declared.getCallSignatures().length && !declared.getConstructSignatures().length && !checker.getIndexInfosOfType(declared).length;
    const head = p ? { params: p } : {};
    if (!plain) return { ...head, type: sym.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface) ? expand(declared) : show(declared, ts.TypeFormatFlags.InTypeAlias) };
    const members = {};
    // The type at the declaration, as for a prop: it holds no undefined for an optional member.
    for (const m of props) members[m.name] = { type: show(m.declarations?.[0] ? checker.getTypeOfSymbolAtLocation(m, m.declarations[0]) : checker.getTypeOfSymbol(m)), required: !(m.flags & ts.SymbolFlags.Optional) };
    return { ...head, members: sorted(members) };
  };
  /**
   * The local types that the types of roots reach, at any depth, by name, or null. A type string names
   * a local type, such as Transition[], and this record holds its members, so that a change of them
   * shows. bodies are recorded types whose own structure the walk reads, such as the instance type of
   * a class. A type of a package ends the walk, and so does a type that an export path records.
   */
  const localTypes = (roots, bodies = []) => {
    const found = new Map();
    // One set for a type as a name and one for its structure: take() reads the structure of a type
    // that the walk met as a name.
    const seen = [new Set(), new Set()];
    const take = (sym) => {
      if (found.has(sym.name)) return;
      const declared = checker.getDeclaredTypeOfSymbol(sym);
      found.set(sym.name, localEntry(sym, declared));
      visit(declared, true);
    };
    const visit = (t, body = false) => {
      if (!t || seen[+body].has(t)) return;
      seen[+body].add(t);
      if (!body && t.aliasSymbol) {
        (t.aliasTypeArguments ?? []).forEach((x) => visit(x));
        if (local(t.aliasSymbol)) take(t.aliasSymbol);
        return;
      }
      if (t.isUnionOrIntersection()) return t.types.forEach((x) => visit(x));
      if (!(t.flags & ts.TypeFlags.Object)) return;
      // A named object type: an instance type, an interface, or a reference such as Array<T>. The
      // static side of a class is no name, so the walk reads its construct signatures.
      const named = t.objectFlags & ts.ObjectFlags.Reference ? t.target.symbol : t.objectFlags & (ts.ObjectFlags.Class | ts.ObjectFlags.Interface) ? t.symbol : null;
      if (t.objectFlags & ts.ObjectFlags.Reference) checker.getTypeArguments(t).forEach((x) => visit(x));
      if (!body && (named || t.objectFlags & ts.ObjectFlags.Reference)) {
        if (local(named)) take(named);
        return;
      }
      for (const p of checker.getPropertiesOfType(t).filter(visible)) visit(checker.getTypeOfSymbol(p));
      for (const g of [...t.getCallSignatures(), ...t.getConstructSignatures()]) {
        for (const p of g.getParameters()) visit(checker.getTypeOfSymbol(p));
        visit(g.getReturnType());
      }
      for (const info of checker.getIndexInfosOfType(t)) visit(info.type);
    };
    roots.forEach((t) => visit(t));
    bodies.forEach((t) => visit(t, true));
    return found.size ? sorted(Object.fromEntries(found)) : null;
  };
  /** The record with its local types, after the snippets of a component, or else at its end. */
  const withTypes = (rec, t) => {
    if (!('rest' in rec)) return { ...rec, types: t };
    const { rest, root, slots, behaviour, ...inputs } = rec;
    return { ...inputs, types: t, rest, root, slots, behaviour };
  };

  const analyses = new Map();
  /** The record of a component, from its declaration file and its source. */
  const component = (sym, sourceFile) => {
    const rel = sourceFile.slice(typesDir.length).replace(/\.d\.ts$/, '');
    if (!analyses.has(rel)) {
      const name = posix.basename(rel, '.svelte');
      analyses.set(rel, analyse(readFileSync(join(lib, rel), 'utf8'), name, parse));
    }
    const a = analyses.get(rel);
    const decl = sym.valueDeclaration ?? sym.declarations[0];
    const sig = checker.getTypeOfSymbolAtLocation(sym, decl).getCallSignatures()[0];
    const propsParam = sig?.getParameters()[1];
    const propsType = propsParam ? checker.getTypeOfSymbolAtLocation(propsParam, decl) : null;
    // The type parameters of a generic component, such as T extends { id: string; }, with their
    // constraints and defaults: a narrower constraint refuses a type that a product passes.
    const typeParams = sig?.getTypeParameters() ?? [];
    const generics = typeParams.map((p) => {
      const [c, d] = [p.getConstraint(), p.getDefault()];
      return `${show(p)}${c ? ` extends ${show(c)}` : ''}${d ? ` = ${show(d)}` : ''}`;
    });
    const rec = { ...(generics.length ? { generics } : {}), props: {}, callbacks: {}, snippets: {}, rest: propsType ? restOf(propsType) : null, root: a.root, slots: a.slots, behaviour: a.behaviour };
    const roots = typeParams.map((p) => p.getConstraint()).filter(Boolean);
    for (const p of propsType ? checker.getPropertiesOfType(propsType) : []) {
      // A prop of the release, also when it narrows an attribute of the same name, such as title.
      // svelte2tsx gives a component with no $props() the props $$events and $$slots of Svelte 4.
      const pd = p.declarations?.find(own);
      if (!pd || p.name.startsWith('$$')) continue;
      const t = checker.getTypeOfSymbolAtLocation(p, pd);
      roots.push(t);
      const required = !(p.flags & ts.SymbolFlags.Optional);
      const src = a.props.get(p.name);
      const extra = {};
      if (src?.default != null) extra.default = src.default;
      // The declarations that the default names, such as const cards = (n: number) => ...
      if (src && Object.keys(src.uses).length) extra.defaultNames = src.uses;
      if (src?.bindable) extra.bindable = true;
      const c = core(t);
      if (isSnippet(c)) rec.snippets[p.name] = { args: snippetArgs(c), required, ...extra };
      else if (!c.isUnion() && c.getCallSignatures().length) rec.callbacks[p.name] = { type: show(t), required, ...extra };
      else rec.props[p.name] = { type: show(t), required, ...extra };
    }
    rec.props = sorted(rec.props);
    rec.callbacks = sorted(rec.callbacks);
    rec.snippets = sorted(rec.snippets);
    return { rec, propsType, roots };
  };
  /** The declaration file of a component when sym is the default export of a .svelte.d.ts, or null. */
  const componentFile = (sym) => {
    const sf = sym.declarations?.[0]?.getSourceFile();
    if (!sf?.fileName.endsWith('.svelte.d.ts') || !sf.fileName.startsWith(typesDir)) return null;
    const mod = checker.getSymbolAtLocation(sf);
    const def = mod && checker.getExportsOfModule(mod).find((e) => e.escapedName === 'default');
    const target = def && (def.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(def) : def);
    return target === sym ? sf.fileName : null;
  };

  const out = {};
  // [export path, name, roots, bodies] of each record, for the local types.
  const walks = [];
  for (const [key, file] of entries) {
    const sf = program.getSourceFile(join(types, declarationOf(file)));
    const mod = sf && checker.getSymbolAtLocation(sf);
    if (!mod) throw new Error(`svelte2tsx wrote no declarations for ${file}, the file of ${key}.`);
    const names = {};
    const propsTypes = [];
    const typeExports = [];
    for (const exp of checker.getExportsOfModule(mod)) {
      const target = exp.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exp) : exp;
      recorded.add(target);
      const decl = target.valueDeclaration ?? target.declarations?.[0];
      const cf = componentFile(target);
      if (cf) {
        const { rec, propsType, roots } = component(target, cf);
        names[exp.name] = rec;
        propsTypes.push([exp.name, propsType]);
        walks.push([key, exp.name, roots, []]);
        continue;
      }
      if (!(target.flags & ts.SymbolFlags.Value) && target.flags & ts.SymbolFlags.Type) {
        typeExports.push([exp.name, target, decl]);
        continue;
      }
      if (target.flags & ts.SymbolFlags.Class) {
        const ctor = checker.getTypeOfSymbolAtLocation(target, decl);
        const instance = checker.getDeclaredTypeOfSymbol(target);
        const news = ctor.getConstructSignatures().map((g) => `new ${signature(g)}`);
        names[exp.name] = { kind: 'class', type: `${news.join(' & ')} ${expand(instance)}` };
        walks.push([key, exp.name, [ctor], [instance]]);
      } else if (target.flags & ts.SymbolFlags.Value) {
        const t = checker.getTypeOfSymbolAtLocation(target, decl);
        const sigs = t.getCallSignatures();
        // A function is recorded by its signature, so the class strings of a tailwind-variants
        // function, which are the look, stay out of the contract.
        names[exp.name] = { kind: 'value', type: sigs.length ? sigs.map(signature).join(' & ') : show(t) };
        walks.push([key, exp.name, [t], []]);
      }
    }
    for (const [name, target, decl] of typeExports) {
      const declared = checker.getDeclaredTypeOfSymbol(target);
      // The props type of a component of this path, such as ListSplitProps: the record of the
      // component holds its props, so the type names its component and does not repeat them.
      const owner = propsTypes.filter(([, t]) => t === declared).map(([n]) => n).sort(byName)[0];
      if (owner) names[name] = { kind: 'type', type: `the props of ${owner}` };
      else if (target.flags & ts.SymbolFlags.Interface) names[name] = { kind: 'type', type: `${params(decl)}${expand(declared)}` };
      else names[name] = { kind: 'type', type: `${params(decl)}${show(declared, ts.TypeFormatFlags.InTypeAlias)}` };
      if (!owner) walks.push([key, name, [], [declared]]);
    }
    out[key] = sorted(names);
  }
  for (const [key, name, roots, bodies] of walks) {
    const t = localTypes(roots, bodies);
    if (t) out[key][name] = withTypes(out[key][name], t);
  }
  // An import that does not resolve gives its names the type any, with no error, so the contract would
  // record any. TS2307 is "Cannot find module". The other errors of the declarations do not count. The
  // check comes after the records, because it makes types, and the order in which TypeScript makes
  // them is the order in which it prints the keys of a mapped type.
  const missing = program
    .getSourceFiles()
    .filter((sf) => sf.fileName.startsWith(typesDir))
    .flatMap((sf) => program.getSemanticDiagnostics(sf).filter((d) => d.code === 2307).map((d) => `${sf.fileName.slice(typesDir.length)}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`));
  if (missing.length) throw new Error(`an import of the declarations that svelte2tsx wrote does not resolve, so its type would be any. Fix the import in the source, or install the package in preview/:\n${missing.join('\n')}`);
  return { stack: version, tool: versions, exports: out };
}

/** The contract of the files on disk. */
export async function contractOfFiles() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const dir = fromFiles(pkg);
  try {
    return await contractOf(dir, pkg.exports, pkg.version);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const serialise = (contract) => `${JSON.stringify(contract, null, '\t')}\n`;

const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
const gitOk = (...args) => {
  try {
    git(...args);
    return true;
  } catch {
    return false;
  }
};

/** The contract of a contract file or of a git revision. */
export async function contractAt(arg) {
  if (existsSync(arg) && statSync(arg).isFile()) return JSON.parse(readFileSync(arg, 'utf8'));
  let rev;
  try {
    rev = git('rev-parse', '--verify', '--quiet', `${arg}^{commit}`).trim();
  } catch {
    throw new Error(`"${arg}" is neither a contract file nor a git revision.`);
  }
  if (gitOk('cat-file', '-e', `${rev}:${OUT}`)) return JSON.parse(git('show', `${rev}:${OUT}`));
  const at = JSON.parse(git('show', `${rev}:package.json`));
  const files = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const paths = [...new Set([...shippedPaths(files), ...shippedPaths(at)])].filter((p) => gitOk('cat-file', '-e', `${rev}:${LIB}/${p}`));
  console.error(`contract: ${arg} holds no ${OUT}, so its contract comes from git archive of ${rev.slice(0, 7)}.`);
  const dir = workspace((lib) => {
    const tar = execFileSync('git', ['-C', ROOT, 'archive', '--format=tar', rev, '--', ...paths.map((p) => `${LIB}/${p}`)], { maxBuffer: 1 << 28 });
    execFileSync('tar', ['-x', '-C', lib, '--strip-components=3'], { input: tar });
  });
  try {
    return await contractOf(dir, at.exports ?? files.exports, at.version);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const LEVELS = { patch: 0, minor: 1, major: 2 };
const SECTIONS = ['Breaking', 'Behaviour', 'Added'];
const KINDS = [
  ['props', 'prop'],
  ['callbacks', 'callback'],
  ['snippets', 'snippet'],
];
const ROOT_POINTS = {
  rest: ['the root spreads the rest attributes', 'the root no longer spreads the rest attributes'],
  class: ['the root merges class with cn()', 'the root no longer merges class with cn()'],
  slot: ['the root has a data-slot', 'the root has no data-slot'],
  ref: ['the root binds ref', 'the root no longer binds ref'],
};
const isComponent = (r) => r && typeof r === 'object' && 'props' in r && !('kind' in r);
const kindOf = (r) => (isComponent(r) ? 'component' : r.kind);
/** The members of a union type string. A member in parentheses, such as ((x: T) => void), loses them. */
const members = (u) =>
  splitTop(sortUnions(u), '|').map((m) => {
    const t = m.trim();
    return t.startsWith('(') && closes(t) ? t.slice(1, -1).trim() : t;
  });
/** True when the bracket that opens t closes at its last character. */
function closes(t) {
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '(') depth++;
    else if (t[i] === ')' && --depth === 0) return i === t.length - 1;
  }
  return false;
}
const keys = (...objs) => [...new Set(objs.flatMap((o) => Object.keys(o ?? {})))].sort(byName);

/** The parameters and the return type of a function type such as (a: A, b?: B) => R, or null. */
function signatureOf(t) {
  const [head, ...rest] = splitTop(t, '=>');
  const h = head.trim();
  if (!rest.length || !h.startsWith('(') || !closes(h)) return null;
  const inside = h.slice(1, -1).trim();
  return { params: inside ? splitTop(inside, ',').map((p) => p.trim()) : [], ret: rest.join('=>').trim() };
}

/**
 * True when a function that fits the function type a also fits b. A product gives the function, and
 * the part calls it, so b may add optional parameters at the end and widen the return type. Each
 * parameter of a stays as it is: a parameter type that changes in any way is a change of the type.
 * The rule assumes that the product gives the function. A function that a part gives to the product,
 * such as a function of an exported type that the product calls, goes the other way: there a wider
 * return type can break the product, and this rule still shows it as widened, under Added.
 */
function fnWidens(a, b) {
  const [fa, fb] = [signatureOf(a), signatureOf(b)];
  if (!fa || !fb || fb.params.length < fa.params.length) return false;
  if (!fa.params.every((p, i) => p === fb.params[i])) return false;
  if (!fb.params.slice(fa.params.length).every((p) => /^[\w$]+\?:/.test(p))) return false;
  const rb = members(fb.ret);
  return rb.includes('unknown') || rb.includes('any') || members(fa.ret).every((v) => rb.includes(v));
}

/** The change of a type string: widened is Added, and narrowed or changed is Breaking. */
function typeChange(label, x, y, major, added) {
  if (sortUnions(x) === sortUnions(y)) return;
  const [mx, my] = [members(x), members(y)];
  const text = `${sortUnions(x)} -> ${sortUnions(y)}`;
  // Each member of x is in y, or a function member of y takes each function that it takes.
  if (mx.every((v) => my.includes(v) || my.some((w) => fnWidens(v, w)))) added(`${label} widened: ${text}`);
  else if (my.every((v) => mx.includes(v))) major(`${label} narrowed: ${text}`);
  else major(`${label} type changed: ${text}`);
}

/** The index of the bracket that closes the bracket at s[i], or -1. A quote and the > of => close nothing. */
function closeOf(s, i) {
  if (!OPEN[s[i]]) return -1;
  const stack = [];
  let q = null;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '=' && s[j + 1] === '>') j++;
    else if (OPEN[c]) stack.push(OPEN[c]);
    else if (c === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return j;
    }
  }
  return -1;
}

const MEMBER = /^(readonly\s+)?([\w$]+|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")(\?)?:\s*([\s\S]+)$/;

/**
 * A plain object type string, such as <T> { a: T; b?: U; }, as { head, members }, or null. head is the
 * type parameters before the brace, and members maps each name to { type, required, readonly }. Any
 * other type gives null: a union, an intersection, a call, construct or index signature, a method, a
 * getter, or an object with no member.
 */
function objectOf(t) {
  const s = t.trim();
  const end = s.startsWith('<') ? closeOf(s, 0) + 1 : 0;
  const body = s.slice(end).trim();
  if (!body.startsWith('{') || closeOf(body, 0) !== body.length - 1) return null;
  const members = new Map();
  for (const e of splitTop(body.slice(1, -1), ';').map((x) => x.trim()).filter(Boolean)) {
    const m = MEMBER.exec(e);
    if (!m) return null;
    members.set(m[2], { type: sortUnions(m[4].trim()), required: !m[3], readonly: !!m[1] });
  }
  return members.size ? { head: s.slice(0, end).trim(), members } : null;
}

/**
 * The changes of two plain object types, member by member, by the rules of an exported type. A new
 * optional member is Added. Each other change of a member is Breaking, also a widened type or a member
 * that becomes optional, because a product can read a value of the type as well as give one. A member
 * whose type is a plain object type in both follows the same rules, at any depth, because its members
 * belong to the same value. A member of any other type, such as an array or a union of objects,
 * compares as a whole string. False when x or y is no plain object type, or when their type parameters
 * differ: the caller then compares the whole strings.
 */
function objectChanges(x, y, major, added, path = '') {
  const [a, b] = [objectOf(sortUnions(x)), objectOf(sortUnions(y))];
  if (!a || !b || a.head !== b.head) return false;
  const shape = (m) => `${m.readonly} ${m.type} ${m.required}`;
  const gone = [...a.members.keys()].filter((k) => !b.members.has(k)).sort(byName);
  const fresh = new Set([...b.members.keys()].filter((k) => !a.members.has(k)));
  for (const name of gone) {
    // A rename: one name goes, and one new name of the same type and need comes.
    const same = [...fresh].filter((k) => shape(b.members.get(k)) === shape(a.members.get(name)));
    const others = gone.filter((g) => shape(a.members.get(g)) === shape(a.members.get(name)));
    if (same.length === 1 && others.length === 1) {
      major(`member ${path}${name} renamed to ${path}${same[0]}`);
      fresh.delete(same[0]);
    } else major(`member ${path}${name} removed`);
  }
  for (const name of [...fresh].sort(byName)) {
    const m = b.members.get(name);
    (m.required ? major : added)(`new ${m.required ? 'required' : 'optional'} member ${path}${name}: ${m.type}`);
  }
  for (const name of [...a.members.keys()].filter((k) => b.members.has(k)).sort(byName)) {
    const [p, q] = [a.members.get(name), b.members.get(name)];
    const label = `member ${path}${name}`;
    if (p.type !== q.type && !objectChanges(p.type, q.type, major, added, `${path}${name}.`)) typeChange(label, p.type, q.type, major, major);
    if (p.required !== q.required) major(`${label} became ${q.required ? 'required' : 'optional'}`);
    if (p.readonly !== q.readonly) major(`${label} ${q.readonly ? 'became readonly' : 'is no longer readonly'}`);
  }
  return true;
}

/**
 * The changes of the inputs of a component, or of the members of a local type. om and nm map each name
 * to { kind, word, type or args, required, default, bindable }. major(text) and added(text) take each
 * change.
 */
function inputChanges(om, nm, major, added) {
  const shape = (m) => `${m.kind} ${m.kind === 'snippets' ? m.args.map(sortUnions).join(', ') : sortUnions(m.type)} ${m.required}`;
  const show = (m, name) => `${m.word} ${name}${m.kind === 'snippets' ? `(${m.args.join(', ')})` : `: ${m.type}`}`;
  const gone = [...om.keys()].filter((k) => !nm.has(k)).sort(byName);
  const fresh = new Set([...nm.keys()].filter((k) => !om.has(k)));
  for (const name of gone) {
    // A rename: one name goes, and one new name of the same kind, type and need comes.
    const same = [...fresh].filter((k) => shape(nm.get(k)) === shape(om.get(name)));
    const others = gone.filter((g) => shape(om.get(g)) === shape(om.get(name)));
    if (same.length === 1 && others.length === 1) {
      major(`${om.get(name).word} ${name} renamed to ${same[0]}`);
      fresh.delete(same[0]);
    } else major(`${om.get(name).word} ${name} removed`);
  }
  for (const name of [...fresh].sort(byName)) {
    const m = nm.get(name);
    (m.required ? major : added)(`new ${m.required ? 'required' : 'optional'} ${show(m, name)}`);
  }
  for (const name of keys(Object.fromEntries(om)).filter((k) => nm.has(k))) {
    const a = om.get(name);
    const b = nm.get(name);
    const label = `${a.word} ${name}`;
    if (a.kind !== b.kind) {
      major(`${name} changed from a ${a.word} to a ${b.word}`);
      continue;
    }
    if (a.kind === 'snippets') {
      const x = a.args.map(sortUnions);
      const y = b.args.map(sortUnions);
      if (x.join('\n') !== y.join('\n')) {
        if (y.length > x.length && x.every((v, i) => v === y[i])) added(`${label} takes more arguments: (${a.args.join(', ')}) -> (${b.args.join(', ')})`);
        else major(`${label} arguments changed: (${a.args.join(', ')}) -> (${b.args.join(', ')})`);
      }
    } else {
      // The value of a bindable prop flows back into the bind: variable of the product, so a
      // widened type breaks it too.
      typeChange(label, a.type, b.type, major, a.bindable ? (t) => major(`${t}, and the prop is bindable`) : added);
    }
    if (a.required && !b.required) added(`${label} became optional`);
    if (!a.required && b.required) major(`${label} became required`);
    const names = keys(a.defaultNames, b.defaultNames).filter((k) => a.defaultNames?.[k] !== b.defaultNames?.[k]);
    if ((a.default ?? null) !== (b.default ?? null)) major(`${label} default changed: ${a.default ?? 'none'} -> ${b.default ?? 'none'}`);
    else if (names.length) major(`${label} default changed: the declaration of ${names.join(', ')} changed`);
    if (a.bindable && !b.bindable) major(`${label} is no longer bindable`);
    if (!a.bindable && b.bindable) added(`${label} became bindable`);
  }
}

/**
 * The changes of each local type that both records hold, by the rules of an input. A local type that
 * comes or goes is no change of its own: the type string that names it shows the change.
 */
function typesChanges(ot, nt, major, added) {
  const text = (e) => e.type ?? `{ ${Object.entries(e.members).map(([k, m]) => `${k}${m.required ? '' : '?'}: ${m.type}`).join('; ')} }`;
  for (const name of keys(ot).filter((k) => nt?.[k])) {
    const [a, b] = [ot[name], nt[name]];
    const [ma, ad] = [(t) => major(`type ${name}: ${t}`), (t) => added(`type ${name}: ${t}`)];
    if ((a.params ?? '') !== (b.params ?? '')) ma(`type parameters changed: ${a.params ?? 'none'} -> ${b.params ?? 'none'}`);
    const map = (e) => new Map(Object.entries(e.members).map(([k, m]) => [k, { ...m, kind: 'members', word: 'member' }]));
    if (a.members && b.members) inputChanges(map(a), map(b), ma, ad);
    else if (!a.members && !b.members) typeChange(`type ${name}`, a.type, b.type, major, added);
    else ma(`changed: ${text(a)} -> ${text(b)}`);
  }
}

/** The changes of one component. Each change goes to out(level, section, text). */
function componentChanges(where, o, n, out) {
  const major = (t) => out('major', 'Breaking', `${where}: ${t}`);
  const added = (t) => out('minor', 'Added', `${where}: ${t}`);
  const generics = (r) => (r.generics?.length ? `<${r.generics.map(sortUnions).join(', ')}>` : 'none');
  if (generics(o) !== generics(n)) major(`type parameters changed: ${generics(o)} -> ${generics(n)}`);
  const all = (r) => new Map(KINDS.flatMap(([kind, word]) => Object.entries(r[kind] ?? {}).map(([name, m]) => [name, { ...m, kind, word }])));
  inputChanges(all(o), all(n), major, added);
  typesChanges(o.types, n.types, major, added);
  const [ra, rb] = [o.rest ?? null, n.rest ?? null].map((r) => (r === null ? null : sortUnions(r)));
  if (ra !== rb) {
    if (ra === null) added(`takes rest attributes: ${rb}`);
    else if (rb === null) major(`takes no rest attributes, and took ${ra}`);
    else major(`rest attributes changed: ${ra} -> ${rb}`);
  }
  for (const [point, [gain, loss]] of Object.entries(ROOT_POINTS)) {
    if (o.root?.[point] && !n.root?.[point]) major(loss);
    if (!o.root?.[point] && n.root?.[point]) added(gain);
  }
  for (const s of (o.slots ?? []).filter((x) => !(n.slots ?? []).includes(x))) major(`data-slot '${s}' removed`);
  for (const s of (n.slots ?? []).filter((x) => !(o.slots ?? []).includes(x))) added(`new data-slot '${s}'`);
  for (const w of (o.behaviour ?? []).filter((x) => !(n.behaviour ?? []).includes(x))) out('minor', 'Behaviour', `${where}: behaviour ${w} removed`);
  for (const w of (n.behaviour ?? []).filter((x) => !(o.behaviour ?? []).includes(x))) out('minor', 'Behaviour', `${where}: behaviour ${w} added`);
}

/**
 * The changes from contract a to contract b. Each change has a level (major or minor), a section
 * (Breaking, Behaviour or Added) and a text. The level of the whole is the highest level of a change,
 * or patch when nothing changed. warning names the tool versions that differ, or is null: an update
 * of svelte2tsx or TypeScript can print a type in another way, and so give false changes.
 */
export function diff(a, b) {
  const changes = [];
  const out = (level, section, text) => changes.push({ level, section, text });
  const ea = a.exports ?? {};
  const eb = b.exports ?? {};
  for (const path of keys(ea, eb)) {
    if (!(path in eb)) {
      out('major', 'Breaking', `${path}: export path removed`);
      continue;
    }
    if (!(path in ea)) {
      out('minor', 'Added', `${path}: new export path`);
      continue;
    }
    for (const name of keys(ea[path], eb[path])) {
      const o = ea[path][name];
      const n = eb[path][name];
      const where = `${path} ${name}`;
      if (!n) out('major', 'Breaking', `${where}: removed`);
      else if (!o) out('minor', 'Added', `${where}: new ${kindOf(n)}`);
      else if (kindOf(o) !== kindOf(n)) out('major', 'Breaking', `${where}: changed from a ${kindOf(o)} to a ${kindOf(n)}`);
      else if (isComponent(o)) componentChanges(where, o, n, out);
      else {
        const major = (t) => out('major', 'Breaking', `${where}: ${t}`);
        const added = (t) => out('minor', 'Added', `${where}: ${t}`);
        // A type that is a plain object type compares member by member, so that a new optional member
        // is Added. Any other change of the type of a value, a class or a type is Breaking, and so is
        // any change of a local type that it names.
        const handled = o.kind === 'type' && objectChanges(o.type, n.type, major, added);
        if (!handled && sortUnions(o.type) !== sortUnions(n.type)) major(`${o.kind} changed: ${sortUnions(o.type)} -> ${sortUnions(n.type)}`);
        typesChanges(o.types, n.types, major, major);
      }
    }
  }
  changes.sort((x, y) => SECTIONS.indexOf(x.section) - SECTIONS.indexOf(y.section) || byName(x.text, y.text));
  const level = changes.some((c) => c.level === 'major') ? 'major' : changes.length ? 'minor' : 'patch';
  const tools = keys(a.tool, b.tool).filter((k) => a.tool?.[k] !== b.tool?.[k]);
  const warning = tools.length ? `the two contracts come from other tool versions (${tools.map((k) => `${k} ${a.tool?.[k] ?? 'none'} -> ${b.tool?.[k] ?? 'none'}`).join(', ')}). A tool update can give false changes.` : null;
  return { level, changes, warning };
}

/** The lines of a diff: each section with its changes, then the count and the level. */
export function report(d) {
  const lines = [];
  const count = (s) => d.changes.filter((c) => c.section === s).length;
  const n = d.changes.length;
  for (const section of n ? SECTIONS : []) {
    lines.push(section);
    for (const c of d.changes.filter((x) => x.section === section)) lines.push(`- ${c.text}`);
    if (!count(section)) lines.push('- none');
  }
  lines.push(n ? `contract diff: ${n} change${n === 1 ? '' : 's'} (${count('Breaking')} breaking, ${count('Behaviour')} behaviour, ${count('Added')} added), level ${d.level}` : 'contract diff: 0 changes, level patch');
  return lines;
}

const semver = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  return m ? m.slice(1).map(Number) : null;
};
const compare = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

/**
 * The last release tag before version, as [tag, [major, minor, patch]], from the v* tags that HEAD holds.
 * null when the clone holds no v* tag at all, which is the first release. It throws when the clone is
 * shallow, or when it holds v* tags and none of them comes before version in the history of HEAD: the
 * tags or the history are not fetched, and a gate with no tag would pass any change.
 */
export function lastRelease(version, { merged, all, shallow }) {
  const v = semver(version);
  const fetch = 'Fetch them, then run the gate again';
  if (shallow) throw new Error(`the clone is shallow, so the release tags and their history can be missing. ${fetch}: git fetch --unshallow --tags`);
  const tags = merged
    .map((t) => [t.trim(), semver(t.trim().slice(1))])
    .filter(([, x]) => x && compare(x, v) < 0)
    .sort((x, y) => compare(y[1], x[1]));
  if (tags.length) return tags[0];
  const release = all.map((t) => t.trim()).filter((t) => semver(t.slice(1)));
  if (release.length) throw new Error(`no release tag before v${version} is in the history of HEAD, and the clone holds ${release.length} v* tags. A tag that is not fetched gives this. ${fetch}: git fetch --tags`);
  return null;
}

/** Exit 1 when the version, or else that of package.json, is below the level of the diff from the last release tag. */
async function gate(version) {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const next = version || pkg.version;
  const v = semver(next);
  if (!v) throw new Error(`the version "${next}" is not of the form major.minor.patch.`);
  const lines = (...args) => git(...args).split('\n').filter(Boolean);
  const last = lastRelease(next, {
    merged: lines('tag', '--list', 'v*', '--merged', 'HEAD'),
    all: lines('tag', '--list', 'v*'),
    shallow: git('rev-parse', '--is-shallow-repository').trim() === 'true',
  });
  if (!last) {
    console.log(`contract gate: the repository has no v* tag, so v${next} is the first release and no level applies. When the clone did not fetch its tags, run "git fetch --tags" and run the gate again.`);
    return 0;
  }
  const [tag, old] = last;
  const d = diff(await contractAt(tag), await contractOfFiles());
  if (d.warning) console.error(`contract gate: warning: ${d.warning}`);
  for (const line of report(d)) console.log(line);
  const step = v[0] > old[0] ? 'major' : v[1] > old[1] ? 'minor' : 'patch';
  console.log(`contract gate: ${tag} to v${next} is a ${step} step, and the changes need ${d.level}.`);
  if (LEVELS[step] >= LEVELS[d.level]) return 0;
  console.error(`contract gate: the version is below the level of the changes. Give "npm version" the level ${d.level}, or take back the changes of that level.`);
  return 1;
}

async function main(argv) {
  const [command, ...args] = argv;
  if (command === 'write' && !args.length) {
    const c = await contractOfFiles();
    writeFileSync(join(ROOT, OUT), serialise(c));
    console.log(`contract: wrote ${OUT}, ${Object.keys(c.exports).length} export paths`);
    return 0;
  }
  if (command === 'check' && !args.length) {
    const fresh = serialise(await contractOfFiles());
    if (!existsSync(join(ROOT, OUT))) {
      console.error(`contract: ${OUT} does not exist. Run "node scripts/contract.mjs write" in the root, and commit the file.`);
      return 1;
    }
    if (readFileSync(join(ROOT, OUT), 'utf8') !== fresh) {
      console.error(`contract: ${OUT} differs from a fresh write. Run "node scripts/contract.mjs write" in the root, and commit the file with the change of the parts.`);
      return 1;
    }
    console.log(`contract: ${OUT} matches the files, ${Object.keys(JSON.parse(fresh).exports).length} export paths`);
    return 0;
  }
  if (command === 'diff' && args.length === 2) {
    const d = diff(await contractAt(args[0]), await contractAt(args[1]));
    if (d.warning) console.error(`contract diff: warning: ${d.warning}`);
    for (const line of report(d)) console.log(line);
    return d.level === 'major' ? 1 : 0;
  }
  if (command === 'gate' && args.length <= 1) return gate(args[0]);
  console.error('contract: give write, check, diff <a> <b> or gate [version].');
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (e) {
    console.error(`contract: ${e.message}`);
    process.exitCode = 1;
  }
}
