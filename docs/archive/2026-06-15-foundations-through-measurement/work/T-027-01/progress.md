# T-027-01 — Progress: material-noise pass

Status: **implementation complete, all ACs verified, `npm test` green (274/274).**

## What was built (follows the plan)

- **`src/sculptor/material.mjs`** (new) — the whole pass:
  - `hueFamilySet(target, {size, radius})` — the same-hue set: ranks the survival block→Lab table by
    the E-10 engine's `deltaE`, keeps the nearest ≤`radius` up to `size` (always ≥1), ordered
    dark→light by L*, returned namespaced. Targets: block id (bare/namespaced), rgb triple, `{lab}`/`{rgb}`.
  - `cellHash(x,y)` — deterministic xorshift → [0,1) (no `Math.random`); `pickMaterial(set,t,h,spread)`
    — height-centred + hash-jittered, clamped pick (bottom→darkest, top→lightest).
  - `resolveSurfaces` / `materialStage` / `material(state, intent)` — partition occupied cells into
    surfaces (default = whole silhouette, target from `intent.material.palette` ?? `MASSING_BLOCK`;
    explicit `intent.material.surfaces` with predicate/`[[x,y]]` regions), write **only `material`** on
    **only occupied** cells, run through `runStages` so the orchestrator locks `material`.
  - `compileMaterial`, `MATERIAL_STYLE`, `tableKey`/`blockId` namespace helpers, `DEFAULTS`.
- **`src/sculptor/material.test.mjs`** (new) — 20 tests across the 10 groups in the plan.
- **`src/sculptor/index.mjs`** — exports `hueFamilySet, materialStage, material, compileMaterial,
  MATERIAL_STYLE`.
- **`src/sculptor/README.md`** — added the `material.mjs` pass bullet.

## Deviations from the plan

- **`nearestLab` not imported.** Plan/structure listed it; the k-nearest is a `deltaE` rank whose
  element 0 *is* the nearest, so `nearestLab` would be redundant. Imported only `srgbToLab`/`deltaE`
  from the engine. (The set still "uses the E-10 engine to find the nearest + neighbours" — via its ΔE.)
- **`MASSING_BLOCK` imported from `massing.mjs`** as the fallback target (single source for "the gray"),
  rather than re-declaring a local constant. No cycle (massing doesn't import material).
- **Concurrent landing:** T-026 (`review.mjs`) merged into `index.mjs`/`README.md` while this ran; I
  appended to the current files (no conflict — disjoint exports/sections).

## AC verification

1. *Same-hue 2–3 set via the E-10 engine, noise mix, varied across height, writes+locks `material`,
   leaves `occupied` untouched* — groups 1–6. `hueFamilySet("stone")` → `{stone_bricks, stone,
   cobblestone}` (dark→light), all namespaced; paint writes only `material`; `isLocked(material)` true,
   `isLocked(occupied)` still true, `relief` free.
2. *Tested: in-set materials (no out-of-palette), height variation top≠bottom, massing lock intact* —
   groups 4, 5, 6 (incl. occupied-count-unchanged and `LockViolationError`/`StageRejectedError`).
3. *Composes through the orchestrator after massing; compiles to AJV-valid `DesignArtifact`* — group 7
   (`mass → material → compileMaterial` → real `parseArtifact`/`assertArtifact`, multi-entry manifest).
4. *`npm test` green* — 274/274.

## Commit

`feat(sculptor): material-noise pass — same-hue set + height light-break (T-027-01)`
