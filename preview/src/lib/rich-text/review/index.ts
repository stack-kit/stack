// The review chunk of the rich text field: RichTextField.svelte loads it with a dynamic import only when
// the page gives `writing`, so the writing tools, the request bar, the rows of the changes and the
// instruction row stay out of the chunk of the page. The diff of a whole text loads later still, at the
// first whole text (text.ts).
export { default as Changes } from './Changes.svelte';
export { default as Instruction } from './Instruction.svelte';
export { default as RequestBar } from './RequestBar.svelte';
export { default as WritingTools } from './WritingTools.svelte';
export { createWriting, WRITING_KINDS, type Writing } from './writing.svelte.js';
