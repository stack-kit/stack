// The fold of a long activity (preview/src/lib/stack/fold.ts), as "Variants" of ### item in DESIGN.md
// says: a stretch of more than 8 lines shows its last 3, and the button before them shows the rest.
//
//   node --test scripts/fold.test.mjs
//
// The module imports nothing, so Node runs it with its type stripping.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fold } from '../preview/src/lib/stack/fold.ts';

const lines = (n) => Array.from({ length: n }, (_, i) => `l${i + 1}`);

test('a stretch of 8 lines or fewer shows every line and no button, open or closed', () => {
	for (const n of [0, 1, 8]) {
		for (const open of [false, true]) {
			assert.deepEqual(fold(lines(n), open), { earlier: [], last: lines(n), hidden: 0 }, `${n} lines, open ${open}`);
		}
	}
});

test('a closed stretch of 9 lines hides the first 6 and shows the last 3', () => {
	assert.deepEqual(fold(lines(9), false), { earlier: lines(6), last: ['l7', 'l8', 'l9'], hidden: 6 });
});

test('a stretch of 10 lines keeps its 7 earlier lines for the button, and the screen hides them only while it is closed', () => {
	const closed = fold(lines(10), false);
	const open = fold(lines(10), true);
	assert.deepEqual(closed.earlier, lines(7));
	assert.deepEqual(closed.last, ['l8', 'l9', 'l10']);
	assert.equal(closed.hidden, 7);
	assert.deepEqual(open.earlier, closed.earlier);
	assert.deepEqual(open.last, closed.last);
	assert.equal(open.hidden, 0);
});

test('the fold keeps the order of the lines and changes no array that it gets', () => {
	const given = Object.freeze(lines(12));
	const { earlier, last } = fold(given, false);
	assert.deepEqual([...earlier, ...last], lines(12));
	assert.notEqual(last, given);
});
