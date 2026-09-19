'use client';

import { useSyncExternalStore } from 'react';
import { getChatStore, ChatStore, ChatStoreState } from '../lib/store/chatStore';

export function useChatStore(): [ChatStoreState, ChatStore] {
  const store = getChatStore();
  const state = useSyncExternalStore(
    (onStoreChange) => store.subscribe(onStoreChange),
    () => store.getState(),
    () => store.getState()
  );

  return [state, store];
}
