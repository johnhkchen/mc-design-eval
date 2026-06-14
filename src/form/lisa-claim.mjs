// LISA CLAIM (T-157-01, story S-157, epic E-37) — a checkable per-ticket claim so a second thread
// SEES the first instead of racing it. Lisa spawns threads per the ticket DAG (max_threads = 2) and
// two memories record the failure mode: a sibling mid-flight on the SAME ticket
// ([[lisa-same-ticket-concurrency]]), and one ticket double-dispatched to two live threads
// ([[ticket-double-dispatch]]). The DAG's commit lock serializes WRITES; what was missing is
// VISIBILITY — a per-ticket signal a sibling can check before it produces a phase artifact.
//
// This is advisory by design: the enforcement is "look before you produce", not mutual exclusion
// (the scheduler owns that). A claim auto-frees after a stale interval (> a phase) so a crashed
// thread never wedges the ticket. PURE/IO split (the pin-guard idiom): decideClaim/claimRecord/
// claimRel are pure (now is injected — no Date in the test glob); read/write/checkClaim are the
// thin IO leaves. Runs under src/**/*.test.mjs (no GL, no spend, no Date/random in the core).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export const CLAIM_BASENAME = ".lisa-claim.json";
/** Stale after 30 min — longer than any single phase, so a live thread is never falsely evicted,
 *  but a dead one frees within a heartbeat of the next sibling's check. */
export const DEFAULT_TTL_MS = 30 * 60 * 1000;

/** Repo-root-relative claim path for a ticket (lives in its work dir — a draft scratch, not a pin). */
export function claimRel(ticket) {
  if (!/^[A-Za-z0-9._-]+$/.test(ticket)) throw new Error(`claimRel: bad ticket id "${ticket}"`);
  return `docs/active/work/${ticket}/${CLAIM_BASENAME}`;
}

/** Pure builder for the claim contents. `at` is the injected epoch-ms (CLI passes Date.now()). */
export function claimRecord({ ticket, phase = null, session, at }) {
  if (!ticket || !session || !Number.isFinite(at)) {
    throw new Error("claimRecord: ticket, session, and numeric at are required");
  }
  return { schema: "lisa-claim/v1", ticket, phase, session, at };
}

/**
 * PURE decision: given the existing claim (or null), the current time, my session, and the TTL —
 * what is the claim's state from MY perspective?
 *   "free"           no live claim — I may take it
 *   "mine"           the live claim is mine — proceed
 *   "stale"          a claim exists but is older than the TTL — I may reclaim it
 *   "held-by-other"  a fresh claim by another session — DEFER, do not race
 */
export function decideClaim({ existing, now, mySession, ttlMs = DEFAULT_TTL_MS }) {
  if (!existing) return "free";
  if (!Number.isFinite(now) || !mySession) throw new Error("decideClaim: now and mySession are required");
  if (!Number.isFinite(existing.at) || now - existing.at > ttlMs) return "stale";
  return existing.session === mySession ? "mine" : "held-by-other";
}

// --- thin IO leaves ------------------------------------------------------------------------------

/** Read a ticket's claim, or null if none / unreadable (a corrupt claim reads as absent → free). */
export function readClaim(root, ticket) {
  const abs = join(root, claimRel(ticket));
  if (!existsSync(abs)) return null;
  try { return JSON.parse(readFileSync(abs, "utf8")); } catch { return null; }
}

/** Write (take/refresh) the claim. Caller has already decided it is allowed to. */
export function writeClaim(root, { ticket, phase, session, now }) {
  const rec = claimRecord({ ticket, phase, session, at: now });
  const abs = join(root, claimRel(ticket));
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(rec, null, 2) + "\n");
  return rec;
}

/** The checkable gate a thread/hook calls before producing an artifact. */
export function checkClaim(root, { ticket, mySession, now, ttlMs = DEFAULT_TTL_MS }) {
  const existing = readClaim(root, ticket);
  return { status: decideClaim({ existing, now, mySession, ttlMs }), existing };
}
