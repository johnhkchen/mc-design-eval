// Phase 1 for the Antipolar expansion (the swamp south of Polarton): streets and zones, as data.
// Frame: the export antipolar_expansion_002_raw.nbt; its corner is Polarton's (18, 3, 64). y is the export's own:
// the swamp's water surface is y 0, the shore meadow's grass y 1, Polarton's lanes y 2, the south plateau y 8.
// Heights below are TOP-BLOCK y (a road "at 1" has its gravel at y 1; .5 = a slab on top of that block).
import { readSite } from "./site.mjs";
import { plotsAlong } from "./street.mjs";
import { slabProfile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";

const chaikin = (pts, n) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [p, q] = [pts[i], pts[i + 1]]; o.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]); } o.push(pts.at(-1)); pts = o; } return pts; };
const resample = (pts, step = 1) => { const o = [pts[0]]; let carry = 0; for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - carry; while (t <= L) { o.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += step; } carry = L - (t - step); } if (Math.hypot(o.at(-1)[0] - pts.at(-1)[0], o.at(-1)[1] - pts.at(-1)[1]) > 0.3) o.push(pts.at(-1)); return o; };

// The streets. A street starting on another takes that street's height there; FLOOR keeps every street at least one
// block above the water (y 1: a causeway over the swamp, flush with the shore meadow).
export const FLOOR = 1;
export const STREETS = [
  // Polarton's terrace road ends at (15..20, 28), its top at y 5, heading south: carry it on down to the shore
  { name: "terrace descent", startY: 5, straight: 3, points: [[17.5, 28], [17.5, 33], [18, 38], [18.5, 44]] },
  // along the swamp's edge east, a plot's depth south of Polarton's back fences and the village's backs
  { name: "shore street", points: [[18.5, 45], [30, 45], [44, 45], [52, 42], [58, 36], [64, 33], [78, 33], [94, 33]] },
  // the causeway: across the swamp on a bank one block above the water
  { name: "causeway", points: [[18.5, 44], [20, 52], [23, 64], [27, 78], [31, 92], [35, 106], [40, 120], [45, 133], [49, 144], [51, 151]] },
  // up the draw (x 50, z 150..172: the one gentle way up the bluff) to the plateau
  { name: "bluff road", points: [[51, 151], [51, 158], [51, 165], [51, 172], [51, 177]] },
  // along the plateau, west and east of the bluff road's top
  { name: "plateau road west", points: [[51, 177], [40, 177], [28, 177], [16, 177], [6, 177]] },
  { name: "plateau road east", points: [[51, 177], [62, 177], [74, 177], [86, 177]] },
];

// The zones (rectangles [x0, z0, x1, z1]): what each part of the land is for. Buildings come later, per zone.
export const ZONES = [
  { name: "shore row", use: "houses on the shore street's north side (the village's next row, mill-village cottages)", rect: [20, 27, 96, 42], color: [255, 170, 60] },
  { name: "wetland", use: "kept as it is: willows, mud flats and open water; the causeway crosses it", rect: [0, 48, 139, 147], color: [70, 160, 200], alpha: 0.12 },
  { name: "landing", use: "a fishing landing and rice beds where the causeway meets the island's flats", rect: [33, 84, 52, 104], color: [120, 220, 200] },
  { name: "willow island", use: "the dry island in the swamp: a park, reached later by a boardwalk", rect: [62, 66, 92, 96], color: [60, 200, 120] },
  { name: "bluff grove", use: "the slope up to the plateau: pecan orchard (no earthworks)", rect: [0, 148, 44, 170], color: [170, 210, 90] },
  { name: "farmstead", use: "barn, granary and the farm family's house at the top of the bluff road", rect: [56, 160, 84, 174], color: [255, 120, 120] },
  { name: "fields west", use: "cotton and corn fields on the level plateau", rect: [0, 179, 46, 194], color: [240, 230, 80] },
  { name: "fields east", use: "tobacco fields and a curing-barn plot", rect: [56, 179, 92, 194], color: [240, 200, 60] },
  { name: "low pasture", use: "the wet meadow south-east: pasture and hay, fenced, ground left as it is", rect: [96, 150, 139, 194], color: [150, 230, 120] },
];
export const KEEP_OUT = [[0, 0, 139, 14], [0, 0, 63, 26], [0, 0, 14, 47]]; // Polarton and the village (built), and the mud bank west of the descent

export function computeLayout() {
  const site = readSite(), { X, Z, H, water } = site;
  // ground for a street: mean top across its width, open water counted as 0 (the bank fills it), never below FLOOR
  const gnd = (x, z, half = 2) => { let s = 0, n = 0; for (let dz = -half; dz <= half; dz++) for (let dx = -half; dx <= half; dx++) { const xx = Math.round(x) + dx, zz = Math.round(z) + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const h = H[zz][xx]; s += h < 0 ? 0 : h; n++; } return Math.max(FLOOR, n ? s / n : FLOOR); };
  const laid = new Map(), K = (x, z) => `${x},${z}`;
  const streets = [];
  for (const spec of STREETS) {
    const pts = resample(chaikin(spec.points, 3), 1);
    const hs = pts.map(([x, z]) => gnd(x, z));
    const at = (p) => laid.get(K(Math.round(p[0]), Math.round(p[1])))?.t;
    const y0 = spec.startY ?? at(pts[0]) ?? null, y1 = spec.endY ?? at(pts.at(-1)) ?? null;
    // a junction is a level landing: hold the joining street's first/last 3 blocks at the height it meets
    const head = y0 != null && spec.startY == null ? 3 : spec.straight ?? 0, tail = y1 != null ? 3 : 0;
    const notes = [];
    const mid = slabProfile(hs.slice(head, hs.length - tail), { startY: y0, endY: y1, notes });
    const prof = [...Array(head).fill(y0), ...mid, ...Array(tail).fill(y1)];
    const cells = new Map();
    pts.forEach(([px, pz], i) => { for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const cx = Math.round(px) + dx, cz = Math.round(pz) + dz, d = Math.hypot(cx - px, cz - pz); if (d > 2.5 || cx < 0 || cz < 0 || cx >= X || cz >= Z) continue; const o = cells.get(K(cx, cz)); if (!o || o.d > d) cells.set(K(cx, cz), { x: cx, z: cz, t: prof[i], d, i }); } });
    for (const c of cells.values()) if (!laid.has(K(c.x, c.z))) laid.set(K(c.x, c.z), c);
    // earthworks: cut above the top, fill below it (over open water the bank starts at the surface, y 0)
    let cut = 0, fill = 0, overWater = 0;
    for (const c of cells.values()) { const h = H[c.z][c.x], top = Math.floor(c.t); if (h < 0) { overWater++; fill += top + 1; } else if (h > top) cut += h - top; else fill += top - h; }
    let steps = 0; for (let i = 1; i < prof.length; i++) if (prof[i] !== prof[i - 1]) steps++;
    streets.push({ name: spec.name, pts, prof, cells: [...cells.values()], length: pts.length, from: prof[0], to: prof.at(-1), steps, cut, fill, overWater, notes });
  }
  const shore = streets.find((s) => s.name === "shore street");
  // shore street plots (12 x 14 like the kit modules) on its swamp side, and where there is room on its village side
  const taken = new Set([...laid.keys()]);
  // a pad may stand on the swamp's edge: open water there counts as ground at -1 (a pad at 1 fills two blocks)
  const site2 = { ...site, H: H.map((r) => Float64Array.from(r, (h) => (h < 0 ? -1 : h))), hole: () => false, water: site.water.map((r) => r.map(() => false)), built: site.built };
  const keepOut = [...KEEP_OUT, ...ZONES.filter((z) => z.name !== "shore row").map((z) => z.rect)];
  const st = { pts: shore.pts, y: shore.prof, cells: shore.cells };
  const plots = plotsAlong(site2, st, "left", { keepOut, taken, maxFill: 3, maxCut: 3, setback: 1, pitch: 6.5 });
  return { site, streets, plots, zones: ZONES, laid };
}
