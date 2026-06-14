// Zone map from concept bands — the occupancy side (T-092-01, story S-092, epic E-25).
//
// The image side (src/color/band-profile.mjs) reads `{bands, roof}` out of the concept; this module
// turns them into the `{zoneOf, zones}` pair the existing pure cores consume (zoneFill,
// surfaceZoneHistogram, coverageGate, stripStraySalt — all zone-name-agnostic), and diffs the derived
// map against a prior policy so the replacement of the building prior is RECORDED, not silent.
//
// The wall/roof CONTRACT is structuralZones', verbatim: a voxel is "roof" when it is a top-exposed
// roofRegion cell OR sits at/above the eave line (upperTop) — the concept changes what zones are MADE
// OF, never where the roof IS. Wall voxels land in the band containing their y; y outside every band
// clamps to the nearest end band, so zoneOf is TOTAL (bands tile the wall extent by construction —
// band-profile guarantees it — but totality must not depend on it).
//
// Zone POLICIES stay in the NAMED (pre-substitution) block space: preserve = the band's secondaries
// (the studs/quoins/door-leaves the fill must keep as runs), splat = preserve minus the dominant (the
// secondaries the E-23 splat may place). The value-true substitution applies downstream at the runner's
// single renaming point (durable-skin mapPolicy), exactly like the prior policy does today.
//
// PURE — no GL, no I/O, no Date/random.

import { bareBlock } from "./occupancy.mjs";

/**
 * Occupied-cell count per y layer — the voxel-side width sequence for band-profile's robustExtent
 * (the image side uses per-row filled counts; SAME statistic, so the chimney drops out of both).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @returns {{yMin:number, counts:number[]}} counts[i] = occupied cells at y = yMin + i
 */
export function layerCounts(occ) {
  if (!occ.bounds) return { yMin: 0, counts: [] };
  const yMin = occ.bounds.min[1];
  const counts = new Array(occ.bounds.max[1] - yMin + 1).fill(0);
  for (const key of occ.cells.keys()) {
    counts[Number(key.split(",")[1]) - yMin]++;
  }
  return { yMin, counts };
}

/**
 * Compose a concept-derived band map with the geometric roof contract into the `{zoneOf, zones}` pair
 * every zone consumer takes. Wall zones are named by their band (`band0`..`bandN`, bottom-up); the roof
 * zone is `"roof"`.
 * @param {{bands:{name:string, yRange:[number,number], dominantBlock:string,
 *                 secondaries:{block:string}[]}[],
 *          roof:{dominantBlock:string, secondaries:{block:string}[]},
 *          roofKeys:Set<string>, upperTop:number, gableWallKeys?:Set<string>}} args
 *   `bands`/`roof` from band-profile's extractConceptZoneMap; `roofKeys`/`upperTop` from structuralZones.
 *   `gableWallKeys` (T-150-01, optional) = generated gable-end-wall cells classified wall, not roof.
 * @returns {{zoneOf:(voxel:number[])=>string,
 *            zones:Record<string,{dominant:string, preserve:string[], splat:string[]}>}}
 */
export function zonesFromBands({ bands, roof, roofKeys, upperTop, gableWallKeys = new Set() }) {
  if (!Array.isArray(bands) || bands.length === 0) throw new Error("zonesFromBands: bands must be a non-empty array");
  if (!roof || typeof roof.dominantBlock !== "string") throw new Error("zonesFromBands: roof.dominantBlock required");
  if (!(roofKeys instanceof Set)) throw new Error("zonesFromBands: roofKeys must be a Set");
  if (!Number.isFinite(upperTop)) throw new Error("zonesFromBands: numeric upperTop required");
  if (!(gableWallKeys instanceof Set)) throw new Error("zonesFromBands: gableWallKeys must be a Set");

  const sorted = [...bands].sort((a, b) => a.yRange[0] - b.yRange[0]);
  const policyOf = (dominant, secondaries) => {
    const dom = bareBlock(dominant);
    const preserve = [...new Set((secondaries ?? []).map((s) => bareBlock(s.block)).filter((b) => b !== dom))];
    return { dominant: dom, preserve, splat: [...preserve] };
  };
  const zones = {};
  for (const b of sorted) zones[b.name] = policyOf(b.dominantBlock, b.secondaries);
  zones.roof = policyOf(roof.dominantBlock, roof.secondaries);

  // T-150-01: the gable-end WALLS (vertical triangular faces) sit above the eave line but belong to
  // the wall envelope, not the roof covering — classify them by their y-band, BEFORE the roof rule.
  const bandFor = (y) => {
    for (const b of sorted) if (y >= b.yRange[0] && y <= b.yRange[1]) return b.name;
    return y < sorted[0].yRange[0] ? sorted[0].name : sorted[sorted.length - 1].name; // clamp: total
  };
  const zoneOf = (voxel) => {
    const [x, y, z] = voxel;
    if (gableWallKeys.has(`${x},${y},${z}`)) return bandFor(y); // wall envelope, not roof
    if (y >= upperTop || roofKeys.has(`${x},${y},${z}`)) return "roof"; // structuralZones' rule, verbatim
    return bandFor(y);
  };
  return { zoneOf, zones };
}

/**
 * Diff the derived map against the prior building policy — the record of what reading the concept
 * actually changed. Walls are compared as the EFFECTIVE per-y dominant assignment (prior: base below
 * storeyDivide, upper from there to the eave) collapsed into maximal differing runs; the roof as a
 * dominant pair. Both sides in NAMED block space.
 * @param {{prior:{zones:Record<string,{dominant:string}>, storeyDivide:number, upperTop:number},
 *          derived:{bands:{yRange:[number,number], dominantBlock:string}[],
 *                   roof:{dominantBlock:string}},
 *          yMin:number}} args
 * @returns {{wallDiffs:{yRange:[number,number], prior:string, derived:string}[],
 *            roofDominant:{prior:string|null, derived:string, changed:boolean}}}
 */
export function diffZoneMaps({ prior, derived, yMin }) {
  const priorWallAt = (y) =>
    bareBlock(y < prior.storeyDivide ? prior.zones.base?.dominant ?? null : prior.zones.upper?.dominant ?? null);
  const sorted = [...derived.bands].sort((a, b) => a.yRange[0] - b.yRange[0]);
  const derivedWallAt = (y) => {
    for (const b of sorted) if (y >= b.yRange[0] && y <= b.yRange[1]) return bareBlock(b.dominantBlock);
    return y < sorted[0].yRange[0] ? bareBlock(sorted[0].dominantBlock) : bareBlock(sorted[sorted.length - 1].dominantBlock);
  };
  const wallDiffs = [];
  const yTop = prior.upperTop - 1;
  let run = null;
  for (let y = yMin; y <= yTop; y++) {
    const p = priorWallAt(y), d = derivedWallAt(y);
    if (p !== d) {
      if (run && run.prior === p && run.derived === d && run.yRange[1] === y - 1) {
        run.yRange[1] = y;
      } else {
        run = { yRange: [y, y], prior: p, derived: d };
        wallDiffs.push(run);
      }
    } else {
      run = null;
    }
  }
  const priorRoof = prior.zones.roof?.dominant ? bareBlock(prior.zones.roof.dominant) : null;
  const derivedRoof = bareBlock(derived.roof.dominantBlock);
  return {
    wallDiffs,
    roofDominant: { prior: priorRoof, derived: derivedRoof, changed: priorRoof !== derivedRoof },
  };
}
