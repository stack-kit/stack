// The read-only look of a check box. Nova draws no read-only state, so HeldCheckbox gives these
// classes to its box (see ### checkbox in DESIGN.md). A checked box takes the muted-foreground fill
// and edge with a background check, at full opacity, so that its state passes 3:1, and the pointer
// shows not-allowed. The package exports no path to this file: a product takes HeldCheckbox.
export const checkboxReadonly =
	'data-readonly:cursor-not-allowed data-readonly:data-checked:border-muted-foreground data-readonly:data-checked:bg-muted-foreground data-readonly:data-checked:text-background dark:data-readonly:data-checked:border-muted-foreground dark:data-readonly:data-checked:bg-muted-foreground';
