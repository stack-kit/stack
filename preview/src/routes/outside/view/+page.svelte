<script lang="ts">
	import { page } from '$app/state';
	import LinkPage from '#lib/outside/LinkPage.svelte';
	import ReadOnlyPage from '#lib/outside/ReadOnlyPage.svelte';
	import RecoveryPage from '#lib/outside/RecoveryPage.svelte';
	import SignInPage from '#lib/outside/SignInPage.svelte';
	import { addressOf, type LinkState, type RecoveryState, type SignInState } from '#lib/outside/data.js';

	// One page outside the shell in one state, such as ?page=sign-in&state=waiting. The page fills
	// the window: the root layout draws no top bar and no <main> here, because the page draws its
	// own head line and <main>. /outside shows each state in a window frame and a phone frame.
	const address = $derived(addressOf(page.url));
</script>

{#key `${address.kind} ${address.state}`}
	{#if address.kind === 'sign-in'}
		<SignInPage initial={address.state as SignInState} />
	{:else if address.kind === 'recovery'}
		<RecoveryPage initial={address.state as RecoveryState} />
	{:else if address.kind === 'read-only'}
		<ReadOnlyPage />
	{:else}
		<LinkPage initial={address.state as LinkState} />
	{/if}
{/key}
