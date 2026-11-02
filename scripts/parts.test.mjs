// The check of the five extension points of a part: an exported <Name>Props, the rest attributes on
// the root, class through cn(), a root data-slot and ref = $bindable(). A part with the marker may
// lack them until a release.
//
//   node --test scripts/parts.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as parts from './parts.mjs';

const part = (name, root, inner = '') => `<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ${name}Props = HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null; children?: Snippet };
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), class: className, children, ...rest }: ${name}Props = $props();
</script>

<div ${root}><span ${inner}>{@render children?.()}</span></div>
`;
const GOOD = part('Good', `bind:this={ref} data-slot="good" class={cn('flex', className)} {...rest}`);
const NO_REST = part('NoRest', `bind:this={ref} data-slot="no-rest" class={cn('flex', className)}`, '{...rest}');
const NO_SLOT = part('NoSlot', `bind:this={ref} class={cn('flex', className)} {...rest}`, 'data-slot="no-slot-text"');
const DESIGN = 'Import `@stack-kit/stack/parts/Good`, `@stack-kit/stack/parts/NoRest` and `@stack-kit/stack/parts/NoSlot`.';
const marked = (source) => `${parts.MARKER}\n${source}`;

test('a part with the five extension points passes, and its marker must go', () => {
  const { checkPart } = parts;
  assert.deepEqual(checkPart(GOOD, { name: 'Good', path: 'parts/Good', design: DESIGN }), []);
  assert.match(checkPart(marked(GOOD), { name: 'Good', path: 'parts/Good', design: DESIGN }).join('\n'), /has all five extension points/);
  assert.match(checkPart(GOOD, { name: 'Good', path: 'parts/Good', design: 'No name here.' }).join('\n'), /DESIGN\.md does not name @stack-kit\/stack\/parts\/Good/);
});

test('a part with no rest attributes on its root fails', () => {
  const { checkPart } = parts;
  assert.deepEqual(checkPart(NO_REST, { name: 'NoRest', path: 'parts/NoRest', design: DESIGN }), ['the root does not spread the rest attributes of $props(), as {...rest}']);
  assert.deepEqual(checkPart(marked(NO_REST), { name: 'NoRest', path: 'parts/NoRest', design: DESIGN }), []);
  assert.match(checkPart(marked(NO_REST), { name: 'NoRest', path: 'parts/NoRest', design: DESIGN, release: true }).join('\n'), /A release ships no part with the marker/);
});

test('a part with no data-slot on its root fails', () => {
  const { checkPart } = parts;
  assert.deepEqual(checkPart(NO_SLOT, { name: 'NoSlot', path: 'parts/NoSlot', design: DESIGN }), ['the root has no static data-slot']);
});

test('a comment that names the props type is no export, and an export list is one', () => {
  const { checkPart } = parts;
  const commented = GOOD.replace('export type GoodProps', '// export type GoodProps\n\ttype GoodProps');
  assert.deepEqual(checkPart(commented, { name: 'Good', path: 'parts/Good', design: DESIGN }), ['exports no type GoodProps']);
  const listed = GOOD.replace('export type GoodProps', 'type GoodProps').replace('</script>', '\texport type { GoodProps };\n</script>');
  assert.deepEqual(checkPart(listed, { name: 'Good', path: 'parts/Good', design: DESIGN }), []);
});

test('a root that names className only as a member or a key does not merge the class prop', () => {
  const { checkPart } = parts;
  const miss = ['the root does not merge the class prop with cn(), as class={cn(..., className)}'];
  for (const value of ["cn('flex', o.className)", "cn('flex', { className: true })"]) {
    const source = part('Good', `bind:this={ref} data-slot="good" class={${value}} {...rest}`);
    assert.deepEqual(checkPart(source, { name: 'Good', path: 'parts/Good', design: DESIGN }), miss, value);
  }
  const computed = part('Good', `bind:this={ref} data-slot="good" class={cn('flex', { [className]: true })} {...rest}`);
  assert.deepEqual(checkPart(computed, { name: 'Good', path: 'parts/Good', design: DESIGN }), []);
});

test('a root of Bits UI renders only its children, so the root of the part is the content inside it', () => {
  const { checkPart } = parts;
  const source = `<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from 'bits-ui';

	export type WrappedProps = DialogPrimitive.ContentProps & { open?: boolean };
</script>

<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { cn } from '#lib/utils.js';

	let { open = $bindable(false), ref = $bindable(null), class: className, children, ...rest }: WrappedProps = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content bind:ref data-slot="dialog-content" class={cn('flex', className)} {...rest}>{@render children?.()}</Dialog.Content>
</Dialog.Root>
`;
  assert.deepEqual(checkPart(source, { name: 'Wrapped', path: 'parts/Wrapped', design: 'Import `@stack-kit/stack/parts/Wrapped`.' }), []);
});
