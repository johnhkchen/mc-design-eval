// Staged-sculptor massing bookend — the gray proportion shell (T-025-01, epic E-11 / story S-025).
//
// Bookend 1 of the staged build: turn a FORM (the E-10 image→block grid today, a GLB voxelizer
// later) into the first build state — `occupied` set per cell, `material`/`relief` left unset — and
// LOCK the occupancy (the proportion lock) so no later craft pass alters the silhouette. The result
// is a clean gray substrate the material (T-027) and relief (T-028) passes build on.
//
// THE FORM DEPENDENCY IS BEHIND `MassingSource` (AC #4). A `MassingSource` is a neutral occupancy
// contract — `{width, height, occupied()}` in BUILD coordinates — that carries NO block ids, no grid
// array, no "null means air" convention. `conceptGridSource` is the ONE concept-grid-aware function:
// it adapts a `GridResult` (duck-typed `{grid, n, m}`) into that contract, and is the single place
// the grid's specifics (top-down rows, `null` air) live. A GLB source is a drop-in: emit the same
// three members. This module therefore does NOT import image-grid.mjs — no JPEG decode, no color
// math leaks into the sculptor.
//
// THE PROPORTION LOCK USES THE S-024 ENFORCEMENT: `mass` runs a single "massing" stage through
// `runStages`, which locks exactly the field the stage touched (`occupied`) on accept. Material and
// relief stay UNLOCKED — the later passes still need to write them. Proportions are a pure projection
// of the locked occupancy (`proportionsOf`), so the review critic (S-026) can always re-derive bounds
// from the locked state without storing drift-prone duplicate metadata.
//
// BOUNDARIES: imports only the spine (build-state, orchestrator, compile). No image-grid, no SDK, no
// I/O, no schema. The AJV gate (src/artifact.mjs) validates the compiled gray artifact in tests.

import { createBuildState, occupiedCells } from "./build-state.mjs";
import { defineStage, runStages } from "./orchestrator.mjs";
import { toDesignArtifact } from "./compile.mjs";

/** The single gray block the shell compiles to (the compile default; survival-obtainable, gray). */
export const MASSING_BLOCK = "minecraft:stone";

/** The style stamped on a compiled massing shell. */
export const MASSING_STYLE = Object.freeze({
  name: "massing",
  rationale: "Gray proportion shell — silhouette only; material and relief are later passes.",
});

/**
 * @typedef {Object} MassingSource  A form's occupancy, neutral of where it came from.
 * @property {number} width   build-grid width  (cells along x)
 * @property {number} height  build-grid height (cells along y)
 * @property {() => Iterable<{x:number, y:number}>} occupied  occupied cells in BUILD coords (Y-flipped)
 */
/**
 * @typedef {Object} Proportions  A projection of a locked occupancy, for the review critic (S-026).
 * @property {{width:number, height:number}} grid   the full bounding grid
 * @property {{minX:number, minY:number, maxX:number, maxY:number}|null} bounds  occupied bbox (null if empty)
 * @property {number} width    occupied bbox width  (maxX-minX+1; 0 if empty)
 * @property {number} height   occupied bbox height (maxY-minY+1; 0 if empty)
 * @property {number|null} aspect  bbox width/height, rounded (null if empty)
 * @property {number} occupied  count of occupied cells
 * @property {number} fill      occupied / (grid width × height), rounded
 */

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Adapt a `GridResult` (the E-10 image→block grid) into a `MassingSource`. The ONLY function that
 * knows the grid's conventions: `m` rows × `n` cols, `grid[gy][gx] !== null` means occupied, row
 * `gy=0` is the TOP of the image. Reads only `gridResult.{grid, n, m}` — it does not import or
 * depend on image-grid.mjs, so any object of that shape works.
 *
 * Y is FLIPPED by default (`flipY:true`): image row 0 (top) maps to the highest build `y`, the
 * bottom row to `y=0`, so the facade stands upright when rendered (render writes pos[1] as Y-up).
 * Pass `flipY:false` for a source already in Y-up build coordinates (e.g. a GLB voxelizer).
 *
 * @param {{grid: Array<Array<string|null>>, n: number, m: number}} gridResult
 * @param {{flipY?: boolean}} [opts]
 * @returns {MassingSource}
 */
export function conceptGridSource(gridResult, opts = {}) {
  const { grid, n, m } = gridResult;
  const flipY = opts.flipY ?? true;
  return {
    width: n,
    height: m,
    *occupied() {
      for (let gy = 0; gy < m; gy++) {
        const row = grid[gy];
        for (let gx = 0; gx < n; gx++) {
          if (row[gx] !== null && row[gx] !== undefined) {
            yield { x: gx, y: flipY ? m - 1 - gy : gy };
          }
        }
      }
    },
  };
}

/**
 * Build the locked gray massing shell from a form source. Sets `occupied:true` on each cell the
 * source yields, leaving `material`/`relief` unset, then runs it as a single "massing" stage through
 * `runStages` — which LOCKS exactly `occupied` (the proportion lock) on accept while leaving
 * material/relief free for the later passes. Returns the locked state and its derived proportions.
 *
 * @param {MassingSource} source
 * @param {object} [opts]  reserved (e.g. plan intent passthrough) — unused this bookend
 * @returns {{state: import("./build-state.mjs").BuildState, proportions: Proportions}}
 */
export function mass(source, opts = {}) {
  void opts;
  const state0 = createBuildState({ width: source.width, height: source.height });
  const stage = defineStage({
    name: "massing",
    run: (draft) => {
      for (const { x, y } of source.occupied()) draft.set(x, y, { occupied: true });
    },
  });
  const state = runStages(state0, [stage]);
  return { state, proportions: proportionsOf(state) };
}

/**
 * Derive proportion metadata from a build state's occupied cells — a pure projection (never stored,
 * so it cannot drift from the locked occupancy). The review critic (S-026) calls this on the locked
 * shell to judge bounds/aspect.
 * @param {import("./build-state.mjs").BuildState} state
 * @returns {Proportions}
 */
export function proportionsOf(state) {
  const grid = { width: state.width, height: state.height };
  const cells = occupiedCells(state);
  if (cells.length === 0) {
    return { grid, bounds: null, width: 0, height: 0, aspect: null, occupied: 0, fill: 0 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { x, y } of cells) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  return {
    grid,
    bounds: { minX, minY, maxX, maxY },
    width,
    height,
    aspect: round2(width / height),
    occupied: cells.length,
    fill: round2(cells.length / (grid.width * grid.height)),
  };
}

/**
 * Compile a massing shell to a single-material gray `DesignArtifact`. Thin wrapper over the spine's
 * `toDesignArtifact` that pins the `defaultBlock` to the one gray block and stamps the massing style.
 * Because no cell carries a `material`, every placement gets `MASSING_BLOCK` → a one-block manifest
 * (single material). Pure — does not validate (callers run it through src/artifact.mjs).
 * @param {import("./build-state.mjs").BuildState} state
 * @param {Object} [opts]  forwarded to `toDesignArtifact` (metadata/style/palette_id override)
 * @returns {import("../artifact.mjs").DesignArtifact}
 */
export function compileMassing(state, opts = {}) {
  return toDesignArtifact(state, { defaultBlock: MASSING_BLOCK, style: MASSING_STYLE, ...opts });
}
