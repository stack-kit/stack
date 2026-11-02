<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { SvelteSet } from 'svelte/reactivity';

	/** A row of a tree. The rows come in tree order: a parent row, then its child rows, then its next sibling. */
	export type TreeRow = { id: string; parent?: string; name: string; note?: string };

	/** A tree holds at most three levels. */
	export const TREE_DEPTH = 3;

	export type TableTreeProps<T extends TreeRow> = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** The root element of the part: the box of the table. */
		ref?: HTMLDivElement | null;
		rows: T[];
		/** The ids of the folded parent rows. */
		folded: SvelteSet<string>;
		caption?: string;
		/** The cells of the header row, the head of the name column too. */
		head: Snippet;
		/** The cells before the name cell, such as the check box of the selection. */
		start?: Snippet<[T]>;
		/** The cells after the name cell. */
		cells: Snippet<[T]>;
		selected?: (row: T) => boolean;
		/** A class for the table. */
		class?: string;
	};
</script>

<script lang="ts" generics="T extends TreeRow">
	import * as Table from '#lib/components/ui/table/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn } from '#lib/utils.js';

	// The tree of ### table. It stays a table and takes no treegrid role, so Tab moves through its
	// controls, and a screen reader reads each cell with the head of its column and of its row.
	// - Each row at level 1 starts a Table.Body of its own, as a group row does, and its name cell
	//   takes scope="rowgroup". Every other name cell takes scope="row".
	// - A row at level 1 and each row with child rows is a parent row: muted at 50%, the name at 600.
	// - A parent row with child rows holds the fold button: the chevron and the name, with
	//   aria-expanded and aria-controls. Its ::after adds 10 px above and below it and 8 px at each
	//   side, so the target is 40 px high. The cell takes no position: a positioned cell paints the
	//   ground of its row over the line between two rows.
	//   A folded parent row hides each row under it, and the rows keep their own fold.
	// - Below 768 px each name cell is 44 px high, the fold button adds 12 px above and below it,
	//   and the class of Table.Root gives each box a target of 44 by 44 px, as Touch targets asks.
	//   A first cell with a box takes 14 px at its start, so the container does not clip the target.
	//   The header row is 44 px high too, so the container does not clip the target of a box in it
	//   at its top, and the box of the first row does not cover it.
	// - A <div> is the root of the part: it takes the class, the other attributes and ref, and its
	//   data-slot is table-tree. It holds the scroll box of Table.Root, so the <table> keeps its
	//   data-slot table.
	// - Each level adds 24 px of indent. A row with no child rows adds 24 px more, the chevron and its
	//   gap, so that its name stands under the names of its siblings.
	let {
		rows,
		folded,
		caption,
		head,
		start,
		cells,
		selected,
		class: className,
		ref = $bindable(null),
		...rest
	}: TableTreeProps<T> = $props();

	const uid = $props.id();
	const rowId = (id: string) => `${uid}-row-${id}`;
	// The padding at the start of the name cell: 8 px, then 24 px (spacing.space-6) for each step.
	const INDENT = ['pl-2', 'pl-8', 'pl-14', 'pl-20'];

	const tree = $derived.by(() => {
		const parent = new Map<string, string | undefined>();
		const level = new Map<string, number>();
		const kids = new Map<string, string[]>();
		const groups: T[][] = [];
		for (const r of rows) {
			if (level.has(r.id)) throw new Error(`TableTree: the id "${r.id}" stands on two rows.`);
			if (r.parent !== undefined && !level.has(r.parent)) {
				throw new Error(`TableTree: the row "${r.id}" comes before its parent row "${r.parent}". Give the rows in tree order.`);
			}
			const l = r.parent === undefined ? 1 : level.get(r.parent)! + 1;
			if (l > TREE_DEPTH) throw new Error(`TableTree: the row "${r.id}" is at level ${l}. A tree holds at most ${TREE_DEPTH} levels.`);
			if (l > 1) {
				let top = r.parent!;
				while (parent.get(top) !== undefined) top = parent.get(top)!;
				if (groups.at(-1)?.[0]!.id !== top) {
					throw new Error(`TableTree: the row "${r.id}" stands apart from the rows of "${top}". Give the rows in tree order.`);
				}
			}
			parent.set(r.id, r.parent);
			level.set(r.id, l);
			if (r.parent !== undefined) kids.set(r.parent, [...(kids.get(r.parent) ?? []), r.id]);
			if (l === 1) groups.push([r]);
			else groups.at(-1)!.push(r);
		}
		return { parent, level, kids, groups };
	});

	/** True when no parent row above the row is folded. */
	function shown(id: string): boolean {
		for (let p = tree.parent.get(id); p !== undefined; p = tree.parent.get(p)) if (folded.has(p)) return false;
		return true;
	}

	function fold(id: string) {
		if (folded.has(id)) folded.delete(id);
		else folded.add(id);
	}
</script>

<div bind:this={ref} data-slot="table-tree" class={cn('w-full min-w-0', className)} {...rest}>
<Table.Root class="max-md:[&_[data-slot=checkbox]]:after:-inset-[15px] max-md:[&_tr>:first-child:has([data-slot=checkbox])]:pl-[14px]">
	{#if caption}<Table.Caption>{caption}</Table.Caption>{/if}
	<Table.Header>
		<Table.Row class="max-md:h-[44px]">{@render head()}</Table.Row>
	</Table.Header>
	{#each tree.groups as group (group[0]!.id)}
		<Table.Body>
			{#each group as row (row.id)}
				{@const level = tree.level.get(row.id)!}
				{@const kids = tree.kids.get(row.id) ?? []}
				{@const isHead = level === 1 || kids.length > 0}
				{@const open = !folded.has(row.id)}
				<Table.Row
					id={rowId(row.id)}
					hidden={!shown(row.id)}
					data-level={level}
					data-state={selected?.(row) ? 'selected' : undefined}
					class={cn(isHead && 'bg-muted/50')}
				>
					{@render start?.(row)}
					<Table.Head
						scope={level === 1 ? 'rowgroup' : 'row'}
						class={cn(
							level > 1 && 'h-auto py-2',
							'max-md:h-[44px]',
							isHead ? 'font-semibold' : 'font-normal',
							INDENT[level - 1 + (kids.length ? 0 : 1)]
						)}
					>
						{#if kids.length}
							<button
								type="button"
								data-slot="table-fold"
								aria-expanded={open}
								aria-controls={kids.map(rowId).join(' ')}
								onclick={() => fold(row.id)}
								class="relative inline-flex items-baseline gap-2 rounded-sm font-semibold outline-none after:absolute after:-inset-x-2 after:-inset-y-2.5 max-md:after:-inset-y-[12px] focus-visible:ring-3 focus-visible:ring-ring/50 print:after:hidden"
							>
								<!-- self-center keeps the icon out of the baseline, so the name stands on the line of the note. -->
								<ChevronRightIcon
									aria-hidden="true"
									class={cn(
										'size-4 shrink-0 self-center text-muted-foreground transition-transform duration-fast ease-stack motion-reduce:transition-none',
										open && 'rotate-90'
									)}
								/>
								{row.name}
							</button>
						{:else}
							{row.name}
						{/if}
						{#if row.note}<span class="ml-2 font-normal text-muted-foreground">{row.note}</span>{/if}
					</Table.Head>
					{@render cells(row)}
				</Table.Row>
			{/each}
		</Table.Body>
	{/each}
</Table.Root>
</div>
