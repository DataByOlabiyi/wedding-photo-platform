# DESIGN.md — SnapEvent Design System

This file is the design source of truth for SnapEvent — a living system spec and the sanctioned exception to the no-root-markdown rule in CLAUDE.md.

---

## Brand direction

Paper-and-ink editorial, documentary-photography-forward. The interface reads like a well-set photo book: warm ivory paper, near-black ink, restrained champagne and blush accents. Chrome recedes; guests' photographs are the color in the room. Nothing glossy, nothing bouncy, nothing that competes with the pictures.

---

## Palette

All colors are oklch. Token names match `app/globals.css` exactly; components consume tokens only — never raw color values.

### Light (public routes — default)

| Token | Value | Role | Contrast note |
|---|---|---|---|
| `--background` | `oklch(0.975 0.011 85)` | Warm ivory page | — |
| `--foreground` | `oklch(0.245 0.022 55)` | Warm near-black ink | AA+ on background (~11:1) |
| `--card` / `--popover` | `oklch(0.99 0.006 88)` | Paper surface, one step lighter | — |
| `--card-foreground` / `--popover-foreground` | `oklch(0.245 0.022 55)` | Ink on paper | AA+ |
| `--primary` | `oklch(0.28 0.028 55)` | Ink button fill | AA+ with `--primary-foreground` |
| `--primary-foreground` | `oklch(0.975 0.011 85)` | Ivory on ink | AA+ |
| `--secondary` | `oklch(0.925 0.028 85)` | Champagne wash | pair with `--secondary-foreground` (AA) |
| `--secondary-foreground` | `oklch(0.35 0.035 60)` | Deep warm brown | AA on secondary |
| `--muted` | `oklch(0.945 0.014 82)` | Quiet fill | — |
| `--muted-foreground` | `oklch(0.47 0.025 60)` | Secondary text | AA (≥4.5:1) on background and card |
| `--accent` | `oklch(0.936 0.022 30)` | Blush wash (hover fills) | pair with `--accent-foreground` |
| `--accent-foreground` | `oklch(0.30 0.05 30)` | Deep blush ink | AA on accent |
| `--destructive` | `oklch(0.54 0.20 27)` | Error red | AA with `--destructive-foreground` |
| `--destructive-foreground` | `oklch(0.98 0.008 80)` | Ivory on red | AA |
| `--success` | `oklch(0.52 0.13 150)` | Confirmation green | AA with its foreground |
| `--success-foreground` | `oklch(0.985 0.005 90)` | | |
| `--warning` | `oklch(0.78 0.13 80)` | Amber fill — never text | pair with dark `--warning-foreground` |
| `--warning-foreground` | `oklch(0.28 0.03 55)` | | AA on warning |
| `--border` | `oklch(0.885 0.018 80)` | Hairlines | decorative, no contrast requirement |
| `--input` | `oklch(0.86 0.02 78)` | Input borders (slightly darker for affordance) | ≥3:1 non-text vs card |
| `--ring` | `oklch(0.55 0.11 70)` | Focus ring, champagne | ≥3:1 vs background |
| `--chart-1..5` | see globals.css | Data series | see dataviz rules |
| `--radius` | `0.5rem` | Base radius | — |
| `--sidebar-*` | see globals.css | Mirror of surface/primary/accent for sidebar chrome | same pairings as above |

### Dark (dashboard, superadmin, onboarding)

| Token | Value | Role | Contrast note |
|---|---|---|---|
| `--background` | `oklch(0.185 0.012 55)` | Warm charcoal | — |
| `--foreground` | `oklch(0.955 0.012 85)` | Warm off-white | AA+ (~13:1) |
| `--card` / `--popover` | `oklch(0.225 0.014 55)` | Raised surface | — |
| `--primary` | `oklch(0.82 0.085 85)` | Champagne fill | AA+ with `--primary-foreground` `oklch(0.22 0.02 55)` |
| `--secondary` / `--muted` | `oklch(0.27 0.016 55)` | Quiet fills | — |
| `--muted-foreground` | `oklch(0.72 0.02 80)` | Secondary text | AA on background and card |
| `--accent` | `oklch(0.30 0.025 40)` | Warm hover fill | AA with foreground |
| `--destructive` | `oklch(0.58 0.20 27)` | Error red | AA with `oklch(0.98 0.01 80)` |
| `--success` | `oklch(0.70 0.14 150)` | Green fill | pair with dark `--success-foreground` |
| `--warning` | `oklch(0.80 0.12 82)` | Amber fill | pair with dark `--warning-foreground` |
| `--border` | `oklch(0.30 0.015 55)` | Hairlines | — |
| `--input` | `oklch(0.32 0.016 55)` | Input borders | — |
| `--ring` | `oklch(0.72 0.08 85)` | Focus ring | ≥3:1 vs background |
| `--sidebar` | `oklch(0.165 0.012 55)` | Sidebar sinks below page | — |

---

## Typography

Three families, loaded in `app/layout.tsx`:

| Family | Token | Source | Range / axes |
|---|---|---|---|
| Fraunces | `--font-serif` | next/font/google | variable; axes `opsz` + `WONK`; normal + italic |
| Switzer | `--font-sans` | `app/fonts/Switzer-Variable.woff2` (local) | variable, weight 300–700 |
| JetBrains Mono | `--font-mono` | next/font/google | 400, 500 |

Usage rules:

- **Serif (Fraunces)** for display, headings, and card titles only. Never in buttons, form labels, or navigation.
- **WONK** is off by default. Enable only on display-level text via the `.font-display-wonk` utility (`font-variation-settings: 'WONK' 1`). At most one WONK element per page. Never in the dashboard.
- `font-optical-sizing: auto` is set on `body`, so Fraunces tracks its `opsz` axis automatically.
- **Sans (Switzer)** is the workhorse: body, UI, labels, nav. Weights 300–700 available; default body weight 400.
- **Mono (JetBrains Mono)** for numerics only: photo counts, dates, PINs, file sizes. Never for prose.
- **Eyebrow pattern**: `text-caption uppercase tracking-[0.09em] text-muted-foreground/80`.
- **Italic accent span**: a single serif-italic phrase for editorial emphasis. One per viewport, maximum.

### Type scale

Six levels, defined as Tailwind `@theme` tokens in `app/globals.css` — use the utilities, not ad-hoc sizes.

| Utility | Size | Line height | Tracking | Weight | Face |
|---|---|---|---|---|---|
| `text-display` | 2.75rem | 1.05 | -0.02em | 560 | Fraunces |
| `text-heading` | 2rem | 1.15 | -0.015em | 520 | Fraunces |
| `text-subheading` | 1.375rem | 1.3 | -0.01em | 500 | Fraunces |
| `text-body` | 1rem | 1.6 | 0 | 400 | Switzer |
| `text-caption` | 0.8125rem | 1.45 | 0.01em | 450 | Switzer |
| `text-data` | 0.875rem | 1.5 | 0 | 450 | JetBrains Mono |

---

## Primitives

Radius map (fixed, do not improvise):

| Element | Radius |
|---|---|
| Photo thumbnails | 4px (`rounded-sm`) |
| Buttons, inputs | 8px (`rounded-lg`) |
| Cards, dialogs | 12px (`rounded-xl`) |
| Badges, avatars | full (`rounded-full`) |

- **Two shadow levels only**: the inset-highlight button shadow and the card shadow (`0 1px 2px` + `0 8px 24px -12px`, warm-ink tinted). No other shadows.
- **Badges**: copy is 1–3 words, uppercase, tracked. Colors via tokens.
- **Interactive card hover** (lift, border shift) is applied at the call site, never baked into the `Card` primitive.
- UI primitives in `components/ui/` carry no business logic and consume tokens only.

---

## Motion

Principles:

- Animate only: opacity, transforms of ≤12px, shadow, color. Never layout properties, font metrics, photo zooms, or infinite loops.
- Durations: **150ms** (interaction feedback), **250ms** (state changes), **600ms** (entrance reveals).
- Easings: `--ease-snap: cubic-bezier(0.2, 0, 0, 1)` for feedback; `--ease-reveal: cubic-bezier(0.16, 1, 0.3, 1)` for entrances.
- Reduced motion: every entrance animation is gated behind `prefers-reduced-motion: no-preference` (CSS) or a matchMedia check (`components/reveal.tsx`). Default state is fully visible — no rule outside the gates may hide content.
- Stagger: 60ms steps, maximum 4 items.
- `.scroll-reveal` (scroll-driven, `animation-timeline: view()`) for below-fold sections; `<Reveal>` (IntersectionObserver, one-shot) where staggering or JS control is needed.

---

## Spacing

- 4px grid — every gap, padding, and margin is a multiple of 4.
- Section rhythm: `py-16 sm:py-24`.
- Page gutters: `px-4`.
- Containers: `max-w-3xl` (prose), `max-w-4xl` (marketing sections), `max-w-6xl` (dashboards/grids).

---

## Theme routing

`components/theme-provider.tsx` routes by pathname:

- **Light (forced)**: `/`, `/e/*`, `/gallery/*`, `/guest/*`, `/legal/*`, `/support*`, `/auth/*` — guests always get the paper-light experience.
- **Dark (default, toggleable)**: `/dashboard`, `/superadmin`, `/onboarding` — hosts work in the studio.

---

## Color discipline

- Champagne (`--secondary`, `--warning`) and blush (`--accent`) are wash/fill colors — **never text on ivory**. Text on those fills uses their paired `-foreground` tokens.
- Numbers are always mono (`text-data`).
- Photographs supply the saturation; UI chrome stays within the ink/ivory/champagne/blush set.
