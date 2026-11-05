// The diff of two contracts, on the cases of scripts/test/contract/. Each case is a copy of the base
// folder with its own files on top. The diff sorts each change by the version levels of the release.
//
//   node --test scripts/contract.test.mjs
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { before, test } from 'node:test';
import * as contract from './contract.mjs';

const CASES = join(import.meta.dirname, 'test/contract');
const EXPORTS = { './parts/*': './preview/src/lib/stack/*.svelte' };

async function build(name) {
  const dir = contract.fromFolder(...[join(CASES, 'base'), ...(name === 'base' ? [] : [join(CASES, name)])]);
  try {
    return await contract.contractOf(dir, EXPORTS, '1.0.0');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

let base;
before(async () => {
  base = await build('base');
});

test('a copy with look changes only gives 0 changes', async () => {
  const { diff } = contract;
  const d = diff(base, await build('look'));
  assert.deepEqual(d.changes, []);
  assert.equal(d.level, 'patch');
});

test('a breaking copy gives each of its five changes at level major', async () => {
  const { diff } = contract;
  const d = diff(base, await build('breaking'));
  assert.deepEqual(
    d.changes.map((c) => `${c.section}: ${c.text}`),
    [
      "Breaking: ./parts/Sample default: data-slot 'sample-head' removed",
      'Breaking: ./parts/Sample default: new required prop count: number',
      'Breaking: ./parts/Sample default: prop label renamed to heading',
      "Breaking: ./parts/Sample default: prop size narrowed: 'lg' | 'md' | 'sm' -> 'md' | 'sm'",
      "Breaking: ./parts/Sample default: prop tone default changed: 'plain' -> 'strong'",
    ],
  );
  assert.ok(d.changes.every((c) => c.level === 'major'));
  assert.equal(d.level, 'major');
});

test('an added copy gives three additions at level minor', async () => {
  const { diff } = contract;
  const d = diff(base, await build('added'));
  assert.deepEqual(
    d.changes.map((c) => `${c.section}: ${c.text}`),
    [
      'Added: ./parts/Extra: new export path',
      'Added: ./parts/Sample default: new optional prop hint: string',
      'Added: ./parts/Sample default: new optional snippet footer()',
    ],
  );
  assert.ok(d.changes.every((c) => c.level === 'minor'));
  assert.equal(d.level, 'minor');
});

const lines = (d) => d.changes.map((c) => `${c.section}: ${c.text}`);

test('a narrower constraint of a type parameter is breaking', async () => {
  const d = contract.diff(base, await build('generic'));
  assert.deepEqual(lines(d), ['Breaking: ./parts/Picker default: type parameters changed: <T extends { id: string; }> -> <T extends { id: string; label: string; }>']);
  assert.equal(d.level, 'major');
});

test('a local type that a prop uses changes by the rules of a prop', async () => {
  const d = contract.diff(base, await build('local-type'));
  assert.deepEqual(lines(d), [
    'Breaking: ./parts/Picker default: type Choice: member note removed',
    'Breaking: ./parts/Picker default: type Choice: new required member rank: number',
    'Added: ./parts/Picker default: type Choice: member weight widened: number -> number | string',
    'Added: ./parts/Picker default: type Choice: new optional member hint: boolean',
  ]);
  assert.equal(d.level, 'major');
});

test('a change of a const that a default names is a changed default', async () => {
  const d = contract.diff(base, await build('default-value'));
  assert.deepEqual(lines(d), ['Breaking: ./parts/Picker default: callback count default changed: the declaration of UNIT changed']);
  assert.equal(d.level, 'major');
});

test('a widened bindable prop is breaking, because the value flows back to the product', async () => {
  const d = contract.diff(base, await build('bindable'));
  assert.deepEqual(lines(d), ['Breaking: ./parts/Picker default: prop value widened: number -> number | string, and the prop is bindable']);
  assert.equal(d.level, 'major');
});

test('a callback that takes an optional parameter at its end or returns a wider type is widened', async () => {
  const d = contract.diff(base, await build('callback-widened'));
  assert.deepEqual(lines(d), [
    'Added: ./parts/Mover default: callback onmove widened: (id: string, to: number) => void -> (id: string, to: number, undo?: boolean | undefined) => Promise<void> | void',
    'Added: ./parts/Mover default: callback onread widened: (id: string) => boolean -> (id: string) => boolean | string',
  ]);
  assert.equal(d.level, 'minor');
});

test('a callback with a new required parameter, a narrower parameter or a narrower return type is breaking', async () => {
  const d = contract.diff(base, await build('callback-narrowed'));
  assert.deepEqual(lines(d), [
    'Breaking: ./parts/Mover default: callback onmove type changed: (id: string, to: number) => void -> (id: string, to: number, undo: boolean) => void',
    'Breaking: ./parts/Mover default: callback onpick type changed: (id: number | string) => void -> (id: string) => void',
    'Breaking: ./parts/Mover default: callback onread type changed: (id: string) => boolean -> (id: string) => true',
  ]);
  assert.equal(d.level, 'major');
});

// A contract with one exported name T of the kind kind and the type string type.
const typed = (type, kind = 'type') => ({ exports: { './parts/P': { T: { kind, type } } } });

test('a new optional member of an exported object type is Added, at any depth', () => {
  const d = contract.diff(
    typed('{ at: Date; to: Person[]; translation?: { body: string[]; lang: string; }; }'),
    typed('{ at: Date; to: Person[]; toMore?: number; translation?: { body: string[]; lang: string; note?: string; }; }'),
  );
  assert.deepEqual(lines(d), ['Added: ./parts/P T: new optional member toMore: number', 'Added: ./parts/P T: new optional member translation.note: string']);
  assert.equal(d.level, 'minor');
  // An interface prints no ; at its end, and a generic type keeps its type parameters.
  assert.deepEqual(lines(contract.diff(typed('<T> { id: string; items: T[] }'), typed('<T> { id: string; items: T[]; total?: number }'))), ['Added: ./parts/P T: new optional member total: number']);
});

test('each other change of a member of an exported object type is breaking', () => {
  const old = "{ format?: (n: number) => string; id: string; note?: string; size: number; tone?: 'plain' | 'strong'; translation?: { lang: string; }; }";
  // The lines of the diff from old to old with the text from replaced by to, at level major.
  const change = (from, to) => {
    assert.ok(old.includes(from));
    const d = contract.diff(typed(old), typed(old.replace(from, to)));
    assert.equal(d.level, 'major');
    return lines(d);
  };
  assert.deepEqual(change('size: number;', 'rank: number; size: number;'), ['Breaking: ./parts/P T: new required member rank: number']);
  assert.deepEqual(change('note?: string; ', ''), ['Breaking: ./parts/P T: member note removed']);
  assert.deepEqual(change('note?: string;', 'label?: string;'), ['Breaking: ./parts/P T: member note renamed to label']);
  assert.deepEqual(change('size: number;', 'size: string;'), ['Breaking: ./parts/P T: member size type changed: number -> string']);
  assert.deepEqual(change("tone?: 'plain' | 'strong';", "tone?: 'plain';"), ["Breaking: ./parts/P T: member tone narrowed: 'plain' | 'strong' -> 'plain'"]);
  assert.deepEqual(change('size: number;', 'size: number | string;'), ['Breaking: ./parts/P T: member size widened: number -> number | string']);
  assert.deepEqual(change('note?: string;', 'note: string;'), ['Breaking: ./parts/P T: member note became required']);
  assert.deepEqual(change('id: string;', 'id?: string;'), ['Breaking: ./parts/P T: member id became optional']);
  assert.deepEqual(change('(n: number) => string', '(n: string) => string'), ['Breaking: ./parts/P T: member format type changed: (n: number) => string -> (n: string) => string']);
  assert.deepEqual(change('{ lang: string; }', '{ by: string; lang: string; }'), ['Breaking: ./parts/P T: new required member translation.by: string']);
});

test('a type that is no plain object type, or a value, keeps the rule of the whole type string', () => {
  const whole = (x, y, kind = 'type') => {
    const d = contract.diff(typed(x, kind), typed(y, kind));
    assert.equal(d.level, 'major');
    return lines(d);
  };
  assert.deepEqual(whole('{ a: string; } | { b: string; }', '{ a: string; c?: number; } | { b: string; }'), ['Breaking: ./parts/P T: type changed: { a: string; } | { b: string; } -> { a: string; c?: number; } | { b: string; }']);
  assert.deepEqual(whole('Base & { a: string; }', 'Base & { a: string; c?: number; }'), ['Breaking: ./parts/P T: type changed: Base & { a: string; } -> Base & { a: string; c?: number; }']);
  assert.deepEqual(whole('{ (x: number): string; a: string; }', '{ (x: number): string; a: string; c?: number; }'), ['Breaking: ./parts/P T: type changed: { (x: number): string; a: string; } -> { (x: number): string; a: string; c?: number; }']);
  assert.deepEqual(whole('<T> { a: T; }', '<T, U> { a: T; c?: U; }'), ['Breaking: ./parts/P T: type changed: <T> { a: T; } -> <T, U> { a: T; c?: U; }']);
  assert.deepEqual(whole('{ a: string; }', '{ a: string; c?: number; }', 'value'), ['Breaking: ./parts/P T: value changed: { a: string; } -> { a: string; c?: number; }']);
});

test('an import that does not resolve stops the contract', async () => {
  await assert.rejects(build('missing-module'), /stack\/Broken\.svelte.*'#lib\/gone\.js'/);
});

test('the temporary folder goes when the setup of the workspace fails', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'contract-test-tmp-'));
  const src = mkdtempSync(join(tmpdir(), 'contract-test-src-'));
  // A folder named package.json makes the write of lib/package.json fail.
  mkdirSync(join(src, 'package.json'));
  writeFileSync(join(src, 'package.json', 'keep'), '');
  const old = process.env.TMPDIR;
  process.env.TMPDIR = tmp;
  try {
    assert.throws(() => contract.fromFolder(src), /EISDIR/);
    assert.deepEqual(readdirSync(tmp), []);
  } finally {
    if (old === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = old;
    rmSync(tmp, { recursive: true, force: true });
    rmSync(src, { recursive: true, force: true });
  }
});

test('a function type keeps the union of its return type whole', () => {
  const { sortUnions } = contract;
  assert.equal(sortUnions("(v: number) => 'md' | 'sm'"), "(v: number) => 'md' | 'sm'");
  assert.equal(sortUnions("(v: number) => 'sm' | 'md'"), "(v: number) => 'md' | 'sm'");
  assert.equal(sortUnions("Map<string, (v: number) => 'sm' | 'md'> | null"), "Map<string, (v: number) => 'md' | 'sm'> | null");
});

test('the members of an object type compare in any order', () => {
  const { sortUnions, diff } = contract;
  assert.equal(sortUnions('{ loop?: boolean; dir?: Direction; }'), '{ dir?: Direction; loop?: boolean; }');
  assert.equal(sortUnions('Without<A, { loop?: boolean; dir?: Direction; }> & { b: (x: { z: 1; y: 2; }) => void; a: string }'), 'Without<A, { dir?: Direction; loop?: boolean; }> & { a: string; b: (x: { y: 2; z: 1; }) => void }');
  assert.equal(sortUnions('(b: string, a: number) => [b: string, a: number]'), '(b: string, a: number) => [b: string, a: number]');
  const part = (rest) => ({ exports: { './parts/P': { default: { props: {}, callbacks: {}, snippets: {}, rest, root: {}, slots: [], behaviour: [] } } } });
  assert.deepEqual(diff(part('Without<A, { loop?: boolean; dir?: Direction; }>'), part('Without<A, { dir?: Direction; loop?: boolean; }>')).changes, []);
});

test('the call signatures of an object type keep their order, because the order of overloads has a meaning', () => {
  const { sortUnions, diff } = contract;
  assert.equal(sortUnions('{ b: 1; (a: string): void; a: 2; (a: number): string; }'), '{ (a: string): void; (a: number): string; a: 2; b: 1; }');
  assert.equal(sortUnions('{ new (a: string): A; <T>(a: T): T; new (a: number): B; }'), '{ new (a: string): A; <T>(a: T): T; new (a: number): B; }');
  const part = (rest) => ({ exports: { './parts/P': { default: { props: {}, callbacks: {}, snippets: {}, rest, root: {}, slots: [], behaviour: [] } } } });
  const d = diff(part('{ (a: string): void; (a: number): string; }'), part('{ (a: number): string; (a: string): void; }'));
  assert.equal(d.changes.length, 1);
});

test('the gate stops when the release tags before the version are not in the clone', () => {
  const { lastRelease } = contract;
  assert.deepEqual(lastRelease('1.1.0', { merged: ['v0.9.0', 'v1.0.0', 'v1.1.0'], all: ['v0.9.0', 'v1.0.0', 'v1.1.0'], shallow: false }), ['v1.0.0', [1, 0, 0]]);
  assert.throws(() => lastRelease('1.1.0', { merged: [], all: ['v1.0.0'], shallow: false }), /git fetch --tags/);
  assert.throws(() => lastRelease('1.1.0', { merged: [], all: [], shallow: true }), /git fetch --unshallow --tags/);
  assert.equal(lastRelease('0.1.0', { merged: [], all: [], shallow: false }), null);
});

test('the version step refuses before npm writes package.json', () => {
  const { scripts } = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8'));
  assert.match(scripts.preversion ?? '', /node scripts\/parts\.mjs --release/);
  assert.match(scripts.preversion ?? '', /node scripts\/contract\.mjs gate "\$npm_new_version"/);
  assert.doesNotMatch(scripts.version, /--release|contract\.mjs gate/);
});

test('a diff of contracts from other tool versions gives a warning', () => {
  const a = { tool: { svelte2tsx: '0.7.61', typescript: '6.0.3', svelte: '5.57.2' }, exports: {} };
  const b = { tool: { svelte2tsx: '0.7.62', typescript: '6.0.3', svelte: '5.57.2' }, exports: {} };
  assert.match(contract.diff(a, b).warning ?? '', /tool versions.*svelte2tsx 0\.7\.61 -> 0\.7\.62.*false changes/);
  assert.equal(contract.diff(a, a).warning, null);
});
