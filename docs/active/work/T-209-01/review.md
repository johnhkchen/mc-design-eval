# T-209-01 — Review: relief-tolerant closure metric

**Epic E-54 / Story S-209.** Make `eaveRingClosure` read a proud-dressed-but-closed wall as **closed
(≥0.9)** so the T-208 +20 dressed batch stops being rejected as a false reopen — without letting an open
colonnade read closed. **Done; `npm test` 2438/2438 green.**

## What changed

| File | Change |
|---|---|
| `src/view/wall-generate.mjs` | Rewrote the `eaveRingClosure` body (signature unchanged) + doc comment. |
| `src/view/wall-generate.test.mjs` | New imports; reconciled WG-CS10/12 literals; added WG-CS15–19 (5 tests). |
| `docs/active/work/T-209-01/closure-probe.mjs` | New deterministic evidence probe (AC4 witness). |
| `docs/active/work/T-209-01/*.md` | RDSPI artifacts. |

Three commits: the metric fix (+ reconciled literals), the fixtures, the probe/artifacts.

## The core finding (why the ticket's framing was incomplete)

The ticket attributed the 1.000→0.068 collapse to "the footprint ring censuses the **exact** ring, so a
proud-dressed wall reads off-ring." **Measurement showed otherwise.** The footprint census already handles
proud cells (the relieved build reads 0.964 on it). The collapse was the **coverage-floor fallback**: the
gable roof is a solid prism whose base course at `y=eaveY` floods the wall band → `registerRect` coverage
drops to 0.27 < 0.5 → the build leaves the footprint path for the **proud-sensitive raw `closureOf`**, which
the relief fringe craters. The synthetic WG-CS6/CS11 fixtures (bare rings, no roof) never hit that path —
exactly how the bug slipped through T-202/T-206 (the Notes' caution, confirmed).

The fix: **census `[floor..eaveY-1]`** (below the roof's base course). This removes the flood so the
relieved build returns to the footprint path (≈0.96) **and** restores reopen sensitivity (the roof no longer
backs holes below the eave). The ±1-outward-proud tolerance delivers AC1's literal "wall-plane ±1 proud
census" and is proven a *guarded margin*, not the load-bearing part.

## Acceptance criteria

- [x] **`eaveRingClosure` relief-tolerant (wall-plane ±1 proud census), one `closureOf` authority reused, no
      fourth metric, declared aperture handled.** Done in-place; the ±1-proud branch is reached only when the
      column is not already on-ring/declared-open, so the aperture is never double-counted. `registerRect` /
      `bboxOf` / `perimeterColumns` reused; no new metric.
- [x] **Unit-tested on four real fixtures.** WG-CS15 colonnade **0.667 <0.9**; WG-CS16 live close→gable→relief
      **0.964 ≥0.9**; WG-CS17 extent-preserving reopen **0.79 <0.9** (bare + relieved); WG-CS18 the staged
      sequence **stays ≥0.9 after relief** (collapse gone). Real builds, not synthetic stand-ins.
- [x] **`formReadyGate` + the T-208 form-integrity batch guard consume it correctly.** WG-CS19: gate allows
      detail on the relieved build; `acceptsBatch` with `closureBefore` 1.000 / `closureAfter` 0.964 does
      **not** fire the reopen guard → the +20 batch is accepted.
- [x] **Recorded honestly.** Relief preserves a closed reading on the real build (0.964); the invariant
      tension (relief-tolerance vs colonnade-open) and the ±1-proud margin trade-off are documented below and
      in `design.md`.
- [x] **`npm test` green; frozen instrument untouched; WG-CS invariants preserved.** 2438/2438. Only the
      footprint-path metric changed; the no-program fallback is byte-unchanged.

## Test coverage

- **Contract (new):** WG-CS15–18 are the four AC fixtures on real builds; WG-CS19 exercises both consumers.
- **Regression:** WG-CS1–14 + the full 2438-test suite guard every prior closure invariant (colonnade open,
  no-program fallback values, aperture forgiveness, `closeShell` agreement, gate behaviour).
- **Deterministic integration:** `closure-probe.mjs` replays the live runner sequence offline — AC4 without
  metered spend. The metric change is deterministic and the runner already routes through `eaveRingClosure`,
  so no metered re-climb was required.

## Open concerns / limitations (flagged for the human reviewer)

1. **Registration rescales to the data → a whole-FACE loss reads ~1.0.** `registerRect` fits the program
   rect to `robustExtent(cols)`; remove an entire face and the extent shrinks one row and re-registers onto
   backed interior cells. The metric detects holes *within* a face (extent-preserving), not the loss of a
   face. This bounds both the metric and the T-208 batch guard's reopen catch. **Named, not assumed handled**
   — it is a residual for E-54's capstone (S-211), recorded in the metric doc comment and `design.md`.
2. **±1-outward-proud is a guarded margin, not load-bearing.** It does not change the relieved reading
   (0.964 with or without); it lifts the colonnade 0.608→0.667 and a reopen 0.794→0.814 — both safely <0.9.
   If a future build erodes that margin, the documented fallback is to drop the proud branch (eave-exclusion
   alone passes all four fixtures). It is in because AC1 asks for it and the tests prove it safe here.
3. **Margin on the relieved build is 0.964 (0.064 over 0.9).** Comfortable but not huge. If it proves
   fragile across other subjects, the documented next lever is censusing `[floor+1..eaveY-1]` (exclude the
   proud plinth too → relieved reads 1.000), gated for short walls. Not taken now (larger change, no current
   need).
4. **Eave-exclusion changes the metric's band for the program path** for every subject, not just the
   gatehouse. Justified (the roof base course is not wall), and the full suite is green, but worth a human
   eye on whether any other subject relied on the eave row being counted.

## Verdict

The lead E-54 fix lands: relief on a closed shell now reads form-ready on the **real** build (0.964), the
+20 dressed batch is no longer rejected, and the open colonnade / reopened shell still read open. The bug
was the coverage fallback under a roof-flooded band, not the ring census — and that is now fixed at the one
closure authority, with the honest residual (full-face loss) named for the capstone.
