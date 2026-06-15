# T-025-01 Design — massing-bookend

Decisions, with the rejected alternatives. Grounded in `research.md`. The shape of the
code is in `structure.md`; here is *what* and *why*.

## D1 — `MassingSource` is a neutral occupancy contract, not a grid

**Decision.** A `MassingSource` is a plain object:

```
{ width:int, height:int, occupied(): Iterable<{x:int, y:int}> }
```

`width`/`height` are the build-grid bounds; `occupied()` yields the occupied cells **in
build coordinates** (already Y-flipped, see D3). That is the *entire* contract — no
block ids, no `grid` array, no `null`-means-air convention, no rows/cols. Massing and
everything downstream see only this.

**Why.** AC #4 demands "the form dependency is behind the interface (no concept-grid
specifics leak)." Occupancy is a set of filled coordinates plus bounds — the minimal
thing both an image grid and a GLB voxelizer can produce. A GLB source becomes a drop-in
by emitting the same three members; nothing in `mass()`/`proportionsOf()`/compile knows
where the cells came from.

**Rejected.**
- *Pass the `GridResult` straight into `mass()`* — leaks `grid`/`n`/`m`/`null` into the
  sculptor; a GLB source would have to fake a grid. Violates AC #4.
- *MassingSource as a class/interface with inheritance* — overkill for JS duck-typing
  and against the module's functional style (`defineStage`, pure helpers). A shape +
  factory functions is the house idiom.
- *`isOccupied(x,y)` predicate instead of `occupied()` iterable* — forces massing to scan
  the full `width×height` box (mostly air for a silhouette). Yielding only filled cells
  is sparse-friendly and matches the sparse `Map` substrate.

## D2 — `conceptGridSource(gridResult)` is the only concept-grid-aware code

**Decision.** A factory `conceptGridSource(gridResult, {flipY=true})` adapts a
`GridResult` (duck-typed `{grid, n, m}`) into a `MassingSource`. It is the **single
place** that knows `grid[gy][gx] !== null` means occupied and that rows run top-down.

**Why.** Confines every concept-grid assumption to one ~10-line adapter. It reads only
`.grid/.n/.m` and does **not import `image-grid.mjs`** — so the sculptor pulls in no
JPEG decode, no color tables, no `cielab`. The decode/image step stays in the caller (a
script does `gridFromImage(path)` then `conceptGridSource(result)`).

**Rejected.**
- *Put the adapter in `image-grid.mjs`* — would make the color module depend on /
  reference the sculptor's contract, coupling E-10 to E-11. The adapter belongs on the
  consumer (sculptor) side.
- *`conceptGridSourceFromImage(path)` that decodes internally* — pulls `jpeg-js`/decode
  into the spine and makes the module impure (I/O). Kept out; the path→grid step is the
  caller's, and tests use hand-built grids (the `image-grid.test.mjs` model).

## D3 — Flip Y so the facade stands upright (default on, switchable)

**Decision.** The adapter maps image cell `(gx, gy)` → build cell `(x=gx,
y=m-1-gy)` by default. `flipY:false` passes `y=gy` for callers whose source is already
Y-up.

**Why.** Render writes `pos[1]` as Minecraft world-Y (Y-up); the image's row 0 is the
*top* of the facade. Without the flip the silhouette renders upside down (roof at ground,
ground at sky). Flipping puts the image's bottom row at `y=0`. All coords stay
non-negative (`gy∈[0,m-1] ⇒ y∈[0,m-1]`).

**Rejected.**
- *No flip, fix it in compile/render* — would bury an orientation hack in the shared
  compile path that every later artifact (not just massing) inherits. Orientation is a
  *source* concern; the adapter is exactly where source conventions are translated.
- *Flip unconditionally* — a GLB voxelizer emits Y-up already; an always-on flip would
  invert it. Hence the `flipY` switch, defaulting to the image case we have now.

## D4 — Lock occupancy by running a massing stage through `runStages`

**Decision.** `mass(source, opts)` builds an empty state, then runs a single
`defineStage({name:"massing", run})` (whose body `draft.set(x,y,{occupied:true})` for
each `source.occupied()` cell) through **`runStages`**. The orchestrator diffs, sees only
`occupied` changed, and locks exactly `occupied` — producing a `lockLog` entry
`{stage:"massing", fields:["occupied"]}`.

**Why.** AC #3: "uses the S-024 lock enforcement." `runStages` is that enforcement.
Going through it (rather than calling `lockFields` by hand) means the proportion lock is
produced by the real accept path, the lock set is *derived* from what the stage touched
(can't over- or under-lock by typo), and the result is auditably the same mechanism every
later pass uses. Material/relief are never written, so they stay unlocked — downstream
passes can still add them.

**Rejected.**
- *`createBuildState` → `draftState` → set occupied → `commit` → `lockFields(s,
  "massing", ["occupied"])`* — works, but hand-names the locked field (drift risk) and
  bypasses the orchestrator's diff/reject guard. Less faithful to "the S-024 enforcement."
- *Lock all three fields now* — wrong: would block the material (T-027) and relief
  (T-028) passes. Only the silhouette is final at this bookend.

## D5 — Proportions are a pure projection of the locked occupancy

**Decision.** `proportionsOf(state)` derives, from `occupiedCells(state)`:
`{grid:{width,height}, bounds:{minX,minY,maxX,maxY}|null, width, height, aspect,
occupied, fill}` (filled bounding-box width/height, `aspect = w/h`, `occupied` count,
`fill = occupied/(grid area)`). `mass()` returns `{state, proportions}` so the shell
**carries** it eagerly (AC #2), and the S-026 critic can also re-derive it any time from
the locked state.

**Why.** `BuildState` is frozen with a fixed shape; adding a `meta` field would be a
spine edit (out of scope, D-research-1) and would let stored proportions drift from the
actual occupancy. Because `occupied` is *locked*, a projection can never disagree with the
shell — it's the single source of truth, computed not stored. Returning it from `mass()`
gives callers the convenience without the drift.

**Rejected.**
- *Store proportions in `BuildState`* — frozen shape + spine edit + drift. No.
- *Store on a wrapper object only (not derivable)* — the review critic (S-026) gets a
  locked state, possibly without the wrapper; a pure `proportionsOf(state)` guarantees it
  can always recompute.

## D6 — "Renders" is proven at the AJV gate; gray = one `defaultBlock`

**Decision.** `compileMassing(state, opts)` is a thin wrapper over `toDesignArtifact`
that pins `defaultBlock` to a single gray block (`minecraft:stone`, the existing compile
default) and a massing `style`. Because no cell has a `material`, every placement gets
that one block → a single-material gray artifact. Tests assert it passes the **real**
`parseArtifact`/`assertArtifact` gate.

**Why.** Per research, AJV-pass is this codebase's accepted stand-in for "render/judge/
export unchanged" (the spine's own `compile.test` does exactly this; the GL render is out
of `npm test` scope). `minecraft:stone` is gray, survival-obtainable, and already the
compile default — no new block constant needed, and "single material" is structural (one
distinct block in the manifest), not asserted by eye.

**Rejected.**
- *Set `material:"minecraft:stone"` on every cell in the massing stage* — would lock
  `material` too (orchestrator locks changed fields), blocking T-027. Leaving material
  null and letting compile's `defaultBlock` paint gray keeps `material` unlocked.
- *A bespoke gray like `gray_concrete`* — fine visually but introduces a block constant
  to justify/validate; `stone` is the established default and unambiguously gray.
- *Add a real GL render test* — heavy, async, pulls prismarine from `render/`, and breaks
  the sculptor's "pure, no-GL `npm test`" convention. Documented as out of scope.

## Surface summary (exports added to the barrel)

`conceptGridSource`, `mass`, `proportionsOf`, `compileMassing`, `MASSING_BLOCK`,
`MASSING_STYLE`. All in a new `src/sculptor/massing.mjs`; `index.mjs` re-exports them.
