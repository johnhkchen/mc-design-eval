// Component decomposition — the blob becomes NAMED COMPONENTS WITH GEOMETRY (T-103-01, story S-103,
// epic E-27). The E-25/E-26 finding: surfaces the pipeline re-authors from geometry pass; surfaces
// inherited raw from the decimated mesh fail every judge. To re-author the major masses (S-104
// roof-as-program, S-105 shaped vocabulary, S-106 component-aware skinning), the shell must first be
// segmented into components downstream code can fit parameters to: ROOF PLANES (normal, extent, eave
// edge, ridge candidate), WALL SLABS (plane + bounds), ATTACHED MASSES (separable volumes + junction
// — a church tower vs its nave), OPENING GROUPS (apertures with head/jamb geometry).
//
// The output is the component record (`component-record/v1`, schema/component-record.schema.json) —
// the SINGLE contract every E-27 consumer reads (Rule 4); no consumer-specific variants. Everything
// here derives from the structural read's primitives lifted into geometry; the GLB enters only as the
// fitted REFERENCE (Rule 1, src/form/component-glb-fit.mjs) — never as the segmentation substrate.
//
// Robustness note: the raw shells carry voxelization noise (276 protrusions / 23.9% ragged columns on
// the cottage — the E-27 motivating census). All ANALYSIS runs on a 3×3-median-smoothed heightfield,
// so the module tolerates both raw and T-102-regularized shells; raw per-column heights are reported
// beside the fits (rmseRaw) so the smoothing never hides what the shell actually is.
//
// PURE — no GL, no I/O, no Date/random. Deterministic: fixed scan orders, exact LSQ, stable ids.

import { solidOccupancy, occupancyFromCells } from "../view/occupancy.mjs";
import { openings } from "../view/structural-read.mjs";
import { projectSurface, orthoSpec } from "../view/surface-grid.mjs";

export const COMPONENT_RECORD_SCHEMA = "component-record/v1";

const SIDE_FACES = ["+x", "-x", "+z", "-z"];
const round3 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return r === 0 ? 0 : r; // never emit -0 (JSON keeps it; byte-determinism cares)
};

// ---- record cell codec ------------------------------------------------------------------------

/**
 * Encode a list of plan cells `[x,z][]` as sorted row runs `[{z, x0, x1}]` — exact, diff-friendly,
 * and ~10× smaller than raw cell lists on building footprints. Inverse: {@link runCells}.
 */
export function columnRuns(cells) {
  const byZ = new Map();
  for (const [x, z] of cells) {
    if (!byZ.has(z)) byZ.set(z, []);
    byZ.get(z).push(x);
  }
  const runs = [];
  for (const z of [...byZ.keys()].sort((a, b) => a - b)) {
    const xs = byZ.get(z).sort((a, b) => a - b);
    let x0 = xs[0], x1 = xs[0];
    for (let i = 1; i < xs.length; i++) {
      if (xs[i] === x1) continue; // duplicate cell
      if (xs[i] === x1 + 1) { x1 = xs[i]; continue; }
      runs.push({ z, x0, x1 });
      x0 = x1 = xs[i];
    }
    runs.push({ z, x0, x1 });
  }
  return runs;
}

/** Decode {@link columnRuns} output back to `[x,z][]` (sorted by z then x). */
export function runCells(runs) {
  const cells = [];
  for (const { z, x0, x1 } of runs) for (let x = x0; x <= x1; x++) cells.push([x, z]);
  return cells;
}

// ---- plane fit --------------------------------------------------------------------------------

/**
 * Exact least-squares fit of the height plane `y = a·x + b·z + c` over `[{x,z,y}]`. Returned with a
 * unit normal (ny > 0), the fit centroid as `point`, and residual stats. Degenerate inputs (<3
 * cells, collinear columns) fall back to the horizontal plane through the mean height, flagged.
 * @returns {{normal:number[], point:number[], gradient:number[], rmse:number, maxResidual:number,
 *            cells:number, degenerate:boolean}}
 */
export function fitPlane(cells) {
  const n = cells.length;
  if (n === 0) return { normal: [0, 1, 0], point: [0, 0, 0], gradient: [0, 0], rmse: 0, maxResidual: 0, cells: 0, degenerate: true };
  let sx = 0, sz = 0, sy = 0, sxx = 0, szz = 0, sxz = 0, sxy = 0, szy = 0;
  for (const { x, z, y } of cells) {
    sx += x; sz += z; sy += y;
    sxx += x * x; szz += z * z; sxz += x * z;
    sxy += x * y; szy += z * y;
  }
  // normal equations for [a b c]: centered form avoids the explicit 3×3 solve
  const mx = sx / n, mz = sz / n, my = sy / n;
  const cxx = sxx - n * mx * mx, czz = szz - n * mz * mz, cxz = sxz - n * mx * mz;
  const cxy = sxy - n * mx * my, czy = szy - n * mz * my;
  const det = cxx * czz - cxz * cxz;
  let a = 0, b = 0, degenerate = false;
  if (n >= 3 && Math.abs(det) > 1e-9) {
    a = (cxy * czz - czy * cxz) / det;
    b = (czy * cxx - cxy * cxz) / det;
  } else {
    degenerate = true;
  }
  const c = my - a * mx - b * mz;
  let sse = 0, maxResidual = 0;
  for (const { x, z, y } of cells) {
    const r = y - (a * x + b * z + c);
    sse += r * r;
    if (Math.abs(r) > maxResidual) maxResidual = Math.abs(r);
  }
  // plane a·x + b·z − y + c = 0 → normal ∝ (a, −1, b); flip so ny > 0
  const len = Math.hypot(a, 1, b);
  return {
    normal: [round3(-a / len), round3(1 / len), round3(-b / len)],
    point: [round3(mx), round3(my), round3(mz)],
    gradient: [round3(a), round3(b)],
    rmse: round3(Math.sqrt(sse / n)),
    maxResidual: round3(maxResidual),
    cells: n,
    degenerate,
  };
}

// ---- heightfield ------------------------------------------------------------------------------

/**
 * Column heightfield of the SOLID occupancy: top y, bottom y, and solid-cell count per (x,z) column.
 * @returns {{h:Map<string,number>, bottom:Map<string,number>, count:Map<string,number>,
 *            bbox:{minX,maxX,minZ,maxZ}|null}}
 */
export function heightfield(occ) {
  const solid = solidOccupancy(occ);
  const h = new Map(), bottom = new Map(), count = new Map();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const key of solid.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!h.has(k) || y > h.get(k)) h.set(k, y);
    if (!bottom.has(k) || y < bottom.get(k)) bottom.set(k, y);
    count.set(k, (count.get(k) || 0) + 1);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const bbox = h.size ? { minX, maxX, minZ, maxZ } : null;
  return { h, bottom, count, bbox };
}

/**
 * 3×3 median smoothing of a heightfield's top surface — the ANALYSIS copy every segmentation step
 * reads. A single-column spike (the voxelization-noise class) is an outlier the median ignores; a
 * gable's slope line survives (the median of a monotone neighborhood is its center). Lower median on
 * even counts, for integer stability. Missing neighbors (footprint edge) just shrink the window.
 */
export function medianSmooth(hf) {
  const out = new Map();
  for (const k of hf.h.keys()) {
    const [x, z] = k.split(",").map(Number);
    const vals = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const v = hf.h.get(`${x + dx},${z + dz}`);
        if (v !== undefined) vals.push(v);
      }
    }
    vals.sort((a, b) => a - b);
    out.set(k, vals[Math.floor((vals.length - 1) / 2)]);
  }
  return { ...hf, h: out, raw: hf.h };
}

// ---- mass segmentation ---------------------------------------------------------------------------

const keyXZ = (x, z) => `${x},${z}`;
const parseXZ = (k) => k.split(",").map(Number);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** Lower median of a non-empty numeric array (sorted copy) — integer-stable, deterministic. */
const lowerMedian = (vals) => {
  const s = [...vals].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
};
/** Deterministic column order: by x, then z. */
const sortedKeys = (keys) => [...keys].sort((a, b) => {
  const [ax, az] = parseXZ(a), [bx, bz] = parseXZ(b);
  return ax - bx || az - bz;
});

function planOf(cells) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of cells) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  return { runs: columnRuns(cells), bbox: { minX, maxX, minZ, maxZ }, area: cells.length };
}

/**
 * Segment the shell into named masses (D2, two passes):
 *
 *   1. PROTRUSION PASS — a column whose smoothed height rises ≥ `protrusionMinRise` above the lower
 *      median of its Chebyshev radius-2 ring is a protrusion seed (a chimney, whatever its absolute
 *      height — the cottage chimney top can sit BELOW the ridge, so no global height rule finds it).
 *      4-connected seed components with area ≤ `protrusionMaxArea` become protrusion masses
 *      (protected, E-27 Rule 2 vocabulary), dilated one step by raw height to recover the corners
 *      the median eroded. Single-column voxelization spikes never seed: the 3×3 median already
 *      flattened them.
 *   2. HEIGHT-CLASS PASS — remaining columns cluster by smoothed height with splits at gaps ≥
 *      max(gapMin, gapFrac·heightRange). A continuous gable slope produces no gap (one class); a
 *      tower above a nave produces one. 4-connected plan components per class are mass candidates;
 *      candidates under `minMassArea` merge into the adjacent candidate with the longest shared
 *      boundary (isolated small islands stay, recorded honestly).
 *
 * Junction surfaces: side-adjacent masses record their facing boundary columns + the y-overlap;
 * a protrusion records its base footprint at the host's local top surface.
 *
 * @returns {{masses:object[], columnMass:Map<string,string>, heightfield:object}}
 */
export function segmentMasses(occ, opts = {}) {
  const {
    gapMin = 3, gapFrac = 0.12, minMassArea = 12,
    protrusionMaxArea = 12, protrusionMinRise = 3,
  } = opts;
  const hf = medianSmooth(heightfield(occ));
  if (hf.h.size === 0) return { masses: [], columnMass: new Map(), heightfield: hf };

  // per-column solid y lists (exact volumes; a protrusion's volume starts at its base, not bedrock)
  const colYs = new Map();
  const solid = solidOccupancy(occ);
  for (const key of solid.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const k = keyXZ(x, z);
    if (!colYs.has(k)) colYs.set(k, []);
    colYs.get(k).push(y);
  }
  for (const ys of colYs.values()) ys.sort((a, b) => a - b);

  // ---- pass 1: protrusions (local ring-median outliers on the smoothed surface)
  const seeds = new Set();
  for (const k of hf.h.keys()) {
    const [x, z] = parseXZ(k);
    const ring = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== 2) continue;
        const v = hf.h.get(keyXZ(x + dx, z + dz));
        if (v !== undefined) ring.push(v);
      }
    }
    if (ring.length < 4) continue;
    if (hf.h.get(k) - lowerMedian(ring) >= protrusionMinRise) seeds.add(k);
  }
  const protrusions = [];
  const inProtrusion = new Map(); // column key → protrusion index
  const seen = new Set();
  for (const start of sortedKeys(seeds)) {
    if (seen.has(start)) continue;
    const comp = [];
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      const k = queue.shift();
      comp.push(k);
      const [x, z] = parseXZ(k);
      for (const [dx, dz] of N4) {
        const nk = keyXZ(x + dx, z + dz);
        if (seeds.has(nk) && !seen.has(nk)) { seen.add(nk); queue.push(nk); }
      }
    }
    if (comp.length > protrusionMaxArea) continue; // tower-scale bump → left to the class pass
    const minH = Math.min(...comp.map((k) => hf.h.get(k)));
    // confirm against the IMMEDIATE surroundings: a chimney rises above its 4-neighbor boundary;
    // a tower's convex corner (whose radius-2 ring saw mostly the lower nave) does not — its
    // boundary is equal-height tower columns, and it must stay with the class pass
    const surround = [];
    const compSet = new Set(comp);
    for (const k of comp) {
      const [x, z] = parseXZ(k);
      for (const [dx, dz] of N4) {
        const nk = keyXZ(x + dx, z + dz);
        if (!compSet.has(nk) && hf.h.has(nk)) surround.push(hf.h.get(nk));
      }
    }
    if (!surround.length || minH - lowerMedian(surround) < protrusionMinRise) continue;
    // dilate one step by RAW height (recover the median-eroded corners)
    const grown = new Set(comp);
    for (const k of [...comp]) {
      const [x, z] = parseXZ(k);
      for (const [dx, dz] of N4) {
        const nk = keyXZ(x + dx, z + dz);
        if (!grown.has(nk) && hf.raw.has(nk) && hf.raw.get(nk) >= minH - 1) grown.add(nk);
      }
    }
    const idx = protrusions.length;
    protrusions.push({ cells: sortedKeys(grown).map(parseXZ), keys: grown });
    for (const k of grown) inProtrusion.set(k, idx);
  }

  // ---- pass 2: height classes over the remaining field
  const fieldKeys = sortedKeys([...hf.h.keys()].filter((k) => !inProtrusion.has(k)));
  const heights = [...new Set(fieldKeys.map((k) => hf.h.get(k)))].sort((a, b) => a - b);
  const range = heights[heights.length - 1] - heights[0];
  const gap = Math.max(gapMin, gapFrac * range);
  const classEdges = []; // class c = heights in (edge[c-1], edge[c]]
  for (let i = 1; i < heights.length; i++) {
    if (heights[i] - heights[i - 1] >= gap) classEdges.push((heights[i] + heights[i - 1]) / 2);
  }
  const classOf = (h) => {
    let c = 0;
    while (c < classEdges.length && h > classEdges[c]) c++;
    return c;
  };

  const candidates = [];
  const colCand = new Map();
  const seenF = new Set();
  for (const start of fieldKeys) {
    if (seenF.has(start)) continue;
    const cls = classOf(hf.h.get(start));
    const comp = [];
    const queue = [start];
    seenF.add(start);
    while (queue.length) {
      const k = queue.shift();
      comp.push(k);
      const [x, z] = parseXZ(k);
      for (const [dx, dz] of N4) {
        const nk = keyXZ(x + dx, z + dz);
        if (seenF.has(nk) || inProtrusion.has(nk) || !hf.h.has(nk)) continue;
        if (classOf(hf.h.get(nk)) !== cls) continue;
        seenF.add(nk);
        queue.push(nk);
      }
    }
    const idx = candidates.length;
    candidates.push({ keys: new Set(comp), alive: true });
    for (const k of comp) colCand.set(k, idx);
  }

  // merge under-sized candidates into the adjacent candidate with the longest shared boundary
  const boundaryLen = (a, b) => {
    let n = 0;
    for (const k of candidates[a].keys) {
      const [x, z] = parseXZ(k);
      for (const [dx, dz] of N4) if (colCand.get(keyXZ(x + dx, z + dz)) === b) n++;
    }
    return n;
  };
  let changed = true;
  while (changed) {
    changed = false;
    const smalls = candidates
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.alive && c.keys.size < minMassArea)
      .sort((a, b) => a.c.keys.size - b.c.keys.size || a.i - b.i);
    for (const { c, i } of smalls) {
      if (!c.alive || c.keys.size >= minMassArea) continue;
      const neighbors = new Set();
      for (const k of c.keys) {
        const [x, z] = parseXZ(k);
        for (const [dx, dz] of N4) {
          const o = colCand.get(keyXZ(x + dx, z + dz));
          if (o !== undefined && o !== i && candidates[o].alive) neighbors.add(o);
        }
      }
      if (neighbors.size === 0) continue; // isolated island — kept, named in the record
      const host = [...neighbors].sort((a, b) =>
        boundaryLen(i, b) - boundaryLen(i, a) || candidates[b].keys.size - candidates[a].keys.size || a - b)[0];
      for (const k of c.keys) { candidates[host].keys.add(k); colCand.set(k, host); }
      c.alive = false;
      c.keys = new Set();
      changed = true;
    }
  }

  // ---- assemble masses (area-desc order, stable ids)
  const colStats = (keys) => {
    let minY = Infinity, maxY = -Infinity, volume = 0;
    for (const k of keys) {
      const ys = colYs.get(k) ?? [];
      if (ys.length) { minY = Math.min(minY, ys[0]); maxY = Math.max(maxY, hf.raw.get(k)); volume += ys.length; }
    }
    return { minY, maxY, volume };
  };
  const anchored = (cells) => cells[0]; // cells already x,z-sorted
  const bodies = candidates
    .filter((c) => c.alive)
    .map((c) => ({ kind: "body", cells: sortedKeys(c.keys).map(parseXZ), keys: c.keys }))
    .sort((a, b) => b.cells.length - a.cells.length ||
      anchored(a.cells)[0] - anchored(b.cells)[0] || anchored(a.cells)[1] - anchored(b.cells)[1]);
  const all = [...bodies, ...protrusions.map((p) => ({ kind: "protrusion", ...p }))];

  const columnMass = new Map();
  const masses = all.map((m, i) => {
    const id = `mass-${i}`;
    for (const [x, z] of m.cells) columnMass.set(keyXZ(x, z), id);
    return m.kind === "protrusion"
      ? { id, role: "protrusion", protected: true, plan: planOf(m.cells), yRange: null, volume: 0, junctions: [] }
      : {
        id,
        role: i === 0 ? "primary" : "attached",
        protected: false,
        plan: planOf(m.cells),
        yRange: (({ minY, maxY }) => [minY, maxY])(colStats(m.keys)),
        volume: colStats(m.keys).volume,
        junctions: [],
      };
  });

  // protrusion base: junctionY = lower median of adjacent host columns' raw height; volume above it
  for (let i = 0; i < masses.length; i++) {
    const m = masses[i];
    if (m.role !== "protrusion") continue;
    const own = new Set(runCells(m.plan.runs).map(([x, z]) => keyXZ(x, z)));
    const hostHeights = [];
    let hostId = null;
    for (const k of own) {
      const [x, z] = parseXZ(k);
      for (const [dx, dz] of N4) {
        const nk = keyXZ(x + dx, z + dz);
        if (own.has(nk) || !hf.raw.has(nk)) continue;
        hostHeights.push(hf.raw.get(nk));
        hostId = hostId ?? columnMass.get(nk) ?? null;
      }
    }
    const junctionY = hostHeights.length ? lowerMedian(hostHeights) : null;
    const baseY = junctionY === null ? null : junctionY + 1;
    let maxY = -Infinity, volume = 0;
    for (const k of own) {
      maxY = Math.max(maxY, hf.raw.get(k));
      for (const y of colYs.get(k) ?? []) if (baseY === null || y >= baseY) volume++;
    }
    m.yRange = [baseY ?? 0, maxY];
    m.volume = volume;
    if (hostId !== null && junctionY !== null) {
      m.junctions.push({ withMass: hostId, kind: "base", cells: m.plan.runs, yRange: [junctionY, junctionY] });
      const host = masses.find((h) => h.id === hostId);
      if (host) host.junctions.push({ withMass: m.id, kind: "base", cells: m.plan.runs, yRange: [junctionY, junctionY] });
    }
  }

  // side junctions between body masses: facing boundary columns + y-overlap
  for (let i = 0; i < masses.length; i++) {
    for (let j = i + 1; j < masses.length; j++) {
      const a = masses[i], b = masses[j];
      if (a.role === "protrusion" || b.role === "protrusion") continue;
      const bKeys = new Set(runCells(b.plan.runs).map(([x, z]) => keyXZ(x, z)));
      const facing = [];
      for (const [x, z] of runCells(a.plan.runs)) {
        for (const [dx, dz] of N4) if (bKeys.has(keyXZ(x + dx, z + dz))) { facing.push([x, z]); break; }
      }
      if (!facing.length) continue;
      const yLo = Math.max(a.yRange[0], b.yRange[0]);
      const yHi = Math.min(a.yRange[1], b.yRange[1]);
      a.junctions.push({ withMass: b.id, kind: "side", cells: columnRuns(facing), yRange: [yLo, yHi] });
      const facingB = [];
      const aKeys = new Set(runCells(a.plan.runs).map(([x, z]) => keyXZ(x, z)));
      for (const [x, z] of runCells(b.plan.runs)) {
        for (const [dx, dz] of N4) if (aKeys.has(keyXZ(x + dx, z + dz))) { facingB.push([x, z]); break; }
      }
      b.junctions.push({ withMass: a.id, kind: "side", cells: columnRuns(facingB), yRange: [yLo, yHi] });
    }
  }

  return { masses, columnMass, heightfield: hf };
}
