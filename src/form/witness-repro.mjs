// WITNESS-REPRO DECISION CORE (T-142-01, story S-142, epic E-34) — the SKIP-vs-FAIL classifier the
// re-derivation witnesses share. The S-138 review named the gap: three witness/record families went
// FAIL-not-SKIP when T-138-01/02's sanctioned rotations retired the inputs they pin. A witness
// reproduces against its PINNED source; the honest verdict when that source was rotated by an owning
// ticket is a NAMED SKIP (the gatehouse-current artifact-pin precedent, promoted from "artifact" to
// "any pinned source"), never a bare DIVERGES — but a source that did NOT change yet produces a
// different witness is genuine corruption and must still FAIL.
//
// PURE — no IO, no Date/random — runs under the `src/**/*.test.mjs` glob, so the SKIP-vs-FAIL
// regression test (AC3) lives in `npm test`. The runners are the thin IO leaves: they read the
// committed record's pinned sha and the source's current sha, look up the retired-pin registry (a
// committed JSON sidecar — kept out of runner SOURCE so the generalization self-grep stays clean),
// and call classifyWitnessRepro. One core, both families.
//
// THE REGISTRY certifies a SPECIFIC retirement: { slug, retiredSourceSha, ticket, reason }. Keying
// the SKIP on retiredSourceSha === the pinned sha means a FURTHER, undeclared change of the same
// slug still FAILs — the registry is a named record of one rotation, not a blanket licence to drift.

export const WITNESS_REPRO_VERDICT = Object.freeze({ GREEN: "green", SKIP: "skip", FAIL: "fail" });

/** Registry lookup by slug. Returns the entry or null. The registry is an array of
 *  { slug, retiredSourceSha, ticket, reason } (a committed sidecar, runner-loaded). */
export function retiredEntry(slug, registry) {
  if (!Array.isArray(registry)) return null;
  return registry.find((e) => e && e.slug === slug) ?? null;
}

/**
 * The SKIP-vs-FAIL decision. Pure.
 * @param {{pinnedSourceSha:string, currentSourceSha:string|null,
 *          retired:{slug:string,retiredSourceSha:string,ticket:string,reason:string}|null,
 *          derivedMatches?:boolean}} args
 *   pinnedSourceSha   the source sha the committed witness recorded
 *   currentSourceSha  the source's sha on disk now; null = the source is gone
 *   retired           the registry entry for this slug, or null
 *   derivedMatches    did re-derivation byte-match the committed record? (consulted ONLY when the
 *                     source is unchanged — the corruption test; pass undefined otherwise)
 * @returns {{verdict:"green"|"skip"|"fail", reason:string}}
 */
export function classifyWitnessRepro({ pinnedSourceSha, currentSourceSha, retired = null, derivedMatches } = {}) {
  const skip = (e) => ({ verdict: WITNESS_REPRO_VERDICT.SKIP, reason: `pinned source retired by ${e.ticket}: ${e.reason}` });
  const fail = (reason) => ({ verdict: WITNESS_REPRO_VERDICT.FAIL, reason });

  if (typeof pinnedSourceSha !== "string" || pinnedSourceSha.length === 0) {
    return fail("no pinned source sha on the committed witness record — cannot classify");
  }
  // the source is gone: a registered retirement explains it; otherwise a missing input is a failure
  if (currentSourceSha === null || currentSourceSha === undefined) {
    return retired && retired.retiredSourceSha === pinnedSourceSha
      ? skip(retired)
      : fail("pinned source is missing and no sanctioned rotation registers its retirement");
  }
  // the source is unchanged: the witness MUST reproduce it — a divergence here is corruption, never
  // a skip (the regression test's FAIL arm)
  if (currentSourceSha === pinnedSourceSha) {
    return derivedMatches === false
      ? fail("source is unchanged but the re-derivation diverges from the committed record — corrupted witness, not a rotation")
      : { verdict: WITNESS_REPRO_VERDICT.GREEN, reason: "source unchanged; re-derivation reproduces the committed record" };
  }
  // the source bytes changed: a declared retirement of THIS pinned version skips; anything else fails
  if (retired && retired.retiredSourceSha === pinnedSourceSha) return skip(retired);
  return fail("pinned source changed but no sanctioned rotation registers this retirement — investigate before re-banking");
}
