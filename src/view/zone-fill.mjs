// Zone-fill — the deterministic BASE COAT (T-085-01, story S-085, epic E-24).
//
// The concept-COLOR splat cannot establish a zone's dominant material: on the cottage it converted only
// 9% of the upper-storey wall to plaster (quantization collapses cream/stone near-tones; the concept→face
// stretch misaligns the bands), and the good 77% result existed only as an inline hand-edit (e8062fa).
// This module makes that fill a first-class pure core: for each structural zone (structuralZones — base /
// upper / roof), recolor the zone's VISIBLE-SKIN surface cells to the zone's DOMINANT material (from the
// E-21 material map), preserving secondary materials that form RUNS (the dark_oak_log timber studs, quoin
// courses, the chimney) while filling isolated specks. The splat/LLM is demoted to placing secondaries
// over this coat, never establishing it (E-24 Rule 3: coverage before polish).
//
// FILL IS A RECOLOR, NOT A MOVE (face-paint's invariant): every placement is an appended
// `{op:"voxel", pos, block}` at an EXISTING surface voxel — expand's last-write-wins overrides the block,
// geometry is untouched, there is NO air op. Surface = the union of the five exposed-face projections
// (four elevations + the roof top), deduped by voxel — exactly the skin the render lens sees; interior
// cells are never touched.
//
// PURE — no GL, no I/O, no Date/random.

import { bareBlock } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";

/** The five exposed faces of the visible skin (the four elevations + the roof; -y is the unseen underside). */
export const FILL_FACES = Object.freeze(["+x", "-x", "+z", "-z", "+y"]);

/** Namespace a bare id for storage (placements are namespaced). */
function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/** Iterate the visible-skin surface voxels: union of the face projections, deduped by voxel key.
 *  THE canonical skin iterator — exported so the S-087 surface-pattern ops consume the same skin
 *  definition the fill and the census use (one definition, no refork). */
export function* surfaceVoxelEntries(occ, faces = FILL_FACES) {
  const seen = new Set();
  for (const dir of faces) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) {
      for (const c of row) {
        if (!c) continue;
        const key = c.voxel.join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        yield { key, voxel: c.voxel, block: c.block };
      }
    }
  }
}

const NEIGHBORS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/**
 * Is the voxel at `key` part of a RUN — a same-material 6-connected component of ≥ `minRun` cells over the
 * FULL occupancy (interior continuation counts: a stud running into the wall is one run)? Bounded flood
 * with early exit at `minRun`; the verdict is memoized for every visited key so a long stud is flooded once.
 */
function inRun(occ, key, bare, minRun, memo) {
  const known = memo.get(key);
  if (known !== undefined) return known;
  const visited = new Set([key]);
  const stack = [key];
  let big = visited.size >= minRun;
  while (stack.length && !big) {
    const [x, y, z] = stack.pop().split(",").map(Number);
    for (const [dx, dy, dz] of NEIGHBORS) {
      const nk = `${x + dx},${y + dy},${z + dz}`;
      if (visited.has(nk)) continue;
      const blk = occ.cells.get(nk);
      if (blk === undefined || bareBlock(blk) !== bare) continue;
      visited.add(nk);
      stack.push(nk);
      if (visited.size >= minRun) { big = true; break; }
    }
  }
  // Early exit leaves the component partially enumerated — only the VISITED cells share a safe verdict.
  for (const k of visited) memo.set(k, big);
  return big;
}

/**
 * Deterministic zone-fill of the dominant material — the base coat. For each visible-skin surface voxel
 * whose zone has a policy entry:
 *   • current block === the zone's dominant → KEEP (no placement);
 *   • current block ∈ the zone's `preserve` set AND part of a run (≥ minRun) → KEEP (a timber stud, a
 *     quoin course, the chimney);
 *   • anything else (the collapsed stone field, isolated preserve-material specks, off-policy strays) →
 *     FILL: recolor to the zone's dominant.
 * Zones absent from `zones` are untouched. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{zoneOf:(voxel:number[])=>string,
 *          zones:Record<string,{dominant:string, preserve?:string[]}>,
 *          faces?:string[], minRun?:number}} opts
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[], filled:number, kept:number,
 *            byZone:Record<string,{surface:number,filled:number,kept:number}>}}
 */
export function zoneFill(occ, { zoneOf, zones, faces = FILL_FACES, minRun = 2 } = {}) {
  if (typeof zoneOf !== "function") throw new Error("zoneFill: opts.zoneOf must be a function");
  if (!zones || typeof zones !== "object") throw new Error("zoneFill: opts.zones must be a zone→policy map");
  const policy = new Map();
  for (const [zone, p] of Object.entries(zones)) {
    if (!p || typeof p.dominant !== "string") throw new Error(`zoneFill: zones.${zone}.dominant must be a bare block id`);
    policy.set(zone, { dominant: bareBlock(p.dominant), preserve: new Set((p.preserve ?? []).map(bareBlock)) });
  }
  const memo = new Map(); // run verdicts, shared across the whole fill
  const placements = [];
  const byZone = {};
  let filled = 0, kept = 0;
  for (const { key, voxel, block } of surfaceVoxelEntries(occ, faces)) {
    const zone = zoneOf(voxel);
    const p = policy.get(zone);
    if (!p) continue; // no policy for this zone — untouched
    const z = (byZone[zone] ??= { surface: 0, filled: 0, kept: 0 });
    z.surface++;
    const bare = bareBlock(block);
    if (bare === p.dominant || (p.preserve.has(bare) && inRun(occ, key, bare, minRun, memo))) {
      z.kept++; kept++;
      continue;
    }
    placements.push({ op: "voxel", pos: [...voxel], block: namespaced(p.dominant) });
    z.filled++; filled++;
  }
  return { placements, filled, kept, byZone };
}

/**
 * Per-zone material census of the visible skin: total surface cells + per-bare-block counts, keyed by
 * whatever `zoneOf` returns. The coverage evidence for "the dominant is actually applied" (and the seam
 * the S-088 coverage gate consumes). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {(voxel:number[])=>string} zoneOf
 * @param {{faces?:string[]}} [opts]
 * @returns {Record<string,{total:number, byBlock:Record<string,number>}>}
 */
export function surfaceZoneHistogram(occ, zoneOf, { faces = FILL_FACES } = {}) {
  if (typeof zoneOf !== "function") throw new Error("surfaceZoneHistogram: zoneOf must be a function");
  const out = {};
  for (const { voxel, block } of surfaceVoxelEntries(occ, faces)) {
    const zone = zoneOf(voxel);
    const z = (out[zone] ??= { total: 0, byBlock: {} });
    z.total++;
    const bare = bareBlock(block);
    z.byBlock[bare] = (z.byBlock[bare] || 0) + 1;
  }
  return out;
}

/**
 * Per-zone dominant-coverage record: decorate a surfaceZoneHistogram census with each zone's INTENDED
 * dominant (from the E-21-derived zones policy) and the fraction of the zone's visible skin it covers —
 * the S-088 coverage metric ("is the intended dominant actually applied?"), ‰-rounded like the
 * committed spray-paint record. A zone absent from `zones` (or an empty census) reports
 * `dominant/dominantFraction: null` — measurable but un-intended zones are not judged here. PURE.
 * @param {Record<string,{total:number, byBlock:Record<string,number>}>} hist  surfaceZoneHistogram output
 * @param {Record<string,{dominant:string}>} [zones]  zone→policy map (same shape zoneFill takes; extra keys ignored)
 * @returns {Record<string,{total:number, byBlock:Record<string,number>, dominant:string|null, dominantFraction:number|null}>}
 */
export function dominantCoverage(hist, zones = {}) {
  if (!hist || typeof hist !== "object") throw new Error("dominantCoverage: hist must be a surfaceZoneHistogram record");
  const out = {};
  for (const [zone, h] of Object.entries(hist)) {
    const dominant = typeof zones[zone]?.dominant === "string" ? bareBlock(zones[zone].dominant) : null;
    out[zone] = {
      total: h.total,
      byBlock: h.byBlock,
      dominant,
      dominantFraction: dominant && h.total ? Math.round(((h.byBlock[dominant] ?? 0) / h.total) * 1000) / 1000 : null,
    };
  }
  return out;
}
