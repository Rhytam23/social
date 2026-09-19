/**
 * A tiny, safe message formatter. It produces a data tree (never HTML), so
 * nothing a sender types can inject markup or script. Only http(s) links are
 * recognised.
 *
 *   **bold**  *italic*  _italic_  ~~strike~~  `code`  ```block```  > quote  https://link
 */
export type RichNode =
  | { t: 'text'; v: string }
  | { t: 'b' | 'i' | 's' | 'quote'; children: RichNode[] }
  | { t: 'code' | 'pre'; v: string }
  | { t: 'a'; href: string; v: string }
  | { t: 'br' };

const INLINE_SOURCE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(~~[^~\n]+~~)|(\*[^*\s][^*\n]*\*)|(_[^_\s][^_\n]*_)|(https?:\/\/[^\s<>]+)/;

function trimUrl(raw: string): { url: string; rest: string } {
  const m = raw.match(/[).,;:!?'"]+$/);
  if (!m) return { url: raw, rest: '' };
  return { url: raw.slice(0, raw.length - m[0].length), rest: m[0] };
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseInline(text: string): RichNode[] {
  const out: RichNode[] = [];
  let last = 0;
  // A fresh regex per call: parseInline recurses, and a shared /g regex would lose its position.
  const INLINE = new RegExp(INLINE_SOURCE.source, 'g');
  let m: RegExpExecArray | null;
  const pushText = (v: string) => {
    if (v) out.push({ t: 'text', v });
  };

  while ((m = INLINE.exec(text)) !== null) {
    const token = m[0];
    const start = m.index;

    // _italic_ must not fire inside words (snake_case_names).
    if (m[5] && start > 0 && /\w/.test(text[start - 1])) continue;

    pushText(text.slice(last, start));
    last = start + token.length;

    if (m[1]) out.push({ t: 'code', v: token.slice(1, -1) });
    else if (m[2]) out.push({ t: 'b', children: parseInline(token.slice(2, -2)) });
    else if (m[3]) out.push({ t: 's', children: parseInline(token.slice(2, -2)) });
    else if (m[4] || m[5]) out.push({ t: 'i', children: parseInline(token.slice(1, -1)) });
    else {
      const { url, rest } = trimUrl(token);
      if (isSafeUrl(url)) {
        out.push({ t: 'a', href: url, v: url });
        pushText(rest);
      } else {
        pushText(token);
      }
    }
  }
  pushText(text.slice(last));
  return out;
}

export function parseMessage(text: string): RichNode[] {
  const nodes: RichNode[] = [];
  const parts = text.split(/```/);
  // Even indexes are normal text, odd indexes are fenced code (only when the fence is closed).
  const closed = parts.length % 2 === 1;

  parts.forEach((part, index) => {
    const isCode = index % 2 === 1 && (closed || index < parts.length - 1);
    if (isCode) {
      nodes.push({ t: 'pre', v: part.replace(/^\n/, '').replace(/\n$/, '') });
      return;
    }
    const raw = index % 2 === 1 ? '```' + part : part;
    const lines = raw.split('\n');
    lines.forEach((line, i) => {
      if (line.startsWith('> ')) nodes.push({ t: 'quote', children: parseInline(line.slice(2)) });
      else nodes.push(...parseInline(line));
      if (i < lines.length - 1) nodes.push({ t: 'br' });
    });
  });
  return nodes;
}

/** Wraps the current selection of a textarea value with a marker pair (used by Ctrl+B / Ctrl+I / Ctrl+E). */
export function wrapSelection(value: string, start: number, end: number, marker: string): { value: string; start: number; end: number } {
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + marker + selected + marker + value.slice(end);
  return { value: next, start: start + marker.length, end: end + marker.length };
}
