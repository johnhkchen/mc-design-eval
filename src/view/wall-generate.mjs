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
 * Robust per-axis extent of a "x,z" column set. `raw` is the literal min/max bbox; the top-level
 * {x0,x1,z0,z1} are the PERCENTILE bbox (trim a lone outlier post that overshoots the wall line — the
 * glb-end-fit anchor-window lesson). `polluted` is true when raw and robust differ by >1 cell on any axis
 * (the failure-mode-(a) flag the T-160-04 claim names). Defaults (pLo 0, pHi 1) reproduce the raw bbox, so
 * the percentile path is opt-in. PURE.
 */
export function robustExtent(cols, { pLo = 0, pHi = 1 } = {}) {
  const xs = [], zs = [];
  for (const c of cols) { const [x, z] = c.split(",").map(Number); xs.push(x); zs.push(z); }
  if (xs.length === 0) return null;
  xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
  const at = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.round(p * (arr.length - 1))))];
  const raw = { x0: xs[0], x1: xs[xs.length - 1], z0: zs[0], z1: zs[zs.length - 1] };
  const rob = { x0: at(xs, pLo), x1: at(xs, pHi), z0: at(zs, pLo), z1: at(zs, pHi) };
  const polluted = Math.abs(rob.x0 - raw.x0) > 1 || Math.abs(rob.x1 - raw.x1) > 1
    || Math.abs(rob.z0 - raw.z0) > 1 || Math.abs(rob.z1 - raw.z1) > 1;
  return { ...rob, raw, robust: { ...rob }, polluted };
}

/**
 * Coverage of a candidate perimeter `ring` over the actual wall-band `cols`: the fraction of real columns
 * that lie within Manhattan `tol` of the ring. The posts ARE the perimeter of a hollow shell, so a ring
 * that traces the real posts scores ~1; a ring too big (posts sit well inside) or too small (posts sit
 * outside) scores low — both over- and under-shoot are penalized with no tuned SIZE constant (tol=1 is one
 * voxel of adjacency, a unit not a knob). Returns 0 on empty `cols`. PURE.
 */
export function coverageOf(ring, cols, tol = 1) {
  if (!cols || cols.size === 0) return 0;
  let hit = 0;
  for (const c of cols) {
    const [x, z] = c.split(",").map(Number);
    let near = false;
    for (let dx = -tol; dx <= tol && !near; dx++) for (let dz = -tol; dz <= tol; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > tol) continue;
      if (ring.has(`${x + dx},${z + dz}`)) { near = true; break; }
    }
    if (near) hit++;
  }
  return hit / cols.size;
}

/**
 * CLOSURE of a "x,z" ring: the fraction of its own bbox-rectangle perimeter that the ring actually
 * occupies. A clean watertight rectangle scores 1; a COLONNADE (a ring with straight-run absent columns,
 * the barn) scores < 1 because its rectangular outline has holes. This — not post-coverage — is the right
 * discriminator for "registered clean rect BEATS close-derived footprint" (T-160-04): a close ring is built
 * FROM the posts so it always traces them (coverage ≈ 1) yet may be full of straight-run gaps (closure < 1);
 * the registered clean rectangle closes those gaps (closure 1). PURE.
 */
export function closureOf(ring) {
  if (!ring || ring.size === 0) return 0;
  const bb = bboxOf(ring);
  const per = perimeterColumns(filledRect(bb));
  let present = 0;
  for (const c of per) if (ring.has(c)) present++;
  return present / per.size;
}

/** Every "x,z" column in the inclusive rectangle {x0,x1,z0,z1}. PURE. */
function filledRect({ x0, x1, z0, z1 }) {
  const out = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) out.add(`${x},${z}`);
  return out;
}

/**
 * Register a recognized program's `masses[].rect` (a clean 0-based rectangle, in sketch units that do NOT
 * match the build's voxel scale) to the BUILD frame, using the occupancy's wall-band columns as the only
 * build-frame signal (T-160-04). Returns an AFFINE transform fitting the program's overall bbox to the
 * occupancy's robust extent, the union-of-masses perimeter `ring`, its post-coverage, the chosen axis
 * assignment, and `ambiguous` (report-don't-force) / `polluted` diagnostics.
 *
 * The ladder is the 2 axis assignments {identity, swap}; the winner is the higher post-coverage, tie-broken
 * by aspect agreement. Scale is per-axis extentSpan/programSpan ("scale only if the data demands it" — here
 * it does). `ambiguous` flips a REPORT flag only (a near-square axis tie, or a best coverage below a
 * diagnostic floor); it never gates a per-subject SELECTION constant. PURE.
 *
 * @param {Array<{rect:{x0:number,z0:number,w:number,d:number}}>} masses
 * @param {Set<string>} cols  wall-band "x,z" columns (build frame)
 * @param {{trim?:number, floor?:number, eps?:number}} [opts]
 */
export function registerRect(masses, cols, opts = {}) {
  const trim = opts.trim ?? 0.02;
  const FLOOR = opts.floor ?? 0.5;   // diagnostic: best coverage below this => report ambiguous
  const EPS = opts.eps ?? 0.05;      // diagnostic: axis near-tie threshold
  const rects = (masses ?? []).map((m) => m.rect).filter(Boolean);
  if (rects.length === 0 || !cols || cols.size === 0) return null;
  const ext = robustExtent(cols, { pLo: trim, pHi: 1 - trim });
  if (!ext) return null;

  // program overall bbox (program frame)
  let px0 = Infinity, px1 = -Infinity, pz0 = Infinity, pz1 = -Infinity;
  for (const r of rects) {
    px0 = Math.min(px0, r.x0); px1 = Math.max(px1, r.x0 + r.w);
    pz0 = Math.min(pz0, r.z0); pz1 = Math.max(pz1, r.z0 + r.d);
  }
  const pW = Math.max(1, px1 - px0), pD = Math.max(1, pz1 - pz0);
  const EX = ext.x1 - ext.x0, EZ = ext.z1 - ext.z0;

  // build a candidate per axis assignment. identity: program-x→build-x; swap: program-x→build-z.
  const candidate = (axis) => {
    // span of the program axis that feeds build-x / build-z
    const progXspan = axis === "identity" ? pW : pD;
    const progZspan = axis === "identity" ? pD : pW;
    const sx = EX / progXspan, sz = EZ / progZspan;
    // affine: program (px,pz) -> build (bx,bz)
    const transform = (ppx, ppz) => {
      const a = axis === "identity" ? ppx - px0 : ppz - pz0; // along build-x
      const b = axis === "identity" ? ppz - pz0 : ppx - px0; // along build-z
      return { x: Math.round(ext.x0 + a * sx), z: Math.round(ext.z0 + b * sz) };
    };
    const ring = new Set();
    for (const r of rects) {
      const c0 = transform(r.x0, r.z0), c1 = transform(r.x0 + r.w, r.z0 + r.d);
      const rect = { x0: Math.min(c0.x, c1.x), x1: Math.max(c0.x, c1.x), z0: Math.min(c0.z, c1.z), z1: Math.max(c0.z, c1.z) };
      for (const p of perimeterColumns(filledRect(rect))) ring.add(p);
    }
    const coverage = coverageOf(ring, cols);
    const aspectErr = Math.abs((progXspan / progZspan) - (EX / Math.max(1, EZ)));
    return { axis, transform, ring, coverage, aspectErr, scale: { sx, sz } };
  };

  const cands = [candidate("identity"), candidate("swap")];
  cands.sort((a, b) => (b.coverage - a.coverage) || (a.aspectErr - b.aspectErr));
  const best = cands[0];
  const nearSquare = Math.abs(EX - EZ) <= 1;
  const ambiguous = best.coverage < FLOOR
    || (Math.abs(cands[0].coverage - cands[1].coverage) < EPS && nearSquare);
  return {
    transform: best.transform,
    ring: best.ring,
    coverage: best.coverage,
    axis: best.axis,
    scale: best.scale,
    ambiguous,
    extent: ext,
    reason: `axis=${best.axis} cov=${best.coverage.toFixed(2)} scale=(${best.scale.sx.toFixed(2)},${best.scale.sz.toFixed(2)})`
      + (ext.polluted ? " EXTENT-POLLUTED" : "") + (ambiguous ? " AMBIGUOUS" : ""),
  };
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

  // 2. choose the perimeter ring. The close-derived footprint (Option B) repairs ragged notches but
  //    PROVABLY can't bridge a straight-run absent column (WG1). When the recognized program supplies a
  //    clean rect, REGISTER it to the build frame (T-160-04) and prefer that full clean ring IFF it
  //    out-covers the close ring — so sparse shells (barn) close straight runs while dense shells
  //    (gatehouse, no program / cottage already-solid) keep Option B. The route is decided by COVERAGE,
  //    not a per-building density threshold or subject key.
  const closeRing = perimeterColumns(new Set([...cols, ...closeColumns(cols, closeR)]));
  const reg = params.program?.masses?.some((m) => m?.rect) ? registerRect(params.program.masses, cols) : null;
  // Prefer the registered clean rectangle when it is a TRUSTED fit (not ambiguous — it traces a majority of
  // the real posts) AND it is MORE WATERTIGHT than the close ring (closure, not post-coverage: the close
  // ring always traces posts but may be a gappy colonnade). On a dense shell the close ring is already
  // closed → tie → keep Option B (no regression). Decided by closure, not a density threshold or subject key.
  const useReg = reg && !reg.ambiguous && closureOf(reg.ring) > closureOf(closeRing);
  const ring = useReg ? reg.ring : closeRing;
  const bbox = bboxOf(ring);

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
