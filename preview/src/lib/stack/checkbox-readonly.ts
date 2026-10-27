// The read-only look of a check box. Nova draws no read-only state, so a box with the readonly prop
// of Bits UI takes these classes at use (see ### checkbox in DESIGN.md). A checked box takes the
// muted-foreground fill and edge with a background check, at full opacity, so that its state passes
// 3:1, and the pointer shows not-allowed.
export const checkboxReadonly =
	'data-readonly:cursor-not-allowed data-readonly:data-checked:border-muted-foreground data-readonly:data-checked:bg-muted-foreground data-readonly:data-checked:text-background dark:data-readonly:data-checked:border-muted-foreground dark:data-readonly:data-checked:bg-muted-foreground';
