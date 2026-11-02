// The groups of the component menu, in the order of the component check (scripts/components.mjs).
// Each part of STACK beyond the registry (STACK_PARTS there) follows the component nearest to it.
// That script reads the file system, so the preview cannot import it, and this list repeats its
// names. The component page refuses to render when this list and src/lib/showcase/ disagree.
export const MENU_GROUPS = [
	{
		label: 'Actions and forms',
		names: [
			'button', 'button-group', 'toggle', 'toggle-group', 'input', 'input-group', 'input-otp', 'textarea',
			'code-editor', 'code-block', 'diff', 'qr-code', 'label', 'field', 'form', 'native-select', 'select', 'checkbox', 'radio-group', 'switch', 'slider'
		]
	},
	{
		label: 'Overlays and menus',
		names: [
			'dialog', 'alert-dialog', 'sheet', 'drawer', 'popover', 'hover-card', 'tooltip', 'dropdown-menu',
			'context-menu', 'menubar', 'command', 'navigation-menu'
		]
	},
	{
		label: 'Navigation, structure and dates',
		names: [
			'sidebar', 'tabs', 'breadcrumb', 'stepper', 'pagination', 'accordion', 'collapsible', 'card', 'separator',
			'aspect-ratio', 'resizable', 'scroll-area', 'carousel', 'calendar', 'range-calendar', 'month-view', 'time-field',
			'time-zone-field'
		]
	},
	{
		label: 'Data, feedback and messages',
		names: [
			'table', 'selection-bar', 'reorder-list', 'board', 'day-log', 'badge', 'unread-mark', 'avatar', 'item', 'empty', 'kbd', 'alert', 'sonner', 'progress', 'skeleton', 'spinner',
			'figure-band',
			'attachment', 'bubble', 'marker', 'message', 'mail-message', 'message-scroller', 'questionnaire'
		]
	},
	{ label: 'Charts', names: ['chart'] }
];

/** Every name of the menu, in the order of the menu. */
export const MENU_NAMES: string[] = MENU_GROUPS.flatMap((g) => g.names);
