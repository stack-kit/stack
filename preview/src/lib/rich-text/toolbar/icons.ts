// The icon of each tool of the rich text field, and of each menu group whose trigger shows an icon. Only
// the toolbar and the bar over selected text import this module.
import type { LucideIcon } from '@lucide/svelte';
import BaselineIcon from '@lucide/svelte/icons/baseline';
import BoldIcon from '@lucide/svelte/icons/bold';
import CodeIcon from '@lucide/svelte/icons/code';
import Heading1Icon from '@lucide/svelte/icons/heading-1';
import Heading2Icon from '@lucide/svelte/icons/heading-2';
import Heading3Icon from '@lucide/svelte/icons/heading-3';
import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
import ItalicIcon from '@lucide/svelte/icons/italic';
import LinkIcon from '@lucide/svelte/icons/link';
import ListIcon from '@lucide/svelte/icons/list';
import ListIndentDecreaseIcon from '@lucide/svelte/icons/list-indent-decrease';
import ListIndentIncreaseIcon from '@lucide/svelte/icons/list-indent-increase';
import ListOrderedIcon from '@lucide/svelte/icons/list-ordered';
import PaintBucketIcon from '@lucide/svelte/icons/paint-bucket';
import PilcrowIcon from '@lucide/svelte/icons/pilcrow';
import Redo2Icon from '@lucide/svelte/icons/redo-2';
import RemoveFormattingIcon from '@lucide/svelte/icons/remove-formatting';
import SeparatorHorizontalIcon from '@lucide/svelte/icons/separator-horizontal';
import SquareCodeIcon from '@lucide/svelte/icons/square-code';
import StrikethroughIcon from '@lucide/svelte/icons/strikethrough';
import SubscriptIcon from '@lucide/svelte/icons/subscript';
import SuperscriptIcon from '@lucide/svelte/icons/superscript';
import TextAlignCenterIcon from '@lucide/svelte/icons/text-align-center';
import TextAlignEndIcon from '@lucide/svelte/icons/text-align-end';
import TextAlignJustifyIcon from '@lucide/svelte/icons/text-align-justify';
import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start';
import TextQuoteIcon from '@lucide/svelte/icons/text-quote';
import UnderlineIcon from '@lucide/svelte/icons/underline';
import Undo2Icon from '@lucide/svelte/icons/undo-2';
import type { ToolId } from '../tools/commands.js';

export const TOOL_ICONS: Readonly<Record<ToolId, LucideIcon>> = {
	undo: Undo2Icon,
	redo: Redo2Icon,
	paragraph: PilcrowIcon,
	h1: Heading1Icon,
	h2: Heading2Icon,
	h3: Heading3Icon,
	'bullet-list': ListIcon,
	'numbered-list': ListOrderedIcon,
	quote: TextQuoteIcon,
	'code-block': SquareCodeIcon,
	bold: BoldIcon,
	italic: ItalicIcon,
	underline: UnderlineIcon,
	strikethrough: StrikethroughIcon,
	'inline-code': CodeIcon,
	subscript: SubscriptIcon,
	superscript: SuperscriptIcon,
	link: LinkIcon,
	'text-color': BaselineIcon,
	'highlight-color': PaintBucketIcon,
	'clear-formatting': RemoveFormattingIcon,
	'align-left': TextAlignStartIcon,
	'align-center': TextAlignCenterIcon,
	'align-right': TextAlignEndIcon,
	'align-justify': TextAlignJustifyIcon,
	outdent: ListIndentDecreaseIcon,
	indent: ListIndentIncreaseIcon,
	hr: SeparatorHorizontalIcon,
	picture: ImagePlusIcon
};

/** The icon of a menu group whose trigger shows an icon (Group.trigger is `icon`). */
export const GROUP_ICONS: Readonly<Record<string, LucideIcon>> = {
	insert: ImagePlusIcon,
	formats: SuperscriptIcon
};
