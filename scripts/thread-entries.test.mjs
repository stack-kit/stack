// The entries of the team in their place by time (preview/src/lib/stack/thread-entries.ts), as "Between
// the messages" of ### mail-message and ### comment-list in DESIGN.md say: placeAfter gives each event and
// comment to the last mail at or before its time, interleave orders the entries of CommentList, and
// inConversation orders the mails, the chat messages and the entries of Conversation (### conversation).
//
//   node --test scripts/thread-entries.test.mjs
//
// The module imports types only, so Node runs it with its type stripping.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inConversation, interleave, placeAfter } from '../preview/src/lib/stack/thread-entries.ts';

const at = (hm) => new Date(`2026-11-17T${hm}:00+01:00`);
const mail = (id, hm, more = {}) => ({ id, at: at(hm), from: { address: `${id}@example.com` }, to: [], body: [], ...more });
const event = (id, hm) => ({ id, at: at(hm), text: `event ${id}` });
const comment = (id, hm) => ({ id, at: at(hm), author: { name: 'Morgan Lee' }, html: `<div>${id}</div>` });
/** The keys of each mail, with the ids of the lines of each stretch: "m1: l-e1(e1,e2) c-c1". */
const show = (map) =>
	[...map].map(([id, entries]) => `${id}:${entries.map((e) => (e.kind === 'lines' ? ` ${e.key}(${e.lines.map((l) => l.id).join()})` : ` ${e.key}`)).join('')}`);

test('1. the map holds each mail id in the given order, with [] for a mail that no entry follows, and sorts no mail', () => {
	const mails = [mail('m2', '12:00'), mail('m1', '09:00'), mail('m3', '15:00')];
	const out = placeAfter(mails, [], []);
	assert.deepEqual([...out.keys()], ['m2', 'm1', 'm3']);
	for (const entries of out.values()) assert.deepEqual(entries, []);
});

test('2. each entry goes to the last mail whose time is at or before its time', () => {
	const mails = [mail('m1', '09:00'), mail('m2', '12:00'), mail('m3', '15:00')];
	const out = placeAfter(mails, [event('e1', '09:00'), event('e2', '11:59'), event('e3', '12:00'), event('e4', '18:00')], [comment('c1', '14:00')]);
	assert.deepEqual(show(out), ['m1: l-e1(e1,e2)', 'm2: l-e3(e3) c-c1', 'm3: l-e4(e4)']);
});

test('3. an entry before every mail goes to the first mail and stands first in its box, in the order of time', () => {
	const mails = [mail('m1', '09:00'), mail('m2', '12:00')];
	const out = placeAfter(mails, [event('e2', '09:30'), event('e1', '08:00')], [comment('c0', '07:00')]);
	assert.deepEqual(show(out), ['m1: c-c0 l-e1(e1,e2)', 'm2:']);
});

test('4. at one time a comment comes before an event, and two entries of one kind keep the given order', () => {
	const mails = [mail('m1', '09:00')];
	const out = placeAfter(mails, [event('e2', '10:00'), event('e1', '10:00')], [comment('c2', '10:00'), comment('c1', '10:00')]);
	assert.deepEqual(show(out), ['m1: c-c2 c-c1 l-e2(e2,e1)']);
});

test('5. a run of events in one box is one stretch, and a comment or the next mail ends it', () => {
	const mails = [mail('m1', '09:00'), mail('m2', '12:00')];
	const out = placeAfter(mails, [event('e1', '09:10'), event('e2', '09:20'), event('e3', '09:40'), event('e4', '11:00'), event('e5', '12:10')], [comment('c1', '09:30')]);
	assert.deepEqual(show(out), ['m1: l-e1(e1,e2) c-c1 l-e3(e3,e4)', 'm2: l-e5(e5)']);
});

test('6. a reply that waits takes its place by at, and sendsAt plays no part', () => {
	const mails = [mail('m1', '09:00'), mail('m2', '12:00', { direction: 'out', sendsAt: at('12:05') })];
	const out = placeAfter(mails, [event('e1', '11:00'), event('e2', '12:01'), event('e3', '12:10')], []);
	assert.deepEqual(show(out), ['m1: l-e1(e1)', 'm2: l-e2(e2,e3)']);
});

test('7. with no mail the map is empty and nothing throws, and no input changes', () => {
	const events = Object.freeze([Object.freeze(event('e2', '10:00')), Object.freeze(event('e1', '09:00'))]);
	const comments = Object.freeze([Object.freeze(comment('c1', '09:30'))]);
	const mails = Object.freeze([Object.freeze(mail('m1', '09:00'))]);
	assert.equal(placeAfter([], events, comments).size, 0);
	assert.equal(placeAfter([], [], []).size, 0);
	const out = placeAfter(mails, events, comments);
	// A frozen input throws on a change, so the calls above changed none.
	assert.deepEqual(show(out), ['m1: l-e1(e1) c-c1 l-e2(e2)']);
	assert.deepEqual(events.map((e) => e.id), ['e2', 'e1']);
});

test('an event and a comment of one time: the comment comes first, also between two mails', () => {
	const mails = [mail('m1', '09:00'), mail('m2', '10:00')];
	const out = placeAfter(mails, [event('e1', '10:00')], [comment('c1', '10:00')]);
	assert.deepEqual(show(out), ['m1:', 'm2: c-c1 l-e1(e1)']);
});

test('an event and a comment with one id take two keys', () => {
	const out = placeAfter([mail('m1', '09:00')], [event('x', '10:00')], [comment('x', '11:00')]);
	assert.deepEqual(out.get('m1').map((e) => e.key), ['l-x', 'c-x']);
});

test('interleave gives the entries of CommentList with the same rule', () => {
	const entries = interleave([event('e1', '10:00'), event('e2', '10:30'), event('e3', '12:00')], [comment('c2', '11:00'), comment('c1', '10:00')]);
	assert.deepEqual(
		entries.map((e) => (e.kind === 'lines' ? `${e.key}(${e.lines.map((l) => l.id).join()})` : e.key)),
		['c-c1', 'l-e1(e1,e2)', 'c-c2', 'l-e3(e3)']
	);
	assert.deepEqual(interleave([], []), []);
});

// ---- inConversation. The times are in UTC, and the time zone of the product is Pacific/Auckland, UTC+13
// in November, so that a day of the zone differs from a day of UTC.
const utc = (day, hm) => new Date(`2026-11-${day}T${hm}:00Z`);
const chat = (id, day, hm, more = {}) => ({ id, at: utc(day, hm), from: { name: 'Ana Turner' }, body: [id], channel: 'Kiwi Talk', ...more });
const tmail = (id, day, hm) => ({ ...mail(id, '00:00'), at: utc(day, hm) });
const tevent = (id, day, hm) => ({ id, at: utc(day, hm), text: `event ${id}` });
const tcomment = (id, day, hm) => ({ id, at: utc(day, hm), author: { name: 'Morgan Lee' }, html: `<div>${id}</div>` });
const ZONE = 'Pacific/Auckland';
/** The keys of the entries, with the ids of the messages of each run and the lines of each stretch. */
const keys = (out) => out.map((e) => (e.kind === 'chat' ? `${e.key}(${e.messages.map((m) => m.id).join()})` : e.kind === 'lines' ? `${e.key}(${e.lines.map((l) => l.id).join()})` : e.key));

test('inConversation: the entries in the order of their time, with a day entry before the first entry of each day of the zone', () => {
	// 10:30 UTC on the 15th is 23:30 in Auckland, and 11:30 UTC is 00:30 on the 16th there.
	const out = inConversation([tmail('m1', '15', '11:30')], [chat('s1', '15', '10:30'), chat('s2', '16', '02:00', { from: { name: 'Riley Shaw' }, own: true })], [], [], ZONE);
	assert.deepEqual(keys(out), ['d-2026-11-15', 's-s1(s1)', 'd-2026-11-16', 'm-m1', 's-s2(s2)']);
	assert.equal(out[0].at.toISOString(), '2026-11-15T10:30:00.000Z');
	assert.equal(out[2].day, '2026-11-16');
	// The same entries in UTC fall on two other days.
	assert.deepEqual(keys(inConversation([tmail('m1', '15', '11:30')], [chat('s1', '15', '10:30')], [], [], 'UTC')), ['d-2026-11-15', 's-s1(s1)', 'm-m1']);
});

test('inConversation: a chat message before the first mail stands first', () => {
	const out = inConversation([tmail('m1', '16', '09:00')], [chat('s1', '16', '08:00')], [], [], ZONE);
	assert.deepEqual(keys(out), ['d-2026-11-16', 's-s1(s1)', 'm-m1']);
});

test('inConversation: at one time a mail, a chat message, a comment and an event, and one kind keeps the given order', () => {
	const t = ['16', '09:00'];
	const out = inConversation(
		[tmail('m2', ...t), tmail('m1', ...t)],
		[chat('s2', ...t, { from: { name: 'Riley Shaw' } }), chat('s1', ...t)],
		[tevent('e2', ...t), tevent('e1', ...t)],
		[tcomment('c2', ...t), tcomment('c1', ...t)],
		ZONE
	);
	assert.deepEqual(keys(out), ['d-2026-11-16', 'm-m2', 'm-m1', 's-s2(s2)', 's-s1(s1)', 'c-c2', 'c-c1', 'l-e2(e2,e1)']);
});

test('inConversation: a run of chat messages ends at a change of author, side or channel, at a pause of more than 5 minutes, and at any other entry', () => {
	const out = inConversation(
		[tmail('m1', '16', '09:30')],
		[
			chat('a1', '16', '09:00'),
			chat('a2', '16', '09:01'),
			chat('b1', '16', '09:02', { channel: 'Mail' }),
			chat('c1', '16', '09:03', { channel: 'Mail', own: true }),
			chat('d1', '16', '09:04', { channel: 'Mail', own: true, from: { name: 'Riley Shaw' } }),
			chat('d2', '16', '09:09', { channel: 'Mail', own: true, from: { name: 'Riley Shaw' } }),
			// 5 minutes and 1 second after d2.
			chat('d3', '16', '09:14', { channel: 'Mail', own: true, from: { name: 'Riley Shaw' }, at: new Date('2026-11-16T09:14:01Z') }),
			chat('e1', '16', '09:31'),
			chat('e2', '16', '09:32')
		],
		[tevent('x1', '16', '09:31')],
		[],
		ZONE
	);
	assert.deepEqual(keys(out), ['d-2026-11-16', 's-a1(a1,a2)', 's-b1(b1)', 's-c1(c1)', 's-d1(d1,d2)', 's-d3(d3)', 'm-m1', 's-e1(e1)', 'l-x1(x1)', 's-e2(e2)']);
});

test('inConversation: a stretch of events ends at a day, and with no entry the list is empty; no input changes', () => {
	const events = Object.freeze([Object.freeze(tevent('x2', '16', '11:30')), Object.freeze(tevent('x1', '16', '10:30'))]);
	const out = inConversation([], [], events, [], ZONE);
	assert.deepEqual(keys(out), ['d-2026-11-16', 'l-x1(x1)', 'd-2026-11-17', 'l-x2(x2)']);
	assert.deepEqual(events.map((e) => e.id), ['x2', 'x1']);
	assert.deepEqual(inConversation([], [], [], [], ZONE), []);
});
