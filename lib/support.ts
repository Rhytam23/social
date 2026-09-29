/** Topics of a support request. Shared by the contact form, the API route and the admin list. */
export const SUPPORT_TOPICS = ['question', 'problem', 'account', 'abuse', 'other'] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export const SUPPORT_TOPIC_LABEL: Record<SupportTopic, string> = {
  question: 'A question',
  problem: 'Something is not working',
  account: 'My account or my data',
  abuse: 'Report abuse',
  other: 'Something else',
};

export function isSupportTopic(v: unknown): v is SupportTopic {
  return typeof v === 'string' && (SUPPORT_TOPICS as readonly string[]).includes(v);
}

export interface SupportRow {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string;
  topic: SupportTopic;
  message: string;
  context: string | null;
  status: 'open' | 'resolved';
  created_at: string;
}

export type SupportStatusFilter = 'open' | 'resolved' | 'all';

/** Filters the loaded requests by status and a search across name, email and message. Pure so it can be tested. */
export function filterSupportRows(rows: SupportRow[], status: SupportStatusFilter, query: string): SupportRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (q && !`${r.name ?? ''} ${r.email} ${r.message}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** A reply link that cannot carry anything but the address and a fixed subject. */
export function replyHref(r: SupportRow): string {
  return `mailto:${encodeURIComponent(r.email).replace(/%40/g, '@')}?subject=${encodeURIComponent(`Re: ${SUPPORT_TOPIC_LABEL[r.topic]}`)}`;
}
