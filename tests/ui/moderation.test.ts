import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { MODERATION, describeBan, isBanned, isPermanent, riskLevel } from '../../lib/moderation';

describe('moderation levels', () => {
  it('maps the number of different reporters onto the tiers', () => {
    expect(riskLevel(0)).toBe('none');
    expect(riskLevel(2)).toBe('none');
    expect(riskLevel(3)).toBe('warned');
    expect(riskLevel(9)).toBe('warned');
    expect(riskLevel(10)).toBe('temp');
    expect(riskLevel(11)).toBe('red');
    expect(riskLevel(19)).toBe('red');
    expect(riskLevel(20)).toBe('blocked');
    expect(riskLevel(50)).toBe('blocked');
  });

  it('tells permanent, temporary and lifted bans apart', () => {
    const now = new Date('2026-09-20T12:00:00Z').getTime();
    expect(isPermanent('9999-12-31T23:59:59Z')).toBe(true);
    expect(isPermanent('2026-09-27T12:00:00Z')).toBe(false);
    expect(isPermanent(null)).toBe(false);
    expect(isBanned('2026-09-27T12:00:00Z', now)).toBe(true);
    expect(isBanned('2026-09-19T12:00:00Z', now)).toBe(false);
    expect(describeBan('9999-12-31T23:59:59Z', now)).toBe('Blocked permanently');
    expect(describeBan('2026-09-27T12:00:00Z', now)).toMatch(/^Banned until /);
    expect(describeBan(null, now)).toBeNull();
  });

  it('matches the numbers in the migration, so the admin screen never says something the database does not do', () => {
    const sql = readFileSync(path.resolve(__dirname, '../../database/migrations/024_moderation.sql'), 'utf8');
    const m = sql.match(/AS \$\$ SELECT (\d+), (\d+), (\d+), (\d+), (\d+), (\d+) \$\$;/);
    expect(m, 'moderation_thresholds() not found').toBeTruthy();
    expect(m!.slice(1).map(Number)).toEqual([MODERATION.warnAt, MODERATION.tempBanAt, MODERATION.blockAt, MODERATION.tempBanDays, MODERATION.windowDays, MODERATION.minReporterAgeHours]);
    // The trigger uses the same numbers.
    expect(sql).toContain(`v_n >= ${MODERATION.blockAt}`);
    expect(sql).toContain(`v_n >= ${MODERATION.tempBanAt}`);
    expect(sql).toContain(`v_n >= ${MODERATION.warnAt}`);
    expect(sql).toContain(`INTERVAL '${MODERATION.tempBanDays} days'`);
  });
});
