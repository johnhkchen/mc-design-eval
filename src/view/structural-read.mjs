// Structural read — pure/geometric features of an occupancy (T-078-01, story S-078, epic E-23).
//
// The cottage face failed because 3-D feature space has NO STOREY AXIS (`twodee-interaction-sector`).
// This module extracts the architectural primitives the LLM needs to reason in a view: FOOTPRINT,
// STOREY BANDS (the shared primitive — S-079's plaster band start, S-081's floor heights), OPENING
// positions (doors/windows), ROOF REGION, and WALL FIELDS (S-084 consumes the last two to find stray
// materials + skin holes before hollowing). Everything is derived from the occupancy Map — NO GL, NO
// rendering — so it is unit-testable on synthetic occupancy.
//
// PURE — no GL, no I/O, no Date/random.

import { bareBlock, solidOccupancy } from "./occupancy.mjs";
import { projectSurface, gridMaskOf, orthoSpec } from "./surface-grid.mjs";

const SIDE_FACES = ["+x", "-x", "+z", "-z"];

/**
 * Ground-plane footprint: the set of (x,z) columns with any occupied voxel, its bbox, width, depth.
 * @returns {{cells:Set<string>, bbox:{minX,maxX,minZ,maxZ}|null, width:number, depth:number, area:number}}
 */
export function footprint(occ) {
  const cells = new Set();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const key of occ.cells.keys()) {
    const [x, , z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!cells.has(k)) {
      cells.add(k);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
  }
  if (cells.size === 0) return { cells, bbox: null, width: 0, depth: 0, area: 0 };
  const width = maxX - minX + 1;
  const depth = maxZ - minZ + 1;
  return { cells, bbox: { minX, maxX, minZ, maxZ }, width, depth, area: cells.size };
}

/**
 * Horizontal storey bands: scan y bottom→top, group consecutive layers by dominant exterior block, and
 * flag floor slabs (layers whose occupied/footprint fill exceeds `floorFillThreshold`). The storey line
 * is the shared primitive downstream stories build on.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{floorFillThreshold?:number}} [opts]
 * @returns {{bands:{yStart,yEnd,dominantBlock,fill}[], floorLines:number[]}}
 */
export function storeyBands(occ, { floorFillThreshold = 0.6 } = {}) {
  if (!occ.bounds) return { bands: [], floorLines: [] };
  const fp = footprint(occ);
  const fpArea = fp.area || 1;
  const { min, max } = occ.bounds;
  /** per-y: {count, dominant, fill} */
  const layers = [];
  for (let y = min[1]; y <= max[1]; y++) {
    const counts = new Map();
    let count = 0;
    for (const [key, blk] of occ.cells) {
      const parts = key.split(",");
      if (Number(parts[1]) !== y) continue;
      count++;
      const b = bareBlock(blk);
      counts.set(b, (counts.get(b) || 0) + 1);
    }
    let dominant = null, best = -1;
    for (const [b, c] of counts) if (c > best) { best = c; dominant = b; }
    layers.push({ y, count, dominant, fill: count / fpArea });
  }
  const floorLines = layers.filter((l) => l.fill >= floorFillThreshold).map((l) => l.y);
  // group consecutive layers by dominant block into bands
  const bands = [];
  for (const l of layers) {
    const cur = bands[bands.length - 1];
    if (cur && cur.dominantBlock === l.dominant) {
      cur.yEnd = l.y;
      cur._fillSum += l.fill;
      cur._n++;
    } else {
      bands.push({ yStart: l.y, yEnd: l.y, dominantBlock: l.dominant, _fillSum: l.fill, _n: 1 });
    }
  }
  return {
    bands: bands.map((b) => ({
      yStart: b.yStart, yEnd: b.yEnd, dominantBlock: b.dominantBlock,
      fill: Math.round((b._fillSum / b._n) * 1000) / 1000,
    })),
    floorLines,
  };
}

/** 4-connected air components of a binary mask, tagged with which borders they touch. PURE helper.
 *  Exported so the S-084 seal ops reuse the ONE enclosed-vs-border definition (`!top&&!bottom&&!left&&
 *  !right` = enclosed = a real interior hole, never a bbox corner) that `wallFields.holes` + `openings`
 *  already use — the detector→op contract cannot drift. */
export function airComponents(mask) {
  const { w, h, data } = mask;
  const seen = new Uint8Array(w * h);
  const comps = [];
  const stack = [];
  for (let sv = 0; sv < h; sv++) {
    for (let su = 0; su < w; su++) {
      const start = sv * w + su;
      if (data[start] || seen[start]) continue;
      // BFS/DFS over this air component
      stack.length = 0;
      stack.push(start);
      seen[start] = 1;
      const cellsUV = [];
      let u0 = Infinity, v0 = Infinity, u1 = -1, v1 = -1;
      const borders = { top: false, bottom: false, left: false, right: false };
      while (stack.length) {
        const idx = stack.pop();
        const u = idx % w, v = (idx - u) / w;
        cellsUV.push([u, v]);
        if (u < u0) u0 = u; if (u > u1) u1 = u;
        if (v < v0) v0 = v; if (v > v1) v1 = v;
        if (v === 0) borders.top = true;
        if (v === h - 1) borders.bottom = true;
        if (u === 0) borders.left = true;
        if (u === w - 1) borders.right = true;
        const nbrs = [idx - 1, idx + 1, idx - w, idx + w];
        // guard horizontal wrap
        if (u === 0) nbrs[0] = -1;
        if (u === w - 1) nbrs[1] = -1;
        for (const ni of nbrs) {
          if (ni < 0 || ni >= w * h || seen[ni] || data[ni]) continue;
          seen[ni] = 1;
          stack.push(ni);
        }
      }
      comps.push({ cellsUV, bbox: { u0, v0, u1, v1 }, borders });
    }
  }
  return comps;
}

/**
 * Opening positions on an orthographic elevation: air regions in the face mask, classified. An ENCLOSED
 * air region (touches no border) is a WINDOW; a region touching ONLY the ground (bottom) border is a
 * DOOR. Regions reaching the sky/side borders are ambient outside and dropped. Ortho dirs only.
 *
 * T-097-01: detection runs on the SOLID view (cube cells only), so a DRESSED opening — a fence or
 * trapdoor placed in the aperture — keeps its identity (the grammar and the interior checks need it).
 * Each opening reports its `dressing`: the non-solid occupied cells of `occ` whose (u,v) projection
 * falls inside the component. For cube-only builds the solid view IS `occ` (identity) and `dressing`
 * is always `{cells: 0, blocks: []}` — pre-fixture behavior unchanged.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {string} dir one of the side faces (or any ortho dir)
 * @param {{withCells?:boolean}} [opts] withCells additionally returns each opening's `cellsUV`
 *   (the aperture's air cells in grid (u,v) space) — the T-103 component lift needs the SHAPE
 *   (head profile, jambs), not just the bbox. Default path is byte-identical to before.
 * @returns {{bbox:{u0,v0,u1,v1}, kind:"door"|"window", cells:number,
 *            dressing:{cells:number, blocks:string[]}, cellsUV?:[number,number][]}[]}
 */
export function openings(occ, dir, { withCells = false } = {}) {
  if (!occ.bounds) return [];
  const solid = solidOccupancy(occ);
  if (!solid.bounds) return []; // all-fixture occupancy: no solid mask to find apertures in
  const grid = projectSurface(solid, dir); // throws on non-ortho/diag; openings are ortho-only by use
  const mask = gridMaskOf(grid);
  const comps = [];
  for (const c of airComponents(mask)) {
    const b = c.borders;
    const enclosed = !b.top && !b.bottom && !b.left && !b.right;
    const doorLike = b.bottom && !b.top && !b.left && !b.right;
    if (enclosed) comps.push({ bbox: c.bbox, kind: "window", cellsUV: c.cellsUV });
    else if (doorLike) comps.push({ bbox: c.bbox, kind: "door", cellsUV: c.cellsUV });
  }
  // dressing: project each non-solid occupied cell into the SOLID grid's (u,v) space and attribute it
  // to the component whose cells contain it. The uv inverse mirrors surface-grid's worldOnAxis.
  let dressingAt = null;
  if (solid !== occ && comps.length) {
    const spec = orthoSpec(dir);
    const { min, max } = solid.bounds;
    const uvOf = (pos) => {
      const wu = pos[spec.axisU];
      const wv = pos[spec.axisV];
      const u = spec.signU > 0 ? wu - min[spec.axisU] : max[spec.axisU] - wu;
      const v = spec.signV > 0 ? wv - min[spec.axisV] : max[spec.axisV] - wv;
      return [u, v];
    };
    dressingAt = new Map(); // "u,v" → block[]
    for (const key of occ.forms.keys()) {
      const pos = key.split(",").map(Number);
      const [u, v] = uvOf(pos);
      const k = `${u},${v}`;
      if (!dressingAt.has(k)) dressingAt.set(k, []);
      dressingAt.get(k).push(occ.cells.get(key));
    }
  }
  return comps.map((c) => {
    const blocks = [];
    if (dressingAt) {
      for (const [u, v] of c.cellsUV) {
        for (const blk of dressingAt.get(`${u},${v}`) ?? []) blocks.push(bareBlock(blk));
      }
    }
    const out = {
      bbox: c.bbox,
      kind: c.kind,
      cells: c.cellsUV.length,
      dressing: { cells: blocks.length, blocks: [...new Set(blocks)].sort() },
    };
    if (withCells) out.cellsUV = c.cellsUV.map(([u, v]) => [u, v]);
    return out;
  });
}

/**
 * Roof region: the top-exposed shell (the +y surface grid). `coverage` = filled top cells over the top
 * grid's bbox area — a gap in the roof drops it below 1.0 (S-084's →100% target). Per-cell block + the
 * highest-y range.
 * @returns {{cells:{x,z,y,block}[], yRange:[number,number]|null, coverage:number, area:number}}
 */
export function roofRegion(occ) {
  if (!occ.bounds) return { cells: [], yRange: null, coverage: 0, area: 0 };
  const top = projectSurface(occ, "+y");
  const cells = [];
  let yLo = Infinity, yHi = -Infinity;
  for (const row of top.cells) {
    for (const c of row) {
      if (!c) continue;
      const [x, y, z] = c.voxel;
      cells.push({ x, z, y, block: c.block });
      if (y < yLo) yLo = y;
      if (y > yHi) yHi = y;
    }
  }
  const area = top.n * top.m;
  return {
    cells,
    yRange: cells.length ? [yLo, yHi] : null,
    coverage: area ? Math.round((top.filled / area) * 1000) / 1000 : 0,
    area,
  };
}

/**
 * Wall fields: the four exterior elevations. Per face — surface cells (with block), candidate skin
 * HOLES (enclosed air inside the face silhouette: gaps S-084 must seal), and block tally (the field a
 * stray wrong-material block sits in). S-084 distinguishes intended openings from defects.
 * @returns {{faces: Record<string, {dir, surfaceCells:{u,v,voxel,block}[], holes:{u,v}[], blockCounts:object}>}}
 */
export function wallFields(occ) {
  const faces = {};
  for (const dir of SIDE_FACES) {
    if (!occ.bounds) { faces[dir] = { dir, surfaceCells: [], holes: [], blockCounts: {} }; continue; }
    const grid = projectSurface(occ, dir);
    const mask = gridMaskOf(grid);
    const surfaceCells = [];
    const blockCounts = Object.create(null);
    for (let v = 0; v < grid.m; v++) {
      for (let u = 0; u < grid.n; u++) {
        const c = grid.cells[v][u];
        if (!c) continue;
        surfaceCells.push({ u, v, voxel: c.voxel, block: c.block });
        const b = bareBlock(c.block);
        blockCounts[b] = (blockCounts[b] || 0) + 1;
      }
    }
    const holes = [];
    for (const comp of airComponents(mask)) {
      const b = comp.borders;
      if (!b.top && !b.bottom && !b.left && !b.right) {
        for (const [u, v] of comp.cellsUV) holes.push({ u, v });
      }
    }
    faces[dir] = { dir, surfaceCells, holes, blockCounts };
  }
  return { faces };
}

/**
 * The bundled structural read. Openings are exposed separately (per-direction) via {@link openings}.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object} [opts] forwarded to storeyBands
 */
export function structuralRead(occ, opts = {}) {
  return {
    footprint: footprint(occ),
    storeyBands: storeyBands(occ, opts),
    roofRegion: roofRegion(occ),
    wallFields: wallFields(occ),
  };
}

/**
 * Structural ZONES for material masking — classify a voxel into "base" | "upper" | "roof". The spray-
 * paint zone-mask gate (S-079 fix) consumes `zoneOf` so plaster lands in the upper storey ONLY; the
 * runner maps each zone → its allowed materials. Derived from GEOMETRY (floor lines + the top-exposed
 * roof shell), NOT the current dominant blocks — so it survives a material collapse (the raw cottage's
 * plaster has already collapsed to stone, so the dominant-block bands encode the wrong materials).
 *   • roof  — voxel is a {@link roofRegion} (+y top-exposed) cell. Membership, NOT a y-threshold: the
 *             pitched roof's y-range (low eaves … high ridge/chimney) overlaps the walls', so no single
 *             threshold separates them; membership is exact.
 *   • upper — not roof and y >= storeyDivide (the upper-storey wall band, plaster-eligible).
 *   • base  — y < storeyDivide (the lower stone base).
 * storeyDivide = floorLines[1] (the floor OF the upper storey = top of the base) when present, else
 * min y + baseHeight.
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{storeyDivide?:number, baseHeight?:number, floorFillThreshold?:number}} [opts]
 * @returns {{zoneOf:(voxel:number[])=>("base"|"upper"|"roof"), storeyDivide:number,
 *            roofKeys:Set<string>, floorLines:number[]}}
 */
export function structuralZones(occ, opts = {}) {
  const region = roofRegion(occ);
  const roofKeys = new Set(region.cells.map((c) => `${c.x},${c.y},${c.z}`));
  const { floorLines } = storeyBands(occ, opts);
  const minY = occ.bounds ? occ.bounds.min[1] : 0;
  const storeyDivide = opts.storeyDivide ??
    (floorLines.length >= 2 ? floorLines[1] : minY + (opts.baseHeight ?? 6));
  // TOP of the upper storey (the eave line) — the floor line ABOVE storeyDivide, else a storey's height up.
  // Bounding "upper" above by GEOMETRY is essential: roofRegion under-covers a noisy pitched roof
  // (coverage < 1), so relying on roof MEMBERSHIP alone leaks plaster up into the gable. The eave line is
  // immune to the material collapse (it's a floor-slab geometry signal), unlike the dominant-block bands.
  const upperTop = opts.upperTop ??
    (floorLines.length >= 3 ? floorLines[floorLines.length - 1] : storeyDivide + (opts.storeyHeight ?? 7));
  // T-150-01: gable-end walls (vertical triangular faces) sit above the eave but are wall envelope,
  // not roof covering — classify them by storey BEFORE the roof rule. Default empty ⇒ legacy.
  const gableWallKeys = opts.gableWallKeys instanceof Set ? opts.gableWallKeys : new Set();
  const zoneOf = (voxel) => {
    const [x, y, z] = voxel;
    const key = `${x},${y},${z}`;
    if (gableWallKeys.has(key)) return y >= storeyDivide ? "upper" : "base";
    if (y >= upperTop || roofKeys.has(key)) return "roof";
    return y >= storeyDivide ? "upper" : "base";
  };
  return { zoneOf, storeyDivide, upperTop, roofKeys, floorLines };
}
