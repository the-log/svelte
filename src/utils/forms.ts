export const serialize = (e: SubmitEvent) => {
  new FormData((e.target as HTMLFormElement))
}

export const useFormData = (e: FormDataEvent, fn: Function) => {
  // Prevent reading the form data until after all components have had a chance to append.
  setTimeout(fn.bind(this, Object.fromEntries(e.formData)), 0);
}
