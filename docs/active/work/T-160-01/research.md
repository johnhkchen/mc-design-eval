# T-160-01 Research — parametric wall construction from recognition

*Descriptive map of the code the wall brush must fit between. No solutions here — those are Design.*

## The ticket in one line

Apply the stage's proven **replace-beats-patch** move (which climbed barn/gatehouse by *replacing* the
voxel roof with a parametric gable) to the **walls**: construct a clean wall envelope from the recognized
footprint, *replacing* the ragged voxel walls, and re-run the autonomous volume batch. Falsifiable: the
cottage climbs OR it stays flat (gate is massing, not walls) OR barn/gatehouse regress OR the recognized
footprint won't align to the build frame (alignment is then the finding).

## The climb harness (what we reuse, don't rebuild)

- `experiments/eval-alignment/roof-climb.mjs` — the scripted roof replace. Pattern the wall brush copies:
  carve cells above a band, derive a footprint `x0,x1,z0,z1` **from the occupancy** (eave-layer cells),
  call a pure generator, `occupancyFromCells([...kept, ...gen.cells])`, `rebuildArtifact`, render.
- `experiments/eval-alignment/autonomy-loop.mjs` — the agentic loop. Three tools as `occ→occ` functions:
  `apply_gable_roof`, **`seal_walls`** (the patch tool we replace), `add_timber_framing`. The agent (sonnet)
  reads the eval verdict and picks a tool; eval (`evalBuild`) renders `+x+z`, scores N=3, takes median
  quality + modal worst-defect axis. `runSubject` loops ROUNDS=3; `main` batches cottage/barn/gatehouse and
  writes `results/volume-ledger.json`.
- `experiments/eval-alignment/defect-eval.mjs` — the trusted measure. **Untouched** (AC + S-161 boundary).

### `seal_walls` today (the patch we replace) — autonomy-loop.mjs:62–97

It is a **patch**, not a construction: per-column material histogram over the wall band; morphological
**close (r=2)** on the existing column set to bridge *some* missing columns; then it **fills only air**
inside those columns (`if (!cellMap.has(k)) …`). Because it only fills within close-reachable columns, it
cannot add columns the ragged footprint never had — the cottage's "missing columns" gate. It then carves a
`% 4` window rhythm and one door. The new brush keeps the *good ideas* (per-column material, close,
rhythm) but **builds the full envelope ring from a regularized footprint** instead of patching air.

## The recognized program (the "recognition" input)

`benchmarks/sculpture/recognition/<subject>.program.json`, schema `building-program/v1`. Present for
**cottage** and **barn** only — **gatehouse has NO program** (only barn, barn--saltcrag, cottage).

Per **mass**: `rect {x0,z0,w,d}`, `storeys`, `storeyHeight`, `walls.{ground,upper,dressing}.role`,
`plinth`, `roof.{idiom,ridgeAxis,pitchClass,…}`, and `openings[]` — each `{wall:"±x/±z", kind:"door|window",
count, w, h, sill, head, headRole}`. Cottage = two masses (main 18×28, wing 8×15 — an L), 2 storeys × 4,
openings on -x/+z/-z/+x. Barn = one mass 48×24, 3 storeys × 3, 5 openings, ridge x.

### The alignment fact (measured — this is the crux)

Program rects are in a **0-based local frame** (cottage main `x0:0,w:18`; build frame is **negative**:
cottage occupancy bounds `min[-14,0,-16] max[12,26,15]`). The program L (main+wing, ~18+ wide × 28 deep)
and the build wall-band bbox (`x[-14,10] z[-15,14]` ≈ 25×30) are *similar in size* but share **no origin
and no registration**. So the recognized footprint's *absolute coordinates* do not align to the voxel
build's frame — exactly the ticket's flagged failure mode. The opening **rhythm/counts/storey structure**
are frame-independent and reusable; the absolute rect is not.

### The builds are hollow shells (measured)

Wall-band column fill: cottage **20%** (153/750), barn **22%** (278/1248), gatehouse **32%** (232/729) of
their bounding rects. These are GLB-voxelized hollow shells — occupied columns are a *ragged perimeter
ring*, interior is air. Consequence: a **solid bbox fill is wrong** (it would fill the hollow interior and
the L-notch, destroying massing). The right object is a **regularized perimeter ring**.

## The pure-brush conventions (what "unit-tested like the other brushes" means)

- Brushes live in `src/view/*.mjs`, **PURE** (no GL/I/O/Date/random), co-located `*.test.mjs` run under the
  `test:unit` glob `node --test "src/**/*.test.mjs"`. `roof-generate.mjs` is the model: exported pure
  functions, a `FAMILY`-style `{field,stairs,slab}` block family, cells as `{pos,block,form?,state?}`.
- `src/view/occupancy.mjs` — the substrate. `occupancyFromCells(cellList)` → `{bounds,dims,size,cells:Map,
  forms,states,has,block,solid,…}`. `artifactOccupancy(artifact)` expands a schema-valid artifact. Cells
  are `{pos:[x,y,z], block, form?, state?}`; `form:"fixture"` for stairs/slabs, else cube.
- `src/view/shell-integrity.mjs` `rebuildArtifact(occ, template)` → schema-valid artifact (namespaces
  blocks, rebuilds manifest, preserves states). Used to render the new occupancy.
- `src/view/multi-angle.mjs` `renderViews(artifact, dirs, opts)` — renders PNG (GL). The brush stays pure;
  rendering happens in the harness, not the brush.
- `src/view/facade-articulation.mjs` `infillPanel` and `surface-coherence.mjs` `sealWalls({fieldMaterial})`
  exist; `add_timber_framing` already uses `infillPanel`. Not on the wall-construction hot path but adjacent.

## Constraints / assumptions surfaced

- **No per-building constants** (AC) — eaveY/floor/wallField come from the subject config that already
  exists in autonomy-loop; the brush must take them as params, not hardcode per subject.
- **Minimal toolset** (the stage's lesson — more tools scored *worse*): the brush *replaces* `seal_walls`
  in the menu; it does not add a 4th tool.
- **gatehouse has no program** → the brush must degrade gracefully to a footprint/rhythm derived from the
  occupancy when no program is supplied (else the batch breaks on subject 3).
- **The eval is the witness, not the brush**: AC requires a judge-free *beside-concept* render of each final
  build and an honest per-subject climb report. `render-beside.mjs` exists for this.
- **Replace, not patch**: the brush must discard wall-band cells and rebuild, not fill air — that is the
  whole point of the ticket and the reason `seal_walls` plateaued.
