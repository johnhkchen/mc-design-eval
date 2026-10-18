// The Oak Lake master plan as data: streets, zones, the park plan and the house lots. plan.mjs draws it; build.mjs
// builds it into the land. computePlan() -> { site, SPEC, ZONES, FEATURES, LAKE_DRIVE, streets, roadAt, median, park,
// zoneAt, PARK, trailAt, lots }
import { readSite } from "./site.mjs";
import { street, plotsAlong } from "./street.mjs";
import { parkPlan } from "./park.mjs";

export function computePlan(site = readSite()) {
const { X, Z, H, water } = site;

// ---- streets (centre-line way points in the export's x, z) -----------------------------------------------------------
const LAKE_DRIVE = [[52, 46], [70, 40], [100, 38], [122, 50], [126, 80], [122, 108], [100, 120], [70, 120], [53, 108], [50, 76], [52, 46]];
// `points` lays a street along way points (smoothed into curves); `from`/`via`/`to` routes it by least cost instead
// ([x, z, heading], heading 0..7 = E, SE, S, SW, W, NW, N, NE). The crescents' way points follow the contours.
const SPEC = [
  // a boulevard: two 3-wide carriageways either side of a planted centre strip (7 wide in all)
  { name: "West Avenue", kind: "avenue", half: 3, points: [[24, 0], [24, 159]] },
  // the loop in two halves (a closed polyline collapses in the street simplifier: its ends coincide)
  { name: "Lake Drive", kind: "drive", points: LAKE_DRIVE.slice(0, 6) },
  { name: "Lake Drive ", kind: "drive", points: LAKE_DRIVE.slice(5) },
  { name: "Hillside Drive", kind: "drive", points: [[132, 0], [131, 30], [128, 56], [124, 64]] },
  { name: "Green Street", kind: "street", points: [[28, 45], [50, 46]] },
  { name: "Church Street", kind: "street", points: [[28, 108], [52, 108]] },
  // the north and south quarters each get a crescent off Lake Drive, bending with the ground
  { name: "North Crescent", kind: "street", points: [[62, 43], [60, 32], [70, 25], [96, 24], [108, 30], [112, 43]] },
  { name: "South Crescent", kind: "street", points: [[58, 119], [56, 128], [66, 135], [82, 135], [90, 129], [92, 121]] },
  // no lane south to the edge: the ground climbs 7 blocks in 8 onto the south plateau; the school fronts Lake Drive
];
// ---- zones: what is not house lots ------------------------------------------------------------------------------------
const ZONES = [
  { name: "Village green", kind: "green", rect: [29, 4, 47, 22] },
  { name: "Shops", kind: "shops", rect: [0, 2, 20, 38] },
  { name: "School grounds", kind: "school", rect: [96, 124, 156, 158] },
  { name: "Church", kind: "church", rect: [29, 112, 48, 134] },
  // the east slope climbs 8 -> 20 above the lake in 20 blocks: kept wooded with a trail, not terraced for lots
  { name: "Oak Woods", kind: "woods", rect: [129, 66, 159, 124] },
];
// buildings and places in the lake park (designed later, like the school and church)
const FEATURES = [{ name: "Crescent garden", at: [76, 33] }, { name: "Crescent garden", at: [66, 128] }, { name: "Bandstand", at: [88, 50] }];
const inPoly = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const park = (x, z) => inPoly(x + 0.5, z + 0.5, LAKE_DRIVE);
const zoneAt = (x, z) => ZONES.find((zn) => x >= zn.rect[0] && x <= zn.rect[2] && z >= zn.rect[1] && z <= zn.rect[3]);

const zoneRects = () => ZONES.map((zn) => zn.rect);
const streets = SPEC.map((s) => {
  const st = s.points ? street(site, { points: s.points, half: s.half ?? 2, maxGrade: 0.2, straightIn: 0 })
    : street(site, { from: s.from, via: s.via ?? [], to: s.to, half: s.half ?? 2, maxGrade: 0.2, straightIn: 0, keepOut: zoneRects() });
  if (!st) throw new Error(`no route for ${s.name}`);
  st.name = s.name; st.kind = s.kind; st.half = s.half ?? 2; return st; });
const roadAt = new Map(); for (const st of streets) for (const c of st.cells) roadAt.set(`${c.x},${c.z}`, st);
const PARK = parkPlan(site, { park, roadAt }), trailAt = new Map();
for (const t of PARK.trails) for (const k of t.cells) if (!trailAt.has(k)) trailAt.set(k, t);
const median = new Set(); for (const st of streets) if (st.half === 3) for (const c of st.cells) if (c.d <= 0.5) median.add(`${c.x},${c.z}`);
// lots shoulder to shoulder along each side of each street (Lake Drive's lake-view lots first), one block apart
const taken = new Set();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (roadAt.has(`${x},${z}`) || park(x, z) || zoneAt(x, z) || PARK.inArea(x, z)) taken.add(`${x},${z}`);
const lots = [];
const ORDER = ["West Avenue", "North Crescent", "South Crescent"];
const byOrder = [...streets].sort((a, b) => ((ORDER.indexOf(a.name) + 1 || 99) - (ORDER.indexOf(b.name) + 1 || 99)));
for (const st of byOrder) for (const side of ["left", "right"]) {
  // the street's own cells are free to plotsAlong (it tests them itself); everything else stays taken
  const own = st.cells.map((c) => `${c.x},${c.z}`); own.forEach((k) => taken.delete(k));
  for (const p of plotsAlong(site, st, side, { wide: 16, deep: 20, setback: 0, maxCut: 6, maxFill: 5, pitch: 17, taken })) lots.push({ ...p, street: st.name.trim() });
  own.forEach((k) => taken.add(k));
}
return { site, SPEC, ZONES, FEATURES, LAKE_DRIVE, streets, roadAt, median, park, zoneAt, PARK, trailAt, lots };
}
