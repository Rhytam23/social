'use client';

import React from 'react';
import { useTheme, type ThemePreference } from '../../lib/ui/theme';
import { updatePreferences, usePreferences } from '../../lib/prefs/preferences';
import { SettingRow } from '../ui/primitives';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-0.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-[10px] transition-colors ${
            value === o.value
              ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const AppearanceSettings: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const prefs = usePreferences();

  return (
    <section aria-label="Appearance" className="p-6 bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl">
      <SettingRow title="Theme" description="System follows your device's light or dark setting.">
        <Segmented<ThemePreference>
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
          ]}
        />
      </SettingRow>
      <SettingRow title="Text size" description="Scales all text in the app.">
        <Segmented
          label="Text size"
          value={prefs.appearance.fontScale}
          onChange={(v) => updatePreferences((d) => ({ ...d, appearance: { ...d.appearance, fontScale: v } }))}
          options={[
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Default' },
            { value: 'lg', label: 'Large' },
          ]}
        />
      </SettingRow>
      <SettingRow title="Density" description="Compact fits more conversations on screen.">
        <Segmented
          label="Density"
          value={prefs.appearance.density}
          onChange={(v) => updatePreferences((d) => ({ ...d, appearance: { ...d.appearance, density: v } }))}
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      </SettingRow>
      <p className="text-[11px] text-[var(--text-muted)] pt-3">
        Animations follow your device&apos;s &ldquo;reduce motion&rdquo; setting automatically.
      </p>
    </section>
  );
};
