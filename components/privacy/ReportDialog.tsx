import React, { useState } from 'react';
import { MessageData } from '../../types/ui';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';

const REASONS = ['Spam', 'Harassment or bullying', 'Threats or violence', 'Scam or fraud', 'Something else'];

export const ReportDialog: React.FC<{
  message: MessageData | null;
  onClose: () => void;
  onSubmit: (messageId: string, reason: string, includeText: boolean) => Promise<boolean>;
}> = ({ message, onClose, onSubmit }) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [includeText, setIncludeText] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!message) return null;

  const submit = async () => {
    setBusy(true);
    const ok = await onSubmit(message.id, details.trim() ? `${reason}: ${details.trim()}` : reason, includeText);
    setBusy(false);
    if (ok) {
      setDetails('');
      setIncludeText(false);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Report this message"
      footerAction={
        <Button variant="danger" size="sm" loading={busy} onClick={submit}>
          Send report
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Messages are end-to-end encrypted, so administrators cannot read them. Your report only includes what you choose to share below.
        </p>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-semibold text-[var(--text-primary)] mb-1">Reason</legend>
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
              <input type="radio" name="report-reason" className="accent-emerald-500" checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
          Details (optional)
          <textarea rows={2} maxLength={400} value={details} onChange={(e) => setDetails(e.target.value)} className="bg-[var(--surface-2)] border border-[var(--border-subtle)] p-2.5 rounded-xl text-xs font-normal focus:outline-none focus:border-emerald-500/60 resize-none" />
        </label>
        <label className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
          <input type="checkbox" className="mt-0.5 accent-emerald-500" checked={includeText} onChange={(e) => setIncludeText(e.target.checked)} />
          <span>
            Include the text of this message
            <span className="block text-[11px] text-[var(--text-muted)]">This sends the decrypted text to platform administrators. Leave it off to report without sharing content.</span>
          </span>
        </label>
      </div>
    </Dialog>
  );
};
