// The checks of a message from the page of an HTML frame (preview/src/lib/stack/frame-message.ts), as
// "Variants" of ### html-frame in DESIGN.md says. Any page in the frame can post any data, so each
// field must pass its check, and no field but the height, the state and the remote count reaches the part.
//
//   node --test scripts/frame-message.test.mjs
//
// The module imports only types, so Node runs it with its type stripping.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFrameMessage } from '../preview/src/lib/stack/frame-message.ts';

const TYPE = 'stack-frame-height';
const CAP = 25_000;
const read = (data) => readFrameMessage(data, TYPE, CAP);

test('a message of the script of the last release gives its height and no fact', () => {
	assert.deepEqual(read({ type: TYPE, height: 656 }), { height: 656, page: {} });
});

test('a message with a state and a remote count gives both facts', () => {
	assert.deepEqual(read({ type: TYPE, height: 656, state: 'too-large', remote: 3 }), { height: 656, page: { state: 'too-large', remote: 3 } });
	for (const state of ['html', 'text', 'too-large']) assert.deepEqual(read({ type: TYPE, height: 1, state }), { height: 1, page: { state } });
	assert.deepEqual(read({ type: TYPE, height: 1, remote: 0 }), { height: 1, page: { remote: 0 } });
	assert.deepEqual(read({ type: TYPE, height: 1, remote: Number.MAX_SAFE_INTEGER }), { height: 1, page: { remote: Number.MAX_SAFE_INTEGER } });
});

test('a height rounds up, and a height over the cap gives the cap', () => {
	assert.equal(read({ type: TYPE, height: 409.2 })?.height, 410);
	assert.equal(read({ type: TYPE, height: 0 })?.height, 0);
	assert.equal(read({ type: TYPE, height: 30_000 })?.height, CAP);
	assert.equal(readFrameMessage({ type: TYPE, height: 1001 }, TYPE, 1000)?.height, 1000);
});

test('data that is not an object, or that has no type tag of the script, fails', () => {
	for (const data of [undefined, null, 500, 'stack-frame-height', true, [], [TYPE, 500], { height: 500 }, { type: 'frame-height', height: 500 }, { type: 'stack-frame-mode', height: 500 }, { type: TYPE.toUpperCase(), height: 500 }]) {
		assert.equal(read(data), undefined, JSON.stringify(data));
	}
});

test('a height that is not a finite number of 0 or more fails', () => {
	for (const height of [undefined, null, -1, -0.5, Infinity, -Infinity, NaN, '500', [500], { valueOf: () => 500 }, true, 10n]) {
		assert.equal(read({ type: TYPE, height }), undefined, String(height));
	}
});

test('a state that is not one of the three words fails, and the height does not apply', () => {
	for (const state of ['designed', 'HTML', ' html', 'html ', 'too large', '', '<b>html</b>', '<img src=x onerror=alert(1)>', 'toString', '__proto__', 1, true, null, ['html'], { toString: () => 'html' }]) {
		assert.equal(read({ type: TYPE, height: 500, state }), undefined, JSON.stringify(state));
	}
});

test('a remote count that is not a safe whole number of 0 or more fails, and the height does not apply', () => {
	for (const remote of [-1, 1.5, '3', NaN, Infinity, -Infinity, 2 ** 53, 1e21, null, true, [3], { valueOf: () => 3 }, 3n, '<b>3</b>']) {
		assert.equal(read({ type: TYPE, height: 500, remote }), undefined, String(remote));
	}
});

test('the result holds the height and the facts only, and no other field of the message', () => {
	const result = read({ type: TYPE, height: 10, state: 'html', remote: 2, html: '<b data-probe="injected">injected</b>', text: 'x', words: 'Show', scale: 0.5 });
	assert.deepEqual(Object.keys(result).sort(), ['height', 'page']);
	assert.deepEqual(Object.keys(result.page).sort(), ['remote', 'state']);
});

test('a key of Object.prototype in the message gives no fact', () => {
	const data = JSON.parse('{"type":"stack-frame-height","height":10,"__proto__":{"state":"html","remote":4}}');
	assert.deepEqual(read(data), { height: 10, page: {} });
});
