# T-172-01 — Research: roof-as-construction and multi-ridge

Epic **E-42** / Story **S-172**. Replace the solid roof-prism with a constructed covering; give
multi-mass subjects one gable per `masses[]`. Anchor (ticket): `roof-generate.mjs` —
`gableRecord` / `generateRoof` / `closureOf`. Descriptive map of the terrain; no solutions here.

## The prism, measured

Censusing the committed `new-roof` builds (the parametric-gable builds the referee scores, produced
by `experiments/eval-alignment/roof-climb.mjs`):

| subject  | total cells | roof field (`spruce_planks`) | + `spruce_stairs` | roof ≈ |
|----------|-------------|------------------------------|-------------------|--------|
| cottage  | 6 559       | 67.7 %                       | 10.1 %            | ~78 %  |
| barn     | 11 758      | 64.5 %                       | 9.8 %             | ~74 %  |
| gatehouse| 8 692       | 52.8 % (`spruce_planks`)     | 8.1 %             | ~61 %* |

\* the *faithful* gatehouse (`recognition/gatehouse.artifact.json`, T-171) is a 53 % `dark_oak_planks`
prism via a **different** path (`compile.mjs::roofBlocks`, not `generateRoof`). The ticket text and
the ~72 % figure name the **`generateRoof` solid prism** (cottage/barn `new-roof`). This is the prism
to kill here; the `roofBlocks` path is noted but out of this ticket's named scope (T-171 review §"open
concerns" attributes its prism to S-172 generally — see Design for the boundary call).

## The generator (`src/view/roof-generate.mjs`)

`generateRoof(gables, family, opts)` is the E-27 parametric gable engine. PURE (no IO/GL/Date/random;
runs under the `src/**/*.test.mjs` glob). Key shape:

- **`gableRecord({footprint, ridgeAxis, eaveY, ridgeY, pitch, hip})`** — the 2-sided program gable
  record `generateRoof` consumes. One per gable.
- **`roofHeightfield(gables)`** — per-column MAX over each gable's `gableSurfaceHeight`; valleys at
  intersections fall out naturally. Returns `heights` (Map `"x,z"→h`), `owner` (per column:
  `{gableId, downhill, sheet, cap, cornerEligible, gableEnd}`), `bandFloor` (min eaveY floor).
- **`gableEndColumns(g)`** — the outermost slice along the ridge axis (vertical triangular **end
  walls**); empty for hip ends. The envelope's gable walls.
- **`generateRoof`** — the cell emitter. **The prism lives here** (lines ~304):
  ```js
  for (let y = own?.sheet ? top : floor; y <= top; y++) { ... }
  ```
  Every non-sheet column fills **solid from `floor` (the eave band) up to `top` (its surface)** — the
  full triangular wedge. Sheet columns (fitted verge/eave overhangs) already place the **surface
  course only** (open underside). The surface cell at `y===top` is a STAIR (whole-step edge), a SLAB
  (`top+1`, half-step), or a full block; `capKeys` mark the ridge course.

### Existing additive seams (precedent for the change)
- **`opts.gableBlock` (T-150-01, "envelope-then-covering")** — the *sub-surface* fill of each
  `gableEndColumns` cell is authored in the WALL block and returned in `gableWallKeys` (so the zone map
  classifies it as wall, not roof). The sloped covering stays roof. **Absent ⇒ byte-identical legacy
  emission.** This is the proven pattern for an additive, default-off behavior change.
- **Sheet columns** already demonstrate a *surface-only* (hollow-underside) emission with `sheetKeys`
  for census exclusion ("open underside exposes ≥4 faces BY DESIGN").
- **Multi-gable composition already works**: `roofHeightfield` takes an array; tests prove the
  cottage-style cross-gable valley (`"two intersecting gables: max-height composition"`) and
  `"a solid winner overrides a sheet loser at shared columns"`.

### Tests (`roof-generate.test.mjs`, 29 cases, all pinned byte-exact)
Pitch 1 / 0.5 / 2 surface vocabulary; **`"solid infill: no air inside the wedge"`** (this pin asserts
the prism — covering mode must NOT break it, i.e. covering must be opt-in); footprint containment;
two-gable valley; hip ends; ridge caps; corner/hip shapes; ridge-closure realization; and three
**byte-identity** pins (`no ends`, `gableBlock byte-identity`, `absent gableBlock ⇒ legacy`).

## The callers

- **`experiments/eval-alignment/roof-climb.mjs`** — THE referee build path ("new-roof"). Carves the
  blob roof above `eaveY` from `builds/{subject}/final-artifact.json`, computes a **single** footprint
  bbox `(x0,x1,z0,z1)`, builds **one** `gableRecord` over the whole bbox (`ridgeAxis` from a hardcoded
  `SUBJECTS` map), `generateRoof([gable], FAMILY)` **solid, no gableBlock** → the full prism. Renders 4
  views + live-scores baseline vs new. Single ridge; no `masses[]`.
- **`src/form/provision-generate.mjs`** — the generate-first chain. Already iterates `fit.roofs` (one
  per mass group via `componentGableGroups`) and calls `generateRoof(roof.gables, family, {gableBlock})`
  — already *multi-ridge-capable*, already passes `gableBlock`. Still **solid** (no covering opt).
- `src/pack/idiom-registry.mjs`, `src/view/roof-steep.mjs`, `src/view/roof-swap.mjs`, and four
  `experiments/eval-alignment/*-beside.mjs` also call `generateRoof` — all rely on byte-identical
  legacy emission (no covering opt). **The change must default off** or these regress.

## Multi-ridge inputs (the `masses[]` source)

Recognition programs exist at `benchmarks/sculpture/recognition/{subject}.program.json`:
- **cottage**: TWO perpendicular masses — `main` (rect 18×28, `ridgeAxis:z`) + `wing` (8×15 at x0=18,
  `ridgeAxis:x`). Exactly the "two perpendicular gables."
- **barn**: ONE mass (48×24, `ridgeAxis:x`).
- **gatehouse**: present (T-171).

Program `rect`s are in **sketch units** (0-based, do not match build voxel scale).
**`registerRect(masses, cols, opts)`** (in `wall-generate.mjs`) fits the program bbox to the build's
wall-band column extent via a per-axis affine, returns a `transform(px,pz)→{x,z}`, `ring`, `coverage`,
`axis`, `scale`, and an `ambiguous` report flag. This is the existing program→build-frame bridge the
wall track (T-160-04) already uses.

## The no-regress guard

**`closureOf(ring)`** (`wall-generate.mjs`) — fraction of a ring's bbox-perimeter that the ring
occupies; a watertight rect = 1, a colonnade < 1. It is the wall track's discriminator. The walls are
built **separately** from the roof (`provision-generate` step 2 builds masses → hollow perimeter
slabs; `roof-climb` keeps wall cells verbatim). So hollowing the roof interior cannot move the
wall-band plan perimeter — the closure guard should hold structurally; the ticket asks us to *prove* it
(report any reopened roof-fit seam honestly).

## Constraints & assumptions

- PURE-module discipline + the 29 pinned tests ⇒ the engine change MUST be additive and default-off
  (the `gableBlock` precedent).
- "frozen instrument untouched" — nothing under `measurements/`; experiment harnesses (`roof-climb`)
  carry no unit tests by project posture (verified by running).
- GL is **available** (`render/src/render.mjs` `GL_AVAILABLE=true`) → renders can be produced.
- Live scoring is metered + nondeterministic → the **render** + the offline **census** are the
  primary witnesses for THIS ticket; the matched≫wrong-style **crater** is T-173-01.
- Roof watertightness on STEEP pitch is the named failure mode: a thin (surface-only) covering
  see-throughs where the per-column riser exceeds one block. Covering depth must seal the riser.
