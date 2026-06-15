# T-091-01 shell-integrity-and-debris — Structure

File-level blueprint. Two files created, three modified, nothing deleted.

## Created: `src/view/shell-integrity.mjs` (pure cores, ~280 lines)

Header states: E-25/S-091/T-091-01; the no-air-op consequence (strip = artifact REBUILD, repair = ADD,
plug = ADD); ground-solid closure semantics; PURE — no GL, no I/O, no Date/random.

```
import { componentLabels } from "../form/voxel-components.mjs";   // the one flood-fill core
import { occupancyFromCells, bareBlock } from "./occupancy.mjs";
import { projectSurface, orthoSpec, cellWorldPos } from "./surface-grid.mjs";
import { openings } from "./structural-read.mjs";
import { spillLevels } from "./surface-pattern.mjs";              // extracted, see below
```

Exports (public interface):

- `componentStrip(occ, { keepGrounded = true } = {})`
  → `{ occ, components, kept:[{size, minY, grounded, largest}], stripped:[{size, minY}], strippedCells }`
  Adapts the cells-Map occupancy to the Int32 shape (`{occupied, count}`, insertion order) and calls
  `componentLabels(…, {connectivity: 6})`; keeps label of max size (lowest label on ties — matches
  `strayVoxelStats`) plus, when `keepGrounded`, every component with `minY === occ.bounds.min[1]`.
  Kept exceptions are *declared* in `kept`. New occupancy via `occupancyFromCells` (kept cells in
  original insertion order). Empty/single-component → input returned unchanged, empty report.

- `rebuildArtifact(occ, template)`
  → schema-shaped artifact: `schema_version`/`metadata`/`style` from template (shallow-copied),
  `palette` = `{palette_id?, manifest}` with manifest = sorted unique placed block ids (namespaced),
  `placements` = one `{op:"voxel", pos, block}` per cell in canonical (y,z,x) order (sort, don't trust
  insertion). Does NOT validate (callers run `assertArtifact` — the round-trip pattern). Throws on
  empty occupancy. Block `state` is not carried (occupancy doesn't hold it; documented).

- `openingRegions(occ, dirs = SIDE_FACES)`
  → `[{ kind:"door"|"window", dir, min:[x,y,z], max:[x,y,z] }]` — each `openings(occ, dir)` bbox
  back-projected through the FULL depth axis (world AABB via `cellWorldPos` at `wLo`/`wHi`), so regions
  survive later bounds changes. The allow-list source (raw pre-seal occupancy at call sites).

- `inRegion(pos, regions)` (small shared predicate; exported for tests/runner symmetry).

- `fillVoids(occ, { zoneOf, zones, minDepth = 3, dirs = [...SIDE_FACES, "+y"], regions = [] })`
  → `{ placements, filled, byDir:{dir:{basins, cells, skippedAllowed}}, }`
  Per dir: `projectSurface` → depth map → `spillLevels` over `-depth` (basin = recess) → for each cell
  with `pocketDepth = depth − spillDepth ≥ minDepth`, add voxels at depths `spill … depth−1`
  (`w = near==="max" ? wHi−d : wLo+d`, pos via `cellWorldPos`); skip any cell whose fill column
  intersects `regions`; block = `namespaced(zones[zoneOf(pos)].dominant)`, cells in zones without a
  policy entry are skipped (mirrors `zoneFill`). Validation errors mirror `zoneFill`'s.

- `closureCheck(occ, { regions = [] } = {})`
  → `{ closed, interiorCells, reached, byDirection:{"+x":n,…}, mouths:[key…] }`
  GROUND-SOLID: flood box floor = `min[1]` (no seeding from below); interior containment counts a `-y`
  ray exiting the bbox as a hit. `occAt = occ.has || inRegion` (declared openings are honorary skin).
  Interior = 6-ray containment (same logic as `watertightCheck`'s `rayInteriorAir`, re-stated here with
  the ground rule; no hollow carve — judge the standing build). Mouths = flood-reached interior cells
  with a flood-reached non-interior neighbour; `byDirection[d]` counts entries through face d; mouths
  sorted for determinism. `closed ⇔ reached === 0`.

- `plugClosure(occ, { zoneOf, zones, regions = [], maxIterations = 8 })`
  → `{ occ, placements, iterations, closed:true }` or THROWS after `maxIterations` (never returns
  unclosed — the convergence guarantee the gate relies on). Each round fills all current mouths with
  the owning zone's dominant (cells in policy-less zones get the build's most common block — total
  fallback so the loop cannot stall), re-checks.

Private helpers: `namespaced`, view→Int32 occupancy adapter, per-component grouping, depth/world maps.

## Modified: `src/view/surface-pattern.mjs` (~25 lines moved)

Extract the private priority-flood (heap + outlet-seeded spill propagation) into an exported pure
`spillLevels(valueMap: Map<"u,v",number>) → Map<"u,v",level>`; `regularizeRoofCourses` delegates
(behavior pinned by its existing tests). JSDoc states the two consumers (courses on the +y height map;
shell-integrity basins on `-depth`). No signature changes elsewhere.

## Created: `src/view/shell-integrity.test.mjs` (~12 tests, synthetic occupancies)

- strip: floating cube stripped + reported; grounded detached pillar kept as declared exception;
  `keepGrounded:false` strips it; single component no-op (same occ reference).
- rebuild: `artifactOccupancy(rebuildArtifact(occ, t)) ≡ occ` (size + per-key blocks); deterministic
  byte-equal on re-run; manifest sorted/unique; template fields preserved; throws on empty.
- openingRegions: hollow box with a window hole → one window region spanning the depth axis.
- fillVoids: 3-deep pocket filled flush to rim; 1-deep relief untouched at default `minDepth`;
  pocket inside an allow region skipped; placements carry the owning zone's dominant.
- closureCheck: sealed hollow box closed; roof hole → `closed:false` with `byDirection["+y"] > 0`;
  same hole declared in `regions` → closed; through-tube (arch) at ground → closed (passage air is not
  ray-contained); bottomless box → closed (ground-solid).
- plugClosure: roof-holed hollow box converges (closed, ≥1 placement, dominant material); honors
  `maxIterations` throw on an impossible cap (0/1 with a large breach… use cap 0 → throws).

## Created: `benchmarks/sculpture/shell-integrity.mjs` (impure runner, ~260 lines)

Mirrors `surface-pattern.mjs`/`durable-skin.mjs` conventions. `SUBJECTS`:
- `cottage`: build `spray-paint/cottage/artifact.json`; expectation `{components:23, strippedCells:126}`
  asserted (the AC numbers — a drift fails loudly);
- `gatehouse`: build `building/best/artifact.json` (the witnessed cavity subject).

Deterministic core `runShell(def)` (no GL, run TWICE, byte-equal):
strip → `rebuildArtifact` + `assertArtifact` → `structuralZones` → zone dominants from
`surfaceZoneHistogram(occ, zoneOf, {skin:"exposure"})` (census top block per zone — no E-21 map needed)
→ `regions = openingRegions(strippedOcc)` → `fillVoids` → `plugClosure` → `closureCheck` must be
`closed` (throw otherwise) → final = stripped artifact + void/plug placements via `applyDeltas` +
`assertArtifact`.

main(): `--offline` re-asserts committed record + artifact sha256 + gate fields; live writes
`shell-integrity/<subj>.{json,md}` + `shell-integrity/<subj>/artifact.json`, renders before/after at
`front`, `+x-z` (135°), `-x-z` (225°), `top` (best-effort `tryRenderAngle` pattern), copies frames to
`pr/assets/frames/shell-<subj>-{before,after}.png`. Record: schema `shell-integrity/v1`, strip report,
void byDir, plug count, closure verdict (byDirection), regions used, reproducible sha256, renders,
frames.

## Modified: `benchmarks/sculpture/durable-skin.mjs` (3 stages + gate + record fields)

In `buildSkin`:
1. after §2 substitution: `componentStrip` + `rebuildArtifact(…, artifact0)` + `assertArtifact` →
   `artifact0` replaced by the stripped rebuild (debris never feeds zones/projections); strip report
   kept for the record; `regions = openingRegions(occ0)` measured here (pre-seal — windows still open).
2. after §3 seal + §4 zones: `fillVoids(occSealed, {zoneOf, zones: fillZones, regions})` → repaired
   artifact via `applyDeltas`; zones **recomputed** on the repaired occupancy before §5 zoneFill.
3. after §8 salt: `plugClosure` (same zones/regions) → plug placements appended to `final`; §9 gains the
   terminal **closure gate**: `closureCheck(occFinal, {regions})` must report `closed` or THROW.
Record gains `shell: { strip, voids, plug, closure, regions }`; `--offline` checks extended
(`closure.closed === true`); md rendering gains a Shell-integrity section.

## Modified: `package.json`

`"shell:cottage": "node benchmarks/sculpture/shell-integrity.mjs --subject cottage"`,
`"shell:gatehouse": "… --subject gatehouse"`.

## Modified: `.gitignore`

`benchmarks/sculpture/shell-integrity/*/[!.]*.png` stanza mirroring durable-skin's (records + artifacts
committed, PNGs not; frames under `pr/assets/frames/` committed).

## Ordering

1. `surface-pattern.mjs` extraction (existing tests stay green) — safe base.
2. `shell-integrity.mjs` + tests (pure layer complete, `npm test` green).
3. Runner + npm scripts + gitignore; live `shell:cottage` + `shell:gatehouse`; commit records/frames.
4. `durable-skin.mjs` wiring; live `skin:cottage` + `skin:gatehouse` regenerate committed records
   (sha256 change is the expected pipeline-upgrade consequence); `--offline` re-asserts both.

Dependency note: nothing imports `shell-integrity.mjs` today, so steps 1–2 cannot break consumers; the
runner (3) and pipeline (4) are leaf edits.
