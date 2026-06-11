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
//   - "committed pin" is LITERAL: the path is git-tracked (one cached `git ls-files`). New /
//     untracked records write freely — first derivations are never blocked.
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

export class PinGuardError extends Error {
  constructor(message, pins = []) {
    super(message);
    this.name = "PinGuardError";
    this.pins = pins; // [{ rel, reason }]
  }
}

/** The decision core. `tracked` = path is committed (a pin); `rotate` = the explicit flag (or a
 *  named sanction). Returns { action: "write" | "skip-identical" | "refuse", reason }. */
export function decidePinWrite({ tracked, exists, currentContent = null, nextContent, rotate = false }) {
  if (!tracked) return { action: "write", reason: "unpinned (not git-tracked)" };
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
export function preflightPins({ pins, rotate = false, intent = "live run" }) {
  const committed = pins.filter((p) => p.tracked).map((p) => p.rel);
  if (rotate || committed.length === 0) return { refused: [], rotating: rotate ? committed : [] };
  throw new PinGuardError(
    `pin-guard: REFUSED ${intent} — it would overwrite ${committed.length} committed pin${committed.length === 1 ? "" : "s"}:\n` +
    committed.map((r) => `  - ${r}`).join("\n") +
    `\nCanonical records change only inside a ticket that owns them: re-run with ${ROTATE_FLAG} (see ${POLICY_DOC}).`,
    committed.map((rel) => ({ rel, reason: "committed pin targeted by a live rebuild" })),
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
export async function guardedWriteRecord({ root, rel, content, rotate = false, sanction = null, trackedSet = undefined }) {
  const set = trackedSet === undefined ? loadTrackedSet(root) : trackedSet;
  const tracked = isTracked(set, rel);
  const abs = join(root, rel);
  const exists = existsSync(abs);
  const currentContent = exists ? await readFile(abs, "utf8") : null;
  const d = decidePinWrite({ tracked, exists, currentContent, nextContent: content, rotate: Boolean(rotate) || Boolean(sanction) });
  if (d.action === "refuse") {
    throw new PinGuardError(refusalMessage({ rel, reason: d.reason }), [{ rel, reason: d.reason }]);
  }
  if (d.action === "skip-identical") return d;
  if (tracked) console.error(`[pin-guard] ROTATING pin ${rel} (${sanction ?? `explicit ${ROTATE_FLAG}`})`);
  await writeFile(abs, content);
  return d;
}
