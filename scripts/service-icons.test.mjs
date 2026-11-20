// The failure cases of the check of the service icons (scripts/service-icons.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkIcon, folderProblems, TRANSFORM } from './service-icons.mjs';

const svg = (inner = `<path transform="${TRANSFORM}" d="M0 0h1v1z" />`, tag = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>') => `<script lang="ts">\n  let { ...rest } = $props();\n</script>\n${tag}${inner}</svg>`;
const path = `<path transform="${TRANSFORM}" d="M0 0h1v1z" />`;

test('a good icon has no problem', () => assert.deepEqual(checkIcon(svg()), []));

const bad = {
  hex: [svg(path, '<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">'), /fill="currentColor"/],
  twoPaths: [svg(path + path), /2 <path> elements/],
  noAria: [svg(path, '<svg viewBox="0 0 24 24" fill="currentColor">'), /aria-hidden/],
  viewBox: [svg(path, '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">'), /viewBox/],
  noTransform: [svg('<path d="M0 0h1v1z" />'), /transform/],
  stroke: [svg(`<path stroke="red" transform="${TRANSFORM}" d="M0 0h1v1z" />`), /stroke/],
  oklch: [svg(`<path style="color: oklch(0.5 0.1 20)" transform="${TRANSFORM}" d="M0 0h1v1z" />`), /own/],
  expression: [svg(`<path fill={'red'} transform="${TRANSFORM}" d="M0 0h1v1z" />`), /expression/],
  shape: [svg(path + '<circle cx="1" cy="1" r="1" />'), /shape element/]
};
for (const [name, [source, re]] of Object.entries(bad)) {
  test(`the check refuses ${name}`, () => {
    const problems = checkIcon(source);
    assert.ok(problems.length > 0 && problems.some((p) => re.test(p)), JSON.stringify(problems));
  });
}

test('the check skips a stand-in', () => {
  const dir = mkdtempSync(join(tmpdir(), 'service-icons-'));
  writeFileSync(join(dir, 'LICENSE.md'), '');
  writeFileSync(join(dir, 'Lucide.svelte'), '<svg fill="none" stroke="currentColor"><circle r="1" /></svg>');
  assert.ok(folderProblems([['Lucide', 'lucide']], dir).length > 0);
  assert.deepEqual(folderProblems([['Lucide', 'lucide', 'stand-in']], dir), []);
});
