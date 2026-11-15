// The chunk of the toolbar of the rich text field: RichTextField.svelte loads it with a dynamic import, so
// the groups of tools and the icons stay out of the chunk of the page. The frame of the toolbar
// (Toolbar.svelte) renders with the page. The menus, the drawer of More, the forms and the bar over
// selected text load later still, each in a chunk of their own (parts.ts), also in a field with no toolbar.
export { default as Tools } from './Tools.svelte';
