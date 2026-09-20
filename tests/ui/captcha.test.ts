import { describe, it, expect } from 'vitest';
import { captchaEnabled } from '../../lib/captcha';

describe('bot check', () => {
  it('is off without a site key', () => {
    expect(captchaEnabled('')).toBe(false);
  });

  it('is on for a plausible site key', () => {
    expect(captchaEnabled('0x4AAAAAAABkMYinukE8nzYS')).toBe(true);
  });

  it('refuses a value that could not be a site key (so it never reaches the page or the security policy)', () => {
    expect(captchaEnabled('short')).toBe(false);
    expect(captchaEnabled('has spaces in it')).toBe(false);
    expect(captchaEnabled('https://evil.example/x')).toBe(false);
    expect(captchaEnabled('a'.repeat(65))).toBe(false);
  });
});
