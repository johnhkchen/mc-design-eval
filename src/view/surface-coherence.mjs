// Surface-coherence ops — the program path for the witnessed surface defects (T-084-01, story S-084,
// epic E-23). PREREQUISITE FOR A SAFE HOLLOW (T-080-01): you cannot enclose an interior behind a hole-y
// wall.
//
// Three deterministic ops over an occupancy (T-078-01), distinct from E-18's COLOR speckle — these are
// GEOMETRIC/TOPOLOGICAL coherence:
//   • sealRoof      — strip stray non-roof blocks + seal roof holes → the roof reads 100% in one material.
//   • sealWalls     — strip wrong-material "random homes" intrusions + seal skin holes in a wall field.
//   • watertightCheck — flood-fill from OUTSIDE the bbox: can it reach the interior? (the T-080-01 invariant)
//
// NO AIR OP (`facade-recess-by-exclusion`): a STRIP is a RECOLOR (append a `{op:"voxel"}` at the existing
// surface voxel — `expandArtifact` last-write-wins overrides the block without touching geometry); a SEAL
// is an ADDED voxel (new geometry). We never delete. Sealing only ever places the dominant/field material,
// already in the manifest, so the appended placements stay AJV-valid. Hole = ENCLOSED air component (the
// one definition `structural-read.airComponents` gives — never a bbox corner). Back-projection of a hole
// to a world pos is ORTHO-only (the +y roof, the four side faces); diagonals are out (`orthoSpec` throws).
//
// PURE — no GL, no I/O, no model, no Date/random — runs under the `src/**/*.test.mjs` glob. The metered
// detector calls + the GL renders live in the runner (benchmarks/sculpture/_archive/surface-coherence.mjs).

import { projectSurface, gridMaskOf, orthoSpec, cellWorldPos } from "./surface-grid.mjs";
import { airComponents, roofRegion } from "./structural-read.mjs";
import { occupancyFromCells, bareBlock } from "./occupancy.mjs";
import { voxelKey } from "../expand.mjs";

/** The four exterior elevations sealWalls folds over. */
export const SIDE_FACES = Object.freeze(["+x", "-x", "+z", "-z"]);

/** 6-connected orthogonal neighbour offsets for the watertight flood. */
const NEIGH6 = Object.freeze([
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
]);

/** Namespace a bare id back to `minecraft:` form for storage (placements + manifest are namespaced). */
function namespaced(id) {
  return typeof id === "string" && !id.includes(":") ? `minecraft:${id}` : id;
}

/** Most-common bare block over a list of cells carrying `.block`. PURE. */
function dominantBlock(cells) {
  const counts = new Map();
  for (const c of cells) {
    const b = bareBlock(c.block);
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  let dom = null, best = -1;
  for (const [b, n] of counts) if (n > best) { best = n; dom = b; }
  return dom;
}

/** Flat list of an ortho grid's filled SurfaceCells. */
function filledCells(grid) {
  const out = [];
  for (const row of grid.cells) for (const c of row) if (c) out.push(c);
  return out;
}

/** Enclosed-hole cells of a projected grid: the `(u,v)` of every air component that touches NO border
 *  (a real interior gap in the skin, never a bbox corner). Reuses the ONE `airComponents` definition. */
function enclosedHoleCells(grid) {
  const out = [];
  for (const comp of airComponents(gridMaskOf(grid))) {
    const b = comp.borders;
    if (!b.top && !b.bottom && !b.left && !b.right) for (const [u, v] of comp.cellsUV) out.push({ u, v });
  }
  return out;
}

/** Face INTRUSIONS — the "random homes": surface cells whose block ≠ `field` AND that are EMBEDDED in the
 *  field (a strict majority of present 4-neighbours are the field material). This preserves coherent
 *  multi-material BANDS (Tudor timber courses, a cobble foundation — a cell whose neighbours share its
 *  material is kept) and strips only the isolated specks the witnessed defect described. NOT "every
 *  non-dominant cell": a polychrome wall is intentional, so the field is a context, not a monolith. PURE. */
function faceIntrusions(grid, field) {
  const out = [];
  for (let v = 0; v < grid.m; v++) {
    for (let u = 0; u < grid.n; u++) {
      const c = grid.cells[v][u];
      if (!c || bareBlock(c.block) === field) continue;
      let present = 0, fieldN = 0;
      for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nu = u + du, nv = v + dv;
        if (nv < 0 || nv >= grid.m || nu < 0 || nu >= grid.n) continue;
        const n = grid.cells[nv][nu];
        if (!n) continue;
        present++;
        if (bareBlock(n.block) === field) fieldN++;
      }
      if (present > 0 && fieldN * 2 > present) out.push(c); // strict-majority field → embedded speck
    }
  }
  return out;
}

/** World depth coordinate (axisW) to seal a hole at: the front-most (min-depth) filled 4-neighbour's W,
 *  so the seal sits FLUSH with the surrounding skin (not at a global roof height that a sloped/eaved roof
 *  would miss). `null` when the cell has no filled neighbour (cannot happen for an enclosed hole). */
function neighbourDepthW(grid, spec, u, v) {
  let best = null;
  for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nu = u + du, nv = v + dv;
    if (nv < 0 || nv >= grid.m || nu < 0 || nu >= grid.n) continue;
    const c = grid.cells[nv][nu];
    if (c && (best === null || c.depth < best.depth)) best = c;
  }
  return best ? best.voxel[spec.axisW] : null;
}

/**
 * A NEW occupancy with `deltas` (recolors + fills) overlaid. `occupancyFromCells` is last-write-wins, so a
 * recolor at an existing pos replaces the block and a fill at an empty pos adds geometry — the same
 * semantics `applyDeltas` + `expandArtifact` produce on the artifact. Used to MEASURE before/after without
 * a re-render. PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{op:string,pos:number[],block:string}[]} deltas
 * @returns {import("./occupancy.mjs").Occupancy}
 */
export function overlay(occ, deltas) {
  const cells = [];
  for (const [k, b] of occ.cells) cells.push({ pos: k.split(",").map(Number), block: b });
  for (const d of deltas) cells.push({ pos: [...d.pos], block: d.block });
  return occupancyFromCells(cells);
}

/**
 * Append recolor/fill placements to an artifact (shallow clone). Geometry of existing voxels is untouched;
 * under `expandArtifact` last-write-wins a recolor overrides the block at its pos and a fill adds a voxel.
 * Mirrors `face-paint.applyPaint`. Does NOT validate. PURE.
 * @param {object} artifact
 * @param {{op:string,pos:number[],block:string}[]} deltas
 * @returns {object} cloned artifact with deltas appended
 */
export function applyDeltas(artifact, deltas) {
  return { ...artifact, placements: [...artifact.placements, ...deltas] };
}

/** Roof-OUTLINE coverage in [0,1]: filled top cells over (filled ∪ enclosed holes). Coverage over the
 *  roof outline, NOT the +y bbox grid (which counts non-roof corners as gaps). → 1.0 once holes are
 *  sealed. PURE. */
export function roofOutlineCoverage(occ) {
  if (!occ.bounds) return 0;
  const grid = projectSurface(occ, "+y");
  const outline = grid.filled + enclosedHoleCells(grid).length;
  return outline ? Math.round((grid.filled / outline) * 1000) / 1000 : 0;
}

/** Count roof surface cells whose block ≠ `field` (the strays), over the +y projection. PURE. */
function roofStrayCount(occ, field) {
  if (!occ.bounds) return 0;
  let n = 0;
  for (const c of filledCells(projectSurface(occ, "+y"))) if (bareBlock(c.block) !== field) n++;
  return n;
}

/**
 * WATERTIGHT ROOF OP. Strip stray non-roof blocks (recolor → the dominant roof material) and seal roof
 * holes (fill the enclosed +y gaps with the roof material at the neighbour-flush height). Result: the roof
 * reads 100% in one material with no openings.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{dominant?:string, strip?:{x:number,z:number}[]}} [opts]
 *   `dominant` forces the roof material (else the most-common roof block); `strip` restricts which
 *   stray (x,z) columns are recolored (else ALL non-dominant roof cells — the detector flags the set).
 * @returns {{field:string|null, placements:object[], stripped:number, filled:number,
 *   before:{coverage:number,strayCount:number}, after:{coverage:number,strayCount:number}}}
 */
export function sealRoof(occ, { dominant, strip } = {}) {
  if (!occ.bounds) {
    return { field: null, placements: [], stripped: 0, filled: 0,
      before: { coverage: 0, strayCount: 0 }, after: { coverage: 0, strayCount: 0 } };
  }
  const spec = orthoSpec("+y");
  const grid = projectSurface(occ, "+y");
  const region = roofRegion(occ);
  const field = dominant ? bareBlock(dominant) : dominantBlock(region.cells);
  const stripSet = strip ? new Set(strip.map((p) => `${p.x},${p.z}`)) : null;
  const placements = [];
  let stripped = 0, filled = 0;

  // strip strays — recolor the front-most roof voxel to the field material (no geometry change)
  for (const c of filledCells(grid)) {
    if (bareBlock(c.block) === field) continue;
    const [x, , z] = c.voxel;
    if (stripSet && !stripSet.has(`${x},${z}`)) continue;
    placements.push({ op: "voxel", pos: [...c.voxel], block: namespaced(field) });
    stripped++;
  }
  // seal holes — add a roof voxel at each enclosed +y gap, flush with its neighbours
  for (const { u, v } of enclosedHoleCells(grid)) {
    const w = neighbourDepthW(grid, spec, u, v);
    if (w === null) continue;
    placements.push({ op: "voxel", pos: cellWorldPos(occ, spec, u, v, w), block: namespaced(field) });
    filled++;
  }

  const after = overlay(occ, placements);
  return {
    field, placements, stripped, filled,
    before: { coverage: roofOutlineCoverage(occ), strayCount: roofStrayCount(occ, field) },
    after: { coverage: roofOutlineCoverage(after), strayCount: roofStrayCount(after, field) },
  };
}

/**
 * COHERENT WALL-SKIN OP for one elevation. Strip wrong-material intrusions (recolor → the field material)
 * and seal enclosed skin holes (fill at the neighbour-flush depth). Intended openings are AIR (no front
 * voxel), so they are never recolored — the op cannot accidentally fill a window.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {string} dir one of {@link SIDE_FACES}
 * @param {{fieldMaterial?:string, strip?:string[]}} [opts]
 *   `fieldMaterial` forces the field block (else the face's dominant); `strip` = voxelKeys to restrict the
 *   intrusion set (else ALL non-field surface cells).
 * @returns {{dir:string, field:string|null, placements:object[], stripped:number, sealed:number,
 *   before:{intrusions:number,holes:number}, after:{intrusions:number,holes:number}}}
 */
export function sealWallFace(occ, dir, { fieldMaterial, strip } = {}) {
  if (!occ.bounds) {
    return { dir, field: null, placements: [], stripped: 0, sealed: 0,
      before: { intrusions: 0, holes: 0 }, after: { intrusions: 0, holes: 0 } };
  }
  const spec = orthoSpec(dir);
  const grid = projectSurface(occ, dir);
  const field = fieldMaterial ? bareBlock(fieldMaterial) : dominantBlock(filledCells(grid));
  const stripSet = strip ? new Set(strip) : null;
  const placements = [];
  let stripped = 0, sealed = 0;

  // strip intrusions — the embedded specks (default), or the detector-supplied `strip` set ∩ them
  for (const c of faceIntrusions(grid, field)) {
    if (stripSet && !stripSet.has(voxelKey(c.voxel))) continue;
    placements.push({ op: "voxel", pos: [...c.voxel], block: namespaced(field) });
    stripped++;
  }
  for (const { u, v } of enclosedHoleCells(grid)) {
    const w = neighbourDepthW(grid, spec, u, v);
    if (w === null) continue;
    placements.push({ op: "voxel", pos: cellWorldPos(occ, spec, u, v, w), block: namespaced(field) });
    sealed++;
  }

  const after = overlay(occ, placements);
  return {
    dir, field, placements, stripped, sealed,
    before: faceCoherence(occ, dir, field),
    after: faceCoherence(after, dir, field),
  };
}

/** {intrusions, holes} for one face against `field`: embedded-speck intrusions + enclosed skin holes. */
function faceCoherence(occ, dir, field) {
  if (!occ.bounds) return { intrusions: 0, holes: 0 };
  const grid = projectSurface(occ, dir);
  return { intrusions: faceIntrusions(grid, field).length, holes: enclosedHoleCells(grid).length };
}

/**
 * COHERENT WALL-SKIN OP over all four elevations. Folds {@link sealWallFace}, de-duplicating placements by
 * `voxelKey` so a corner voxel shared by two faces is sealed/recolored ONCE (last-write-wins, mirroring
 * `mergePaints`). PURE.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{fieldMaterial?:string}} [opts]
 * @returns {{faces:object[], placements:object[], stripped:number, sealed:number}}
 */
export function sealWalls(occ, { fieldMaterial } = {}) {
  const faces = [];
  const byKey = new Map();
  for (const dir of SIDE_FACES) {
    const r = sealWallFace(occ, dir, { fieldMaterial });
    faces.push({ dir: r.dir, field: r.field, stripped: r.stripped, sealed: r.sealed, before: r.before, after: r.after });
    for (const p of r.placements) byKey.set(voxelKey(p.pos), p); // corner sealed once
  }
  const placements = [...byKey.values()];
  return {
    faces, placements,
    stripped: faces.reduce((n, f) => n + f.stripped, 0),
    sealed: faces.reduce((n, f) => n + f.sealed, 0),
  };
}

/** Keys of the ENCLOSED MASS — voxels with all six orthogonal neighbours occupied (the carveable bulk a
 *  hollow would remove). Mirrors `hollowable-mass.hollowableCore`'s rule, but returns the KEYS so the
 *  watertight flood can treat them as the simulated cavity. Exported as the SINGLE enclosed-mass definition
 *  the T-080-01 carve (`hollow-carve.mjs`) reuses — one rule, no third copy. PURE. */
export function enclosedMassKeys(occ) {
  const keys = new Set();
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (
      occ.has(x + 1, y, z) && occ.has(x - 1, y, z) &&
      occ.has(x, y + 1, z) && occ.has(x, y - 1, z) &&
      occ.has(x, y, z + 1) && occ.has(x, y, z - 1)
    ) keys.add(key);
  }
  return keys;
}

/** 6-ray containment: an air cell is INTERIOR iff every one of the 6 axis rays to the bbox boundary hits
 *  at least one occupied cell. Breach-TOLERANT — a single skin hole removes occlusion on only one ray for
 *  the cells in its column, so the rest of the interior stays classified. This is the leak-detection
 *  interior; it does NOT rely on connectivity (a hole would otherwise erase an enclosed-pocket signal).
 *  `occAt` is the (possibly carved) occupancy oracle; `min/max` the original bbox. */
function rayInteriorAir(occAt, min, max) {
  const inBox = (x, y, z) => x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2];
  const rayHits = (x, y, z, dx, dy, dz) => {
    let cx = x + dx, cy = y + dy, cz = z + dz;
    while (inBox(cx, cy, cz)) { if (occAt(cx, cy, cz)) return true; cx += dx; cy += dy; cz += dz; }
    return false;
  };
  const interior = new Set();
  for (let x = min[0]; x <= max[0]; x++) {
    for (let y = min[1]; y <= max[1]; y++) {
      for (let z = min[2]; z <= max[2]; z++) {
        if (occAt(x, y, z)) continue; // only air cells can be interior void
        let enclosed = true;
        for (const [dx, dy, dz] of NEIGH6) if (!rayHits(x, y, z, dx, dy, dz)) { enclosed = false; break; }
        if (enclosed) interior.add(`${x},${y},${z}`);
      }
    }
  }
  return interior;
}

/**
 * WATERTIGHT SHELL CHECK (the T-080-01 invariant). Simulate the hollow — carve the `interior` mass to AIR
 * — classify the INTERIOR VOID by 6-ray containment, then flood-fill exterior air from the PADDED bbox
 * boundary (6-connected; occupied cells block). The shell is watertight iff the exterior flood reaches
 * NONE of the interior void: a flood from outside the bounding box cannot reach any interior cell.
 *
 * `interior` (the carve set) defaults to the ENCLOSED MASS the hollow op removes, which turns a solid build
 * into a shell-with-cavity so the void exists to test; a build that is already hollow needs no carve (its
 * void is classified directly). A skin breach lets the exterior flood reach the void → fail. Ray-based
 * containment (not connectivity) is what makes a single hole DETECTABLE rather than silently erasing the
 * void. Consumes occupancy only — an honest verdict independent of the seal ops.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{interior?:Set<string>|Iterable<string>, padding?:number, maxBreaches?:number}} [opts]
 * @returns {{watertight:boolean, interiorCells:number, reached:number, breaches:string[]}}
 */
export function watertightCheck(occ, { interior, padding = 1, maxBreaches = 16 } = {}) {
  if (!occ.bounds) return { watertight: true, interiorCells: 0, reached: 0, breaches: [] };
  const carve = interior ? (interior instanceof Set ? interior : new Set(interior)) : enclosedMassKeys(occ);
  const { min, max } = occ.bounds;
  // The carved occupancy: occupied iff occ.has AND not carved (carve = simulated cavity = air).
  const occAt = (x, y, z) => occ.has(x, y, z) && !carve.has(`${x},${y},${z}`);

  const interiorAir = rayInteriorAir(occAt, min, max);

  // Flood exterior air from the padded boundary; occupied (post-carve) cells block.
  const lo = [min[0] - padding, min[1] - padding, min[2] - padding];
  const hi = [max[0] + padding, max[1] + padding, max[2] + padding];
  const visited = new Set();
  const stack = [];
  const seed = (x, y, z) => {
    const k = `${x},${y},${z}`;
    if (!visited.has(k) && !occAt(x, y, z)) { visited.add(k); stack.push([x, y, z]); }
  };
  for (let x = lo[0]; x <= hi[0]; x++) for (let z = lo[2]; z <= hi[2]; z++) { seed(x, lo[1], z); seed(x, hi[1], z); }
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

  let reached = 0;
  const breaches = [];
  for (const k of interiorAir) {
    if (visited.has(k)) { reached++; if (breaches.length < maxBreaches) breaches.push(k); }
  }
  return { watertight: reached === 0, interiorCells: interiorAir.size, reached, breaches };
}
