import { writable, type Writable } from 'svelte/store';
import type { SessionUser, StatsPlayerRef } from '../types/defs';

export interface LeagueSettings {
	phase: string;
	bid_deadlines: number[];
	[key: string]: unknown;
}

export const userStore: Writable<SessionUser | null> = writable(null);
export const authStatusStore: Writable<boolean> = writable(false);
export const isMobile: Writable<boolean | null> = writable(null);
export const leagueSettingsStore: Writable<LeagueSettings | null> = writable(null);

/** Player whose stats drawer is open; null when closed. See PlayerStatsDrawer. */
export const statsPlayerStore: Writable<StatsPlayerRef | null> = writable(null);
