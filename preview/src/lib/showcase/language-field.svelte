<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import type { Fact } from '#lib/outside/Facts.svelte';
	import { forcedOpen } from '#lib/preview/view.svelte.js';
	import { bindKey } from '#lib/stack/behaviour/keys.js';
	import InternalMark from '#lib/stack/InternalMark.svelte';
	import LanguageField, { languageDirection, languageName } from '#lib/stack/LanguageField.svelte';
	import RichTextField from '#lib/stack/RichTextField.svelte';
	import RichTextView from '#lib/stack/RichTextView.svelte';
	import SendCheck from '#lib/stack/SendCheck.svelte';
	import type { RichTextEditor } from '#lib/stack/rich-text.js';

	// The states of the language-field definition in DESIGN.md, each through the part LanguageField. Then a
	// reply in two languages as a product builds it: the language field picks the language of the reply,
	// and the send form is a toggle group of the product, not a part of STACK. The text that goes out comes
	// first, with the lang and the dir of its language and a label that names it. The text in the language of
	// the team follows, and it stands in an internal mark while it stays in the conversation. One Cmd+Enter
	// in either text shows the send check, whose summary names the language and the form. Every person,
	// company and address is invented.
	const locale = 'en-GB';
	const TEAM = 'en';
	const languages = ['ar', 'de', 'en', 'es', 'fr', 'he', 'it', 'ja', 'nl', 'pl', 'pt-BR', 'sv', 'th', 'tr', 'zh-Hans'];
	const suggested = ['de', TEAM];

	type State = { label: string; value?: string; open: boolean; disabled?: boolean; error?: string; openId?: string };
	const states: State[] = $state([
		{ label: 'the language of the customer', value: 'de', open: false },
		{ label: 'open, with a chosen language', value: 'pt-BR', open: forcedOpen('language-field'), openId: 'language-field' },
		{ label: 'a language from right to left', value: 'ar', open: false },
		{ label: 'empty', open: false },
		{ label: 'disabled', value: TEAM, open: false, disabled: true },
		{ label: 'invalid', open: false, error: 'Choose the language of the reply.' }
	]);

	// ---- The reply of the product.
	const GERMAN = '<div>Guten Tag Frau Bennett,</div><div>vielen Dank für Ihre Nachricht. Die Erstattung für die Bestellung 8841 ist unterwegs.</div>';
	const ENGLISH = '<div>Hello Ms Bennett,</div><div>thank you for your message. The refund for order 8841 is on its way.</div>';
	let reply = $state('de');
	/** The send form of the product: the text in the language of the customer only, or with the text of the team below it. */
	let sendForm = $state<'below' | 'only'>('below');
	let replyEditor = $state<RichTextEditor | null>(null);
	let teamEditor = $state<RichTextEditor | null>(null);
	/** The draft of the text of the team. Its field mounts again in or out of the mark, and starts with it. */
	let teamDraft = $state(ENGLISH);
	let open = $state(false);
	let working = $state(false);
	let sent = $state<string | null>(null);
	let result = $state<HTMLElement | null>(null);
	let box = $state<HTMLDivElement | null>(null);
	/** The HTML of each text at the moment the check opens. */
	let outgoing = $state({ reply: '', team: '' });

	const two = $derived(reply !== TEAM);
	const name = $derived(languageName(reply, locale));
	const teamName = languageName(TEAM, locale);
	const formWords = $derived(!two ? name : sendForm === 'below' ? `${name}, with the ${teamName} text below it` : `${name} only`);
	const facts: Fact[] = $derived([
		{ label: 'From', value: 'Support <support@example.com>' },
		{ label: 'To', value: 'Clara Bennett <clara.bennett@example.org>' },
		{ label: 'Subject', value: 'Re: Refund for order 8841' },
		{ label: 'Language', value: formWords }
	]);

	/** Keeps the draft of the text of the team before its field mounts again, or before it goes. */
	function keepDraft() {
		if (teamEditor) teamDraft = teamEditor.html();
	}
	function setForm(next: string) {
		if (next !== 'below' && next !== 'only') return;
		keepDraft();
		sendForm = next;
	}

	function check() {
		outgoing = { reply: replyEditor?.html() ?? '', team: two ? (teamEditor?.html() ?? '') : '' };
		open = true;
	}

	// One binding of the key of submit for both texts: one press shows the check once. The check binds the
	// key while it shows, so the newer binding sends from there.
	$effect(() =>
		bindKey('submit', () => {
			if (!box?.contains(document.activeElement) || open) return false;
			check();
		})
	);

	async function send() {
		working = true;
		await new Promise((r) => setTimeout(r, 600));
		working = false;
		open = false;
		sent = formWords;
		await tick();
		result?.focus();
	}
</script>

<section id="showcase-language-field" data-showcase="language-field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">language-field</h2>
	<div class="grid max-w-3xl gap-6 sm:grid-cols-2">
		{#each states as s (s.label)}
			<LanguageField
				bind:value={s.value}
				bind:open={s.open}
				{locale}
				{languages}
				{suggested}
				description={s.label}
				disabled={s.disabled}
				error={s.error}
				data-open-id={s.openId}
			/>
		{/each}
	</div>

	<h3 class="pt-4 text-xs font-medium text-muted-foreground">A reply in two languages, as a product builds it: the send form is the product's own</h3>
	<p class="max-w-3xl text-xs text-muted-foreground">
		The text that goes out comes first, with the lang and the dir of its language. The text of the team follows, and it stands in an internal mark
		while it stays in the conversation. Send, or Cmd+Enter in either text, shows the check once, and its summary names the language and the form.
		Pick Arabic to see a text from right to left, and English for a reply with one text.
	</p>
	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border border-border p-4">
		{#if sent}
			<p bind:this={result} tabindex="-1" role="status" class="text-muted-foreground outline-none">
				Sent by Riley Shaw · {sent}. <Button variant="outline" size="xs" onclick={() => (sent = null)}>Show the form again</Button>
			</p>
		{:else}
			<SendCheck
				bind:ref={box}
				bind:open
				title="Send the reply to Clara Bennett?"
				{facts}
				action="Send to clara.bennett@example.org"
				{working}
				onsend={send}
			>
				{#snippet form()}
					<div class="flex flex-col gap-4">
						<div class="flex flex-wrap items-end gap-3">
							<LanguageField label="Reply language" {locale} {languages} {suggested} bind:value={reply} onValueChange={keepDraft} class="w-56" />
							{#if two}
								<Field.Field class="w-auto">
									<Field.Label id="showcase-language-form">Send form</Field.Label>
									<ToggleGroup.Root type="single" variant="outline" size="sm" bind:value={() => sendForm, setForm} aria-labelledby="showcase-language-form">
										<ToggleGroup.Item value="below">With the {teamName} below</ToggleGroup.Item>
										<ToggleGroup.Item value="only">{name} only</ToggleGroup.Item>
									</ToggleGroup.Root>
								</Field.Field>
							{/if}
						</div>
						<Field.Field>
							<Field.Label id="showcase-language-reply">{two ? `${name}, the text that goes out` : 'Reply'}</Field.Label>
							<RichTextField
								bind:editor={replyEditor}
								preset="simple"
								html={GERMAN}
								lang={reply}
								dir={languageDirection(reply)}
								aria-labelledby="showcase-language-reply"
								aria-describedby="showcase-language-reply-help"
							/>
							<Field.Description id="showcase-language-reply-help">From Support to Clara Bennett</Field.Description>
						</Field.Field>
						{#if two}
							{#snippet team()}
								<Field.Field>
									<Field.Label id="showcase-language-team">{teamName}</Field.Label>
									<RichTextField
										bind:editor={teamEditor}
										preset="simple"
										html={teamDraft}
										lang={TEAM}
										aria-labelledby="showcase-language-team"
										aria-describedby="showcase-language-team-help"
									/>
									<Field.Description id="showcase-language-team-help">
										{sendForm === 'below' ? `Goes out below the ${name} text, after a line "${teamName}:".` : 'Stays in the conversation, and does not go out.'}
									</Field.Description>
								</Field.Field>
							{/snippet}
							{#if sendForm === 'only'}
								<InternalMark>{@render team()}</InternalMark>
							{:else}
								{@render team()}
							{/if}
						{/if}
						<div class="flex justify-end"><Button onclick={check}>Send</Button></div>
					</div>
				{/snippet}
				{#snippet preview()}
					<div class="flex flex-col gap-3 rounded-lg border border-border p-3">
						<RichTextView html={outgoing.reply} preset="simple" lang={reply} dir={languageDirection(reply)} />
						{#if two && sendForm === 'below'}
							<p class="text-muted-foreground">{teamName}:</p>
							<RichTextView html={outgoing.team} preset="simple" lang={TEAM} />
						{/if}
					</div>
				{/snippet}
			</SendCheck>
		{/if}
	</div>
</section>
