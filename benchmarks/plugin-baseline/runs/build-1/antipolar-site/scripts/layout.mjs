// Phase 1 for the Antipolar expansion (the swamp south of Polarton): the land reclaimed. A levee ring, its crest the
// street at Polarton's lane grade, closes off the west half of the swamp; inside it the water is pumped out and the
// floor lies BELOW the swamp's surface, in three polders split by low cross-dikes (New Orleans behind its levees).
// Frame: the export antipolar_expansion_002_raw.nbt (its corner is Polarton's (18, 3, 64)); y is the export's own:
// the swamp's water surface is y 0, the shore meadow y 1, Polarton's lanes and the levee crests y 2, the plateau y 8,
// the polder floor y -1 (below the export: the landscape file reaches down to y -2 under the ring, every cell given).
// Every height is a TOP-BLOCK y; .5 = a bottom slab on top of that block.
import { readSite } from "./site.mjs";
import { slabProfile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";

export const CREST = 2, FLOOR = -1, DIKE = 1;
// the ring: centre lines of the four levees
export const RING = { west: 20, east: 63, north: 46, south: 146 };
// the cross-dikes (crest y 1, 3 wide) between the polders, centre z
export const CROSS = [87, 117];
// a levee: crest 5 wide (|d| <= 2) at y 2, then a grass bank stepping down a block a cell to the floor or the water
const leveeTop = (d) => (d <= 2 ? CREST : CREST - (d - 2));
const dikeTop = (d) => (d <= 1 ? DIKE : DIKE - (d - 1));

export const STREETS = [
  // Polarton's terrace road ends at (15..20, 28), top y 5, heading south: down to the ring's north-west corner
  { name: "terrace descent", startY: 5, endY: CREST, min: CREST, points: [[17.5, 28], [17.5, 33], [18.5, 38], [20, 44], [20, 46]] },
  { name: "north levee", level: CREST, points: [[20, 46], [63, 46]] },
  { name: "west levee", level: CREST, points: [[20, 46], [20, 146]] },
  { name: "east levee", level: CREST, points: [[63, 46], [63, 146]] },
  { name: "south levee", level: CREST, points: [[20, 146], [63, 146]] },
  // from the ring's north-east corner on to the village's back, a dike along the swamp's edge
  { name: "shore street", level: CREST, points: [[63, 46], [64, 40], [68, 35], [76, 34], [96, 34]] },
  // up the draw (x 50, z 150..172) to the plateau
  { name: "bluff road", startY: CREST, min: CREST, points: [[51, 146], [51, 151], [51, 158], [51, 165], [51, 172], [51, 177]] },
  { name: "plateau road west", level: 8, points: [[51, 177], [40, 177], [28, 177], [16, 177], [6, 177]] },
  { name: "plateau road east", startY: 8, points: [[51, 177], [62, 177], [74, 177], [86, 177]] },
];

// inside the ring: floor x 25..58, z 51..141
const IN = { x0: RING.west + 5, x1: RING.east - 5, z0: RING.north + 5, z1: RING.south - 5 };
export const POLDERS = [
  { name: "polder 1, the faubourg", use: "houses below the levee on a polder street (shotgun and creole cottages)", rect: [IN.x0, IN.z0, IN.x1, CROSS[0] - 3], color: [255, 170, 60] },
  { name: "polder 2, the fields", use: "cotton and corn on drained ground, a ditch every 9 rows (keeps the farmland wet)", rect: [IN.x0, CROSS[0] + 3, IN.x1, CROSS[1] - 3], color: [240, 230, 80] },
  { name: "polder 3, the rice beds", use: "rice paddies flooded a block deep behind low bunds (Farmer's Delight rice)", rect: [IN.x0, CROSS[1] + 3, IN.x1, IN.z1], color: [120, 220, 200] },
];
export const ZONES = [
  { name: "shore row", use: "houses on the meadow between Polarton's back fences, the village's backs and the levee street", rect: [21, 27, 96, 41], color: [255, 200, 120] },
  { name: "wetland", use: "kept: willows, mud flats and open water outside the levees", rect: [66, 42, 139, 147], color: [70, 160, 200], alpha: 0.1 },
  { name: "willow island", use: "the low island in the swamp: a park, reached later by a boardwalk off the east levee", rect: [66, 72, 92, 96], color: [60, 200, 120] },
  { name: "landing", use: "a fishing landing on the west levee's swamp side", rect: [8, 88, 16, 104], color: [120, 200, 230] },
  { name: "pump house", use: "where the ditches meet the levee: a Create pump lifts the water over into the swamp", rect: [58, 98, 66, 106], color: [200, 120, 255] },
  { name: "bluff grove", use: "the slope up to the plateau: pecan orchard (no earthworks)", rect: [0, 150, 44, 170], color: [170, 210, 90] },
  { name: "farmstead", use: "barn, granary and the farm family's house at the top of the bluff road", rect: [56, 160, 84, 174], color: [255, 120, 120] },
  { name: "fields west", use: "corn and cotton on the level plateau", rect: [0, 179, 46, 194], color: [240, 230, 80] },
  { name: "fields east", use: "tobacco and a curing-barn plot", rect: [56, 179, 92, 194], color: [240, 200, 60] },
  { name: "low pasture", use: "the wet meadow south-east: pasture and hay, ground left as it is", rect: [96, 150, 139, 194], color: [150, 230, 120] },
];

const chaikin = (pts, n) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [p, q] = [pts[i], pts[i + 1]]; o.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); } o.push(pts.at(-1)); pts = o; } return pts; };
const resample = (pts, step = 1) => { const o = [pts[0]]; let carry = 0; for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - carry; while (t <= L) { o.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += step; } carry = L - (t - step); } if (Math.hypot(o.at(-1)[0] - pts.at(-1)[0], o.at(-1)[1] - pts.at(-1)[1]) > 0.3) o.push(pts.at(-1)); return o; };

export function computeLayout() {
  const site = readSite(), { X, Z, H } = site, K = (x, z) => `${x},${z}`;
  // T: the target per column { t: top y, surf, kind, water: y of a water surface on top (ditch, paddy) }
  const T = new Map(), set = (x, z, v, prio) => { if (x < 0 || z < 0 || x >= X || z >= Z) return; const o = T.get(K(x, z)); if (o && o.prio > prio) return; T.set(K(x, z), { ...v, prio }); };
  const inRing = (x, z) => x > RING.west && x < RING.east && z > RING.north && z < RING.south;

  // ---- the polder floor: everything inside the ring at y -1, grass ------------------------------------------------
  for (let z = RING.north + 1; z < RING.south; z++) for (let x = RING.west + 1; x < RING.east; x++) set(x, z, { t: FLOOR, surf: "grass_block", kind: "floor" }, 0);
  // ---- levee banks (the crest is the street, laid below): distance to the ring's square outline ------------------
  for (let z = RING.north - 6; z <= RING.south + 6; z++) for (let x = RING.west - 6; x <= RING.east + 6; x++) {
    const inX = z >= RING.north && z <= RING.south, inZ = x >= RING.west && x <= RING.east;
    const ds = [inX && Math.abs(x - RING.west), inX && Math.abs(x - RING.east), inZ && Math.abs(z - RING.north), inZ && Math.abs(z - RING.south)].filter((v) => v !== false);
    const dc = Math.min(...[[RING.west, RING.north], [RING.east, RING.north], [RING.west, RING.south], [RING.east, RING.south]].map(([cx, cz]) => Math.max(Math.abs(x - cx), Math.abs(z - cz))));
    const d = Math.min(dc, ...ds); if (d > 5) continue;
    const t = leveeTop(d), g = H[z]?.[x] ?? -99;
    if (inRing(x, z)) { if (t > FLOOR) set(x, z, { t, surf: "grass_block", kind: "levee" }, 1); }
    else if (t >= Math.max(0, g)) set(x, z, { t, surf: "grass_block", kind: "levee" }, 1); // outside, down to the water or the ground
  }
  // ---- cross-dikes: crest y 1, 3 wide, a farm lane on top --------------------------------------------------------
  for (const cz of CROSS) for (let z = cz - 3; z <= cz + 3; z++) for (let x = RING.west + 3; x <= RING.east - 3; x++) { const d = Math.abs(z - cz), t = dikeTop(d); if (t <= FLOOR) continue; set(x, z, { t, surf: d <= 1 ? "coarse_dirt" : "grass_block", kind: d <= 1 ? "dike lane" : "dike" }, 2); }

  // ---- streets (levee crests and the roads beyond the ring) ------------------------------------------------------
  const laid = new Map(), streets = [];
  const gnd = (x, z, half = 2) => { let s = 0, n = 0; for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const xx = Math.round(x) + dx, zz = Math.round(z) + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const h = H[zz][xx]; s += h < 0 ? 0 : h; n++; } return Math.max(1, n ? s / n : 1); };
  for (const spec of STREETS) {
    const pts = resample(spec.points.length > 2 ? chaikin(spec.points, 3) : spec.points, 1);
    let prof;
    if (spec.level != null) prof = pts.map(() => spec.level);
    else { const notes = []; prof = slabProfile(pts.map(([x, z]) => Math.max(spec.min ?? -9, gnd(x, z))), { startY: spec.startY, endY: spec.endY, notes }); if (notes.length) spec.notes = notes; }
    const cells = new Map();
    pts.forEach(([px, pz], i) => { for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const cx = Math.round(px) + dx, cz = Math.round(pz) + dz, d = Math.hypot(cx - px, cz - pz); if (d > 2.5 || cx < 0 || cz < 0 || cx >= X || cz >= Z) continue; const o = cells.get(K(cx, cz)); if (!o || o.d > d) cells.set(K(cx, cz), { x: cx, z: cz, t: prof[i], d }); } });
    for (const c of cells.values()) { if (!laid.has(K(c.x, c.z))) laid.set(K(c.x, c.z), c); set(c.x, c.z, { t: c.t, surf: c.d < 0.75 ? "gravel" : c.d < 1.75 ? "dirt_path" : "coarse_dirt", kind: "street" }, 5); }
    // a street raised over the swamp or the meadow keeps a grass bank down to what is beside it (the ring's banks are
    // drawn already)
    if (!/levee/.test(spec.name)) for (const c of cells.values()) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 3; k++) { const x = c.x + dx * k, z = c.z + dz * k; if (laid.has(K(x, z)) || inRing(x, z)) break; const t = Math.floor(c.t) - k, g = H[z]?.[x] ?? -99; if (t < Math.max(0, g)) break; set(x, z, { t, surf: "grass_block", kind: "bank" }, 1); }
    streets.push({ name: spec.name, pts, prof, cells: [...cells.values()], length: pts.length, from: prof[0], to: prof.at(-1), notes: spec.notes ?? [] });
  }

  // ---- inside the polders --------------------------------------------------------------------------------------
  const [P1, P2, P3] = POLDERS.map((p) => p.rect);
  // polder 1: a street down the middle (y -1, flat) and 12 x 14 house plots either side
  const midZ = Math.round((P1[1] + P1[3]) / 2), plots = [];
  for (let z = midZ - 2; z <= midZ + 2; z++) for (let x = P1[0] - 2; x <= P1[2]; x++) { const d = Math.abs(z - midZ); set(x, z, { t: FLOOR, surf: d < 1 ? "gravel" : d < 2 ? "dirt_path" : "coarse_dirt", kind: "polder street" }, 4); }
  for (const [z0, face] of [[midZ - 16, "south"], [midZ + 3, "north"]]) for (let x0 = P1[0] + 1; x0 + 11 <= P1[2]; x0 += 14) { const z1 = z0 + 13; if (z1 > P1[3] || z0 < P1[1]) continue; plots.push({ x0, z0, x1: x0 + 11, z1, face, pad: FLOOR, gate: [x0 + 5, face === "south" ? z1 + 1 : z0 - 1] }); }
  // the polder street climbs to the west levee by a slab ramp along the levee's inner bank (half steps, 3 then a landing)
  const ramps = [];
  const ramp = (x0, x1, zTop, dir, from, to) => { const prof = slabProfile(Array(10).fill(0).map((_, i) => from + (to - from) * i / 9), { startY: from, endY: to }); prof.forEach((t, i) => { for (let x = x0; x <= x1; x++) set(x, zTop + dir * i, { t, surf: "dirt_path", kind: "ramp" }, 6); }); ramps.push({ x0, x1, z0: Math.min(zTop, zTop + dir * 9), z1: Math.max(zTop, zTop + dir * 9), from, to, prof }); };
  ramp(RING.west + 3, RING.west + 5, midZ - 12, 1, CREST - 0.5, FLOOR);
  // polder 2: field ditches every 9 rows (water at y -1 on dirt at y -2), meeting a collector along the east toe
  const ditches = [];
  for (let z = P2[1] + 4; z <= P2[3]; z += 9) { ditches.push(z); for (let x = P2[0]; x <= P2[2]; x++) set(x, z, { t: FLOOR - 1, surf: "dirt", water: FLOOR, kind: "ditch" }, 3); }
  for (let z = P2[1]; z <= P2[3]; z++) set(P2[2], z, { t: FLOOR - 1, surf: "dirt", water: FLOOR, kind: "ditch" }, 3);
  // polder 3: paddies a block deep (water y -1 on mud y -2), 1-wide bunds between them every 8
  for (let z = P3[1]; z <= P3[3]; z++) for (let x = P3[0]; x <= P3[2]; x++) { const bund = (x - P3[0]) % 8 === 0 || (z - P3[1]) % 8 === 0 || x === P3[2] || z === P3[3]; set(x, z, bund ? { t: FLOOR, surf: "grass_block", kind: "bund" } : { t: FLOOR - 1, surf: "mud", water: FLOOR, kind: "paddy" }, 3); }

  // ---- earthworks tally ----------------------------------------------------------------------------------------
  let cut = 0, fill = 0, drained = 0, belowExport = 0;
  for (const [k, v] of T) { const [x, z] = k.split(",").map(Number), g = H[z][x], top = Math.floor(v.t) + (v.t % 1 ? 1 : 0);
    if (g < 0) { if (v.water == null && top < 0) drained++; fill += Math.max(0, top + 1); } else if (g > top) cut += g - top; else fill += top - g;
    if (v.t < 0) belowExport += v.t <= FLOOR - 1 ? 2 : 1; }
  return { site, T, streets, plots, ramps, ditches, polders: POLDERS, zones: ZONES, earth: { cut, fill, drainedCells: drained, cellsBelowTheExport: belowExport } };
}
