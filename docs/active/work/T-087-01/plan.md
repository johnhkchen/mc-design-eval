# T-087-01 coherent-surface — Plan

Four steps, three commits. Each step verified before the next; deviations documented in progress.md.

## Step 1 — export the skin iterator (zone-fill.mjs)

- Change `function* surfaceVoxelEntries` → `export function* …`; extend its JSDoc one line ("canonical
  visible-skin iterator; S-087's pattern ops consume it").
- Verify: `npm run test:unit` green (no behavior change anywhere).
- Folded into commit 1 (it only exists to serve the new module).

## Step 2 — the pure cores + tests (commit 1)

`src/view/surface-pattern.mjs` per structure.md, in this order (each function self-contained):

1. `namespaced`, `topHeightMap` (private).
2. `courseMetrics(occ)` — +y map, adjacent (+x,+z) pairs, `{pairs, flat, step1, cliff, stepSmoothness,
   meanAbsStep}`, ‰-rounded; empty/single-column map → vacuous `{pairs:0, stepSmoothness:1, meanAbsStep:0}`.
3. `regularizeRoofCourses(occ, {dominant})` — priority-flood spill levels (seed: columns with a missing
   4-neighbour at level=ownY; sorted-insert array as the heap, n≈700; pop-min, neighbour level =
   max(ownY, popped)); emit adds `(x, yTop+1…spill, z)` in `namespaced(dominant)`; throw on missing/
   non-string dominant; before/after via courseMetrics (after on an `occupancyFromCells` overlay).
4. `stripStraySalt(occ, {zoneOf, zones, faces, minKeep=3, minExtent=3})` — skin from
   `surfaceVoxelEntries`; off-dominant cells; whole-skin 6-connected same-material components;
   keep iff size ≥ minKeep AND maxAxisExtent ≥ minExtent; strip → recolor to the cell's zone dominant;
   per-zone/per-block tallies; arg validation throws mirroring zoneFill's.

`src/view/surface-pattern.test.mjs` — tests written against hand-counted fixtures (zone-fill idiom):

- **Fixture A, noisy hip roof** (9×9 stepped pyramid, courses y3..6, solid under-fill): cases (a) 1-cell
  pit, (b) 2×2 basin depth 2, (c) draining valley channel, (d) 2-cell bump, (e) eave-edge notch.
  - T1 pit + basin raised to spill, blocks = dominant, `columnsRaised`/`voxelsAdded` exact.
  - T2 valley, notch, bump untouched (no placement at their columns).
  - T3 adds-only: every placement pos is EMPTY in occ; expand pos-set after applyPaint = original ∪ adds.
  - T4 metrics hand-checked before/after; cliff-pair drop equals the defect pairs exactly;
    courseMetrics is consistent with the op's reported before/after.
  - T5 degenerate inputs: empty occ (no placements, vacuous metrics); missing dominant throws.
- **Fixture B, salted hut** (zone-fill hut variant): isolated cobble speck in plaster field; 2×2 log
  clump; 3-cell vertical stud; 3-cell cross-zone brick chimney; one cell in a zone without policy.
  - T6 "an isolated speck is stripped to the field" (AC-named): speck → plaster recolor.
  - T7 "a stud run is preserved" (AC-named): no placement on the 3 stud cells.
  - T8 2×2 clump stripped (size 4, extent 2 — the shape test, not just size).
  - T9 chimney kept: whole-skin connectivity crosses zones (per-zone connectivity would strip it —
    asserted by the keep).
  - T10 no-policy zone untouched; recolor-only (every pos ∈ occ; expand pos-set unchanged);
    byZone tallies sum to stripped+kept.

Verify: `npm run test:unit` green (1005 + new). Commit 1:
`feat(E-24 T-087-01): surface-pattern pure cores (course basin-fill, stray-salt strip) + skin-iterator export`.

## Step 3 — the runner + wiring (commit 2)

- `benchmarks/sculpture/surface-pattern.mjs` per structure.md: load artifact + record policy →
  zones/zoneOf → course fill → strip → applyPaint → assertArtifact → best-effort renders
  (front/side/top, before/after) → record + md. `--offline` re-assert branch first (no GL imports on
  that path). Throw with a clear message if the spray-paint inputs are absent.
- package.json: `pattern:cottage` script. .gitignore: `benchmarks/sculpture/surface-pattern/**/*.png`
  stanza with the local-only comment.
- Verify: `node benchmarks/sculpture/surface-pattern.mjs --offline` fails loudly (record absent yet) —
  expected; `npm run test:unit` still green; syntax-check the runner via `node --check`.
- Commit 2: `feat(E-24 T-087-01): surface-pattern runner (course regularity + salt strip on the cottage)`.

## Step 4 — the live cottage run (commit 3)

- `npm run pattern:cottage` — expected from the design-phase measurements (will differ slightly; record
  whatever the run says): ~41 columns / ~85 voxels raised; smoothness 0.784 → ≈0.83; salt ≈ 203 cells /
  135 components stripped (cobble ≈80, log ≈94, dark_oak_planks ≈29); AJV green.
- Eyeball the before/after PNGs (front/side/top): courses read flatter, salt gone, chimney + studs +
  trim intact. If a legit feature was stripped (e.g. window sills), consider per-zone minExtent and
  document the choice in progress.md — parameters are data, the default change is a one-line runner edit.
- `npm run pattern:cottage -- --offline` (or direct node invocation) exits 0 re-asserting the committed
  record; `npm test` green.
- Commit 3: `feat(E-24 T-087-01): cottage surface-pattern record — courses regularized, stray salt stripped`.

## Testing strategy summary

- **Unit (in `npm test`)**: all op semantics on synthetic occupancy (steps 2's T1–T10) — the two AC
  behaviors are individually named tests; geometry safety asserted via expandArtifact pos-sets both ways
  (adds-only for the course op, recolor-only for the strip).
- **Integration (on demand, GL)**: the runner run — AJV assert, the offline re-assert invariants
  (salt.stripped > 0, smoothness strictly improves), renders for the human read.
- **Not tested, named**: GL render content (lens, not logic); the runner's md formatting; concurrency
  with T-088 (no shared files by design).

## Verification criteria (AC ↔ evidence)

1. Roof-course coherence: `regularizeRoofCourses` + T1–T5; before/after top render; recorded metrics.
2. Stray-salt strip: `stripStraySalt` + T6–T10 (speck stripped / stud kept are the AC's own words).
3. Distinct from S-084: module header + design.md state the watertight-vs-pattern split; the op consumes
   the already-sealed build.
4. Cottage run recorded with both numbers + before/after; `npm test` green at every commit.
