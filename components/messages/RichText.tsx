import React from 'react';
import { parseMessage, type RichNode } from '../../lib/messaging/richText';

function render(nodes: RichNode[], keyPrefix = 'n'): React.ReactNode[] {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (n.t) {
      case 'text':
        return <React.Fragment key={key}>{n.v}</React.Fragment>;
      case 'b':
        return <strong key={key}>{render(n.children, key)}</strong>;
      case 'i':
        return <em key={key}>{render(n.children, key)}</em>;
      case 's':
        return <s key={key}>{render(n.children, key)}</s>;
      case 'quote':
        return (
          <span key={key} className="block border-l-2 border-[var(--border-strong)] pl-2 my-0.5 text-[var(--text-secondary)]">
            {render(n.children, key)}
          </span>
        );
      case 'code':
        return (
          <code key={key} className="px-1 py-0.5 rounded bg-black/20 font-mono text-[0.9em]">
            {n.v}
          </code>
        );
      case 'pre':
        return (
          <pre key={key} className="my-1 p-2 rounded-lg bg-black/25 font-mono text-[0.85em] overflow-x-auto whitespace-pre">
            {n.v}
          </pre>
        );
      case 'a':
        return (
          <a key={key} href={n.href} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 break-all">
            {n.v}
          </a>
        );
      case 'br':
        return <br key={key} />;
    }
  });
}

/** Renders message text with safe formatting. Never uses innerHTML. */
export const RichText: React.FC<{ text: string }> = ({ text }) => <>{render(parseMessage(text))}</>;
