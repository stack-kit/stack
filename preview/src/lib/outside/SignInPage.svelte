<script lang="ts" module>
	import type { Done, OutsideRoot, Passkey, Refused } from './OutsidePage.svelte';

	export type SignInPageProps = OutsideRoot & {
		/** "Sign in with a passkey": the browser shows its passkey sheet, and the server checks the passkey. */
		passkey: Passkey;
		/** "Create a passkey" in the step "Make a passkey on this device", which follows a right code. */
		addPasskey: Passkey;
		/** Checks the email address of the account and the code from another device. */
		deviceCode: (email: string, code: string) => Promise<{ ok: true } | Refused<'code-wrong' | 'code-expired'>>;
		/** Checks the email address and the 6 digits of an authenticator app. With none, the page offers no authenticator app. */
		appCode?: (email: string, code: string) => Promise<{ ok: true } | Refused<'app-wrong' | 'app-used' | 'app-paused' | 'app-paused-100'>>;
		/** The person is in: after a passkey, a new passkey or Not now. The product goes on. */
		ondone: Done;
		/** The address of the recovery page of the product. */
		links: { recovery: string };
		/** The address that the code form posts to with no script. With none, the form posts to the address of the page. */
		action?: string;
		/** The description under the code from another device: where that device shows the code. */
		codeHelp?: string;
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { building } from '$app/env';
	import { page } from '$app/state';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { cn } from '#lib/utils.js';
	import CodeInput from './CodeInput.svelte';
	import OutsidePage from './OutsidePage.svelte';
	import StateLine from './StateLine.svelte';

	// The sign-in page of "Sign-in page" in DESIGN.md: a passkey, or the address of the account and the
	// code of a device that is signed in. A right code leads to the step "Make a passkey on this
	// device". Continue always submits: an empty address and a short code each show a field error, and
	// the product function answers each full code. An error goes when the person changes the code.
	// A disabled button loses the focus to <body>, so the end of Waiting puts the focus back on the
	// button, and a new step puts it on the title.
	// With appCode, the address parameter method=app shows the form of an authenticator app in the
	// place of the form of the code from another device. The link to each form is a plain link, so it
	// works with no script. The address is read only behind building, so a prerendered page shows the
	// first form.
	let {
		product,
		passkey,
		addPasskey,
		deviceCode,
		appCode,
		ondone,
		links,
		action,
		codeHelp = 'On a device where you are signed in, open the settings of your account and show a code for a new device. Type the 8 characters that it shows.',
		class: className,
		ref = $bindable(null),
		...rest
	}: SignInPageProps = $props();

	const uid = $props.id();
	/** sign-in: the passkey and the code. passkey: the step "Make a passkey on this device". */
	let step = $state<'sign-in' | 'passkey'>('sign-in');
	let passkeyState = $state<'ready' | 'waiting' | 'failed' | 'cancelled'>('ready');
	let button = $state<HTMLElement | null>(null);
	let titleRef = $state<HTMLHeadingElement | null>(null);

	const app = $derived(appCode !== undefined && !building && page.url.searchParams.get('method') === 'app');
	/** The address of this page with the other code form. */
	function formHref(toApp: boolean) {
		if (building) return toApp ? '?method=app' : '?';
		const url = new URL(page.url.href);
		if (toApp) url.searchParams.set('method', 'app');
		else url.searchParams.delete('method');
		// Only the query, so that a path that starts with // can never give a link to another host.
		return url.search || '?';
	}

	let email = $state('');
	let code = $state('');
	// The code that the error belongs to. The error goes when the person changes the code.
	let refused = $state<{ code: string; message: string } | null>(null);
	// True after a submit with no address. The error goes when the person types an address.
	let noAddress = $state(false);
	let sending = false;
	// The other form starts with no code and no error.
	$effect.pre(() => {
		void app;
		code = '';
		refused = null;
	});

	const waiting = $derived(passkeyState === 'waiting');
	const invalid = $derived(refused !== null && refused.code === code);
	const emailInvalid = $derived(noAddress && email.trim() === '');
	/** The other way in that the lines of the passkey name. */
	const otherWay = $derived(app ? 'use a code from your authenticator app' : 'use a code from another device');
	const line = $derived.by(() => {
		if (passkeyState === 'ready') return undefined;
		const signIn = step === 'sign-in';
		if (passkeyState === 'waiting') return { kind: 'wait' as const, text: signIn ? 'Choose a passkey in the window of your browser.' : 'Follow the steps in the window of your browser.' };
		if (passkeyState === 'failed')
			return {
				kind: 'fail' as const,
				text: signIn
					? `This app does not know that passkey. Choose the passkey that you made here, or ${otherWay}.`
					: 'This app could not save the passkey. Choose Create a passkey to try again, or choose Not now.'
			};
		return {
			kind: 'cancel' as const,
			text: signIn ? `No passkey was chosen. Choose Sign in with a passkey to try again, or ${otherWay}.` : 'No passkey was made. Choose Create a passkey to try again, or choose Not now.'
		};
	});

	/** "after 14:35" for the end of a pause, or "later" when until is missing or is no valid date. */
	function after(until: string | undefined) {
		const end = new Date(until ?? NaN);
		return Number.isNaN(end.getTime()) ? 'later' : `after ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(end)}`;
	}
	/** The states of a code: the refusals of deviceCode and appCode, and failed, when a function rejects. */
	type CodeState = 'code-wrong' | 'code-expired' | 'app-wrong' | 'app-used' | 'app-paused' | 'app-paused-100' | 'failed';
	const WRONG = 'This code is not right for this address. Check the address and the 8 characters on the other device.';
	const APP_WRONG = 'This code is not right for this address. Check the address and the 6 digits in your authenticator app.';
	function refusal(r: Refused<CodeState>): string {
		switch (r.state) {
			case 'code-wrong':
				return WRONG;
			case 'code-expired':
				return 'This code has run out. Ask the other device for a new code.';
			case 'app-wrong':
				return APP_WRONG;
			case 'app-used':
				return 'This code was used already. Wait for the next code in your authenticator app. If you did not sign in with it a moment ago, sign in with a passkey and check the security page.';
			case 'app-paused':
				return `Too many wrong codes. Try again ${after(r.until)}, or sign in with a passkey.`;
			case 'app-paused-100':
				return 'This authenticator app works no more. Sign in with a passkey or use a recovery code, then add the authenticator app again.';
			case 'failed':
				return 'This app could not check the code. Choose Continue to try again.';
		}
	}

	async function runPasskey(run: Passkey) {
		passkeyState = 'waiting';
		const result = await run().catch((): Refused<'failed'> => ({ ok: false, state: 'failed' }));
		if (result.ok) {
			try {
				await ondone();
			} finally {
				passkeyState = 'ready';
			}
			return;
		}
		passkeyState = result.state;
		await tick();
		button?.focus();
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (sending) return;
		noAddress = email.trim() === '';
		const sent = code;
		if (sent.length < (app ? 6 : 8)) {
			refused = { code: sent, message: app ? 'Type the 6 digits.' : 'Type the 8 characters.' };
			return;
		}
		// With no address the server cannot check the code, so only a short code shows its error.
		refused = null;
		if (noAddress) return;
		sending = true;
		const answer: Promise<{ ok: true } | Refused<CodeState>> = app && appCode ? appCode(email.trim(), sent) : deviceCode(email.trim(), sent);
		const result = await answer.catch((): Refused<'failed'> => ({ ok: false, state: 'failed' })).finally(() => (sending = false));
		if (!result.ok) {
			refused = { code: sent, message: refusal(result) };
			return;
		}
		step = 'passkey';
		passkeyState = 'ready';
		await tick();
		titleRef?.focus();
	}
</script>

<OutsidePage
	bind:ref
	bind:titleRef
	{product}
	title={step === 'sign-in' ? `Sign in to ${product.name}` : 'Make a passkey on this device'}
	tab="Sign in"
	text={step === 'sign-in'
		? 'Use the passkey that you made for this app.'
		: 'With a passkey here, this device signs in with no code next time. On a computer that you borrowed, choose Not now: you then stay signed in for this session only.'}
	noscript={step === 'sign-in' ? `A passkey needs JavaScript. Turn on JavaScript, or ${otherWay}.` : undefined}
	data-slot="sign-in-page"
	class={cn(className)}
	{...rest}
>
	{#if step === 'sign-in'}
		<div class="flex max-w-96 flex-col">
			<Button
				bind:ref={button}
				data-needs-js
				class="self-start max-md:w-full"
				disabled={waiting}
				aria-busy={waiting || undefined}
				data-loading={waiting || undefined}
				onclick={() => runPasskey(passkey)}
			>
				{#if waiting}<Spinner data-icon="inline-start" aria-label="Waiting for a passkey" />{:else}<KeyRoundIcon data-icon="inline-start" />{/if}Sign in with a passkey
			</Button>
			<StateLine kind={line?.kind} text={line?.text} />
		</div>

		<form method="post" {action} class="flex max-w-96 flex-col gap-6" novalidate onsubmit={submit}>
			<Field.Separator>or</Field.Separator>
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
			<Field.Field data-invalid={invalid || undefined}>
				<Field.Label for="{uid}-code">{app ? 'Code from your authenticator app' : 'Code from another device'}</Field.Label>
				<div class="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
					<CodeInput
						kind={app ? 'app' : 'device'}
						inputId="{uid}-code"
						name="code"
						{invalid}
						aria-describedby={invalid ? `${uid}-code-help ${uid}-code-error` : `${uid}-code-help`}
						bind:value={code}
					/>
					<!-- An invalid field turns its text destructive, and the button keeps its own text color. -->
					<Button type="submit" variant="outline" class="text-foreground">Continue</Button>
				</div>
				<Field.Description id="{uid}-code-help">
					{app ? `Open the authenticator app on your phone and type the 6 digits that it shows for ${product.name}.` : codeHelp}
				</Field.Description>
				{#if invalid && refused}
					<Field.Error id="{uid}-code-error">{refused.message}</Field.Error>
				{/if}
			</Field.Field>
		</form>

		<!-- With no side padding, the text of each link keeps the left edge of the column. The first link opens the other
		     code form, and the links stack with no space between them. -->
		<div class="flex flex-col items-start">
			{#if appCode}
				{#if app}
					<Button variant="link" href={formHref(false)} class="px-0">Use a code from another device</Button>
				{:else}
					<Button variant="link" href={formHref(true)} class="px-0">Use a code from an authenticator app</Button>
				{/if}
			{/if}
			<Button variant="link" href={links.recovery} class="px-0">Use a recovery code</Button>
		</div>
	{:else}
		<div class="flex flex-col">
			<div class="flex gap-2 max-md:flex-col">
				<Button
					bind:ref={button}
					data-needs-js
					class="max-md:w-full"
					disabled={waiting}
					aria-busy={waiting || undefined}
					data-loading={waiting || undefined}
					onclick={() => runPasskey(addPasskey)}
				>
					{#if waiting}<Spinner data-icon="inline-start" aria-label="Making a passkey" />{:else}<KeyRoundIcon data-icon="inline-start" />{/if}Create a passkey
				</Button>
				<Button variant="outline" class="max-md:w-full" onclick={() => ondone()}>Not now</Button>
			</div>
			<StateLine kind={line?.kind} text={line?.text} />
		</div>
	{/if}
</OutsidePage>
