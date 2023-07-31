import { writable, type Writable } from 'svelte/store';
import type { User, Team } from "src/types/defs";

export const userStore: Writable<User|null> = writable(null);
export const teamStore: Writable<Team|null> = writable(null);
export const authStatusStore: Writable<boolean> = writable(false);
