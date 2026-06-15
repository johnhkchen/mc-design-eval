# T-090-01 full-shell-zone-fill — Structure

File-level blueprint. Two files modified, one test file extended, records regenerated. No new modules,
no deletions, no new npm scripts (AC: behind the existing `npm run spray:paint`).

## 1. `src/view/zone-fill.mjs` — MODIFIED (additive)

### New export: `exposedVoxelEntries`

```js
/** Iterate the FULL-SHELL skin: every occupied voxel with ANY of its 6 faces air-exposed
 *  (the T-090-01 exposure skin — what an oblique camera can see, superset of the projection
 *  skin). Insertion-order deterministic. Includes -y-only and interior-cavity exposure (recorded
 *  limits — see design D1). Yields the same {key, voxel, block} shape as surfaceVoxelEntries. */
export function* exposedVoxelEntries(occ)
```

Implementation: walk `occ.cells`; split key once; reuse the module-level `NEIGHBORS` table; `yield`
on first unoccupied neighbor, `break`.

### New internal helper: `skinEntries`

```js
function skinEntries(occ, skin, faces) {
  if (skin === "projection") return surfaceVoxelEntries(occ, faces);
  if (skin === "exposure") return exposedVoxelEntries(occ);
  throw new Error(`zone-fill: skin "${skin}" is not "projection" or "exposure"`);
}
```

Single dispatch point used by both the fill and the census — one skin definition per name, no refork.

### `zoneFill(occ, opts)` — signature grows two optional fields

```js
{ zoneOf, zones, faces = FILL_FACES, minRun = 2,
  skin = "projection",                                  // NEW: which skin to enumerate
  regions = [] }                                        // NEW: declared sub-regions, kept unconditionally
// regions: [{ name: string, contains: (voxel:number[]) => boolean }]
```

Behavior deltas, in evaluation order per surface voxel:
1. **(NEW, first)** if any `regions[i].contains(voxel)` → KEEP; `kept++`, `byZone[zone].kept++`,
   `byRegion[name]++`. Regions outrank zone policy: a declared element keeps its material even when it
   is the zone's displaced field or a sub-minRun speck.
2. unchanged: dominant → keep; preserve∧run → keep; else fill.

Validation: each region must have a string `name` and a function `contains` (throw otherwise — same
fail-fast style as the `zones` validation). Return shape gains `byRegion: Record<string, number>`
(empty object when no regions declared) — additive, existing destructurings unaffected.

### `surfaceZoneHistogram(occ, zoneOf, opts)` — gains `skin`

```js
{ faces = FILL_FACES, skin = "projection" }   // dispatches through skinEntries
```

`dominantCoverage` is untouched (census-shape agnostic). `surfaceVoxelEntries`, `FILL_FACES`, `inRun`
untouched (T-087-01 consumer contract).

Header comment: extend the module doc with the T-090-01 paragraph (projection skin = what five ortho
cameras see; exposure skin = what ANY camera can see; the fill's coverage moves to the latter).

## 2. `src/view/zone-fill.test.mjs` — EXTENDED

New synthetic: **the gabled stepped roof** (the geometry class that defeats projection — design D2,
research §3 occlusion analysis):

```
gabledRoof(): z=4 gable wall x0..4,y0..3 spruce_planks; roof courses behind it along z0..3:
  y=0..1 full 5×4 spruce; y=2 course x1..3 with its ±x SIDE cells (x=1,x=3) given stone_bricks
  ("grey side cells"); y=3 ridge x=2 spruce. A 3-cell dark_oak_log stud run at (0, y=0..2, z=0).
zoneOf: all "roof". zones: { roof: { dominant: "spruce_planks", preserve: ["dark_oak_log"] } }
```

Key property to assert structurally: a y=2 stone side cell at (1,2,z) with the gable at (1,3,4)…
the +z ray at (x=1,y=2) hits the gable first; +y at (x=1,z) is covered by… choose coordinates in the
test so at least one grey cell is provably absent from `surfaceVoxelEntries` and present in
`exposedVoxelEntries` (assert both set-memberships explicitly — the test pins the *reason* the ticket
exists, not just the fill output).

New tests (names indicative):
1. `exposedVoxelEntries is a strict superset of the projection skin on the hut` — every
   `surfaceVoxelEntries` key ∈ exposure set; buried `(2,4,2)` ∈ neither; some y=0 underside-only cell
   ∈ exposure only.
2. `gabled stepped roof: occluded grey side cells are missed by projection, found by exposure` — the
   set-membership pin described above.
3. `zoneFill skin:"exposure" recolors the grey side cells to the roof material` (AC #1 case 1) — and
   `skin:"projection"` on the same occupancy does NOT emit those placements (the contrast line).
4. `a stud run survives the exposure fill` (AC #1 case 2) — logs kept on the gabled roof.
5. `declared sub-region keeps its material unconditionally` — hut + region
   `{name:"chimney", contains: ([x,y,z]) => x===1 && z===1 && y>=7}` with roof preserve set to `[]`
   and `minRun: 99` (both preservation routes disabled) → chimney bricks kept, `byRegion.chimney === 2`.
6. `exposure fill is still recolor-only / geometry-safe` — pos-set equality after `applyPaint`
   (mirror of the existing invariant test, on the exposure skin).
7. `surfaceZoneHistogram skin:"exposure" matches hand counts on the gabled roof`.
8. `unknown skin throws` (both entry points); `malformed region throws`.

Existing tests: byte-untouched (defaults preserve behavior).

## 3. `benchmarks/sculpture/spray-paint.mjs` — MODIFIED

- `ZONE_POLICY.roof.preserve`: `["dark_oak_planks", "cobblestone", "bricks", "dark_oak_log"]`
  (+ comment: gable timber framing classifies "roof" above upperTop; design D5).
- **§0c**: `zoneFill(occ, { zoneOf, zones: fillZones, skin: "exposure" })`; comment updated (full-shell
  T-090-01, replaces the wall-field fill — superset, design D2). Also compute the replay
  `fillProjection = zoneFill(occ, { zoneOf, zones: fillZones, skin: "projection" })` and
  `basedProjection = applyPaint(artifact, fillProjection.placements)` — the AC before-baseline.
- **Census basis**: all `surfaceZoneHistogram(...)` calls in §2b/§4/§5b gain `{skin:"exposure"}`
  (splat-only coverage, front-candidate precondition, final coverage). Console lines unchanged in shape.
- **§5b additions** (after the existing coverage-gate throw):
  - `bandsBefore/bandsAfter = dominantCoverage(surfaceZoneHistogram(basedProjection|painted, zoneOf,
    {skin:"exposure"}), ZONE_POLICY)`.
  - `acceptance = { roofMaterialsFraction, upperStoneFraction }` computed from `bandsAfter` byBlock vs
    `ZONE_POLICY` (roof-materials = dominant + preserve counts / total; upper stone =
    `byBlock.stone_bricks ?? 0` / total). Module consts `ROOF_BAND_TARGET = 0.9`,
    `UPPER_RESIDUE_MAX = 0.05` with the AC-rationale comment. **Throw** on violation.
- **Oblique render evidence** (§5c, best-effort like `tryRenderFace`): render `basedProjection` and
  `painted` at angle `"-x-z"` with labels `oblique225-before` / `oblique225-after`; collect
  `{path|error}` records.
- **Record (§6)**: `fill.skin: "exposure"`; `fill.byRegion`; `zones.coverage.skin: "exposure"`;
  `zones.bands = { skin: "exposure", measuredOn: {before: "projection-fill replay", after: "painted"},
  before, after, acceptance, thresholds }`; `renders.oblique = {azimuthDeg: 225, before, after}`; notes
  updated. `cottage.md` (`renderMd`): new "Full-shell fill (T-090-01)" section — band table
  before/after + acceptance line + render links.
- **`--offline`**: new skip-if-absent check `bandsOk` — `acceptance.roofMaterialsFraction >= 0.9 &&
  acceptance.upperStoneFraction <= 0.05` from the record; folded into `ok` and the summary line.
- `surfacePlasterByZone` / `stripOffZonePlaster` / `interiorPlaster`: **untouched** (the plaster guard
  keeps its projection basis; the exposure fill upstream already recolors off-zone surface plaster —
  scope discipline, noted in review).

## 4. Records & evidence — REGENERATED by the live run

- `benchmarks/sculpture/spray-paint/cottage.json`, `cottage.md`, `cottage/artifact.json` (committed).
- `cottage/view-oblique225-{before,after}.png` — committed evidence (verify the gitignore's dedicated
  PNG entry; add a narrow un-ignore for these two if needed).

## 5. Ordering

1. Pure core + tests (zone-fill.mjs / zone-fill.test.mjs) — independently green, commit.
2. Runner wiring (spray-paint.mjs) — offline-verifiable against the OLD record (degradation path),
   commit.
3. Live run → regenerated records + renders + AC verification, commit.

Dependency direction: runner → core only. T-087-01 contention is on spray-paint.mjs (step 2/3); if its
wiring lands first, rebase — the §0c/§5b seams don't overlap `stripStraySalt` wiring functionally.
