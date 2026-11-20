<!--
	One comment (### comment-list in DESIGN.md): an <article> with its author and its time, and its text at
	the width of the column, at most 720 px, with no bubble and no side. A comment among other content, such
	as the mails of a thread, stands in its own internal mark (internal). It is an advanced part: it puts
	the avatar, the time, the view of the text and the edit in place together.

	- The header holds an avatar of 20 px, the name of the author at 500 as the heading of the comment, the
	  time by its age with the full date and time in a tooltip, and the word "edited" after a middle dot
	  when the author edited the comment (editedAt).
	- The text shows through RichTextView, which cleans the stored HTML with the load list of
	  @stack-kit/stack/rich-text. A comment that the person may edit (editable) with onedit shows
	  RichTextInPlace: Edit, Save, Cancel and the question before a draft goes are the rules of that part.
	- An internal comment says the word at the start of its heading, "Internal, Ana Turner", and its badge
	  takes aria-hidden, so a screen reader reads the word once.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { OnFailure, RichTextInPlaceWords, RichTextPaper, RichTextPreset } from './rich-text.js';

	/** The author of a comment: the name, and the address of a picture when the product has one. */
	export type CommentAuthor = { name: string; picture?: string | undefined };
	/** One comment, as the product stores it. */
	export type CommentData = {
		id: string;
		author: CommentAuthor;
		/** The time at which the author wrote the comment. */
		at: Date;
		/** The stored HTML. The part cleans it with the load list before it shows it. */
		html: string;
		/** The time of the last edit of the author. The comment then says "edited" beside its time. */
		editedAt?: Date | undefined;
		/** True when the person may edit the comment, such as its author. The comment then shows Edit when the product gives onedit. */
		editable?: boolean | undefined;
	};
	/** The words of a comment, in the language of the product. */
	export type CommentWords = {
		/** The word after the time of a comment that its author edited. */
		edited: string;
		/** The tooltip of that word, with the full date and time of the edit. */
		editedAt: (time: string) => string;
		/** The word of the internal mark, which also starts the heading of an internal comment. */
		internal: string;
		/** The name of the text of a comment for a screen reader, which also names its Edit. */
		text: (author: string) => string;
		/** The words of the edit in place: Edit, Save, Cancel and the alert dialog. */
		edit: Partial<RichTextInPlaceWords>;
	};

	/** @behaviour escape:kept keys:submit draft:kept-on-blur cancel:alert-dialog */
	export type CommentItemProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The root element, the <article> of the comment. */
		ref?: HTMLElement | null;
		comment: CommentData;
		/** Now, for the time by its age. */
		now: Date;
		locale?: string | undefined;
		timeZone: string;
		/** The level of the heading of the comment: one under the heading of the list or the thread. */
		headingLevel?: 2 | 3 | 4 | undefined;
		/** True for a comment among content that goes out, such as the mails of a thread: it stands in its own internal mark. A comment of a list that stands in one mark takes false. */
		internal?: boolean | undefined;
		/** The preset of the field that wrote the text: `simple` by default, or `full`. */
		preset?: RichTextPreset | undefined;
		/** True for each picture address that the text keeps. By default defaultPicture of @stack-kit/stack/rich-text. */
		picture?: ((src: string) => boolean) | undefined;
		/** The paper of the field that wrote the text. */
		paper?: RichTextPaper | undefined;
		/**
		 * Stores the edit of a comment that the person may edit, and resolves when the store is done. The
		 * product then gives the stored HTML back in comment.html, with editedAt. A rejection keeps the draft
		 * and reaches onfailure with the kind save.
		 */
		onedit?: ((comment: CommentData, html: string) => Promise<void>) | undefined;
		/** Takes each failure of the edit, and gives the words of its line, or undefined for none. The part writes no failure text of its own. */
		onfailure?: OnFailure | undefined;
		/** True while an edit holds changes that are not saved. Bind it, and give it to the keysOff of the page. */
		dirty?: boolean | undefined;
		words?: Partial<CommentWords> | undefined;
	};

	/** The words of a comment in English, which the words of the product replace one by one. */
	export const COMMENT_WORDS: CommentWords = {
		edited: 'edited',
		editedAt: (time) => `Edited on ${time}`,
		internal: 'Internal',
		text: (author) => `Comment by ${author}`,
		edit: {}
	};
</script>

<script lang="ts">
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { age } from './age.js';
	import InternalMark from './InternalMark.svelte';
	import RichTextInPlace from './RichTextInPlace.svelte';
	import RichTextView from './RichTextView.svelte';

	let {
		comment,
		now,
		locale = 'en-GB',
		timeZone,
		headingLevel = 3,
		internal = false,
		preset = 'simple',
		picture,
		paper,
		onedit,
		onfailure,
		dirty = $bindable(false),
		words,
		ref = $bindable(null),
		class: className,
		...rest
	}: CommentItemProps = $props();

	const uid = $props.id();
	const w = $derived({ ...COMMENT_WORDS, ...words });
	const full = $derived(new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full', timeStyle: 'short' }));
	const initial = $derived(comment.author.name.trim().charAt(0).toUpperCase());
	/** The edit of the comment, when the person may edit it and the product stores the edit. */
	const edit = $derived(comment.editable && onedit ? (html: string) => onedit(comment, html) : undefined);
</script>

{#snippet time(at: Date, shown: string, tip: string, slot: string)}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<time {...props} tabindex="-1" data-slot={slot} datetime={at.toISOString()} class="shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">{shown}</time>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{tip}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

{#snippet content()}
	<header data-slot="comment-item-header" class="flex min-w-0 items-start gap-2">
		<Avatar.Root size="sm" aria-hidden="true" class="data-[size=sm]:size-5">
			{#if comment.author.picture}<Avatar.Image src={comment.author.picture} alt="" />{/if}
			<Avatar.Fallback class="font-medium group-data-[size=sm]/avatar:text-2xs">{initial}</Avatar.Fallback>
		</Avatar.Root>
		<svelte:element this={`h${headingLevel}`} id="{uid}-author" class="min-w-0 wrap-break-word">
			{#if internal}<span class="sr-only">{w.internal},{' '}</span>{/if}<bdi data-slot="comment-item-author" class="font-medium">{comment.author.name}</bdi>
		</svelte:element>
		{@render time(comment.at, age(comment.at, now, locale, timeZone), full.format(comment.at), 'comment-item-time')}
		{#if comment.editedAt}
			<span class="text-xs leading-5 text-muted-foreground" aria-hidden="true">·</span>
			{@render time(comment.editedAt, w.edited, w.editedAt(full.format(comment.editedAt)), 'comment-item-edited')}
		{/if}
	</header>
	<div data-slot="comment-item-text" class="max-w-180 min-w-0">
		{#if edit}
			<RichTextInPlace
				html={comment.html}
				bind:dirty
				{preset}
				{picture}
				{paper}
				aria-label={w.text(comment.author.name)}
				words={w.edit}
				onsave={edit}
				{onfailure}
			/>
		{:else}
			<RichTextView html={comment.html} {preset} {picture} {paper} />
		{/if}
	</div>
{/snippet}

<!-- The part gives its tooltips their provider, so it works on a page with none. -->
<Tooltip.Provider>
	<article bind:this={ref} data-slot="comment-item" aria-labelledby="{uid}-author" class={cn('min-w-0 text-sm', className)} {...rest}>
		{#if internal}
			<InternalMark label={w.internal} badgeHidden class="flex flex-col gap-2">{@render content()}</InternalMark>
		{:else}
			<div class="flex flex-col gap-2">{@render content()}</div>
		{/if}
	</article>
</Tooltip.Provider>
