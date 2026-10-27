<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import OutsidePage from './OutsidePage.svelte';
	import { RECOVERY_CODES, SAMPLE_ADDRESS, codeLength, type RecoveryState } from './data.js';

	// The recovery page in the states of "Recovery page" in DESIGN.md: two forms, one for each code. The first
	// takes the email address of the account and the saved recovery code. The second takes the setup code that an
	// administrator reads by phone, and it needs no address. The address of the page forces the first state.
	// Each Continue always submits: an empty address and a short code each show a field error. The preview has no
	// server, so a full code shows Code wrong or Setup code wrong. An error goes when the person changes its code,
	// and the errors of one form go when the person submits the other form.
	let { initial }: { initial: RecoveryState } = $props();

	const WRONG = 'This recovery code is not right for this address. Check the address and the 16 characters.';
	const SETUP_WRONG = 'This setup code is not right. Check the 26 characters with the administrator.';
	const SAVED_ERRORS: Partial<Record<RecoveryState, string>> = {
		'code-wrong': WRONG,
		paused: 'Too many wrong codes. Try again after 14:35, or ask an administrator of your workspace for a setup link or a setup code.',
		'paused-100': 'This recovery code works no more. Ask an administrator of your workspace for a setup link or a setup code.'
	};
	const SETUP_ERRORS: Partial<Record<RecoveryState, string>> = {
		'setup-wrong': SETUP_WRONG,
		'setup-used': 'This setup code works no more. Ask the administrator for a new code.'
	};

	// The address sets the first state; the buttons change it after that.
	// svelte-ignore state_referenced_locally
	const savedError = SAVED_ERRORS[initial];
	// svelte-ignore state_referenced_locally
	const setupError = SETUP_ERRORS[initial];
	let email = $state<string>(savedError ? SAMPLE_ADDRESS : '');
	let saved = $state<string>(savedError ? RECOVERY_CODES.saved : '');
	let setup = $state<string>(setupError ? RECOVERY_CODES.setup : '');
	// The code that each error belongs to. The error goes when the person changes the code.
	let savedRefused = $state<{ code: string; message: string } | null>(
		savedError ? { code: RECOVERY_CODES.saved, message: savedError } : null
	);
	let setupRefused = $state<{ code: string; message: string } | null>(
		setupError ? { code: RECOVERY_CODES.setup, message: setupError } : null
	);
	// True after a submit with no address. The error goes when the person types an address.
	let noAddress = $state(false);

	const savedInvalid = $derived(savedRefused !== null && savedRefused.code === saved);
	const setupInvalid = $derived(setupRefused !== null && setupRefused.code === setup);
	const emailInvalid = $derived(noAddress && email.trim() === '');
	const title = 'Use a recovery code';

	function submitSaved(e: SubmitEvent) {
		e.preventDefault();
		setupRefused = null;
		noAddress = email.trim() === '';
		// With no address the server cannot check the code, so only a short code shows its error.
		savedRefused =
			codeLength(saved) < 16 ? { code: saved, message: 'Type the 16 characters.' } : noAddress ? null : { code: saved, message: WRONG };
	}

	function submitSetup(e: SubmitEvent) {
		e.preventDefault();
		noAddress = false;
		savedRefused = null;
		setupRefused = { code: setup, message: codeLength(setup) < 26 ? 'Type the 26 characters.' : SETUP_WRONG };
	}
</script>

<OutsidePage {title}>
	<div class="flex flex-col gap-2">
		<h1 class="text-xl font-semibold">{title}</h1>
		<p class="text-sm text-muted-foreground">
			Use the recovery code that you saved when you made your passkey. When an administrator gives you a setup code by phone,
			type it in the second field.
		</p>
	</div>

	<form method="post" class="flex max-w-96 flex-col gap-6" novalidate onsubmit={submitSaved}>
		<Field.Field data-invalid={emailInvalid || undefined}>
			<Field.Label for="recovery-email">Email address</Field.Label>
			<Input
				id="recovery-email"
				name="email"
				type="email"
				autocomplete="username"
				placeholder={SAMPLE_ADDRESS}
				aria-invalid={emailInvalid || undefined}
				aria-describedby={emailInvalid ? 'recovery-email-error' : undefined}
				bind:value={email}
			/>
			{#if emailInvalid}
				<Field.Error id="recovery-email-error">Type the email address of your account.</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field data-invalid={savedInvalid || undefined}>
			<Field.Label for="recovery-code">Recovery code</Field.Label>
			<Input
				id="recovery-code"
				name="code"
				autocapitalize="characters"
				spellcheck="false"
				aria-invalid={savedInvalid || undefined}
				aria-describedby={savedInvalid ? 'recovery-code-help recovery-code-error' : 'recovery-code-help'}
				bind:value={saved}
			/>
			<Field.Description id="recovery-code-help">The code has 16 characters. You saved it when you made your passkey.</Field.Description>
			{#if savedInvalid && savedRefused}
				<Field.Error id="recovery-code-error">{savedRefused.message}</Field.Error>
			{/if}
		</Field.Field>
		<Button type="submit" class="self-start max-md:w-full">Continue</Button>
	</form>

	<form method="post" class="flex max-w-96 flex-col gap-6" novalidate onsubmit={submitSetup}>
		<Field.Separator>or</Field.Separator>
		<Field.Field data-invalid={setupInvalid || undefined}>
			<Field.Label for="setup-code">Setup code from an administrator</Field.Label>
			<Input
				id="setup-code"
				name="setup"
				autocomplete="off"
				autocapitalize="characters"
				spellcheck="false"
				aria-invalid={setupInvalid || undefined}
				aria-describedby={setupInvalid ? 'setup-code-help setup-code-error' : 'setup-code-help'}
				bind:value={setup}
			/>
			<Field.Description id="setup-code-help">An administrator reads you this code by phone. It has 26 characters.</Field.Description>
			{#if setupInvalid && setupRefused}
				<Field.Error id="setup-code-error">{setupRefused.message}</Field.Error>
			{/if}
		</Field.Field>
		<Button type="submit" variant="outline" class="self-start max-md:w-full">Continue</Button>
	</form>
</OutsidePage>
