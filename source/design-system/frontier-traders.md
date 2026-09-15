# Frontier Traders — the partnership, the design system, the surfaces

perp.so serves a second, fully-skinned instance of its perps product in Frontier
Traders' design language. FT is a partner brand with its own site, repo and
design system; we consume their system rather than approximating it, and we
contribute back through PRs on their repo.

This is a large surface that lives in three places at once (our repo, their repo,
and a preview service on this box), so read this before touching anything under
`/ftpaper` or `/frontier3123123`.

---

## The surfaces

| Route | Served by | What it is |
|---|---|---|
| `/ftpaper/trading` | our SPA | the paper terminal in FT skin (see [paper-trading.md](paper-trading.md)) |
| `/ftpaper/leaderboard` | our SPA | paper leaderboard, FT skin |
| `/ftpaper/explore` | our SPA | perps leaderboard board |
| `/ftpaper/trades`, `/ftpaper/live`, `/ftpaper/orders`, `/ftpaper/stats` | our SPA | top trades, live tape, decoded orders, venue stats |
| `/frontier3123123` | `frontier-preview.service` | FT's own Next.js app (branch `demo/profile`), nginx-proxied from `127.0.0.1:3123` |
| `/frontiers1` | `frontier-s1-preview.service` | Season One worktree, including the competition wall, desk and tokenless seat flow, from `127.0.0.1:3124` |

`/ftpaper` 301s to `/ftpaper/trading`. The `/frontier3123123` path is deliberately
unguessable — it is a private preview, not a public product.

The preview app is also where the FT **fonts and images** come from: our SPA loads
ABC Schengen A over `/frontier3123123/fonts/`, which nginx proxies. The typeface is
licensed to that deployment, which is why it is not vendored into our repo.

The Season One worktree is `/home/ubuntu/tsc-season-one` on
`season-one/profile-foundation`. Build it with
`NEXT_BASE_PATH=/frontiers1`; that value is compiled into client route helpers.
The operator proxy uses four separate arena authorities described in
[infrastructure.md](infrastructure.md). Their coordinated production rotation,
activation, and independent separation checks completed successfully on
2026-09-05.

The historical two-Hot practice path was exercised on retired `3.127.98.137`,
build `cb07c2359a0e8b4c`, by `ops-rehearsal-20260905001159` before the host move: both sealed warnings, two different Hot Markets,
Final Build, the frozen 500x Boost bankroll, three active bot seats, the final
board, and both draw and execution proofs completed without a readiness
override. The result is explicitly `practice=true`, not an official heat.

---

## Their repo

`~/trading-solana-com` (github: the Frontier Traders site). Branch layout is a
trap:

| Branch | Meaning |
|---|---|
| `master` | **production** |
| `dev` | dev |
| `main` | GitHub's default and **stale** — never base off it |
| `frontier-redesign` | the design system's home; base all redesign work here |
| `demo/profile` | our fork of the profile demo, what `frontier-preview.service` runs |

Read that repo's own `AGENTS.md` before working in it. Stack is Next.js on
Vercel with Drizzle and Torque.

---

## The design system (Linear TRD-294)

**`DESIGN_SYSTEM.md` at their repo root is the written source of truth.** If a
rule there and the code disagree, the code is wrong. Tokens are in
`src/app/globals.css` as `--frontier-*`; components in `src/components/ui/`.

### Ownership — nine frozen files

`DESIGN_SYSTEM.md`, `src/app/globals.css`, and
`src/components/ui/{frontier-components.css,containers,controls,motif,section-head,grid-icon,feature-row}`.
Feature branches must not edit them. A DS change goes through a PR on
`frontier-redesign`. **Map elements to existing `ui/` components; if nothing
fits, propose a new one and wait for sign-off — never fork a component to work
around a gap.**

### Values

| Role | Value |
|---|---|
| content | strong `#2d2b28` / subtle `#514f4b` / muted `#8e8c89` / inverse `#fff` |
| surface | page `#fff` / muted = card `#f9f9f8` / emphasized `#f0efee` / inverse `#514f4b` |
| border | extra-light `.08` / light `.12` / medium `.2` / strong `.48`, all `rgba(28,28,29,x)` |
| button | primary `#514f4b` (hover `#6f6c67`) — **not black**; secondary `rgba(28,28,29,.08)` |
| status | success `#479e6b`, warning `#eb8435`, danger `#e23f3e` (+ .12/.12/.10 tints) |
| radius | card-lg 24 / card-md 16 / card-sm 8; control 4; chip 2; pill 999 |

**Rules that are easy to get wrong:**
- Cards are a **flat** `surface-card` fill, no shadow, and **no stroke by
  default** — extra-light only if one is needed to separate from the page.
- Card radii are the **trio only**, never the raw scale, and peers in a row share
  one radius.
- **Gradients are a bug** anywhere except the campaigns panel and the
  execution proof-point stat cards.
- No page introduces a raw hex where a role token applies.
- Type: always the `.frontier-type-*` classes or the tokens; never a hardcoded
  size, line-height or weight.
- `reskin-preview/` and its `rp-*` values are **throwaway** and differ from the
  merged system. Never copy from it.

### Where we've applied it

- `/ftpaper` boards, 2026-08-06
- the profile demo (`/frontier3123123`), 2026-08-06
- the paper **terminal**, 2026-08-10 — see [paper-trading.md](paper-trading.md)

**Density adaptations, flagged not hidden.** The DS is an editorial marketing
system and our boards are dense data tables, so: labels take content-**subtle**
not content-muted (`#8e8c89` is ~3:1 on white, fine at 14-16px and too light at
11.5px), a pill nav strip where the DS TabBar is underline-style, h32 controls
where DS Input is 40, h20 small badges, and a hand-rolled dropdown.

**One column-header style, `FT_COL` in `src/lib/perps-ui.jsx`.** The DS has no
dense-table component, so this is the house convention: 11px / **450** / 0.6px
tracking / uppercase / content-**subtle** `#514f4b`. It had drifted three ways
(450 on the live tapes, 400 on the order tape because `fw(450)` folds to 400,
and 12/400/0.44-alpha on venue stats). Subtle, not muted, is the documented
density adaptation and it is measured: `#8e8c89` is 3.35:1 on white and 2.92:1
on the `#f0efee` header band, both under the 4.5:1 that 11px text needs;
`#514f4b` is 8.17:1 and 7.12:1.

**One dropdown, not one per page.** The DS has no Select, so we hand-roll -- but
`FtDrop` in `src/lib/perps-ui.jsx` is the only copy, and new controls take it.
Three independent hand-rolls (explore, the live tape's size filter, the order
tape's category filter) had already drifted: two rendered their menu items at
450 and one at 400, because that page's `fw()` weight mapper folds everything
under 500 down to body weight. Side by side in one row it read as two different
fonts. The shape is explore's: trigger h32 / 13px / 450 / radius 4, menu radius
8 with the three-layer shadow, items 13 on a 20px line. `search` turns the menu
into a combobox for long lists (markets).

**Focus is styled, not removed.** `.ft-ctl:focus-visible` takes a 2px
border-strong ring; the browser default is blue and belongs to no design
system. Native `<select>` elements cannot be styled to match and are gone from
FT surfaces for that reason.

**Open with Aaron:** the DS has no dense-table/leaderboard-row component
(`DataRow` is label/value only) and no Select/Dropdown — both proposed, awaiting
spec. Also whether the status tokens should own PnL data colours; we assumed yes
on the terminal, which also recolours the candles.

---

## Chrome extraction — the load-bearing pattern

`/ftpaper` wears FT's **real** chrome by extracting their CSS verbatim, not by
imitating it. `src/lib/ft-nav-css.js` holds:

| Export | Contents |
|---|---|
| `FT_NAV_CSS` | the nav: `tos-header` / `frontier-nav` / `tos-mobile-menu` / `frontier-btn` rules **and the `:root` token block** |
| `FT_HEADING_CSS` | `.tos-app-heading` / `.tos-kicker`, including their `<=520px` h1 rule |
| `FT_NAV_HOST_SHIM` | replicates their body typography scoped to `.tos-header` |
| `FT_TOKENS_CSS` | the `:root` block **sliced out of** `FT_NAV_CSS` at runtime |

Pulled by `scratchpad/extract-nav-css.py`. **Re-extract when they ship changes;
never hand-edit.**

### Gotchas paid for

- **Extracted CSS inherits from the HOST page.** Their `font: inherit` resolved
  to perp.so's Inter, so the nav rendered "not bold". Hence the host shim.
  **Verify with a computed-style diff against the demo, never by eye.**
- **perp.so's body is dark.** FT pages must paint html/body white and set the iOS
  theme-color via `useFtPageBackground()`, and restore on unmount — Safari's
  translucent bottom bar and overscroll sample the real body.
- **Tokens ship inside the nav.** Only the board surfaces mounted `FtSiteNav`, so
  the terminal ran with all nine `--frontier-*` roles **undefined** and any
  `var()` would have silently fallen back. `FT_TOKENS_CSS` exists for that, and
  it slices rather than copies so it cannot drift.
- The explore mobile filter sheet casts its shadow into the viewport while parked
  off-screen — invisible on dark, a grey band on white.
- Their nav is **demo parity exactly**: Campaigns / Explore / Announcements / VIP
  / Events plus a 40px avatar square with a 22px image. No Trade CTA, no Profile
  pill. Do not add to it.

### Deliberate terminal deviations

The boards follow FT's chrome exactly. The terminal does not, for reasons that
only apply to a trading screen:

| | Boards | Terminal | Why |
|---|---|---|---|
| nav position | fixed | **static** | 80px of permanent chrome is too expensive; owner call |
| 160px blur band | on | **off** | the market bar sits inside it and the prices were hazed |
| mobile bar | solid white <=720px | solid white **always** | same reason |

These are scoped by mounting the override `<style>` only on terminal views.

---

## Other FT work

- **FT World Cup** — the `/paper` engine is the competition tracker for it.
  Belgrade pilot, Seoul first broadcast, London final.
- **Record-trade share cards** — chart-receipt style built on real warehouse
  series with entry/cover chips. Typographic posters were rejected.
- **Engine transfer** — a `perpso/leaderboard-page` PR against
  `frontier-redesign`, plus a standalone engine repo.

---

## Rules of thumb

1. Base new redesign work on `frontier-redesign`, never `dev`, never `main`.
2. Never edit the nine DS files from a feature branch.
3. Re-extract chrome CSS; never hand-edit the extraction.
4. Verify any skin claim with a **computed-style diff**, not a screenshot. Every
   skin bug we have shipped looked correct in an image.
5. Flag density adaptations in a comment. They are legitimate, but a silent
   deviation reads as a mistake to the designer.
