<script lang="ts">
	import type { ToasterProps as SonnerProps } from "svelte-sonner";
	import StackToaster from "./stack-toaster.svelte";

	// STACK changed this registry file ("### sonner" in DESIGN.md). The Toaster of the registry, with the
	// bar of Close all and "+N more", is in stack-toaster.svelte, a file of STACK in this folder. A product
	// passes the words of the bar in its own language.
	interface ToasterProps extends SonnerProps {
		/** The label of the button that ends every toast. */
		closeAllLabel?: string;
		/** The label of the button that opens the list, for n hidden toasts. */
		moreLabel?: (n: number) => string;
	}
	let { closeAllLabel = "Close all", moreLabel = (n: number) => `+${n} more`, ...restProps }: ToasterProps = $props();
</script>

<StackToaster {...restProps} {closeAllLabel} {moreLabel} />
