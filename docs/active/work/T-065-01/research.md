# T-065-01 — Research: per-subject thin routing

Epic **E-19**, documented design-debt cleanup (T-061 review concern #4). T-059 added thin-feature
voxelization (`voxelizeGlbThin`); E-18's combined build applied it to **all 7** subjects. It lifts thin
subjects but **over-thickens solid ones** (form IoU regressions + ~2× occupancy). The form-type-routing
rule — *thin/organic → thin-preserve; solid/bulky → plain voxelize* — was **named but never wired**. This
ticket wires it. Descriptive only: what exists, where, how it connects.

## The two voxelizers (both already exist, PURE)

`src/form/glb-voxelize.mjs`:
- `voxelizeGlb(glb, { scale = DEFAULT_SCALE }) → { scale, voxelSize, dims:[x,y,z], bounds, occupied:Int32Array, count }`.
  The plain solid fill (E-16, the R1 build). `occupied` is the flat `[i,j,k,…]` triple stream;
  `count = occupied.length/3`.

`src/form/glb-thin.mjs`:
- `voxelizeGlbThin(glb, { scale = DEFAULT_SCALE, shell = true, thinScale = null, connectivity = 26 }) →`
  the **same record shape** as `voxelizeGlb` plus an additive `thin` field
  (`{components, surfaceOnlyCount, occBase, occThin, occPruned}`). With `shell:false` it is bit-identical
  to `voxelizeGlb`; with `shell:true` (default) it **ADDS** the surface/shell cells the solid fill missed
  — recovering thin members, at the cost of thickening everything else.

Both accept `{ scale }` with the same default — so a selector can return either and the caller invokes it
the same way. This is the whole point of AC #1's "no new algorithm — just route."

## The empirical boundary already lives in the scorecard

`src/form/e18-scorecard.mjs` `classifyRouting(spine)` partitions subjects by the **sign of the thin-pass
form Δ (E18 − R1)** into `{ thinHelped, solidHurt, flat }` (eps `EPS.formIoU = 1e-3`). This is the
*quantitative* half of the routing finding — it observes which subjects thin helped/hurt **after the
fact**, but it does not feed back into voxelizer selection. T-065-01 turns that observation into a
forward routing config that drives which voxelizer runs.

## The measurement data is already collected (the spine)

`benchmarks/sculpture/e18-remeasure.json` (`schema: e18-remeasure/v1`, scale 32, 7 subjects), assembled by
the PURE `src/form/remeasure.mjs` `assembleRemeasure`. Each subject row carries exactly what the
before/after comparison needs — **no new GL run is required**:

- `r1.formIoU` — the **plain `voxelizeGlb`** form IoU (R1 shares the augmented design-doc palette, so the
  form-IoU delta is the thin pass alone; "colour never moves a silhouette" — scorecard comment).
- `e18.formIoU` — the **thin `voxelizeGlbThin`** form IoU (the combined build ran thin on all 7).
- `thin.occBase` — plain occupancy (cells); `thin.occThin` — thin occupancy (cells).

Observed (scale 32):

| subject | r1 IoU (plain) | e18 IoU (thin) | thin Δ | occBase | occThin |
| --- | --- | --- | --- | --- | --- |
| dancing-man | 0.914 | 0.814 | **−0.100** | 973 | 1504 |
| moai | 0.565 | 0.399 | **−0.166** | 4215 | 6059 |
| pineapple | 0.907 | 0.845 | **−0.062** | 3397 | 4855 |
| mushroom | 0.980 | 0.929 | **−0.051** | 9505 | 11958 |
| heart | 0.877 | 0.895 | +0.018 | 5840 | 7982 |
| bow-and-arrow | 0.473 | 0.526 | **+0.053** | 513 | 1210 |
| koi | 0.622 | 0.706 | **+0.084** | 2164 | 3155 |

So thin clearly helps **bow-and-arrow** and **koi**; clearly hurts dancing-man / moai / pineapple /
mushroom; and **marginally** helps **heart** (+0.018, just over eps).

## The AC's intended routing vs the raw sign

AC #1 enumerates **thin = {bow-and-arrow, koi}**, **solid = {heart, mushroom, pineapple, moai,
dancing-man}**. That tags **heart solid** even though thin's raw Δ was +0.018. The constraint to surface
for Design: this is a deliberate call — heart is anatomically a bulky organ (only the aortic arch is
thin-ish); routing it solid trades a +0.018 marginal form gain for a large occupancy drop
(7982→5840, −27%) and less spurious bulk (the cleanliness win the story emphasizes). The config should
follow the AC's enumeration, and the report should be HONEST that heart's form IoU dips slightly under
routing (the one cell that doesn't "recover").

## The SUBJECTS lists (where a tag could hang)

The canonical 7-subject list lives in `benchmarks/sculpture/glb-voxel-breadth.mjs` (`SUBJECTS`, keys:
dancing-man, moai, pineapple, bow-and-arrow, heart, mushroom, koi). The same list is duplicated across
several runners (`glb-voxel-thin.mjs` has only the 2 thin subjects; `glb-formtarget-ab`, `concept-ab`,
`glb-grounded-ab`, `form-revise-ab`, `glb-voxel-surgical` each redeclare a SUBJECTS). AC #1 offers "on the
SUBJECTS list **OR** a small subject-keyed config" — a single subject-keyed config module is the
lower-duplication choice (one source of truth the runners can consume), vs. tagging N duplicated lists.

## Test glob + verification constraints

- Unit tests must live under `src/**/*.test.mjs` (the `test:unit` glob) — so the routing config +
  selector + report assembler belong in `src/form/` to be testable.
- AC #2 wants the selector to return the **actual voxelizer function** for a tagged subject, so testing
  `selectVoxelizer("bow-and-arrow") === voxelizeGlbThin` requires the module to import and return both.
- AC #3 (before/after form IoU + occupancy ×7) is a **pure read of the existing spine** + the routing
  config — no GL, no metering. A light runner reads `e18-remeasure.json` and writes a report.
- AC #4: `npm test` green.

## Assumptions

- `r1.formIoU` is exactly the plain-voxelize silhouette IoU and `e18.formIoU` the thin one (the scorecard
  isolates the thin pass as E18−R1 on this basis). Routed form IoU is therefore a valid per-subject pick
  between the two already-measured values.
- Scale 32 is the spine's scale; the routing tag is scale-independent (a property of the subject's form),
  so the config carries no scale.
