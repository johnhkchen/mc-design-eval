# T-087-01 coherent-surface — Design

Two pure ops over the post-spray-paint occupancy, plus a sibling runner that proves them on the cottage.
Every option below was evaluated against measured cottage numbers (research §2; re-measured prototypes in
this phase), not assumptions.

## Decision summary

1. **Roof-course coherence = basin-fill (priority-flood) on the +y height map**, add-only, in the roof
   dominant material. Measured on the cottage: 41 columns raised / 85 voxels added; step-smoothness
   (fraction of adjacent column pairs with |Δy| ≤ 1) 0.784 → 0.827, cliff pairs 273 → 218, mean |Δy|
   0.983 → 0.755. The residual is **bumps** — unfixable under the no-delete contract — recorded honestly.
2. **Stray-salt strip = skin-component pattern test, per zone**: an off-dominant skin cell is kept iff its
   same-material 6-connected component **over the visible skin** has size ≥ minKeep (3) AND max axis
   extent ≥ minExtent (3) — i.e. it is a run/line — else it is recolored to its voxel's zone dominant.
   Measured on the cottage: strips 135 components / 203 cells (cobble 80, dark_oak_log 94,
   dark_oak_planks 29); keeps the chimney shaft, the long stud runs (249 log cells), the eave/verge trim.
3. **New pure module `src/view/surface-pattern.mjs`** + tests; `zone-fill.mjs` exports its private skin
   iterator for reuse; **new sibling runner `benchmarks/sculpture/surface-pattern.mjs`** consuming
   `spray-paint/cottage/artifact.json` (the T-086-01 precedent — spray-paint.mjs is NOT touched).

## 1. Roof-course regularization

### Options considered

- **(A) Basin-fill to spill level (priority-flood) — CHOSEN.** Compute, per +y column, the hydrological
  spill level (water level when flooding from the map boundary; missing-neighbour columns and map edges
  are outlets); raise every column to its spill level by adding voxels in the roof dominant. Properties,
  each load-bearing:
  - **Add-only** — never deletes (the artifact contract has no air op).
  - **Valley-safe by construction**: the cross-gable's real valleys drain to an eave, so their spill
    level equals their own height — they are never filled. No heuristic needed.
  - **Chimney-safe**: a bump above the field is never touched (filling only raises).
  - Deterministic, terminating (each column's level computed once), O(n log n), pure.
- **(B) Iterated local-min lift** (raise any column strictly below all present neighbours). REJECTED as
  the primary: it is a strict subset of (A) for enclosed defects, and at hip/eave corners "strictly below
  both neighbours" can be a *legitimate* hip geometry — (A) never has that false positive.
- **(C) Deep-pit relax** (no column more than 1 below all neighbours) layered on (A). REJECTED —
  **measured zero additional voxels** on the cottage after basin-fill: every ≥2-deep pit is an enclosed
  basin, already filled by (A). Complexity with no effect.
- **(D) Course-model fit** (detect ridges, fit monotone stepped planes per roof face, realize the model).
  REJECTED: the cottage is cross-gabled (two intersecting ridges + chimney) — segmentation into roof
  planes is a research project; and the model's "lower these cells" half is unimplementable (no delete).
  E-25's concept-derived full-shell skin is the right home for model-level reshaping.
- **(E) Material striping per course** (recolor bands to fake the banding). REJECTED: the concept's roof
  banding is single-material — stepped geometry + lighting produce the bands (research §8.7); striping
  would *add* pattern noise. Salt removal (op 2) is the material half of the roof fix.

### The op

`regularizeRoofCourses(occ, {dominant})` → `{placements, columnsRaised, voxelsAdded, before, after}`
where before/after are `courseMetrics` snapshots. Placements are `{op:"voxel", pos, block}` ADDS at empty
cells `(x, yTop+1 … spill, z)`, block = namespaced dominant (caller passes it from policy — nothing
cottage-specific in src/). The +y height map comes from `projectSurface(occ, "+y")` (top voxel per
column), the same lens every E-24 metric uses.

`courseMetrics(occ)` → `{pairs, flat, step1, cliff, stepSmoothness, meanAbsStep}` over adjacent (+x, +z)
column pairs of the +y map, ‰-rounded like the existing metrics. This is the recorded "roof-course
regularity" number the AC asks for.

**Why the metric is honest**: it is geometry-only, computed by the op's consumer-visible lens, and the
op cannot game it (filling a basin genuinely flattens the read; the metric also counts the legit gable
edges it can never fix, so 1.0 is unreachable by design — the record explains the residual).

## 2. Intra-zone stray-salt strip

### Why zoneFill's run test cannot be reused

`zoneFill.inRun` accepts a 6-connected same-material component ≥ 2 over the FULL occupancy — a skin
speck with one buried same-material neighbour survives (the 13 cobble roof singletons each do). The
visual defect is defined on the **visible skin**: a lone exposed cobble reads as salt even if it
continues into the wall. So the new test is over **skin cells only**, and shape-aware.

### Options considered for the keep-rule

- **(A) Component size ≥ N over the skin.** Too blunt alone: a 2×2 blob (size 4) is salt-like, a 3-cell
  stud (size 3) is legit — size cannot separate blob from line.
- **(B) Size ≥ minKeep AND max-axis extent ≥ minExtent — CHOSEN (defaults 3, 3).** "Part of a run/line"
  (the AC's words) = elongated: a 3-cell stud has extent 3 (kept); a 1–2 cell speck or a 2×2 clump has
  extent ≤ 2 (stripped). Measured keep set on the cottage: chimney shaft (large), 20 stud runs (249
  cells), eave trim — exactly the legit secondaries. Parameters are data (per-call), not constants.
- **(C) Per-face 2-D majority test** (faceIntrusions). REJECTED: misses 2-cell cliques and cross-face
  components; already ran at seal time and demonstrably left the witnessed salt.
- **(D) LLM triage** (roof-patch path). REJECTED for this ticket: the candidate set is now fully
  separable geometrically; a metered call adds nondeterminism to what a pure rule decides. The detector
  stays available upstream.

### The op

`stripStraySalt(occ, {zoneOf, zones, faces=FILL_FACES, minKeep=3, minExtent=3})` →
`{placements, stripped, kept, byZone: {<zone>: {offDominant, strippedCells, keptCells, byBlock}}}`.

- Skin = the `FILL_FACES` union via `surfaceVoxelEntries` (EXPORTED from zone-fill.mjs — reuse the one
  skin definition, don't refork; research §8.5).
- Off-dominant = skin cell whose zone has a policy entry and whose bare block ≠ that zone's dominant.
- Components are computed over off-dominant skin cells **whole-skin** (not per-zone): the cobble chimney
  crosses base→upper→roof; per-zone connectivity would fragment it below threshold and strip it.
- A stripped cell recolors to **its own voxel's zone dominant** (a roof cobble → spruce, an upper log
  fragment → plaster, a base log speck → stone). Recolor-only (existing voxels), zone-policy as data.
- The preserve/splat distinction is irrelevant here on purpose: material *legality* was zoneFill's
  gate; this op judges *pattern* — any material, however lawful, is stripped when it reads as salt.

### Order of the two ops

`regularizeRoofCourses` FIRST (geometry — changes which cells are skin: raised columns bury some old
top cells), then `stripStraySalt` on the raised occupancy (pattern, on the final skin). The fill adds
only dominant-material cells, so it can never add salt for the strip to chase.

## 3. Wiring: a sibling runner, not spray-paint.mjs

`benchmarks/sculpture/surface-pattern.mjs` (`npm run pattern:cottage`):

1. Load `spray-paint/cottage/artifact.json` (the zone-filled, splatted build — this ticket's declared
   baseline) + `spray-paint/cottage.json` for `fill.policy` (zone dominants — single-sourced, so a later
   T-086 dominant swap composes for free).
2. `structuralZones` → `zoneOf`; run fill → strip; `applyPaint`; `assertArtifact` (AJV).
3. Best-effort GL before/after renders (front + side + **top** — the top view is where courses read),
   `tryRenderFace`-style degradation; PNGs gitignored (add the stanza).
4. Durable record `surface-pattern/cottage.{json,md}` + `surface-pattern/cottage/artifact.json`:
   course metrics before/after, salt stripped/kept per zone+material, placements counts.
5. `--offline`: re-assert the committed record (saltStripped > 0, `after.stepSmoothness >
   before.stepSmoothness`, AJV on the committed artifact) — the T-086 idiom.

REJECTED alternative — wiring into spray-paint.mjs §5c: T-088-01 (same `depends_on`, in flight) gates on
that runner's outputs, and T-086-01 set the explicit precedent ("does NOT touch spray-paint.mjs — T-085
owns it"). A missing DAG edge is not fixed by colliding on the file (`parallel-roots-duplicate-shared-
deps`). Consolidating both ops INTO the spray:paint pipeline is named follow-up work for the story that
owns the runner (S-089/E-25 consolidation).

## 4. Risks, named

- **Bumps remain** (no delete): the ragged ridge keeps some cliff pairs; smoothness lands ≈ 0.83, not 1.0.
  Recorded, with the before/after render as the read check.
- **2-cell legit details can strip**: a 2-cell window sill (extent 2) fails the keep-rule. Defaults 3/3
  are parameters; the record lists stripped components by material so a wrong strip is visible. Accepted
  for E-24's coherence-first posture (same trade T-085 made on window reveals).
- **Eave-edge notches that drain are not raised** (they are outlets, not basins). Visible in the metric's
  residual; out of add-only reach unless their neighbours are raised — named, not hidden.
- **T-088 concurrency**: zero shared files (new module + new runner + one export line in zone-fill.mjs;
  T-088 touches face-resemblance/gate code). The zone-fill edit is additive (an `export` keyword).

## 5. Test strategy (detail in Plan)

Template: zone-fill.test.mjs (synthetic hand-counted occupancy, policy as data, hand-rolled zoneOf,
geometry-safety via expandArtifact pos-set comparison). Course op: pit raised / basin filled to spill /
draining valley untouched / bump untouched / adds-only / dominant-material adds / metrics hand-checked.
Salt op: speck stripped / 2×2 clump stripped / 3-cell stud kept / cross-zone chimney kept / no-policy
zone untouched / recolor-only / per-zone counts exact. The AC's two named behaviors are each a named test.
