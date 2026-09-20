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
| Status | `--danger-neutral`, `--warning`, `--success` (+ `-subtle`), and `--presence-*` |
| Depth | `--shadow-1`, `--shadow-2`, `--shadow-pop`, `--edge-light` |
| Shape and motion | `--radius-control`, `--radius-card`, `--motion-fast/base/slow`, `--ease-out` |

Tailwind reads the same variables ([`tailwind.config.ts`](../tailwind.config.ts)): the `slate` scale is the neutral ramp and the `emerald` scale is the **accent** ramp. The name `emerald` is historical; it is kept so existing classes follow the palette without touching every file. Change the accent by editing `--accent-*` once.

Type is Geist (sans and mono, loaded by `next/font` through the `geist` package, no network request at runtime). Handles, keys and codes use the mono face.

## Shared building blocks

Use these instead of writing long class strings.

- **`Button`** and **`IconButton`** ([`components/ui/button.tsx`](../components/ui/button.tsx)). Variants: `primary`, `secondary`, `tertiary`, `danger`, `ghost`. Sizes `sm`, `md`, `lg`. No white or default-styled buttons anywhere.
- **`Input`, `Textarea`, `Select`** ([`components/ui/input.tsx`](../components/ui/input.tsx)) and the `.field` class for the rare raw control.
- **`.panel`** (a card) and **`.floating`** (menus, popovers, dialogs) classes.
- **`Dialog`, `Avatar`, `Badge`, `Switch`, `EmptyState`, `ErrorState`, skeletons, `Toast`** as before.
- **`.pressable`** for press feedback, **`.anim-message`**, **`.anim-view`** and **`.stagger`** for entrances.

The living style guide is at `/design-system` (development only).

## Motion and accessibility

All motion uses the tokens above and is switched off by the `prefers-reduced-motion` rule in `globals.css`. The landing scene checks the same setting and does not start at all. Focus rings, labels and contrast are part of the primitives.

## Landing page

[`components/landing/`](../components/landing). A scroll-driven story (messages, threads, communities, then "Enter app") over a WebGL scene.

- **One source of content.** [`sceneContent.ts`](../components/landing/sceneContent.ts) lists the sample objects (a message, a profile, a channel list, an envelope showing the plaintext and the ciphertext the server stores) and where each sits in every chapter. The WebGL scene ([`HeroScene.tsx`](../components/landing/HeroScene.tsx), textures from [`paintCards.ts`](../components/landing/paintCards.ts)) and the DOM version ([`SceneCards.tsx`](../components/landing/SceneCards.tsx)) both read it. Everything shown is sample content.
- **Plain three.js**, not React Three Fiber (its peer range does not accept the React version in this project). It loads through `next/dynamic` from the landing page only, so the signed-in app never downloads it.
- **Progressive.** The first paint is the DOM version, which is also the poster while the scene loads. The scene starts only when `shouldRender3D` ([`sceneMath.ts`](../components/landing/sceneMath.ts)) says the device can take it: not with reduced motion, data saver, no WebGL, 2 GB of memory or fewer, or 2 cores or fewer. Those visitors get the same story as still compositions.
- **Self-protecting.** The scene renders only while visible, caps pixel ratio at 1.5, and measures its own frame time: if it is slow it drops shadows and resolution, and if that is not enough it hands over to the still version. A lost WebGL context does the same.
- **Preview.** `/design-system/landing` shows the landing page without a Supabase project (`?still=1` forces the still version). Development only.

The page and the sign-in screens follow the theme. The floating product cards are deliberately pinned to the dark palette (`data-theme="dark"` on the stage in `SceneCards.tsx`; the WebGL cards use fixed colours in `paintCards.ts`) because they are mock product screens. The voice and video call overlay is also always dark.

Signed-in visitors never see the landing page: `/` opens the app directly. Everyone else reaches the existing sign-in and sign-up screens from "Enter app" and "Create account".
