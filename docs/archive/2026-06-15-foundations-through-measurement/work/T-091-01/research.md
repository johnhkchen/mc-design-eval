# T-091-01 shell-integrity-and-debris — Research

Epic E-25 / Story S-091. Three witnessed geometric/topological shell defects no current gate catches:
floating debris components, missing-mass shell voids, and plan-only (never oblique) closure verification.
This document maps what exists; it proposes nothing.

## 1. The ticket's three defects, re-measured today (2026-06-10)

Measured with throwaway scripts over `artifactOccupancy` (committed nowhere; reproduced below as facts).

| artifact | cells | 6-conn comps | sizes (top) | off-main | watertight? (`watertightCheck`) | openings() |
|---|---|---|---|---|---|---|
| `spray-paint/cottage/artifact.json` | 6438 | **23** | 6312, 54, 20, 7, 7, 6… | **126** | false (interior 3625, reached 2507) | none (sealed) |
| `durable-skin/cottage/artifact.json` | 6523 | 18 | 6412, 54, 20, 7, 6… | 111 | false (3758 / 2620) | none |
| `building/best/artifact.json` (gatehouse, E-20 scale-64) | 57202 | 1 | 57202 | 0 | false (35436 / 3754) | ±x door(426)+window(1); ±z window(149) |
| `durable-skin/gatehouse/artifact.json` | 8423 | 16 | 7107, **1259**, 7, 7, 6… | 1316 | false (3490 / 1152) | ±x door(87) |
| `concept-materials/gatehouse/after-artifact.json` (raw input) | 8076 | 23 | 6593, 1259, 59, 36… | 1483 | false (3213 / 1010) | ±x door+2 windows; ±z 3 windows |
| `concept-materials/cottage/after-artifact.json` (raw input) | 6429 | 24 | 6273, 54, 30, 20… | 156 | false (3561 / 2443) | ±x 3 windows |

Key facts:

- **Cottage debris is exactly the AC's 23 → 1, 126 cells** on the spray-paint artifact. Every off-main
  cottage component FLOATS: min-y of the strays is 2, 22, 25… while the build grounds at y=0. The
  current durable-skin pipeline *adds* skin placements but never removes debris (18 comps remain in its
  output; course basin-fill even merged a few).
- **The gatehouse's 1259-cell second component is NOT debris.** bbox [-11,0,-3]..[11,14,4]: grounded at
  y=0, central, spanning the passage — it is the inner gate/passage structure (dark-oak door leaf visible
  through the arch in `view-final-front.png`). It is disconnected even at 26-conn ([7138, 1285]) — an
  air gap separates it from the shell on all sides. A literal keep-only-largest strip would delete a
  standing, visible structure. The S-091 phrase "small thresholded exceptions must be declared" is in
  tension with this 17.7%-of-main mass; `pruneStrays`' relative rule (minFraction 0.5) would also drop it.
- **`watertightCheck` fails on every committed build** with large `reached` counts — the exterior flood
  freely reaches ray-contained interior air. So "wire a closure gate in" cannot mean "call
  watertightCheck and throw": every subject would fail today. A repair op must precede the gate.
- **Render evidence**: `durable-skin/cottage/view-final-oblique225.png` shows (a) floating grey fragments
  off the right/lower silhouette and (b) sky/wall visible through gaps between roof course steps — the
  exact defect 3 witnessed ("plan-only closure"). `building/scale-64/render-3q.png` shows the gatehouse
  missing-mass cavity (dark void inside the silhouette, distinct from the arch).

## 2. Probe results that constrain the void detector

Two throwaway detectors were tried on the gatehouse; both fail informatively:

- **Exterior-reachable + ≥5-of-6 ray-occluded air**: over-collects catastrophically (3577 cells on the
  8.4k durable gatehouse) because the arch passage and the existing shell leaks make the *entire hollow
  interior* exterior-reachable; the attic (1135-cell cluster), passage mouths (2×126), and legitimate
  recesses all match. Pure occlusion-counting cannot define "cavity".
- **Per-face depth outliers (depth ≥ global median + 3)**: conflates three populations — true recesses,
  the arch (rays travel through the passage and hit the inner mass at depth), and the pitched roof's
  *gradual* slope (top rows of ±z grids are uniformly "deep"). A global threshold is the wrong shape;
  recesses are *local* basins in the per-face depth field (deep relative to their own rim), which is
  exactly the hydrological structure `regularizeRoofCourses` already exploits on the +y height field.

## 3. The artifact contract: deletion requires a rebuild

`src/expand.mjs expandPlacement` supports ops `voxel | fill | box | line` — **no air op** (memory:
`facade-recess-by-exclusion`; restated in surface-coherence/surface-pattern headers: "RECOLOR + ADD ONLY,
NEVER DELETE"). Every existing op appends `{op:"voxel"}` rows under last-write-wins. A component STRIP
removes cells, so it cannot be an appended placement — the artifact must be **rebuilt** with only the
kept cells. Precedent: `src/form/glb-voxel-build.mjs keysToArtifact` builds a schema-valid artifact as
one `{op:"voxel"}` per cell + sorted manifest (the whole GLB-voxel lineage ships such artifacts;
`building/best` *is* one). `expandArtifact` emits canonical (y,z,x) order, so a rebuild is deterministic.
Note: per-voxel `state` exists in the schema but the pipeline never uses fixtures (memory:
`recognize-blocks-dont-color-match`); occupancy's cells Map carries block id only.

## 4. Existing pure cores and their seams (src/view/, src/form/)

- `occupancy.mjs` — `artifactOccupancy(artifact)` → `{bounds, dims, size, cells:Map<"x,y,z",block>, has, block}`;
  `occupancyFromCells(list)`; `bareBlock`. The view-layer substrate. (The OTHER occupancy shape —
  `{occupied:Int32Array,count}` — backs `src/form/voxel-components.mjs componentLabels / pruneStrays`,
  the existing 6/26-conn flood-fill + debris-prune for the GLB path. Reuse requires a shape adapter.)
- `surface-grid.mjs` — `projectSurface(occ, dir)` (first-hit cells with `.voxel`, `.depth`), `orthoSpec`,
  `cellWorldPos(occ, spec, u, v, w)` (back-projection used by the seal ops), `gridMaskOf`.
- `structural-read.mjs` — `openings(occ, dir)` (enclosed air = window, bottom-touching = door, per ortho
  elevation — these are *through-silhouette* holes only; a 1-deep recess does not register),
  `airComponents`, `roofRegion`, `structuralZones(occ)` → `{zoneOf, …}` (geometry-derived base/upper/roof).
- `surface-coherence.mjs` (T-084) — `sealRoof`/`sealWalls` (recolor strays + ADD seals at enclosed 2-D
  face holes; windows get sealed — that is why committed builds report no openings), `overlay`,
  `applyDeltas`, `enclosedMassKeys`, `watertightCheck(occ,{interior})` with private `rayInteriorAir`
  (6-ray containment, breach-tolerant) and a padded-bbox 6-conn exterior flood. The flood/interior logic
  T-091's closure check needs already exists here, but: it simulates a hollow by default (carves
  `enclosedMassKeys`), reports only `reached`+sample breach keys, has **no per-direction verdict and no
  openings allow-list**.
- `zone-fill.mjs` (T-085/T-090) — `zoneFill(..., skin:"exposure")`, `exposedVoxelEntries` (full 6-dir
  shell), `surfaceZoneHistogram` (+`dominantCoverage`): per-zone shell census incl. `byBlock` — a
  zone's *dominant shell material* is derivable from geometry + census alone (no E-21 map needed).
- `surface-pattern.mjs` (T-087) — `regularizeRoofCourses`: **priority-flood basin fill to spill level**
  over the +y height map (private min-heap + flood; outlets = columns missing a 4-neighbour);
  `stripStraySalt`; `overlayPlacements`. The basin-fill machinery is private to this module.
- `face-resemblance.mjs` (T-088) — `coverageGate` precedent: pure verdict object `{passed, failures[]}`,
  runner throws on `!passed` (gate-not-logger pattern, durable-skin §9).

## 5. The pipeline (impure runners) and wiring points

`benchmarks/sculpture/durable-skin.mjs` (T-089, `npm run skin:cottage|gatehouse`) is the consolidated
E-24/E-25 pipeline: `buildSkin(def)` = value-true substitution → **seal (S-084)** → `structuralZones` →
full-shell `zoneFill` → secondaries splat → course basin-fill → salt strip → terminal gates (coverage +
bands + plaster invariant; each THROWS). Determinism contract: deterministic core runs twice, artifacts
byte-identical, sha256 recorded; `--offline` re-asserts the committed record. Renders are evidence,
never inputs. Subject registry `SUBJECTS` holds per-subject committed inputs + zone policies.
Per-ticket runners (`spray-paint.mjs`, `surface-pattern.mjs`, `value-select.mjs`) stay as measurement
records. npm scripts follow `verb:subject` (`skin:cottage`, `pattern:cottage`).
Render lens: `multi-angle.mjs renderViews` with named angles incl. diagonals 45/135/225/315 — oblique
sky-through-shell evidence is renderable at the witnessed 135°/225° angles.

## 6. Constraints and conventions that bind the design

- **Pure/impure seam**: anything that transforms the build = pure module under `src/` with a sibling
  `.test.mjs` (runs in `npm test` glob, currently ~1035 tests green); GL, file I/O, records live in
  `benchmarks/`. No Date/random in cores.
- **E-24 Rule 1** no hand-edits (everything behind a named npm run); **Rule 2** determinism
  (double-run byte-equal); **E-25 Rule 3** no subject-specific constants (policies/thresholds are data
  or geometry-derived).
- The cottage AC numbers (23→1, 126 removed) are stated against `spray-paint/cottage/artifact.json`; the
  void AC names `building/best/artifact.json`; the closure AC says "cottage + gatehouse pass after
  repair" and "wired into the pipeline" — the ticket spans both the witnessed artifacts and the
  durable pipeline.
- `depends_on: [T-084-01]` (done): sealing + `watertightCheck` + `openings`/`airComponents` exist.

## 7. Assumptions and open questions carried to Design

1. Whether "keep the largest, strip the rest" should be literal — the gatehouse's grounded 1259-cell
   inner structure says no; some principled keep-exception (e.g. groundedness) is needed, with the
   stripped/kept report making every exception declared (S-091's wording).
2. What "the concept's visible door/window/arch regions" means operationally with no concept-region
   reader in the repo: the RAW (pre-seal) artifacts still expose their openings via `openings()` —
   a data-driven allow-list source that exists today. A true concept-image opening reader does not.
3. Whether closure should tolerate the arch: passage air is not ray-contained (rays exit through both
   mouths), so a sound interior/exterior split may already classify it benignly — needs a test.
4. The repair must *guarantee* the closure gate passes on both subjects (the gate throws); a detector
   that only fixes *visible* basins may leave flood paths — the design needs a convergence argument.
5. Rebuilt-artifact identity: stripping rebuilds placements; downstream stages (zones, fill, splat)
   consume occupancy so they are insensitive to placement encoding; `assertArtifact` round-trip applies.
