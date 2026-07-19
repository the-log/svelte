// Stub for SvelteKit's `$env/dynamic/public` virtual module. Vitest runs
// without the SvelteKit Vite plugin, so the real module doesn't resolve there;
// vitest.config.ts aliases it to this file.
export const env: Record<string, string | undefined> = {};
