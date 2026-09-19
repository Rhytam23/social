import { describe, it, expect } from 'vitest';
import { parseInline, parseMessage, wrapSelection } from '../../lib/messaging/richText';

describe('parseInline', () => {
  it('parses bold, italic, strike and code', () => {
    expect(parseInline('**a**')).toEqual([{ t: 'b', children: [{ t: 'text', v: 'a' }] }]);
    expect(parseInline('*a*')).toEqual([{ t: 'i', children: [{ t: 'text', v: 'a' }] }]);
    expect(parseInline('~~a~~')).toEqual([{ t: 's', children: [{ t: 'text', v: 'a' }] }]);
    expect(parseInline('`a b`')).toEqual([{ t: 'code', v: 'a b' }]);
  });

  it('does not italicise inside snake_case words', () => {
    expect(parseInline('use my_var_name here')).toEqual([{ t: 'text', v: 'use my_var_name here' }]);
  });

  it('links only http and https', () => {
    expect(parseInline('see https://example.com.')).toEqual([
      { t: 'text', v: 'see ' },
      { t: 'a', href: 'https://example.com', v: 'https://example.com' },
      { t: 'text', v: '.' },
    ]);
    const bad = parseInline('javascript:alert(1)');
    expect(bad.some((n) => n.t === 'a')).toBe(false);
  });

  it('never produces markup from HTML-looking text', () => {
    const nodes = parseInline('<img src=x onerror=alert(1)>');
    expect(nodes).toEqual([{ t: 'text', v: '<img src=x onerror=alert(1)>' }]);
  });
});

describe('parseMessage', () => {
  it('handles fenced code blocks', () => {
    const nodes = parseMessage('before\n```\nlet a = 1;\n```\nafter');
    expect(nodes.some((n) => n.t === 'pre' && n.v === 'let a = 1;')).toBe(true);
  });

  it('leaves an unclosed fence as plain text', () => {
    const nodes = parseMessage('```oops');
    expect(nodes.some((n) => n.t === 'pre')).toBe(false);
  });

  it('parses quote lines and line breaks', () => {
    const nodes = parseMessage('> hi\nthere');
    expect(nodes[0]).toEqual({ t: 'quote', children: [{ t: 'text', v: 'hi' }] });
    expect(nodes[1]).toEqual({ t: 'br' });
  });
});

describe('wrapSelection', () => {
  it('wraps the selected text with a marker', () => {
    expect(wrapSelection('hello world', 6, 11, '**')).toEqual({ value: 'hello **world**', start: 8, end: 13 });
  });
});
