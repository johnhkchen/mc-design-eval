# T-027-01 — Plan: material-noise pass

Ordered, independently-verifiable steps. Tests are `node:test`; verification is `npm test` green plus
the specific assertions each step adds. One atomic commit at the end (single new module + edits), or
split set-vs-stage if the diff warrants it.

## Step 1 — `hueFamilySet` + namespace + noise primitives

Create `src/sculptor/material.mjs` with: the header comment, imports, `DEFAULTS`, `MATERIAL_STYLE`,
module-scope `TABLE = loadBlockTable()`, the `tableKey`/`blockId` namespace helpers, `hueFamilySet`,
`cellHash`, and `pickMaterial`. No stage yet.

- `hueFamilySet(target, {size, radius})`: resolve `targetLab` (id lookup / rgb→`srgbToLab` / `{lab}`),
  rank table by `deltaE`, keep ≤radius up to `size`, always ≥1, sort dark→light by L, return
  namespaced ids.
- `cellHash(x,y)` xorshift → [0,1); `pickMaterial(set,t,h,spread)` center+jitter, clamped.

**Verify:** write group 1 + 2 tests (hueFamilySet shape/order/namespace/throw; cellHash determinism &
range; pickMaterial endpoints & S=1). `node --test src/sculptor/material.test.mjs` green for these.

## Step 2 — surface resolution + the stage + convenience

Add `dominantBlock`, `resolveSurfaces`, `materialStage`, `material`, `compileMaterial`, and the
exports.

- `materialStage` writes only `material` on occupied cells; computes `t` from the occupied bbox; uses
  `cellHash` + `pickMaterial`.
- `material(state, intent)` = `runStages(state, [materialStage(intent)], intent)`.

**Verify:** groups 3–5 (writes material / occupied untouched / air untouched; out-of-palette guard;
height variation top≠bottom). Green.

## Step 3 — locks, compile/AJV, intent, determinism

Finish the test file: groups 6 (lock composition: `LockViolationError` on material repaint,
`StageRejectedError` on bypass, relief still settable), 7 (`compileMaterial` → real
`parseArtifact`/`assertArtifact`, multi-entry manifest, one placement/occupied cell), 8 (intent
palette bare+namespaced, explicit surfaces with region predicate, empty-intent stone fallback), 9
(determinism / idempotent re-run).

**Verify:** all 9 groups green; assertions cover every AC line.

## Step 4 — barrel + README

Export the public surface from `index.mjs`; add the `material.mjs` bullet to `README.md`.

**Verify:** `import { material, hueFamilySet, compileMaterial } from "./index.mjs"` resolves in a test
(group 7 already imports lock errors from `./index.mjs`; add the material verbs there).

## Step 5 — full suite + commit

`npm test` (whole repo) green. Commit:
`feat(sculptor): material-noise pass — same-hue set + height light-break (T-027-01)`.

## Testing strategy & coverage map (AC → test)

| Acceptance criterion | Covered by |
|---|---|
| 2–3 same-hue set via E-10 engine, noise mix | group 1 (set), group 2 (pick), group 4 (in-set) |
| varied across height (top/bottom differ) | group 5 |
| writes `material`, locks it | group 3, group 6 |
| leaves `occupied` (locked) untouched | group 3, group 6 (no LockViolation from massing) |
| materials all from hue-family set + manifest (no out-of-palette) | group 4, group 8 |
| height variation present | group 5 |
| massing lock not violated | group 6 |
| composes through orchestrator after massing | group 6, group 7 |
| compiles to AJV-valid `DesignArtifact` | group 7 |
| `npm test` green | Step 5 |

## Risks & mitigations

- **R1 — namespace mismatch (bare table key vs namespaced artifact id).** The whole AC4/round-trip
  hinges on it. Mitigated by `blockId`/`tableKey` at every boundary and group 7's real-AJV assert.
- **R2 — height variation absent when the silhouette is short or the set is size 1.** Use a tall
  fixture (≥ several rows) and the stone target (dense neighbourhood → S≥2) in group 5; assert the
  default stone target yields ≥2.
- **R3 — radius too tight → empty set.** `always keep ≥1` guard; default radius 6 verified to admit
  the stone family; group 1 asserts ≥2 for stone.
- **R4 — accidentally materializing an air cell (would flip `occupied` → StageRejected).** The stage
  iterates `occupiedCells(prev)` only; group 3 asserts air cells stay `undefined`.
- **R5 — non-determinism** breaking render reproducibility. `cellHash` is pure (no `Math.random`);
  group 9 asserts identical output across two runs.

## Out of scope (documented, not silently dropped)

- Connected-component / auto surface segmentation (no detector exists; `intent.surfaces` is the seam).
- CIEDE2000 metric (engine default CIE76 is sufficient; `nearestLab` accepts a metric later).
- Relief / Z-depth (T-028, composes on this pass's material-locked output).
- Editing the E-10 engine to host k-nearest (kept local per design D1).
