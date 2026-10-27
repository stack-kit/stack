<script lang="ts">
	import { tick } from 'svelte';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as InputOTP from '#lib/components/ui/input-otp/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import OutsidePage from './OutsidePage.svelte';
	import { APP_CODES, CODES, CODE_PATTERN, PRODUCT, SAMPLE_ADDRESS, pasteCode, readCode, viewHref, type SignInState } from './data.js';

	// The sign-in page in the states of "Sign-in page" in DESIGN.md: a passkey, or the address of
	// the account and the code of a device that is signed in. The address of the page forces the
	// first state. In the preview the passkey button runs Waiting and then Cancelled, because the
	// preview has no server and no passkey. Continue always submits: an empty address and a code of
	// fewer than 8 characters each show a field error, and so does the sample code of Code wrong.
	// The code field reads the code as Crockford base32 does, so a typed o shows as 0, and i or l
	// as 1. A paste drops the hyphen or the space between the two groups. The no-script state
	// shows what the <noscript> line shows. A disabled button loses the focus to <body>, so the end
	// of Waiting puts the focus back on the passkey button. Under the form, the link "Use a recovery
	// code" opens the recovery page.
	// The states that start with app show the form of an authenticator app in the place of the form
	// of the code from another device, as "Code from an authenticator app" in DESIGN.md says: the
	// address and 6 digits in two groups of three. A link under each form opens the other form.
	let { initial }: { initial: SignInState } = $props();

	const WRONG = 'This code is not right for this address. Check the address and the 8 characters on the other device.';
	const APP_WRONG = 'This code is not right for this address. Check the address and the 6 digits in your authenticator app.';
	/** The code and the error of each state that opens with a code that the server refused. */
	const REFUSED: Partial<Record<SignInState, { code: string; message: string }>> = {
		'code-wrong': { code: CODES.wrong, message: WRONG },
		'code-expired': { code: CODES.expired, message: 'This code has run out. Ask the other device for a new code.' },
		'app-wrong': { code: APP_CODES.wrong, message: APP_WRONG },
		'app-used': {
			code: APP_CODES.used,
			message:
				'This code was used already. Wait for the next code in your authenticator app. If you did not sign in with it a moment ago, sign in with a passkey and check the security page.'
		},
		'app-paused': { code: APP_CODES.wrong, message: 'Too many wrong codes. Try again after 14:35, or sign in with a passkey.' },
		'app-paused-100': {
			code: APP_CODES.wrong,
			message: 'This authenticator app works no more. Sign in with a passkey or use a recovery code, then add the authenticator app again.'
		}
	};

	// The address sets the first state; the buttons change it after that.
	// svelte-ignore state_referenced_locally
	let current = $state<SignInState>(initial);
	// svelte-ignore state_referenced_locally
	const start = REFUSED[initial];
	// svelte-ignore state_referenced_locally
	const app = initial.startsWith('app');
	let code = $state(start?.code ?? '');
	let email = $state<string>(start ? SAMPLE_ADDRESS : '');
	// The code that the error belongs to. The error goes when the person changes the code.
	let refused = $state<{ code: string; message: string } | null>(start ?? null);
	// True after a submit with no address. The error goes when the person types an address.
	let noAddress = $state(false);

	let passkeyButton = $state<HTMLElement | null>(null);
	const waiting = $derived(current === 'waiting');
	const noScript = $derived(current === 'no-script' || current === 'app-no-script');
	const invalid = $derived(refused !== null && refused.code === code);
	const emailInvalid = $derived(noAddress && email.trim() === '');
	const title = `Sign in to ${PRODUCT.name}`;
	/** The other way in that the lines of the passkey name. */
	const otherWay = app ? 'use a code from your authenticator app' : 'use a code from another device';
	/** The focus ring of the active cell, from the input-otp definition of DESIGN.md. */
	const slot = 'data-active:z-10 data-active:border-ring data-active:ring-3 data-active:ring-ring/50';

	async function passkey() {
		current = 'waiting';
		await new Promise((r) => setTimeout(r, 1500));
		current = 'cancelled';
		await tick();
		passkeyButton?.focus();
	}

	function submitCode(e: SubmitEvent) {
		e.preventDefault();
		noAddress = email.trim() === '';
		const length = app ? 6 : 8;
		const short = app ? 'Type the 6 digits.' : 'Type the 8 characters.';
		// With no address the server cannot check the code, so only a short code shows its error.
		refused = code.length < length ? { code, message: short } : noAddress ? null : { code, message: app ? APP_WRONG : WRONG };
	}
</script>

<OutsidePage {title} tab="Sign in">
	<div class="flex flex-col gap-2">
		<h1 class="text-xl font-semibold">{title}</h1>
		<p class="text-sm text-muted-foreground">Use the passkey that you made for this app.</p>
	</div>

	<div class="flex max-w-96 flex-col">
		{#if noScript}
			<!-- What the <noscript> line shows in the place of the passkey button. -->
			<p class="text-sm">A passkey needs JavaScript. Turn on JavaScript, or {otherWay}.</p>
		{:else}
			<Button bind:ref={passkeyButton} class="self-start max-md:w-full" disabled={waiting} aria-busy={waiting || undefined} data-loading={waiting || undefined} onclick={passkey}>
				{#if waiting}<Spinner data-icon="inline-start" aria-label="Waiting for a passkey" />{:else}<KeyRoundIcon data-icon="inline-start" />{/if}Sign in with a passkey
			</Button>
		{/if}
		<!-- The two regions are in the page from the first render, so a screen reader reads each new text. -->
		<div role="status">
			{#if waiting}
				<p class="mt-2 text-xs text-muted-foreground">Choose a passkey in the window of your browser.</p>
			{:else if current === 'cancelled'}
				<p class="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
					<InfoIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<span>No passkey was chosen. Choose Sign in with a passkey to try again, or {otherWay}.</span>
				</p>
			{/if}
		</div>
		<div role="alert">
			{#if current === 'failed'}
				<p class="mt-2 flex items-start gap-2 text-sm text-destructive">
					<CircleXIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
					<span>This app does not know that passkey. Choose the passkey that you made here, or {otherWay}.</span>
				</p>
			{/if}
		</div>
	</div>

	<form method="post" class="flex max-w-96 flex-col gap-6" novalidate onsubmit={submitCode}>
		<Field.Separator>or</Field.Separator>
		<Field.Field data-invalid={emailInvalid || undefined}>
			<Field.Label for="device-email">Email address</Field.Label>
			<Input
				id="device-email"
				name="email"
				type="email"
				autocomplete="username"
				placeholder={SAMPLE_ADDRESS}
				aria-invalid={emailInvalid || undefined}
				aria-describedby={emailInvalid ? 'device-email-error' : undefined}
				bind:value={email}
			/>
			{#if emailInvalid}
				<Field.Error id="device-email-error">Type the email address of your account.</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field data-invalid={invalid || undefined}>
			{#if app}
				<Field.Label for="app-code">Code from your authenticator app</Field.Label>
				<div class="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
					<!-- 6 digits in two groups of three. The default inputmode is numeric, so a phone shows the number keys. -->
					<InputOTP.Root
						inputId="app-code"
						name="code"
						maxlength={6}
						pattern={REGEXP_ONLY_DIGITS}
						pasteTransformer={pasteCode}
						class="tabular-nums"
						aria-invalid={invalid || undefined}
						aria-describedby={invalid ? 'app-code-help app-code-error' : 'app-code-help'}
						bind:value={code}
					>
						{#snippet children({ cells })}
							<InputOTP.Group aria-hidden="true">
								{#each cells.slice(0, 3) as cell, i (i)}
									<InputOTP.Slot {cell} class={slot} aria-invalid={invalid || undefined} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator aria-hidden="true" />
							<InputOTP.Group aria-hidden="true">
								{#each cells.slice(3) as cell, i (i)}
									<InputOTP.Slot {cell} class={slot} aria-invalid={invalid || undefined} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
					<Button type="submit" variant="outline" class="text-foreground">Continue</Button>
				</div>
				<Field.Description id="app-code-help">
					Open the authenticator app on your phone and type the 6 digits that it shows for {PRODUCT.name}.
				</Field.Description>
				{#if invalid && refused}
					<Field.Error id="app-code-error">{refused.message}</Field.Error>
				{/if}
			{:else}
				<Field.Label for="device-code">Code from another device</Field.Label>
				<div class="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
					<!-- inputId names the hidden input, which the label points to; an id would go to the box. -->
					<InputOTP.Root
						inputId="device-code"
						name="code"
						maxlength={8}
						pattern={CODE_PATTERN}
						inputmode="text"
						autocapitalize="characters"
						pasteTransformer={pasteCode}
						class="tabular-nums"
						aria-invalid={invalid || undefined}
						aria-describedby={invalid ? 'device-code-help device-code-error' : 'device-code-help'}
						bind:value={() => code, (v) => (code = readCode(v))}
					>
						{#snippet children({ cells })}
							<InputOTP.Group aria-hidden="true">
								{#each cells.slice(0, 4) as cell, i (i)}
									<InputOTP.Slot {cell} class={slot} aria-invalid={invalid || undefined} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator aria-hidden="true" />
							<InputOTP.Group aria-hidden="true">
								{#each cells.slice(4) as cell, i (i)}
									<InputOTP.Slot {cell} class={slot} aria-invalid={invalid || undefined} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
					<!-- An invalid field turns its text destructive, and the button keeps its own text color. -->
					<Button type="submit" variant="outline" class="text-foreground">Continue</Button>
				</div>
				<Field.Description id="device-code-help">
					On a device where you are signed in, open Settings, then Devices, and choose Add a device. Type the 8 characters that it shows.
				</Field.Description>
				{#if invalid && refused}
					<Field.Error id="device-code-error">{refused.message}</Field.Error>
				{/if}
			{/if}
		</Field.Field>
	</form>

	<!-- With no side padding, the text of each link keeps the left edge of the column. The first link opens the other
	     code form, and the links stack with no space between them. -->
	<div class="flex flex-col items-start">
		{#if app}
			<Button variant="link" href={viewHref('sign-in', 'ready')} class="px-0">Use a code from another device</Button>
		{:else}
			<Button variant="link" href={viewHref('sign-in', 'app')} class="px-0">Use a code from an authenticator app</Button>
		{/if}
		<Button variant="link" href={viewHref('recovery', 'ready')} class="px-0">Use a recovery code</Button>
	</div>
</OutsidePage>
