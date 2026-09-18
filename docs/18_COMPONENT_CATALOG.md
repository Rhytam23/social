# 18_COMPONENT_CATALOG.md — React Component Inventory

This document presents a complete inventory of React components in **Private Chat**, documenting props, state, dependencies, parent/child relationships, and component responsibilities.

---

## 1. Application Shell Components ([`components/layout/`](file:///d:/social/components/layout))

### 1.1 `AppShell` ([`AppShell.tsx`](file:///d:/social/components/layout/AppShell.tsx))
- **Purpose:** Root layout container managing active view navigation state (`activeTab`), conversation selection (`activeConvId`), and responsive drawer states.
- **Props:** None (renders top-level application state).
- **State:** `activeTab` (`'chats' | 'groups' | 'people' | 'security' | 'admin'`), `activeConvId`, `searchModalOpen`, `profileModalOpen`.
- **Children:** `Header`, `NavDeck`, `MobileNav`, `ChatCanvas`, `PeopleDirectory`, `GroupSpaceView`, `SecuritySettings`, `AdminDashboard`, `GlobalSearchModal`, `UserProfileModal`.

### 1.2 `Header` ([`Header.tsx`](file:///d:/social/components/layout/Header.tsx))
- **Purpose:** Top app bar displaying user profile summary, role badge, and global search trigger.
- **Props:** `currentUser`, `onOpenSearch`, `onOpenProfile`.

### 1.3 `NavDeck` ([`NavDeck.tsx`](file:///d:/social/components/layout/NavDeck.tsx))
- **Purpose:** Desktop left sidebar rendering primary navigation tabs and conversation list items (`ConversationItem`).

---

## 2. Chat & Messaging Components ([`components/chat/`](file:///d:/social/components/chat), [`components/messages/`](file:///d:/social/components/messages))

### 2.1 `ChatCanvas` ([`ChatCanvas.tsx`](file:///d:/social/components/chat/ChatCanvas.tsx))
- **Purpose:** Main conversation viewport displaying message history stream, active header, and composer input.
- **Children:** `MessageItem`, `MessageComposer`, `InspectorDeck`.

### 2.2 `MessageItem` ([`MessageItem.tsx`](file:///d:/social/components/messages/MessageItem.tsx))
- **Purpose:** Renders individual message bubbles with E2EE encryption status badge, reactions, reply quotes, and media attachment previews.
- **Children:** `ForwardMessageModal`, `MessageInfoModal`.

### 2.3 `MessageComposer` ([`MessageComposer.tsx`](file:///d:/social/components/messages/MessageComposer.tsx))
- **Purpose:** Rich text composer with file attachment encryptor and voice message recording preview.
- **Children:** `VoiceMessagePreview`.

### 2.4 `InspectorDeck` ([`InspectorDeck.tsx`](file:///d:/social/components/chat/InspectorDeck.tsx))
- **Purpose:** Developer and security debugging drawer displaying live Signal session state, ratchet indices, ciphertext hex inspection, and key bundle details.

---

## 3. View Components

- `PeopleDirectory`: User listing displaying public device keys, identity fingerprints, and presence badges.
- `GroupSpaceView`: Group chat space details, member roster, and SenderKey version indicator.
- `SecuritySettings`: Device management, public key bundle display, and Argon2id key backup export/restore dialogs.
- `AdminDashboard`: Administrative controls for generating single-use invitation tokens and viewing system metrics.
- `InviteFlow`: Auth page component for step-by-step invitation validation and account registration.
