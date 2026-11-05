<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/** A person in the header of a mail: the name when the mail holds one, and the address. */
	export type MailPerson = { name?: string; address: string };
	/** A file of a mail, with its size in words, such as "182 KB". */
	export type MailFile = { name: string; size: string; image?: boolean };
	export type Mail = {
		id: string;
		from: MailPerson;
		to: MailPerson[];
		/** The count of the people that the product left out of to, when it gives only the first people. It shows after the last person, as "and 90 more". */
		toMore?: number;
		cc?: MailPerson[];
		/** The count of the people that the product left out of cc, as toMore. */
		ccMore?: number;
		/** Only a message that the product sent holds Bcc. A message that came in does not show it. */
		bcc?: MailPerson[];
		at: Date;
		/** The paragraphs of the plain text part. A blank line ends a paragraph, and a single line break stays in it as \n. */
		body: string[];
		/** The language of the body when it differs from the interface, and its direction. */
		lang?: string;
		dir?: 'ltr' | 'rtl' | 'auto';
		/** The quoted part of an earlier message, which the product found at the end of the body. Its paragraphs take the form of body. */
		quote?: string[];
		/** A translation from an agent, which no person confirmed: the agent and the paragraphs, in the form of body. */
		translation?: { by: string; lang: string; body: string[] };
		files?: MailFile[];
		/** The line of a message that the product sent, such as "Sent by Mail agent for Marko Ellis". */
		sentBy?: string;
		/** The reason when a reply did not go out. */
		failed?: string;
		/** True while the person has not read the message. */
		unread?: boolean;
	};

	export type MailMessageProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
		/** The root element, the <article> of the message. */
		ref?: HTMLElement | null;
		mail: Mail;
		/** Now, for the time by its age. */
		now: Date;
		locale?: string;
		timeZone: string;
		/** True while the message shows as one line. The thread folds each read message but the last. */
		folded?: boolean;
		/** The level of the heading of the message: one under the heading of the thread. */
		headingLevel?: 2 | 3 | 4;
		onretry?: () => void;
		/** Opens a file from the host of the content that the product did not write. */
		onopenfile?: ((file: MailFile) => void) | undefined;
	};

	/** A time by its age, as "Formats" in architecture/web-app.md says. */
	export function age(at: Date, now: Date, locale: string, timeZone: string): string {
		const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone });
		const year = (d: Date) => d.toLocaleDateString('en-CA', { timeZone, year: 'numeric' });
		if (day(at) === day(now)) return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(at);
		if (year(at) === year(now)) return new Intl.DateTimeFormat(locale, { timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(at);
		return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium' }).format(at);
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UnreadMark from './UnreadMark.svelte';

	// One message of a mail thread (### mail-message in DESIGN.md): an <article> with no bubble and
	// no side. The header holds the avatar of 20 px, the name of the sender at 500, the address, the
	// time by its age and the unread mark. The recipients and the line of the sender follow in small
	// type, at the left edge of the name. The body is running text in the reading step, at most
	// 720 px wide, in the lang and dir of the mail. The body, the quote and the translation keep
	// each single line break of a paragraph (whitespace-pre-line). The quoted part of an earlier
	// message folds behind a button, a translation from an agent takes the dashed edge and the badge
	// of content that no person confirmed, and the files follow as attachments of size sm. A folded
	// message is one line: the avatar, the name, the first words and the time, as a button that
	// opens it. In print every message prints open, and a folded quote stays folded.
	let {
		mail,
		now,
		locale = 'en-GB',
		timeZone,
		folded = $bindable(false),
		headingLevel = 3,
		onretry,
		onopenfile,
		ref = $bindable(null),
		class: className,
		...rest
	}: MailMessageProps = $props();

	const uid = $props.id();
	let quoteOpen = $state(false);
	let heading = $state<HTMLElement>();

	const label = (p: MailPerson) => p.name ?? p.address;
	/** The first words of the body for a folded line: enough to fill it, and a short name for a screen reader. */
	const first = $derived.by(() => {
		const text = mail.body.join(' ');
		if (text.length <= 120) return text;
		// Chinese, Japanese and Thai put no space between words, so the cut falls at 120 when no space comes first.
		const cut = text.lastIndexOf(' ', 120);
		return `${text.slice(0, cut > 0 ? cut : 120)}…`;
	});
	const initial = (p: MailPerson) => label(p).trim().charAt(0).toUpperCase();
	const full = $derived(new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'full', timeStyle: 'short' }));
	const number = $derived(new Intl.NumberFormat(locale));
	/** To, then Cc and Bcc when the mail holds them, each with the count of the people that the product left out. */
	const groups = $derived(
		[
			{ word: 'To', list: mail.to, more: mail.toMore },
			{ word: 'Cc', list: mail.cc ?? [], more: mail.ccMore },
			{ word: 'Bcc', list: mail.bcc ?? [], more: undefined }
		].filter((g) => g.list.length > 0)
	);

	async function unfold() {
		folded = false;
		await tick();
		heading?.focus();
	}
</script>

{#snippet avatar(p: MailPerson)}
	<Avatar.Root size="sm" aria-hidden="true" class="data-[size=sm]:size-5"><Avatar.Fallback class="font-medium group-data-[size=sm]/avatar:text-2xs">{initial(p)}</Avatar.Fallback></Avatar.Root>
{/snippet}

{#snippet time()}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<time {...props} tabindex="-1" data-slot="mail-message-time" datetime={mail.at.toISOString()} class="shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">{age(mail.at, now, locale, timeZone)}</time>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{full.format(mail.at)}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<!-- A list that the product cut ends with the count of the others, as plain text: the part does not hold those people. -->
{#snippet people(word: string, list: MailPerson[], more = 0)}
	{word}{' '}{#each list as p, i (i)}{#if i > 0},{' '}{/if}{#if p.name}<bdi>{p.name}</bdi> &lt;{p.address}&gt;{:else}{p.address}{/if}{/each}{#if more > 0}{' '}and {number.format(more)} more<span class="sr-only select-none">{' '}{more === 1 ? 'recipient' : 'recipients'}</span>{/if}
{/snippet}

<Tooltip.Provider>
	<article bind:this={ref} data-slot="mail-message" aria-labelledby="{uid}-from" class={cn('border-b border-border text-sm last:border-b-0', className)} {...rest}>
		{#if folded}
			<svelte:element this={`h${headingLevel}`} class="print:hidden">
				<!-- The phone key of the slot makes the line 44 px high below 768 px, so the line takes no min-h class. -->
				<button
					type="button"
					data-slot="mail-message-fold"
					aria-expanded="false"
					aria-controls="{uid}-content"
					class="flex w-full cursor-pointer items-center gap-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
					onclick={unfold}
				>
					{@render avatar(mail.from)}
					<bdi id="{uid}-from" class="max-w-48 shrink-0 overflow-x-clip font-medium text-ellipsis whitespace-nowrap">{label(mail.from)}</bdi>
					<span class="min-w-0 flex-1 overflow-x-clip text-left text-ellipsis whitespace-nowrap text-muted-foreground" lang={mail.lang} dir="auto">{first}</span>
					<span class="shrink-0 text-xs text-muted-foreground tabular-nums">{age(mail.at, now, locale, timeZone)}</span>
				</button>
			</svelte:element>
		{/if}
		<div id="{uid}-content" class={cn('flex-col gap-3 py-4', folded ? 'hidden print:flex' : 'flex')}>
			<header data-slot="mail-message-header" class="flex flex-col gap-1">
				<div class="flex items-start gap-2">
					{@render avatar(mail.from)}
					<div class="min-w-0 flex-1 wrap-break-word">
						<svelte:element
							this={`h${headingLevel}`}
							bind:this={heading}
							id={folded ? undefined : `${uid}-from`}
							tabindex="-1"
							class="inline outline-none focus-visible:underline"
						>
							{#if mail.unread}<span class="sr-only">Unread,</span>{/if}<bdi data-slot="mail-message-sender" class="font-medium">{label(mail.from)}</bdi>
						</svelte:element>
						{#if mail.from.name}<span data-slot="mail-message-address" class="text-muted-foreground">{' '}{mail.from.address}</span>{/if}
					</div>
					{@render time()}
					{#if mail.unread}<UnreadMark class="mt-1.5" />{/if}
				</div>
				<!-- To, then Cc and Bcc when the mail holds them, with a middle dot between the groups. -->
				<p data-slot="mail-message-recipients" class="pl-7 text-xs wrap-break-word text-muted-foreground">
					{#each groups as { word, list, more }, g (word)}{#if g > 0}{' '}·{' '}{/if}{@render people(word, list, more)}{/each}
				</p>
				{#if mail.sentBy}<p data-slot="mail-message-sent-by" class="pl-7 text-xs text-muted-foreground">{mail.sentBy}</p>{/if}
			</header>
			<div data-slot="mail-message-body" lang={mail.lang} dir={mail.dir} class="flex max-w-180 flex-col gap-3 text-md whitespace-pre-line wrap-break-word">
				{#each mail.body as p, i (i)}<p>{p}</p>{/each}
			</div>
			{#if mail.quote}
				<div class="flex max-w-180 flex-col items-start gap-2">
					<Button variant="ghost" size="xs" class="text-muted-foreground print:hidden" aria-expanded={quoteOpen} aria-controls="{uid}-quote" onclick={() => (quoteOpen = !quoteOpen)}>
						{quoteOpen ? 'Hide the quoted text' : 'Show the quoted text'}
					</Button>
					<blockquote id="{uid}-quote" data-slot="mail-message-quote" lang={mail.lang} dir={mail.dir} class={cn('flex-col gap-3 border-l border-border pl-3 text-md whitespace-pre-line wrap-break-word text-muted-foreground', quoteOpen ? 'flex' : 'hidden')}>
						{#each mail.quote as p, i (i)}<p>{p}</p>{/each}
					</blockquote>
				</div>
			{/if}
			{#if mail.translation}
				<div data-slot="mail-message-translation" lang={mail.translation.lang} class="flex max-w-180 flex-col items-start gap-3 rounded-lg border border-dashed border-input p-3 text-md whitespace-pre-line text-muted-foreground">
					<Badge variant="outline" class="border-input">Translated by {mail.translation.by}</Badge>
					{#each mail.translation.body as p, i (i)}<p>{p}</p>{/each}
				</div>
			{/if}
			{#if mail.files?.length}
				<Attachment.Group role="group" aria-label="Files of the message from {label(mail.from)}">
					{#each mail.files as f, i (i)}
						<Attachment.Root size="sm">
							<Attachment.Trigger aria-label="Open {f.name}" onclick={() => onopenfile?.(f)} />
							<Attachment.Media>{#if f.image}<ImageIcon />{:else}<FileTextIcon />{/if}</Attachment.Media>
							<Attachment.Content>
								<Attachment.Title>{f.name}</Attachment.Title>
								<Attachment.Description>{f.size}</Attachment.Description>
							</Attachment.Content>
						</Attachment.Root>
					{/each}
				</Attachment.Group>
			{/if}
			{#if mail.failed}
				<div class="flex max-w-180 items-start gap-2 text-destructive">
					<CircleAlertIcon class="mt-0.5 size-4 shrink-0" />
					<p class="min-w-0 flex-1">Not sent. {mail.failed}</p>
					<Button variant="outline" size="xs" class="shrink-0 print:hidden" onclick={onretry}>Retry</Button>
				</div>
			{/if}
		</div>
	</article>
</Tooltip.Provider>
