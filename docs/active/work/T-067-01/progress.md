# T-067-01 — Progress

## Step 1 — Pure building mode module + tests ✅ (committed)

- `src/config.mjs`: added `VCONCEPT_BUILDING_METHOD_ID = "vconcept-building.v1"` (single-sourced, doc'd).
- `src/building.mjs`: new PURE mode surface mirroring `src/sculpture.mjs` — `VCONCEPT_BUILDING`
  descriptor; `BUILDING_SCALE_MIN/MAX/DEFAULT` (16/96/48); `BUILDING_DEFAULTS`; `BUILDING_VIEW_3Q`;
  `BUILDING_TURNTABLE`; `assertBuildingSpec`; `buildingScaleCaps`; `runIdForBuilding` (`vBuilding`
  infix); `buildingMetadata` (no `target`); `composeBuildingDesignDocPrompt`;
  `composeBuildingBuildPrompt` (in the round, single-view limit, single-building constraint). Reuses
  `metadataPinLines` from `sculpture.mjs`.
- `src/building.test.mjs`: 9 tests, mirrors `sculpture.test.mjs` 1:1 + the single-building assertion.
- Reworded the design-doc negation ("a single front wall or facade") so the proven `FACADE_TOKENS`
  guard (incl. `/front elevation/i`) holds without false positives.

**Verify:** `npm test` → **626 pass / 0 fail** (was 617; +9). Deterministic, no metering.

## Step 2 — BAML BuildingConceptPrompt + regenerate client ⏳

## Step 3 — Wire runner + shim + script ⏳

## Step 4 — LIVE: concept, GLB, validation, manifest ⏳

## Deviations from plan

- (none yet)
