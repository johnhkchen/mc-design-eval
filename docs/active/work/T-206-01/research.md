# T-206-01 Research — form-readiness-truth-on-the-absolute-footprint

Epic **E-53** / Story **S-206**. The lead fix. Descriptive only — what exists, where, how it
connects, and the constraints the fix must respect.

## The defect, reproduced (zero-spend seed probe)

Ran the smoking-gun probe against the **real gatehouse colonnade seed**
(`benchmarks/sculpture/generated/gatehouse/artifact.json`, `eaveY=18`, `floor=0`, 232 wall-band
columns) + its program (`benchmarks/sculpture/recognition/gatehouse.program.json`, single mass
`rect{x0:0,z0:0,w:15,d:15}`):

```
current eaveRingClosure (post-T-202 robustExtent clamp) : 0.9796   ← reads FORM-READY (the bug)
raw band-perimeter closureOf(perimeterColumns(cols))    : 0.6154   ← honest: reads OPEN
closeShell.closureBefore (its internal measure)         : 0.6154   ← agrees with raw
registerRect(program.masses, cols)                      : coverage 0.685, axis identity, AMBIGUOUS,
                                                          ring 102 cols, closureOf(ring)=1.000
footprint reading: |ring ∩ bandCols| / |ring| = 62/102  : 0.6078   ← honest: reads OPEN (~0.6)
```

The two numbers disagree by **0.36**: the form gate sees 0.98 (form-ready → detail allowed) while
`close_shell`'s own measure sees 0.615 (open). That disagreement is the stall: the form-before-detail
gate never forces `close_shell`, detail runs on the open colonnade, the judge scores 0.

## Where the metric lives

**`src/view/wall-generate.mjs`** — the one wall-form module. Relevant exports/functions:

- `eaveRingClosure(occ, { floor, eaveY, openCols })` (L300–326) — **THE form-readiness metric**.
  Current body: collect band columns (`floor ≤ y ≤ eaveY`), **clamp** them to a `robustExtent`
  percentile footprint (`PROUD_TRIM=0.05`, L312), take `perimeterColumns(footprint)`, return
  `closureOf(ring)` (closure-except-aperture when `openCols` given). The T-202 clamp is exactly the
  bug: trimming the perimeter extremes to ignore proud relief **also absorbs the colonnade's
  distributed gaps** → 0.98.
- `PROUD_TRIM = 0.05` (L30) — the percentile constant the clamp uses. Only importers:
  `wall-generate.mjs` itself + `wall-generate.test.mjs` (WG-CS8 asserts its range). **No other
  module imports it.**
- `closureOf(ring)` (L160–167) — **the ONE closure authority**: fraction of a ring's own
  bbox-rectangle perimeter that the ring occupies. Clean rect → 1; colonnade → <1. The metric the
  ticket says to reuse — no third metric.
- `registerRect(masses, cols, opts)` (L192–250) — registers the program's `masses[].rect` (0-based
  sketch units) to the **build frame** via an affine fit to the occupancy's robust extent. Returns
  `{ transform, ring, coverage, axis, ambiguous, ... }`. `ring` is the **union of each mass's
  `perimeterColumns(filledRect(rect))`** — i.e. already the footprint *perimeter*. `coverage` =
  `coverageOf(ring, cols)` (fraction of real posts within Manhattan-1 of the ring). `ambiguous` is a
  **report-only** flag (near-square axis tie OR coverage below a diagnostic floor); it never gates.
- `coverageOf(ring, cols, tol=1)` (L137–150), `perimeterColumns`, `filledRect`, `bboxOf` — helpers.
- `closeShell(occ, { program, floor, eaveY, wallField, coverageFloor=0.5 })` (L353–402) — the
  close-the-shell hand. Registers the program rect (`registerRect`), **accepts the dense ring on
  coverage ≥ coverageFloor ALONE, ignoring `ambiguous`** (L367–373), replaces the band with the
  solidified ring. Reports `closureBefore = closureOf(perimeterColumns(cols))` (L363, the raw band
  measure = 0.6154) and `closureAfter = eaveRingClosure(out, {floor, eaveY})` (L399, **no program**).
- `constructWalls(occ, params)` (L418+) — sibling brush; chooses `useReg` iff `reg && !reg.ambiguous
  && closureOf(reg.ring) > closureOf(closeRing)`. **Not touched by this ticket** but shares
  `registerRect`/`closureOf`. Its `ambiguous` guard is the gatehouse-suppression the close-shell hand
  was written to bypass.

## The gate that consumes the scalar

**`src/workshop/climb-gate.mjs`**:
- `FORM_READY_CLOSURE = 0.9` (L71) — the threshold.
- `formReadyGate({ tool, closure, threshold })` (L108) — PURE, takes the **closure scalar** (the
  runner computes it via `eaveRingClosure`) and returns `{allow, reason}`: a DETAIL tool is blocked
  while `closure < threshold`; form tools (`close_shell`, `construct_walls`, roof hands) + `done`
  always pass. Occ-free / GL-free. **No change needed** — it just needs the scalar to tell the truth.
- `closureDecidedMove` / `acceptsRound` (L223+, L271+) — the form-credit accept logic; consumes
  `closureBefore`/`closureAfter` scalars the runner passes. Also unchanged.

## The runner wiring

**`experiments/eval-alignment/picture-climb.mjs`** (the gatehouse climb; not covered by `npm test`):
- `PROGRAM` is loaded early in `main()` (L585), available to every call after.
- `closureNow(o) = eaveRingClosure(o, { floor, eaveY: CFG.eaveY, openCols: openColumns })` (L693) —
  the live form-readiness scalar fed to `agentPick` + `formReadyGate`. **No program passed today.**
- `closureAfter = eaveRingClosure(cand, { floor, eaveY, openCols: openColumns ∪ pendingRebuildCols })`
  (L770–771) — the candidate's recorded form-credit reading. **No program passed today.**
- `openColumns` (L287) — declared-open aperture columns, promoted on a `rebuild_arch` KEEP
  (closure-except-aperture, T-203). Must keep working.
- The REBUILD_ARCH_PROBE evidence (L644–650) calls `eaveRingClosure` without a program — diagnostic
  console output, not asserted.

## Existing tests (the regression surface)

**`src/view/wall-generate.test.mjs`** (runs under `src/**/*.test.mjs`):
- WG-CS1 (L288), WG-CS8 (L403), WG-CS9 (L417) — call `eaveRingClosure` **without** a program; rely on
  the no-program path (clean ring=1, gappy<1, empty=0, openCols forgiveness). WG-CS8 asserts
  `PROUD_TRIM` is in (0,0.25). The clamp is documented there as a **no-op on proud-free rings**.
- WG-CS6 (L373), WG-CS7 (L389) — the T-202 proud-detail tests. Build real `buildWallRelief` geometry
  (224 quoin cells + plinth), call `eaveRingClosure` **without** a program, and rely on the
  `robustExtent` clamp to keep relief-on-closed ≥0.9 and a reopened shell <0.9. **`T202_PROGRAM` and
  `T202_PACK` are already loaded in the test** (L357–358) — the program is at hand to pass.
- WG-CS2/CS3/CS4/CS5 — `closeShell` tests; assert `closureBefore < 1`, `closureAfter ∈ {≥0.9, ==1}`,
  honest no-close below trust. Sensitive to any change in how closeShell reports closure.
- `buildWallRelief` is imported from `src/view/wall-relief.mjs` (the real relief geometry).

## Validated fixture readings (footprint metric prototype, zero-spend)

Prototyped the footprint metric (`registerRect` → `present/ring`) on the real geometry:

| Fixture | footprint reading | claim |
|---|---|---|
| colonnade seed (232 cols) | **0.6078** | ~0.6 (<0.9) ✓ |
| closed bare 15×15 ring | 1.0000 | ≥0.9 ✓ |
| closed + real relief (224 quoins + 60 plinth) | **0.9375** | ≥0.9 ✓ |
| reopened (9-col straight-run drop) | 0.8393 | <0.9 ✓ |
| reopened + relief | 0.7969 | <0.9 ✓ |

## Constraints / assumptions surfaced

- The seed registration is **AMBIGUOUS** (near-square 15×15 axis tie) **yet correct**: coverage 0.685
  ≥ 0.5, footprint reading 0.6078 ≈ closeShell's 0.6154. So the fix must **ignore `ambiguous`** (as
  `closeShell` already does) and gate only on a **coverage trust floor** — the ticket's named failure
  mode ("AMBIGUOUS → mis-read") does NOT bite here, but a coverage floor is the honest guard if a
  future subject registers badly.
- Proud-vs-missing **is** cleanly separable here: proud relief cells sit *outside* the registered
  footprint ring (off-perimeter) → ignored by construction; missing wall cells sit *on* the ring →
  counted as open. The two are not coupled at the seed. **Mild residual:** closed+relief reads 0.9375
  not 1.000 — the proud fringe nudges `registerRect`'s robust extent ~1 cell outward at corners, so a
  few ring columns fall just off a real post. It clears 0.9 comfortably; name it, don't hide it.
- `registerRect.ring` for a **single mass** is a clean rectangle perimeter. Multi-mass (L-shape)
  programs union perimeters incl. the shared internal edge — **untested by this ticket** (gatehouse is
  single-mass); note as a boundary.
- The no-program fallback must stay byte-identical to today on proud-free rings (WG-CS1/CS8/CS9) — the
  clamp is a documented no-op there, so removing it and measuring the raw band perimeter preserves them.
- `picture-climb.mjs` is **not** in the `npm test` glob — its behaviour is verified by the zero-spend
  evidence probe, not unit tests.
