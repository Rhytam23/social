import React from 'react';
import { Dialog } from './dialog';
import { Kbd } from './primitives';

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Ctrl', 'K'], label: 'Open the quick switcher' },
  { keys: ['?'], label: 'Show this list' },
  { keys: ['Esc'], label: 'Close a dialog or panel' },
  { keys: ['Enter'], label: 'Send message' },
  { keys: ['Shift', 'Enter'], label: 'New line in a message' },
  { keys: ['↑', '↓'], label: 'Move through search results' },
];

export const ShortcutsDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <Dialog isOpen={isOpen} onClose={onClose} title="Keyboard shortcuts" hideCancel>
    <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
      {SHORTCUTS.map((s) => (
        <li key={s.label} className="flex items-center justify-between py-2.5">
          <span className="text-[var(--text-secondary)]">{s.label}</span>
          <span className="flex gap-1">
            {s.keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </span>
        </li>
      ))}
    </ul>
  </Dialog>
);
