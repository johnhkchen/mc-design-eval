# T-065-01 — Structure: file-level blueprint

The shape of the code. Files created/modified, public interfaces, ordering. No frozen runner is touched.

## Created

### `src/form/form-routing.mjs` (PURE — the routing config + selector + report assembler)

GL-free, I/O-free; imports only the two voxelizers + `remeasure.mjs` helpers (for direction-aware deltas,
optional). Lives in `src/form/` so it runs under the `src/**/*.test.mjs` glob.

Public exports:
- `FORM_TYPE` — `Object.freeze({ "bow-and-arrow":"thin", "koi":"thin", "dancing-man":"solid",
  "moai":"solid", "pineapple":"solid", "mushroom":"solid", "heart":"solid" })`. The canonical per-subject
  tag (one source of truth). Doc comment cites the E-18 finding + the deliberate heart-solid trade.
- `DEFAULT_FORM_TYPE = "solid"` — conservative default for an untagged subject (plain voxelize never
  over-thickens).
- `formTypeOf(subject) → "thin"|"solid"` — `FORM_TYPE[subject] ?? DEFAULT_FORM_TYPE`. Trims/normalizes
  the key defensively (string guard).
- `selectVoxelizer(subject) → Function` — returns `voxelizeGlbThin` for a thin-tagged subject, else
  `voxelizeGlb`. Returns the **actual function reference** (AC #2 identity test).
- `voxelizeRouted(glb, { subject, scale }) → occupancy` — convenience dispatch:
  `selectVoxelizer(subject)(glb, { scale })`.
- `ROUTING_SCHEMA = "form-routing/v1"`.
- `assembleRoutingReport(spine, opts?) → { md, json }` — reads an `e18-remeasure/v1` spine and produces
  the before(universal-thin)/after(routed) form IoU + occupancy comparison ×subjects, averages, totals,
  and the honest recover/keep/trade classification. PURE; tolerant of missing cells.

Internal: `pickRouted(subjectRow)` → `{ formType, before:{formIoU,occ}, after:{formIoU,occ},
dFormIoU, dOcc, verdict }`; `renderMd(json)`; small numeric helpers (round, isNum) — mirroring
`remeasure.mjs` style.

`assembleRoutingReport` json shape:
```
{ schema:"form-routing/v1", scale, generatedFrom,
  subjects:[{ subject, formType,
              before:{ formIoU, occ }, after:{ formIoU, occ },
              dFormIoU, dOcc, verdict:"recovered"|"kept"|"traded"|"flat" }],
  averages:{ formIoU:{ before, after, delta } },
  occupancy:{ before, after, delta, solidsDropped },
  recovered:[subject…], traded:[subject…], kept:[subject…],
  note }
```

### `src/form/form-routing.test.mjs` (PURE unit tests)

- `FORM_TYPE` frozen; the 7 keys present with the AC's thin/solid split; thin = exactly
  {bow-and-arrow, koi}.
- `formTypeOf`: thin subjects → "thin"; solid subjects → "solid"; unknown → `DEFAULT_FORM_TYPE` ("solid");
  defensive on non-string / whitespace.
- **`selectVoxelizer` (AC #2):** `selectVoxelizer("bow-and-arrow") === voxelizeGlbThin`,
  `selectVoxelizer("koi") === voxelizeGlbThin`, `selectVoxelizer("moai") === voxelizeGlb`,
  `selectVoxelizer("dancing-man") === voxelizeGlb`, unknown → `voxelizeGlb`.
- `voxelizeRouted`: dispatches to the selected voxelizer (assert via a tiny fake glb? — no; assert it
  calls the right fn by spying through `selectVoxelizer`, or skip the GL call and just assert
  `selectVoxelizer` wiring; the voxelizers themselves are tested elsewhere). Keep this test pure: assert
  `voxelizeRouted` is wired to `selectVoxelizer` by checking it throws/returns consistently on a stub —
  simplest: assert `typeof voxelizeRouted === "function"` and that selection is correct (covered above).
- `assembleRoutingReport` on a small synthetic spine (2–3 subjects, one thin / one solid):
  before = thin (e18) for all; after = routed pick; solids recover (after.formIoU = r1 > before.e18,
  occ drops to occBase); thin keep (after = before); averages + totals computed; a marginal-helped solid
  (heart-like) classified "traded" with after.formIoU < before. Verdicts + deltas correct.

### `benchmarks/sculpture/form-routing.mjs` (thin host runner — I/O only, no GL)

Reads `benchmarks/sculpture/e18-remeasure.json`, calls `assembleRoutingReport`, writes
`benchmarks/sculpture/form-routing.json` + `form-routing.md`. Mirrors how `e18-scorecard.mjs`'s runner
consumes the spine. No model, no GL, no network — safe to run here. Prints a one-line summary.

## Modified

### `package.json`

Add a script: `"form:routing": "node benchmarks/sculpture/form-routing.mjs"` (ergonomic entry; optional
but consistent with `bench:*` conventions).

## NOT modified (deliberately)

- `benchmarks/sculpture/glb-voxel-breadth.mjs` and all other runners' `SUBJECTS` lists — frozen
  reproducibility anchors. A future ticket may refactor them to consume `formTypeOf`.
- `voxelizeGlb` / `voxelizeGlbThin` — unchanged; routing only *chooses* between them.
- The E-18 spine `e18-remeasure.json` — read-only input; never rewritten.

## Module boundaries / dependency direction

```
glb-voxelize.mjs (voxelizeGlb) ─┐
glb-thin.mjs (voxelizeGlbThin) ─┼─▶ form-routing.mjs (config + selector + report)  [pure]
remeasure.mjs (delta helpers) ──┘            ▲
                                              ├─ form-routing.test.mjs       [pure, src/ glob]
                                              └─ benchmarks/sculpture/form-routing.mjs  [I/O host]
                                                       └─reads─▶ e18-remeasure.json
```

No existing public interface changes. The selector composes the two existing voxelizers; the report
composes the existing spine.

## Ordering of changes (each independently verifiable)

1. `src/form/form-routing.mjs` (config + `formTypeOf` + `selectVoxelizer` + `voxelizeRouted`) +
   `src/form/form-routing.test.mjs` (AC #1, #2). `npm test` green.
2. `assembleRoutingReport` added to `form-routing.mjs` + its tests (AC #3 pure half). `npm test` green.
3. `benchmarks/sculpture/form-routing.mjs` runner + `package.json` script; run it over the real spine to
   emit `form-routing.{md,json}` (AC #3 applied ×7). `npm test` still green (AC #4).
