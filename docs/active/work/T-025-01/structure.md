# T-025-01 Structure — massing-bookend

The blueprint: files, public interfaces, internal organization, ordering. Shapes only —
code lives in Implement. One new module + its test under `src/sculptor/`; the barrel and
README get additive edits. No spine source file (`build-state`/`orchestrator`/`compile`)
is modified.

## File manifest

| File | Status | Purpose |
|------|--------|---------|
| `src/sculptor/massing.mjs` | **new** | `MassingSource` contract, `conceptGridSource`, `mass`, `proportionsOf`, `compileMassing`, constants |
| `src/sculptor/massing.test.mjs` | **new** | Adapter, lock, proportions, gray-compile + AJV round-trip, GLB-drop-in tests |
| `src/sculptor/index.mjs` | **modified** | Re-export the massing surface (additive — the documented downstream import site) |
| `src/sculptor/README.md` | **modified** | One short "massing bookend (T-025)" subsection |

No schema change, no `package.json` change, no edit to spine modules or the color/render
modules. `massing.mjs` imports only `./build-state.mjs`, `./orchestrator.mjs`,
`./compile.mjs` — all spine leaves. It does **not** import `image-grid.mjs` (D2).

## `massing.mjs` — public interface

```
import { createBuildState, occupiedCells } from "./build-state.mjs";
import { defineStage, runStages } from "./orchestrator.mjs";
import { toDesignArtifact } from "./compile.mjs";

export const MASSING_BLOCK = "minecraft:stone";   // single gray substrate (compile default; D6)
export const MASSING_STYLE = Object.freeze({
  name: "massing",
  rationale: "Gray proportion shell — silhouette only; material and relief are later passes.",
});

/**
 * @typedef {Object} MassingSource
 * @property {number} width    build-grid width  (cells along x)
 * @property {number} height   build-grid height (cells along y)
 * @property {() => Iterable<{x:number,y:number}>} occupied  occupied cells, BUILD coords (Y-flipped)
 */

/**
 * @typedef {Object} Proportions
 * @property {{width:number,height:number}} grid      the full bounding grid
 * @property {{minX,minY,maxX,maxY}|null} bounds      occupied bounding box (null if empty)
 * @property {number} width   occupied bbox width  (maxX-minX+1, 0 if empty)
 * @property {number} height  occupied bbox height (maxY-minY+1, 0 if empty)
 * @property {number|null} aspect   width/height of the bbox, rounded (null if empty)
 * @property {number} occupied      count of occupied cells
 * @property {number} fill          occupied / (grid.width*grid.height), rounded
 */

export function conceptGridSource(gridResult, opts = {}) -> MassingSource
  // opts.flipY (default true). Reads only gridResult.{grid,n,m}.
  // width=n, height=m. occupied()*: for gy 0..m-1, gx 0..n-1, if grid[gy][gx] !== null
  //   yield { x: gx, y: flipY ? (m-1-gy) : gy }.   The ONE concept-grid-aware function.

export function mass(source, opts = {}) -> { state: BuildState, proportions: Proportions }
  // state0 = createBuildState({width:source.width, height:source.height})
  // stage  = defineStage({ name:"massing", run:(d)=>{ for (const {x,y} of source.occupied())
  //                                                     d.set(x,y,{occupied:true}); } })
  // locked = runStages(state0, [stage])           // locks exactly "occupied" (D4)
  // return { state: locked, proportions: proportionsOf(locked) }
  // opts reserved (e.g. intent passthrough) — not required this bookend.

export function proportionsOf(state) -> Proportions
  // cells = occupiedCells(state); empty -> {grid, bounds:null, width:0,height:0,aspect:null,
  //   occupied:0, fill:0}. Else min/max over x,y; w=maxX-minX+1, h=maxY-minY+1;
  //   aspect=round2(w/h); fill=round2(cells.length/(state.width*state.height)).

export function compileMassing(state, opts = {}) -> DesignArtifact
  // return toDesignArtifact(state, { defaultBlock: MASSING_BLOCK, style: MASSING_STYLE,
  //                                  ...opts });   // opts.metadata/style/palette_id override
  // No AJV here — validation is the consumer's (tests run parseArtifact). Single material
  // because no cell has a .material, so every placement gets MASSING_BLOCK.
```

Internal helper: `round2(n) = Math.round(n*100)/100` (mirrors `image-grid.mjs` rounding
habit). `occupied()` is a generator (sparse, lazy).

## Dependency direction

```
build-state.mjs ─┐
orchestrator.mjs ─┼──► massing.mjs ──► index.mjs (barrel)
compile.mjs ─────┘
                    massing.test.mjs ──► massing.mjs + ../artifact.mjs (AJV gate, test-only)
```

- `massing.mjs` sits one layer above the spine leaves, same as `compile.mjs` — it
  orchestrates them but adds no new intra-project dependency beyond the spine.
- It does **not** import `image-grid.mjs`; `conceptGridSource` duck-types `GridResult`.
- Only the test imports `../artifact.mjs` (the AJV gate), mirroring `compile.test.mjs`.

## `index.mjs` — additive re-export

Append after the existing compile re-export:

```
export {
  conceptGridSource, mass, proportionsOf, compileMassing, MASSING_BLOCK, MASSING_STYLE,
} from "./massing.mjs";
```

No existing export changes — purely additive, keeping the single downstream import site.

## `README.md` — additive subsection

A short paragraph under the pieces list: massing bookend (T-025) builds the gray shell —
`conceptGridSource` adapts a form (image grid today, GLB later) to the neutral
`MassingSource`; `mass` sets+locks `occupied` via `runStages` (the proportion lock);
`proportionsOf` derives bounds for the S-026 review critic; `compileMassing` paints one
gray block. No prose about internals beyond this.

## Test surface (what `massing.test.mjs` proves)

1. **adapter — occupancy & flip:** a hand-built `{grid,n,m}` with known nulls →
   `conceptGridSource` yields exactly the non-null cells; default `flipY` maps the top
   image row to the highest `y` and the bottom row to `y=0`; `flipY:false` passes `gy`
   through. Yields nothing for an all-null grid.
2. **adapter — no leak:** the returned source has only `{width,height,occupied}` and no
   block ids / `grid` reference (occupied items are `{x,y}` only).
3. **mass — sets occupied, leaves material/relief unset:** every yielded cell is
   `occupied:true`; `material===null`, `relief===0` on each; un-yielded cells stay air.
4. **mass — locks ONLY occupied (the proportion lock):** `isLocked(state,"occupied")` is
   true; `material`/`relief` are NOT locked; `lockLog` has one entry
   `{stage:"massing", fields:["occupied"]}`.
5. **lock enforcement (S-024):** a later stage run over `mass`'s state that tries to flip
   an occupied cell to `occupied:false` throws `LockViolationError` (write-time); a
   hand-built bypass changing occupancy is rejected with `StageRejectedError` (accept-time).
   A later stage that sets `material`/`relief` SUCCEEDS (those fields unlocked).
6. **proportions:** `proportionsOf` returns correct `bounds`, bbox `width`/`height`,
   `aspect`, `occupied` count, `fill`; empty state → `bounds:null`, zeros; `mass` returns
   the same proportions it derives.
7. **gray compile + AJV round-trip:** `compileMassing(state)` → `parseArtifact` ok and
   `assertArtifact` does not throw; **manifest is exactly one block** (`[MASSING_BLOCK]`)
   — single material; one voxel placement per occupied cell at `[x,y,0]`; `style.name ===
   "massing"`. `opts.metadata` overrides flow through.
8. **end-to-end:** `conceptGridSource(grid)` → `mass` → `compileMassing` →
   `assertArtifact` passes; placement count === filled-cell count; placement Y-values
   match the flip (top image row → max Y).

All tests pure: hand-built grids/states, `node:test` + `node:assert/strict`, no decode,
no GL. Heed the `assert.throws()` returns-`undefined` gotcha (use `(fn, /regex/)`).

## Ordering of changes

1. `massing.mjs` — contract + four functions + constants (depends only on spine).
2. `massing.test.mjs` — the eight groups above; run `node --test`.
3. `index.mjs` re-export; `README.md` subsection.
4. Full `npm test` green; commit.
