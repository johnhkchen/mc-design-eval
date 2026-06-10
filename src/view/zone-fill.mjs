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
// TWO SKINS (T-090-01, story S-090, epic E-25). The PROJECTION skin above is what five orthographic
// cameras see — first occupied voxel per ray — and it under-covers: a cell occluded along all five rays
// but still air-adjacent (the side face of a stepped roof course behind a gable, an under-eave wall
// cell) is never enumerated, yet any oblique camera sees it (the cottage roof read 89% spruce on the
// projection census and 55% on the real shell). The EXPOSURE skin is the full shell: every occupied
// voxel with ANY of its 6 faces air-exposed — what a camera at ANY angle can see. `skin:"exposure"`
// switches the fill and the census to it. Spec'd-in inclusions (they match the ticket's measurement):
// -y-only-exposed cells (render-invisible undersides) and interior-cavity skins (a hollow build's
// inner walls — interior-aware filling is the E-23 interior path's concern, not this op's).
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

/** Iterate the FULL-SHELL exposure skin: every occupied voxel with ANY of its 6 faces air-exposed —
 *  a strict superset of the projection skin (every projected cell's camera-side neighbour is air).
 *  Deterministic in occupancy insertion order. Same {key, voxel, block} shape as surfaceVoxelEntries. */
export function* exposedVoxelEntries(occ) {
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    for (const [dx, dy, dz] of NEIGHBORS) {
      if (!occ.has(x + dx, y + dy, z + dz)) {
        yield { key, voxel: [x, y, z], block };
        break;
      }
    }
  }
}

/** The one skin-name → iterator dispatch (the fill and the census must agree on what a skin means). */
function skinEntries(occ, skin, faces) {
  if (skin === "projection") return surfaceVoxelEntries(occ, faces);
  if (skin === "exposure") return exposedVoxelEntries(occ);
  throw new Error(`zone-fill: skin "${skin}" is not "projection" or "exposure"`);
}

/**
 * Is the voxel at `key` part of a RUN — a same-material 6-connected component of ≥ `minRun` cells over the
 * FULL occupancy (interior continuation counts: a stud running into the wall is one run)? Bounded flood
 * with early exit at `minRun`; the verdict is memoized for every visited key so a long stud is flooded once.
 * Exported so the T-098 placement grammar respects the SAME keep rule when painting frame lines —
 * one run definition, no refork.
 */
export function inRun(occ, key, bare, minRun, memo) {
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
 * A voxel inside a DECLARED SUB-REGION (`regions`, T-090-01) is kept UNCONDITIONALLY, before zone
 * policy is consulted — a declared design element (a chimney, a finial) keeps its material even when
 * it is the zone's displaced field or a sub-minRun speck. Zones absent from `zones` are untouched.
 * `skin` picks the enumeration: "projection" (the five-camera skin, the E-24 wall-field fill) or
 * "exposure" (the full 6-dir-exposed shell, the T-090-01 full-shell fill). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{zoneOf:(voxel:number[])=>string,
 *          zones:Record<string,{dominant:string, preserve?:string[]}>,
 *          faces?:string[], minRun?:number, skin?:"projection"|"exposure",
 *          regions?:{name:string, contains:(voxel:number[])=>boolean}[]}} opts
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[], filled:number, kept:number,
 *            byZone:Record<string,{surface:number,filled:number,kept:number}>,
 *            byRegion:Record<string,number>}}
 */
export function zoneFill(occ, { zoneOf, zones, faces = FILL_FACES, minRun = 2, skin = "projection", regions = [] } = {}) {
  if (typeof zoneOf !== "function") throw new Error("zoneFill: opts.zoneOf must be a function");
  if (!zones || typeof zones !== "object") throw new Error("zoneFill: opts.zones must be a zone→policy map");
  for (const r of regions) {
    if (!r || typeof r.name !== "string" || typeof r.contains !== "function") {
      throw new Error("zoneFill: each region must be {name:string, contains:(voxel)=>boolean}");
    }
  }
  const policy = new Map();
  for (const [zone, p] of Object.entries(zones)) {
    if (!p || typeof p.dominant !== "string") throw new Error(`zoneFill: zones.${zone}.dominant must be a bare block id`);
    policy.set(zone, { dominant: bareBlock(p.dominant), preserve: new Set((p.preserve ?? []).map(bareBlock)) });
  }
  const memo = new Map(); // run verdicts, shared across the whole fill
  const placements = [];
  const byZone = {};
  const byRegion = {};
  let filled = 0, kept = 0;
  for (const { key, voxel, block } of skinEntries(occ, skin, faces)) {
    const zone = zoneOf(voxel);
    const p = policy.get(zone);
    if (!p) continue; // no policy for this zone — untouched
    const z = (byZone[zone] ??= { surface: 0, filled: 0, kept: 0 });
    z.surface++;
    const region = regions.find((r) => r.contains(voxel));
    if (region) {
      byRegion[region.name] = (byRegion[region.name] || 0) + 1;
      z.kept++; kept++;
      continue;
    }
    const bare = bareBlock(block);
    if (bare === p.dominant || (p.preserve.has(bare) && inRun(occ, key, bare, minRun, memo))) {
      z.kept++; kept++;
      continue;
    }
    placements.push({ op: "voxel", pos: [...voxel], block: namespaced(p.dominant) });
    z.filled++; filled++;
  }
  return { placements, filled, kept, byZone, byRegion };
}

/**
 * Per-zone material census of the visible skin: total surface cells + per-bare-block counts, keyed by
 * whatever `zoneOf` returns. The coverage evidence for "the dominant is actually applied" (and the seam
 * the S-088 coverage gate consumes). `skin` picks the census basis: "projection" (the five-camera
 * skin) or "exposure" (the full 6-dir shell — the camera's truth at any angle, T-090-01). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {(voxel:number[])=>string} zoneOf
 * @param {{faces?:string[], skin?:"projection"|"exposure"}} [opts]
 * @returns {Record<string,{total:number, byBlock:Record<string,number>}>}
 */
export function surfaceZoneHistogram(occ, zoneOf, { faces = FILL_FACES, skin = "projection" } = {}) {
  if (typeof zoneOf !== "function") throw new Error("surfaceZoneHistogram: zoneOf must be a function");
  const out = {};
  for (const { voxel, block } of skinEntries(occ, skin, faces)) {
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

/**
 * Per-zone OWN-materials coverage: `dominantCoverage` extended with each zone's declared vocabulary —
 * dominant + `preserve` (the T-090 band-evidence "own" set) — and the fraction of the zone's visible
 * skin those cover. A styled zone (E-26) legitimately carries frame lines, shutters, and splat
 * secondaries on top of its dominant; censusing the dominant alone under-counts exactly the
 * ingredients the kit placed. Foreign leakage (another zone's dominant, salt) still counts against.
 * Strictly monotone vs `dominantFraction` (own ⊇ dominant): anything that passed dominant-only
 * coverage passes own-coverage. PURE.
 * @param {Record<string,{total:number, byBlock:Record<string,number>}>} hist  surfaceZoneHistogram output
 * @param {Record<string,{dominant:string, preserve?:string[]}>} [zones]
 * @returns {Record<string,{total:number, byBlock:Record<string,number>, dominant:string|null,
 *           dominantFraction:number|null, own:string[]|null, ownFraction:number|null}>}
 */
export function ownCoverage(hist, zones = {}) {
  const out = dominantCoverage(hist, zones);
  for (const [zone, row] of Object.entries(out)) {
    const p = zones[zone];
    const own = typeof p?.dominant === "string"
      ? [...new Set([p.dominant, ...(p.preserve ?? [])].map(bareBlock))]
      : null;
    row.own = own;
    row.ownFraction = own && row.total
      ? Math.round((own.reduce((n, b) => n + (row.byBlock[b] ?? 0), 0) / row.total) * 1000) / 1000
      : null;
  }
  return out;
}
