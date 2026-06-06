// Face spray-paint — splat back-projection to recolor placements (T-079-01, story S-079, epic E-23).
//
// THE JUDGEMENT PATH. The cottage face failed because 3-D feature space has no storey axis, so "the
// upper band is plaster" collapsed (white_terracotta 215→8). The fix: project the build face to the
// 2.5-D grid (T-078 Path P), splat a per-cell material TARGET onto it, and BACK-PROJECT the target to
// recolor placements on the front-most surface voxels. The LLM refines/judges rather than placing every
// cell (`twodee-interaction-sector`).
//
// PAINT IS A RECOLOR, NOT A MOVE. `expandArtifact` is last-write-wins/full-replace, so a paint is just
// an appended `{op:"voxel", pos, block}` at an EXISTING surface voxel — the later placement overrides
// the block at that cell WITHOUT touching geometry. There is NO air op (`facade-recess-by-exclusion`):
// paint never removes a voxel, only re-blocks it. Back-projection is the stored-voxel read off the
// SurfaceCell (T-078's invariant) — unambiguous precisely because Path P is ortho/45°.
//
// CORNER PRECEDENCE (AC #4). A voxel on a shared edge is the front-most cell of TWO ortho faces, so two
// paint passes can target the same pos. `mergePaints` resolves by SOURCE priority: the concept-matching
// paint (front) outranks the GLB paint (sides). A voxel reached by NO pass keeps its current block — the
// colorimetric fallback (occluded interior is never a front cell, so it is never painted).
//
// PURE — no GL, no I/O, no Date/random.

import { projectSurface } from "./surface-grid.mjs";
import { bareBlock } from "./occupancy.mjs";
import { voxelKey } from "../expand.mjs";

/** Namespace a bare id for storage (placements + manifest are namespaced). */
function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/**
 * @typedef {Object} PaintPass
 * @property {string} dir  the projected face
 * @property {"concept"|"glb"|string} source
 * @property {{op:"voxel", pos:number[], block:string}[]} placements  recolor voxels (namespaced)
 * @property {number} painted  cells that produced a recolor
 * @property {number} skipped  filled cells skipped (no target / no change)
 * @property {number} offPalette  target cells dropped for being off-palette
 */

/**
 * Spray-paint one face: project `occ` along `dir`, then for each filled surface cell whose target block
 * is in `allowed` AND differs from the cell's current block, emit a recolor at the cell's stored voxel.
 * Air cells, target-null cells, off-palette targets, and no-change cells emit nothing (no air op). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {string|{name:string}} dir  an ortho/45° dir (surface-grid throws on arbitrary-oblique)
 * @param {(string|null)[][]} targetGrid  per-cell target block (bare or namespaced) or null; m×n
 * @param {{allowed:Set<string>, source?:string}} opts
 * @returns {PaintPass}
 */
export function paintFace(occ, dir, targetGrid, { allowed, source = "concept" } = {}) {
  if (!(allowed instanceof Set)) throw new Error("paintFace: opts.allowed must be a Set of bare block ids");
  const grid = projectSurface(occ, dir);
  const placements = [];
  let painted = 0, skipped = 0, offPalette = 0;
  for (let v = 0; v < grid.m; v++) {
    const trow = targetGrid[v];
    for (let u = 0; u < grid.n; u++) {
      const cell = grid.cells[v][u];
      if (!cell) continue; // air column — nothing to paint
      const target = trow ? trow[u] : null;
      if (target == null) { skipped++; continue; }
      const bareTarget = bareBlock(target);
      if (!allowed.has(bareTarget)) { offPalette++; continue; } // structurally impossible off-palette
      if (bareTarget === bareBlock(cell.block)) { skipped++; continue; } // already that material
      placements.push({ op: "voxel", pos: [...cell.voxel], block: namespaced(target) });
      painted++;
    }
  }
  return { dir: grid.dir, source, placements, painted, skipped, offPalette };
}

/**
 * Merge paint passes into one placement list, resolving same-voxel collisions by SOURCE priority (a
 * corner voxel takes the higher-priority paint — concept over glb, AC #4). De-duplicated by voxelKey;
 * within a pass, the last placement for a pos wins (matches expand semantics). PURE.
 * @param {PaintPass[]} passes
 * @param {{priority?:string[]}} [opts]  source ranking, earliest = highest (default ["concept","glb"])
 * @returns {{placements:{op,pos,block}[], collisions:number, byPos:Map<string,{block:string,source:string}>}}
 */
export function mergePaints(passes, { priority = ["concept", "glb"] } = {}) {
  const rank = (s) => { const i = priority.indexOf(s); return i === -1 ? priority.length : i; };
  const byPos = new Map(); // voxelKey → { block, source }
  let collisions = 0;
  for (const pass of passes) {
    for (const p of pass.placements) {
      const k = voxelKey(p.pos);
      const cur = byPos.get(k);
      if (!cur) { byPos.set(k, { block: p.block, source: pass.source, pos: p.pos }); continue; }
      collisions++;
      // higher-priority source wins; on a tie, last write wins (expand parity)
      if (rank(pass.source) <= rank(cur.source)) byPos.set(k, { block: p.block, source: pass.source, pos: p.pos });
    }
  }
  const placements = [...byPos.values()].map((e) => ({ op: "voxel", pos: e.pos, block: e.block }));
  return { placements, collisions, byPos };
}

/**
 * Append recolor placements to an artifact (shallow clone). Geometry is untouched — the appended voxels
 * override blocks at existing positions under expand's last-write-wins. Does NOT validate (round-trip
 * through `assertArtifact`). PURE.
 * @param {object} artifact
 * @param {{op,pos,block}[]} placements
 * @returns {object} cloned artifact with placements appended
 */
export function applyPaint(artifact, placements) {
  return { ...artifact, placements: [...artifact.placements, ...placements] };
}
