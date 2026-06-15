# T-160-04 Research — footprint registration from the absolute program rect

Descriptive map of the code, the frames, and the constraints. No solutions here.

## What the ticket is about (the finding, restated)

T-160-01 shipped `construct_walls` (Option B): derive the wall footprint from the **build occupancy**,
morphologically close it, take the perimeter, solidify floor→eave. That climbs on a **dense** shell
(gatehouse 32%-filled, square → +20, clean stone ring) but **fails on a sparse** shell. The barn shell is
**20–22% column-filled** and ragged, and `closeColumns` **provably cannot bridge a straight-run absent
column** (a whole missing edge segment): dilate-then-erode shadow a flat-boundary gap (asserted as a limit
in WG1, `wall-generate.test.mjs:21-46`). So the barn stays a *colonnade of posts* under its roof (+1,
see-through). The only clean rectangle that can close those straight runs is the recognized program's
`masses[].rect` — but it lives in an **unregistered frame**. This ticket scopes that registration.

## The two frames (the crux)

- **Program frame** (`benchmarks/sculpture/recognition/<subject>.program.json`): `masses[].rect =
  {x0, z0, w, d}`, **0-based**, in the recognition *sketch's* units. Barn: one mass `{0,0,48,24}`. Cottage:
  two masses — `main {0,0,18,28}` + `wing {18,7,8,15}` (an L; relative offsets are meaningful within this
  shared 0-based frame). No anchor relating it to the build.
- **Build frame** (the occupancy): the artifact's own integer voxel space, **centred near origin →
  negative coords** (`occupancy.mjs` header). `eaveY` is supplied per-subject by the loop's `CFG`, NOT by
  the program (barn build `eaveY=12`, program says `storeys 3 × storeyHeight 3 = 9` — already a **scale
  mismatch in height**, so program *units ≠ build voxel units*; the rect's `w,d` will likewise not match
  the build extent in absolute voxels). This is the central constraint: registration must recover a
  **translation + axis assignment + (likely) scale**, not assume rigid identity.

## `src/view/wall-generate.mjs` (the brush this extends) — current shape

- `closeColumns(cols, r=2)` — dilate∘erode (Manhattan ball). Fills enclosed holes + small concavities;
  **cannot** bridge straight-run flat-boundary gaps (the documented limit).
- `perimeterColumns(F)` — every column with ≥1 four-neighbour outside `F`.
- `spaceOpenings(lo, hi, count)` — evenly-spaced interior positions, corner-safe, min-gap, clamps overflow.
- `bboxOf(cols)` — private; `{x0,x1,z0,z1}` of a `"x,z"` set.
- `constructWalls(occ, params)` — THE BRUSH. (1) wall-band column histogram floor→eave (local zoning +
  global modal fill); (2) `F = cols ∪ closeColumns(cols)`, `ring = perimeterColumns(F)`, `bbox = bboxOf(F)`;
  (3) REPLACE — delete every band cell in a ring column, re-solidify floor→eave in its local-modal block;
  (4) carve opening rhythm from `program.masses[].openings` (frame-independent counts) or a derived
  fallback; (5) rebuild occupancy preserving forms/states above the eave. **Absolute `rect.x0/z0/w/d` are
  intentionally NOT consumed** today (header lines 11-16 call absolute registration the named follow-up —
  this ticket).

Params already in hand: `floor`, `eaveY`, `program`, `wallField`, `closeR`, `windowPeriod`, `doorWall`.
The brush is **PURE** (no GL/IO/Date/random) and runs under `src/**/*.test.mjs`.

## `wall-generate.test.mjs` (WG1–WG8, 11 tests)

WG1 close (enclosed-hole + idempotence + **documented straight-gap limit**), WG1b L-notch survives, WG2
perimeter, WG2b single column, WG3/WG3b spacing+clamp, WG4 vertical-hole solidify + roof-untouched, WG5
program openings, WG6 derived fallback, WG7 determinism/footprint-agnostic, WG8 L-massing preserved.
`ringOcc(...)` helper builds synthetic perimeter-ring occupancies with a `drop` list — **the exact fixture
for a straight-run-gap companion test** (AC #1).

## The occupancy contract (`src/view/occupancy.mjs`)

`occupancyFromCells(cellList)` → `{bounds:{min,max}|null, dims, size, cells:Map, forms, states, has,
block, formOf, solid}`. Coordinates stay in the build's own space. `constructWalls` reads `occ.cells`
(the `"x,y,z"→block` map) and `occ.bounds.min[1]` for the default floor. Registration will read the same
wall-band column set the brush already computes.

## The loop wiring (`experiments/eval-alignment/autonomy-loop.mjs`)

- `construct_walls(occ)` (lines 85-93): `loadProgram` from disk → `loadPack` → derive `wallField` from the
  pack's ground role via `roleBlock` → `constructWalls(occ, {floor, eaveY, program, wallField})` → then
  **`wallSkin(...)`** (T-160-02's construction skin: per-storey material, quoins, courses, dressed
  openings). The program is **already passed into `constructWalls`** — so a registered path added *inside*
  the brush needs **little or no new loop code** (AC #3: "still minimal — finer geometry, not a new tool").
- `SUBJECTS`: cottage (`eaveY 13`), barn (`eaveY 12`), gatehouse (`eaveY 18`, **no program** → derived
  fallback path), barn--saltcrag (`eaveY 9`, witness for materials). Batch loops these.
- `evalBuild` renders one `+x+z` view, scores N=3 (median quality + modal worst-defect axis) via opus
  defect-dominated eval. `defect-eval.mjs` is the **trusted, untouched** measure (AC #5; S-161 boundary).

## Witness render (`experiments/eval-alignment/walls-beside.mjs`)

Judge-free trajectory replay → `renderBesideConcept`. Loads `volume-ledger`/`autonomy-<subject>.json`
picks if present, else falls back to the constructed end-state. **This is the picture the AC requires** to
tell a closed wall from a colonnade (eval score alone can't at coarse resolution). Reuse it for the barn
witness (it imports `constructWalls`, so it inherits the registered path automatically).

## Prior, related lessons (memory)

- **glb-end-fit anchor window**: apply sanity/percentile bounds as the *selection window* before
  clustering; aabb extremes overshoot ~half a cell → the precedent for the **robust/percentile extent**
  sub-fix the claim names (failure mode a: outlier-polluted extent).
- **wall-construct needs a dense shell** (T-160-01 measured): close can't bridge straight gaps on
  sparse/20–22% shells; cottage REGRESSED −7 (monotone→palette cap), barn stayed colonnade, gatehouse +20.
- **cottage gate = volume gate, one fix**: construct from the program's `masses[]`, not a hardcoded map —
  the general transform unlocks per-mass building (cottage, T-160-03 roof, absolute-coord openings).
- **recognize.mjs self-grep discipline**: no per-building constants / subject keys in the brush.

## Constraints / assumptions surfaced

1. Program `w,d` are **not** in build voxel units → a rigid (translation+axis) fit is insufficient; scale
   is likely required ("scale only if the data demands it" — the data demands it here).
2. The only build-frame signal is the **occupancy**; translation/scale must be read from it, not the
   program. The program supplies **shape (aspect) + axis disambiguation + multi-mass relative layout**.
3. The eave-band **extent** is the robust shared feature (outermost posts persist even when interior
   columns are missing) — but raw min/max is **outlier-prone** (a stray post overshoots). Robust extent
   needed.
4. Near-square footprints make the **axis assignment genuinely ambiguous** (cottage main 18×28 is less
   ambiguous than a square; the barn 48×24 is strongly oriented) — failure mode (b) is real and must be
   *reported*, not forced.
5. `defect-eval.mjs` untouched; `npm test` (`node --test src/**/*.test.mjs`, baseline 2172/2172 green)
   must stay green; brush stays PURE.
