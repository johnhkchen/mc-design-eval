# T-172-01 — Design

## The decision

Two changes, mirroring the wall track's "engine + wiring" split:

1. **Engine (pure):** add an additive, default-off `opts.covering` to `generateRoof`. In covering
   mode each sloped column fills only the **riser-sealing depth** below its surface (not the full
   wedge to the eave floor); the deep interior goes hollow. Gable-end-wall columns and sheet columns
   are unchanged. Absent `covering` ⇒ **byte-identical** legacy prism (the `gableBlock` precedent).
2. **Wiring + evidence:** drive `roof-climb.mjs` from the recognition program's `masses[]` — one
   `gableRecord` per mass (`registerRect` maps program rects → build frame), composed by
   `generateRoof(..., {covering:true, gableBlock})`. Census the roof fraction before/after, render
   beside concept, guard with `closureOf`.

## The covering rule (riser-sealing depth)

For each roof column at surface height `h`, `top = floor(h)`:

```
coverFloor =
  gableEnd                    -> floor          // the vertical triangular END WALL (envelope): full
  sheet                       -> top            // unchanged (already surface-only)
  covering && interior slope  -> clamp(minNbrTop + 1, floor, top)
  legacy (no covering)        -> floor          // the solid wedge, unchanged
```

where `minNbrTop` = the minimum `floor(height)` over the column's **present** orthogonal neighbours
(absent neighbours are the roof edge — that face opens onto the wall below, nothing to seal). Emit
`y ∈ [coverFloor, top]`.

**Why `minNbrTop + 1` is exactly the watertight depth.** A column's only exposed slope face is the
riser down to its *lowest* neighbour. That neighbour's surface sits at `minNbrTop`; the cells of THIS
column that would otherwise show daylight are `top … minNbrTop+1`. Filling to `minNbrTop+1` seals
precisely that riser and no more:
- **pitch 1** (drop 1): `minNbrTop = top−1` → `coverFloor = top` → **surface course only** (the
  classic Minecraft 1:1 stair roof — already watertight, maximal hollowing).
- **pitch 2** (drop 2): `minNbrTop = top−2` → `coverFloor = top−1` → two courses seal the steep riser
  (the `"pitch 2: full blocks carry the riser"` case stays watertight).
- **eave edge** (downhill neighbour absent; along-ridge/uphill neighbours ≥ `top`): `minNbrTop ≥ top`
  → `coverFloor = top` → single eave course resting on the wall. Correct.
- **valley / local min** (all neighbours higher): `coverFloor = top` → surface only; the higher
  neighbour's own fill seals the valley wall. Correct.

`minNbrTop ≤ top` always for a present neighbour (the lowest is downhill ≤ top, or alongside = top),
so `coverFloor ∈ [floor, top]` — the emitted range always contains at least `y = top` (never empty).

This makes the covering depth **a function of local pitch**, not a global thickness knob — no tuned
constant, matching the module's "construct, not blob" discipline.

### What stays invariant (so closure can't regress)
- **Gable-end walls** (`gableWallKeys`) still fill `floor…top` in the wall block — the vertical
  triangular envelope faces are untouched; the roof footprint's bbox-perimeter is unchanged.
- **Surface vocabulary** (stair/slab/cap, facings, shapes) is byte-identical — covering only removes
  *interior* full cells `floor … coverFloor−1` on non-end slope columns. The `capKeys`, `sheetKeys`,
  `heights`, `owner`, `bandFloor` outputs are unchanged.
- Therefore `closureOf` of the wall band (built separately) and of the roof footprint ring are
  **provably unaffected** — the hollowing removes only sub-surface *fill*, never a perimeter column.

## Alternatives considered

**A. Constant-thickness shell (e.g. 1 or 2 courses everywhere).** Rejected: 1 course see-throughs on
steep pitch (the named failure); 2 courses is a tuned knob that's still wrong for pitch > 2 and wasteful
for pitch 1. The riser-sealing rule is parameter-free and provably watertight at every pitch.

**B. Fix the prism in `compile.mjs::roofBlocks` (the recognition/realize path).** This is where the
*faithful gatehouse* (T-171) prism comes from. Rejected as the ticket's named scope: the ticket points
at `roof-generate.mjs` and `gableRecord/generateRoof`, and the ~72 % figure is the `roof-climb`
(`generateRoof`) prism. `roofBlocks` produces solid cubes because the model picked a roof field
(`dark_oak_planks`) outside the pack's stair-course family — that's a **family-resolution** problem
(name the steep/field family so stairs/slabs ride), a different fix. Wiring `generateRoof`'s covering
into the compile path additionally trips the not-yet-gableWallKeys-aware conformance gate (T-150-01
review) and would need a judge-pin rotation — out of scope. **Boundary call: this ticket kills the
`generateRoof` prism and proves multi-ridge on `roof-climb`; the `roofBlocks` prism is reported as a
remaining seam (handoff), not silently merged.** Reported honestly per the anti-hedge directive.

**C. Make covering the default (no opt).** Rejected: breaks the `"solid infill: no air inside the
wedge"` pin and six callers that depend on legacy emission. Additive/default-off is the proven and
required posture.

**D. Multi-ridge inside `provision-generate` only (it already iterates per-mass roofs).** That path is
already multi-ridge-capable but is **not** the build the referee scores; the ticket's AC #2 ("the
cottage's two perpendicular gables render correctly; barn's prism is gone. Renders beside concept")
is about the `roof-climb`/`new-roof` build. I add `covering` to `provision-generate`'s call too (one
line, default behaviour preserved since it already passes `gableBlock`), but the *demonstration* is
through `roof-climb` driven by `masses[]`.

## Multi-ridge wiring (`roof-climb.mjs`)

- Load `recognition/{subject}.program.json` if present → `masses[]`.
- `registerRect(masses, eaveCols)` (eaveCols = the carved wall-band columns at `y===eaveY`) → a
  `transform`. Map each mass rect's corners → build-frame `(x0,x1,z0,z1)`.
- Per mass: `ridgeY = eaveY + floor(perpHalfSpan)`, `pitch = 1` (the climb's isolate-FORM default;
  program `pitchClass` if present), `ridgeAxis` from the program. One `gableRecord` each.
- `generateRoof(gables, FAMILY, {covering:true, gableBlock})` — composition gives the cottage its
  valley between the two perpendicular gables; barn gets its single gable, now hollow.
- **Fallback** (no program): the existing single-bbox gable, but now `covering:true`. Still kills the
  prism; logs that multi-ridge was unavailable (honest).
- Output to a **new** dir `builds/{subject}/roof-covering/` (do NOT clobber committed `new-roof`).
- **Census**: print roof-field fraction old vs new; assert it falls well under 72 %.
- **Guard**: `closureOf` of the kept wall-band ring, reported (must not drop vs the carve input).
- **Scoring**: gate the metered baseline-vs-new model call behind `--score` (default off). THIS
  ticket's witnesses are the render + census; the crater is T-173-01. Avoids burning budget twice.

## Falsifiability (how this fails, lead with it)

- *Steep narrow roof reopens a coverage/closure seam.* Guarded: the riser-seal rule is watertight by
  construction; `closureOf` reported; a unit test asserts no daylight column on a pitch-2 gable.
- *Per-mass ridges don't register to the build frame.* `registerRect` returns `ambiguous`; if so, log
  and fall back to single-bbox covering (named, not forced).
- *Roof reads right but the score doesn't move.* That's T-173-01's crater; here I report the census +
  render and explicitly do not claim a score delta.
