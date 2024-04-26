import { writable, type Writable } from 'svelte/store';
import type { User } from "../types/defs";

export const userStore: Writable<User|null> = writable(null);
export const authStatusStore: Writable<boolean> = writable(false);
export const isMobile: Writable<boolean|null> = writable(null);
