#!/usr/bin/env python3
"""Compose the engine page in its reader-first order.

Figures for the wall come from the current renders on disk (camera frames drawn
as placeholders); the live terminal and desk screenshots are carried over from
the previous master by caption. Special blocks (round timeline, tables) are
carried over verbatim.
"""
import base64, io, re
from PIL import Image

S = '/tmp/claude-1000/-home-ubuntu/1351a65c-4727-4a61-8524-0b6659748271/scratchpad'
old = open(f'{S}/engine-page.before-rewrite.html').read()  # stable captions for carried figures
head = old[:old.find('<section')]
tail = old[old.rfind('</section>') + len('</section>'):]

def jpg(path, w=1600):
    im = Image.open(path).convert('RGB')
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=82, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

# figures carried over from the old master, by caption
carried = {}
for m in re.finditer(r'(<img src="data:image/(?:jpeg|png);base64,[^"]+"[^>]*>)\s*<figcaption>(?:<b>)?([^<]*)', old):
    carried[m.group(2).strip()] = m.group(1)

def fig_file(path, caption, narrow=False):
    cls = 'fig-narrow' if narrow else 'fig-wide'
    return f'  <figure class="{cls}">\n    <img src="{jpg(path)}" alt="">\n    <figcaption>{caption}</figcaption>\n  </figure>\n'

def fig_old(key, caption, narrow=False):
    cls = 'fig-narrow' if narrow else 'fig-wide'
    img = carried[key]
    return f'  <figure class="{cls}">\n    {img}\n    <figcaption>{caption}</figcaption>\n  </figure>\n'

W = lambda n: f'{S}/explain/w2620-{n}.png'
timeline = open(f'{S}/block-timeline.html').read()
tie_table = open(f'{S}/block-tie.html').read()
machine_table = open(f'{S}/block-machine.html').read()

# header: refresh the date and what the figures are
head = head.replace('Updated <b>12 September 2026</b>', 'Updated <b>14 September 2026</b>')
head = head.replace('<span>Screenshots from <b>a live round</b></span>', '<span>Wall figures <b>rendered at venue size</b></span>')

P = []
def sec(eyebrow, h2, body):
    P.append(f'<section>\n  <div class="col">\n    <p class="eyebrow">{eyebrow}</p>\n    <h2>{h2}</h2>\n{body}  </div>\n</section>\n')
def secfig(eyebrow, h2, body, figs):
    P.append(f'<section>\n  <div class="col">\n    <p class="eyebrow">{eyebrow}</p>\n    <h2>{h2}</h2>\n{body}  </div>\n{"".join(figs)}</section>\n')
p = lambda t: f'    <p>{t}</p>\n'
h3 = lambda t: f'    <h3>{t}</h3>\n'

# ── Part 1: the game ────────────────────────────────────────────────────────
sec('The game', 'One screen of rules',
    p('Every stop after Belgrade is played on paper, on our own engine. Real terminal, real prices, real liquidations, no real money. Three rules make it a game:')
    + '    <ul>\n      <li>Every round is thirty minutes. The Final is twenty.</li>\n      <li>Twice a round, one asset scores double for two minutes.</li>\n      <li>The last three minutes are at 500x.</li>\n    </ul>\n'
    + p('Eight traders. Round 1 seats four, top two go through. Round 2 seats the other four, top two go through. The semifinal seats those four, top two go through. The final is one against one. Everyone starts every round with $100,000 at up to 100x.')
    + p('The score is account PnL plus the Hot bonus. Account PnL is equity at the bell minus the starting balance; open and closed positions count the same, and a trader who busts is scored at the real loss. Per stop the champion takes $2,500, the runner up $1,500, third $1,000. The two semifinal losers are ranked by their semifinal PnL and only the higher one is paid.'))

sec('The game', 'The round',
    p('Every round follows the same shape. Heats and the semi-final run thirty minutes; the Final runs twenty, with the same two-minute Hot Markets and three-minute Boost and shorter build stretches between them.')
    + '    ' + timeline + '\n'
    + p('Top row: the rule, published before the bell. Bottom row: one night as it happened. A Hot Market fires once inside each hatched window, at an instant drawn and sealed before the bell, and runs two minutes. Which asset and which instant stay secret until it fires. The Boost is the same every round.')
    + h3('Pauses')
    + p('The round clock is active time. If the engine cannot price the field, it holds the clock for everyone and the round still gets its full length. A pause is the only thing that moves the schedule.'))

sec('The game', 'Hot Markets',
    p('<b>Twice a round, one asset scores double for two minutes.</b> The first fires between 3:15 and 10:00, the second between 13:00 and 20:00, always a different asset. The room gets fifteen seconds of warning without the name.')
    + p('Only the score doubles. The gains and losses on the hot asset count twice in the score, and nowhere else. Equity, margin and liquidation prices stay as they are, so the bonus cannot liquidate anyone.')
    + p('The draw happens before the bell. One seed decides both assets, both instants, and a fallback for the case where a market cannot be priced at its moment. The hash of the seed is published at the start bell and the seed itself after the round, so anyone can check the draw. The desk cannot change which asset goes hot.'))

sec('The game', '500x Boost',
    p('<b>The last three minutes open at 500x for everyone at once.</b> At minute 27 a second ticker appears for BTC, ETH, SOL and XRP at 500x. Ordinary tickers stay at 100x. There is nothing to buy or switch on: the window is open for everyone.')
    + p('Buying power in the window is equity times 500 and moves with equity. There is no separate Boost bankroll.')
    + p('Boost tickers are isolated margin, as is every position on a competition account. At 500x the liquidation distance is about five basis points, so a bad tick costs the stake on that trade, not the round.')
    + p('If a market cannot be priced well enough when the window opens, the engine leaves it out and records why. At least two of the four must open or the segment does not run.'))

# ── The traders' screen ─────────────────────────────────────────────────────
secfig('The traders', 'The terminal',
    p('Each seat trades on a terminal that shows the chart, the ticket, positions, trade history, the stage line, and the seat\'s own standing: rank, score, round clock, gap to the leader. It explains the seat\'s own score; the wall does not.')
    + p('Practice accounts can fill any empty seat, so a full round can be rehearsed solo at double speed. Every terminal screenshot here came from one.'),
    [fig_old('The terminal.', '<b>The terminal.</b> Chart, ticket, position, and the seat\'s standing. From a practice round with eight seats; a heat seats four.'),
     fig_old('Hot, then Boost.', '<b>The stage line.</b> It names the hot asset and counts the window down. In the last minutes it turns red and lists the four Boost tickers.'),
     fig_old('ETH is hot.', '<b>ETH is hot.</b> The strip names it, counts the window down and offers one tap to switch. This trader is holding SOL.'),
     fig_old('Boost.', '<b>Boost.</b> The page turns red and the strip lists the four Boost markets, one tap each. Positions run to the bell, where the engine closes them.'),
     fig_old("The seat's card.", '<b>The seat\'s card.</b> Rank, score, time left, the leader, and whoever is chasing.', narrow=True)])

# ── Part 2: the night, screen by screen ─────────────────────────────────────
night_intro = (
    p('The wall shows one thing at a time. This is the evening in the order it runs, one figure per screen. Every in-round figure is rendered at the venue\'s size, 2620 by 1310, in livestream mode with the safe area on, which is how the wall runs during a round at a stop.')
    + p('<b>The four frames in the corners are camera positions.</b> They are where the stream mix puts each seat\'s live camera, with the seat\'s name and live score on a plate under it. They are fixed to seats, not to rank, so a camera never has to move. On this page they are drawn as placeholders; on a wall with no mixer they hold the seat\'s picture so the layout still reads. The hatched band at the bottom is the part of the screen the desks hide; the wall paints it black.')
    + p('The wall shows rank, face, name, the market each seat is in, and one score. It does not show side, leverage or liquidation distance, so nobody in the room can trade against a rival from the screen. Faces are square everywhere, the same shape as the camera frames.'))
secfig('The night', 'Screen by screen', night_intro, [
    fig_file(W('t-wall-preshow'), '<b>1. Before the bell.</b> What is next, when it starts, the whole night down the left, and the four about to play. No cameras yet, so no frames: between rounds the wall is the timer and the line-up.'),
    fig_file(W('s-wall-build-4'), '<b>2. The board, most of the round.</b> Rank, face, name, the market each seat is in, and one score, green up, red down. The rail under the headline shows the six beats of the round with the live one lit.'),
    fig_file(W('s-wall-moves-4'), '<b>3. Rank moves.</b> A seat that just overtook another gets a small arrow beside its name and a flash of colour on its row for two seconds. The row keeps its size.'),
    fig_file(W('s-wall-reveal-4'), '<b>4. The Hot warning.</b> Fifteen seconds before a Hot Market the board dims under a count. Which asset stays secret.'),
    fig_file(W('s-wall-slam-4'), '<b>5. The slam.</b> At zero the asset fills the wall for a beat.'),
    fig_file(W('s-wall-hot-4'), '<b>6. The Hot board.</b> Orange. Same order, same score; under each score a heavier "Hot" line says what the Hot asset has done to it so far, and it counts double. A Hot loss takes the same chip a losing score takes. Two minutes later the plain board is back, and the second Hot repeats all of this with a different asset.'),
    fig_file(W('s-wall-boostcount-4'), '<b>7. The Boost count.</b> The last fifteen seconds of the final build, in red, over the dimmed board.'),
    fig_file(W('s-wall-boostslam-4'), '<b>8. The Boost slam.</b> The multiplier fills the wall for a beat.'),
    fig_file(W('s-wall-boost-4'), '<b>9. The Boost board.</b> Red for the last three minutes, set in black, with the multiplier as the headline. The boost tag marks anyone in a Boost ticker.'),
    fig_file(W('s-race-build'), '<b>10. The race view.</b> At any point the desk can swap the board for every seat\'s score through the round as a line, with rank, name and score at the end and the Hot and Boost moments marked. Synthetic series.'),
    fig_file(W('s-race-boost'), '<b>11. The Boost chart.</b> While the 500x window is open the race view narrows to the last five minutes, the window tinted, on a dark panel so each seat keeps its colour. Synthetic series.'),
    fig_file(W('s-race-heart'), '<b>12. Heart rate.</b> The same chart for the pulse, from Bluetooth chest straps paired on the desk laptop. A fake pulse can stand in at a rehearsal. Synthetic series; no strap has been on a player yet.'),
    fig_file(W('s-race-racefinish'), '<b>13. The bell.</b> When the round ends on the chart it holds for twelve seconds, the winner\'s line at full weight and the others dimmed, then the result follows.'),
    fig_file(W('s-wall-recap-4'), '<b>14. The result.</b> The winner named in the header, each seat with a through or out tag, a bar under the name scaled to the biggest score at the table, and the winner\'s round in four figures: peak, deepest dip, biggest move, how long they led.'),
    fig_file(W('t-wall-interval'), '<b>15. Between rounds.</b> The night filled in: who won each round, and the four who came through, outlined in green. No frames. The bracket is Belgrade\'s; the numbers are illustrative.'),
    fig_file(W('s-wall-duel-4'), '<b>16. The final.</b> The same board as every other round. With two seats the rows scale to fill the wall, faces with them, and one line under the board says who leads and by how much. Two seats, so two frames, one large frame each side.'),
    fig_file(W('s-wall-liq-4'), '<b>At any time: the liquidation flash.</b> When a seat\'s position is liquidated the wall turns red for two and a half seconds, black on red like the Boost moments, with the face, the word, whose position on which market, and what it cost, then the board comes back. The position is liquidated, not the trader: the seat keeps trading the rest of the round. The frames stay above it.'),
    fig_file(W('t-wall-technical'), '<b>At any time: the cover.</b> One button on the desk. Deliberately plain. The line underneath says whether the competition is still running behind it.'),
])

# ── Part 3: the wall at the venue ───────────────────────────────────────────
secfig('Venue', 'The wall at the venue',
    h3('The screen')
    + p('The main screen is 2620 by 1310 pixels, ten metres by five, a 2:1 wall, and its lower part sits behind the traders\' desks and the host. The wall page is sized in viewport units, so it fills a 2:1 screen without letterboxing; at that size a board name is about 42 cm tall and the reveal count about 2.7 m.')
    + p('Because the bottom is hidden, the wall takes a safe area that keeps the bottom thirty percent empty and pulls every screen up into the part the room can see, the corner frames and the full-screen moments included. The hidden strip is painted black on every screen, whatever colour the screen is, so nothing glows out from behind the desks.')
    + h3('The cameras')
    + p('Livestream mode narrows the board to the middle of the screen and reserves one square frame per seat in the corners, outside the board, with the seat\'s name and live score on a plate under it. The stream mix puts that seat\'s camera in that frame. Two seats, the final, get one large frame each side. With the chroma key on, the frames are painted solid green for the mixer to key the cameras into; with it off they hold the seat\'s picture, which is how a wall reads when no mixer is connected. The frames are only up while cameras are live, during a round; between rounds the wall runs full width.')
    + h3('Set from the desk')
    + p('The frames, the chroma key and the safe-area percentage are set from the desk\'s Output row, and every wall follows within a few seconds, so the venue machine opens the plain wall address and nothing has to be typed right on the night. Two presets do the whole thing: Venue is frames on and safe area 30 percent; X stream is frames off and no safe area. The address switches listed in the reference still work as a fallback until the desk has spoken.'),
    [fig_file(W('s-wall-chroma-4'), '<b>Keyed.</b> The venue wall with the frames painted for chroma key, ready for the mixer. Everything else identical.')])

secfig('Stream', 'The X stream',
    p('The stream is a second output of the same wall page, not a second wall. X Live takes a 16:9 feed, 1280 by 720 or 1920 by 1080 at 30 frames a second, over RTMP from the stream mixer, and phones show it letterboxed, so the stream is composed for a landscape 1920 by 1080 frame.')
    + p('In the mixer the wall page is one browser source at that size with the desk\'s Output on the X stream preset: no corner frames and no safe area, the board fills the frame, and the mixer lays its own cameras over it wherever the stream wants them. Every moment of the round is the same on both outputs.'),
    [fig_file(f'{S}/explain/w1080-p-wall-build-4.png', '<b>The X stream, most of the round.</b> The board at 16:9, full frame, nothing reserved for cameras.'),
     fig_file(f'{S}/explain/w1080-p-wall-hot-4.png', '<b>The X stream, during a Hot Market.</b>'),
     fig_file(f'{S}/explain/w1080-p-wall-duel-4.png', '<b>The X stream, the final.</b>')])

# ── Part 4: the desk ────────────────────────────────────────────────────────
secfig('Operator', 'The desk',
    p('<b>One laptop runs the night, and nothing on it can change a result.</b> The desk is a private page behind an operator token. The round is on the left, the wall on the right. The strip across the top has the night\'s name, where the evening is in its plan, feed and session status, and one red button that covers the wall.')
    + h3('The round half')
    + p('Show or practice, the format in one line (seats, how many go through, minutes), and one row per seat with a name and an X handle. One button pulls faces from the handles, another issues an invite link per seat; a seat joins by opening its link, no sign-up. Arm locks the field and seals the Hot draw. Start rings the bell now, in five, ten, twenty or thirty minutes, or at a set time. After an engine restart the engine wants five minutes of clean price history on the Hot candidates before it starts; an "Override readiness" button under that message starts on the operator\'s word, with the reason logged.')
    + h3('The wall half')
    + p('A live preview of what the room sees, in the output shape the desk has set and at the wall\'s real proportions. Below it, the countdown, the last result with the official placements and prize money, and one button to put it on the wall. At the bottom, one row per group drives every wall screen. Screen: auto, which follows the round, the line-up, the between-rounds card, the final result. During the round: the board, the PnL lines or the heart rate, with a fake pulse for rehearsals. Output: the Venue and X stream presets and the switches behind them. Rehearse: the liquidation flash, the Hot reveal and slam, the Boost count and slam, fired on the wall for the room and the camera mix to see, never during a show round and never touching a score. Headline line: a line of text under the wall\'s headline.')
    + h3('The night')
    + p('The plan is Round 1, Round 2, Semi-finals, The Final. The strip shows which are done and who won them. Call times stay on the laptop. Reset the night archives the rounds and clears the bracket; a History panel lists every night the desk has run, archived ones included, with each round\'s settled board and, for show nights, the official placings. Practice nights, any night whose name starts with "practice", never carry prize money.')
    + h3('What it cannot do')
    + p('The desk does not pick the hot assets and does not see the sealed draw. It cannot edit a score, a fill or a placement. Everything it does is written to the round log at the foot of the page.'),
    [fig_old('The desk, between rounds.', '<b>The desk, between rounds.</b> Round 1 on the left waiting for its seats. The wall on the right: idle card, countdown controls, the last final\'s placements, and the rows that drive every wall screen. Live screenshot from a practice night; the wall panel has since been regrouped as described above.')])

# ── Part 5: under the hood ──────────────────────────────────────────────────
sec('Under the hood', 'Prices, fills and risk',
    p('Prices come from one source at a time: Pyth Lazer, and if that fails Binance, then Coinbase. The engine does not blend them. Whichever source it is following is the price, so any liquidation can be checked against that venue. A clamp gate refuses single ticks that jump too far from the accepted index.')
    + p('Orders fill at the mark. There are no fees, no slippage and no queue. One position per seat and market, isolated margin only on every competition account, maintenance margin half the initial margin at the position\'s leverage. Equity is always derived, never stored.')
    + p('A price has to be fresh enough for the leverage in play, and 500x needs a fresher price than 100x. If the engine does not trust a price it holds the clock instead of trading on it.'))

sec('Under the hood', 'Proofs',
    p('Every round boundary writes a per-seat proof: the marks, the positions, the fills, hashed. A result can be recomputed later and settled scores cannot be edited. The sealed draw is committed before the bell and revealed after the round, and the wall\'s "Verify the round" link on the desk serves both.')
    + p('The two mechanics are enforced in the engine, not on the screens: the wall, the terminal and the desk read the same published state, and none of them can change a score.'))

sec('Under the hood', 'The machine',
    p('One dedicated server in Germany runs the whole paper stack: the engine, the terminal, the wall, the desk, the identity service and the price history. It is not a cloud instance and shares the machine with nothing else.')
    + '    <div class="tablewrap">\n    ' + machine_table + '\n    </div>\n'
    + p('The engine runs on one thread. The same thread prices, fills, scores and answers requests, so a fill is never decided on a price that another thread has already replaced. Its heaviest moment is opening the 500x window: a few hundred milliseconds while four markets open at once. The machine runs at about a tenth of one core.')
    + p('What can still interrupt a round is upstream: the price feeds, and the venue\'s network between the players\' laptops and the server. The engine source is public at <a href="https://github.com/solanadevmint/paper-competition-engine">github.com/solanadevmint/paper-competition-engine</a>, byte for byte the build that is live.'))

# ── Part 6: reference ───────────────────────────────────────────────────────
sec('Reference', 'Numbers and switches',
    h3('Prizes per stop')
    + '    <div class="tablewrap">\n    <table>\n      <thead><tr><th>Place</th><th>Prize</th></tr></thead>\n      <tbody>\n        <tr><td>Champion</td><td>$2,500</td></tr>\n        <tr><td>Runner up</td><td>$1,500</td></tr>\n        <tr><td>Third, the higher-scoring semifinal loser</td><td>$1,000</td></tr>\n        <tr><td>Fourth</td><td>nothing</td></tr>\n      </tbody>\n    </table>\n    </div>\n'
    + h3('Ties')
    + '    <div class="tablewrap">\n    ' + tie_table + '\n    </div>\n'
    + h3('The clock')
    + '    <div class="tablewrap">\n    <table>\n      <thead><tr><th>Beat</th><th>Thirty-minute round</th><th>Twenty-minute final</th></tr></thead>\n      <tbody>\n        <tr><td>First Hot fires between</td><td>3:15 and 10:00</td><td>2:15 and 6:00</td></tr>\n        <tr><td>Second Hot fires between</td><td>13:00 and 20:00</td><td>8:30 and 12:00</td></tr>\n        <tr><td>Each Hot lasts</td><td>2:00</td><td>2:00</td></tr>\n        <tr><td>Boost opens at</td><td>27:00</td><td>17:00</td></tr>\n        <tr><td>Warning before a Hot or the Boost</td><td>0:15</td><td>0:15</td></tr>\n      </tbody>\n    </table>\n    </div>\n'
    + h3('Wall address switches, fallbacks to the desk\'s Output row')
    + '    <div class="tablewrap">\n    <table>\n      <thead><tr><th>Switch</th><th>Effect</th></tr></thead>\n      <tbody>\n        <tr><td><code>?stream=1</code>, or the S key</td><td>Livestream mode: board in the middle, camera frames in the corners</td></tr>\n        <tr><td><code>?chroma=1</code></td><td>Frames painted green for keying</td></tr>\n        <tr><td><code>?safe=30</code></td><td>Keep the bottom 30 percent empty and black</td></tr>\n        <tr><td><code>?view=race</code>, or the R key</td><td>The race view instead of the board</td></tr>\n        <tr><td><code>?view=heart</code>, or the H key</td><td>The heart-rate view</td></tr>\n      </tbody>\n    </table>\n    </div>\n')

tail = tail.replace('13 September 2026', '14 September 2026').replace('Terminal figures are screenshots of a live round. Wall figures are rendered from the wall\'s own stylesheet.', 'Terminal figures are screenshots of a live round. Wall figures are rendered from the wall\'s own stylesheet at venue size, camera frames drawn as placeholders.')
out = head + ''.join(P) + tail
# every embedded image must load
bad = 0
for m in re.finditer(r'<img src="data:image/(jpeg|png);base64,([^"]+)"', out):
    try: Image.open(io.BytesIO(base64.b64decode(m.group(2)))).load()
    except Exception: bad += 1
assert bad == 0, 'broken embedded image'
open(f'{S}/engine-page.html', 'w').write(out)
print('composed', len(out) // 1024, 'KB', out.count('<figure'), 'figures', out.count('<section'), 'sections')
