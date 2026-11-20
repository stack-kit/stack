// The checks of a message from the page of an HTML frame (### html-frame in DESIGN.md). HtmlFrame
// takes a message only from the window of its own frame, with the origin "null", and then only the
// result of readFrameMessage. The package exports no path to this file, and a product reads the types
// FramePage and FrameState from @stack-kit/stack/parts/HtmlFrame. The module imports only types, so
// Node runs it with its type stripping (scripts/frame-message.test.mjs).
import type { FramePage, FrameState } from './HtmlFrame.svelte';

/** The words of the state of a page. */
const STATES: readonly FrameState[] = ['html', 'text', 'too-large'];

/** The height and the facts of a message that passed each check. */
export type FrameMessage = { height: number; page: FramePage };

/**
 * The height and the facts of the data of one message, or undefined when a check fails. The data
 * passes when it is an object with the type tag, a height that is a finite number of 0 or more, a
 * state that is absent or one of the words of FrameState, and a remote count that is absent or a safe
 * whole number of 0 or more. A height over cap gives cap, and the height rounds up to a whole pixel.
 * The function reads no other field, so no other field reaches the part.
 */
export function readFrameMessage(data: unknown, type: string, cap: number): FrameMessage | undefined {
	if (typeof data !== 'object' || data === null) return undefined;
	const { type: tag, height, state, remote } = data as Record<string, unknown>;
	if (tag !== type || typeof height !== 'number' || !Number.isFinite(height) || height < 0) return undefined;
	if (state !== undefined && !(typeof state === 'string' && (STATES as readonly string[]).includes(state))) return undefined;
	if (remote !== undefined && !(typeof remote === 'number' && Number.isSafeInteger(remote) && remote >= 0)) return undefined;
	const page: FramePage = {};
	if (state !== undefined) page.state = state as FrameState;
	if (remote !== undefined) page.remote = remote;
	return { height: Math.ceil(Math.min(height, cap)), page };
}
