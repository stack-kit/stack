<script lang="ts" module>
	import type { Done, OutsideRoot, Refused } from './OutsidePage.svelte';
	import type { WithCode } from './SetupLinkPage.svelte';

	export type RecoveryPageProps = OutsideRoot & {
		/** Checks the email address of the account and the saved recovery code, with or without its hyphens. */
		recoveryCode: (email: string, code: string) => Promise<{ ok: true } | Refused<'code-wrong' | 'paused' | 'paused-100'>>;
		/** Checks the setup code that an administrator reads by phone, with or without its spaces and hyphens. */
		setupCode: (code: string) => Promise<{ ok: true } | Refused<'setup-wrong' | 'setup-used' | 'paused'>>;
		/** "Create a passkey" in the step "Make a passkey on this device", which follows a right code: the browser makes a passkey, and the server saves it and spends the code. */
		addPasskey: () => Promise<WithCode | Refused<'cancelled' | 'failed'>>;
		/** "Not now" in that step: the server spends the code with no passkey, for this session only. */
		notNow: () => Promise<WithCode | Refused<'failed'>>;
		/** Continue under the new recovery code: the person is in, and the product goes on. */
		ondone: Done;
		/** The address that each code form posts to with no script. With none, the forms post to the address of the page. */
		action?: string;
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { cn } from '#lib/utils.js';
	import { pasteCode } from './codes.js';
	import OutsidePage from './OutsidePage.svelte';
	import SetupLinkPage from './SetupLinkPage.svelte';

	// The recovery page of "Recovery page" in DESIGN.md: two forms, one for each code. The first takes
	// the email address of the account and the saved recovery code. The second takes the setup code
	// that an administrator reads by phone, and it needs no address. Each Continue always submits: an
	// empty address and a short code each show a field error, and the product function answers each
	// full code. An error goes when the person changes its code, and the errors of one form go when the
	// person submits the other form. A right code leads to the step "Make a passkey on this device",
	// which is the page of a setup link with the title of the step: Create a passkey or Not now, then
	// the new recovery code once, and Continue runs ondone. The step shows only with a script.
	let { product, recoveryCode, setupCode, addPasskey, notNow, ondone, action, class: className, ref = $bindable(null), ...rest }: RecoveryPageProps = $props();

	const uid = $props.id();
	let step = $state<'codes' | 'passkey'>('codes');
	let titleRef = $state<HTMLHeadingElement | null>(null);

	let email = $state('');
	let saved = $state('');
	let setup = $state('');
	// The code that each error belongs to. The error goes when the person changes the code.
	let savedRefused = $state<{ code: string; message: string } | null>(null);
	let setupRefused = $state<{ code: string; message: string } | null>(null);
	// True after a submit with no address. The error goes when the person types an address.
	let noAddress = $state(false);
	let sending = false;

	const savedInvalid = $derived(savedRefused !== null && savedRefused.code === saved);
	const setupInvalid = $derived(setupRefused !== null && setupRefused.code === setup);
	const emailInvalid = $derived(noAddress && email.trim() === '');

	/** "after 14:35" for the end of a pause, or "later" when until is missing or is no valid date. */
	function after(until: string | undefined) {
		const end = new Date(until ?? NaN);
		return Number.isNaN(end.getTime()) ? 'later' : `after ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(end)}`;
	}
	const pause = (r: { until?: string }) => `Too many wrong codes. Try again ${after(r.until)}`;
	/** The error of a code function that rejects, such as when the server cannot be reached. */
	const FAILED = () => 'This app could not check the code. Choose Continue to try again.';
	const SAVED: Record<'code-wrong' | 'paused' | 'paused-100' | 'failed', (r: { until?: string }) => string> = {
		'code-wrong': () => 'This recovery code is not right for this address. Check the address and the 16 characters.',
		paused: (r) => `${pause(r)}, or ask an administrator of your workspace for a setup link or a setup code.`,
		'paused-100': () => 'This recovery code works no more. Ask an administrator of your workspace for a setup link or a setup code.',
		failed: FAILED
	};
	const SETUP: Record<'setup-wrong' | 'setup-used' | 'paused' | 'failed', (r: { until?: string }) => string> = {
		'setup-wrong': () => 'This setup code is not right. Check the 26 characters with the administrator.',
		'setup-used': () => 'This setup code works no more. Ask the administrator for a new code.',
		paused: (r) => `${pause(r)}.`,
		failed: FAILED
	};

	/** Runs a code check of the product, then shows the step that makes a passkey. A rejection is the state failed. */
	async function check<S extends string>(run: () => Promise<{ ok: true } | Refused<S>>, refuse: (r: Refused<S | 'failed'>) => void) {
		sending = true;
		const result = await run()
			.catch((): Refused<'failed'> => ({ ok: false, state: 'failed' }))
			.finally(() => (sending = false));
		if (!result.ok) return refuse(result);
		step = 'passkey';
		await tick();
		titleRef?.focus();
	}

	async function submitSaved(e: SubmitEvent) {
		e.preventDefault();
		if (sending) return;
		setupRefused = null;
		noAddress = email.trim() === '';
		const sent = saved;
		// With no address the server cannot check the code, so only a short code shows its error.
		if (pasteCode(sent).length < 16) savedRefused = { code: sent, message: 'Type the 16 characters.' };
		else if (noAddress) savedRefused = null;
		else await check(() => recoveryCode(email.trim(), sent), (r) => (savedRefused = { code: sent, message: SAVED[r.state](r) }));
	}

	async function submitSetup(e: SubmitEvent) {
		e.preventDefault();
		if (sending) return;
		noAddress = false;
		savedRefused = null;
		const sent = setup;
		if (pasteCode(sent).length < 26) setupRefused = { code: sent, message: 'Type the 26 characters.' };
		else await check(() => setupCode(sent), (r) => (setupRefused = { code: sent, message: SETUP[r.state](r) }));
	}
</script>

{#if step === 'codes'}
	<OutsidePage
		bind:ref
		bind:titleRef
		{product}
		title="Use a recovery code"
		text="Use the recovery code that you saved when you made your passkey. When an administrator gives you a setup code by phone, type it in the second field."
		data-slot="recovery-page"
		class={cn(className)}
		{...rest}
	>
		<form method="post" {action} class="flex max-w-96 flex-col gap-6" novalidate onsubmit={submitSaved}>
			<Field.Field data-invalid={emailInvalid || undefined}>
				<Field.Label for="{uid}-email">Email address</Field.Label>
				<Input
					id="{uid}-email"
					name="email"
					type="email"
					autocomplete="username"
					aria-invalid={emailInvalid || undefined}
					aria-describedby={emailInvalid ? `${uid}-email-error` : undefined}
					bind:value={email}
				/>
				{#if emailInvalid}
					<Field.Error id="{uid}-email-error">Type the email address of your account.</Field.Error>
				{/if}
			</Field.Field>
			<Field.Field data-invalid={savedInvalid || undefined}>
				<Field.Label for="{uid}-code">Recovery code</Field.Label>
				<Input
					id="{uid}-code"
					name="code"
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
					aria-invalid={savedInvalid || undefined}
					aria-describedby={savedInvalid ? `${uid}-code-help ${uid}-code-error` : `${uid}-code-help`}
					bind:value={saved}
				/>
				<Field.Description id="{uid}-code-help">The code has 16 characters. You saved it when you made your passkey.</Field.Description>
				{#if savedInvalid && savedRefused}
					<Field.Error id="{uid}-code-error">{savedRefused.message}</Field.Error>
				{/if}
			</Field.Field>
			<Button type="submit" class="self-start max-md:w-full">Continue</Button>
		</form>

		<form method="post" {action} class="flex max-w-96 flex-col gap-6" novalidate onsubmit={submitSetup}>
			<Field.Separator>or</Field.Separator>
			<Field.Field data-invalid={setupInvalid || undefined}>
				<Field.Label for="{uid}-setup">Setup code from an administrator</Field.Label>
				<Input
					id="{uid}-setup"
					name="setup"
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
					aria-invalid={setupInvalid || undefined}
					aria-describedby={setupInvalid ? `${uid}-setup-help ${uid}-setup-error` : `${uid}-setup-help`}
					bind:value={setup}
				/>
				<Field.Description id="{uid}-setup-help">An administrator reads you this code by phone. It has 26 characters.</Field.Description>
				{#if setupInvalid && setupRefused}
					<Field.Error id="{uid}-setup-error">{setupRefused.message}</Field.Error>
				{/if}
			</Field.Field>
			<Button type="submit" variant="outline" class="self-start max-md:w-full">Continue</Button>
		</form>
	</OutsidePage>
{:else}
	<SetupLinkPage
		bind:ref
		bind:titleRef
		{product}
		title="Make a passkey on this device"
		{addPasskey}
		{notNow}
		{ondone}
		data-slot="recovery-page"
		class={cn(className)}
		{...rest}
	/>
{/if}
