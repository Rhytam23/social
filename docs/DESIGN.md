# Design system

How the product looks is defined in one place, so every screen can change together.

## Direction

Calm, minimal and a little futuristic, but human. A dark neutral palette with one restrained blue-cyan accent. Depth comes from soft shadows, a faint top edge light and spacing, not from glow. No gradients on UI, no neon, no heavy glass.

## Tokens

Everything lives in [`app/globals.css`](../app/globals.css) as CSS variables. The dark palette is the base (`:root`); light applies with `data-theme="light"`, or with `data-theme="system"` when the device prefers light (a `prefers-color-scheme` media query, so it follows the device live). **The default is `system`**: the app follows the device's light or dark setting unless the person chose Dark or Light in Settings (saved in `localStorage` as `private_chat_theme`). `lib/ui/themeScript.ts` sets the attribute before first paint so there is no flash.

| Group | Variables |
|---|---|
| Surfaces | `--canvas-bg`, `--surface-1`, `--surface-2`, `--surface-hover`, `--border-subtle`, `--border-strong` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted` |
| Accent | `--accent-primary`, `--accent-primary-hover`, `--accent-contrast`, `--accent-text`, `--accent-subtle`, `--accent-line` |
| Status | `--danger-neutral`, `--danger-subtle`, `--warning`, `--success`, and `--presence-*` |
| Depth | `--shadow-1`, `--shadow-2`, `--shadow-pop`, `--edge-light` |
| Shape and motion | `--radius-control`, `--radius-card`, `--motion-fast/base/slow`, `--ease-out` |

Tailwind reads the same variables ([`tailwind.config.ts`](../tailwind.config.ts)): the `slate` scale is the neutral ramp and the `emerald` scale is the **accent** ramp. The name `emerald` is historical; it is kept so existing classes follow the palette without touching every file. Change the accent by editing `--accent-*` once.

Type is Geist (sans and mono, loaded by `next/font` through the `geist` package, no network request at runtime). Handles, keys and codes use the mono face.

## Shared building blocks

Use these instead of writing long class strings.

- **`Button`** ([`components/ui/button.tsx`](../components/ui/button.tsx)). Variants: `primary`, `secondary`, `tertiary`, `danger`, `ghost`. Sizes `sm`, `md`, `lg`. No white or default-styled buttons anywhere.
- **`Input`** ([`components/ui/input.tsx`](../components/ui/input.tsx)) and the `.field` class for the rare raw control.
- **`.panel`** (a card) and **`.floating`** (menus, popovers, dialogs) classes.
- **`Dialog`, `Avatar`, `Badge`, `Switch`, `EmptyState`, `ErrorState`, skeletons, `Toast`** as before.
- **`.pressable`** for press feedback, **`.anim-message`**, **`.anim-view`** and **`.stagger`** for entrances.

The living style guide is at `/design-system` (development only).

## Motion and accessibility

All motion uses the tokens above and is switched off by the `prefers-reduced-motion` rule in `globals.css`. Focus rings, labels and contrast are part of the primitives.

## Landing page

[`components/landing/Landing.tsx`](../components/landing/Landing.tsx) is a server component: plain HTML with no client JavaScript, so it paints at once and search engines read it. It says only what the product does today (how messages are protected, what the server can see, the feature list, the known limits) and shows no invented conversations or screenshots. The buttons are links to `/login` and `/signup`, so they work before any script loads. Privacy and Terms use [`LegalPage.tsx`](../components/landing/LegalPage.tsx).

[`HomeGate`](../components/app/HomeGate.tsx) wraps it. A pre-paint script ([`lib/ui/themeScript.ts`](../lib/ui/themeScript.ts)) sets `data-session` on `<html>` when a Supabase sign-in cookie exists; CSS then hides the landing page and the gate loads the chat application ([`AppRoot`](../components/app/AppRoot.tsx)) on demand. A stale cookie is harmless: the application checks with the server and shows the landing page again.

Earlier versions used a scroll-driven three.js scene with illustrative message cards. It was removed: it cost roughly 325 kB of JavaScript on the first visit, depended on made-up content, and hid the real page text from anything that does not run scripts.

Signed-in visitors do not see the landing page: `/` opens the app directly.

## The chat screen

Say things once. "End-to-end encrypted" appears only in the chat header. Controls that are used rarely live in menus: the header has voice and video call and one options menu (`ChatHeaderMenu`), and each message has quick reactions, Reply and one "more" menu. Consecutive messages from one person in the same minute are grouped so the name and photo are not repeated. There is no footer anywhere inside the signed-in app; Settings is at the bottom of the left rail on desktop and in the bottom bar on phones. Warnings that matter (changed security code, failed delivery, offline) stay visible and are not folded into menus.

## Brand

The mark is a speech bubble with a keyhole cut out of it (`components/brand/Logo.tsx`), always one colour, drawn on a 32 unit grid. The wordmark is the lowercase word "nook" in the product font. The same paths feed the favicon (`app/icon.svg`), the home-screen icon (`app/apple-icon.tsx`) and the link preview (`app/opengraph-image.tsx`): change them together.

- Clear space of a quarter of the mark's height on every side; never smaller than 16 px.
- Use the accent text colour (`--accent-text`) on the app's surfaces; do not recolour outside the palette in `app/globals.css`, stretch, rotate or add shadows or gradients.
- The product name is `SITE_NAME` in `lib/site.ts`. Do not rename storage keys when renaming the product.

## Public pages and motion

Public pages (home, features, security, help, contact, privacy, terms) share `SiteHeader` and `SiteFooter` through `PageShell`. **Inside the signed-in app there is no header or footer of that kind.** Motion is progressive enhancement: the hero entrance (`.hero-in`) and scroll reveal (`.reveal`, activated by `RevealObserver`) leave everything visible without JavaScript and turn off with reduced motion. The 3D hero (`HeroScene`) is for computers only and is decided by `shouldRender3D` in `components/landing/capability.ts`; keep it abstract (no fake conversations, names or screenshots) and keep its chunk out of the first load.
