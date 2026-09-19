import { useSyncExternalStore } from 'react';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  items = [...items];
  listeners.forEach((l) => l());
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(message: string, opts: { kind?: ToastKind; actionLabel?: string; onAction?: () => void; ms?: number } = {}) {
  const id = nextId++;
  items = [...items, { id, kind: opts.kind ?? 'info', message, actionLabel: opts.actionLabel, onAction: opts.onAction }];
  emit();
  if (typeof window !== 'undefined') window.setTimeout(() => dismissToast(id), opts.ms ?? 5000);
  return id;
}

const EMPTY: ToastItem[] = [];

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => items,
    () => EMPTY
  );
}
