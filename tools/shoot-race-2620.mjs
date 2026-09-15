import { chromium } from "playwright-core";
const SP = "/tmp/claude-1000/-home-ubuntu/1351a65c-4727-4a61-8524-0b6659748271/scratchpad";
const BASE = process.argv[2] || "http://127.0.0.1:3124";
const MODE = process.argv[3] || "boost"; // build | hot | boost | heart
const HEART = MODE === "heart";
const RESULT = MODE === "result" || MODE === "final" || MODE === "racefinish";
const BOARD = MODE.endsWith("board");
const FINAL = MODE === "final";
const total = 1_800_000;
const elapsed = process.env.ELAPSED_MIN ? Math.round(Number(process.env.ELAPSED_MIN) * 60_000) : MODE === "build" ? 8 * 60_000 : MODE.startsWith("hot") ? 15 * 60_000 : MODE === "racefinish" ? 30 * 60_000 : 28 * 60_000;
const wallNow0 = Date.now();
const seats = [
  { seat: 0, userId: 101, name: "Vulekinder", drift: 0.9 }, { seat: 1, userId: 102, name: "Sailor", drift: 0.3 },
  { seat: 2, userId: 103, name: "aut3z", drift: -0.4 }, { seat: 3, userId: 104, name: "疯小子", drift: 0.55 },
];
/* A plausible walk per seat, in engine dollars (scaled x10,000 on the wall). */
const walk = (p) => { let v = 0; const pts = []; let seed = p.userId * 7919; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; }; for (let t = 0; t <= elapsed; t += 1000) { v += p.drift * 0.0004 + rnd() * 0.012 * (t > 27 * 60_000 ? 4 : 1); pts.push([t, Number(v.toFixed(6))]); } return pts; };
const points = Object.fromEntries(seats.map((p) => [String(p.userId), walk(p)]));
const last = Object.fromEntries(seats.map((p) => [p.userId, points[String(p.userId)].at(-1)[1]]));
const ranked = seats.slice().sort((a, b) => last[b.userId] - last[a.userId]);
const players = ranked.map((p, i) => ({ userId: p.userId, seat: p.seat, name: p.name, rank: i + 1, score: last[p.userId], accountPnl: last[p.userId], hotBonus: 0, equity: 10 + last[p.userId], avatar: ({ 101: "/frontiers1/arena/pfp/vulekinder.png", 102: "/frontiers1/arena/pfp/solana_sailor.jpg", 103: "/frontiers1/arena/pfp/aut3z.jpg", 104: "/frontiers1/arena/pfp/inno_sol.jpg" })[p.userId] || null, position: null }));
const marks = [{ t: 5 * 60_000 + 12_000, kind: "hot", label: "ETH hot" }, { t: 14 * 60_000 + 40_000, kind: "hot", label: "SOL hot" }, { t: 27 * 60_000, kind: "boost", label: "500× boost" }].filter((m) => m.t <= elapsed);
const phase = MODE.startsWith("hot") ? { phase: "hot", hot: { number: 2, market: "SOL", asset: "SOL", label: "SOL", ticker: "SOL", open: true } } : MODE === "boost" || MODE === "racefinish" ? { phase: "boost" } : { phase: "build" };
const phaseLeft0 = MODE.startsWith("hot") ? Math.max(0, 14 * 60_000 + 40_000 + 120_000 - elapsed) : MODE === "boost" || MODE === "racefinish" ? Math.max(0, total - elapsed) : null;
const state = { ok: true, live: true, complete: true, engineBoot: "fx1", compRevision: 5, now: Date.now(), leftMs: total - elapsed, activeElapsedMs: elapsed, phaseLeftMs: phaseLeft0, phaseEndsAt: phaseLeft0 == null ? null : Date.now() + phaseLeft0,
  round: { id: "heat-1", kind: "round", status: "running", stage: "Heat 1", boostLeverage: 500, startedAt: Date.now() - elapsed, endsAt: Date.now() + (total - elapsed), plan: { total, boostStart: 27 * 60_000, finalBuildStart: 22 * 60_000, hotDuration: 120_000 }, boostCapacityPolicy: "current-equity-v1" },
  players, wall: { mode: "auto", message: null }, armed: [], pending: null, lastRound: null, unscored: [], stalePricing: [], ...phase };
const key = `fx1:heat-1`;
const b = await chromium.launch({ executablePath: "/home/ubuntu/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 2620, height: 1310 }, deviceScaleFactor: 1 });
await ctx.addInitScript(([k, series]) => { try { sessionStorage.setItem("cw-race:" + k, JSON.stringify(series)); } catch {} }, [key, { key, points, marks, lastPhase: phase.phase }]);
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 200)));
const t0 = Date.now(); let rev = 5;
await p.route(/\/api\/paper\/comp\/(state|baseline)/, (r) => { rev += 1; const dt = Date.now() - t0; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...state, compRevision: rev, now: Date.now(), leftMs: total - elapsed - dt, activeElapsedMs: elapsed + dt, phaseLeftMs: phaseLeft0 == null ? null : Math.max(0, phaseLeft0 - dt), complete: true }) }); });
await p.route(/\/api\/paper\/pyth-stream/, (r) => r.fulfill({ status: 204, body: "" }));
const heartWalk = (p) => { let v = 70 + (p.seat * 9) % 25; let seed = p.userId * 104729; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; }; const out = []; for (let t = 0; t <= elapsed; t += 2000) { v = Math.max(58, Math.min(178, v + rnd() * 5 + (t > 27 * 60_000 ? 0.9 : t > 14 * 60_000 && t < 16 * 60_000 ? 0.6 : 0.02))); out.push({ userId: p.userId, bpm: Math.round(v), at: wallNow0 - (elapsed - t) }); } return out; };
const heartReadings = seats.flatMap(heartWalk).sort((a, b) => a.at - b.at);
await p.route(/\/arena\/comp\/api\/heart/, (r) => { const since = Number(new URL(r.request().url()).searchParams.get("since") || 0); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, now: Date.now(), readings: heartReadings.filter((x) => x.at > since) }) }); });
if (RESULT) {
  const faces = { 101: "/frontiers1/arena/pfp/aut3z.jpg", 102: "/frontiers1/arena/pfp/solana_sailor.jpg", 103: "/frontiers1/arena/pfp/dstvsy.jpg", 104: "/frontiers1/arena/pfp/inno_sol.jpg" };
  const settled = ranked.map((p, i) => ({ userId: p.userId, name: p.name, rank: i + 1, score: last[p.userId], accountPnl: last[p.userId], hotBonus: 0 }));
  const lastRound = { id: "heat-1", kind: FINAL ? "final" : "round", stage: FINAL ? "The Final" : "Heat 1", endedAt: Date.now() - 20000, startedAt: Date.now() - 1_820_000, settledAt: Date.now() - 15000, aborted: false, advance: FINAL ? null : 2,
    through: FINAL ? null : settled.slice(0, 2).map((r) => ({ userId: r.userId })), hots: [{ number: 1, market: "ETH" }, { number: 2, market: "SOL" }], drawVerified: { ok: true }, executionVerified: { ok: true }, drawReveal: { ok: true }, board: FINAL ? settled.slice(0, 2) : settled };
  let polls = 0;
  await p.unroute(/\/api\/paper\/comp\/(state|baseline)/);
  await p.route(/\/api\/paper\/comp\/(state|baseline)/, (r) => { polls += 1; const liveFirst = polls <= 2; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(liveFirst
    ? { ...state, compRevision: 5 + polls, now: Date.now(), players: players.map((q) => ({ ...q, avatar: faces[q.userId] })) }
    : { ok: true, live: false, complete: true, engineBoot: "fx1", compRevision: 5 + polls, now: Date.now(), players: [], armed: [], pending: null, wall: { mode: "auto", message: null }, lastRound }) }); });
}
await p.goto(`${BASE}/frontiers1/arena/comp${BOARD ? "" : `?view=${HEART ? "heart" : "race"}&stream=1&safe=30`}`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
await p.waitForTimeout(3000); if (process.env.HIDE_STALE) await p.addStyleTag({ content: ".cw__stale{display:none!important}" }); await p.waitForTimeout(200);
if (RESULT) { await p.waitForTimeout(4500); }
const svg = await p.$(MODE === "racefinish" ? ".cw__race svg" : RESULT ? ".cw--stage.is-result" : BOARD ? ".cw__board" : ".cw__race svg");
console.log(RESULT ? "result stage:" : "race svg:", svg ? "present" : "ABSENT");
await p.evaluate(() => { const d = document.createElement("div"); d.setAttribute("style", "position:fixed;left:0;right:0;bottom:0;height:30vh;background:repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 12px,transparent 12px 24px);border-top:2px dashed rgba(244,242,239,.35);pointer-events:none;z-index:99"); document.body.appendChild(d); });
await p.evaluate(() => { const st = document.createElement("style"); st.textContent = ".cw__camframe.doc-cam{background:#161514;border:2px dashed rgba(244,242,239,.4);color:rgba(244,242,239,.75);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3em;letter-spacing:.14em;text-transform:uppercase;font-size:clamp(12px,2.2vh,34px)} .cw__camframe.doc-cam b{font-weight:700;font-size:1.25em;letter-spacing:.18em} .cw.is-boost .cw__camframe.doc-cam,.cw.is-hot .cw__camframe.doc-cam{background:rgba(14,13,12,.55);color:rgba(14,13,12,.85);border-color:rgba(14,13,12,.45)}"; document.head.appendChild(st); document.querySelectorAll(".cw__camframe").forEach((el, i) => { el.classList.add("doc-cam"); el.innerHTML = "<b>Camera</b><span>seat " + (i + 1) + "</span>"; }); });
await p.screenshot({ path: `${SP}/explain/w2620-s-race-${MODE}.png` });
await p.keyboard.press(HEART ? "h" : "r"); await p.waitForTimeout(500);
console.log("after R, board rows:", (await p.$$(".cw__row")).length);
await b.close();
