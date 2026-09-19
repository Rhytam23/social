'use client';

import React, { useState } from 'react';
import { updatePreferences, usePreferences, type NotifyLevel } from '../../lib/prefs/preferences';
import { SettingRow, Switch } from '../ui/primitives';
import { Button } from '../ui/button';
import { toast } from '../../lib/ui/toastStore';

const inputClass =
  'bg-[var(--surface-2)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60';

export const NotificationSettings: React.FC = () => {
  const prefs = usePreferences();
  const n = prefs.notifications;
  const [perm, setPerm] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [keywordDraft, setKeywordDraft] = useState(n.keywords.join(', '));

  const setN = (patch: Partial<typeof n>) => updatePreferences((d) => ({ ...d, notifications: { ...d.notifications, ...patch } }));

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPerm(result);
  };

  return (
    <section aria-label="Notifications" className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl flex flex-col">
      <SettingRow title="Notify me about" description="Direct messages always alert you in &quot;Mentions only&quot;. Do Not Disturb and In a meeting silence everything.">
        <select
          aria-label="Notification level"
          value={n.level}
          onChange={(e) => setN({ level: e.target.value as NotifyLevel })}
          className={inputClass}
        >
          <option value="all">Every message</option>
          <option value="mentions">Mentions and DMs</option>
          <option value="none">Nothing</option>
        </select>
      </SettingRow>

      <SettingRow title="Show message previews" description="Off: alerts say &quot;New message&quot;. Previews are built on this device only.">
        <Switch label="Show message previews" checked={n.preview} onChange={(v) => setN({ preview: v })} />
      </SettingRow>

      <SettingRow title="Sound" description="A short chime when an alert is shown.">
        <Switch label="Notification sound" checked={n.sound} onChange={(v) => setN({ sound: v })} />
      </SettingRow>

      <SettingRow title="Quiet hours" description="No alerts during this window, every day.">
        <div className="flex items-center gap-2">
          <Switch label="Quiet hours" checked={n.quietHours.enabled} onChange={(v) => setN({ quietHours: { ...n.quietHours, enabled: v } })} />
          <input aria-label="Quiet hours start" type="time" value={n.quietHours.start} onChange={(e) => setN({ quietHours: { ...n.quietHours, start: e.target.value } })} className={inputClass} disabled={!n.quietHours.enabled} />
          <span className="text-xs text-[var(--text-muted)]">to</span>
          <input aria-label="Quiet hours end" type="time" value={n.quietHours.end} onChange={(e) => setN({ quietHours: { ...n.quietHours, end: e.target.value } })} className={inputClass} disabled={!n.quietHours.enabled} />
        </div>
      </SettingRow>

      <SettingRow title="Keywords" description="Get alerted when a message contains one of these (comma separated). Checked on this device.">
        <input
          aria-label="Keywords"
          value={keywordDraft}
          placeholder="deploy, invoice"
          onChange={(e) => setKeywordDraft(e.target.value)}
          onBlur={() => setN({ keywords: keywordDraft.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 20) })}
          className={`${inputClass} w-48`}
        />
      </SettingRow>

      <SettingRow
        title="Desktop notifications"
        description={
          perm === 'granted'
            ? 'On. Shown when this tab is in the background.'
            : perm === 'denied'
            ? 'Blocked in your browser settings for this site.'
            : perm === 'unsupported'
            ? 'This browser does not support them.'
            : 'Off. Allow them to get alerts while this tab is in the background.'
        }
      >
        {perm === 'default' ? (
          <Button size="sm" variant="primary" onClick={requestPermission}>Allow</Button>
        ) : perm === 'granted' ? (
          <Button size="sm" variant="tertiary" onClick={() => toast('Test notification: it works.', { kind: 'success' })}>Test</Button>
        ) : null}
      </SettingRow>

      <p className="text-[11px] text-[var(--text-muted)] pt-3 leading-relaxed">
        Alerts only appear while Private Chat is open in a browser tab. Notifications when the app is closed (Web Push) are not available yet, because
        they would need message content to leave your device.
      </p>
    </section>
  );
};
