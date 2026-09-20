import { describe, it, expect } from 'vitest';
import { scrubAnalyticsEvent, stripUrlDetails } from '../../lib/analytics';

describe('analytics never receives anything after the path', () => {
  it('removes an invite code from the address', () => {
    expect(stripUrlDetails('https://chat.example.com/?join=ABCD-EFGH-JKLM')).toBe('https://chat.example.com/');
  });

  it('removes sign-in redirects, one-time codes and fragments', () => {
    expect(stripUrlDetails('https://chat.example.com/login?redirect=%2Fadmin&code=abc123#access_token=zzz')).toBe('https://chat.example.com/login');
    expect(stripUrlDetails('https://chat.example.com/auth/confirm?token_hash=abc&type=recovery')).toBe('https://chat.example.com/auth/confirm');
  });

  it('keeps the path so page counts still make sense', () => {
    expect(stripUrlDetails('https://chat.example.com/settings/privacy')).toBe('https://chat.example.com/settings/privacy');
  });

  it('copes with something that is not a full address', () => {
    expect(stripUrlDetails('/chat?x=1#y')).toBe('/chat');
  });

  it('scrubs the url on an event and leaves other events alone', () => {
    expect(scrubAnalyticsEvent({ type: 'pageview', url: 'https://a.example/x?join=SECRET' })).toEqual({ type: 'pageview', url: 'https://a.example/x' });
    const custom = { type: 'event', name: 'clicked' };
    expect(scrubAnalyticsEvent(custom)).toBe(custom);
  });
});
