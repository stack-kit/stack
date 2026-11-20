<!--
	A list of comments (### comment-list in DESIGN.md), such as the comments of a form that came in or of
	a case: a section with a heading and its count, such as "Comments · 3", the comments in the order of
	their time, the oldest first, and the activity lines between them in their place by time. The list
	sorts copies of both, so the product gives them in any order. The comment box of the product follows
	the last comment (children). It is an advanced part: it puts CommentItem, ActivityLines and
	InternalMark together.

	- Each comment is a CommentItem. Each stretch of activity lines between two comments is an
	  ActivityLines, whose lines are markers of the default variant with their icon, their words and their
	  time by its age, and which folds a stretch of more than 8 lines to its last 3.
	- internal puts the whole section in one internal mark, and its comments take no mark of their own.
	  The heading then starts with the word, "Internal, Comments · 3", and the badge takes aria-hidden.
	- dirty is true while an edit of a comment holds changes that are not saved.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { ACTIVITY_LINES_WORDS, type ActivityLine } from './ActivityLines.svelte';
	import { COMMENT_WORDS, type CommentData, type CommentWords } from './CommentItem.svelte';
	import type { OnFailure, RichTextPaper, RichTextPreset } from './rich-text.js';

	/** One line of activity between the comments, such as a change of the status. ActivityLines defines it. */
	export type { ActivityLine };
	/** The words of the list, in the language of the product. */
	export type CommentListWords = CommentWords & {
		/** The line of a list with no comment and no activity. */
		empty: string;
		/** The button of the activity lines that a stretch folds, and the button that folds them again, as in ActivityLinesWords. */
		showLines: (n: number) => string;
		hideLines: (n: number) => string;
	};

	/** @behaviour escape:kept keys:submit draft:kept-on-blur cancel:alert-dialog fold:activity */
	export type CommentListProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The root element, the <section> of the list. */
		ref?: HTMLElement | null;
		/** The comments, in any order: the list sorts a copy by the time of each comment, the oldest first. */
		comments: CommentData[];
		/** The activity lines, in any order: the list sorts a copy by time, the oldest first. Each line stands between the comments by its time, and after a comment of the same time. */
		activity?: ActivityLine[] | undefined;
		now: Date;
		locale?: string | undefined;
		timeZone: string;
		/** The heading of the list, before its count. "Comments" by default. */
		label?: string | undefined;
		headingLevel?: 2 | 3 | undefined;
		/** True when the whole list stays inside the team, such as the comments of a form that came in: the section stands in one internal mark. */
		internal?: boolean | undefined;
		preset?: RichTextPreset | undefined;
		picture?: ((src: string) => boolean) | undefined;
		paper?: RichTextPaper | undefined;
		/** Stores the edit of a comment that the person may edit, as onedit of CommentItem. */
		onedit?: ((comment: CommentData, html: string) => Promise<void>) | undefined;
		onfailure?: OnFailure | undefined;
		/** True while an edit of a comment holds changes that are not saved. Bind it, and give it to the keysOff of the page. */
		dirty?: boolean | undefined;
		words?: Partial<CommentListWords> | undefined;
		/** The comment box of the product, after the last comment. */
		children?: Snippet | undefined;
	};

	/** The words of the list in English, which the words of the product replace one by one. */
	export const COMMENT_LIST_WORDS: CommentListWords = {
		...COMMENT_WORDS,
		...ACTIVITY_LINES_WORDS,
		empty: 'No comments yet.'
	};
</script>

<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { cn } from '#lib/utils.js';
	import ActivityLines from './ActivityLines.svelte';
	import CommentItem from './CommentItem.svelte';
	import InternalMark from './InternalMark.svelte';
	import { interleave } from './thread-entries.js';

	let {
		comments,
		activity = [],
		now,
		locale = 'en-GB',
		timeZone,
		label = 'Comments',
		headingLevel = 2,
		internal = false,
		preset = 'simple',
		picture,
		paper,
		onedit,
		onfailure,
		dirty = $bindable(false),
		words,
		children,
		ref = $bindable(null),
		class: className,
		...rest
	}: CommentListProps = $props();

	const uid = $props.id();
	const w = $derived({ ...COMMENT_LIST_WORDS, ...words });

	/** The comments and the stretches of activity lines between them, in the order of their time, with the rule of thread-entries.ts for two entries of one time. */
	const entries = $derived(interleave(activity, comments));

	/** The comments whose edit holds changes. */
	const drafts = new SvelteSet<string>();
	$effect(() => {
		dirty = drafts.size > 0;
	});
</script>

{#snippet body()}
	<svelte:element this={`h${headingLevel}`} id="{uid}-head" class="pb-1 text-xs font-semibold text-muted-foreground">
		{#if internal}<span class="sr-only">{w.internal},{' '}</span>{/if}{label} <span class="tabular-nums">· {comments.length}</span>
	</svelte:element>
	<div data-slot="comment-list-entries" class="flex flex-col gap-4">
		{#each entries as e (e.key)}
			{#if e.kind === 'comment'}
				<CommentItem
					comment={e.comment}
					{now}
					{locale}
					{timeZone}
					headingLevel={headingLevel === 2 ? 3 : 4}
					{preset}
					{picture}
					{paper}
					{onedit}
					{onfailure}
					{words}
					bind:dirty={() => drafts.has(e.comment.id), (v) => (v ? drafts.add(e.comment.id) : drafts.delete(e.comment.id))}
				/>
			{:else}
				<ActivityLines lines={e.lines} {now} {locale} {timeZone} words={{ showLines: w.showLines, hideLines: w.hideLines }} />
			{/if}
		{:else}
			<p class="text-xs text-muted-foreground">{w.empty}</p>
		{/each}
	</div>
	{#if children}<div data-slot="comment-list-box">{@render children()}</div>{/if}
{/snippet}

<section bind:this={ref} data-slot="comment-list" aria-labelledby="{uid}-head" class={cn('flex min-w-0 flex-col text-sm', className)} {...rest}>
	{#if internal}
		<InternalMark label={w.internal} badgeHidden class="flex flex-col gap-3">{@render body()}</InternalMark>
	{:else}
		<div class="flex flex-col gap-3">{@render body()}</div>
	{/if}
</section>
