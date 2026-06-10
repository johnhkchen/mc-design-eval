// Shell-integrity ops (T-091-01, story S-091, epic E-25) — three witnessed geometric defects no prior
// gate catches: FLOATING DEBRIS (off-main connected components hovering around the silhouette), SHELL
// VOIDS (missing-mass cavities the concept does not show, distinct from declared openings), and
// PLAN-ONLY CLOSURE (S-084 sealed the roof as seen from the sky; oblique views still found gaps).
//
//   • componentStrip — keep the largest 6-connected component plus GROUNDED components (a standing
//     structure — the gatehouse's inner passage — is not debris; floating is what makes debris debris),
//     strip the rest, declare everything (kept exceptions AND stripped sizes) in the report.
//   • rebuildArtifact — deletion has no artifact op (`facade-recess-by-exclusion`: the contract is
//     RECOLOR + ADD only), so a strip REBUILDS the artifact: one {op:"voxel"} per kept cell in
//     expandArtifact's canonical (y,z,x) order (keysToArtifact precedent).
//   • fillVoids — a cavity is a BASIN in a face's depth field: deep relative to its own rim (the same
//     hydrology regularizeRoofCourses runs on the +y height map — spillLevels is the shared core, here
//     over `-depth`). Pockets ≥ minDepth below their spill rim are missing mass and are filled flush in
//     the owning zone's dominant; depth-1..2 facade relief drains or sits above the floor and is kept.
//     Declared openings (world-AABB regions, see openingRegions) are never filled.
//   • closureCheck / plugClosure — watertightness from ALL SIX axis directions, GROUND-SOLID: the
//     camera never looks from below and in-world the build sits on terrain, so the exterior flood seeds
//     from sky + sides only and a -y containment ray exiting the bbox counts as a terrain hit. Declared
//     openings are honorary skin (else one legitimate window voids the verdict). closureCheck judges the
//     STANDING build (no simulated hollow — distinct from watertightCheck's carve) and reports breach
//     mouths per entry direction; plugClosure fills mouths with the owning zone's dominant until closed
//     (occupancy grows monotonically, so it terminates) and THROWS at the iteration cap — the gate
//     consuming it can never pass an unclosed shell.
//
// Policy is data: zone names/dominants come from the caller (an E-21-derived policy or a census of the
// build's own shell); minDepth is an op parameter like minRun/minKeep. Nothing subject-specific lives
// here (E-25 Rule 3).
//
// PURE — no GL, no I/O, no model, no Date/random — runs under the `src/**/*.test.mjs` glob. The GL
// renders, durable records, and AC assertions live in the runner (benchmarks/sculpture/shell-integrity.mjs).

import { componentLabels } from "../form/voxel-components.mjs";
import { occupancyFromCells, solidOccupancy, bareBlock } from "./occupancy.mjs";
import { projectSurface, orthoSpec, cellWorldPos } from "./surface-grid.mjs";
import { openings } from "./structural-read.mjs";
import { spillLevels } from "./surface-pattern.mjs";

/** The four exterior elevations (shared vocabulary with surface-coherence). */
export const SIDE_FACES = Object.freeze(["+x", "-x", "+z", "-z"]);
/** The faces the void detector scans by default: the four elevations + the roof. */
export const VOID_FACES = Object.freeze([...SIDE_FACES, "+y"]);

const NEIGH6 = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);

/** Namespace a bare id for storage (placements are namespaced). */
function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/** Adapt a cells-Map occupancy to the Int32 `{occupied, count}` shape componentLabels reads, keeping
 *  insertion order so the returned labels align 1:1 with `occ.cells` iteration. */
function int32Shape(occ) {
  const flat = new Int32Array(occ.size * 3);
  let n = 0;
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    flat[n] = x; flat[n + 1] = y; flat[n + 2] = z;
    n += 3;
  }
  return { occupied: flat, count: occ.size };
}

/**
 * COMPONENT STRIP: keep the largest 6-connected component plus (by default) every GROUNDED component —
 * one whose lowest cell sits on the build's ground plane (`bounds.min[1]`). Everything else is floating
 * debris and is stripped. Every decision is DECLARED: `kept` lists each surviving component (size, minY,
 * grounded/largest flags — the S-091 "exceptions must be declared"), `stripped` lists each dropped one.
 * Reuses the one flood-fill core (`componentLabels`, src/form/voxel-components.mjs) via a shape adapter —
 * no fourth DFS. Empty or single-component occupancy → returned unchanged with a vacuous report. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{keepGrounded?:boolean}} [opts] keepGrounded default true; false = literal keep-only-largest
 * @returns {{occ:import("./occupancy.mjs").Occupancy, components:number,
 *            kept:{size:number,minY:number,grounded:boolean,largest:boolean}[],
 *            stripped:{size:number,minY:number}[], strippedCells:number}}
 */
export function componentStrip(occ, { keepGrounded = true } = {}) {
  if (!occ.size) return { occ, components: 0, kept: [], stripped: [], strippedCells: 0 };
  const { labels, sizes } = componentLabels(int32Shape(occ), { connectivity: 6 });
  const groundY = occ.bounds.min[1];

  // per-label minY (grounded test), in one pass over the cells
  const minY = new Array(sizes.length).fill(Infinity);
  let n = 0;
  for (const key of occ.cells.keys()) {
    const y = Number(key.split(",")[1]);
    const l = labels[n++];
    if (y < minY[l]) minY[l] = y;
  }
  // largest component: max size, lowest label on ties (matches strayVoxelStats / pruneStrays)
  let largest = 0;
  for (let l = 1; l < sizes.length; l++) if (sizes[l] > sizes[largest]) largest = l;

  const keep = sizes.map((_, l) => l === largest || (keepGrounded && minY[l] === groundY));
  const kept = [], stripped = [];
  for (let l = 0; l < sizes.length; l++) {
    if (keep[l]) kept.push({ size: sizes[l], minY: minY[l], grounded: minY[l] === groundY, largest: l === largest });
    else stripped.push({ size: sizes[l], minY: minY[l] });
  }
  if (stripped.length === 0) return { occ, components: sizes.length, kept, stripped, strippedCells: 0 };

  const cells = [];
  n = 0;
  for (const [key, block] of occ.cells) {
    if (keep[labels[n++]]) {
      cells.push({ pos: key.split(",").map(Number), block, form: occ.forms?.get(key), state: occ.states?.get(key) });
    }
  }
  return {
    occ: occupancyFromCells(cells),
    components: sizes.length,
    kept,
    stripped,
    strippedCells: stripped.reduce((s, c) => s + c.size, 0),
  };
}

/**
 * REBUILD an artifact from an occupancy: one `{op:"voxel", pos, block}` per cell in expandArtifact's
 * CANONICAL (ascending y, then z, then x) order — the deterministic encoding a strip needs, since the
 * contract has no air op and removal cannot be appended. `schema_version`/`metadata`/`style` and the
 * palette's `palette_id` carry over from `template`; the manifest is recomputed as the sorted unique
 * placed blocks (keysToArtifact precedent). Does NOT validate — callers run assertArtifact (the
 * round-trip pattern). Per-voxel `state` IS carried (T-097-01: occupancy holds fixture states, and a
 * strip must not silently undress a window). Throws on an empty occupancy (an artifact requires ≥1
 * placement). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{schema_version:string, metadata:object, style:object, palette:object}} template
 * @returns {object} a fresh artifact object (template fields shallow-copied)
 */
export function rebuildArtifact(occ, template) {
  if (!occ.size) throw new Error("rebuildArtifact: occupancy has no cells (artifact requires ≥1 placement)");
  if (!template || typeof template !== "object") throw new Error("rebuildArtifact: template artifact required");
  const rows = [];
  for (const [key, block] of occ.cells) {
    rows.push({ pos: key.split(",").map(Number), block: namespaced(block), state: occ.states?.get(key) });
  }
  rows.sort((a, b) => a.pos[1] - b.pos[1] || a.pos[2] - b.pos[2] || a.pos[0] - b.pos[0]);
  const placements = rows.map((r) =>
    r.state === undefined
      ? { op: "voxel", pos: r.pos, block: r.block }
      : { op: "voxel", pos: r.pos, block: r.block, state: r.state }
  );
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  const palette = template.palette?.palette_id
    ? { palette_id: template.palette.palette_id, manifest }
    : { manifest };
  return {
    schema_version: template.schema_version,
    metadata: { ...template.metadata },
    style: { ...template.style },
    palette,
    placements,
  };
}

/**
 * DECLARED-OPENING REGIONS: each `openings(occ, dir)` bbox (enclosed air = window, bottom-touching =
 * door — the arch) back-projected through the FULL depth axis to a world AABB. World-space (not uv) so
 * regions measured on one occupancy (the RAW pre-seal build, whose openings the concept declared)
 * survive bounds-insensitive reuse on its sealed/stripped descendants. The void detector and the closure
 * check consume these as the allow-list. T-097-01: `openings` detects on the SOLID view, so the bbox
 * (u,v) space is the solid grid's — back-projection here uses the SAME solid bounds, keeping a dressed
 * aperture's region identical to its undressed twin. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {string[]} [dirs]
 * @returns {{kind:string, dir:string, min:number[], max:number[]}[]}
 */
export function openingRegions(occ, dirs = SIDE_FACES) {
  if (!occ.bounds) return [];
  const solid = solidOccupancy(occ);
  if (!solid.bounds) return [];
  const out = [];
  for (const dir of dirs) {
    const spec = orthoSpec(dir);
    const wLo = solid.bounds.min[spec.axisW];
    const wHi = solid.bounds.max[spec.axisW];
    for (const o of openings(occ, dir)) {
      const a = cellWorldPos(solid, spec, o.bbox.u0, o.bbox.v0, wLo);
      const b = cellWorldPos(solid, spec, o.bbox.u1, o.bbox.v1, wHi);
      out.push({
        kind: o.kind,
        dir,
        min: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])],
        max: [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])],
      });
    }
  }
  return out;
}

/** Is a world pos inside any allow region (inclusive AABB)? PURE. */
export function inRegion(pos, regions) {
  const [x, y, z] = pos;
  for (const r of regions) {
    if (x >= r.min[0] && x <= r.max[0] && y >= r.min[1] && y <= r.max[1] && z >= r.min[2] && z <= r.max[2]) return true;
  }
  return false;
}

/**
 * VOID REPAIR: per face, find depth-field BASINS — cells whose first-hit depth exceeds their hydrological
 * spill rim by ≥ `minDepth` — and fill them flush to the rim (voxels at depths spill … depth−1) in the
 * owning zone's dominant. minDepth (default 3) is the relief floor: measured facade relief (timber
 * framing, reveals, quoins) lives at depth 1–2; the witnessed cavities/see-through slits are ≥3. A fill
 * column intersecting an allow `region` (a declared door/window/arch) is skipped — the repair cannot
 * close an opening the concept shows. Cells in zones without a policy entry are skipped (mirrors
 * zoneFill). ADD-only; geometry of existing voxels untouched. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{zoneOf:(voxel:number[])=>string, zones:Record<string,{dominant:string}>,
 *          minDepth?:number, dirs?:string[], regions?:object[]}} opts
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[], filled:number,
 *            byDir:Record<string,{basinCells:number, filled:number, skippedAllowed:number, skippedNoZone:number}>}}
 */
export function fillVoids(occ, { zoneOf, zones, minDepth = 3, dirs = VOID_FACES, regions = [] } = {}) {
  if (typeof zoneOf !== "function") throw new Error("fillVoids: opts.zoneOf must be a function");
  if (!zones || typeof zones !== "object") throw new Error("fillVoids: opts.zones must be a zone→policy map");
  const policy = new Map();
  for (const [zone, p] of Object.entries(zones)) {
    if (!p || typeof p.dominant !== "string") throw new Error(`fillVoids: zones.${zone}.dominant must be a bare block id`);
    policy.set(zone, bareBlock(p.dominant));
  }
  const placements = [];
  const byDir = {};
  const seen = new Set(); // a voxel filled once even when two faces both see its pocket
  let filled = 0;
  if (!occ.bounds) return { placements, filled, byDir };
  for (const dir of dirs) {
    const spec = orthoSpec(dir);
    const grid = projectSurface(occ, dir);
    const wLo = occ.bounds.min[spec.axisW];
    const wHi = occ.bounds.max[spec.axisW];
    const wOf = (d) => (spec.near === "max" ? wHi - d : wLo + d);
    const stats = (byDir[dir] = { basinCells: 0, filled: 0, skippedAllowed: 0, skippedNoZone: 0 });
    const vmap = new Map();
    const depthAt = new Map();
    for (let v = 0; v < grid.m; v++) {
      for (let u = 0; u < grid.n; u++) {
        const c = grid.cells[v][u];
        if (!c) continue;
        vmap.set(`${u},${v}`, -c.depth); // basin in -depth space = a recess
        depthAt.set(`${u},${v}`, c.depth);
      }
    }
    const levels = spillLevels(vmap);
    for (const [k, vneg] of vmap) {
      const spill = -(levels.get(k) ?? vneg); // back to depth space
      const depth = depthAt.get(k);
      if (depth - spill < minDepth) continue; // drains, or shallow relief — kept
      stats.basinCells++;
      const [u, v] = k.split(",").map(Number);
      const column = [];
      for (let d = spill; d < depth; d++) column.push(cellWorldPos(occ, spec, u, v, wOf(d)));
      if (column.some((pos) => inRegion(pos, regions))) { stats.skippedAllowed++; continue; }
      for (const pos of column) {
        const key = pos.join(",");
        if (seen.has(key)) continue;
        const dom = policy.get(zoneOf(pos));
        if (dom === undefined) { stats.skippedNoZone++; continue; }
        seen.add(key);
        placements.push({ op: "voxel", pos, block: namespaced(dom) });
        stats.filled++;
        filled++;
      }
    }
  }
  return { placements, filled, byDir };
}

/** Most common block over the whole occupancy — plugClosure's total fallback (a policy-less zone must
 *  not stall the convergence loop). PURE. */
function buildDominant(occ) {
  const counts = new Map();
  for (const blk of occ.cells.values()) {
    const b = bareBlock(blk);
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  let dom = null, best = -1;
  for (const [b, c] of counts) if (c > best) { best = c; dom = b; }
  return dom;
}

/**
 * SIX-DIRECTION CLOSURE CHECK — watertightness of the STANDING build (no simulated hollow; distinct from
 * watertightCheck's carve), GROUND-SOLID, openings-aware:
 *   • air inside an allow `region` counts as SKIN (a declared opening is not a breach — and must block
 *     the flood, else one window makes the whole interior "reachable" and the verdict means nothing);
 *   • the exterior flood seeds from the sky and the four padded sides, NEVER from below (in-world the
 *     build sits on terrain; no camera looks from -y);
 *   • interior = 6-ray containment, where a -y ray exiting the bbox counts as a terrain hit.
 * A breach MOUTH is a flood-reached interior cell adjacent to flood-reached non-interior air. The
 * per-direction tally attributes each such adjacency to the ESCAPE direction(s) of that non-interior
 * neighbour — the bbox faces its uncontained rays exit through (a roof-hole shaft escapes +y, a
 * through-window escapes ±z) → `byDirection` is the per-direction verdict the ticket asks for ("not
 * just plan view"), independent of the (lateral) axis the flood happens to cross the interface on.
 * `closed` ⇔ no interior cell reached. Mouths are sorted (deterministic plug order). PURE.
 *
 * T-097-01 fixture semantics: skin is SOLID cells only — a fixture (fence, trapdoor) does not seal.
 * A fixture inside an allow region is a DRESSED opening: the region is already honorary skin, so the
 * shell stays closed, and `dressed.cells` reports how many non-solid cells dress the regions (the
 * verdict reads "closed, N dressed" — not a hole, not wall mass). A fixture OUTSIDE every region adds
 * no skin (it cannot fake closure) and is flaggable separately via {@link strayFixtures}.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{regions?:object[]}} [opts]
 * @returns {{closed:boolean, interiorCells:number, reached:number,
 *            byDirection:Record<string,number>, mouths:string[], dressed:{cells:number}}}
 */
export function closureCheck(occ, { regions = [] } = {}) {
  const byDirection = { "+x": 0, "-x": 0, "+y": 0, "-y": 0, "+z": 0, "-z": 0 };
  const dressed = { cells: dressedCellCount(occ, regions) };
  if (!occ.bounds) return { closed: true, interiorCells: 0, reached: 0, byDirection, mouths: [], dressed };
  const { min, max } = occ.bounds;
  const solidAt = typeof occ.solid === "function" ? occ.solid : occ.has; // pre-T-097 occupancies
  const occAt = (x, y, z) => solidAt(x, y, z) || inRegion([x, y, z], regions);
  const inB = (x, y, z) => x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2];
  const rayHits = (x, y, z, dx, dy, dz) => {
    let cx = x + dx, cy = y + dy, cz = z + dz;
    while (inB(cx, cy, cz)) {
      if (occAt(cx, cy, cz)) return true;
      cx += dx; cy += dy; cz += dz;
    }
    return dy === -1; // a -y ray that exits the bbox rests on terrain — ground-solid
  };

  // interior air: contained on all six rays (with the ground rule)
  const interior = new Set();
  for (let x = min[0]; x <= max[0]; x++) {
    for (let y = min[1]; y <= max[1]; y++) {
      for (let z = min[2]; z <= max[2]; z++) {
        if (occAt(x, y, z)) continue;
        let enclosed = true;
        for (const [dx, dy, dz] of NEIGH6) if (!rayHits(x, y, z, dx, dy, dz)) { enclosed = false; break; }
        if (enclosed) interior.add(`${x},${y},${z}`);
      }
    }
  }

  // exterior flood: padded sides + sky, floor at ground level (never seeded from below)
  const lo = [min[0] - 1, min[1], min[2] - 1];
  const hi = [max[0] + 1, max[1] + 1, max[2] + 1];
  const visited = new Set();
  const stack = [];
  const seed = (x, y, z) => {
    const k = `${x},${y},${z}`;
    if (!visited.has(k) && !occAt(x, y, z)) { visited.add(k); stack.push([x, y, z]); }
  };
  for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) seed(x, hi[1], z);
  for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) { seed(x, y, lo[2]); seed(x, y, hi[2]); }
  for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) { seed(lo[0], y, z); seed(hi[0], y, z); }
  while (stack.length) {
    const [x, y, z] = stack.pop();
    for (const [dx, dy, dz] of NEIGH6) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nx < lo[0] || nx > hi[0] || ny < lo[1] || ny > hi[1] || nz < lo[2] || nz > hi[2]) continue;
      const k = `${nx},${ny},${nz}`;
      if (visited.has(k) || occAt(nx, ny, nz)) continue;
      visited.add(k);
      stack.push([nx, ny, nz]);
    }
  }

  // mouths + per-direction tallies. The breach is attributed to the ESCAPE direction(s) of the
  // non-interior neighbour at the mouth: the bbox faces its uncontained rays exit through (memoized —
  // a shaft cell borders many interior cells). A non-interior cell has ≥1 escape by definition (the
  // ground rule already folds -y exits into "hit").
  const DIR_NAMES = ["+x", "-x", "+y", "-y", "+z", "-z"];
  const escapeMemo = new Map();
  const escapesOf = (x, y, z) => {
    const k = `${x},${y},${z}`;
    let e = escapeMemo.get(k);
    if (!e) {
      e = [];
      for (let i = 0; i < NEIGH6.length; i++) {
        const [dx, dy, dz] = NEIGH6[i];
        if (!rayHits(x, y, z, dx, dy, dz)) e.push(DIR_NAMES[i]);
      }
      escapeMemo.set(k, e);
    }
    return e;
  };
  let reached = 0;
  const mouths = [];
  for (const k of interior) {
    if (!visited.has(k)) continue;
    reached++;
    const [x, y, z] = k.split(",").map(Number);
    let isMouth = false;
    for (const [dx, dy, dz] of NEIGH6) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      const nk = `${nx},${ny},${nz}`;
      if (!visited.has(nk) || interior.has(nk)) continue;
      isMouth = true;
      for (const name of inB(nx, ny, nz) ? escapesOf(nx, ny, nz) : []) byDirection[name]++;
    }
    if (isMouth) mouths.push(k);
  }
  mouths.sort();
  return { closed: reached === 0, interiorCells: interior.size, reached, byDirection, mouths, dressed };
}

/** Occupied non-solid cells inside any allow region — the dressing tally closureCheck reports. PURE. */
function dressedCellCount(occ, regions) {
  if (!occ.forms?.size || !regions.length) return 0;
  let count = 0;
  for (const key of occ.forms.keys()) {
    if (inRegion(key.split(",").map(Number), regions)) count++;
  }
  return count;
}

/**
 * STRAY FIXTURES: occupied non-solid cells OUTSIDE every allow region — a fence floating in a wall
 * field is a grammar/material defect, not a watertightness breach, so this is a separate detector
 * (it never changes `closureCheck.closed`). Sorted by key for determinism. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object[]} [regions] world AABBs (see {@link openingRegions})
 * @returns {{key:string, pos:number[], block:string, form:"fixture"|"rail"}[]}
 */
export function strayFixtures(occ, regions = []) {
  if (!occ.forms?.size) return [];
  const out = [];
  for (const [key, form] of occ.forms) {
    const pos = key.split(",").map(Number);
    if (inRegion(pos, regions)) continue;
    out.push({ key, pos, block: occ.cells.get(key), form });
  }
  out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return out;
}

/**
 * PLUG TO CLOSURE: while the shell is not closed, fill every current breach mouth with the owning zone's
 * dominant (fallback: the build's most common block — a policy-less zone must not stall the loop) and
 * re-check. The occupancy grows monotonically, so the loop terminates; if `maxIterations` is hit the op
 * THROWS — a consumer gate can never pass an unclosed shell. Mouth cells sit at the interior/exterior
 * interface (render-invisible or reading as field material); the visible-surface repair is fillVoids'
 * job and should run first. ADD-only. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{zoneOf:(voxel:number[])=>string, zones:Record<string,{dominant:string}>,
 *          regions?:object[], maxIterations?:number}} opts
 * @returns {{occ:import("./occupancy.mjs").Occupancy, placements:object[], iterations:number,
 *            closed:true, check:object}} the final (passing) closureCheck is returned as `check`
 */
export function plugClosure(occ, { zoneOf, zones, regions = [], maxIterations = 8 } = {}) {
  if (typeof zoneOf !== "function") throw new Error("plugClosure: opts.zoneOf must be a function");
  if (!zones || typeof zones !== "object") throw new Error("plugClosure: opts.zones must be a zone→policy map");
  const policy = new Map();
  for (const [zone, p] of Object.entries(zones)) {
    if (!p || typeof p.dominant !== "string") throw new Error(`plugClosure: zones.${zone}.dominant must be a bare block id`);
    policy.set(zone, bareBlock(p.dominant));
  }
  const fallback = buildDominant(occ);
  const placements = [];
  let current = occ;
  for (let i = 0; i <= maxIterations; i++) {
    const check = closureCheck(current, { regions });
    if (check.closed) return { occ: current, placements, iterations: i, closed: true, check };
    if (i === maxIterations) break;
    const cells = [];
    for (const [k, b] of current.cells) {
      cells.push({ pos: k.split(",").map(Number), block: b, form: current.forms?.get(k), state: current.states?.get(k) });
    }
    for (const k of check.mouths) {
      const pos = k.split(",").map(Number);
      const dom = policy.get(zoneOf(pos)) ?? fallback;
      const p = { op: "voxel", pos, block: namespaced(dom) };
      placements.push(p);
      cells.push({ pos, block: p.block });
    }
    current = occupancyFromCells(cells);
  }
  throw new Error(`plugClosure: shell not closed after ${maxIterations} iterations (${placements.length} plugs placed)`);
}
