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

// ---- roof planes ----------------------------------------------------------------------------------

const gradAngleDeg = (g1, g2) => {
  const n1 = Math.hypot(g1[0], 1, g1[1]); // plane normals (−a, 1, −b)/|·|
  const n2 = Math.hypot(g2[0], 1, g2[1]);
  const dot = (g1[0] * g2[0] + 1 + g1[1] * g2[1]) / (n1 * n2);
  return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
};
const downhillDir = ([a, b]) => (Math.abs(a) >= Math.abs(b) ? (a > 0 ? "-x" : "+x") : (b > 0 ? "-z" : "+z"));

/**
 * Segment each body mass's smoothed top surface into ROOF PLANES (D3): deterministic region growing
 * (lex scan order, BFS, exact LSQ refits every `refitEvery` accepted cells), under-sized regions
 * dissolved into their best-fitting neighbor, near-equal adjacent planes merged. Per plane: the
 * voxel fit (with rmse vs the smoothed surface AND rmseRaw vs the raw one — the smoothing never
 * hides the shell), kind flat|pitched, extent, EAVE EDGE (boundary cells on the downhill side within
 * `eaveTol` of the plane's minimum; a flat cap's eave is its outside perimeter), and RIDGE CANDIDATE
 * (the shared boundary of two opposing-gradient planes, with its axis and mean height). Protrusion
 * masses (chimneys) own their columns, so they are excluded from every fit by construction.
 */
export function roofPlanes(occ, segmentation, opts = {}) {
  const {
    residualTol = 1.25, minPlaneArea = 8, mergeAngleDeg = 10, mergeOffset = 1,
    flatSlope = 0.15, refitEvery = 16, eaveTol = 0.5, growAngleDeg = 35,
  } = opts;
  const { masses, heightfield: hf } = segmentation;
  const planes = [];

  for (const mass of masses) {
    if (mass.role === "protrusion") continue;
    const massKeys = sortedKeys(runCells(mass.plan.runs).map(([x, z]) => keyXZ(x, z)));
    const massSet = new Set(massKeys);
    const cellOf = (k) => {
      const [x, z] = parseXZ(k);
      return { x, z, y: hf.h.get(k) };
    };

    // -- region growing, most-planar seeds first: a pyramid's wedge interiors are perfectly planar
    // while its diagonal hip lines are not — growing from the interiors carves the wedges cleanly
    // and leaves the ambiguous 1-wide diagonal bands to the dissolve step (still deterministic:
    // ties break on the lex scan order)
    const localFit = new Map();
    for (const k of massKeys) {
      const [x, z] = parseXZ(k);
      const nbhd = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nk = keyXZ(x + dx, z + dz);
          if (massSet.has(nk)) nbhd.push(cellOf(nk));
        }
      }
      localFit.set(k, fitPlane(nbhd));
    }
    const lexIdx = new Map(massKeys.map((k, i) => [k, i]));
    const seedOrder = [...massKeys].sort((a, b) =>
      localFit.get(a).rmse - localFit.get(b).rmse || lexIdx.get(a) - lexIdx.get(b));
    const assign = new Map();
    let regions = [];
    for (const seedK of seedOrder) {
      if (assign.has(seedK)) continue;
      const [sx, sz] = parseXZ(seedK);
      const seedCells = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const nk = keyXZ(sx + dx, sz + dz);
          if (massSet.has(nk)) seedCells.push(cellOf(nk));
        }
      }
      let plane = fitPlane(seedCells);
      const id = regions.length;
      const cells = [seedK];
      assign.set(seedK, id);
      const queue = [seedK];
      let sinceRefit = 0;
      while (queue.length) {
        const k = queue.shift();
        const [x, z] = parseXZ(k);
        for (const [dx, dz] of N4) {
          const nk = keyXZ(x + dx, z + dz);
          if (!massSet.has(nk) || assign.has(nk)) continue;
          const { y } = cellOf(nk);
          const pred = plane.gradient[0] * (x + dx) + plane.gradient[1] * (z + dz) +
            (plane.point[1] - plane.gradient[0] * plane.point[0] - plane.gradient[1] * plane.point[2]);
          if (Math.abs(y - pred) > residualTol) continue;
          // the cell's LOCAL orientation must agree with the region plane — a region cannot snake
          // across a hip/ridge line by dragging its refit (the pyramid failure mode); mixed-window
          // cells on the crest/diagonals stay unassigned and dissolve into their best plane below
          const lf = localFit.get(nk);
          if (!lf.degenerate && gradAngleDeg(lf.gradient, plane.gradient) > growAngleDeg) continue;
          assign.set(nk, id);
          cells.push(nk);
          queue.push(nk);
          if (++sinceRefit >= refitEvery) {
            plane = fitPlane(cells.map(cellOf));
            sinceRefit = 0;
          }
        }
      }
      regions.push({ cells, plane: fitPlane(cells.map(cellOf)) });
    }

    // -- dissolve under-sized regions into the adjacent region with the lowest mean residual
    const adjacentRegions = (r, self) => {
      const found = new Set();
      for (const k of r.cells) {
        const [x, z] = parseXZ(k);
        for (const [dx, dz] of N4) {
          const o = assign.get(keyXZ(x + dx, z + dz));
          if (o !== undefined && o !== self && regions[o].cells.length) found.add(o);
        }
      }
      return [...found].sort((a, b) => a - b);
    };
    const meanResidual = (cells, plane) => {
      const c0 = plane.point[1] - plane.gradient[0] * plane.point[0] - plane.gradient[1] * plane.point[2];
      let s = 0;
      for (const k of cells) {
        const { x, z, y } = cellOf(k);
        s += Math.abs(y - (plane.gradient[0] * x + plane.gradient[1] * z + c0));
      }
      return s / cells.length;
    };
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < regions.length; i++) {
        const r = regions[i];
        if (!r.cells.length || r.cells.length >= minPlaneArea) continue;
        const adj = adjacentRegions(r, i);
        if (!adj.length) continue; // isolated sliver — kept, surfaces as a small plane
        const host = adj.sort((a, b) =>
          meanResidual(r.cells, regions[a].plane) - meanResidual(r.cells, regions[b].plane) || a - b)[0];
        for (const k of r.cells) assign.set(k, host);
        regions[host].cells.push(...r.cells);
        regions[host].plane = fitPlane(regions[host].cells.map(cellOf));
        r.cells = [];
        changed = true;
      }
    }
    // -- absorb redundant bands: a region whose cells already lie within growth tolerance of a
    // LARGER neighbor's plane is a leftover seam band (the angle-gated crest/hip line), not a roof
    // face — a genuine face has large residuals under any other face's plane
    changed = true;
    while (changed) {
      changed = false;
      const byArea = regions
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => r.cells.length)
        .sort((a, b) => a.r.cells.length - b.r.cells.length || a.idx - b.idx);
      for (const { r, idx } of byArea) {
        if (!r.cells.length) continue;
        const hosts = adjacentRegions(r, idx)
          .filter((o) => regions[o].cells.length >= r.cells.length)
          .map((o) => ({ o, res: meanResidual(r.cells, regions[o].plane) }))
          .filter(({ res }) => res <= residualTol)
          .sort((a, b) => a.res - b.res || a.o - b.o);
        if (!hosts.length) continue;
        const host = hosts[0].o;
        for (const k of r.cells) assign.set(k, host);
        regions[host].cells.push(...r.cells);
        regions[host].plane = fitPlane(regions[host].cells.map(cellOf));
        r.cells = [];
        changed = true;
        break;
      }
    }
    // -- merge near-equal adjacent planes
    changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < regions.length && !changed; i++) {
        if (!regions[i].cells.length) continue;
        for (const j of adjacentRegions(regions[i], i)) {
          if (j <= i) continue;
          const a = regions[i], b = regions[j];
          if (gradAngleDeg(a.plane.gradient, b.plane.gradient) >= mergeAngleDeg) continue;
          if (meanResidual(b.cells, a.plane) >= mergeOffset) continue;
          for (const k of b.cells) assign.set(k, i);
          a.cells.push(...b.cells);
          a.plane = fitPlane(a.cells.map(cellOf));
          b.cells = [];
          changed = true;
          break;
        }
      }
    }

    // -- finalize (area-desc order, stable ids appended across masses)
    const live = regions
      .map((r, idx) => ({ ...r, idx }))
      .filter((r) => r.cells.length)
      .sort((a, b) => b.cells.length - a.cells.length || a.idx - b.idx);
    const localIdx = new Map(); // original region index → planes[] slot
    for (const r of live) {
      const cells = sortedKeys(r.cells);
      const xz = cells.map(parseXZ);
      const plane = fitPlane(cells.map(cellOf));
      const c0 = plane.point[1] - plane.gradient[0] * plane.point[0] - plane.gradient[1] * plane.point[2];
      let sseRaw = 0;
      for (const k of cells) {
        const [x, z] = parseXZ(k);
        const rr = hf.raw.get(k) - (plane.gradient[0] * x + plane.gradient[1] * z + c0);
        sseRaw += rr * rr;
      }
      const slope = Math.hypot(plane.gradient[0], plane.gradient[1]);
      const kind = slope < flatSlope ? "flat" : "pitched";
      const minH = Math.min(...cells.map((k) => hf.h.get(k)));
      const boundary = cells.filter((k) => {
        const [x, z] = parseXZ(k);
        return N4.some(([dx, dz]) => assign.get(keyXZ(x + dx, z + dz)) !== r.idx);
      });
      const eaveCells = boundary.filter((k) => {
        if (kind === "flat") {
          const [x, z] = parseXZ(k);
          return N4.some(([dx, dz]) => !massSet.has(keyXZ(x + dx, z + dz)));
        }
        return hf.h.get(k) <= minH + eaveTol;
      });
      localIdx.set(r.idx, planes.length);
      planes.push({
        id: `roof-${planes.length}`,
        massId: mass.id,
        kind,
        voxelFit: {
          normal: plane.normal, point: plane.point, gradient: plane.gradient,
          rmse: plane.rmse, rmseRaw: round3(Math.sqrt(sseRaw / cells.length)),
          maxResidual: plane.maxResidual, degenerate: plane.degenerate,
        },
        extent: planOf(xz),
        eave: { cells: columnRuns(eaveCells.map(parseXZ)), dir: kind === "pitched" ? downhillDir(plane.gradient) : null },
        ridge: null,
        glbFit: null,
        _ridgeWith: null, _regionIdx: r.idx, _massSet: massSet, _assign: assign, // stripped below
      });
    }

    // -- ridge candidates: opposing-gradient adjacent plane pairs within this mass
    const massPlanes = planes.filter((p) => p.massId === mass.id);
    for (let i = 0; i < massPlanes.length; i++) {
      for (let j = i + 1; j < massPlanes.length; j++) {
        const a = massPlanes[i], b = massPlanes[j];
        if (a.kind !== "pitched" || b.kind !== "pitched") continue;
        const ga = a.voxelFit.gradient, gb = b.voxelFit.gradient;
        const dot = ga[0] * gb[0] + ga[1] * gb[1];
        const mag = Math.hypot(ga[0], ga[1]) * Math.hypot(gb[0], gb[1]);
        if (!mag || dot / mag >= -0.5) continue; // not opposing (orthogonal hips never ridge-pair)
        const shared = [];
        for (const k of runCells(a.extent.runs).map(([x, z]) => keyXZ(x, z))) {
          const [x, z] = parseXZ(k);
          if (N4.some(([dx, dz]) => a._assign.get(keyXZ(x + dx, z + dz)) === b._regionIdx)) shared.push(k);
        }
        for (const k of runCells(b.extent.runs).map(([x, z]) => keyXZ(x, z))) {
          const [x, z] = parseXZ(k);
          if (N4.some(([dx, dz]) => b._assign.get(keyXZ(x + dx, z + dz)) === a._regionIdx)) shared.push(k);
        }
        if (!shared.length) continue;
        const cells = sortedKeys(new Set(shared)).map(parseXZ);
        const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
        const axis = Math.max(...xs) - Math.min(...xs) >= Math.max(...zs) - Math.min(...zs) ? "x" : "z";
        const y = round3(cells.reduce((s, [x, z]) => s + hf.h.get(keyXZ(x, z)), 0) / cells.length);
        const ridge = { axis, y, cells: columnRuns(cells) };
        a.ridge = { withPlane: b.id, ...ridge };
        b.ridge = { withPlane: a.id, ...ridge };
      }
    }
  }

  for (const p of planes) { delete p._ridgeWith; delete p._regionIdx; delete p._massSet; delete p._assign; }
  return planes;
}
