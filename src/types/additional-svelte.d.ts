/**
 * @see https://github.com/sveltejs/language-tools/blob/master/docs/preprocessors/typescript.md#im-using-an-attributeevent-on-a-dom-element-and-it-throws-a-type-error
 */
declare namespace svelteHTML {
	// The generic must match the upstream HTMLProps<T> declaration for the
	// interfaces to merge, even though it goes unused here.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface HTMLProps<T> {
		authchange?: (event: CustomEvent) => void;
	}
}
