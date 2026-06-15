# T-065-01 — Plan: ordered steps + testing strategy

Three commits, each independently verifiable. All steps are pure/deterministic — no GL, no metering
(AC #3 is a pure read of the existing E-18 spine).

## Step 1 — Routing config + selector + tests (AC #1, #2)

**Changes:** `src/form/form-routing.mjs` (`FORM_TYPE`, `DEFAULT_FORM_TYPE`, `formTypeOf`,
`selectVoxelizer`, `voxelizeRouted`), `src/form/form-routing.test.mjs`.

**Verify:**
- `npm test` green.
- Tests assert: `FORM_TYPE` frozen + the AC split (thin = {bow-and-arrow, koi}; the other 5 solid);
  `formTypeOf` thin/solid/unknown→solid + defensive on non-string; **`selectVoxelizer` returns
  `voxelizeGlbThin` for thin-tagged and `voxelizeGlb` for solid-tagged / unknown** (identity `===`);
  `voxelizeRouted` is wired to the selector.

**Commit:** `feat(E-19 T-065-01): per-subject thin/solid voxelizer routing (config + selector, unit-tested)`

## Step 2 — `assembleRoutingReport` + tests (AC #3, pure half)

**Changes:** add `ROUTING_SCHEMA` + `assembleRoutingReport(spine, opts?)` (+ internal `pickRouted` /
`renderMd`) to `src/form/form-routing.mjs`; extend `form-routing.test.mjs`.

**Verify:**
- `npm test` green.
- Tests on a small synthetic `e18-remeasure/v1` spine (one thin subject, one clear-solid, one
  marginal-helped solid): before(universal-thin) uses `e18`; after(routed) picks `e18` for thin and
  `r1` for solid; the clear-solid **recovers** (after.formIoU = r1 > before, occ → occBase);
  the thin subject is **kept** (after = before, occ = occThin); the marginal-helped solid is **traded**
  (after.formIoU < before, but occ drops); averages + total occupancy deltas correct; `schema` stamped.

**Commit:** `feat(E-19 T-065-01): assembleRoutingReport — before/after form IoU + occupancy (pure spine read)`

## Step 3 — Runner + apply ×7 over the real spine (AC #3 applied; AC #4)

**Changes:** `benchmarks/sculpture/form-routing.mjs` (reads `e18-remeasure.json` → writes
`form-routing.{md,json}`), `package.json` `form:routing` script.

**Verify:**
- `node benchmarks/sculpture/form-routing.mjs` exits 0; writes `form-routing.md` + `.json`.
- The emitted report matches the spine read (sanity against Research's table): solids recover
  (dancing-man 0.814→0.914, moai 0.399→0.565, pineapple 0.845→0.907, mushroom 0.929→0.980), thin kept
  (bow-and-arrow 0.526, koi 0.706), heart the one trade (0.895→0.877); avg form IoU 0.731→0.782;
  total occupancy 36,723→28,295 (−23%).
- `npm test` green (AC #4).

**Commit:** `feat(E-19 T-065-01): form-routing report runner — applied ×7 (solids recover, thin kept)`

## Testing strategy

- **Unit (deterministic, gated by `npm test`):** the entire `form-routing.mjs` surface —
  config/selector (AC #1, #2) and `assembleRoutingReport` (AC #3 logic) on a synthetic spine. This is the
  AC's "unit-tested" requirement and is the bulk of the work.
- **Data check (deterministic):** running the runner over the real `e18-remeasure.json` and eyeballing
  the report against Research's table is the "applied ×7" verification — reproducible, no GL.
- **No integration/GL/metering needed:** routing reuses two already-tested voxelizers and an
  already-collected spine. Nothing new renders or bills.
- **Regression guard:** no frozen runner or voxelizer is modified, so existing suites are untouched; the
  full suite stays green at each step.

## Risk register

- **Heart classification mismatch** — the AC tags heart solid though raw thin Δ was +0.018. Handled by
  Design Decision 2 (follow the AC; report it as the one deliberate trade). The report must not claim
  heart "recovered."
- **Spine assumptions** — relies on `r1.formIoU` = plain, `e18.formIoU` = thin, `thin.occBase/occThin`
  present. Verified present in Research; the assembler is tolerant of a missing cell (emits `—`/null,
  doesn't crash).
- **Selector identity** — AC #2 needs `===` the real function; ensured by importing and returning the
  voxelizer references directly (no wrapping).
