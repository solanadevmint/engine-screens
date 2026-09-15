# Frontier Traders engine screens

Every screen the competition engine puts on a wall, a stream, a trader's terminal
or the operator's desk, at full resolution, in the order a night runs. This is the
design reference for the show described at https://paper.perp.so/engine; a copy
of that page is in `web/` for offline reading.

Nothing here is a mockup drawn by hand. Every wall screen is rendered by the real
wall code (`source/styles/wall.css`) from a state mock in `source/mocks/`, and the
terminal and desk screens are captures of the live product during a practice
round. Redesign against these and the result can be dropped straight back into
the wall.

## Sizes and safe areas

| Surface | Pixels | Notes |
|---|---|---|
| Venue wall | 2620 x 1310 (2:1) | Camera frames in the four corners are placeholders labelled `CAMERA / SEAT n`; the bottom safe band is black because desks sit in front of it. The frames only appear during a round, never between rounds. |
| X stream | 1920 x 1080 (16:9) | Full frame, nothing reserved for cameras. |
| Keyed | 2620 x 1310 | Same as the venue wall with the frames painted for chroma key. |
| Terminal | responsive web | Captures at 1400 wide. |
| Desk | responsive web | Operator laptop, captures at 1440 wide. |

The wall shows one score per seat, always ordered by score. Faces are square
with a small radius. Green and red are PnL only. Orange is the Hot Market; the
Boost moments and the liquidation flash are black on red.

## The night, screen by screen (`screens/venue/`)

| # | File | When it shows |
|---|---|---|
| 1 | `01-before-the-bell` | Before a round. What is next, when it starts, the whole night down the left, the four about to play. No frames. |
| 2 | `02-board` | Most of the round. Rank, face, name, the market each seat is in, one score. The rail under the headline shows the six beats of the round. |
| 3 | `03-rank-moves` | A seat that just overtook another gets a small arrow beside its name and a two-second flash. Row size never changes. |
| 4 | `04-hot-warning` | Fifteen seconds before a Hot Market the board dims under a count. Which asset stays secret. |
| 5 | `05-hot-slam` | At zero the asset fills the wall for a beat. |
| 6 | `06-hot-board` | The two-minute Hot window. Same order, same score; a heavier "Hot" line under each score says what the hot asset has done to it. |
| 7 | `07-boost-count` | The last fifteen seconds of the final build, in red, over the dimmed board. |
| 8 | `08-boost-slam` | The multiplier fills the wall for a beat. |
| 9 | `09-boost-board` | The last three minutes at 500x. Red, set in black, multiplier as the headline. |
| 10 | `10-race-view` | Desk can swap the board for every seat's score through the round as a line. |
| 11 | `11-boost-chart` | The race view narrowed to the last five minutes while Boost is open. |
| 12 | `12-heart-rate` | The same chart for pulse, from chest straps paired on the desk. |
| 13 | `13-the-bell` | The chart holds for twelve seconds at the end, winner at full weight. |
| 14 | `14-result` | Winner in the header, each seat with a through or out tag, the winner's round in four figures. |
| 15 | `15-between-rounds` | The night filled in: who won each round, the four who came through outlined in green. No frames. |
| 16 | `16-final` | The same board with two seats; rows scale to fill the wall, one line under the board says who leads and by how much. |
| 17 | `17-liquidation-flash` | At any time. Red for two and a half seconds when a seat's position is liquidated. |
| 18 | `18-cover` | At any time. One button on the desk, deliberately plain. |
| 19 | `19-keyed-for-chroma` | The venue wall with camera frames painted for the mixer. |
| 20 | `20-player-announcement-proposal` | **Proposal, not in the wall yet.** Before a round, one seat at a time: face, WELCOME, name, handle, and a stat row. Between rounds, so no camera frames. |
| 21 | `21-round-lineup-proposal` | **Proposal, not in the wall yet.** The four seats of the coming round as tall cards with faces, names and handles, the round number down the right. |

`screens/stream/` holds the 16:9 X stream versions of the board, the Hot board,
the final, the liquidation flash and the result. `screens/between-rounds/`
repeats the no-frame screens plus the retired sealed-draw card for reference.

## The two proposed screens

Screens 20 and 21 are first renders in the wall's own style, made from the mocks
`source/mocks/s-wall-intro-4.html` and `s-wall-lineup-4.html`, so designers start
from the real frame, fonts and safe band rather than a blank canvas. They are
briefs as much as screens:

- **Player announcement (20).** One seat, shown in seat order while the four
  take their places. What the engine can fill today: face, display name,
  handle, seat number, round number, and tonight's record (placings so far,
  best round, Hot Markets won). Country flag, age, height or a tagline do not
  exist in the data; if the design wants them, they become a field in the
  desk's seat editor.
- **Round lineup (21).** The four seats of the coming round. Same fields.
  Faces are the square profile pictures traders upload; the reference shows
  cut-out studio portraits, which would need a shoot per player and a wider
  aspect than the 1:1 the desk stores today.

Both show between rounds, so no camera frames; the bottom safe band stays.

## Terminal and desk

`screens/terminal/`: the trader's page (chart, ticket, position, standing), the
stage line that names the hot asset and counts it down, the page during a Hot
window and during Boost, and the seat's card.

`screens/desk/`: the operator's control room between rounds, and the full desk.

## Web versions

`web/figures/` holds every figure at 1200 px as AVIF, WebP and JPEG, the set the
public page serves. `web/engine.html` is the page itself, rewired to those
figures, so it opens from disk.

## Source

- `source/styles/wall.css` is the wall. `comp.css` is the desk and the shared
  competition chrome. `comp-wall-view.ts` is the round sequence the rail labels
  come from.
- `source/mocks/` are the state mocks each wall screen was rendered from
  (`s-` venue with frames and safe band, `t-` between rounds, `p-` stream). They
  link the bundled stylesheet, so they open in a browser as they are.
- `source/design-system/` has the perp.so design system (`perp-so-DESIGN.md`)
  and the Frontier Traders design notes and tokens.

## Regenerating

`tools/shoot-all-2620.mjs`, `shoot-all-1080.mjs` and `shoot-race-2620.mjs`
render the mocks with headless Chromium at wall size; `shoot-desk.mjs` captures
the desk; `compose-engine-page.py` builds the explainer page from the figures.
Paths inside them point at the production boxes and are here for reference.

## Working on a redesign

Keep the numbering when you export: `02-board.png`, `06-hot-board.png`, and so
on, at 2620 x 1310 for the wall and 1920 x 1080 for the stream. If a screen
changes its rules, not only its look, say so in the pull request; the wall code
and the engine both encode the rules described above.
