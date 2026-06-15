// Wall generator — recognized footprint + storey/eave → a clean CONSTRUCTED wall envelope (T-160-01,
// story S-160, epic E-38). The walls analogue of roof-generate.mjs: "constructs, not blobs" / the
// stage's REPLACE-BEATS-PATCH lesson. The GLB-voxelized walls are ragged hollow shells (~20–32% column
// fill) with MISSING perimeter columns no hole-fill can add — `seal_walls` (the patch tool) only fills
// air WITHIN columns that already exist, so the cottage plateaus. This brush instead:
//   1. reads the wall-band column set from the occupancy (already in the build's coordinate frame),
//   2. morphologically CLOSES it (repairs ragged notches / missing columns), takes the PERIMETER ring,
//   3. SOLIDIFIES that ring floor→eave in each column's own material (local zoning preserved),
//   4. cuts a REGULAR opening rhythm (windows + a door) parameterized by the RECOGNIZED program
//      (counts/storeys — frame-INDEPENDENT), with a derived fallback when no program is supplied.
//
// FOOTPRINT GEOMETRY comes from the occupancy (aligned by construction); RECOGNITION supplies the
// opening RHYTHM only. The program rect is 0-based and does NOT register to the build's negative-coord
// frame (T-160-01 research) — so we deliberately use the program's frame-independent fields
// (openings[].{wall,count,w,h,sill}, storeyHeight), NOT its absolute x0/z0. Absolute-footprint
// registration is the named follow-up if envelope watertightness turns out not to be the cottage's gate.
//
// PURE — no GL, no I/O, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { occupancyFromCells } from "./occupancy.mjs";

const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Dilate a "x,z" column set by a Manhattan ball of radius r. */
function dilate(set, r) {
  const o = new Set();
  for (const c of set) {
    const [x, z] = c.split(",").map(Number);
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.abs(dx) + Math.abs(dz) <= r) o.add(`${x + dx},${z + dz}`);
    }
  }
  return o;
}

/** Erode a "x,z" column set by a Manhattan ball of radius r. */
function erode(set, r) {
  const o = new Set();
  for (const c of set) {
    const [x, z] = c.split(",").map(Number);
    let ok = true;
    for (let dx = -r; dx <= r && ok; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > r) continue;
      if (!set.has(`${x + dx},${z + dz}`)) { ok = false; break; }
    }
    if (ok) o.add(c);
  }
  return o;
}

/**
 * Morphological CLOSE of a "x,z" column set: dilate then erode by a Manhattan ball of radius r. Bridges
 * ragged 1-wide notches and missing-column gaps up to ~r while leaving genuine large concavities (an
 * L-notch wider than the structuring element) OPEN — so massing is preserved, not bbox-filled. PURE.
 */
export function closeColumns(cols, r = 2) {
  return erode(dilate(cols, r), r);
}

/** The PERIMETER ring of a "x,z" column set: every column with ≥1 four-neighbour OUTSIDE the set. PURE. */
export function perimeterColumns(F) {
  const out = new Set();
  for (const c of F) {
    const [x, z] = c.split(",").map(Number);
    for (const [dx, dz] of NB4) if (!F.has(`${x + dx},${z + dz}`)) { out.add(c); break; }
  }
  return out;
}

/**
 * Evenly-spaced integer positions for `count` openings along the inclusive range [lo,hi], centred, kept
 * off the two corner columns, with a minimum gap so apertures never merge. Returns ⊆ [lo+1,hi-1],
 * strictly increasing; clamps (drops the overflow) when `count` cannot fit. PURE.
 */
export function spaceOpenings(lo, hi, count) {
  if (count <= 0 || hi <= lo) return [];
  const inLo = lo + 1, inHi = hi - 1;
  if (inHi < inLo) return count >= 1 ? [Math.round((lo + hi) / 2)] : [];
  const span = inHi - inLo;
  const out = [];
  let prev = -Infinity;
  for (let i = 0; i < count; i++) {
    const raw = inLo + Math.round(((i + 0.5) * span) / count);
    const p = Math.max(prev + 2, Math.min(inHi, raw));
    if (p > inHi) break; // no room left — drop the overflow rather than overlap
    out.push(p);
    prev = p;
  }
  return out;
}

/** Bounding rect {x0,x1,z0,z1} of a "x,z" column set (null when empty). */
function bboxOf(cols) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const c of cols) {
    const [x, z] = c.split(",").map(Number);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
  }
  return Number.isFinite(x0) ? { x0, x1, z0, z1 } : null;
}

/**
 * THE BRUSH. Replace the wall envelope of `occ` with a clean constructed ring and a regular opening
 * rhythm; keep the roof (above eave) and any interior cells verbatim. `occ → occ`. PURE.
 *
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {object} params
 * @param {number} [params.floor]   band bottom (default occ.bounds.min[1])
 * @param {number} params.eaveY     band top (wall→roof divide)
 * @param {object|null} [params.program]  building-program/v1 object (frame-independent fields used) or null
 * @param {string} [params.wallField="stone_bricks"]  last-resort fill when a column has no local material
 * @param {number} [params.closeR=2]        morphological-close radius
 * @param {number} [params.windowPeriod=4]  derived-rhythm window spacing when no program
 * @param {string} [params.doorWall="+z"]   default door face
 */
export function constructWalls(occ, params = {}) {
  if (!occ.bounds) return occ;
  const floor = params.floor ?? occ.bounds.min[1];
  const eave = params.eaveY;
  if (eave === undefined) throw new Error("constructWalls: eaveY required");
  const wallField = params.wallField ?? "stone_bricks";
  const closeR = params.closeR ?? 2;
  const windowPeriod = params.windowPeriod ?? 4;
  const doorWall = params.doorWall ?? "+z";
  const ns = (b) => (b && b.startsWith("minecraft:") ? b : `minecraft:${wallField}`);

  // 1. wall-band column histogram (LOCAL zoning) + global modal fill
  const colHist = new Map();
  const globalBc = new Map();
  for (const [k, b] of occ.cells) {
    const [x, y, z] = k.split(",").map(Number);
    if (y < floor || y > eave) continue;
    const c = `${x},${z}`;
    if (!colHist.has(c)) colHist.set(c, new Map());
    const m = colHist.get(c); m.set(b, (m.get(b) || 0) + 1);
    globalBc.set(b, (globalBc.get(b) || 0) + 1);
  }
  const cols = new Set(colHist.keys());
  if (cols.size === 0) return occ; // nothing to construct from
  const globalFill = [...globalBc].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ns(null);
  const localFill = (c) => { const m = colHist.get(c); return m ? [...m].sort((a, b) => b[1] - a[1])[0][0] : globalFill; };

  // 2. regularize footprint → perimeter ring (adds the MISSING columns seal_walls can't reach)
  const F = new Set([...cols, ...closeColumns(cols, closeR)]);
  const ring = perimeterColumns(F);
  const bbox = bboxOf(F);

  // 3. REPLACE: drop every band cell in a ring column, then solidify the ring floor→eave in its material
  const cellMap = new Map(occ.cells);
  for (const c of ring) {
    const [x, z] = c.split(",").map(Number);
    for (let y = floor; y <= eave; y++) cellMap.delete(`${x},${y},${z}`);
  }
  for (const c of ring) {
    const [x, z] = c.split(",").map(Number);
    const f = localFill(c);
    for (let y = floor; y <= eave; y++) cellMap.set(`${x},${y},${z}`, f);
  }

  // 4. opening rhythm — carve only within ring columns
  const carve = (x, z, y0, y1) => { if (ring.has(`${x},${z}`)) for (let y = y0; y <= y1; y++) cellMap.delete(`${x},${y},${z}`); };
  // face → fixed coord + the free axis the openings run along
  const faceAt = (wall) => {
    switch (wall) {
      case "+x": return { axis: "z", fixed: bbox.x1, lo: bbox.z0, hi: bbox.z1 };
      case "-x": return { axis: "z", fixed: bbox.x0, lo: bbox.z0, hi: bbox.z1 };
      case "+z": return { axis: "x", fixed: bbox.z1, lo: bbox.x0, hi: bbox.x1 };
      case "-z": return { axis: "x", fixed: bbox.z0, lo: bbox.x0, hi: bbox.x1 };
      default: return null;
    }
  };
  const carveGroup = (wall, count, w, h, sill) => {
    const f = faceAt(wall);
    if (!f) return;
    const y0 = floor + Math.max(0, sill | 0);
    const y1 = Math.min(eave, y0 + Math.max(1, h | 0) - 1);
    for (const p of spaceOpenings(f.lo, f.hi, count)) {
      for (let dw = 0; dw < Math.max(1, w | 0); dw++) {
        const u = p + dw;
        if (f.axis === "x") carve(u, f.fixed, y0, y1); else carve(f.fixed, u, y0, y1);
      }
    }
  };

  if (params.program?.masses?.length) {
    // RHYTHM-FROM-RECOGNITION: every mass's opening groups feed the shared envelope faces. Door groups
    // (sill 0) seat at the floor; windows at floor+sill. Absolute program coords are intentionally unused.
    for (const mass of params.program.masses) {
      for (const op of mass.openings ?? []) {
        const isDoor = op.kind === "door";
        carveGroup(op.wall, op.count ?? 1, op.w ?? 1, op.h ?? 2, isDoor ? 0 : (op.sill ?? 1));
      }
    }
  } else {
    // DERIVED FALLBACK (no program — e.g. gatehouse): a 1×2 window every `windowPeriod` on all four
    // faces + one 1×3 door at the front. Deterministic; the same rhythm seal_walls used.
    const wy0 = Math.max(floor + 1, eave - 4), wy1 = wy0 + 1;
    for (let x = bbox.x0 + 1; x < bbox.x1; x++) if ((x - bbox.x0) % windowPeriod === 0) { carve(x, bbox.z0, wy0, wy1); carve(x, bbox.z1, wy0, wy1); }
    for (let z = bbox.z0 + 1; z < bbox.z1; z++) if ((z - bbox.z0) % windowPeriod === 0) { carve(bbox.x0, z, wy0, wy1); carve(bbox.x1, z, wy0, wy1); }
    const df = faceAt(doorWall);
    if (df) { const mid = Math.round((df.lo + df.hi) / 2); if (df.axis === "x") carve(mid, df.fixed, floor, floor + 2); else carve(df.fixed, mid, floor, floor + 2); }
  }

  // 5. rebuild occupancy, preserving state on kept cells (fixtures, stairs/slabs above the eave)
  const cellList = [];
  for (const [k, b] of cellMap) {
    cellList.push({ pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) });
  }
  return occupancyFromCells(cellList);
}
