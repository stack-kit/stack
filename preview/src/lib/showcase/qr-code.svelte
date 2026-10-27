<script lang="ts">
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as InputOTP from '#lib/components/ui/input-otp/index.js';
	import QrCode, { qrSymbol } from '#lib/stack/QrCode.svelte';

	// The codes of a back office that pairs devices. STACK invented every address, key and desk.
	// Below 768 px the value of each part comes first, because a phone cannot scan its own screen.
	const link = 'https://app.example.com/pair/7KQ2-M9XD';
	const key = 'DEV-7KQ2-M9XD-4F1B-H2RA';
	const dense = 'https://app.example.com/devices/pair?token=7kq2m9xd4f1bh2ra7kq2m9xd4f1bh2ra&site=belgrade-central&desk=2&ttl=1800';
	const tooLong = `${dense}&lang=sr-Latn`;
	// The setup of an authenticator app ("### Authenticator app" in architecture/web-app.md): the code holds the
	// otpauth:// address, and the code block holds the setup key in groups of four, which the button copies with no space.
	const setupKey = 'KCPUHMFI7RHFYPAE6R26WPKAR4XFO4OC';
	const otpauth = `otpauth://totp/Product:${encodeURIComponent('ana@example.org')}?secret=${setupKey}&issuer=Product`;
	const groups = (key: string) => key.replace(/(.{4})(?=.)/g, '$1 ');
	/** The focus ring of the active cell, from the input-otp definition of DESIGN.md. */
	const slot = 'data-active:z-10 data-active:border-ring data-active:ring-3 data-active:ring-ring/50';
	const bytes = (s: string) => new TextEncoder().encode(s).length;
	/** The facts of a code in words, for the caption of its example. */
	const facts = (s: string) => {
		const q = qrSymbol(s);
		return q ? `${bytes(s)} bytes: version ${q.version}, modules of ${q.module} px` : `${bytes(s)} bytes: too long for the tile`;
	};
	const caption = 'text-xs font-semibold text-muted-foreground';
</script>

<section id="showcase-qr-code" data-showcase="qr-code" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">qr-code</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		A code that a phone scans from the screen, dark on a light tile in both modes, with its value beside it in a code block. The part reads its own box:
		from 512 px the value stands beside the code, and below 512 px under it. Below 768 px the value comes first.
	</p>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>A link that a phone opens · {facts(link)}</h3>
		<QrCode value={link} kind="link" label="QR code of the link that pairs a phone" valueLabel="Pairing link" copyLabel="Copy the pairing link">
			<p class="text-sm">Scan the code with the camera of the phone. On the phone itself, open the link.</p>
		</QrCode>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>A key that an app on the phone reads · {facts(key)}</h3>
		<QrCode value={key} label="QR code of the key of scanner 2" valueLabel="Key of scanner 2" copyLabel="Copy the key of scanner 2" />
	</div>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>The setup of an authenticator app: the address in the code, the setup key beside it · {facts(otpauth)}</h3>
		<div class="flex max-w-160 flex-col gap-6">
			<QrCode value={otpauth} label="QR code of the setup key" valueLabel="Setup key" text={groups(setupKey)} copyValue={setupKey} copyLabel="Copy the setup key">
				<p class="text-sm">Scan this code with the authenticator app on your phone, or type the setup key into it.</p>
			</QrCode>
			<Field.Field>
				<Field.Label for="setup-app-code">Code from your authenticator app</Field.Label>
				<div class="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
					<InputOTP.Root
						inputId="setup-app-code"
						maxlength={6}
						pattern={REGEXP_ONLY_DIGITS}
						pasteTransformer={(text) => text.replace(/[\s-]/g, '')}
						class="tabular-nums"
						aria-describedby="setup-app-code-help"
					>
						{#snippet children({ cells })}
							<InputOTP.Group aria-hidden="true">
								{#each cells.slice(0, 3) as cell, i (i)}
									<InputOTP.Slot {cell} class={slot} />
								{/each}
							</InputOTP.Group>
							<InputOTP.Separator aria-hidden="true" />
							<InputOTP.Group aria-hidden="true">
								{#each cells.slice(3) as cell, i (i)}
									<InputOTP.Slot {cell} class={slot} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
					<Button>Add the authenticator app</Button>
				</div>
				<Field.Description id="setup-app-code-help">Type the 6 digits that the authenticator app shows now.</Field.Description>
			</Field.Field>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>The longest value that keeps modules of 4 px · {facts(dense)}</h3>
		<QrCode value={dense} kind="link" label="QR code of the link that pairs scanner 2 at desk 2" valueLabel="Pairing link of desk 2" copyLabel="Copy the pairing link of desk 2" />
	</div>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>In a box of 420 px, such as a pane: from 768 px the value stands under the code</h3>
		<div class="w-full max-w-105 rounded-lg border border-border p-4 print:max-w-none">
			<QrCode value={link} kind="link" label="QR code of the link that pairs a phone" valueLabel="Pairing link" copyLabel="Copy the pairing link" />
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>Loading</h3>
		<QrCode value="" loading label="QR code of the link that pairs a phone" valueLabel="Pairing link" />
	</div>

	<div class="flex flex-col gap-2">
		<h3 class={caption}>A value too long for the tile · {facts(tooLong)}</h3>
		<QrCode value={tooLong} kind="link" label="QR code of the link that pairs scanner 2 at desk 2" valueLabel="Pairing link of desk 2" copyLabel="Copy the pairing link of desk 2" />
	</div>
</section>
