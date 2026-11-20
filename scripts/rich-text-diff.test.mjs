// The diff of a whole text in the rich text field: the blocks of a text, and the lines of a diff of
// kind text with the marks of the blocks, the word marks and the limit, and the words of a picture, a
// divider and the address of a link.
//
//   node --test scripts/rich-text-diff.test.mjs
//
// The module imports types only, so Node runs it with its type stripping and no DOM. In place of the
// load list, the test parses its own well-formed HTML into nodes with nodeType, nodeName, childNodes,
// data and getAttribute, which is all that blocksOf reads.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockMarks, blocksOf, diffBlocks } from '../preview/src/lib/rich-text/review/diff.ts';
import { WRITING_WORDS } from '../preview/src/lib/rich-text/review/words.ts';
import { plainHtml } from '../preview/src/lib/rich-text/review/plain.ts';

const VOID = new Set(['br', 'img', 'hr']);
const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ' };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|nbsp);/g, (_, e) => ENTITY[e]);

/** A tree of nodes from well-formed HTML. */
function parse(html) {
	const root = { nodeType: 11, nodeName: '#document-fragment', childNodes: [] };
	const stack = [root];
	for (const [, close, tag, attrs, text] of html.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/g)) {
		const top = stack.at(-1);
		if (text !== undefined) {
			top.childNodes.push({ nodeType: 3, nodeName: '#text', data: decode(text), childNodes: [] });
			continue;
		}
		if (close) {
			stack.pop();
			continue;
		}
		const map = Object.fromEntries([...attrs.matchAll(/([a-z-]+)="([^"]*)"/g)].map(([, k, v]) => [k, decode(v)]));
		const el = { nodeType: 1, nodeName: tag.toUpperCase(), childNodes: [], getAttribute: (k) => map[k] ?? null };
		top.childNodes.push(el);
		if (!VOID.has(tag)) stack.push(el);
	}
	return root;
}
const blocks = (html, marks = blockMarks(WRITING_WORDS)) => blocksOf(html, parse, marks);
/** The diff of two texts with one numbering of their pictures, as the field computes it. */
const diffOf = (a, b) => {
	const marks = blockMarks(WRITING_WORDS);
	return diffBlocks(blocks(a, marks), blocks(b, marks));
};
const changed = (lines) => lines.filter((l) => l.kind !== 'same' || l.words?.some((w) => w.block));
/** The count of the changes, as diffChanges(lines, 'text') of ### diff gives it: each run of added and removed lines, and each other line with a mark. */
const changes = (lines) => lines.filter((l, i) => (l.kind === 'same' ? l.words?.some((w) => w.block) : !['added', 'removed'].includes(lines[i - 1]?.kind))).length;
const P = (text) => ({ kind: 'paragraph', text });

test('blocksOf gives each line with its kind, as words() counts the lines', () => {
	const html = [
		'<h2>Delivery update</h2>',
		'<div>Hello <b>team</b>,</div>',
		'<ul><li>Two shelving units</li></ul>',
		'<ol><li><div>One bracket set</div></li></ol>',
		'<blockquote><div>A quote.</div></blockquote>',
		'<pre>line one\nline two</pre>',
		'<div><img src="x" alt="A plan of the room"></div>',
		'<div><br></div>',
		'<div>first​ part<br>second   part&nbsp;</div>'
	].join('');
	assert.deepEqual(blocks(html), [
		{ kind: 'h2', text: 'Delivery update' },
		P('Hello team,'),
		{ kind: 'bullet', text: 'Two shelving units' },
		{ kind: 'number', text: 'One bracket set' },
		{ kind: 'quote', text: 'A quote.' },
		{ kind: 'code', text: 'line one' },
		{ kind: 'code', text: 'line two' },
		{ kind: 'picture', text: '[Picture 1: A plan of the room]' },
		P(''),
		P('first part'),
		P('second part')
	]);
	assert.deepEqual(blocks(''), []);
});

test('a picture in a line, a divider and the address of a link are words of the diff, so a change of each is a change', () => {
	// A picture that goes from a line of words: its words are a deleted word of the line.
	const picture = diffOf('<div>Hello <img src="data:a" alt=""> world</div>', '<div>Hello world</div>');
	assert.deepEqual(picture.map((l) => `${l.kind} ${l.text}`), ['removed Hello [Picture 1] world', 'added Hello world']);
	assert.equal(picture[0].words?.filter((w) => w.changed).map((w) => w.text).join('').trim(), '[Picture 1]');
	// Another picture with the same alt text takes another number.
	assert.deepEqual(diffOf('<div><img src="data:a" alt="Plan"></div>', '<div><img src="data:b" alt="Plan"></div>').map((l) => `${l.kind} ${l.text}`), ['removed [Picture 1: Plan]', 'added [Picture 2: Plan]']);
	// The same picture in both texts keeps its number, so it is no change.
	assert.equal(changed(diffOf('<div>A</div><div><img src="data:a" alt=""></div>', '<div><img src="data:a" alt=""></div><div>B</div>').filter((l) => /Picture/.test(l.text))).length, 0);
	// A line of a picture with no alt text that goes is a line with words.
	assert.deepEqual(diffOf('<div>A</div><div><img src="data:a" alt=""></div>', '<div>A</div>'), [
		{ kind: 'same', text: 'A', old: 1, new: 1 },
		{ kind: 'removed', text: '[Picture 1]', old: 2 }
	]);
	// A divider is a line of its own.
	assert.deepEqual(diffOf('<div>A</div><hr><div>B</div>', '<div>A</div><div>B</div>').map((l) => `${l.kind} ${l.text}`), ['same A', 'removed [Divider]', 'same B']);
	// The address of a link comes after its words, so another address is a changed word.
	const link = diffOf('<div>See <a href="https://example.com/a">the plan</a>.</div>', '<div>See <a href="https://example.com/b">the plan</a>.</div>');
	assert.deepEqual(link.map((l) => `${l.kind} ${l.text}`), ['removed See the plan <https://example.com/a>.', 'added See the plan <https://example.com/b>.']);
	assert.deepEqual(link[1].words?.filter((w) => w.changed).map((w) => w.text), ['b']);
});

test('a new layout of the same words gives the marks of the heading, the split, the items and the join', () => {
	const draft = ['Delivery update', 'Hello team, the new shelves arrive on Thursday.', 'Two shelving units', 'One bracket set', 'Kind regards,', 'Sam'].map((l) => `<div>${l}</div>`).join('');
	const layout =
		'<h2>Delivery update</h2><div>Hello team,</div><div>the new shelves arrive on Thursday.</div><h3>What arrives</h3><ul><li>Two shelving units</li><li>One bracket set</li></ul><div>Kind regards, Sam</div>';
	assert.deepEqual(diffBlocks(blocks(draft), blocks(layout)), [
		{ kind: 'same', text: 'Delivery update', old: 1, new: 1, words: [{ text: '', block: 'heading' }, { text: 'Delivery update' }] },
		{ kind: 'same', text: 'Hello team,', old: 2, new: 2, words: [{ text: 'Hello team,' }, { text: '', block: 'split' }] },
		{ kind: 'same', text: 'the new shelves arrive on Thursday.', old: 2, new: 3 },
		{ kind: 'added', text: 'What arrives', new: 4, words: [{ text: '', block: 'heading' }, { text: 'What arrives' }] },
		{ kind: 'same', text: 'Two shelving units', old: 3, new: 5, words: [{ text: '', block: 'item' }, { text: 'Two shelving units' }] },
		{ kind: 'same', text: 'One bracket set', old: 4, new: 6, words: [{ text: '', block: 'item' }, { text: 'One bracket set' }] },
		{ kind: 'same', text: 'Kind regards, Sam', old: 5, new: 7, words: [{ text: 'Kind regards,' }, { text: '', block: 'join' }, { text: ' Sam' }] }
	]);
});

test('a changed pair marks each changed word on its removed and its added line', () => {
	assert.deepEqual(diffBlocks([P('Hello team,'), P('The new shelves arrive on Thursday.')], [P('Hello team,'), P('The new shelves come on Friday.')]), [
		{ kind: 'same', text: 'Hello team,', old: 1, new: 1 },
		{ kind: 'removed', text: 'The new shelves arrive on Thursday.', old: 2, words: [{ text: 'The new shelves ' }, { text: 'arrive', changed: true }, { text: ' on ' }, { text: 'Thursday', changed: true }, { text: '.' }] },
		{ kind: 'added', text: 'The new shelves come on Friday.', new: 2, replaces: 2, words: [{ text: 'The new shelves ' }, { text: 'come', changed: true }, { text: ' on ' }, { text: 'Friday', changed: true }, { text: '.' }] }
	]);
	// The white space between two changed words is changed too, so one mark holds both words.
	const [, two] = diffBlocks([P('a b c d')], [P('a x y d')]);
	assert.deepEqual(two.words, [{ text: 'a ' }, { text: 'x y', changed: true }, { text: ' d' }]);
});

test('above the limit, or with no shared word, a pair shows no word marks, and a run finds no split', () => {
	const old = P('The new shelves arrive on Thursday.');
	const now = P('The new shelves come on Friday.');
	assert.deepEqual(diffBlocks([old], [now], 10), [
		{ kind: 'removed', text: old.text, old: 1 },
		{ kind: 'added', text: now.text, new: 1, replaces: 1 }
	]);
	assert.deepEqual(diffBlocks([P('Alpha beta')], [P('Gamma delta')]), [
		{ kind: 'removed', text: 'Alpha beta', old: 1 },
		{ kind: 'added', text: 'Gamma delta', new: 1, replaces: 1 }
	]);
	// A split above the limit is a removed line and two added lines, with no word marks.
	assert.deepEqual(
		diffBlocks([P('Hello team, the shelves')], [P('Hello team,'), P('the shelves')], 2).map((l) => `${l.kind} ${l.text}${l.words ? ' with words' : ''}`),
		['removed Hello team, the shelves', 'added Hello team,', 'added the shelves']
	);
});

test('a block that keeps its words: a heading and an item take their mark, any other kind is a removed and an added line', () => {
	assert.deepEqual(diffBlocks([{ kind: 'h2', text: 'Plan' }], [{ kind: 'h3', text: 'Plan' }]), [{ kind: 'same', text: 'Plan', old: 1, new: 1, words: [{ text: '', block: 'heading' }, { text: 'Plan' }] }]);
	assert.deepEqual(diffBlocks([{ kind: 'bullet', text: 'Shelf' }], [{ kind: 'number', text: 'Shelf' }])[0]?.words?.[0], { text: '', block: 'item' });
	assert.deepEqual(diffBlocks([{ kind: 'h2', text: 'Plan' }], [P('Plan')]), [
		{ kind: 'removed', text: 'Plan', old: 1 },
		{ kind: 'added', text: 'Plan', new: 1, replaces: 1 }
	]);
	// A join into a heading takes the mark of the heading first.
	assert.deepEqual(diffBlocks([P('Kind'), P('regards')], [{ kind: 'h2', text: 'Kind regards' }])[0]?.words, [{ text: '', block: 'heading' }, { text: 'Kind' }, { text: '', block: 'join' }, { text: ' regards' }]);
	// An added item takes the mark of the item.
	assert.deepEqual(diffBlocks([P('A')], [P('A'), { kind: 'bullet', text: 'New item' }])[1], { kind: 'added', text: 'New item', new: 2, words: [{ text: '', block: 'item' }, { text: 'New item' }] });
});

test('an empty line is a block with no words: an empty block, a line break after no words, and a line of code between two line ends', () => {
	const kinds = (html) => blocks(html).map((b) => `${b.kind} ${b.text}`);
	assert.deepEqual(kinds('<div>A</div><div><br></div><div>B</div>'), ['paragraph A', 'paragraph ', 'paragraph B']);
	assert.deepEqual(kinds('<div>A<br><br>B</div>'), ['paragraph A', 'paragraph ', 'paragraph B']);
	// The last line break of a block, alone in its line, draws an empty last line, as words() counts it.
	assert.deepEqual(kinds('<div>A<br><br></div><div>B</div>'), ['paragraph A', 'paragraph ', 'paragraph B']);
	assert.deepEqual(kinds('<ul><li>One<br><br></li></ul>'), ['bullet One', 'bullet ']);
	assert.deepEqual(kinds('<div><br><br></div>'), ['paragraph ', 'paragraph ']);
	assert.deepEqual(kinds('<div><br>A</div>'), ['paragraph ', 'paragraph A']);
	assert.deepEqual(kinds('<ul><li><br></li></ul><blockquote><div><br></div></blockquote>'), ['bullet ', 'quote ']);
	assert.deepEqual(kinds('<pre>a\n\nb\n</pre>'), ['code a', 'code ', 'code b']);
	// The last line break of a line, and the white space between two blocks, make no line.
	assert.deepEqual(kinds('<div>A<br></div>\n<div>B</div>'), ['paragraph A', 'paragraph B']);
});

test('a whole text that only adds or removes an empty line counts one change, and its line says so with the mark of a paragraph break', () => {
	// The load list gives back each HTML of these cases as it is, so the parser of the test reads what the field reads.
	const cases = {
		'between two lines': ['<div>A</div><div>B</div>', '<div>A</div><div><br></div><div>B</div>'],
		'at the start': ['<div>A</div><div>B</div>', '<div><br></div><div>A</div><div>B</div>'],
		'at the end': ['<div>A</div><div>B</div>', '<div>A</div><div>B</div><div><br></div>'],
		'in a list': ['<ul><li>A</li><li>B</li></ul>', '<ul><li>A</li><li><br></li><li>B</li></ul>'],
		'in a quote': ['<blockquote><div>A</div><div>B</div></blockquote>', '<blockquote><div>A</div><div><br></div><div>B</div></blockquote>'],
		'of two line breaks': ['<div>A<br>B</div>', '<div>A<br><br>B</div>'],
		'in an item of a list': ['<ul><li>A<br>B</li></ul>', '<ul><li>A<br><br>B</li></ul>'],
		'at the end of a line': ['<div>A</div>', '<div>A<br><br></div>'],
		'at the end of an item of a list': ['<ul><li>A</li></ul>', '<ul><li>A<br><br></li></ul>'],
		'of code': ['<pre>a\nb</pre>', '<pre>a\n\nb</pre>']
	};
	const marks = (lines) => changed(lines).map((l) => `${l.kind} "${l.text}" ${l.words?.filter((w) => w.block).map((w) => w.block)}`);
	for (const [name, [without, withEmpty]] of Object.entries(cases)) {
		const added = diffOf(without, withEmpty);
		const removed = diffOf(withEmpty, without);
		assert.equal(changes(added), 1, `an empty line ${name} that a whole text adds`);
		assert.equal(changes(removed), 1, `an empty line ${name} that a whole text removes`);
		// An added line of a list takes the mark of the item, and any other added empty line the mark of a new paragraph break.
		assert.deepEqual(marks(added), [`added "" ${/list/.test(name) ? 'item' : 'split'}`], `an empty line ${name} that a whole text adds`);
		assert.deepEqual(marks(removed), ['removed "" join'], `an empty line ${name} that a whole text removes`);
	}
	assert.deepEqual(diffOf('<div>A</div><div>B</div>', '<div>A</div><div><br></div><div>B</div>'), [
		{ kind: 'same', text: 'A', old: 1, new: 1 },
		{ kind: 'added', text: '', new: 2, words: [{ text: '', block: 'split' }] },
		{ kind: 'same', text: 'B', old: 2, new: 3 }
	]);
	// An empty line that stays is no change.
	assert.equal(changes(diffOf('<div>A</div><div><br></div><div>B</div>', '<div>A</div><div><br></div><div>C</div>')), 1);
	// An empty line that becomes words, and words that become an empty line, are a changed line with no mark of a paragraph break.
	assert.deepEqual(diffOf('<div>A</div><div><br></div><div>B</div>', '<div>A</div><div>X</div><div>B</div>'), [
		{ kind: 'same', text: 'A', old: 1, new: 1 },
		{ kind: 'removed', text: '', old: 2 },
		{ kind: 'added', text: 'X', new: 2, replaces: 2 },
		{ kind: 'same', text: 'B', old: 3, new: 3 }
	]);
	assert.deepEqual(diffOf('<div>A</div><div>X</div><div>B</div>', '<div>A</div><div><br></div><div>B</div>'), [
		{ kind: 'same', text: 'A', old: 1, new: 1 },
		{ kind: 'removed', text: 'X', old: 2 },
		{ kind: 'added', text: '', new: 2, replaces: 2 },
		{ kind: 'same', text: 'B', old: 3, new: 3 }
	]);
});

test('a text that holds only one empty line has no lines, as a text with no lines, so the diff between the two has no change', () => {
	assert.deepEqual(blocks('<div><br></div>'), []);
	assert.deepEqual(diffOf('', '<div><br></div>'), []);
	assert.deepEqual(diffOf('<div><br></div>', ''), []);
	// Two empty lines are two lines.
	assert.equal(blocks('<div><br></div><div><br></div>').length, 2);
});

test('a plain text of a whole text is one block of the kind paragraph for each line, an empty line too, so the diff counts each line', () => {
	// plainHtml() gives the HTML that a field of a plain text diffs and that Take all writes, from its value and from a whole text as plain.
	assert.deepEqual(blocks(plainHtml('Dear Ana,\n\nThe <b> & the   rest.\r\nKind regards\n')), [P('Dear Ana,'), P(''), P('The <b> & the rest.'), P('Kind regards'), P('')]);
	assert.deepEqual(blocks(plainHtml('')), [], 'an empty text has no lines');
	assert.deepEqual(blocks(plainHtml('A\n   \nB')), [P('A'), P(''), P('B')], 'a line of white space only is an empty line');
	const diffPlain = (a, b) => diffOf(plainHtml(a), plainHtml(b));
	// An empty line that a plain text adds between two paragraphs is one change, with the mark of a paragraph break.
	assert.deepEqual(diffPlain('Hello Ana,\nThe shelves arrive.', 'Hello Ana,\n\nThe shelves arrive.'), [
		{ kind: 'same', text: 'Hello Ana,', old: 1, new: 1 },
		{ kind: 'added', text: '', new: 2, words: [{ text: '', block: 'split' }] },
		{ kind: 'same', text: 'The shelves arrive.', old: 2, new: 3 }
	]);
	assert.equal(changes(diffPlain('A\n\nB', 'A\nB')), 1, 'an empty line that a plain text removes');
	// A line that splits in two, and two lines that join, take the marks split and join, and no mark of a heading or an item.
	const split = diffPlain('Kind regards, Sam', 'Kind regards,\nSam');
	assert.deepEqual(changed(split).map((l) => l.words?.filter((w) => w.block).map((w) => w.block)), [['split']]);
	const join = diffPlain('Kind regards,\nSam', 'Kind regards, Sam');
	assert.deepEqual(changed(join).map((l) => l.words?.filter((w) => w.block).map((w) => w.block)), [['join']]);
	assert.equal(changes(diffPlain('the shelfs arrive', 'the shelves arrive')), 1, 'a changed word');
});

test('an empty line between the parts of a split is an added line with the mark of a new paragraph break, or of a new item in a list', () => {
	assert.deepEqual(diffOf('<div>Hello team, the shelves</div>', '<div>Hello team,</div><div><br></div><div>the shelves</div>'), [
		{ kind: 'same', text: 'Hello team,', old: 1, new: 1, words: [{ text: 'Hello team,' }, { text: '', block: 'split' }] },
		{ kind: 'added', text: '', new: 2, words: [{ text: '', block: 'split' }] },
		{ kind: 'same', text: 'the shelves', old: 1, new: 3 }
	]);
	assert.deepEqual(diffOf('<ul><li>Hello team, the shelves</li></ul>', '<ul><li>Hello team,</li><li><br></li><li>the shelves</li></ul>'), [
		{ kind: 'same', text: 'Hello team,', old: 1, new: 1, words: [{ text: 'Hello team,' }, { text: '', block: 'split' }] },
		{ kind: 'added', text: '', new: 2, words: [{ text: '', block: 'item' }, { text: '' }] },
		{ kind: 'same', text: 'the shelves', old: 1, new: 3 }
	]);
});

test('an empty line between the parts of a join is a removed line after the joined line, so a split and a join with an empty line count two changes each', () => {
	const join = diffOf('<div>Kind regards,</div><div><br></div><div>Sam</div>', '<div>Kind regards, Sam</div>');
	assert.deepEqual(join, [
		{ kind: 'same', text: 'Kind regards, Sam', old: 1, new: 1, words: [{ text: 'Kind regards,' }, { text: '', block: 'join' }, { text: ' Sam' }] },
		{ kind: 'removed', text: '', old: 2, words: [{ text: '', block: 'join' }] }
	]);
	assert.equal(changes(join), 2, 'a join with an empty line between its parts');
	assert.equal(changes(diffOf('<div>Kind regards, Sam</div>', '<div>Kind regards,</div><div><br></div><div>Sam</div>')), 2, 'a split with an empty line between its parts');
});

test('the blocks that stay are a longest common list of the two texts, and the lines give back both texts', () => {
	// A small alphabet of one-letter blocks: no two of them join into a third, so each change is a removed or an added line.
	let seed = 7;
	const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
	const list = () => Array.from({ length: Math.floor(random() * 12) }, () => P('abc'[Math.floor(random() * 3)]));
	const lcs = (a, b) => {
		const t = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
		for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) t[i][j] = a[i].text === b[j].text ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
		return t[0][0];
	};
	for (let round = 0; round < 300; round++) {
		const a = list();
		const b = list();
		const lines = diffBlocks(a, b);
		const old = lines.filter((l) => l.kind !== 'added').map((l) => l.text);
		const now = lines.filter((l) => l.kind !== 'removed').map((l) => l.text);
		assert.deepEqual(old, a.map((x) => x.text), `old side of ${JSON.stringify([a, b])}`);
		assert.deepEqual(now, b.map((x) => x.text), `new side of ${JSON.stringify([a, b])}`);
		assert.equal(lines.filter((l) => l.kind === 'same').length, lcs(a, b), `kept blocks of ${JSON.stringify([a, b])}`);
	}
});
