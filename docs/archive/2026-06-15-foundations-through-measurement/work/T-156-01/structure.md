# T-156-01 — Structure (archive-retired)

The blueprint: the exact ARCHIVE manifest, the KEEP boundary, the in-batch reference edits, and the
`_archive/` layout. **Records are data the kept skin/tests read — only retired RUNNERS and pure
retired OUTPUT dirs move; every record dir a live test/skin consumes stays put.**

## `_archive/` layout

```
benchmarks/sculpture/_archive/
  <runner>.mjs               # git mv of each retired runner (byte-identical)
  <runner>.{json,md}         # its loose record sidecar, when no live test reads it
  <output-dir>/              # git mv of each pure retired output tree (tst=0)
  README.md                  # manifest: name → closing epic/ticket → why retired (written last)
```

## ARCHIVE — runners (`git mv` → `_archive/`)

**Tier B — superseded standalone chains** (need conformance-list path edits):
`styled-milestone.mjs`, `challenge-milestone.mjs`, `reconstructed-milestone.mjs`,
`regularize-shell.mjs`, `pattern-book.mjs`, `pattern-book-compare.mjs`.

**Tier A — retired-epic runners** (E-13→E-24; self-contained or brush-door-listed):
`glb-voxel-run.mjs`, `glb-voxel-breadth.mjs`, `glb-voxel-clean.mjs`, `glb-voxel-seg.mjs`,
`glb-voxel-surgical.mjs`, `glb-voxel-surgical-sweep.mjs`, `glb-voxel-thin.mjs`, `surgical-standard.mjs`,
`e18-remeasure.mjs`, `e18-scorecard.mjs`, `e19-build.mjs`, `sweep-ablation.mjs`, `sweep-scorecard.mjs`,
`form-revise-ab.mjs`, `glb-formtarget-ab.mjs`, `glb-grounded-ab.mjs`, `concept-ab.mjs`,
`concept-materials-ab.mjs`, `value-match-ab.mjs`, `codesign-ab.mjs`, `material-correct.mjs`,
`material-assign.mjs`, `material-map.mjs`, `secondary-palette.mjs`, `palette-discipline.mjs`,
`value-select.mjs`, `resemblance.mjs`, `resemblance-consolidation.mjs`, `surface-coherence.mjs`,
`building-build.mjs`, `building-concept.mjs`, `cleanliness-baseline.mjs`, `form-baseline.mjs`,
`provision-concept.mjs`, `detector-routing.mjs`, `form-routing.mjs`, `voxelize-sanity.mjs`,
`view-layer-proof.mjs`, `facade-relief-proof.mjs`, `hollow-cottage.mjs`,
`hollow-cottage-milestone.mjs`, `floorplan-cottage.mjs`.

## ARCHIVE — output dirs (`git mv` → `_archive/`, all tst=0)

`glb-voxel/`, `glb-voxel-clean/`, `glb-voxel-seg/`, `glb-voxel-surgical/`,
`glb-voxel-surgical-sweep/`, `glb-voxel-thin/`, `e18-build/`, `e19-build/`, `form-revise-ab/`,
`glb-formtarget-ab/`, `material-correct/`, `material-assign/`, `material-map/`, `secondary-palette/`,
`palette-discipline/`, `value-select/`, `concept-materials/`, `resemblance/`, `building/`.
*(`sweep-ablation/` dir: one test refs it — verify in Implement; if it reads the dir, KEEP dir + still
archive `sweep-ablation.mjs`.)* Loose sidecars (`*-ab.{json,md}`, `e18-remeasure.{json,md}`,
`e19-cleanup.{json,md}`, `surgical-standard.{json,md}`, `building-build.{json,md}`,
`secondary-palette.{json,md}`, `palette-discipline.{json,md}`, `form-routing.{json,md}`) move with
their runner **only when `git grep` shows no live test reads them**, else stay.

## KEEP — do NOT move (with the reason)

- **Spine:** `build.mjs`, `generated-milestone.mjs` (build spawns it), `workshop.mjs`,
  `durable-skin.mjs`, `form-sketch.mjs`, `recognize.mjs`, `render-beside.mjs`.
- **Stage-4 skin feed:** `component-skin.mjs`, `component-decomposition.mjs`, `shaped-vocabulary.mjs`,
  `roof-program.mjs`, `kit-extract.mjs`, `kit-presence.mjs`, `dress-openings.mjs`,
  `placement-grammar.mjs`, `zone-map.mjs`.
- **Measurement instruments (live npm scripts / live test source-scans):** `multi-angle-gate.mjs`,
  `roof-diff.mjs`, `measured-proportions.mjs`, `proportion-milestone.mjs`, `facade-milestone.mjs`
  (+`.test.mjs`), `proportion-witness.mjs`, `ruler-calibration.mjs`, `visibility-witness.mjs`,
  `steep-pitch.mjs`, `facade-grammar.mjs`, `relief-calibration.mjs`, `budget-calibration.mjs`,
  `registration-smoke.mjs`, `shell-integrity.mjs`, `glb-smoke.mjs`, `spray-paint.mjs`,
  `surface-pattern.mjs` (E-23/T-087 evidence runners scanned by live conformance/view tests — current
  evidence, not E-09→E-24 sediment; KEEP this pass, recorded).
- **Catalog/util:** `idiom-card.mjs`, `brush-catalog.mjs`, `fixture-card.mjs`, `geometry-levers.mjs`,
  `run.mjs`, `value-match-shared.mjs` (imported by `run.mjs`), `trellis-glb.mjs` (imported by live
  `src/form/glb-mesh.mjs`/`glb-silhouette.mjs`), `baml-concept.mts`, `recognize`/`facade`/etc.
- **ALL record dirs a live test/skin reads** — `reconstructed/`, `styled/`, `challenge/`, `regularize/`,
  `components/`, `roof/`, `shaped/`, `zone-map/`, `pattern-book/` (holds `proportion-baselines.json` +
  `facade-baselines.json` fixtures read by `visibility-monotone.test`/`pin-guard.test`),
  `component-skin/`, `kit/`, `kit-presence/`, `dress-openings/`, `recognition/`, `generated/`,
  `workshop/`, `durable-skin/`, `form-sketch/`, `multi-angle/`, `relief/`, `visibility/`, `roof-diff/`,
  `glb/`, `runs/`, `brush-catalog/`, `idiom-card/`, `fixture-card/`, `factory/`, `proportion/`,
  `measured/`, `levers/`, `spray-paint/`, `surface-pattern/`.

## Files MODIFIED in place (reference edits)

| File | Edit |
| --- | --- |
| `src/form/pin-guard.conformance.test.mjs` | PIN_WRITERS: repoint `styled-milestone`, `challenge-milestone`, `reconstructed-milestone` → `_archive/…` (keep generated-milestone, others) |
| `src/pack/brush-door.conformance.test.mjs` | allowlist keys: repoint `challenge-milestone`, `styled-milestone`, `reconstructed-milestone`, `hollow-cottage`, `floorplan-cottage`, `hollow-cottage-milestone` → `_archive/…` |
| `src/form/material-vocabulary.conformance.test.mjs` | scan list + regex key: `styled-milestone` → `_archive/…` |
| `src/view/shell-regularize.test.mjs` | comment path `regularize-shell.mjs` → `_archive/…` (cosmetic) |
| `src/form/material-vocabulary.test.mjs` | comment path `styled-milestone.mjs` → `_archive/…` (cosmetic) |
| `package.json` | **remove** retired scripts: `styled:*`, `challenge:*`, `reconstructed:*`, `regularize:*`, `generated:*`, `patternbook:{cottage,barn,repro,offline,…saltcrag*}`, `patternbook:compare`, `pattern:cottage`, `e19:build`, `view:proof`, `coherence:cottage`, `hollow:cottage`, `floorplan:cottage`, `milestone:cottage`, `resemblance`, `resemblance:consolidate`, `surgical:standard`, `material:{map,assign,correct}`, `value:select`, `concept:ab`, `detect:routing`, `form:routing`, `building:build`. **Keep** `gate:patternbook:*` (kept gate + kept committed records). |
| retired `src/*` OUT-path strings | `src/form/material-map.mjs`, `src/color/value-select.mjs`, `src/form/resemblance.mjs`, `src/form/e19-cleanup.mjs`, `src/form/scorecard.mjs`, `src/form/concept-materials-ab.mjs`: repoint any default OUT path that points into a moved dir → `_archive/…` (string only; no live test executes them) |
| `STRUCTURE.md` | "Retired from the live path (archive in S-156, not yet moved)" → "Archived (S-156 / T-156-01)", paths → `_archive/…` |
| `benchmarks/sculpture/README.md` | update any link to a moved path (gallery records under `runs/` stay) |
| `benchmarks/sculpture/_archive/README.md` | **new** — the manifest (name → epic/ticket → reason) |

## Ordering (batches; `npm test` green before each commit)

1. **Batch 1 — Tier-A self-contained** (no test/pkg/src referrer): glb-voxel family, e18/e19, sweep,
   `*-ab` experiments, `building-*`, baselines, `provision-concept`, `voxelize-sanity`,
   `view-layer-proof`, `facade-relief-proof`, `surface-coherence`, `resemblance*`, dirs for each.
2. **Batch 2 — Tier-A with pkg/src referrers**: `material-*`, `secondary-palette`,
   `palette-discipline`, `value-select`, `detector-routing`, `form-routing`, `surgical-standard`,
   `hollow-*`, `floorplan-cottage`, `e19-build`, `concept-materials-ab` → move + remove npm scripts +
   update src OUT-path strings + brush-door entries for the hollow/floorplan trio.
3. **Batch 3 — Tier-B chains**: `styled/challenge/reconstructed-milestone`, `regularize-shell`,
   `pattern-book` + `-compare` → move + update the 3 conformance path lists + remove npm scripts.
4. **Batch 4 — docs**: `STRUCTURE.md`, `README.md`, `_archive/README.md`, final `npm test`.

A move that the oracle (`npm test` failure / `git grep` hit on a kept file) shows can't be cleanly
updated is **skipped and recorded** in `progress.md` (E-37 Rule 2).
