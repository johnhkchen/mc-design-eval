# T-206-01 Design — measure closure on the absolute program footprint

## The decision

Replace the T-202 `robustExtent`/`PROUD_TRIM` clamp inside `eaveRingClosure` with a **program-footprint
measure**: register the recognition program's `masses[].rect` to the build frame
(`registerRect` — already the close-shell authority), take its perimeter `ring`, and return the
fraction of that ring backed by a real wall cell (forgiving declared-open `openCols`). Proud-of-footprint
cells are off the ring → ignored. Colonnade gaps land on the ring → read open. Keep **one** closure
authority (`closureOf`/`present/perimeter` math); add **no** third metric.

```
eaveRingClosure(occ, { floor, eaveY, openCols, program, coverageFloor=0.5 }):
  cols = band columns (floor ≤ y ≤ eaveY)         // unchanged
  if cols empty → 0
  reg = program?.masses?.some(rect) ? registerRect(program.masses, cols) : null
  if reg && reg.coverage ≥ coverageFloor:          // TRUSTED footprint (ambiguous IGNORED, as closeShell)
      ring = reg.ring                              // the registered footprint perimeter (clean rect)
      present = |{ c ∈ ring : cols.has(c) ∨ openCols.has(c) }|
      return ring.size ? present / ring.size : 0
  // FALLBACK (no program / registration below trust): raw band perimeter, NO clamp
  ring = perimeterColumns(cols)
  if no openCols → closureOf(ring)
  else → present/perimeter forgiving openCols       // == today minus the clamp
```

This reads, on the real fixtures (all validated in research):
colonnade seed **0.6078**, closed+relief **0.9375**, reopened **0.8393** — exactly the falsifiable claim.

## Why this approach

The ticket names the root cause precisely: T-202's clamp trims perimeter extremes to forgive proud
relief but **also forgives the colonnade's distributed gaps**. The clamp conflates *missing inside the
footprint* (open) with *extra outside it* (proud, fine). The program footprint is the object that
distinguishes them: it is the **intended** wall plane, fixed by recognition, not derived from the
(proud-polluted) occupancy. A footprint-perimeter column with no wall cell is unambiguously *missing*;
a cell off the footprint is unambiguously *extra*. The clamp tried to recover the intended plane
statistically from the same noisy columns it was measuring — the footprint just *is* that plane.

It also closes the **two-numbers-disagree** bug structurally: `close_shell` already builds its dense
shell from `registerRect(program.masses, cols)`. If the form metric measures the *same* registered
ring, the gate and the hand are reading one geometry. We make `closeShell` report its
`closureBefore`/`closureAfter` *through* `eaveRingClosure` with its program, so the agreement is
byte-identical by construction, not a coincidence of two near-equal numbers.

## Options considered

**A. Register the program footprint, measure ring-backed fraction (CHOSEN).** Reuses `registerRect`
(the close-shell authority) and `closureOf`'s present/perimeter math. Proud cells ignored *by
construction* (off-ring). Distinguishes missing-inside from extra-outside exactly as the ticket asks.
Validated: 0.6078 / 0.9375 / 0.8393. Cost: needs the program threaded to the call sites (the runner
already has `PROGRAM`; the tests already load `T202_PROGRAM`).

**B. Keep measuring the occupancy band but mask proud cells by face-exposure (≥4/6 exposed → proud).**
Rejected: invents a *third* metric (a proud-cell classifier) the ticket explicitly forbids ("no third
metric"), and a face-exposure heuristic on a 2-D column projection is exactly the kind of statistical
plane-recovery that T-202 already got wrong. No fixed program plane → no clean missing-vs-extra split.

**C. Tighten the `robustExtent` percentile (e.g. trim only the top 2%, or use an absolute 1-cell
shave).** Rejected: it is the *same* clamp with a different constant. The colonnade's gaps are
*distributed around the whole perimeter*, not a thin fringe — no percentile separates them from proud
tips, because both are minority columns. Tuning the constant trades the colonnade read against the
relief read (the coupling the ticket warns about). A constant can't encode "which plane was intended."

**D. Make the metric = closeShell's `closureBefore` directly (raw band perimeter, drop the clamp
entirely, no footprint).** Rejected: raw band perimeter reads the colonnade open (0.6154, good) but
**craters on proud relief** (the original T-202 failure: 1.000 → 0.068). It satisfies the colonnade and
agreement criteria but fails "closed shell + proud relief ≥ 0.9". The footprint path is what makes
proud-invariance and colonnade-honesty *simultaneously* true.

## How each acceptance criterion is met

- **Closure on the absolute footprint; clamp removed; one authority.** Option A registers
  `program.masses[].rect`; `PROUD_TRIM` + the `robustExtent` clamp are deleted from `eaveRingClosure`.
  Measurement reuses `registerRect.ring` (built from `perimeterColumns`/`filledRect`) and the same
  `present/perimeter` ratio `closureOf` uses — no new metric.
- **Three real fixtures.** New tests: colonnade seed → 0.6078 (<0.9); closed 15×15 + real
  `buildWallRelief` (224 quoins + plinth) → 0.9375 (≥0.9); reopened (9-col drop) → 0.8393 (<0.9). The
  closed+relief fixture uses the **real** relief geometry, not a synthetic stand-in.
- **Agreement asserted.** New test: `eaveRingClosure(seed, {program})` ===
  `closeShell(seed, {program}).report.closureBefore` (both now route through the footprint metric →
  byte-identical). The T-202 review's synthetic one-segment drop is *not* used; the real distributed-gap
  colonnade seed is the fixture (per the ticket Notes).
- **`formReadyGate` + 0.9 gate correctly.** The gate is unchanged; it now receives 0.6078 on the
  colonnade (→ detail blocked, `close_shell` forced) and 0.9375 on closed+relief (→ detail allowed). A
  gate-behaviour test asserts both directions on the real readings.
- **Behaviour preserved; `npm test` green; frozen instrument untouched.** `closeShell` decisions are
  made on `coverage ≥ coverageFloor` (unchanged); only its *reported* `closureBefore/After` route
  through the new metric (still `<1` / `==1` where the tests assert). `constructWalls`,
  `recessClosureGuard` untouched. No file under `measurements/` changes.

## Named risks / residuals (anti-hedge)

- **Ambiguous-but-correct seed.** The seed registers AMBIGUOUS (near-square axis tie) yet reads
  correctly (coverage 0.685, 0.6078 ≈ closeShell's 0.6154). We **ignore `ambiguous`** and gate on the
  coverage trust floor (0.5), mirroring `closeShell`. If a future subject registers *below* trust the
  metric falls back to the raw band perimeter (honest about colonnades, not proud-invariant) — logged,
  not faked.
- **Mild proud coupling.** Closed+relief reads 0.9375, not 1.000: the proud fringe nudges
  `registerRect`'s robust extent ~1 cell outward at corners. It clears 0.9 with margin; named, not
  hidden. If relief ever grew enough to push a closed shell <0.9 the fix would be in `registerRect`'s
  trim, not a new clamp — out of scope here, flagged.
- **Single-mass only.** `registerRect.ring` is a clean rectangle for the gatehouse's one mass.
  Multi-mass programs union perimeters incl. the internal shared edge — untested; the gatehouse is
  single-mass, so this ticket does not exercise it. Flagged for the L-shaped subjects (cottage).
- **No-program fallback drops the clamp.** WG-CS1/CS8/CS9 are proud-free, where the clamp was a
  documented no-op, so they stay byte-identical. WG-CS6/CS7 (proud) are rewritten to pass the program
  (already loaded in the test) — they now exercise the *real* metric the runner uses.
