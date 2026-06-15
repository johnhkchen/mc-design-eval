# T-146-01 — Plan

Three commits, each independently verifiable. Test-first within each step. Verification gates after
every step; the full suite + repro/offline before the wiring commit.

## Step 1 — the op + the no-regress harness (`surface-relief.mjs` + test)
**Commit:** `feat(T-146-01): shared surface-relief op — proud emission, recess-by-exclusion, no-regress harness`

1.1 Write `src/view/surface-relief.mjs`:
- Header (the clinker charter + "construction-stage, never a paint air-op").
- `SURFACE_RELIEF_SCHEMA`, `RELIEF_DEFAULTS`, `DIRS`, `ALONG_AXIS`, `namespaced`, `isInt`, `fail`.
- `stripHit(rhythm, alongIndex, y, yBase)`: column → `((alongIndex - phase) % every + every) % every <
  span`; row → same on `(y - yBase)`.
- `surfaceRelief(occ, opts)`: validate (`material` non-empty; `rhythm.axis ∈ {column,row}`;
  `every ≥ 1`; `span ≥ 1`; `phase ≥ 0`; `depth ≥ 1`; faces known; `zoneOf` a fn when given). Build per
  face skin via `projectSurface`. Collect eligible cells (skin ∩ optional zone) sorted by key. yBase =
  min y over eligible. For each: if `stripHit` emit `o=1..depth` proud cells, `break` on `occ.has(out)`;
  else `fieldCells++`. Return `{placements, report}`.
- `reliefNoRegress(occBefore, placements, {faces})`: assemble `occAfter`; per face compare
  `elevationMask` bytes + `maskProportions`; compare whole-build `ridgeToEave`/`roofShare`; compute
  `aspect` delta → `expectedWidening`.

1.2 Write `src/view/surface-relief.test.mjs` — groups SR1–SR9 (SR10 lands green after Step 2; write it
now importing `reliefProfile` and expect it to pass once Step 2 exists — OR stage SR10 in Step 2 to keep
Step 1 self-contained). **Decision:** put SR1–SR9 in Step 1; add SR10 in Step 2 so Step 1 is green
alone.

1.3 Verify: `node --test src/view/surface-relief.test.mjs` green. Commit.

**Verification criteria:** proud cells land in front of the plane on strip columns only; field columns
empty; idempotent re-run = 0; `reliefNoRegress` returns `inPlanePreserved && ratiosPreserved` true and a
non-empty `expectedWidening` on the perpendicular axis; all fail-loud gates throw.

## Step 2 — the relief-aware 2.5-D read (`surface-grid.mjs` + tests)
**Commit:** `feat(T-146-01): reliefProfile — 2.5-D read of proud/recessed structure from per-cell depth`

2.1 Append `reliefProfile(grid)` to `src/view/surface-grid.mjs` (modal plane depth; classify
proud/flush/recessed; `byCell` grid; works on ortho + diag). Header note added.

2.2 Add a `reliefProfile` group to `src/view/surface-grid.test.mjs`: proud strip + recessed field counts
and `byCell`; all-flush wall → `proud===0 && recessed===0`; runs on a diagonal grid.

2.3 Add **SR10** to `surface-relief.test.mjs`: relieve an occupancy, project, assert `reliefProfile`
sees `proud > 0` on the relieved face and the field reads flush/recessed.

2.4 Verify: `node --test src/view/surface-grid.test.mjs src/view/surface-relief.test.mjs` green. Commit.

**Verification criteria:** the depth field is consumed; proud/recessed counts match the constructed
geometry; the read is purely a READ (no placements, no air op).

## Step 3 — wire the door + tripwire (registry + conformance) — SHARED FILES
**Commit:** `feat(T-146-01): register surface.relief brush + preview card; door tripwire guards it`

3.1 **Re-Read** `src/pack/idiom-registry.mjs` and `src/pack/brush-door.conformance.test.mjs`
immediately before editing (sibling-commit sweep guard, [[shared-file-commit-sweep]]).

3.2 `idiom-registry.mjs`: add the import + the `"surface.relief"` pass entry (preview shell substrate +
column-rhythm `realize` + paramsSchema), additive only.

3.3 `brush-door.conformance.test.mjs`: add `"surface-relief"` to `TECHNIQUES`.

3.4 Verify the full chain:
- `node --test 'src/**/*.test.mjs'` (or `npm test`) — **all green** incl. `idiom-registry.test.mjs`
  (entry tests-file exists & names brush; preview realizes), `brush-door.conformance` (relief guarded,
  allowlist not rotted), `brush-catalog`/`brush-preview` meta-tests.
- Repro/offline byte-identical: run the project's `--repro` and `--offline` suites (the witness/
  challenge/durable-skin/milestone repro scripts). Expect exit 0, no record diffs (op is additive, no
  committed runner calls it).

3.5 Commit.

**Verification criteria:** `npm test` fully green; `--repro`/`--offline` byte-identical; `getBrush
("surface.relief")` resolves; the catalog renders a relief card; no pinned record changed.

## Testing strategy
- **Unit (pure):** SR1–SR10 + surface-grid reliefProfile group — exhaustive op behavior, the harness,
  the read. All under `src/**/*.test.mjs`, no GL/IO.
- **Contract/meta:** `idiom-registry.test.mjs`, `brush-door.conformance.test.mjs`,
  `material-vocabulary.conformance`, brush-catalog meta — picked up automatically by the registry edit.
- **Integration (repro):** the project's `--repro`/`--offline` runners prove no committed behavior
  moved. The op is additive, so this is a *non-regression* check, not a new pinned record.
- **The acceptance gate** for AC2 is `reliefNoRegress` itself (SR9) — a relief that moves the in-plane
  ruler fails the test by construction.

## Rollback / deviation policy
Each step is one commit and self-contained; if Step 3's repro shows any drift, revert Step 3 only (the
op + read remain landed and green) and investigate the door wiring. Document any deviation in
`progress.md` before proceeding (RDSPI rule). No pin rotation is in scope — if a pinned record *would*
move, stop: that is a missing-dependency signal, not something to re-pin here.

## AC → step map
- AC1 (shared op through the door): Step 1 (op) + Step 3 (registry).
- AC2 (in-plane preserved + no-regress harness gate): Step 1 (`reliefNoRegress`, SR3, SR9).
- AC3 (2.5-D reads relief + documented construction-stage): Step 2 (`reliefProfile`, SR10).
- AC4 (preview card, tests, green, repro byte-identical, no per-building constants): Step 3 + the test
  files across all steps + `RELIEF_DEFAULTS`.
