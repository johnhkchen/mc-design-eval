# `benchmarks/sculpture/_archive/` — retired runners + trees (S-156 / T-156-01)

Sediment from **closed epics (E-13→E-24)** plus the **standalone chains the unified
`build:<subject>` chain superseded** (E-37 / S-154; see the repo-root `STRUCTURE.md`). Moved here by
`git mv` (byte-identical, history walkable with `git log --follow`) so the live `benchmarks/sculpture/`
tree reads as the canonical spine only.

**Archive, don't delete** (E-37 Rule 2): reversible, every committed reference was updated or the move
refused. Nothing in the live spine imports `_archive/` (S-157 makes that a permanent topology guard).

## What stayed in the live tree (deliberately)

- **`generated-milestone.mjs`** — `build.mjs` spawns it as the Stage-4 seed (its `generated:*` *npm
  scripts* were removed; the file is load-bearing).
- **Record dirs that feed the kept Stage-4 skin** — `styled/`, `challenge/`, `reconstructed/`,
  `regularize/`, `components/`, `roof/`, `shaped/`, `zone-map/` (read by `component-skin`'s distill) +
  `pattern-book/` baselines (read by `visibility-monotone`/`pin-guard` tests). Their *runners* retired;
  their *records* stay.
- **`concept-materials/`** — live input (`after-artifact.json` canvas) to the kept `spray-paint.mjs`.
- **Current evidence runners still scanned by live conformance/view tests** — `spray-paint.mjs`,
  `surface-pattern.mjs`, `glb-smoke.mjs`, `registration-smoke.mjs`, `shell-integrity.mjs` (kept this
  pass; re-evaluation belongs with S-157's permanent guardrail).

## Manifest

### Superseded standalone chains (their stages now live inside the unified chain / `src/*`)
- `reconstructed-milestone.mjs` — terminal E-27 reconstruction chain (T-106); referenced live only
  in provenance comments, no live import/spawn.
- `regularize-shell.mjs` — E-27/28 reconstruction ("the blob never becomes the build"; generate-first).

> **Restored to the live tree (T-158-01, the E-37 proof).** `styled-milestone.mjs` and
> `challenge-milestone.mjs` were originally archived here in S-156 but **host the shared Stage-4
> stages** (`styledStretch` / `shellStage` / `spawnGate` / `distillGate` / `runChain`) that the
> live `generated-milestone.mjs` *imports* and `component-skin.mjs` *spawns by name* — archiving
> them broke the one chain (caught the first time barn/cottage ran end-to-end). They are live
> shared-stage hosts, not dead code. Likewise the four committed subject maps
> `material-map/{barn,church,cottage,gatehouse}.json` were restored (live `durable-skin` `map:`
> inputs); only the retired-subject maps (`moai`/`pineapple`) and the `.raw.json` intermediates
> remain archived here.
- `pattern-book.mjs`, `pattern-book-compare.mjs` — the program-seed chain + its verdict reader,
  replaced by the generate-first realizer that seeds the workshop.

### Retired-epic sediment (E-13→E-24)
- **GLB-voxel / surgical (E-13→E-16):** `glb-voxel-run/breadth/clean/seg/surgical/surgical-sweep/thin.mjs`
  + `glb-voxel{,-clean,-seg,-surgical,-surgical-sweep,-thin}/`, `surgical-standard.mjs`(+records).
- **Form-revise / GLB-formtarget A/B (E-15):** `form-revise-ab.mjs`, `glb-formtarget-ab.mjs`,
  `glb-grounded-ab.mjs` (+ dirs + `*-ab.{json,md}`).
- **E-18 / E-19:** `e18-remeasure.mjs`, `e18-scorecard.mjs`, `e19-build.mjs` (+ `e18-build/`,
  `e19-build/`, `e18-remeasure.{json,md}`, `e19-cleanup.{json,md}`).
- **Material / palette epoch (E-19→E-21):** `material-correct.mjs`, `material-assign.mjs`,
  `material-map.mjs`, `secondary-palette.mjs`, `palette-discipline.mjs`, `value-select.mjs`,
  `value-match-ab.mjs`, `concept-ab.mjs`, `concept-materials-ab.mjs`, `codesign-ab.mjs`,
  `resemblance.mjs`, `resemblance-consolidation.mjs`, `surface-coherence.mjs` (+ their dirs/records).
- **Ablation / scorecards:** `sweep-ablation.mjs`, `sweep-scorecard.mjs` (+ `sweep-ablation.{json,md}`).
- **Building-mode + assorted spikes (E-20–E-24):** `building-build.mjs`, `building-concept.mjs`
  (+ `building/`), `cleanliness-baseline.mjs`, `form-baseline.mjs`, `provision-concept.mjs`,
  `detector-routing.mjs`, `form-routing.mjs`, `voxelize-sanity.mjs`, `view-layer-proof.mjs`,
  `facade-relief-proof.mjs`, `hollow-cottage.mjs`, `hollow-cottage-milestone.mjs`, `floorplan-cottage.mjs`.

## References updated when these moved
- **Source-scan conformance tests** (still enforce the door/pin-guard on the archived sources):
  `src/form/pin-guard.conformance.test.mjs`, `src/pack/brush-door.conformance.test.mjs`,
  `src/form/material-vocabulary.conformance.test.mjs`, `src/workshop/isolation.test.mjs` — runner
  paths repointed to `_archive/…`.
- **`package.json`** — the retired chains' npm scripts removed (`styled:*`, `challenge:*`,
  `reconstructed:*`, `regularize:*`, `generated:*`, `patternbook:*`, `material:*`, `value:select`,
  `e19:build`, `building:build`, `view:proof`, `coherence:cottage`, `resemblance*`, `hollow:*`,
  `floorplan:*`, `milestone:cottage`, `surgical:standard`, `detect:routing`, `form:routing`, …).
  `gate:patternbook:*` kept (kept gate + kept committed records).
- **Pure-half `src/*` lib provenance comments** repointed to `_archive/…`.
