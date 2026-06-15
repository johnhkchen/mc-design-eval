# T-160-01 Structure — file-level blueprint

*The shape of the code. Not the code.*

## Files

### CREATE `src/view/wall-generate.mjs` (the pure brush)

Header comment in the `roof-generate.mjs` register: what it constructs, why replace-not-patch, PURE
declaration. Exports:

```
// PURE — no GL/I/O/Date/random; runs under src/**/*.test.mjs.

/** Morphological close of a "x,z" column set (dilate then erode, Chebyshev/Manhattan r). */
export function closeColumns(cols: Set<string>, r=2): Set<string>

/** Perimeter ring: columns of F with ≥1 four-neighbour outside F. */
export function perimeterColumns(F: Set<string>): Set<string>

/** Even integer positions of `count` openings along [lo,hi] (inclusive), centred, ≥1 gap. */
export function spaceOpenings(lo: number, hi: number, count: number): number[]

/** THE BRUSH. occ -> occ. Replaces the wall envelope; keeps roof + interior verbatim. */
export function constructWalls(occ, {
  floor,            // band bottom (default occ.bounds.min[1])
  eaveY,            // band top (required)
  program = null,   // building-program/v1 object, or null -> derived rhythm
  wallField = "stone_bricks",  // last-resort fill
  closeR = 2,
  windowPeriod = 4, // derived-rhythm spacing when no program
}): Occupancy
```

Internal helpers (not exported): `wallBandHistogram(occ, floor, eave)` → `{cols, colFill(c), globalFill}`;
`bboxOf(cols)` → `{x0,x1,z0,z1}`; `faceColumns(P, bbox, wall)` → ordered columns on a given `±x/±z` face;
`carveOpening(cellMap, cols, x, z, y0, y1)`.

**Data flow inside `constructWalls`:**
1. `floor ??= occ.bounds.min[1]`. Histogram the band → `cols`, `colFill`, `globalFill`.
2. `F = cols ∪ closeColumns(cols, closeR)`; `P = perimeterColumns(F)`; `bbox = bboxOf(F)`.
3. `cellMap = new Map(occ.cells)`. **Drop** every band cell whose column ∈ `P` (replace the ring). Keep
   above-eave and interior-column cells.
4. For each `c ∈ P`: fill `floor..eave` with `colFill(c) ?? globalFill ?? minecraft:wallField`.
5. Openings: if `program` → for each mass's `openings`, resolve `wall`→face columns, `spaceOpenings` over the
   face span, carve `w×h` at `floor+sill`; door group carved `floor..floor+h`. Else derived: 1×2 window every
   `windowPeriod` on all four faces + one 1×3 door at `+z` centre.
6. Rebuild via `occupancyFromCells([...cellMap entries as {pos,block,state?}])`. Preserve `state` for kept
   fixture cells (`occ.states.get(k)`), like `seal_walls` does.

**Program coordinate handling (the honest seam):** the program rect is 0-based; we do **not** use its
absolute `x0/z0`. We use only **frame-independent** fields: `openings[].{wall,kind,count,w,h,sill}` and
`storeyHeight`. Faces map to the occupancy bbox edges (`+z` → `z=z1`, etc.). `sill`/`h` are band-relative
(`y = floor + sill`). Multiple masses contribute their openings to the shared envelope faces (cottage's
main+wing both feed `±x/±z`). This is documented inline as the deliberate "rhythm-from-recognition,
geometry-from-occupancy" choice from Design.

### CREATE `src/view/wall-generate.test.mjs` (unit tests, pure)

Mirrors `roof-generate.test.mjs` structure. Synthetic occupancies built via `occupancyFromCells`. Groups:

- **WG1 closeColumns** — a ragged ring with a 1-wide notch closes; a genuine large gap (L-notch ≥ 2*r+1)
  stays open. Idempotent-ish: closing a full rect is the rect.
- **WG2 perimeterColumns** — a solid rect → its border ring (no interior); a single column → itself; a
  hollow ring → itself.
- **WG3 spaceOpenings** — `count=1` → centre; `count=2` over a 10-span → two evenly-spaced, ≥1 gap, in
  range; `count=0` → `[]`; over-packed count clamps without overlap.
- **WG4 constructWalls envelope** — a holey ring occupancy (missing columns) → after the brush, **every
  perimeter column is solid floor→eave** (the missing-column repair, the core claim) and **roof cells above
  eave are untouched** (kept verbatim, byte-equal block ids).
- **WG5 openings from program** — a program with 2 windows on `-x` + 1 door on `+z` → exactly those
  apertures present (air) on those faces at the right band-relative heights; non-opening faces solid.
- **WG6 no-program fallback** — `program:null` → derived rhythm carves windows every `windowPeriod` + one
  door; deterministic.
- **WG7 purity/determinism** — two calls on the same input produce identical occupancies (cells equal); no
  per-building constant leaks (same brush params on two different synthetic footprints both produce a clean
  ring).
- **WG8 massing preserved** — an L-shaped footprint keeps its notch (the notch columns are NOT filled);
  guards against the rejected solid-bbox behaviour.

### MODIFY `experiments/eval-alignment/autonomy-loop.mjs`

- **Import:** add `import { constructWalls } from "../../src/view/wall-generate.mjs";` (drop the now-unused
  `sealWalls` import from `surface-coherence.mjs` if nothing else uses it — verify first).
- **Program loader:** small helper `loadProgram(subject)` → parse `benchmarks/sculpture/recognition/
  <subject>.program.json` if it exists, else `null`. (gatehouse → null.)
- **Replace `seal_walls`:** rename the menu key to `construct_walls`; body becomes a thin adapter:
  `function construct_walls(occ) { return constructWalls(occ, { floor: occ.bounds.min[1], eaveY: CFG.eaveY,
  program: loadProgram(SUBJECT), wallField: CFG.wallField }); }`. Remove the old patch body.
- **`TOOLS` map + `MENU`:** swap `seal_walls` → `construct_walls`; update the menu description to "rebuild
  the wall envelope (replace, not patch) from the footprint — best when the worst defect is STRUCTURAL
  INTEGRITY / wall holes / **missing walls**." Update `agentPick`'s JSON enum line. Toolset stays size-3.
- **Nothing else changes** — `evalBuild`, `runSubject`, batch `main`, ROUNDS, N=3 vote all stay.

### USE (no modify) `benchmarks/sculpture/render-beside.mjs` — for the AC beside-concept witness renders,
run from the harness/CLI after the batch, judge-free. `npm run render:beside -- --subject <key>` per
`render-beside` memory. (If its subject map lacks an entry, render beside via `renderViews` + manual
composite in a tiny throwaway script under the work dir — not committed to `src`.)

### CREATE `experiments/eval-alignment/results/*` (regenerated artifacts, not hand-written)
`autonomy-<subject>.json`, `volume-ledger.json` regenerate when the batch runs. Renders land under
`builds/<subject>/autonomy/…` and a beside composite in the work dir.

## Ordering of changes (matters)

1. `wall-generate.mjs` + `wall-generate.test.mjs` (brush first, proven in isolation — `npm run test:unit`
   green before any wiring).
2. Wire into `autonomy-loop.mjs` (compile-check by running one subject).
3. Run the volume batch; capture trajectory + beside renders.
4. Review: read renders by eye, write the honest per-subject climb.

## Module boundaries / invariants

- The brush is **pure and subject-agnostic** — all subject facts arrive as params. (AC: no per-building
  constants.)
- `defect-eval.mjs` is **not touched** (AC + S-161 boundary).
- `roof-climb.mjs` is **not touched** (scripted witness; the agentic path is `autonomy-loop.mjs`).
- The brush **never imports** GL/render modules (keeps the `src/**` pure-test glob green).
- Replace semantics: band cells in perimeter columns are dropped then rebuilt; above-eave and interior cells
  pass through unchanged (the no-regress guard for the roof gains).
