# T-099-01 opening-dressing — Design

## 0. Empirical ground (probed, not assumed)

- `openings()` detects **through-holes only** (air in the solid projection mask). On the raw cottage
  (`concept-materials/cottage/after-artifact.json`): 3 windows, each visible from `+x` AND `-x`
  (6 face-openings; y=14 1-cell, y=9 1-cell, y=6 2-cell). **No door** is detected on any face — the
  front doorway is not a through-hole. `+z`/`-z` report nothing.
- On the shipped skin (`durable-skin/cottage/artifact.json`): **zero openings** — the skin pipeline
  sealed each window pane (2 solid cells per through-column: smooth_sandstone / spruce_planks / tuff
  at the two wall planes). The windows did not survive; this is the witnessed audit case in data.
- Bounds of raw and skinned artifacts are identical ([-13,0,-16]..[12,26,15]).

## 1. Decisions

### D1 — Apertures measured on the REFERENCE build, applied to the TARGET build
The dressing op cannot find openings on the skinned cottage (there are none). The E-25 precedent is
exact: `openingRegions` are "measured on the RAW pre-seal build, whose openings the concept declared"
and reused on descendants. Same here: aperture extraction runs on a reference occupancy (raw build);
dressing applies to the target occupancy (the shipped skin). For an undressed-but-open target the two
can be the same occupancy — the op does not care.
*Rejected:* dressing the raw build (it isn't the shipping artifact; palette is pre-value-true);
re-detecting on the target (provably empty); depth-basin "window" detection on sealed walls (a new
detector, out of ticket scope — `openings` is the named contract).

### D2 — Sealed panes are RE-OPENED by replacement, not removal
There is no air op, but last-write-wins replacement IS in the contract (`expandArtifact`: block, form,
state replace together). Appending a fence placement at a sealed pane cell turns a solid cell into a
rail cell — the solid view grows a hole, `openings()` on the dressed target finds the window again,
and closure sees a dressed opening. One mechanism covers both target states: pane solid → replace;
pane air → add. This also yields the run's sharpest assertion: openings on the skinned cottage go
**0 before → 6 after**, each with `dressing.cells > 0`.

### D3 — World-space core; uv only inside aperture extraction
Shutters sit one cell proud of the facade; on a wall at the bbox face they EXPAND the occupancy
bounds, which would shift every uv frame between runs (breaks idempotency and re-projection). So:
`extractApertures(refOcc, dirs)` converts each opening to WORLD terms once (via the solid grid +
`cellWorldPos`), and `dressOpenings(targetOcc, apertures, treatments)` works purely in world
coordinates (`occ.solid(x,y,z)` probes along the depth axis) — no projection of the target at all.
Wall plane per opening = the **modal front-most-solid depth of the perimeter ring** columns probed on
the target (robust to sealed/open/mixed panes; ring cells are wall in both builds). Non-modal ring
depths are recorded (`irregular-jamb-depth`), modal proceeds.
*Rejected:* `projectSurface(target)` + uv bookkeeping (bounds-sensitive); per-column first-solid as
the plane (an overhang or interior mass could win the ray).

### D4 — Treatment slots derived from the kit, generically
`treatmentsFromKit(kitRecord)` maps kit entries with `"openings"` in `whereUsed` to slots by ground-
truth form class + name family (no subject constants):
- **infill** ← rail-class entry (fence/bars/pane). Cottage has none (the grille is honestly
  `unidentified`), so: **derive the species fence from the shutter block** (`spruce_trapdoor` →
  `spruce_fence`), validated against the committed block vocabulary, recorded as
  `{derived: true, reason: "no rail entry; species-matched to shutter; kit declared grille unidentified"}`.
  The AC mandates fence infill; this is the deterministic, non-subject-specific source.
- **shutter** ← fixture `*_trapdoor` entry. **door** ← fixture `*_door`. **light** ← `lantern` family.
- **frame** (lintel/sill block) ← cube entry with `"trim"` in `whereUsed` (cottage: spruce_planks,
  the timber framing — matches the concept's framed windows); fallback: the opening's perimeter
  modal cube block on the target.
Unfulfillable slots land in `unfulfilled` with a reason — never silently absent.
*Rejected:* hardcoding spruce_fence (subject constant, forbidden); iron_bars default (the recorded
fallback mode is color-snap, and rails have no Lab row to snap — it would be an invented preference);
skipping infill entirely (violates the AC).

### D5 — Orientation tables are fixed geometry constants
MC compass: +z=south, −z=north, +x=east, −x=west.
- **Trapdoor shutters**: placed in the cell one step OUTSIDE the wall plane at the flank columns
  (u0−1, u1+1), state `{facing: <panel against the wall>, half: "bottom", open: "true"}` — facing =
  compass direction pointing back at the wall (e.g. +x wall → shutter at x+1, facing west). All four
  open facings are render-proven on the card; the exact facing↔panel-side convention is verified once
  against the committed card renders during implementation (one-line table flip if mirrored).
- **Fence infill**: connection booleans along the opening's run axis — faces ±z run along x →
  `east/west: "true"`; faces ±x run along z → `north/south: "true"` (both proven card rows). Uniform
  for every infill cell (arms reach the jambs — the lattice read; a bare post is the rejected look).
- **Door**: leaf at the aperture's wall plane, `facing` = the wall's outward compass, `hinge: left`,
  lower at the bottom row + upper at y+1 (the card's pair semantics). Width 1 → one leaf; width 2 →
  hinge left + right pair; wider → centered single leaf with named reduction `centered-single-leaf`.
  Only facing=east is card-proven; other facings are the same mesh family (noted as evidence gap,
  cottage run has no detected door anyway — see D7).
- **Lintel/sill**: recolor-by-append of the SOLID cells at the wall plane in the rows v0−1 (spanning
  u0−1..u1+1) and v1+1, to the frame block; emitted only when the block actually changes; air cells
  skipped and counted (never add floating frame mass). Stairs are never used (lens-invisible —
  `fixture-path-proven-stairs-lens-gap`).
- **Light**: with a door + light slot, a lantern (`hanging:"false"`) in the shutter-depth cell beside
  the door's top row, preferring u1+1 then u0−1; conflicts recorded.

### D6 — Conflict honesty is the op's return shape
Per opening: `applied` (slot → placement count) and `conflicts: [{slot, name, reduction}]`. Every
treatment slot either applies or names its reduction — e.g. `shutter-no-jamb-left /
shutter-dropped`, `shutter-blocked-right / shutter-dropped`, `door-too-short / left-undressed`,
`no-wall-plane / opening-skipped`. A cell already carrying the intended fixture is `already-dressed`
(skip, counted) — the op is idempotent (second run emits zero placements; pinned in tests).

### D7 — The cottage door: honest non-detection, not a cram
No door-kind opening exists in the cottage geometry (probed; the doorway is not a through-hole, and
`openings`' silhouette definition cannot see it). The op fully supports door dressing (synthetic
unit + integration tests prove it); the cottage record states `door: none-detected` as a named
honesty row. Inventing a doorway (carving or heuristic recess detection) is form editing outside
this ticket; flagged for review as the AC gap it is, with the detector limitation named (the same
plan-view-coverage family E-25 documented).

### D8 — Integrity composition: the op DECLARES its footprint; E-25 modules unchanged
Shutters/lanterns sit outside `openingRegions` AABBs, so `strayFixtures` would flag them. Rather than
touching shell-integrity (S-091 allow-list semantics stay frozen), `dressOpenings` returns `regions`:
one world AABB per opening covering aperture + flanks + shutter depth. Consumers compose
`openingRegions(occ) ∪ result.regions`. Integration tests pin: openings identity (same bbox/kind,
`dressing.cells > 0`), `openingRegions` identity pre/post, `closureCheck` closed with
`dressed.cells` = infill count, `strayFixtures` empty under the composed allow-list.
*Rejected:* widening `openingRegions` itself (changes T-091/T-097 verdict surfaces for every caller).

### D9 — Module placement and the runner
- Pure core: `src/view/opening-dressing.mjs` (+ `.test.mjs`) — sibling of shell-integrity; imports
  `openings`/`solidOccupancy`/`orthoSpec`/`cellWorldPos`, `derivedFormClass`, `loadBlockVocab`
  (committed-JSON load is within the purity idiom), and CARD_ROWS-derived state shapes (the proven
  vocabulary; trapdoor/fence/door/lantern states match card rows by construction, asserted in tests).
- Impure runner: `benchmarks/sculpture/dress-openings.mjs`, npm **`dress:cottage`** — registry DATA
  `{target: durable-skin artifact, ref: raw build, kit: kit/cottage.json}` (durable-skin SUBJECTS
  pattern), ladder: AJV gate → integrity assertions → determinism (double-run byte-identity, sha256)
  → before/after renders → committed record `dress-openings/cottage.{json,md}` + frames. `--offline`
  re-asserts the committed record (durable-skin precedent).
- Renders: windows live on ±x, so evidence = ortho `right` + gate azimuths `+x+z` (45°) and `-x-z`
  (225°), before/after; frames `pr/assets/frames/dress-cottage-{before,after}.png` (+ strip optional).
  PNGs in the out-dir gitignored (challenge stanza precedent), frames + record committed.

## 2. Acceptance-criteria mapping

| AC | Design answer |
|---|---|
| Deterministic op, unit-tested on synthetic openings | D2/D3/D5 core, synthetic huts in `.test.mjs` |
| Conflict honesty | D6 named conflicts/reductions; D7 door honesty |
| Integrity-compatible | D8 composed regions + integration tests |
| Cottage run, every window, orientations, renders | D1 ref-measured apertures → 6 face-windows dressed; D9 runner+evidence; door gap recorded honestly |
| No subject constants; tests green | D4 generic slot derivation; registry is data; full suite |

## 3. Risks / verification hooks
- Trapdoor facing convention (D5) — verified against committed card renders before the table is final.
- Replacing panes re-opens the shell: closure must be asserted WITH regions (D8) — the runner does.
- spruce_fence must be in block-vocab (asserted in a test, not assumed).
- Manifest update on append: dressed artifact's `palette.manifest` must include the new fixture
  blocks (assertArtifact will enforce; the append helper recomputes the manifest union).
