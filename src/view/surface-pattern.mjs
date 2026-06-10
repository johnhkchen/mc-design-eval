// Surface-PATTERN ops (T-087-01, story S-087, epic E-24) — make an already watertight (S-084),
// base-coated (S-085) skin READ cleanly. Distinct from surface-coherence (geometric/topological
// watertightness) and zone-fill (dominant establishment): coverage ≠ a clean pattern. Two ops:
//
//   • regularizeRoofCourses — the roof's +y height field accreted dents/pits across passes and reads
//     as a chunky jumble, not the concept's regular stepped courses. Basin-fill to the hydrological
//     SPILL LEVEL (priority-flood from the map boundary): enclosed pits/basins are raised by ADDING
//     voxels in the roof dominant; real valleys DRAIN to an eave (spill = own height) and are never
//     filled; bumps/the chimney are never touched (filling only raises). courseMetrics is the recorded
//     regularity number.
//   • stripStraySalt — an isolated off-dominant block in a zone's dominant field (a lone cobble in a
//     plaster wall) is salt; a secondary that forms a RUN/LINE (a timber stud, the chimney shaft, eave
//     trim) is legit. zoneFill's minRun test is over the FULL occupancy (a skin speck with one buried
//     same-material neighbour survives — the witnessed defect); here the component is over the VISIBLE
//     SKIN and shape-aware: keep iff size ≥ minKeep AND max axis extent ≥ minExtent, else recolor to
//     the cell's zone dominant.
//
// RECOLOR + ADD ONLY, NEVER DELETE (`facade-recess-by-exclusion`): the artifact contract has no air op.
// Course placements are ADDS at empty cells; salt placements are RECOLORS at existing surface voxels —
// both appended `{op:"voxel"}` rows under expand's last-write-wins. Policy is data (zone names,
// dominants come from the caller); nothing cottage-specific lives here.
//
// PURE — no GL, no I/O, no model, no Date/random — runs under the `src/**/*.test.mjs` glob. The GL
// renders + the durable record live in the runner (benchmarks/sculpture/surface-pattern.mjs).

import { bareBlock, occupancyFromCells } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { surfaceVoxelEntries, FILL_FACES } from "./zone-fill.mjs";

/** Namespace a bare id for storage (placements are namespaced). */
function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/** Top height field of the +y projection: Map "x,z" → top y. The course ops' shared substrate. */
function topHeightMap(occ) {
  const ymap = new Map();
  if (!occ.bounds) return ymap;
  const grid = projectSurface(occ, "+y");
  for (const row of grid.cells) {
    for (const c of row) {
      if (!c) continue;
      const [x, y, z] = c.voxel;
      ymap.set(`${x},${z}`, y);
    }
  }
  return ymap;
}

const PLAN4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Minimal binary min-heap over [level, key] pairs (priority-flood working set). */
function heapPush(h, item) {
  h.push(item);
  let i = h.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (h[p][0] <= h[i][0]) break;
    [h[p], h[i]] = [h[i], h[p]];
    i = p;
  }
}
function heapPop(h) {
  const top = h[0];
  const last = h.pop();
  if (h.length) {
    h[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < h.length && h[l][0] < h[m][0]) m = l;
      if (r < h.length && h[r][0] < h[m][0]) m = r;
      if (m === i) break;
      [h[m], h[i]] = [h[i], h[m]];
      i = m;
    }
  }
  return top;
}

/**
 * Roof-course regularity of the +y height field: over all adjacent (+x, +z) column pairs, the counts of
 * flat (Δy=0), step-1 (Δy=1) and cliff (Δy>1) joints. `stepSmoothness` = (flat+step1)/pairs — regular
 * stepped courses meet their neighbours within one block; a chunky jumble does not. 1.0 is unreachable
 * on a real roof (legit gable/verge edges count as cliffs) — the number is for BEFORE/AFTER comparison,
 * not an absolute target. Empty/single-column maps are vacuously regular. ‰-rounded. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {{pairs:number, flat:number, step1:number, cliff:number, stepSmoothness:number, meanAbsStep:number}}
 */
export function courseMetrics(occ) {
  return metricsOfMap(topHeightMap(occ));
}

/** courseMetrics over a prebuilt height map (shared with the op's after-overlay measurement). */
function metricsOfMap(ymap) {
  let pairs = 0, flat = 0, step1 = 0, cliff = 0, sum = 0;
  for (const [k, y] of ymap) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [0, 1]]) {
      const n = ymap.get(`${x + dx},${z + dz}`);
      if (n === undefined) continue;
      pairs++;
      const d = Math.abs(y - n);
      sum += d;
      if (d === 0) flat++;
      else if (d === 1) step1++;
      else cliff++;
    }
  }
  return {
    pairs, flat, step1, cliff,
    stepSmoothness: pairs ? Math.round(((flat + step1) / pairs) * 1000) / 1000 : 1,
    meanAbsStep: pairs ? Math.round((sum / pairs) * 1000) / 1000 : 0,
  };
}

/**
 * REGULAR-COURSE OP: basin-fill the roof's +y height field to its hydrological spill level. Priority-
 * flood: columns missing a 4-neighbour are OUTLETS (water drains off them — map edges, eaves, notches),
 * seeded at their own height; popping the lowest frontier level outward-in, an interior column's level
 * is max(own height, the level it spills through). A column below its spill level is an enclosed defect
 * (a dent/pit the seal passes left) and is raised by ADDING voxels in `dominant`; a valley that drains
 * keeps its height by construction; bumps are never touched (no delete — the residual is honest).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{dominant:string}} opts the roof field material (from the zone policy — data, not a constant)
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[], columnsRaised:number,
 *            voxelsAdded:number, before:object, after:object}}
 */
export function regularizeRoofCourses(occ, { dominant } = {}) {
  if (typeof dominant !== "string" || dominant.length === 0) {
    throw new Error("regularizeRoofCourses: opts.dominant must be the roof field block id");
  }
  const ymap = topHeightMap(occ);
  const before = metricsOfMap(ymap);
  // priority-flood spill levels
  const level = new Map();
  const heap = [];
  for (const [k, y] of ymap) {
    const [x, z] = k.split(",").map(Number);
    if (PLAN4.some(([dx, dz]) => !ymap.has(`${x + dx},${z + dz}`))) {
      level.set(k, y);
      heapPush(heap, [y, k]);
    }
  }
  while (heap.length) {
    const [l, k] = heapPop(heap);
    if (level.get(k) !== l) continue; // stale entry
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of PLAN4) {
      const nk = `${x + dx},${z + dz}`;
      if (!ymap.has(nk) || level.has(nk)) continue;
      const nl = Math.max(ymap.get(nk), l);
      level.set(nk, nl);
      heapPush(heap, [nl, nk]);
    }
  }
  // raise each basin column to its spill level — adds only
  const placements = [];
  const raised = new Map(); // post-fill height map, for the after metrics
  let columnsRaised = 0;
  for (const [k, y] of ymap) {
    const spill = level.get(k) ?? y; // isolated single-column map: no neighbours, stays
    raised.set(k, Math.max(y, spill));
    if (spill <= y) continue;
    columnsRaised++;
    const [x, z] = k.split(",").map(Number);
    for (let yy = y + 1; yy <= spill; yy++) {
      placements.push({ op: "voxel", pos: [x, yy, z], block: namespaced(dominant) });
    }
  }
  return { placements, columnsRaised, voxelsAdded: placements.length, before, after: metricsOfMap(raised) };
}

const NEIGH6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/**
 * STRAY-SALT STRIP: per zone with a policy entry, judge every off-dominant VISIBLE-SKIN cell by the
 * PATTERN of its same-material skin component (6-connected over off-dominant skin cells, WHOLE-skin —
 * the chimney shaft crosses base→upper→roof and must be judged as one feature):
 *   keep  — component size ≥ minKeep AND max axis extent ≥ minExtent (a run/line: a stud, trim, the
 *           chimney);
 *   strip — anything smaller/blobbier (a lone speck, a 2×2 clump): recolor to the CELL's zone dominant.
 * Material legality was zoneFill's gate; this op judges pattern — a lawful material still strips when it
 * reads as salt. Zones absent from `zones` are untouched. RECOLOR-only. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{zoneOf:(voxel:number[])=>string, zones:Record<string,{dominant:string}>,
 *          faces?:string[], minKeep?:number, minExtent?:number}} opts
 * @returns {{placements:{op:"voxel",pos:number[],block:string}[], stripped:number, kept:number,
 *            byZone:Record<string,{offDominant:number, strippedCells:number, keptCells:number,
 *                                  byBlock:Record<string,{stripped:number,kept:number}>}>}}
 */
export function stripStraySalt(occ, { zoneOf, zones, faces = FILL_FACES, minKeep = 3, minExtent = 3 } = {}) {
  if (typeof zoneOf !== "function") throw new Error("stripStraySalt: opts.zoneOf must be a function");
  if (!zones || typeof zones !== "object") throw new Error("stripStraySalt: opts.zones must be a zone→policy map");
  const policy = new Map();
  for (const [zone, p] of Object.entries(zones)) {
    if (!p || typeof p.dominant !== "string") throw new Error(`stripStraySalt: zones.${zone}.dominant must be a bare block id`);
    policy.set(zone, bareBlock(p.dominant));
  }
  // the off-dominant skin: key → {voxel, bare, zone}
  const off = new Map();
  for (const { key, voxel, block } of surfaceVoxelEntries(occ, faces)) {
    const zone = zoneOf(voxel);
    const dom = policy.get(zone);
    if (dom === undefined) continue; // no policy — untouched
    const bare = bareBlock(block);
    if (bare !== dom) off.set(key, { voxel, bare, zone });
  }
  // same-material 6-connected components over the off-dominant skin; keep = run/line, strip = salt
  const placements = [];
  const byZone = {};
  const tally = (zone, bare, verdict, n = 1) => {
    const z = (byZone[zone] ??= { offDominant: 0, strippedCells: 0, keptCells: 0, byBlock: {} });
    const b = (z.byBlock[bare] ??= { stripped: 0, kept: 0 });
    z.offDominant += n;
    if (verdict === "strip") { z.strippedCells += n; b.stripped += n; } else { z.keptCells += n; b.kept += n; }
  };
  let stripped = 0, kept = 0;
  const seen = new Set();
  for (const [key, cell] of off) {
    if (seen.has(key)) continue;
    const comp = [key];
    seen.add(key);
    const stack = [key];
    while (stack.length) {
      const [x, y, z] = stack.pop().split(",").map(Number);
      for (const [dx, dy, dz] of NEIGH6) {
        const nk = `${x + dx},${y + dy},${z + dz}`;
        if (seen.has(nk)) continue;
        const n = off.get(nk);
        if (!n || n.bare !== cell.bare) continue;
        seen.add(nk);
        stack.push(nk);
        comp.push(nk);
      }
    }
    const pts = comp.map((k) => off.get(k));
    const extent = Math.max(...[0, 1, 2].map((a) => {
      let lo = Infinity, hi = -Infinity;
      for (const p of pts) { const v = p.voxel[a]; if (v < lo) lo = v; if (v > hi) hi = v; }
      return hi - lo + 1;
    }));
    const isRun = comp.length >= minKeep && extent >= minExtent;
    for (const p of pts) {
      tally(p.zone, p.bare, isRun ? "keep" : "strip");
      if (isRun) { kept++; continue; }
      stripped++;
      placements.push({ op: "voxel", pos: [...p.voxel], block: namespaced(policy.get(p.zone)) });
    }
  }
  return { placements, stripped, kept, byZone };
}

/** A NEW occupancy with `placements` overlaid (last-write-wins) — measure after-state without a
 *  re-render. Mirrors surface-coherence's overlay; local to keep the import graph flat. */
export function overlayPlacements(occ, placements) {
  const cells = [];
  for (const [k, b] of occ.cells) cells.push({ pos: k.split(",").map(Number), block: b });
  for (const p of placements) cells.push({ pos: [...p.pos], block: p.block });
  return occupancyFromCells(cells);
}
