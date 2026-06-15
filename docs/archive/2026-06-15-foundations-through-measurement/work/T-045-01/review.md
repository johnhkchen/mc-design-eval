# T-045-01 — Review: deterministic-revision-loop

Handoff for a human reviewer. What changed, how it's tested, and the open concerns. The ticket wires
the loop E-11 left open: it consumes the diagnose-and-route critic and hill-climbs the E-15 form metric,
with a **deterministic** tweak so the **cage** (lock + accept-gate + convergence) is proven before any
model joins (T-046-01).

## What changed

**New files (all additive — no existing module modified):**

| File | Lines | What |
|------|-------|------|
| `src/revise/tweak.mjs` | ~210 | Placement-level scoped passes: `reliefPass` (Z move, clamped to R), `materialPass` (block swap), `scopedTweakFor`/`tweakLabel` (route→editor), `proceduralDiagnose` (model-free geometric), `boxesIntersect`. Pure. |
| `src/revise/tweak.test.mjs` | ~170 | 10 unit tests (TA–TE). |
| `src/revise/loop.mjs` | ~210 | `reviseLoop` (the control flow + accept-gate + trace) and `liveFormScore` (the lazy GL form-score seam). |
| `src/revise/loop.test.mjs` | ~210 | 7 unit tests (LA–LG) — the cage proof. |
| `render/test/revise-loop.live.test.mjs` | ~50 | GL-gated live render-score proof on the koi (not in `npm test`). |
| `docs/active/work/T-045-01/*.md` | — | RDSPI artifacts (research → review). |

**Two atomic commits on `main`:** scoped passes + diagnose; then the loop + tests + live proof.

## How it satisfies the acceptance criteria

- **AC #1 — `reviseLoop` pipeline + per-iteration trace.** `reviseLoop(artifact, {regions, score,
  diagnose, observe, budget, intent, fraction, epsilon})` walks a deterministic region list; per region
  it selects R, (optionally observes), diagnoses, then tries ≤ `perRegion` scoped procedural tweaks —
  applies each via `applyRegionEdit` (the T-044 region-lock), re-scores, **accepts the first strict
  improvement (and locks R) else rolls back**. Returns `{artifact, trace, iterations, converged,
  locked}`; each trace entry carries `region, defect, route, tweak, scoreBefore, scoreAfter, accepted,
  reason` — the ticket's required fields (asserted in LF).
- **AC #2 — unit tests prove the cage.** `convergence` (LA: terminates `converged:true`,
  `iterations ≤ regions×perRegion`, score improves); `accept-gate` (LB: a constant/non-improving score
  → every attempt rolled back, returned artifact **deep-equal to input**); `spatial lock` (LC: an
  accepted region locks; an overlapping region is **skipped**; every cell outside the accepted bounds is
  byte-identical, the T-044 invariant re-asserted at loop scope); `determinism` (LD: two runs →
  identical trace + artifact).
- **AC #3 — no model/SDK; render seam isolated.** Default `diagnose` is the **model-free**
  `proceduralDiagnose`; no SDK/`claude -p`/BAML is imported or called anywhere in the loop. The only
  live dependency is the **score render**, isolated in `liveFormScore` behind `await import()`; pure
  tests inject a synthetic score and load no GL — enforced by the **static import scan** (LE).
- **AC #4 — `npm test` green.** 432 pass / 0 fail (was 415; +10 tweak, +7 loop).

## Test coverage & evidence

- **Pure unit suite (17 new tests, in `npm test`):** the passes (clamp-at-face, material invariance,
  purity, determinism), the selector, the geometric diagnosis, and the whole cage. The accept-gate and
  spatial lock — the two properties most likely to be wrong — each have a dedicated test with a
  constructed adversarial input (a non-improving score; two deliberately overlapping regions).
- **GL-gated integration proof:** `render/test/revise-loop.live.test.mjs` runs one real `reviseLoop`
  over the committed koi with `liveFormScore`, rendering and computing silhouette IoU end-to-end
  (passes locally with GL, ~1.3 s; skips when GL absent). This proves the isolated seam is real, not
  just stubbed.
- **Determinism is structural, not incidental:** the loop has no RNG/clock; passes are integer
  transforms; `before` is computed once per region. LD pins it.

## Open concerns & limitations (for the reviewer)

1. **`proceduralDiagnose` is a deliberate placeholder.** It routes from *geometry* (flat depth →
   relief; uniform block → material; else clean), not from *vision*. On a real, rich sculpture (the koi)
   it correctly returns **clean** — so the default deterministic loop will often do nothing useful until
   the **model critic** replaces it (T-046-01). That is by design (this ticket proves the cage, not the
   diagnosis), but a reviewer should not read "the loop runs on the koi and improves it" into this
   ticket — it does not, with the default diagnose. The live proof therefore **injects** a forced route
   to exercise the score seam.
2. **Whole-object IoU, not region IoU, by default.** `liveFormScore` scores the **whole** silhouette;
   mapping a 3-D `subBounds` to the render's 2-D rect for `regionIoU` is a camera projection left out of
   scope. A local edit is thus judged by its effect on the *global* silhouette — honest but coarse; a
   caller can pass an explicit 2-D `region`. Revisit when a projection helper exists.
3. **Does relief actually move the form score?** A Z (depth) move changes the 3/4 projection, so it
   *can* raise IoU — but whether it *does* on a given subject is empirical and GL-bound; the unit proof
   uses a synthetic monotone score (`zSum`) to prove the gate mechanics, not real-koi improvement. The
   real hill-climb behavior is a benchmark question (S-045's follow-on), not a unit assertion.
4. **`material` is a guaranteed no-op under a silhouette score** (it never moves geometry) — included as
   the honest negative case the gate rolls back. If a future scorer becomes color-aware, material would
   start to bite; the gate handles that transparently (it only ever accepts strict improvements).
5. **Rejected regions are abandoned, not retried across passes.** The loop visits each list entry once.
   A multi-pass "revisit until quiescent" strategy is a *different* region list / outer loop the caller
   composes — intentionally not baked in (keeps termination structural and the trace flat).

## Suggested follow-ups (next tickets)

- **T-046-01 (S-046):** swap `proceduralDiagnose` → the E-11 model critic and add the freeform LLM
  editor behind this same `applyRegionEdit` lock + accept-gate. The seams (`diagnose`, `observe`,
  `tweakFor`) are already the injection points; no loop change needed.
- A `regionIoU` projection helper so local edits get a **local** accept signal.
- A benchmark driver (`benchmarks/sculpture/revise-*.mjs`) running `reviseLoop` live across the 13
  E-13 subjects to measure real Δ-IoU per revision.

## Bottom line

The cage is built and proven: edits cannot escape a region, an accepted region is frozen, and a tweak
that doesn't raise the form metric is discarded — deterministically, with a full trace, and no model in
the loop. The model can now be dropped into a proven harness rather than an unproven one.
