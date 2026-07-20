export const serialize = (e: SubmitEvent) => {
	new FormData(e.target as HTMLFormElement);
};

export const useFormData = (e: FormDataEvent, fn: (e: FormDataEvent) => void) => {
	// Prevent reading the form data until after all components have had a chance to append.

	setTimeout(() => fn(e), 0);
};
