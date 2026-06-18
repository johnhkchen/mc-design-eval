# T-206-01 Review — form-readiness-truth-on-the-absolute-footprint

**Epic E-53 / Story S-206 — the lead fix.** The E-52 capstone (T-205) stalled at score 0 because
T-202's `robustExtent` clamp in `eaveRingClosure` over-corrected: trimming perimeter extremes to forgive
proud relief also absorbed the colonnade's distributed gaps, so the open gatehouse seed read **0.980 =
form-ready**, `close_shell` was never picked, detail ran on an open form, the judge scored 0. This ticket
makes the metric measure closure on the **absolute program footprint**, so the colonnade reads open.

## What changed

| File | Change |
|---|---|
| `src/view/wall-generate.mjs` | `eaveRingClosure` measures on the registered program footprint (`registerRect.ring`); T-202 `robustExtent` clamp removed; `PROUD_TRIM` export deleted; `closeShell` reports closure through the same metric |
| `src/view/wall-generate.test.mjs` | WG-CS6/7/8 reworked for the footprint path; WG-CS10–14 added (5 new) |
| `experiments/eval-alignment/picture-climb.mjs` | `closureNow` / `closureAfter` / probe thread `program: PROGRAM`; comment updated |
| `docs/active/work/T-206-01/footprint-evidence.mjs` | new zero-spend, real-subject proof of the falsifiable claim |
| `docs/active/work/T-206-01/{research,design,structure,plan,progress,review}.md` | RDSPI artifacts |

Two commits: the metric+tests (COMMIT 1), the runner+evidence+docs (COMMIT 2).

## The mechanism, before → after

`eaveRingClosure(occ, { floor, eaveY, openCols, program, coverageFloor=0.5 })`:
- **With a trusted program** (`coverage ≥ coverageFloor`): register `program.masses[].rect` to the build
  frame, take its perimeter ring, return `|{ring cols backed by a wall cell or declared-open}| / |ring|`.
  A footprint-perimeter column with no wall cell → **open**; a cell proud of the footprint → off-ring →
  **ignored**. This is the *missing-inside* vs *extra-outside* split T-202 conflated.
- **No program / below trust**: falls back to the raw band-perimeter `closureOf` (no clamp) — byte-
  identical to the prior metric on proud-free rings.
- `ambiguous` is **ignored** (the near-square gatehouse registers AMBIGUOUS but correct: coverage 0.685,
  reading 0.608 ≈ closeShell's 0.615) — mirroring `closeShell`, which already accepts on coverage alone.

## Test coverage

- **Unit (authoritative), `wall-generate.test.mjs`, 34 tests, all green:**
  - WG-CS10 — colonnade seed → **0.608** (<0.9). The real seed, not a synthetic stand-in.
  - WG-CS11 — closed shell + **real** `buildWallRelief` (224 quoins + 60 plinth) → **0.9375** (≥0.9).
  - WG-CS12 — reopened shell (9-col straight-run drop) → **0.839** (<0.9).
  - WG-CS13 — agreement: `eaveRingClosure(seed, {program})` **===** `closeShell(...).report.closureBefore`
    (byte-equal, both 0.6078).
  - WG-CS14 — `formReadyGate`: relief BLOCKED @0.608, close_shell ALLOWED @0.608, relief ALLOWED @0.938.
  - WG-CS6/7 reworked to pass the program (now exercise the runner-true metric); WG-CS8 keeps the proud-
    free no-op readings on the fallback path.
- **Integration (zero-spend), `footprint-evidence.mjs`:** asserts all five conjuncts on the live seed,
  prints the OLD-clamp-vs-NEW contrast (0.9796 → 0.6078), exits 0.
- **Full suite:** `npm test` → **2416/2416** (was 2411; +5).
- **Runner:** `node --check` clean. **Not** unit-tested (not in the `src/**/*.test.mjs` glob) — covered by
  the evidence probe. A full metered climb is **S-208**, deliberately out of scope here.

## Acceptance criteria — all met

- [x] `eaveRingClosure` on the absolute footprint; clamp removed/replaced; one `closureOf` authority, no
      third metric.
- [x] Unit-tested on three real fixtures: 0.608 / 0.9375 / 0.839.
- [x] Agreement asserted (seed reading === `closeShell.closureBefore`).
- [x] `formReadyGate` + 0.9 gate correctly (colonnade → detail blocked, close_shell forced;
      closed+relief → detail allowed).
- [x] Recorded honestly; `npm test` green; `closeShell`/`constructWalls`/`recessClosureGuard` preserved;
      frozen instrument untouched (`git status` shows nothing under `measurements/`).

## Open concerns / residuals (anti-hedge — named, not hidden)

1. **Mild proud coupling (the ticket's named failure check).** Closed+relief reads **0.9375, not
   1.000** — the proud quoin fringe nudges `registerRect`'s robust extent ~1 cell outward at corners, so
   a few footprint-ring columns fall just off a real post. It clears the 0.9 gate with margin and the
   colonnade/relief reads are **not** coupled at the seed (the ticket's "re-craters the relief read"
   failure does not bite). But the margin is ~0.04: if a future relief grew the proud fringe enough to
   push a closed shell <0.9, the fix belongs in `registerRect`'s trim, **not** a re-introduced clamp.
   Flagged for whoever next touches relief density.
2. **Single-mass only.** `registerRect.ring` is a clean rectangle for the gatehouse's one mass. Multi-
   mass (L-shaped) programs union perimeters including the internal shared edge — **untested** here. The
   cottage/barn subjects will exercise it; the footprint measure over a non-convex union is plausible but
   unverified. Boundary, not a defect.
3. **Stale T-197 probe.** `docs/active/work/T-197-01/closeshell-evidence.mjs` calls `eaveRingClosure`
   without a program; its `before` now reads the raw fallback (0.6154) rather than the footprint (0.6078)
   — both read OPEN so its gate logic still passes, but the number differs from the runner-true reading.
   Left as a historical artifact; the **T-206 probe** is the current evidence. Low priority.
4. **Runner not climbed.** This ticket proves the metric tells the truth (zero spend). Whether the metered
   climb now picks `close_shell` → closes → unlocks detail → clears majors is **S-208** (the capstone re-
   climb), gated on this fix plus the detail-credit story (S-207). The claim here is narrow and verified:
   *the gate now sees the form open.*

## Handoff

The lead fix is in and green. The form metric agrees with `close_shell` and reads the colonnade open, so
the form-before-detail gate will force `close_shell` on the seed. E-53's remaining stories build on this:
S-207 (detail-credit, contingent) and S-208 (the metered re-climb that exercises the whole chain). No
human action required to land this ticket; concern #1 is the one to watch as relief evolves.
