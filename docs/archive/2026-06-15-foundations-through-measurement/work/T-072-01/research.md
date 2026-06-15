# T-072-01 — feature-aware-assignment · Research

Epic **E-21**, sibling of T-071-01. The failure E-21 attacks: mean-color CIE-Lab matching **collapses
near-tone-distinct materials** (stone_bricks vs cobblestone — a deliberate concept distinction). T-071-01
shipped the *semantic* half: a multimodal LLM names materials by intent + region (the **material map**).
This ticket ships the *placement* half: **assign those named blocks to voxels by geometric feature** — so
cobble lands on corners and brick on walls, a distinction mean color can never make. Descriptive only.

## The upstream contract (T-071-01 — done)

`src/form/material-map.mjs` (PURE) parses the LLM reply into a validated map and exposes the pieces this
ticket consumes:
- `PLACEMENT_RULES` (frozen, closed): `walls`, `corners-edges`, `roof`, `base`, `trim`, `openings`.
- `parseMaterialMap(raw)` → `{ map:[{role,block,placementRule,rationale}], dropped, palette, stats }`.
- `paletteFromMap(map)` → distinct namespaced blocks, first-seen order — **"the map defines E-21's allowed
  palette."** This is named in T-071-01's review as "the contract for the *next* ticket."
- `nearTonePairs` / `preservesDistinctGreys` — the AC#2 property checks.

The saved gatehouse map (`benchmarks/sculpture/material-map/gatehouse.json`) has 5 entries:
`stone_bricks→walls`, `cobblestone→corners-edges`, `deepslate_tiles→roof`, `dark_oak_log→trim`,
`dark_oak_planks→openings`. **No `base` entry** — base will be a *silent-map* cell (fallback territory).
`preservesNearTone=true`; stone_bricks↔cobblestone ΔL*=2.082 (exactly the collapse pair). The cottage map
exists too (7 entries) for a second subject.

## Occupancy — the geometry the classifier reads

`src/form/glb-voxelize.mjs`:
- `voxelizeGlb(glb,{scale}) → { scale, voxelSize, dims:[nx,ny,nz], bounds, occupied:Int32Array, count }`.
- `occupiedCells(occupancy)` — generator yielding `[i,j,k]` tuples in lattice order. **j is up (y)**,
  i→x, k→z (confirmed in `keysToArtifact`: `pos:[i-ox, j, k-oz]`, ground at y=0).
- `occupancyFromArtifact(artifact)` (exported from `benchmarks/sculpture/cleanliness-baseline.mjs`)
  reconstructs `{occupancy, keys}` from a built artifact — an alternate occupancy source.

The classifier needs only `{dims, occupied, count}` + face/box adjacency — **pure geometry, no GL, no
color**. This matches the purity discipline of every `src/form/*.mjs` core.

## Reusable adjacency + flood-fill (do not reimplement)

`src/form/voxel-components.mjs` already owns occupancy-as-graph utilities:
- `FACE_DIRS` (6 Manhattan-1 offsets) and `BOX_DIRS` (26) — the exact neighbor offsets a feature
  classifier needs.
- `indexCells(occupancy)` (internal) builds the `"i,j,k" → index` map; `componentLabels` is the shared
  flood fill. The pattern: build a `Set`/`Map` of occupied keys, test neighbor membership.
- `material-segment.mjs` repeats the same `DIRS6`/`DIRS26` constants and an occupied-key set — the
  neighbor-counting idiom is established. New feature code should mirror it (occupied `Set`, count empty
  vs occupied face-neighbors).

There is **no existing per-cell geometric classifier** — `voxel-components` labels by *connectivity*
(which mass), not by *feature* (corner/face/roof/base/recess). This module is genuinely new.

## The colorimetric matcher (E-14) — fallback + within-material value

`src/color/cielab.mjs`:
- `nearestLab(targetLab, palette, {metric}) → {key, deltaE, lab}` — argmin ΔE over a small
  `[{key,lab}]` palette (linear scan; palettes are 5–30 entries). This is the "colorimetric matcher" the
  AC keeps for (a) cells whose feature has **no map entry** (silent-map fallback) and (b)
  within-material value.
- `srgbToLab(rgb)` converts a sampled color; `nearestFlat` is a variance-preferring variant (E-19).
- Block→Lab values: `src/color/block-table.mjs` `loadBlockTable()` → `{blocks:[{block, lab, var}]}`.
  `material-map.mjs` already loads it (`TABLE_INDEX`) and `labOf` looks up a block's Lab — the same source
  the fallback palette must use so a map block's Lab is consistent.

## Per-cell colors — the impure edge (runner only)

For the colorimetric fallback the assigner needs a color per cell. The established path
(`src/form/glb-voxel-build.mjs` + `material-segment.mjs`):
- `parseGlbColoredSurface(glbBytes)` → surface; `decodeTexture` (impure, injected; WebP→PNG via `dwebp`).
- `sampleSurfaceColors({occupancy, surface, texture})` → flat `[r,g,b, …]` of length `3·count` in
  `occupiedCells` order. This is the only impurity; it lives in the **runner**, not the pure core.

## Artifact assembly + the AJV gate

`src/form/glb-voxel-build.mjs`:
- `keysToArtifact(occupancy, keys, opts)` — compiles occupancy + bare per-cell block keys (length=count,
  `occupiedCells` order) into a schema-valid DesignArtifact (`op:"voxel"`, centered pos, manifest, style).
  **Single source of truth** for the lattice→pos map. The assigner's job is to produce that `keys[]`.
- `paletteFromManifest`, `assertPaletteDiscipline`, `blockPaletteFromTable` — palette helpers.

`src/artifact.mjs` `assertArtifact(input)` runs the AJV gate (`parseArtifact` → throws on invalid). The
AC's "Output passes the AJV gate" = `assertArtifact(keysToArtifact(...))` succeeds.

## The build runner pattern (the template for this ticket's runner)

`benchmarks/sculpture/e19-build.mjs` is the canonical GLB→artifact→render→verify runner:
- `buildSubject`: read GLB → `voxelizeGlb` → `parseGlbColoredSurface` + `decodeTexture` → build artifact →
  `assertArtifact` → `renderArtifact(artifact,{outPath,view:SCULPTURE_VIEW_3Q})` (imported lazily from
  `render/src/render-tool.mjs`, the GL edge) → metrics (`judgeIoU`, `speckleScore`).
- `--offline` regenerates reports from committed summaries with **no GL**. Convention (memory + T-071-01
  review): **JSON/MD outputs are committed, PNG renders are gitignored**; `baml_client/` is gitignored.
- The gatehouse is **not** in `SUBJECTS` (sculpture list) — it's a *building* subject. Its GLB is present:
  `benchmarks/sculpture/glb/stone-gatehouse.glb` (5.2 MB). Run dir
  `runs/015-vBuilding-a-stone-gatehouse-…/` has `artifact.json` (text→JSON build), `concept.png`,
  `design-doc.md`. So the gatehouse can be voxelized from its GLB exactly like the sculpture subjects.

## Test + verification idiom

- `npm test` = artifact self-test + `test:unit` (`node --test "src/**/*.test.mjs"`). Pure cores are
  unit-tested on **synthetic** occupancy; the metered/GL runner branches are **not** unit-tested (verified
  by a committed live run). T-071-01 review: this is deliberate — the suite must never pull `claude -p`,
  BAML, or GL. Current suite per T-066-01 review: 676 green; T-071-01 review cites 691.

## Constraints / assumptions surfaced

1. **6 placement rules vs 5 geometric features.** The AC's feature set is `{flat-face, edge-corner,
   top-roof, base, opening-recess}` (5). The map's vocabulary is 6 rules (adds `trim`). `trim` (the arch
   voussoir) has **no geometric feature** the coarse classifier isolates — a known gap to document.
2. **Silent-map cells need a fallback.** The gatehouse map has no `base`; whatever lands in the base band
   must route to the colorimetric matcher (or a deterministic default) — colors required there.
3. **GLB is a TRELLIS reconstruction** (lumpy, not a crisp prism). The classifier is deterministic on
   whatever mass it gets; corner/face detection degrades gracefully but the manifest will still carry
   cobble (edges) AND stone_bricks (faces) — that *is* the restored distinction (AC#4).
4. **Purity split is load-bearing.** Classifier + assigner must be GL-/IO-/color-free pure (color enters
   only as injected per-cell `colors` for the fallback); sampling + render + write live in the runner.
5. **Determinism.** No `Date`/random (the project bans them in cores). Feature ties broken by a fixed
   priority order; output stable across runs.
