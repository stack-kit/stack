// The class merge of the test cases. It joins the names, which is all that a test needs.
export function cn(...inputs: (string | false | null | undefined)[]): string {
	return inputs.filter(Boolean).join(' ');
}
