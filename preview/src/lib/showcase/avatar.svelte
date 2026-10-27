<script lang="ts">
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';

	const sizes = ['sm', 'default', 'lg'] as const;
	// A local picture, so that the image state needs no network.
	const photo =
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#8a8f98"/><circle cx="20" cy="16" r="7" fill="#d9dce1"/><rect x="8" y="26" width="24" height="16" rx="8" fill="#d9dce1"/></svg>'
		);
</script>

<section id="showcase-avatar" data-showcase="avatar" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">avatar</h2>
	{#each sizes as size (size)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">size {size}</h3>
			<div class="flex flex-wrap items-center gap-4">
				<Avatar.Root {size}><Avatar.Image src={photo} alt="Ana" /><Avatar.Fallback>AN</Avatar.Fallback></Avatar.Root>
				<Avatar.Root {size}><Avatar.Fallback>BK</Avatar.Fallback></Avatar.Root>
				<Avatar.Root {size}><Avatar.Fallback>CD</Avatar.Fallback><Avatar.Badge /></Avatar.Root>
				<Avatar.Root {size}><Avatar.Fallback>EF</Avatar.Fallback><Avatar.Badge><CheckIcon /></Avatar.Badge></Avatar.Root>
				<Avatar.Group>
					<Avatar.Root {size}><Avatar.Image src={photo} alt="Ana" /><Avatar.Fallback>AN</Avatar.Fallback></Avatar.Root>
					<Avatar.Root {size}><Avatar.Fallback>BK</Avatar.Fallback></Avatar.Root>
					<Avatar.Root {size}><Avatar.Fallback>CD</Avatar.Fallback></Avatar.Root>
					<Avatar.GroupCount>+4</Avatar.GroupCount>
				</Avatar.Group>
			</div>
		</div>
	{/each}
	<!-- The 20 px size has no value of the size prop. It is size sm, and each class names the same
	     variant as the class of the component that it replaces, so that cn drops the 24 px value. -->
	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-medium text-muted-foreground">size xs (size sm with the classes of the 20 px size)</h3>
		<div class="flex flex-wrap items-center gap-4">
			<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Image src={photo} alt="Ana" /><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">A</Avatar.Fallback></Avatar.Root>
			<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">B</Avatar.Fallback></Avatar.Root>
			<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">C</Avatar.Fallback><Avatar.Badge class="group-data-[size=sm]/avatar:size-1.5" /></Avatar.Root>
			<Avatar.Group class="-space-x-1.5">
				<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Image src={photo} alt="Ana" /><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">A</Avatar.Fallback></Avatar.Root>
				<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">B</Avatar.Fallback></Avatar.Root>
				<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">C</Avatar.Fallback></Avatar.Root>
				<Avatar.GroupCount class="group-has-data-[size=sm]/avatar-group:size-5 text-2xs font-medium">+4</Avatar.GroupCount>
			</Avatar.Group>
		</div>
		<p class="flex items-center gap-1.5 text-sm">
			<Avatar.Root size="sm" class="data-[size=sm]:size-5"><Avatar.Fallback class="group-data-[size=sm]/avatar:text-2xs font-medium">A</Avatar.Fallback></Avatar.Root>
			<span><span class="font-medium">Ana</span> <span class="text-muted-foreground">changed the due date</span></span>
		</p>
	</div>
</section>
