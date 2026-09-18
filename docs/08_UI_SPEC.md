# 08_UI_SPEC.md — Baseline UI & Design Tokens Specification

This document records the **CURRENT** user interface layout, design system tokens, components, responsive breakpoints, and shell structures of Private Chat. **This document serves as the baseline before any UI/UX redesign.**

---

## 1. Application Layout Shell

The UI layout shell is defined in [`components/layout/AppShell.tsx`](file:///d:/social/components/layout/AppShell.tsx):
- **Desktop Layout:** 3-column layout consisting of:
  1. [`Header.tsx`](file:///d:/social/components/layout/Header.tsx): Top header bar containing app logo, active user role badge, search bar trigger, and user profile avatar.
  2. [`NavDeck.tsx`](file:///d:/social/components/layout/NavDeck.tsx): Left navigation sidebar containing navigation links (`Chats`, `Groups`, `People`, `Security`, `Admin`) and active conversation list.
  3. **Main Content Viewport:** Center canvas rendering [`ChatCanvas.tsx`](file:///d:/social/components/layout/AppShell.tsx), [`PeopleDirectory.tsx`](file:///d:/social/components/people/PeopleDirectory.tsx), [`GroupSpaceView.tsx`](file:///d:/social/components/groups/GroupSpaceView.tsx), [`SecuritySettings.tsx`](file:///d:/social/components/settings/SecuritySettings.tsx), or [`AdminDashboard.tsx`](file:///d:/social/components/admin/AdminDashboard.tsx).
- **Mobile Layout:** Single-column view with bottom navigation bar ([`MobileNav.tsx`](file:///d:/social/components/layout/MobileNav.tsx)).

---

## 2. Component Hierarchy & Categories

- **Application Shell:** `AppShell`, `Header`, `NavDeck`, `MobileNav`.
- **Chat & Conversation:** `ChatCanvas`, `InspectorDeck` (Signal session inspector), `MessageItem`, `MessageComposer`.
- **Modals & Dialogs:** `Dialog` ([`components/ui/dialog.tsx`](file:///d:/social/components/ui/dialog.tsx)), `ForwardMessageModal`, `MessageInfoModal`, `UserProfileModal`, `GlobalSearchModal`.
- **Views:** `PeopleDirectory`, `GroupSpaceView`, `SecuritySettings`, `AdminDashboard`.
- **Primitive Controls:** `Button` ([`components/ui/button.tsx`](file:///d:/social/components/ui/button.tsx)), `Badge` ([`components/ui/badge.tsx`](file:///d:/social/components/ui/badge.tsx)), `Input` ([`components/ui/input.tsx`](file:///d:/social/components/ui/input.tsx)).

---

## 3. Tailwind CSS Design System Tokens ([`tailwind.config.ts`](file:///d:/social/tailwind.config.ts))

- **Theme Palette:**
  - Dark Theme Foundation: `slate-950` (`#020617`), `slate-900` (`#0f172a`), `slate-800` (`#1e293b`).
  - Accent / Primary Colors: Emerald (`emerald-500` / `#10b981`), Cyan (`cyan-500` / `#06b6d4`), Blue (`blue-600` / `#2563eb`).
  - Warning / Security Badges: Amber (`amber-500`), Rose (`rose-500`).
- **Typography:** System font stack (`font-sans`), monospace font stack for key fingerprints (`font-mono`).
- **Borders & Radii:** Rounded corners (`rounded-lg`, `rounded-xl`, `rounded-full`). Border colors `slate-800` and `slate-700/50`.
- **Responsive Breakpoints:** Tailwind defaults (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`).
