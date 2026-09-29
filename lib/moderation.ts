/**
 * How reports lead to warnings, bans and blocks. The database decides (migration 024, `moderation_thresholds()`
 * and the trigger on `reports`); these numbers only let the admin screen explain what will happen, and a test
 * (tests/ui/moderation.test.ts) checks they match the migration.
 *
 * Counted: each different person who reported someone, in the last 90 days, ignoring reports an admin
 * dismissed and reports from accounts less than 24 hours old.
 */
export const MODERATION = {
  warnAt: 3,
  tempBanAt: 10,
  blockAt: 20,
  tempBanDays: 7,
  windowDays: 90,
  minReporterAgeHours: 24,
} as const;

export type RiskLevel = 'none' | 'warned' | 'temp' | 'red' | 'blocked';

/** What the number of different reporters means. Above the temporary-ban number a person is shown in red. */
export function riskLevel(distinctReporters: number): RiskLevel {
  if (distinctReporters >= MODERATION.blockAt) return 'blocked';
  if (distinctReporters > MODERATION.tempBanAt) return 'red';
  if (distinctReporters === MODERATION.tempBanAt) return 'temp';
  if (distinctReporters >= MODERATION.warnAt) return 'warned';
  return 'none';
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  none: 'Below the warning level',
  warned: 'Warning sent',
  temp: 'Temporary ban level',
  red: 'Above the ban level',
  blocked: 'Permanent block level',
};

/** The database marks a permanent ban with a date in the year 9999. */
export function isPermanent(bannedUntil: string | null | undefined): boolean {
  return !!bannedUntil && new Date(bannedUntil).getUTCFullYear() >= 9999;
}

export function isBanned(bannedUntil: string | null | undefined, now: number = Date.now()): boolean {
  return !!bannedUntil && new Date(bannedUntil).getTime() > now;
}

export function describeBan(bannedUntil: string | null | undefined, now: number = Date.now()): string | null {
  if (!isBanned(bannedUntil, now)) return null;
  return isPermanent(bannedUntil) ? 'Blocked permanently' : `Banned until ${new Date(bannedUntil as string).toLocaleString()}`;
}
