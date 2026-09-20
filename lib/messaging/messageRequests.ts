/**
 * A person you have never talked to can send a limited number of messages in a direct chat until you reply
 * (migration 026). The database enforces it; this is only the wording and the code the server and app share.
 */

export const MESSAGE_REQUEST_LIMIT = 3;
export const MESSAGE_REQUEST_CODE = 'message_request_limit';

export const MESSAGE_REQUEST_NOTICE = `You can send ${MESSAGE_REQUEST_LIMIT} messages to someone until they reply. Once they answer, you can keep chatting as normal.`;

/** True when a database or API error is the message-request limit. */
export function isMessageRequestLimit(err: unknown): boolean {
  const text = typeof err === 'string' ? err : (err as { message?: unknown } | null)?.message;
  return typeof text === 'string' && text.includes(MESSAGE_REQUEST_CODE);
}
