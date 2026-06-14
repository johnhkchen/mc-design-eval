// PIN GUARD (T-119-01, story S-119, epic E-30) — structural protection for committed pins.
//
// Two T-116 incidents proved vigilance is not protection: (1) a reskin "refresh" re-ran the
// judge through component-skin's chain spawn and re-rolled three styled verdict sets (reverted,
// pins restored byte-identically); (2) `npm run kit:extract --subject=barn` — missing `--`, npm
// swallowed the flag — live-swept and overwrote the three legacy kit pins (restored from HEAD).
//
// THE RULE (docs/knowledge/pin-rotation-policy.md): a committed record changes only inside a
// ticket that explicitly owns it, behind the explicit rotation flag. Mechanically:
//
//   - "frozen pin" = on the INSTRUMENT ALLOWLIST *and* git-tracked (E-36 / S-151: "frozen once
//     MEASURED; draft until then"). A path freezes only if it is a measurement or an input-of-record
//     to one (judge verdicts, ratified packs, committed baselines/milestones, the kit vocabulary,
//     retired-pins) AND has been committed. DRAFT creation artifacts (generated/*, workshop/*
//     pre-verdict, recognition/*, chain intermediates) are NOT pins and rewrite freely even when
//     committed — being tracked no longer makes a draft infrastructure. New / untracked instrument
//     records also write freely the first time — first derivations are never blocked.
//   - byte-identical rewrites always pass: the determinism flows (zone:map regeneration,
//     kit --offline, --repro double-runs) rewrite committed bytes on purpose.
//   - everything else REFUSES, naming the pin, the reason, and the remedy. Refusal is the
//     DEFAULT, so a swallowed rotation flag fails CLOSED (the missing-`--` failure mode can no
//     longer sweep anything).
//   - preflightPins runs BEFORE any spend (metered model call, judge spawn): the refusal lands
//     before the money, not after.
//
// PURE/LIVE split (project idiom): decidePinWrite/refusalMessage/preflightPins are pure and
// unit-tested; loadTrackedSet/guardedWriteRecord are the thin IO leaves (fail-closed: if git
// itself errors, every path reads as tracked and differing writes refuse).
//
// Scope: .json/.md records — callers never route PNGs here (renders are GL-nondeterministic and
// are evidence, not pins; the E-24/E-28 "GL bytes never decide" principle).

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export const ROTATE_FLAG = "--rotate-pins";
export const POLICY_DOC = "docs/knowledge/pin-rotation-policy.md";

/** THE INSTRUMENT ALLOWLIST (E-36 / S-151; T-155-01 / E-37) — the one named, documented place that
 *  decides whether a path is part of the frozen measurement. A path is a "pin" only if it matches one
 *  of these AND is git-tracked (see guardedWriteRecord/preflightPins). Everything else is a DRAFT and
 *  rewrites freely.
 *
 *  T-155-01 collapses the old five-entry hand-list into a PATH PREFIX: the frozen records now all live
 *  under the top-level `measurements/` home (gate verdicts, baselines, milestones, kit, the rotation
 *  registry) — **location encodes status**. The only other frozen home is ratified `packs/` (already
 *  location-encoded, `packs/drafts/` being the draft exception). Two prefixes, not five predicates.
 *
 *  TRANSITIONAL (T-155-01, removed in the final step): while the frozen records are still mid-move from
 *  their scattered `benchmarks/sculpture/` locations, the third entry keeps the OLD paths frozen so no
 *  record un-freezes during the relocation. Each `git mv` step drops files into `measurements/` (caught
 *  by the first prefix); the transitional entry is deleted once every class has moved. */
export const MEASUREMENTS_PREFIX = "measurements/";

export const INSTRUMENT_ALLOWLIST = Object.freeze([
  { reason: "the frozen-measurement home — gate verdicts, baselines, milestones, kit, the rotation " +
            "registry (E-37: location encodes status)",
    match: (rel) => rel.startsWith(MEASUREMENTS_PREFIX) },
  { reason: "ratified packs of record (packs/drafts/* are structurally not packs)",
    match: (rel) => rel.startsWith("packs/") && !rel.startsWith("packs/drafts/") && rel.endsWith(".json") },
  // TRANSITIONAL — the scattered pre-move frozen locations (T-155-01); deleted once every class lands
  // under measurements/. Drafts are subject-named so the baseline/milestone suffix match is collision-free.
  { reason: "TRANSITIONAL (T-155-01): frozen records not yet relocated to measurements/",
    match: (rel) =>
      rel.startsWith("benchmarks/sculpture/multi-angle/") ||
      /(?:^|\/)[^/]*-(?:baseline|baselines|milestone)\.(?:json|md)$/.test(rel) ||
      rel === "benchmarks/sculpture/retired-pins.json" ||
      rel.startsWith("benchmarks/sculpture/kit/") },
]);

/** Pure: is this repo-root-relative path part of the frozen instrument? (Membership only — the
 *  freeze also requires git-tracked status; see guardedWriteRecord/preflightPins.) */
export function isInstrumentPath(rel) {
  return INSTRUMENT_ALLOWLIST.some((entry) => entry.match(rel));
}

/** Gate-record namespaces — the frozen judge's committed verdicts. A WORKSHOP-domain caller
 *  (E-31 Rule 1, T-126-01) may never write here: the refusal is structural and absolute —
 *  neither the rotation flag nor a sanction overrides it (judge isolation, not pin rotation). */
// Both the new frozen home and the transitional pre-move location during T-155-01's gate-verdict move;
// the old entry is dropped once measurements/multi-angle/ is the sole verdict home.
export const GATE_RECORD_NAMESPACES = Object.freeze([
  "measurements/multi-angle/",
  "benchmarks/sculpture/multi-angle/",
]);

/** Pure domain refusal: a "workshop" write into a gate-record namespace returns the refusal
 *  reason; every other (domain, rel) pair returns null. Domains other than "workshop" are
 *  untouched (the nine pre-T-126 writers pass no domain at all). */
export function domainRefusal(domain, rel) {
  if (domain !== "workshop") return null;
  for (const ns of GATE_RECORD_NAMESPACES) {
    if (rel.startsWith(ns)) {
      return `workshop-domain write into the gate-record namespace "${ns}" — the workshop is structurally isolated from the frozen judge (E-31 Rule 1); no flag or sanction permits this`;
    }
  }
  return null;
}

export class PinGuardError extends Error {
  constructor(message, pins = []) {
    super(message);
    this.name = "PinGuardError";
    this.pins = pins; // [{ rel, reason }]
  }
}

/** The decision core. `frozen` = path is a committed instrument pin (on the allowlist AND tracked);
 *  `rotate` = the explicit flag (or a named sanction). Returns { action: "write" | "skip-identical"
 *  | "refuse", reason }. */
export function decidePinWrite({ frozen, exists, currentContent = null, nextContent, rotate = false }) {
  if (!frozen) return { action: "write", reason: "unpinned (draft — not a frozen instrument)" };
  if (exists && currentContent === nextContent) {
    return { action: "skip-identical", reason: "byte-identical rewrite of the committed pin" };
  }
  if (rotate) {
    return { action: "write", reason: exists ? "explicit pin rotation" : "explicit pin restore (tracked file absent on disk)" };
  }
  return {
    action: "refuse",
    reason: exists
      ? "would overwrite the committed pin with different bytes"
      : "tracked pin absent on disk — restoring it needs the explicit flag (or git checkout)",
  };
}

/** One refusal line: which pin, why, and the remedy. */
export function refusalMessage({ rel, reason, intent = "this write" }) {
  return `pin-guard: REFUSED ${intent} — ${rel} is a committed pin (${reason}). ` +
    `Canonical records change only inside a ticket that owns them: re-run with ${ROTATE_FLAG} (see ${POLICY_DOC}).`;
}

/** BEFORE-SPEND gate: a live run declares every record path it intends to (re)write; if any is a
 *  committed pin and the rotation flag is absent, throw ONE error naming them all. Returns the
 *  rotation ledger otherwise so callers can log what they are about to rotate. */
export function preflightPins({ pins, rotate = false, intent = "live run", domain = null }) {
  const denied = pins
    .map((p) => ({ rel: p.rel, reason: domainRefusal(domain, p.rel) }))
    .filter((p) => p.reason !== null);
  if (denied.length > 0) {
    throw new PinGuardError(
      `pin-guard: REFUSED ${intent} — ${denied.length} write${denied.length === 1 ? "" : "s"} cross the judge-isolation boundary:\n` +
      denied.map((p) => `  - ${p.rel} (${p.reason})`).join("\n"),
      denied,
    );
  }
  // A pin is FROZEN only if it is on the instrument allowlist AND committed: tracked drafts
  // (generated/*, workshop/* pre-verdict, recognition/*, chain intermediates) sail through (E-36).
  const frozen = pins.filter((p) => p.tracked && isInstrumentPath(p.rel)).map((p) => p.rel);
  if (rotate || frozen.length === 0) return { refused: [], rotating: rotate ? frozen : [] };
  throw new PinGuardError(
    `pin-guard: REFUSED ${intent} — it would overwrite ${frozen.length} committed pin${frozen.length === 1 ? "" : "s"}:\n` +
    frozen.map((r) => `  - ${r}`).join("\n") +
    `\nCanonical records change only inside a ticket that owns them: re-run with ${ROTATE_FLAG} (see ${POLICY_DOC}).`,
    frozen.map((rel) => ({ rel, reason: "committed pin targeted by a live rebuild" })),
  );
}

// --- thin IO (fail-closed) -----------------------------------------------------------------------

const trackedCache = new Map();

/** Repo-root-relative tracked set via one cached `git ls-files -z`. On any git failure returns
 *  null — and a null set reads as "everything is tracked": differing writes refuse (fail closed). */
export function loadTrackedSet(root) {
  if (trackedCache.has(root)) return trackedCache.get(root);
  let set = null;
  try {
    const res = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (res.status === 0 && typeof res.stdout === "string") set = new Set(res.stdout.split("\0").filter(Boolean));
  } catch { /* fail closed */ }
  trackedCache.set(root, set);
  return set;
}

export function isTracked(trackedSet, rel) {
  return trackedSet === null ? true : trackedSet.has(rel);
}

/** The drop-in for record writeFile()s. `rel` is repo-root-relative (matches git ls-files).
 *  `sanction` is a named standing allowance (e.g. the T-114 rejudge completion) — it permits the
 *  write like the flag does, and is logged in its own words. */
export async function guardedWriteRecord({ root, rel, content, rotate = false, sanction = null, trackedSet = undefined, domain = null }) {
  const denial = domainRefusal(domain, rel);
  if (denial !== null) {
    throw new PinGuardError(`pin-guard: REFUSED write — ${rel}: ${denial}`, [{ rel, reason: denial }]);
  }
  const set = trackedSet === undefined ? loadTrackedSet(root) : trackedSet;
  // FROZEN = instrument allowlist ∧ committed (E-36 / S-151). A tracked draft is not frozen.
  const frozen = isInstrumentPath(rel) && isTracked(set, rel);
  const abs = join(root, rel);
  const exists = existsSync(abs);
  const currentContent = exists ? await readFile(abs, "utf8") : null;
  const d = decidePinWrite({ frozen, exists, currentContent, nextContent: content, rotate: Boolean(rotate) || Boolean(sanction) });
  if (d.action === "refuse") {
    throw new PinGuardError(refusalMessage({ rel, reason: d.reason }), [{ rel, reason: d.reason }]);
  }
  if (d.action === "skip-identical") return d;
  if (frozen) console.error(`[pin-guard] ROTATING pin ${rel} (${sanction ?? `explicit ${ROTATE_FLAG}`})`);
  await writeFile(abs, content);
  return d;
}
