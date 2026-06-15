# T-160-01 Design — parametric wall construction from recognition

*Options, tradeoffs, decision. Grounded in Research.*

## The decision in one line

Build a new **pure brush `constructWalls(occ, params)`** in `src/view/wall-generate.mjs` that **regularizes
the occupancy's wall-band footprint into a clean perimeter ring**, solidifies that ring floor→eave in the
existing per-column material, then cuts a **regular opening rhythm (windows + door) parameterized by the
recognized program** (counts/storeys), falling back to a derived rhythm when no program is supplied. It
**replaces** `seal_walls` in `autonomy-loop.mjs`. Footprint *geometry* comes from the occupancy (aligned by
construction); recognition supplies the opening *rhythm/storey* parameters (frame-independent).

## The crux: where does the footprint come from?

Research established the hard fact: the recognized program's rect is in a **0-based local frame** with no
registration to the build's **negative-coord** frame. Two ways to get a footprint:

### Option A — Footprint from the recognized program's absolute rect (literal "from recognition")
Translate/rotate the program rects onto the build and build walls at those coordinates.
- **Pro:** maximally faithful to the philosophy ("build from recognition, not the mesh"); a truly clean
  rectangle, missing columns impossible.
- **Con:** requires solving **footprint registration** (program 0-based L ↔ build negative-coord ragged
  ring) with no shared anchor — the ticket flags this as a *separate* sub-problem/finding. Getting it wrong
  puts walls in the wrong place and regresses everything. High risk, and the alignment work is itself a
  ticket-sized problem (the ticket says so: "footprint-alignment is the real sub-problem, and that is the
  finding"). Picking A *as the build path* gambles the whole climb on unscoped registration.

### Option B — Footprint from the occupancy wall-band, regularized; rhythm from recognition (CHOSEN)
Derive the footprint columns from the occupancy (already in the build frame), **morphologically close** them
to repair the ragged ring, take the **perimeter** of that regularized set, and build the wall envelope
there. Use the recognized program only for the **opening rhythm and storey heights** (frame-independent
counts), with a derived fallback.
- **Pro:** aligned **by construction** — no registration gamble. Still "from recognition" for the part
  recognition is reliable at (how many openings, what storey rhythm). Repairs missing columns (close fills
  notches; perimeter-of-closed adds the absent ring cells `seal_walls` can't). Preserves L massing
  (perimeter, not solid bbox). Lowest-risk path to the *actual* AC: cottage climbs or it doesn't, cleanly.
- **Con:** if the ragged ring is *so* damaged that close+perimeter can't recover the intended rectangle, the
  envelope is still imperfect — but that under-recovery is itself the honest finding the ticket wants, and
  it localizes the gate (then A's registration is the follow-up). Does not use the program's absolute coords.

### Option C — Solid bounding-box fill (the naive "envelope")
Fill the entire wall-band bbox solid floor→eave, then carve openings.
- **Rejected:** Research measured 20–32% fill — these are hollow shells with L/cross-wing massing. A solid
  bbox fills the hollow interior and the L-notch, **destroying** massing and almost certainly regressing
  barn (long thin hall → solid block) and the cottage L. Wrong object.

### Option D — Keep patching (status quo `seal_walls`)
- **Rejected by the stage finding:** patching plateaued; the ticket exists *because* patch can't add the
  missing columns. Not a candidate.

**Chosen: B.** It is the strongest *low-risk* realization of replace-beats-patch, sidesteps the unscoped
registration gamble, and is honest about it: recognition drives the rhythm (reliable), the occupancy drives
the geometry (aligned). If the cottage still doesn't climb under B, the finding *is* "footprint-absolute
alignment (Option A) is the real gate," which is exactly the ticket's named alternative outcome — reported,
not hidden.

## The brush algorithm (Option B, detailed)

`constructWalls(occ, { floor, eaveY, program?, wallField?, closeR=2, windowPeriod=4 })`:

1. **Wall-band band** = cells with `floor ≤ y ≤ eaveY`. Project to a column set `raw` (`"x,z"`), and build a
   **per-column material histogram** (local zoning) + a global modal fill (reuse the `seal_walls` idea).
2. **Regularize footprint:** `F = raw ∪ erode(dilate(raw, closeR), closeR)` (morphological close) — repairs
   ragged notches and the missing-column gaps, preserves the overall L/rect shape (close is shape-preserving
   at r=2; it does not fill the L-notch which is larger than the SE).
3. **Perimeter ring** `P` = columns of `F` with at least one **4-neighbour not in `F`** (the envelope wall;
   interior columns are not walls). This is the clean wall line.
4. **Solidify** each `P` column **floor→eave** in that column's local fill (fall back to global, then
   `wallField`). This *adds the missing ring cells* — the replace move.
5. **Keep** all cells **above eave** (roof) and any **interior** wall-band cells (chimney, cross walls,
   floors) verbatim — replace the *envelope*, not the whole build.
6. **Opening rhythm** cut from the solid ring:
   - **Door:** one, on the front face (`+z` by default; or the program's door `wall`), centre column,
     `floor..floor+2` (1×3).
   - **Windows:** from the program — for each window-opening group, place `count` windows spaced evenly
     along its `wall`, `w × h` at `sill` (program-relative → band-relative `floor+sill`). **No program** →
     derived rhythm: a 1×2 window every `windowPeriod` columns at upper-mid height (the `seal_walls`
     fallback, kept). Carving = delete ring cells (air), bounded to ring columns only.
7. Return `occupancyFromCells([...kept, ...ringCells_with_openings])`.

**Purity:** identical discipline to `roof-generate` — no GL/I/O/Date/random, deterministic; cells are
`{pos,block}` (cube). Rendering stays in the harness.

**No per-building constants:** `floor`/`eaveY`/`wallField`/`program` are params; the subject map in
`autonomy-loop.mjs` already carries `eaveY` and `wallField`. `program` is loaded by the harness from
`recognition/<subject>.program.json` when present (cottage, barn) and omitted otherwise (gatehouse → derived
rhythm). The brush itself holds zero subject knowledge.

## Wiring (AC #2)

Replace `seal_walls` with `construct_walls` in `autonomy-loop.mjs`: the `TOOLS` map, the `MENU` line
("rebuild the wall envelope from the footprint — best when the worst defect is STRUCTURAL INTEGRITY / wall
holes / missing walls"), and the `seal_walls` function body (now a thin adapter calling `constructWalls`
with the subject's params + loaded program). **Toolset stays size-3** (gable / walls / timber) — no 4th tool
(the minimal-toolset lesson). `roof-climb.mjs` is left untouched (it is the scripted-roof witness).

## Risks & how each shows up as an honest finding

- **Cottage flat anyway** → gate is massing/proportion or absolute alignment (Option A), not envelope
  watertightness. Report + localize; A becomes the follow-up. (Ticket's named alternative.)
- **Barn/gatehouse regress** → the constructed ring is worse than their voxel walls (e.g. over-closed the
  thin barn). Report; tune `closeR`/perimeter rule or restrict to cottage. Falsifies the "won't regress" leg.
- **Footprint under-recovers** (ragged ring too broken for close+perimeter) → the envelope is still holey;
  that is the alignment finding surfacing through B. Report with the render.

The render beside the concept is the witness for every one of these — the score alone does not close the AC.
