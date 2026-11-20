// The entries of the team in their place by time ("Between the messages" of ### mail-message and
// ### comment-list in DESIGN.md): the events, which stand in stretches of activity lines, and the
// comments. CommentList orders its own entries with interleave, MailThread exports placeAfter, and
// Conversation orders its mails, chat messages and entries with inConversation, so the three parts
// keep one rule for two entries of one time. The package exports no path to this file.
// The module imports nothing, also no type, so that the record of the release gives MailThread and
// CommentList no part of the other, and Node runs it with its type stripping.

/** What the order reads of a mail, an event and a comment: its id and its time. */
export type Timed = { id: string; at: Date };

/** One entry of the team: a stretch of events (ActivityLine) with the key of its first event, or a comment (CommentData). */
export type MailEntry<L extends Timed = Timed, C extends Timed = Timed> = { kind: 'lines'; key: string; lines: L[] } | { kind: 'comment'; key: string; comment: C };

type Item<L, C> = { kind: 'line'; line: L } | { kind: 'comment'; comment: C };

const time = <L extends Timed, C extends Timed>(item: Item<L, C>) => (item.kind === 'line' ? item.line.at : item.comment.at).getTime();

/**
 * The events and the comments in the order of their time, the oldest first. At one time a comment comes
 * before an event, and two entries of one kind keep the given order: the sort is stable, and it sorts a
 * list with the comments first.
 */
function inOrder<L extends Timed, C extends Timed>(events: readonly L[], comments: readonly C[]): Item<L, C>[] {
	const items: Item<L, C>[] = [...comments.map((comment): Item<L, C> => ({ kind: 'comment', comment })), ...events.map((line): Item<L, C> => ({ kind: 'line', line }))];
	return items.sort((a, b) => time(a) - time(b));
}

/** Makes one stretch of each run of events. A comment ends the stretch before it. */
function stretches<L extends Timed, C extends Timed>(items: readonly Item<L, C>[]): MailEntry<L, C>[] {
	const out: MailEntry<L, C>[] = [];
	for (const item of items) {
		const run = out.at(-1);
		if (item.kind === 'comment') out.push({ kind: 'comment', key: `c-${item.comment.id}`, comment: item.comment });
		else if (run?.kind === 'lines') run.lines.push(item.line);
		else out.push({ kind: 'lines', key: `l-${item.line.id}`, lines: [item.line] });
	}
	return out;
}

/** The comments and the stretches of events between them, in the order of their time, as CommentList shows them. */
export function interleave<L extends Timed, C extends Timed>(events: readonly L[], comments: readonly C[]): MailEntry<L, C>[] {
	return stretches(inOrder(events, comments));
}

/**
 * Gives each event and each comment to the last mail whose time is at or before its time, for the snippet
 * after of MailThread. An entry before every mail goes to the first mail. The map holds each mail id in the
 * given order, with [] for a mail that no entry follows, and it is empty when there is no mail. Each value
 * holds the entries of one mail in the order of their time: a run of events is one stretch, and a comment
 * or the next mail ends it. A reply that waits (sendsAt) takes its place by at. The function changes no
 * input. The entries keep the types of the events and the comments that the product gives.
 */
export function placeAfter<L extends Timed, C extends Timed>(mails: readonly Timed[], events: readonly L[], comments: readonly C[]): Map<string, MailEntry<L, C>[]> {
	const boxes = mails.map((): Item<L, C>[] => []);
	for (const item of inOrder(events, comments)) {
		let i = mails.length - 1;
		while (i > 0 && mails[i]!.at.getTime() > time(item)) i--;
		boxes[i]?.push(item);
	}
	return new Map(mails.map((m, i) => [m.id, stretches(boxes[i]!)]));
}

/** What a run of chat messages reads of a message: its id, its time, its author, its side and its channel. */
export type Said = Timed & { from: { name: string }; own?: boolean | undefined; channel?: string | undefined };

/**
 * One entry of a conversation in its place, for Conversation: the start of a day, with the date in the
 * time zone (YYYY-MM-DD) and the time of the first entry of that day, a mail, a run of chat messages of
 * one author on one channel, a stretch of events, or a comment.
 */
export type Placed<M, S, L, C> =
	| { kind: 'day'; key: string; day: string; at: Date }
	| { kind: 'mail'; key: string; mail: M }
	| { kind: 'chat'; key: string; messages: S[] }
	| { kind: 'lines'; key: string; lines: L[] }
	| { kind: 'comment'; key: string; comment: C };

/** The order of the kinds at one time: an entry at the time of a mail stands after that mail, as in placeAfter. */
const RANK = { mail: 0, chat: 1, comment: 2, event: 3 } as const;

/** The longest pause inside a run of chat messages, in ms. A later message starts a new run, so that its header shows its time. */
const RUN_GAP = 5 * 60_000;

/** True when the message b continues the run of the message a: one author, one side, one channel, and at most RUN_GAP later. */
const sameRun = (a: Said, b: Said) => a.from.name === b.from.name && !!a.own === !!b.own && a.channel === b.channel && b.at.getTime() - a.at.getTime() <= RUN_GAP;

/**
 * The mails, the chat messages, the events and the comments of a conversation in the order of their time,
 * the oldest first. At one time a mail comes first, then a chat message, a comment and an event, and two
 * entries of one kind keep the given order. A day entry stands before the first entry of each day of the
 * time zone. A run of events is one stretch, and any other entry ends it. A run of chat messages holds the
 * messages of one author on one side and one channel, each at most 5 minutes after the one before, and any
 * other entry ends it. The function changes no input.
 */
export function inConversation<M extends Timed, S extends Said, L extends Timed, C extends Timed>(
	mails: readonly M[],
	messages: readonly S[],
	events: readonly L[],
	comments: readonly C[],
	timeZone: string
): Placed<M, S, L, C>[] {
	type Given = { kind: 'mail'; v: M } | { kind: 'chat'; v: S } | { kind: 'comment'; v: C } | { kind: 'event'; v: L };
	const given: Given[] = [
		...mails.map((v): Given => ({ kind: 'mail', v })),
		...messages.map((v): Given => ({ kind: 'chat', v })),
		...comments.map((v): Given => ({ kind: 'comment', v })),
		...events.map((v): Given => ({ kind: 'event', v }))
	];
	given.sort((a, b) => a.v.at.getTime() - b.v.at.getTime() || RANK[a.kind] - RANK[b.kind]);
	const out: Placed<M, S, L, C>[] = [];
	let day: string | undefined;
	for (const g of given) {
		const d = g.v.at.toLocaleDateString('en-CA', { timeZone });
		if (d !== day) out.push({ kind: 'day', key: `d-${d}`, day: d, at: g.v.at });
		day = d;
		const run = out.at(-1);
		if (g.kind === 'mail') out.push({ kind: 'mail', key: `m-${g.v.id}`, mail: g.v });
		else if (g.kind === 'comment') out.push({ kind: 'comment', key: `c-${g.v.id}`, comment: g.v });
		else if (g.kind === 'event') {
			if (run?.kind === 'lines') run.lines.push(g.v);
			else out.push({ kind: 'lines', key: `l-${g.v.id}`, lines: [g.v] });
		} else if (run?.kind === 'chat' && sameRun(run.messages.at(-1)!, g.v)) run.messages.push(g.v);
		else out.push({ kind: 'chat', key: `s-${g.v.id}`, messages: [g.v] });
	}
	return out;
}
