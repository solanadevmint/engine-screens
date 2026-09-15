import type {
  BoostCapacityPolicy,
  CompPlayer,
  CompPosition,
  CompState,
  LastRound,
  LastRoundBoardRow,
  SeriesState,
  SeriesPlacing,
  SeriesStageRow,
} from "./comp-shared";
import { parseRoundExecution, ROUND_EXECUTION_POLICY, roundControlLife,
  roundBackupExecutionPolicy, roundBackupFrameValid,
  type RoundBackupDescriptor, type RoundClockProof, type RoundExecution } from "./round-execution";

export const COMP_ROUND_MS = 30 * 60_000;
export const FINAL_BUILD_START_MS = 22 * 60_000;
export const BOOST_START_MS = 27 * 60_000;

export const COMP_SEQUENCE = [
  { key: "build1", label: "Build", short: "Build" },
  { key: "hot1", label: "Surprise Hot #1", short: "Hot #1" },
  { key: "build2", label: "Build", short: "Build" },
  { key: "hot2", label: "Surprise Hot #2", short: "Hot #2" },
  { key: "finalBuild", label: "Final Build", short: "Final" },
  { key: "boost", label: "500× Boost", short: "Boost" },
] as const;

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/* The engine owns tie-breaking and prize units. Never infer an official
   podium from stillIn or a stage name, or scale real USD prizes. */
export function officialSeriesPlacings(series: SeriesState | null | undefined): SeriesPlacing[] {
  if (series?.official !== true || series.practice === true || !Array.isArray(series.placings)) return [];
  const rows = series.placings;
  if (!rows.length || rows.length > 4 || rows.some((row) => !row
      || !Number.isSafeInteger(row.place) || row.place < 1 || row.place > 4
      || !Number.isSafeInteger(row.userId) || row.userId <= 0
      || !finite(row.score) || !finite(row.prize) || row.prize < 0
      || typeof row.roundId !== "string" || !row.roundId)) return [];
  if (new Set(rows.map((row) => row.place)).size !== rows.length
      || new Set(rows.map((row) => row.userId)).size !== rows.length) return [];
  return rows.slice().sort((a, b) => a.place - b.place);
}

export function officialSeriesStages(series: SeriesState | null | undefined): SeriesStageRow[] {
  return (series?.stages ?? []).filter((stage) => !!stage.stage && stage.practice !== true
    && !stage.id.startsWith("practice-") && !stage.players.some((player) => player.bot === true || player.practice === true));
}

export type PublicCompPhase = "pre" | "build" | "hotWarning" | "hot" | "finalBuild" | "boost" | "done";

/* Legacy phase names are deliberately collapsed into ordinary build/warning
   states. In particular `reveal` never authorizes reading an asset: during a
   rolling deploy the safer failure is a generic warning. */
export function publicCompPhase(state: CompState | null | undefined): PublicCompPhase {
  const raw = String(state?.phase ?? "").replace(/[\s_-]/g, "").toLowerCase();
  if (raw.includes("warning") && raw.includes("hot")) return "hotWarning";
  if (raw === "reveal") return "hotWarning";
  if (raw === "hot" || /^hot[12]$/.test(raw)) return "hot";
  if (raw === "finalbuild") return "finalBuild";
  if (raw === "boost") return "boost";
  if (raw === "done" || raw === "settled" || raw === "complete") return "done";
  if (raw === "pre") return "pre";
  return "build";
}

export function competitionElapsed(state: CompState | null | undefined): number {
  if (!state) return 0;
  /* The nested engine plan is the authority for accelerated rounds. Absolute
     start/end timestamps include accumulated outage pauses, so their delta is
     wall time and must never be used as the active competition duration. */
  const plan = state.round?.plan ?? state.plan;
  const plannedTotal = Array.isArray(plan)
    ? Math.max(0, ...plan.map((segment) => finite(segment.to) ? segment.to : 0))
    : finite(plan?.total) ? Math.max(0, plan.total) : 0;
  const total = plannedTotal || COMP_ROUND_MS;
  const direct = (state as CompState & { activeElapsedMs?: number }).activeElapsedMs;
  if (finite(direct)) return Math.max(0, Math.min(total, direct));
  return finite(state.leftMs)
    ? Math.max(0, Math.min(total, total - state.leftMs))
    : 0;
}

export function hotNumberOf(state: CompState | null | undefined): 1 | 2 {
  const direct = Number(state?.hotNumber ?? state?.hot?.number);
  if (direct === 2) return 2;
  if (direct === 1) return 1;
  const revealed = state?.hots ?? [];
  if (revealed.some((x) => Number(x.number) === 2)) return 2;
  if (revealed.some((x) => Number(x.number) === 1)) return 2;
  /* A time-based guess is safe only for an old, full-speed document. New and
     accelerated rounds publish the ordinal explicitly. */
  return Number(state?.round?.speed ?? 1) === 1 && competitionElapsed(state) >= 13 * 60_000 ? 2 : 1;
}

export type ActiveHot = { number: 1 | 2; asset: string; label: string; ticker: string };

/* The phase gate is the secrecy boundary. Even if a mixed-version response
   accidentally carries `hot.market` during a warning, the UI will not read or
   render it until the engine explicitly says the Hot interval is active. */
export function publicActiveHot(state: CompState | null | undefined): ActiveHot | null {
  if (publicCompPhase(state) !== "hot") return null;
  const hot = state?.hot;
  if (!hot || hot.open !== true) return null;
  const asset = String(hot.market ?? "").toUpperCase().replace(/-(HOT|BOOST|PERP)$/, "");
  if (!/^[A-Z0-9]{1,16}$/.test(asset)) return null;
  return {
    number: hotNumberOf(state),
    asset,
    label: `${asset}-PERP`,
    /* V2 Hot scores the ordinary market. Never hand a synthetic -HOT ticker
       to an action surface from this public view model. */
    ticker: asset,
  };
}

const positionBase = (symbol: string): string =>
  symbol.toUpperCase().replace(/-(HOT|BOOST|PERP)$/, "");

/* V2 Hot scores the ordinary BASE position, including a position carried into
   the window. Looking for segment=HOT selects the retired synthetic twin and
   falling back to the largest holding can put a completely unrelated market
   beside the live Hot headline. */
export function wallPositionFor(
  state: CompState | null | undefined,
  player: CompPlayer,
  phase: PublicCompPhase = publicCompPhase(state),
): CompPosition | undefined {
  const positions = player.positions ?? [];
  if (phase === "hot") {
    const active = publicActiveHot(state);
    if (!active) return undefined;
    const ordinary = positions.find((position) =>
      position.segment == null && positionBase(position.symbol) === active.asset);
    if (ordinary) return ordinary;
    /* A settled v1 document may still describe its explicitly synthetic Hot
       ticker. Keep that historical display path without ever inventing one
       for a v2 ordinary-market Hot. */
    return /-HOT$/i.test(state?.hot?.ticker ?? "")
      ? positions.find((position) =>
          position.segment === "HOT" && positionBase(position.symbol) === active.asset)
      : undefined;
  }
  if (phase === "boost") return positions.find((position) => position.segment === "BOOST");
  return positions[0];
}

export function isCompetitionPaused(state: CompState | null | undefined): boolean {
  return !!(state?.blocked || state?.paused);
}

export function isFinalBuild(state: CompState | null | undefined): boolean {
  if (publicCompPhase(state) === "finalBuild") return true;
  /* Rolling-deploy fallback only. New rounds publish finalBuild explicitly;
     old 1x rounds can still be understood from their public round remainder. */
  if (publicCompPhase(state) !== "build" || Number(state?.round?.speed ?? 1) !== 1) return false;
  const elapsed = competitionElapsed(state);
  return elapsed >= FINAL_BUILD_START_MS && elapsed < BOOST_START_MS;
}

export function sequenceIndex(state: CompState | null | undefined): number {
  const phase = publicCompPhase(state);
  if (phase === "boost" || phase === "done") return 5;
  if (isFinalBuild(state)) return 4;
  if (phase === "hot" || phase === "hotWarning") return hotNumberOf(state) === 2 ? 3 : 1;
  const revealed = state?.hots?.length ?? 0;
  /* If Hot #2 finishes before minute 22, no named rail segment is active
     until the engine publishes finalBuild. A half step marks #2 complete
     without falsely calling the gap Final Build. */
  if (revealed >= 2) return 3.5;
  if (revealed > 0
      || (Number(state?.round?.speed ?? 1) === 1 && competitionElapsed(state) >= 13 * 60_000)) return 2;
  return 0;
}

export function buildPhaseFooter(state: CompState | null | undefined): string {
  const revealed = state?.hots?.length ?? 0;
  if (revealed >= 2) return "Both Hot Markets complete, normal 1× trading until Final Build";
  if (revealed >= 1 || hotNumberOf(state) === 2) {
    return "Normal 1× trading before the second surprise Hot Market";
  }
  return "Normal 1× trading, Hot asset hidden until activation";
}

export function drawProofLabel(last: LastRound | null | undefined): string {
  const explicit = last?.drawVerified;
  if (explicit && typeof explicit.ok === "boolean") {
    return explicit.ok ? "revealed and verified" : "failed verification";
  }
  const legacy = last?.drawReveal?.verified;
  if (legacy === true) return "revealed and verified";
  if (legacy === false) return "failed verification";
  return last?.drawReveal ? "revealed, verification unavailable" : "available from Verify the draw";
}

export function executionProofLabel(last: LastRound | null | undefined): string {
  const explicit = last?.executionVerified;
  if (explicit && typeof explicit.ok === "boolean") {
    return explicit.ok ? "verified" : "failed verification";
  }
  return "verification unavailable";
}

export type RoundProofStatus = "legacy" | "verified" | "unverified";

export function roundProofStatus(last: LastRound | null | undefined): RoundProofStatus {
  if (!last) return "unverified";
  const expected = Number(last.formatVersion) >= 2
    || last.drawVerified !== undefined || last.executionVerified !== undefined;
  if (!expected) return "legacy";
  return last.drawVerified?.ok === true && last.executionVerified?.ok === true
    ? "verified" : "unverified";
}

export type AutoWallResultRow = LastRoundBoardRow & { avatar?: string | null };
export type AutoWallResult = {
  id: string;
  aborted: boolean;
  settled: boolean;
  board: AutoWallResultRow[];
  winner: AutoWallResultRow | null;
  proof: RoundProofStatus | "pending";
};

const resultBoard = (rows: AutoWallResultRow[]): AutoWallResultRow[] => rows
  .filter((row) => Number.isSafeInteger(row.rank) && row.rank > 0
    && Number.isSafeInteger(row.userId) && Number.isFinite(row.score))
  .slice()
  .sort((a, b) => a.rank - b.rank);

/* A compact done frame has no board of its own. mergeCompBoard deliberately
   retains the last fenced live rows until REST supplies lastRound, avoiding an
   idle flash while never calling that provisional ordering a winner. */
export function autoWallResult(state: CompState | null | undefined): AutoWallResult | null {
  if (!state || state.live) return null;
  const last = state.lastRound;
  if (last) {
    const aborted = last.aborted === true;
    const board = aborted ? [] : resultBoard(Array.isArray(last.board) ? last.board : []);
    const first = board.filter((row) => row.rank === 1);
    const proof = roundProofStatus(last);
    return {
      id: last.id,
      aborted,
      settled: true,
      board,
      winner: !aborted && proof !== "unverified" && first.length === 1 ? first[0] : null,
      proof,
    };
  }
  if (publicCompPhase(state) !== "done" || !state.round?.id || !state.players?.length) return null;
  const board = resultBoard(state.players.map((row) => ({
    userId: row.userId,
    name: row.name,
    rank: row.rank,
    score: row.score,
    accountPnl: row.accountPnl,
    hotBonus: row.hotBonus,
    avatar: row.avatar,
  })));
  return { id: state.round.id, aborted: false, settled: false, board, winner: null, proof: "pending" };
}

export type BoostFigures = {
  policy: BoostCapacityPolicy | null;
  projected: number | null;
  capacity: number | null;
  remainingExposure: number | null;
};

type BoostPolicyRound = { boostCapacityPolicy?: unknown } | null | undefined;

export function boostCapacityPolicy(round: BoostPolicyRound): BoostCapacityPolicy | null {
  if (!round) return null;
  const policy = round.boostCapacityPolicy;
  if (policy === undefined || policy === "frozen-start-v1") return "frozen-start-v1";
  return policy === "current-equity-v1" ? policy : null;
}

export function boostCapacityCopy(round: BoostPolicyRound) {
  const policy = boostCapacityPolicy(round);
  if (policy === "current-equity-v1") return {
    capacity: "Live Boost buying power", projected: "Projected Boost buying power",
    phase: "Boost buying power follows current equity, no PnL multiplier",
    finalBuild: "Projected Boost buying power follows current equity",
    accounting: "Current equity; Boost-start snapshot is audit only",
  };
  if (policy === "frozen-start-v1") return {
    capacity: "Frozen Boost capacity", projected: "Boost power",
    phase: "Frozen Boost-start bankroll, no PnL multiplier and no profit compounding",
    finalBuild: "BOOST POWER = eligible equity × 500",
    accounting: "Frozen Boost-start capacity",
  };
  return { capacity: "Boost capacity unavailable", projected: "Boost capacity unavailable",
    phase: "Boost capacity policy unavailable", finalBuild: "Boost capacity policy unavailable",
    accounting: "Capacity policy unavailable" };
}

/* Only the legacy policy permits its historical snapshot fallback. Dynamic
   figures are engine-published authority, not a client equity calculation. */
export function boostFigures(state: CompState | null | undefined, player: CompPlayer, leverage = 500): BoostFigures {
  const policy = boostCapacityPolicy(state?.round);
  if (policy !== "frozen-start-v1") {
    const nonnegative = (value: unknown): value is number => finite(value) && value >= 0;
    return {
      policy,
      projected: policy && nonnegative(player.projectedBoostPower) ? player.projectedBoostPower : null,
      capacity: policy && publicCompPhase(state) === "boost" && nonnegative(player.boostMaxExposure) ? player.boostMaxExposure : null,
      remainingExposure: policy && nonnegative(player.boostRemainingExposure) ? player.boostRemainingExposure : null,
    };
  }
  const projected = finite(player.projectedBoostPower)
    ? player.projectedBoostPower
    : finite(player.equity) ? Math.max(0, player.equity) * leverage : null;
  const frozenCapacity = finite(player.boostMaxExposure)
    ? player.boostMaxExposure
    : finite(player.boostBankroll) ? Math.max(0, player.boostBankroll) * leverage : null;
  return {
    policy,
    projected,
    capacity: publicCompPhase(state) === "boost" ? frozenCapacity : null,
    remainingExposure: finite(player.boostRemainingExposure) ? player.boostRemainingExposure : null,
  };
}

export type CountdownAnchor = {
  identity: string;
  at: number;
  left: number;
  frozen: boolean;
  /* Ordered server samples distinguish an intentional new deadline from an
     old cached response. Deadlines reveal only public clocks. */
  serverAt?: number;
  deadline?: number | null;
  engineBoot?: string;
  revision?: number;
};

export function countdownAt(anchor: CountdownAnchor, at: number): number {
  return Math.max(0, anchor.left - (anchor.frozen ? 0 : Math.max(0, at - anchor.at)));
}

/* Cached polling samples may repeat an older, larger remainder. Within one
   moving phase they may tighten the countdown, never add time back. A real
   pause/resume or phase/round transition is a new clock edge and may correct
   the value in either direction. */
export function reconcileCountdown(
  prior: CountdownAnchor | null,
  sample: Omit<CountdownAnchor, "at">,
  at: number,
): CountdownAnchor {
  const sameEngine = !prior?.engineBoot || !sample.engineBoot || prior.engineBoot === sample.engineBoot;
  const revisionOrder = prior && finite(prior.revision) && finite(sample.revision)
    ? sample.revision - prior.revision : null;
  const newerRevision = revisionOrder !== null && revisionOrder > 0;
  if (prior && sameEngine && (revisionOrder !== null && revisionOrder < 0
      || !newerRevision && finite(prior.serverAt) && finite(sample.serverAt)
        && sample.serverAt <= prior.serverAt)) return prior;
  const newDeadline = prior && (newerRevision || finite(prior.serverAt) && finite(sample.serverAt)
    && sample.serverAt > prior.serverAt) && finite(prior.deadline) && finite(sample.deadline)
    && sample.deadline !== prior.deadline;
  if (!prior || !sameEngine || prior.identity !== sample.identity || prior.frozen !== sample.frozen || newDeadline) {
    return { ...sample, at, left: Math.max(0, sample.left) };
  }
  const predicted = countdownAt(prior, at);
  return { ...sample, at, left: Math.min(predicted, Math.max(0, sample.left)) };
}

/* During build, phaseLeftMs can only describe fixed milestones, but the wall
   intentionally consumes the round remainder. This makes the browser unable
   to turn a mistakenly over-specific build boundary into a countdown to the
   secret activation. */
export function countdownSample(state: CompState): Omit<CountdownAnchor, "at"> | null {
  const phase = publicCompPhase(state);
  const timedPhase = phase === "hotWarning" || phase === "hot" || phase === "finalBuild" || phase === "boost";
  const raw = timedPhase ? state.phaseLeftMs : state.leftMs;
  if (!finite(raw)) return null;
  return {
    identity: `${state.round?.id ?? "none"}:${phase}:${phase === "hotWarning" || phase === "hot" ? hotNumberOf(state) : 0}`,
    left: Math.max(0, raw),
    frozen: isCompetitionPaused(state)
      || (state.round?.pricePolicy === ROUND_EXECUTION_POLICY && state.complete !== true),
    serverAt: finite(state.now) ? state.now : undefined,
    deadline: timedPhase ? state.phaseEndsAt : state.round?.endsAt,
    engineBoot: state.engineBoot,
    revision: state.compRevision,
  };
}

export function wallCountdownSample(state: CompState): Omit<CountdownAnchor, "at"> | null {
  const wall = state.wall;
  const held = typeof wall?.pausedMs === "number" && wall.pausedMs > 0;
  const left = held ? wall.pausedMs
    : typeof wall?.nextInMs === "number" ? wall.nextInMs : state.pending?.inMs;
  if (!finite(left)) return null;
  return {
    identity: `wall:${state.pending?.round ?? wall?.nextLabel ?? "next"}`,
    left: Math.max(0, left), frozen: held,
    serverAt: finite(state.now) ? state.now : undefined,
    deadline: state.pending?.startAt ?? wall?.nextAt,
    engineBoot: state.engineBoot,
    revision: state.compRevision,
  };
}

export type CompBoardControls = {
  phase: "build" | "hotWarning" | "hot" | "finalBuild" | "boost" | "done";
  hotNumber: 1 | 2 | null;
  leftMs: number | null;
  phaseLeftMs: number | null;
  phaseEndsAt: number | null;
  paused: CompState["paused"];
  hot: CompState["hot"];
  hots: NonNullable<CompState["hots"]>;
  boostOpen: boolean;
  boostMarkets: string[];
  boostCaps: Record<string, number>;
};

export type CompBoardFrame = {
  round?: RoundBackupDescriptor;
  v: 2 | 3;
  boot: string;
  q: number;
  t: number;
  x: number | null;
  live: boolean;
  roundId: string | null;
  complete: boolean;
  causesComplete: boolean;
  players: CompPlayer[];
  unscored: NonNullable<CompState["unscored"]>;
  stalePricing: string[];
  controls: CompBoardControls | null;
  roundExecution: RoundExecution | null;
};

export type CompBoardCursor = { boot: string; q: number };
export type CompBoardAdmission = "accept" | "duplicate" | "reset" | "baseline";

/* A frame cannot nominate its own engine generation. The uncached REST
   baseline establishes {boot,q}; every streamed successor must then be
   contiguous. A new or delayed foreign boot therefore asks for another
   baseline instead of replacing the visible board. */
export function compBoardAdmission(
  cursor: CompBoardCursor | null,
  frame: Pick<CompBoardFrame, "boot" | "q">,
): CompBoardAdmission {
  if (!cursor) return "baseline";
  if (frame.boot !== cursor.boot) return "reset";
  if (frame.q <= cursor.q) return "duplicate";
  if (frame.q !== cursor.q + 1) return "reset";
  return "accept";
}

const shortText = (value: unknown, max: number): value is string | null | undefined =>
  value == null || (typeof value === "string" && value.length <= max);

/* A stream row is deliberately a score/capacity delta, not an arbitrary
   CompPlayer object. REST owns avatars and position detail. */
const boardPlayer = (row: unknown): CompPlayer | null => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const p = row as Record<string, unknown>;
  if (!Number.isSafeInteger(p.userId) || Number(p.userId) <= 0
      || !Number.isSafeInteger(p.rank) || Number(p.rank) <= 0
      || !finite(p.score) || !shortText(p.name, 120)) return null;
  const out: Record<string, unknown> = {
    userId: Number(p.userId), rank: Number(p.rank), score: Number(p.score),
  };
  if (p.name !== undefined) out.name = p.name;
  for (const key of [
    "accountPnl", "equity", "hotBonus", "boostPnl", "maxDrawdown", "realized",
    "projectedBoostPower", "boostBankroll", "boostMaxExposure", "boostRemainingExposure",
  ]) {
    if (p[key] === undefined) continue;
    if (p[key] !== null && !finite(p[key])) return null;
    out[key] = p[key];
  }
  if (p.seat !== undefined) {
    if (!Number.isSafeInteger(p.seat) || Number(p.seat) < 0 || Number(p.seat) > 31) return null;
    out.seat = Number(p.seat);
  }
  return out as unknown as CompPlayer;
};

const boardUnscored = (row: unknown): NonNullable<CompState["unscored"]>[number] | null => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const p = row as Record<string, unknown>;
  if (!Number.isSafeInteger(p.userId) || Number(p.userId) <= 0
      || !Number.isSafeInteger(p.seat) || Number(p.seat) < 0 || Number(p.seat) > 31
      || !shortText(p.name, 120) || typeof p.error !== "string"
      || !p.error || p.error.length > 120) return null;
  return {
    userId: Number(p.userId), seat: Number(p.seat), name: p.name ?? null, error: p.error,
  } as NonNullable<CompState["unscored"]>[number];
};

const CONTROL_FIELDS = [
  "phase", "hotNumber", "leftMs", "phaseLeftMs", "phaseEndsAt", "paused",
  "hot", "hots", "boostOpen", "boostMarkets", "boostCaps",
] as const;
const CONTROL_PHASES = new Set(["build", "hotWarning", "hot", "finalBuild", "boost", "done"]);
const owns = (row: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(row, key);
const marketText = (v: unknown): v is string => typeof v === "string" && /^[A-Z0-9]{1,16}$/.test(v);
const safeMs = (v: unknown, max = 4 * 60 * 60_000): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= max;

function normalizedPause(value: unknown, frameAt: number): { ok: boolean; value: CompState["paused"] } {
  if (value === null || value === false) return { ok: true, value: null };
  if (value === true) {
    return { ok: true, value: { count: 0, since: frameAt, why: "competition prices unavailable" } };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, value: null };
  const p = value as Record<string, unknown>;
  const allowed = new Set(["count", "since", "why", "degraded", "unpersisted", "symbol", "symbols"]);
  if (!Number.isSafeInteger(p.count) || Number(p.count) < 0 || !finite(p.since)
      || Object.keys(p).some((key) => !allowed.has(key))
      || (p.symbol !== undefined && (typeof p.symbol !== "string" || p.symbol.length > 32))
      || (p.symbols !== undefined && (!Array.isArray(p.symbols) || p.symbols.length > 128
        || !p.symbols.every((m) => typeof m === "string" && m.length <= 32)))
      || typeof p.why !== "string" || !p.why || p.why.length > 160
      || (p.degraded !== undefined && typeof p.degraded !== "boolean")
      || (p.unpersisted !== undefined && typeof p.unpersisted !== "boolean")) {
    return { ok: false, value: null };
  }
  return {
    ok: true,
    value: {
      count: Number(p.count), since: p.since,
      /* Names and free-form reasons are never needed to freeze a public clock.
         Strip both from the compact v2 view so a mixed deployment cannot turn
         a safety frame into an oracle for a still-sealed Hot asset. */
      why: "competition prices unavailable",
      degraded: p.degraded === true, unpersisted: p.unpersisted === true,
    },
  };
}

function normalizedControls(frame: Record<string, unknown>): { ok: boolean; value: CompBoardControls | null } {
  const present = CONTROL_FIELDS.some((key) => owns(frame, key));
  if (!present) return { ok: true, value: null }; // old score-only frame
  if (!CONTROL_FIELDS.every((key) => owns(frame, key))) return { ok: false, value: null };

  const phase = frame.phase;
  const hotNumber = frame.hotNumber;
  const leftMs = frame.leftMs;
  const phaseLeftMs = frame.phaseLeftMs;
  const phaseEndsAt = frame.phaseEndsAt;
  if (typeof phase !== "string" || !CONTROL_PHASES.has(phase)
      || (hotNumber !== null && hotNumber !== 1 && hotNumber !== 2)
      || (leftMs !== null && !safeMs(leftMs))
      || (phaseLeftMs !== null && !safeMs(phaseLeftMs, 60 * 60_000))
      || (phaseEndsAt !== null && (!Number.isSafeInteger(phaseEndsAt) || Number(phaseEndsAt) <= 0))
      || typeof frame.boostOpen !== "boolean"
      || !Array.isArray(frame.boostMarkets) || frame.boostMarkets.length > 128
      || !frame.boostMarkets.every(marketText)
      || new Set(frame.boostMarkets).size !== frame.boostMarkets.length
      || !frame.boostCaps || typeof frame.boostCaps !== "object" || Array.isArray(frame.boostCaps)
      || !Array.isArray(frame.hots) || frame.hots.length > 2) {
    return { ok: false, value: null };
  }
  const boostCaps: Record<string, number> = {};
  const boostMarkets = frame.boostMarkets as string[];
  const capEntries = Object.entries(frame.boostCaps as Record<string, unknown>);
  if (capEntries.length > 128 || capEntries.some(([market, cap]) =>
    !marketText(market) || !finite(cap) || cap <= 0 || cap > 500)) {
    return { ok: false, value: null };
  }
  for (const [market, cap] of capEntries) boostCaps[market] = Number(cap);
  const pause = normalizedPause(frame.paused, Number(frame.t));
  if (!pause.ok) return { ok: false, value: null };

  const hots = frame.hots.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const h = row as Record<string, unknown>;
    const number = Number(h.number);
    if ((number !== 1 && number !== 2) || !marketText(h.market)
        || h.ticker !== h.market || (h.status !== "active" && h.status !== "complete")
        || typeof h.open !== "boolean"
        || (h.status === "active" ? h.open !== true : h.open !== false)
        || ["drawn", "fellBack", "fallbackReason", "backup", "seed"].some((key) => owns(h, key))
        || (h.fallbackReason != null
          && (typeof h.fallbackReason !== "string" || h.fallbackReason.length > 160))) return null;
    return {
      number: number as 1 | 2, market: h.market, ticker: h.market,
      status: h.status as "active" | "complete",
    };
  });
  if (hots.some((h) => !h)
      || hots.some((h, index) => h?.number !== index + 1)
      || new Set(hots.map((h) => h?.number)).size !== hots.length
      || new Set(hots.map((h) => h?.market)).size !== hots.length) {
    return { ok: false, value: null };
  }
  const publicHots = hots as NonNullable<CompState["hots"]>;

  let hot: CompState["hot"] = null;
  if (frame.hot !== null) {
    if (!frame.hot || typeof frame.hot !== "object" || Array.isArray(frame.hot)) {
      return { ok: false, value: null };
    }
    const h = frame.hot as Record<string, unknown>;
    const number = Number(h.number);
    if ((number !== 1 && number !== 2) || !marketText(h.market)
        || h.ticker !== h.market || h.open !== true
        || ["drawn", "fellBack", "fallbackReason", "backup", "seed"].some((key) => owns(h, key))) {
      return { ok: false, value: null };
    }
    hot = { number: number as 1 | 2, market: h.market, ticker: h.market, open: true };
  }

  const numbered = hotNumber === 1 || hotNumber === 2;
  const completed = publicHots.every((h) => h.status === "complete");
  const priorOnly = numbered && publicHots.length === hotNumber - 1
    && publicHots.every((h) => h.number < hotNumber && h.status === "complete");
  const activeMatches = numbered && hot?.number === hotNumber
    && publicHots.length === hotNumber
    && publicHots.some((h) => h.number === hotNumber && h.market === hot.market && h.status === "active")
    && publicHots.every((h) => h.number < hotNumber ? h.status === "complete" : h.status === "active");

  const capKeys = Object.keys(boostCaps);
  const boostMarketsOpen = boostMarkets.length > 0;
  const capsMatchMarkets = capKeys.length === boostMarkets.length
    && boostMarkets.every((market) => owns(boostCaps, market));
  if (boostMarketsOpen !== (frame.boostOpen === true) || !capsMatchMarkets) {
    return { ok: false, value: null };
  }

  if ((phase === "done") === (frame.live === true)) return { ok: false, value: null };

  if (phase === "build" && (hotNumber !== null || leftMs === null
      || phaseLeftMs !== null || phaseEndsAt !== null || hot !== null
      || !completed || frame.boostOpen !== false || frame.boostMarkets.length || capEntries.length)) {
    return { ok: false, value: null };
  }
  if (phase === "hotWarning" && (!numbered || leftMs === null || !safeMs(phaseLeftMs, 15_000)
      || phaseEndsAt === null || hot !== null || !priorOnly
      || frame.boostOpen !== false || frame.boostMarkets.length || capEntries.length)) {
    return { ok: false, value: null };
  }
  if (phase === "hot" && (!numbered || leftMs === null || !safeMs(phaseLeftMs, 2 * 60_000)
      || phaseEndsAt === null || !activeMatches
      || frame.boostOpen !== false || frame.boostMarkets.length || capEntries.length)) {
    return { ok: false, value: null };
  }
  if (phase === "finalBuild" && (hotNumber !== null || leftMs === null
      || !safeMs(phaseLeftMs, 5 * 60_000) || phaseEndsAt === null || hot !== null
      || publicHots.length !== 2 || !completed
      || frame.boostOpen !== false || frame.boostMarkets.length || capEntries.length)) {
    return { ok: false, value: null };
  }
  const boostGateReady = frame.boostOpen === true && boostMarkets.length > 0;
  const boostGateWaiting = pause.value !== null && frame.boostOpen === false
    && boostMarkets.length === 0;
  if (phase === "boost" && (hotNumber !== null || leftMs === null
      || !safeMs(phaseLeftMs, 3 * 60_000) || phaseEndsAt === null || hot !== null
      || publicHots.length !== 2 || !completed || (!boostGateReady && !boostGateWaiting))) {
    return { ok: false, value: null };
  }
  if (phase === "done" && (hotNumber !== null || leftMs !== null
      || phaseLeftMs !== null || phaseEndsAt !== null || hot !== null || publicHots.length
      || frame.boostOpen !== false || frame.boostMarkets.length || capEntries.length)) {
    return { ok: false, value: null };
  }

  return {
    ok: true,
    value: {
      phase: phase as CompBoardControls["phase"], hotNumber: hotNumber as 1 | 2 | null,
      leftMs: leftMs as number | null, phaseLeftMs: phaseLeftMs as number | null,
      phaseEndsAt: phaseEndsAt as number | null, paused: pause.value, hot, hots: publicHots,
      boostOpen: frame.boostOpen as boolean, boostMarkets: boostMarkets.slice(), boostCaps,
    },
  };
}

/* The stream may carry a comp frame directly or inside a causal price bundle.
   The wall needs only the full ranked snapshot, so no future
   draw field is copied from arbitrary stream input. */
export function parseCompBoardFrame(payload: unknown): CompBoardFrame | null {
  let value = payload;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const envelope = value as { v?: unknown; type?: unknown; boot?: unknown; items?: unknown };
    if (envelope.type === "bundle") {
      if ((envelope.v !== 2 && envelope.v !== 3) || typeof envelope.boot !== "string" || !envelope.boot
          || envelope.boot.length > 32 || !Array.isArray(envelope.items)
          || !envelope.items.length || envelope.items.length > 160) return null;
      value = envelope.items[envelope.items.length - 1];
      if (!value || typeof value !== "object" || Array.isArray(value)
          || (value as { type?: unknown }).type !== "comp"
          || (value as { v?: unknown }).v !== envelope.v
          || (value as { boot?: unknown }).boot !== envelope.boot) return null;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const f = value as Record<string, unknown>;
  if ((f.v !== 2 && f.v !== 3) || f.type !== "comp" || typeof f.boot !== "string" || !f.boot
      || f.boot.length > 32
      || !Number.isSafeInteger(f.q) || Number(f.q) <= 0 || typeof f.live !== "boolean"
      || !Number.isSafeInteger(f.t) || Number(f.t) <= 0
      || !owns(f, "x") || (f.x !== null && (!Number.isSafeInteger(f.x)
        || (f.v === 3 ? Number(f.x) < Number(f.t) : Number(f.x) <= Number(f.t))))
      || !owns(f, "causes") || !Array.isArray(f.causes) || f.causes.length > 512
      || !owns(f, "causesComplete") || typeof f.causesComplete !== "boolean"
      || (f.live ? typeof f.roundId !== "string" || !f.roundId : f.roundId !== null)
      || (typeof f.roundId === "string" && f.roundId.length > 128)
      || typeof f.complete !== "boolean" || !Array.isArray(f.players)
      || f.players.length > 32 || !Array.isArray(f.unscored) || f.unscored.length > 32
      || !Array.isArray(f.stalePricing) || f.stalePricing.length > 128) return null;
  const players = f.players.map(boardPlayer);
  const unscored = f.unscored.map(boardUnscored);
  const ids = new Set(players.map((p) => p?.userId));
  const ranks = new Set(players.map((p) => p?.rank));
  let causeCount = 0;
  const causesOk = f.causes.every((row) => {
    if (!Array.isArray(row) || row.length !== 5
        || typeof row[0] !== "string" || !/^[A-Z0-9][A-Z0-9-]{0,23}$/.test(row[0])
        || !finite(row[1]) || row[1] <= 0 || !finite(row[2]) || row[2] <= 0
        || !Number.isSafeInteger(row[3]) || Number(row[3]) <= 0
        || !Number.isSafeInteger(row[4]) || Number(row[4]) <= 0 || Number(row[4]) > 512) return false;
    causeCount += Number(row[4]);
    return causeCount <= 512;
  });
  const control = normalizedControls(f);
  if (!roundBackupFrameValid(f.round, f.roundId) || (f.v === 2 && f.round !== undefined)) return null;
  const execution = f.v === 3 && f.live ? parseRoundExecution(f.roundExecution, {
    boot: f.boot, roundId: String(f.roundId), revision: Number(f.q), issuedAt: Number(f.t),
    round: f.round,
  }) : null;
  if (f.v === 2 && f.roundExecution != null
      || f.v === 3 && (!f.live || !control.value || !execution || f.x !== execution.validUntil)) return null;
  if (players.some((p) => !p) || unscored.some((p) => !p)
      || ids.size !== players.length || ranks.size !== players.length
      || players.some((p) => Number(p?.rank) > players.length)
      || unscored.some((p) => ids.has(p?.userId))
      || !f.stalePricing.every((m) => typeof m === "string" && /^[A-Z0-9]{1,16}$/.test(m))
      || new Set(f.stalePricing).size !== f.stalePricing.length
      || !causesOk || !control.ok) return null;
  return {
    v: f.v,
    boot: f.boot,
    q: Number(f.q),
    t: Number(f.t),
    x: f.x === null ? null : Number(f.x),
    live: f.live,
    roundId: f.roundId as string | null,
    complete: f.complete,
    causesComplete: f.causesComplete,
    players: players as CompPlayer[],
    unscored: unscored as NonNullable<CompState["unscored"]>,
    stalePricing: f.stalePricing as string[],
    controls: control.value,
    roundExecution: execution,
    ...(f.round ? { round: { ...f.round } } : {}),
  };
}

export function mergeCompBoard(state: CompState, frame: CompBoardFrame): CompState {
  if (state.engineBoot === frame.boot && Number.isSafeInteger(state.compRevision)
      && Number(state.compRevision) > frame.q) return state;
  /* A capability cannot silently change the persisted policy of an old heat. */
  if (frame.live && ((state.round?.pricePolicy === ROUND_EXECUTION_POLICY) !== (frame.v === 3))) return state;
  if (frame.live && (roundBackupExecutionPolicy(state.round) === "invalid"
      || roundBackupExecutionPolicy(state.round) !== roundBackupExecutionPolicy(frame.round))) return state;
  const definitive = frame.complete && frame.causesComplete
    && (frame.v === 2 || !!frame.roundExecution
      && frame.roundExecution.validUntil > frame.roundExecution.issuedAt
      && !frame.controls?.paused && !state.blocked && !frame.unscored.length && !frame.stalePricing.length);
  if (!frame.live) return state.live ? {
    ...state, ...(frame.controls ?? {}), live: false, complete: definitive,
    roundExecution: null,
    causesComplete: frame.causesComplete,
    engineBoot: frame.boot, compRevision: frame.q,
    now: Math.max(state.now ?? 0, frame.t),
  } : state;
  if (!state.live || state.round?.id !== frame.roundId) return state;
  const prior = new Map((state.players ?? []).map((p) => [p.userId, p]));
  const dynamicBoost = boostCapacityPolicy(state.round) === "current-equity-v1";
  return {
    ...state,
    ...(frame.controls ?? {}),
    complete: definitive,
    roundExecution: frame.roundExecution,
    causesComplete: frame.causesComplete,
    engineBoot: frame.boot, compRevision: frame.q,
    now: Math.max(state.now ?? 0, frame.t),
    players: frame.players.map((p) => ({ ...(prior.get(p.userId) ?? {}), ...p,
      // Dynamic amounts must belong to this admitted snapshot. An omitted
      // value is unavailable, not permission to reuse an older equity cap.
      ...(dynamicBoost ? {
        projectedBoostPower: p.projectedBoostPower ?? null,
        boostMaxExposure: p.boostMaxExposure ?? null,
        boostRemainingExposure: p.boostRemainingExposure ?? null,
      } : {}),
    })),
    stalePricing: frame.stalePricing,
    unscored: frame.unscored,
  };
}

/* REST is a full authoritative snapshot for the explicit new policy only.
   Legacy live REST boards still need their compact causal successor. */
export function roundExecutionOf(state: CompState): RoundExecution | null {
  if (!state.live || state.round?.pricePolicy !== ROUND_EXECUTION_POLICY
      || (state.pricePolicy !== undefined && state.pricePolicy !== state.round.pricePolicy)
      || typeof state.engineBoot !== "string" || !state.round?.id
      || !Number.isSafeInteger(state.compRevision)) return null;
  return parseRoundExecution(state.roundExecution, {
    boot: state.engineBoot, roundId: state.round.id, revision: Number(state.compRevision),
    round: state.round,
  });
}

export function roundBoardState(state: CompState, proof: RoundClockProof | null,
  now: number, wallNow: number): CompState {
  if (!state.live || state.round?.pricePolicy !== ROUND_EXECUTION_POLICY) return state;
  const execution = roundExecutionOf(state);
  const usable = !!execution && roundControlLife(execution, proof, now, wallNow) > 0;
  return {
    ...state, roundExecution: execution,
    complete: state.ok === true && state.complete === true && state.causesComplete === true && usable && !isCompetitionPaused(state)
      && !(state.unscored?.length) && !(state.stalePricing?.length),
  };
}

export function heldRoundPricingCopy(state: CompState | null | undefined): string | null {
  if (!state || state.complete !== true || isCompetitionPaused(state)) return null;
  const execution = roundExecutionOf(state);
  return execution?.marks.some((mark) => mark.held)
    ? "Competition uses last accepted marks until the next qualified update" : null;
}
