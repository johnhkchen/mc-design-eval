# Research — T-080-01 hollow-the-mass

Epic **E-23** / Story **S-080**, the **program path**: voxelizing a TRELLIS mesh (or a built cottage)
gives a **solid** mass; the milestone needs a **hollow** shell (skin + structure) to put rooms in.
*Carving* is a deterministic program; *what is safely hollowable* is a scoped LLM call. This maps the
codebase the carve will sit in. Descriptive only.

## The contract the carve must respect

### There is NO air op (the load-bearing constraint)

`src/expand.mjs` is the one expansion. `expandArtifact` applies placements in array order, **last write
wins, full replace** (`expand.mjs:170`), and the only ops are `voxel | line | box | fill` — **all
additive**. There is no "delete"/"air" placement: you cannot subtract a voxel by appending. This is the
documented project stance (memory `facade-recess-by-exclusion`: *carve by NOT placing material, never by
burying a block behind a solid fill*). T-084's seal ops are **append-only** for exactly this reason
(recolor = a `{op:"voxel"}` at an existing pos; seal = an added voxel — `surface-coherence.mjs:11-17`).

**Consequence for hollowing:** removing interior mass cannot be append-only. The only contract-respecting
way to drop a voxel is to **rebuild the placement list by exclusion** — expand to explicit voxels, omit
the carved set, re-emit. `expandArtifact` is order-independent and produces byte-identical output for a
fixed voxel set, so a flatten-by-exclusion of the *kept* cells re-expands to exactly those cells.

### The occupancy substrate (T-078-01)

`src/view/occupancy.mjs` — the one PURE adapter from a schema-valid artifact to a material-carrying
`Occupancy` (`artifactOccupancy` → `expandArtifact` → `occupancyFromCells`). Shape: `bounds {min,max}`,
`dims`, `size`, `cells: Map<"x,y,z", blockId>`, `has(x,y,z)`, `block(x,y,z)`. Coordinates stay in the
artifact's own integer space (builds are centred near origin, negative coords allowed). `occupancyFromCells`
is **last-write-wins**, so overlaying recolors/omissions is a re-`occupancyFromCells` of a cell list — the
same trick `surface-coherence.overlay` uses.

## What already exists that the carve consumes

### Enclosed-mass = the carveable bulk (defined twice already)

The "fully-enclosed voxel" rule the AC names — *all six orthogonal neighbours occupied* — is implemented
**twice**:
- `hollowable-mass.hollowableCore` (`hollowable-mass.mjs:33-57`) counts `enclosed` and groups it per
  storey band; it also reports `skinHoles` (the seal-before-hollow blocker).
- `surface-coherence.enclosedMassKeys` (`surface-coherence.mjs:282-293`) returns the **keys** of the same
  set, used by `watertightCheck` as the simulated cavity. Currently **module-private**.

An enclosed voxel is by definition **not on the exterior skin** (a skin voxel has ≥1 air neighbour on the
camera side → not all-6-occupied). So *removing only enclosed voxels can never change a front-most ortho
surface voxel* — the geometric guarantee AC #3 ("exterior unchanged") rests on. The carve should **reuse**
one of these definitions, not fork a third (memory `parallel-roots-duplicate-shared-deps`; the codebase's
"ONE definition" ethos — cf. `airComponents` exported as the single enclosed-vs-border rule).

### The light-tier hollowable-mass detector (T-082-01) — AC #1's metered path

`hollowable-mass.mjs` is the scoped LLM exemplar: PURE prior (`hollowableCore`) + FIXED prompt
(`buildHollowablePrompt`, states footprint, per-band enclosed counts, skin-hole count, asks the light
model on a 3/4 view to confirm hollowable regions and FLAG blockers) + parser (`parseHollowable` →
`{hollowable, regions:[{yStart,yEnd,inset,note}], blockers:[]}`). `TIER="light"`, routed via
`model-tier.runTieredOp` (subscription `--model`, never the metered API key — source-guard pinned).
`SEAL_BEFORE_HOLLOW` is the handoff invariant: a non-empty `blockers` means seal first. `inset` = how many
cells in from the skin to keep as wall.

### The watertight precondition (T-084-01) — the dependency

`surface-coherence.mjs` ships `sealRoof`, `sealWalls`, `watertightCheck`, plus `overlay`, `applyDeltas`,
`roofOutlineCoverage`. `watertightCheck(occ)` floods exterior air from the padded bbox and reports
`{watertight, interiorCells, reached, breaches}` — the T-080 invariant. T-084 produced
`docs/active/work/T-084-01/cottage-sealed-artifact.json` (6438 voxels, **0 skin holes**, **1100 enclosed**)
— the watertight-roof + coherent-wall result this ticket builds on. (The unsealed cottage has 8 skin holes
→ a blocker, confirming the seal-before-hollow ordering.) Note T-084's review: the cottage `watertight` is
`false` because of *intended* doors/windows (2507 of 3625 ray-interior cells reach outside) — closing real
openings is the strong-tier `seal-authoring` job (reserved in `model-tier.OP_ROUTING`), not this ticket.
**This matters:** carving enclosed mass is exterior-safe *regardless* of watertightness; watertightness
governs whether the cavity is a *usable sealed room*, not whether the carve is safe.

### Structural read (T-078-01) — for "keep structural members"

`structural-read.mjs`: `footprint` (the (x,z) column set + bbox + width/depth), `storeyBands`, `roofRegion`
(`yRange`), `wallFields`. These give the geometric primitives to define *load-bearing structure* to
protect: corner-post columns (footprint bbox corners), full-height columns (chimney shaft / posts the skin
needs).

### Surface grid (T-078-01) — for the exterior-held proof

`surface-grid.mjs`: `projectSurface(occ, dir)` (front-most surface voxel per cell, ortho + 45°),
`ORTHO_DIRS` (the 6 ortho views), `backProject`, `gridMaskOf`. The exterior render is a function of the
front-most ortho surface voxels; equality of the 6 ortho projections before/after the carve is a PURE
proof that the render is unchanged (AC #3/#4 "exterior-held proof").

### Resemblance (E-22) — AC #3's verdict vocabulary

`face-resemblance.mjs` (`faceResemblance`, `acceptIfCloser`) and `form/resemblance.mjs` give the per-face
resemblance verdict. Since the exterior voxels are provably identical post-carve, the resemblance verdict
is identical by construction; the render-based check is a confirmation, the surface digest is the proof.

## The metered-runner pattern (the sibling to copy)

`benchmarks/sculpture/surface-coherence.mjs` (T-084) is the template: load artifact → `artifactOccupancy`
→ `structuralRead` → render same-angle views (`multi-angle.renderViews`, GL/Playwright via
`render/src/render-tool.mjs`) → run light-tier detectors (`runTieredOp` + `requestTextWithImage`) → apply
PURE ops → write report JSON + artifact + before/after PNGs to `docs/active/work/<id>/`. `package.json`
script `coherence:cottage`. `npm test` = `test:unit` over `src/**/*.test.mjs` (pure only; GL/metered runners
excluded). Source-guard tests assert the pure module imports no model / GL / `ANTHROPIC_API_KEY`.

## Constraints & assumptions

- **Pure core, impure runner.** The carve + marking + exterior-digest live in `src/view/` (PURE, under the
  test glob); the GL render + metered detector live in the benchmark runner. Same seam as every E-23 op.
- **Flatten-by-exclusion is the carve.** No air op; rebuild placements from kept explicit voxels. The
  output artifact is larger (one `voxel` per kept cell) but deterministic and re-expands identically.
- **Reuse the enclosed-mass definition** (export `enclosedMassKeys`), don't fork a third copy.
- **Carve the SEALED cottage** (T-084 output) — the watertight-shell precondition; it has 0 skin holes and
  1100 enclosed cells, a meaningful cavity.
- **Manifest stays valid:** the carve only *omits* cells and copies existing block ids; no new material is
  introduced, so the result stays AJV-valid (memory `prompt-vs-live-artifact-schema`).
