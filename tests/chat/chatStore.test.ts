import { describe, it, expect, beforeEach } from 'vitest';
import { ChatStore } from '../../lib/store/chatStore';

describe('ChatStore V1 Messaging Engine', () => {
  let store: ChatStore;

  beforeEach(() => {
    // Fresh store instance for each test
    store = new ChatStore();
  });

  it('1. should initialize with default users and conversations', () => {
    const state = store.getState();
    expect(state.currentUser.id).toBe('usr-alice');
    expect(state.allUsers.length).toBeGreaterThanOrEqual(4);
    expect(state.conversations.length).toBeGreaterThanOrEqual(2);
    expect(state.activeConversationId).toBe('conv-alice-bob');
  });

  it('2. should send a message optimistically and update conversation snippet', () => {
    store.sendMessage('Testing automated V1 message delivery');
    const state = store.getState();
    const msgs = state.messagesMap['conv-alice-bob'];
    const lastMsg = msgs[msgs.length - 1];

    expect(lastMsg.content).toBe('Testing automated V1 message delivery');
    expect(lastMsg.isSelf).toBe(true);
    expect(lastMsg.senderId).toBe('usr-alice');
    expect(lastMsg.status).toBe('delivered');

    const conv = state.conversations.find((c) => c.id === 'conv-alice-bob');
    expect(conv?.lastMessage?.snippet).toBe('Testing automated V1 message delivery');
  });

  it('3. should toggle emoji reactions on a message', () => {
    store.sendMessage('Reaction test');
    const msgs = store.getState().messagesMap['conv-alice-bob'];
    const targetMsg = msgs[msgs.length - 1];

    store.reactToMessage(targetMsg.id, '🔥');
    let updatedMsgs = store.getState().messagesMap['conv-alice-bob'];
    let updated = updatedMsgs.find((m) => m.id === targetMsg.id);
    expect(updated?.reactions.find((r) => r.emoji === '🔥')?.count).toBe(1);

    // Toggle off
    store.reactToMessage(targetMsg.id, '🔥');
    updatedMsgs = store.getState().messagesMap['conv-alice-bob'];
    updated = updatedMsgs.find((m) => m.id === targetMsg.id);
    expect(updated?.reactions.find((r) => r.emoji === '🔥')).toBeUndefined();
  });

  it('4. should edit a message and mark isEdited', () => {
    store.sendMessage('Original message text');
    const msgs = store.getState().messagesMap['conv-alice-bob'];
    const targetMsg = msgs[msgs.length - 1];

    store.editMessage(targetMsg.id, 'Updated message text');
    const updatedMsgs = store.getState().messagesMap['conv-alice-bob'];
    const updated = updatedMsgs.find((m) => m.id === targetMsg.id);

    expect(updated?.content).toBe('Updated message text');
    expect(updated?.isEdited).toBe(true);
  });

  it('5. should mark a message as deleted locally', () => {
    store.sendMessage('To be deleted');
    const msgs = store.getState().messagesMap['conv-alice-bob'];
    const targetMsg = msgs[msgs.length - 1];

    store.deleteMessage(targetMsg.id);
    const updatedMsgs = store.getState().messagesMap['conv-alice-bob'];
    const updated = updatedMsgs.find((m) => m.id === targetMsg.id);

    expect(updated?.isDeletedLocally).toBe(true);
  });

  it('6. should create a new direct conversation without duplicates', () => {
    const bob = store.getState().allUsers.find((u) => u.id === 'usr-bob')!;
    const existingId = store.createDirectConversation(bob);
    expect(existingId).toBe('conv-alice-bob');

    const carol = store.getState().allUsers.find((u) => u.id === 'usr-carol')!;
    const newId = store.createDirectConversation(carol);
    expect(newId).toMatch(/^conv-dm-/);

    const conv = store.getState().conversations.find((c) => c.id === newId);
    expect(conv?.title).toBe('Carol Danvers');
    expect(conv?.type).toBe('direct');
  });

  it('7. should create a new group conversation with member count', () => {
    const groupId = store.createGroupConversation('V1 Release Team', ['usr-bob', 'usr-carol']);
    const conv = store.getState().conversations.find((c) => c.id === groupId);

    expect(conv?.title).toBe('V1 Release Team');
    expect(conv?.type).toBe('group');
    expect(conv?.groupMeta?.memberCount).toBe(3); // 2 members + creator

    const initialMsgs = store.getState().messagesMap[groupId];
    expect(initialMsgs.length).toBe(1);
    expect(initialMsgs[0].content).toContain('V1 Release Team');
  });

  it('8. should switch active persona and recompute isSelf', () => {
    store.sendMessage('Alice says hi');
    let msgs = store.getState().messagesMap['conv-alice-bob'];
    let lastMsg = msgs[msgs.length - 1];
    expect(lastMsg.isSelf).toBe(true);

    // Switch active user to Bob
    store.switchDemoUser('usr-bob');
    expect(store.getState().currentUser.id).toBe('usr-bob');

    msgs = store.getState().messagesMap['conv-alice-bob'];
    lastMsg = msgs[msgs.length - 1];
    expect(lastMsg.isSelf).toBe(false);
  });
});
