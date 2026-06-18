# T-202-01 — Research

**Ticket:** form-readiness metric invariant to proud detail (E-52 / S-202, the unblocker).
**Goal (descriptive):** map where `eaveRingClosure` is defined, what feeds it, what consumes it, and
exactly why `relief_walls` collapses it 1.000 → 0.068 on a physically-closed shell.

## The failure, from the T-201 trajectory

`docs/active/work/T-201-01/trajectory.json` (`closureFirst 0.615`, `closureLast 0.068`):

| round | tool | applied | accepted | closure | closureAfter |
|------:|------|:---:|:---:|---:|---:|
| 1 | close_shell | ✓ | ✓ | 0.615 | **1.000** |
| 2 | apply_gable_roof | ✓ | ✓ | 1.000 | 1.000 |
| 3 | carve_arch | ✓ | ✗ | 1.000 | 1.000 |
| 4 | **relief_walls** | ✓ | ✓ | 1.000 | **0.068** |
| 5 | close_shell | ✓ | ✗ | 0.068 | — (no-op) |

Round 4 relief leaves the shell physically intact but craters the metric; round 5 the form-ready gate
(closure < 0.9) re-blocks every detail hand and re-picks `close_shell`, which no-op's (the shell is
already dense) → rolled back → on a longer budget it oscillates. The metric, not the build, is wrong.

## The metric — `src/view/wall-generate.mjs`

- **`eaveRingClosure(occ, {floor, eaveY})`** (line 275) — THE form-readiness metric. Collects every
  `(x,z)` column with a cell in the band `floor ≤ y ≤ eaveY`, then returns
  `closureOf(perimeterColumns(cols))`. Throws without `eaveY`; returns 0 on an empty band.
- **`closureOf(ring)`** (line 152) — the ONE closure primitive: `bboxOf(ring)` → `filledRect` →
  `perimeterColumns` → fraction of that bbox-rectangle perimeter the `ring` occupies. A watertight
  rectangle = 1; a colonnade with straight-run gaps < 1. Used by `eaveRingClosure`, `closeShell`
  (line 324, 360), `constructWalls` (`useReg`, line 418), and `recessClosureGuard`.
- **`perimeterColumns`, `bboxOf`, `filledRect`** — the supporting pures.
- **`robustExtent(cols, {pLo, pHi})`** (line 109) — ALREADY EXISTS for exactly this class of problem:
  per-axis percentile bbox that "trims a lone outlier post that overshoots the wall line" (the
  glb-end-fit anchor-window lesson), with a `polluted` flag and a `raw` bbox beside the trimmed one.

### Why the collapse (reconstructed from the real relief geometry)

Built a closed 15×15 ring (floor 0, eave 18), ran the REAL `buildWallRelief` (the `relief_walls`
hand). The band-column distribution per x:

```
x:        -2  -1   0   1..13  14   15   16
cols/x:    2  15  19    4ea   19   15    2
```

- **Wall plane** at x∈[0,14] (full faces ×2, the two z-walls run x=1..13).
- **Plinth** (proud water-table course, `surface.relief` depth 1 at the floor row) at x=-1 / x=15 —
  full proud sides, 1 cell out (60 cells here; T-201 had 106).
- **Quoins** (`quoin` brush, headerDepth 2, full-height) at x=-2 / x=16 — corner TIPS only, 2 cols
  each, 2 cells out (**224 cells — exactly the T-201 count**).

`bboxOf(all cols)` = [-2,16]² (set by the sparse quoin tips). The depth-2 bbox-perimeter is occupied
ONLY at the four quoin corners; the plinth (depth-1) and wall (depth-0) sit INSIDE it. So
`closureOf(perimeterColumns(allCols))` = **0.111** here (0.068 on the real T-201 footprint). The metric
"folds every band column into the perimeter" and the sparse proud fringe defines an oversized,
near-empty rectangle. This is the bug named in [[e48-e49-build-climb]] (fifth gap).

## What consumes the metric

- **`src/workshop/climb-gate.mjs`** — PURE, takes a closure SCALAR (never an occ):
  - `formReadyGate({tool, closure, threshold=FORM_READY_CLOSURE})` (line 103) — a DETAIL tool is
    eligible only when `closure ≥ 0.9` (`FORM_READY_CLOSURE`, line 67).
  - `acceptsRound(...)` form-move branch (line 281) + `formCredit` (line 217) consume
    `closureBefore`/`closureAfter` for the close_shell keep/rollback decision.
  - `closureDecidedMove(tool)` (line 92) routes wall-shell FORM moves to the closure-only decision.
- **`experiments/eval-alignment/picture-climb.mjs`** — the metered runner. Imports `eaveRingClosure`
  (line 29) and `FORM_READY_CLOSURE`; computes `closure` from the live occ each round (CFG.eaveY=18)
  and passes the scalar to `formReadyGate`/`acceptsRound`. This is the ONE caller that turns occ →
  scalar; climb-gate stays occ-free.
- **`closeShell`** internally calls `eaveRingClosure` for its `closureAfter` report (line 360).

## The precedent — `recessClosureGuard` (treatment-grammar.mjs:302)

The treatment engine ALREADY solved this exact "proud quoins inflate the bbox" problem for its
recess-by-exclusion guard: it builds before/after rings **restricted to the BEFORE footprint bbox**
"so the benign bbox growth from proud quoins is neutralized — the metric measures HOLES, not GROWTH."
`eaveRingClosure` has no "before" reference (single occ), but the principle transfers: measure closure
on the wall-plane footprint, not the proud-inflated bbox.

## Constraints / assumptions surfaced

- `closureOf` is shared by 4+ call sites (`registerRect`, `constructWalls`, `closeShell`,
  `recessClosureGuard`) — it must NOT change. The fix belongs in `eaveRingClosure` (the ticket says
  "or a successor"), keeping ONE closure authority.
- The threshold 0.9 is consumed only as a scalar by `climb-gate`; if the robust metric keeps
  relief-closed ≥ 0.9 it need not move (re-pin only if it does).
- The metric must stay PURE (no GL/IO/Date/random; runs under `src/**/*.test.mjs`).
- Existing closure fixtures (WG-CS1/2/3, WG9/11/11b/12/13) are small rings with NO proud detail;
  any fix must leave them byte-identical (robust trim must be a no-op on them).
- **Falsifiable line (from the ticket):** the fix fails if it over-corrects — a genuinely reopened
  shell reads closed. The realistic reopening here is a COLONNADE gap (straight run dropped), not a
  whole-house resize; the proud plinth mirrors the wall's holes (emitted only in front of existing
  exterior cells), so detail does not mask a reopening.
