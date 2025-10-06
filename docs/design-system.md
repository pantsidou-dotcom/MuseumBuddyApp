# MuseumBuddy Design System

This document describes the shared design language that now powers the MuseumBuddy web app. It translates the visual direction into reusable tokens, components, interaction guidance, and content principles so designers and developers can iterate consistently.

## Foundations

### Typography
- **Sans family** — `var(--ds-font-family-sans)` / `Inter` for body copy.
- **Brand family** — `var(--ds-font-family-brand)` / `Inter` for headings and lockups.
- **Font weights** — regular (400), medium (500), semibold (600), bold (700) defined as `var(--ds-font-weight-*)`.
- **Line length** — standard body copy is set to 1.65 line-height and the hero headings use negative letter-spacing for impact.

### Spacing scale
All spacing is derived from a 4px base unit and exposed as custom properties for layout utilities:

| Token | Value |
| --- | --- |
| `--ds-space-1` | 4px |
| `--ds-space-2` | 8px |
| `--ds-space-3` | 12px |
| `--ds-space-4` | 16px |
| `--ds-space-5` | 20px |
| `--ds-space-6` | 24px |
| `--ds-space-7` | 28px |
| `--ds-space-8` | 32px |

The legacy spacing utilities (`--space-8`, `--space-16`, …) now reference these tokens.

### Color tokens
Light and dark modes share the same semantic palette:

- `--ds-color-background` / `--ds-color-surface` — base surfaces.
- `--ds-color-surface-elevated` — cards and panels.
- `--ds-color-text-strong` / `--ds-color-text-default` / `--ds-color-text-muted` — body copy levels.
- `--ds-color-primary`, `--ds-color-primary-strong`, `--ds-color-primary-soft`, `--ds-color-primary-contrast` — brand accent colors.
- `--ds-color-border-subtle`, `--ds-color-border-strong` — separator strokes.
- `--ds-color-focus-outline`, `--ds-color-focus-shadow` — accessible focus rings.

Shadow tokens (`--ds-shadow-sm`, `--ds-shadow-md`, `--ds-shadow-lg`) provide consistent elevation.

### Radii
- `--ds-radius-sm` = 12px
- `--ds-radius-md` = 16px
- `--ds-radius-lg` = 20px

These values map to component-specific radii so cards, badges, and navigation elements align.

## Component library

### Button
Defined in [`components/ui/Button.js`](../components/ui/Button.js) and styled via `.ds-button` classes.

Variants:
- `primary` — uses the brand gradient and contrast foreground, with hover and pressed states.
- `secondary` — subtle filled button for secondary CTAs.
- `ghost` — transparent surface button for navigation utilities (language switch, filters).

Sizes: `sm`, `md`, `lg` (default `md`). Buttons accept optional icons (`icon`, `iconPosition`). Links automatically render as `<Link>` when `href` is provided.

States:
- Focus uses the shared focus ring tokens.
- Disabled and `aria-disabled="true"` reduce opacity and remove shadows.
- Pressed (`aria-pressed="true"`) keeps the button in its active color.

### Badge
[`components/ui/Badge.js`](../components/ui/Badge.js) provides pill counters used in navigation. Variants `neutral` and `solid` combine with `tone="brand"` to match the accent palette.

### Navigation system
[`components/ui/Navigation.js`](../components/ui/Navigation.js) exports `NavBar`, `NavSection`, `NavLink`, and `NavButton`.

- Navigation links inherit `.ds-nav__link` styling with hover, active, and focus-visible states.
- `NavLink` accepts an `active` prop for aria-current styling and an optional badge (used for favorites count).
- `NavButton` is used for actions such as opening filters. The language switch reuses the shared `Button` component with the ghost variant.

### Card
Cards adopt the `.ds-card` class. Existing museum and exposition cards now layer their bespoke layout on top of a consistent elevated surface with hover transitions.

### Layout header
`components/Layout.js` composes the new navigation primitives into a sticky header with a brand lockup (`.ds-brand`), nav sections, and action area.

## Interaction and states
- **Focus** — `.ds-button`, `.ds-nav__link`, and `.ds-brand` use the same dual-ring focus treatment for clarity on light and dark surfaces.
- **Hover** — primary buttons and navigation items lift via shared shadow tokens instead of ad-hoc transforms.
- **Pressed** — navigation items compress slightly and toggle states make use of `aria-pressed` so assistive tech reflects the change.
- **Motion** — transitions fall back to no animation when `prefers-reduced-motion` is detected.

## Imagery guidance
- All content images now use [`next/image`](https://nextjs.org/docs/api-reference/next/image) for responsive loading and built-in optimisations. Static assets remain unoptimised in export mode via `next.config.js`.
- Use `fill` for decorative hero media (`secondary-hero__image`) and set `sizes` to describe layout breakpoints.
- Provide explicit `width`/`height` for illustrations (`favorites-empty.svg`) to avoid CLS.
- Always include meaningful `alt` text; pass an empty string only for decorative placeholders (e.g., abstract exposition artwork).

## Microcopy principles
- Tone is warm, concise, and directive. Avoid placeholder text like “TODO”; communicate roadmap status when features are unavailable.
- CTAs use verbs that describe the action: “Browse museums” instead of “Discover museums”.
- Empty states suggest the next step (“Bookmark museums and exhibitions to build your next cultural outing.”).
- Error and zero states explain what to try next (“No matches yet. Adjust your filters or search to explore more museums.”).

Keep this document aligned with future UI changes so the system stays coherent for both design and engineering.
