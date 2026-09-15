---
version: alpha
name: perp.so-design-system
description: "A Binance-dark trading canvas built on near-black #0b0e11 with a two-step surface ladder (#1e2329, #2b3139) and a single chromatic accent: Phoenix orange #FF6B35. The system reads as a live financial terminal: dense, data-first, hairline-ruled, quietly aggressive. Display type is Inter at 800-900 with tight negative tracking; eyebrows, numbers, and status tokens are set in JetBrains Mono with positive tracking. Cards are charcoal panels with 1px hairline borders and 14px corners; the dark canvas itself is the whitespace. Phoenix orange appears on the brand mark, the eyebrow kicker, primary CTAs, and active states, never as a fill. Two reserved semantic colors carry profit and loss (green #0ecb81 up, red #f6465d down) and are never used for branding. Two reserved identity colors tag the rival traders (amber #fb923c for @vibhu, cyan #22d3ee for @drews888)."

colors:
  brand: "#FF6B35"
  brand-soft: "#FF6B3520"
  brand-active: "#E55A2A"
  on-brand: "#181a20"
  canvas: "#0b0e11"
  surface-1: "#1e2329"
  surface-2: "#2b3139"
  hairline: "#2b3139"
  hairline-strong: "#3a424c"
  ink: "#eaecef"
  ink-muted: "#929aa5"
  ink-subtle: "#707a8a"
  ink-inverse: "#181a20"
  on-canvas: "#ffffff"
  pnl-up: "#0ecb81"
  pnl-down: "#f6465d"
  status-warn: "#f0b90b"
  trader-vibhu: "#fb923c"
  trader-drews: "#22d3ee"

typography:
  display-xl:
    fontFamily: Inter
    fontSize: 58px
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: -1.2px
  display-lg:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: -0.8px
  headline:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: -0.5px
  card-title:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.2px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  eyebrow:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 2.5px
  label:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.6px
  mono-num:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 14px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 22px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 10px 18px
  button-primary-hover:
    backgroundColor: "{colors.brand-active}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 10px 18px
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 16px
  card-elevated:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: 16px
  brand-chip:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    padding: 6px 13px
  status-badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px 9px
  filter-chip-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 7px 13px
  filter-chip-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 7px 13px
  text-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 12px
  tooltip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 8px 11px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    height: 56px
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 36px 22px
---

## Overview

perp.so is a live trading-terminal canvas. The anchor surface is `{colors.canvas}` (#0b0e11), a near-black with a faint blue-green tint borrowed from the Binance dark structure. Above it sits a two-step surface ladder: `{colors.surface-1}` (#1e2329) for cards and panels, `{colors.surface-2}` (#2b3139) for elevated and hovered surfaces. The same #2b3139 value doubles as the default `{colors.hairline}` border, so panels separate from the canvas by a single thin rule rather than by shadow. Body type is `{colors.ink}` (#eaecef), a light gray.

The single chromatic accent is **Phoenix orange** `{colors.brand}` (#FF6B35). It carries the brand mark, the eyebrow kicker, primary CTAs, active filter chips, and chart accents. A darker pressed variant (`{colors.brand-active}` #E55A2A) and a 12% alpha wash (`{colors.brand-soft}`) extend the same hue. Orange is never used as a large fill or a section background.

Two color families are reserved and must not be repurposed for branding:
- **PnL semantics**: `{colors.pnl-up}` (#0ecb81 green) and `{colors.pnl-down}` (#f6465d red). These mean profit and loss only.
- **Trader identity**: `{colors.trader-vibhu}` (#fb923c amber) and `{colors.trader-drews}` (#22d3ee cyan). These tag the two rival traders and nothing else.

Display type runs **Inter** at weight 800 to 900 with negative letter-spacing, scaling from -1.2px at the hero down to 0 at body. Eyebrows, status badges, numbers, and ID tokens run **JetBrains Mono**, with positive tracking on eyebrows (+2.5px) to mark them as taxonomy against the negative-tracked display.

**Key characteristics:**
- Dark trading canvas. `{colors.canvas}` #0b0e11 is the anchor, never #000000 true black.
- One chromatic accent only (Phoenix orange). Two reserved semantic colors (PnL up/green, down/red). Two reserved identity colors (trader amber, trader cyan).
- Two-step surface ladder (canvas to surface-1 to surface-2) carries hierarchy with hairline borders, not shadow.
- Inter 800-900 display with negative tracking; JetBrains Mono for every label, number, and eyebrow.
- Cards use `{rounded.xl}` 14px corners with a 1px `{colors.hairline}` border.
- Numbers are always mono and tabular. A trading terminal lives or dies on number legibility.

## Colors

> Source of truth: the `T` token object in `src/PhoenixShowdown.jsx`. Keep this file and that object in sync.

### Brand & Accent
- **Phoenix Orange** ({colors.brand}): The single accent. Brand mark, eyebrow kicker, primary CTA, active chip, chart stroke, link emphasis.
- **Brand Active** ({colors.brand-active}): Pressed/hover state of the primary CTA (#E55A2A).
- **Brand Soft** ({colors.brand-soft}): 12% alpha orange. Glows, soft-fill chips, the brand chip background.
- **On Brand** ({colors.on-brand}): Near-black #181a20 for text and icons sitting on an orange fill.

### Surface
- **Canvas** ({colors.canvas}): Default page background, #0b0e11. Paint this before CSS loads to avoid a white flash.
- **Surface 1** ({colors.surface-1}): One step up, #1e2329. Cards, panels, inputs, secondary buttons.
- **Surface 2** ({colors.surface-2}): Two steps up, #2b3139. Elevated/hovered cards, tooltips, status badges, selected toggles.
- **Hairline** ({colors.hairline}): 1px borders and dividers, #2b3139 (same value as surface-2).
- **Hairline Strong** ({colors.hairline-strong}): Hovered card border, #3a424c.

### Text
- **Ink** ({colors.ink}): All headlines and body, light gray #eaecef.
- **Ink Muted** ({colors.ink-muted}): Secondary type, #929aa5.
- **Ink Subtle** ({colors.ink-subtle}): Tertiary type, meta, footer, #707a8a.
- **Ink Inverse** ({colors.ink-inverse}): Near-black #181a20 for text on bright surfaces. WARNING: this is NOT body text. Setting it on a dark element renders black-on-black and looks blank.
- **On Canvas** ({colors.on-canvas}): Pure white, used sparingly for maximum-contrast marks.

### Semantic (reserved)
- **PnL Up** ({colors.pnl-up}): Profit, positive deltas, up arrows, "live" status (#0ecb81). Never a brand color.
- **PnL Down** ({colors.pnl-down}): Loss, negative deltas, down arrows, liquidation risk (#f6465d). Never a brand color.
- **Status Warn** ({colors.status-warn}): Amber #f0b90b for "in review" / caution states only.

### Identity (reserved)
- **Trader Vibhu** ({colors.trader-vibhu}): Amber #fb923c. Tags @vibhu in charts, rows, and avatars only.
- **Trader Drews** ({colors.trader-drews}): Cyan #22d3ee. Tags @drews888 only.

## Typography

### Font Family
- **Inter** carries display-xl through body. Weights 400, 700, 800, 900. Loaded from Google Fonts; falls back to `system-ui, sans-serif`.
- **JetBrains Mono** carries eyebrows, labels, status badges, and all numeric/ID tokens. Weights 400, 500, 700. Falls back to `ui-monospace, monospace`.

The split is functional, not decorative: prose is Inter, anything tabular or taxonomic (numbers, tickers, statuses, SIMD codes) is JetBrains Mono.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 58px | 900 | 1.04 | -1.2px | Hero headline (clamp 34px to 58px) |
| `{typography.display-lg}` | 44px | 800 | 1.08 | -0.8px | Big stat numbers, page-section openers |
| `{typography.headline}` | 28px | 800 | 1.15 | -0.5px | Section titles |
| `{typography.card-title}` | 17px | 700 | 1.3 | -0.2px | Card headings, row titles |
| `{typography.body-lg}` | 18px | 400 | 1.6 | 0 | Lede paragraphs |
| `{typography.body}` | 15px | 400 | 1.6 | 0 | Default body |
| `{typography.body-sm}` | 13px | 400 | 1.5 | 0 | Meta, captions, footer |
| `{typography.eyebrow}` | 12px | 700 | 1.3 | 2.5px | Section eyebrow / kicker (uppercase, orange) |
| `{typography.label}` | 11px | 700 | 1.2 | 0.6px | Status badges, chips, button labels (uppercase) |
| `{typography.mono-num}` | 14px | 500 | 1.4 | 0 | Prices, PnL, leverage, counts |

### Principles
- **Negative tracking on display** (-1.2px at the hero), tapering to 0 at body.
- **Eyebrows are mono and uppercase with +2.5px tracking** so taxonomy reads distinct from prose.
- **Every number is mono and weight 500.** Leverage renders via the `fmtLev` rule (Nx for >=10, one decimal otherwise, trailing .0 stripped).
- **Display weight is heavy** (800-900). This is a competitive trading brand, not a soft SaaS marketing voice.

## Layout

### Spacing System
- **Base unit**: 4px.
- **Tokens**: `{spacing.xxs}` 4px, `{spacing.xs}` 8px, `{spacing.sm}` 12px, `{spacing.md}` 16px, `{spacing.lg}` 22px, `{spacing.xl}` 32px, `{spacing.xxl}` 48px, `{spacing.section}` 64px.
- Card interior padding: `{spacing.md}` 16px standard, up to 22px on content-dense panels.
- Page gutter: 22px, in a centered container.

### Grid & Container
- Max content width 940px for reading/reference pages; the live app dashboard runs wider with multi-column fighter cards.
- Card grids: 3-up at desktop, collapsing to 1-up on mobile.
- Tables are reframed as stacked cards on mobile. Six-column tables do not survive a phone.

### Whitespace Philosophy
The dark canvas is the whitespace. Sections separate by lifting content onto `{colors.surface-1}` panels and by `{spacing.section}` 64px vertical rhythm, not by fields of white.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No border, no shadow | Body type, hero text, footer |
| 1 (panel) | `{colors.surface-1}` on canvas, 1px `{colors.hairline}` | Default cards, inputs |
| 2 (elevated) | `{colors.surface-2}`, 1px `{colors.hairline-strong}` on hover | Hovered cards, tooltips, selected toggles |
| 3 (glow) | `{colors.brand}` at low alpha, e.g. `0 0 60px {colors.brand-soft}` | Hero "campaign impact" panel, key CTA |

Depth is carried by the surface ladder plus hairlines. Drop shadows on the dark canvas are avoided. The one decorative exception is a soft Phoenix-orange glow on hero/CTA panels.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 6px | Status badges, small chips |
| `{rounded.md}` | 8px | Buttons, inputs, tooltips |
| `{rounded.lg}` | 12px | Inner tiles, chart frames, avatars-in-tiles |
| `{rounded.xl}` | 14px | Cards and panels (the default container radius) |
| `{rounded.pill}` | 9999px | Filter chips, brand chip, toggles, avatar circles |

## Components

### Buttons
**`button-primary`** orange CTA. Background `{colors.brand}`, text `{colors.on-brand}`, type `{typography.label}` uppercase, rounded `{rounded.md}`, padding 10px 18px. Hover shifts to `{colors.brand-active}`.

**`button-secondary`** charcoal button. Background `{colors.surface-1}`, text `{colors.ink}`, 1px `{colors.hairline}` border, otherwise identical geometry.

### Chips & Badges
**`brand-chip`** the brand mark pill. Background `{colors.brand-soft}`, text `{colors.brand}`, type `{typography.eyebrow}`, rounded `{rounded.pill}`. Often paired with a glowing orange dot.

**`status-badge`** small mono pill with a colored LED dot. Background tinted from the status color at low alpha, text in the status color, type `{typography.label}` uppercase, rounded `{rounded.sm}`. Status palette: live uses `{colors.pnl-up}`, building/active uses `{colors.brand}`, in-review uses `{colors.status-warn}`, design/research use `{colors.ink-muted}` / `{colors.ink-subtle}`.

**`filter-chip-default`** / **`filter-chip-active`** pill toggle. Default is transparent with a `{colors.hairline}` border and `{colors.ink-muted}` text; active fills `{colors.brand}` with `{colors.on-brand}` text at weight 700.

### Cards & Containers
**`card`** the default panel. Background `{colors.surface-1}`, 1px `{colors.hairline}` border, rounded `{rounded.xl}` 14px, padding `{spacing.md}`. Hover lifts the border to `{colors.hairline-strong}`.

**`card-elevated`** featured/hovered variant on `{colors.surface-2}`.

### Inputs
**`text-input`** background `{colors.surface-1}`, text `{colors.ink}`, rounded `{rounded.md}`, padding 10px 12px. Focus ring is a 2px `{colors.brand}` outline. Note: with React-controlled inputs, set values through the framework, not by writing `.value` directly.

### Surfaces
**`tooltip`** background `{colors.surface-2}`, 1px `{colors.hairline}`, rounded `{rounded.md}`, type `{typography.body-sm}`.

**`top-nav`** sticky bar on `{colors.canvas}` with a blur backdrop and a 1px bottom hairline. Brand chip left, link/CTA right, height 56px.

**`footer`** dense link area on `{colors.canvas}`, `{colors.ink-subtle}` text, top hairline.

## Do's and Don'ts

### Do
- Anchor on `{colors.canvas}` #0b0e11. Paint it before CSS loads.
- Use `{colors.brand}` orange only for: brand mark, eyebrow, primary CTA, active state, chart accent, link emphasis.
- Set numbers in JetBrains Mono, weight 500, tabular.
- Use the two-step surface ladder plus hairlines for hierarchy.
- Reserve green/red strictly for PnL and amber/cyan strictly for the two traders.
- Reframe tables as stacked cards on mobile.
- Use `{rounded.xl}` 14px for cards, `{rounded.md}` 8px for buttons.

### Don't
- Don't ship a light-mode page. This is a dark trading terminal.
- Don't use `#000000` true black as the canvas.
- Don't use orange as a card fill or section background.
- Don't repurpose PnL green/red or the trader amber/cyan for decoration or branding.
- Don't set `{colors.ink-inverse}` (#181a20) as text on a dark surface. It renders invisible.
- Don't introduce a second chromatic accent.
- Don't use em-dashes in published copy. Use periods, commas, or colons.
- Don't render prices or leverage in a proportional font.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Desktop | 1280px | Default multi-column layout |
| Tablet | 1024px | Card grids 3-up to 2-up |
| Mobile | 640px | Single column; tables become stacked cards; hero scales down |

### Collapsing Strategy
- Card grids: 3-up to 1-up below 640px.
- Six-column tables reflow into stacked cards (label/value pairs).
- Hero display scales from 58px toward ~34px via `clamp()`.
- Sticky bars (top-nav, filter bar) stack; the filter bar sits directly under the 56px nav.

### Touch & Mobile Gotchas
- Tap targets hold >=40px height.
- Mobile font-size shrink rules in CSS must target the actual rendered desktop value. Stale selectors silently no-op.
- Reset scrub/hover state on `onTouchEnd` and `onTouchCancel`, not only `onMouseLeave`. Mobile lift does not fire mouse-leave.

## Iteration Guide
1. Reference each component by its `components:` token name.
2. Decide first which surface level a new section lives on (canvas, surface-1, or surface-2).
3. Default body to `{typography.body}`; default container to `{components.card}`.
4. Keep this file in sync with the `T` object in `src/PhoenixShowdown.jsx`. That object is the runtime source of truth.
5. Treat orange as scarce: brand, eyebrow, primary CTA, active state, chart accent.
6. Any new color must justify itself against the "one accent, two reserved semantic, two reserved identity" rule.

## Known Gaps
- Inter and JetBrains Mono are the implemented families; the `T` object stores colors but not a formal type scale, so the typography tokens here are codified from inline JSX styles and the Solana Perps Roadmap page rather than a central variable set.
- Light-mode tokens (`softLight`, `hairlineLight` in the `T` object) exist for share-card/canvas export contexts only. The web UI does not ship a light theme.
- Chart-specific styling (recharts page charts, lightweight-charts candle markers) follows this palette but has its own per-library config not captured here.
- This spec describes the perp.so web surface. Telegram, share cards, and recap PNGs reuse the palette but have format-specific layout rules.
