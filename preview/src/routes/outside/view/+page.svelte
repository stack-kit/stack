<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import LinkPage from '#lib/outside/LinkPage.svelte';
	import ReadOnlyPage from '#lib/outside/ReadOnlyPage.svelte';
	import RecoveryPage from '#lib/outside/RecoveryPage.svelte';
	import SetupLinkPage from '#lib/outside/SetupLinkPage.svelte';
	import SignInPage from '#lib/outside/SignInPage.svelte';
	import * as Table from '#lib/components/ui/table/index.js';
	import {
		CODES,
		PRODUCT,
		SAMPLE_ADDRESS,
		VISITS,
		addressOf,
		change,
		count,
		link,
		readOnly,
		recovery,
		setupLink,
		signIn,
		viewHref
	} from '#lib/preview/samples.js';

	// One page outside the shell in one state, such as ?page=sign-in&state=waiting. The page fills
	// the window: the root layout draws no top bar and no <main> here, because the page draws its
	// own head line and <main>. /outside shows each state in a window frame and a phone frame.
	// The sample functions give the answer of the state, and onMount takes the step that leads to
	// it, as a person does: a click on a button, or a code and Continue.
	const address = $derived(addressOf(page.url));
	const links = { recovery: viewHref('recovery', 'ready') };

	/** Types a value into a field, as a person does, so that its binding and its checks run. */
	function type(input: HTMLInputElement | null, value: string) {
		if (!input) return;
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}
	const button = (text: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
	/** Fills a form, then submits it. */
	async function submit(form: HTMLFormElement | undefined, values: [string, string][]) {
		if (!form) return;
		for (const [name, value] of values) type(form.querySelector<HTMLInputElement>(`input[name="${name}"]`), value);
		await tick();
		form.requestSubmit();
		await new Promise((r) => setTimeout(r, 50));
	}

	onMount(async () => {
		await tick();
		const { kind, state } = address;
		const forms = [...document.querySelectorAll('form')];
		if (kind === 'sign-in') {
			if (['waiting', 'failed', 'cancelled'].includes(state)) button('Sign in with a passkey')?.click();
			else if (state.startsWith('code-') || state.startsWith('passkey')) await submit(forms[0], [['email', SAMPLE_ADDRESS], ['code', CODES.device]]);
			else if (state.startsWith('app-')) await submit(forms[0], [['email', SAMPLE_ADDRESS], ['code', CODES.app]]);
			if (state.startsWith('passkey-')) button('Create a passkey')?.click();
		} else if (kind === 'recovery') {
			if (['code-wrong', 'paused', 'paused-100'].includes(state)) await submit(forms[0], [['email', SAMPLE_ADDRESS], ['code', CODES.saved]]);
			else if (state.startsWith('setup-') || state === 'passkey') await submit(forms[1], [['setup', CODES.setup]]);
		} else if (kind === 'setup-link') {
			if (['waiting', 'failed', 'cancelled'].includes(state)) button('Create a passkey')?.click();
			else if (state === 'not-now-failed' || state === 'recovery-code') button('Not now')?.click();
		} else if (kind === 'link') {
			if (['working', 'done', 'failed'].includes(state)) button('Approve quote')?.click();
		}
	});
</script>

{#key `${address.kind} ${address.state}`}
	{#if address.kind === 'sign-in'}
		<SignInPage product={PRODUCT} {...signIn(address.state)} ondone={() => {}} {links} />
	{:else if address.kind === 'recovery'}
		<RecoveryPage product={PRODUCT} {...recovery(address.state)} ondone={() => {}} />
	{:else if address.kind === 'setup-link'}
		<SetupLinkPage product={PRODUCT} {...setupLink(address.state)} ondone={() => {}} />
	{:else if address.kind === 'read-only'}
		<ReadOnlyPage product={PRODUCT} {...readOnly(address.state)}>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Page</Table.Head>
						<Table.Head class="text-right">Visits</Table.Head>
						<Table.Head class="text-right">Change from September</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each VISITS.rows as r (r.page)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs">{r.page}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{count(r.visits)}</Table.Cell>
							<Table.Cell class={['text-right tabular-nums', r.change === 0 && 'text-muted-foreground']}>{change(r.change)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</ReadOnlyPage>
	{:else}
		<LinkPage product={PRODUCT} {...link(address.state)} />
	{/if}
{/key}
