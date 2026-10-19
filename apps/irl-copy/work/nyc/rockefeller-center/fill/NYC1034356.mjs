// 62 West 47th Street, 1926: a commercial office building of the setback era, 32 x 28 cells on the 47th Street lot.
// The street is the high-z edge (south). Massing: lidar roofs median-smoothed over 3x3 (zero holes filled from their
// neighbours, cells that come out under 10 blocks dropped) and snapped to five tiers: 5, 9, 13, 17 and 20 storeys.
// Materials: buff limestone walls (smooth sandstone) with chiseled sandstone storey bands and cornices, polished diorite
// base, polished andesite piers, steel-frame bays of glass panes, a glazed shopfront with a door on the street front,
// and an oxidised copper stepped crown on the tallest tier. Penthouse boxes sit on the 13- and 17-storey setbacks.
// Interior is air behind the glazing with a floor slab per storey (no rooms); some windows carry a lantern on the floor.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034356.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 32, Z = 28, H = 72;

// Tier tops above y 0, each a whole number of 3-block storeys.
const TIERS = [15, 27, 39, 51, 60];
const MAXT = TIERS[TIERS.length - 1];
const tierOf = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b));
const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const median = (a) => { a = a.filter((v) => v > 0).sort((p, q) => p - q); return a.length ? a[a.length >> 1] : 0; };

const TOP = new Map();                                    // "x,z" -> tier top; lidar noise smoothed away
for (const k of roofAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined) nb.push(r); }
  const m = median(nb);
  if (m >= 10) TOP.set(k, tierOf(m));
}

const top = (x, z) => TOP.get(key(x, z)) ?? 0;
const solid = (x, y, z) => y < top(x, z);
const FACES = [["S", 0, 1], ["N", 0, -1], ["E", 1, 0], ["W", -1, 0]];
const faces = (x, y, z) => FACES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([f]) => f);
const INWARD = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

// The street front: the high-z edge of each column; the entrance bay is centred on the middle of that front.
const zMax = new Map();
for (const k of TOP.keys()) { const [x, z] = k.split(",").map(Number); zMax.set(x, Math.max(zMax.get(x) ?? -1, z)); }
const frontX = [...zMax].filter(([x, z]) => top(x, z) >= 27).map(([x]) => x).sort((a, b) => a - b);
const XC = frontX[frontX.length >> 1];
const street = (x, z) => z === zMax.get(x);

const PANE = {
  alongX: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },   // on a north or south wall
  alongZ: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },   // on an east or west wall
};
const LANTERN = { hanging: "false", waterlogged: "false" };

const g = new Voxels([X, H, Z]);
const lanterns = [];

for (const [k, t] of TOP) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const s = Math.floor(y / 3), r = y % 3;               // storey s, row r within it (0 = band, 1-2 = glazing)
    const fs = faces(x, y, z);
    if (!fs.length) {                                     // interior: a floor slab per storey, the roof deck on top
      if (r === 0 || y === t - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, "chiseled_sandstone"); continue; }     // cornice
    const face = fs.includes("S") ? "S" : fs[0];
    const along = face === "S" || face === "N" ? x : z;
    if (r === 0) { g.set(x, y, z, s === 0 ? "polished_diorite" : "chiseled_sandstone"); continue; }   // base, storey bands
    if (fs.length >= 2) { g.set(x, y, z, "polished_andesite"); continue; }                            // corner piers
    if (s === 0 && face === "S" && Math.abs(x - XC) <= 2 && street(x, z)) {                             // entrance bay
      if (x === XC) g.set(x, y, z, "dark_oak_door", { facing: "south", hinge: "left", open: "false", powered: "false", half: r === 1 ? "lower" : "upper" });
      else if (Math.abs(x - XC) === 2) g.set(x, y, z, "polished_andesite");
      else g.set(x, y, z, "glass");
      continue;
    }
    if (along % 4 === 0) { g.set(x, y, z, "polished_andesite"); continue; }                           // bay piers
    g.set(x, y, z, "glass_pane", face === "S" || face === "N" ? PANE.alongX : PANE.alongZ);
    if (s > 0 && r === 1 && (x * 7 + y * 5 + z * 3) % 13 === 0) lanterns.push([x, y, z, face]);
  }
}

// Warm light: a lantern standing on the floor slab just inside some windows.
for (const [x, y, z, face] of lanterns) {
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (solid(ix, y, iz) && !faces(ix, y, iz).length && y < top(ix, iz) - 1) g.set(ix, y, iz, "lantern", LANTERN);
}

// Parapets: the edge of every tier that stands above a lower neighbour (or open ground) gets a low wall on its cornice.
for (const [k, t] of TOP) {
  const [x, z] = k.split(",").map(Number);
  if (FACES.some(([, dx, dz]) => top(x + dx, z + dz) < t)) g.set(x, t, z, "stone_brick_wall");
}

// Penthouse boxes on the 13- and 17-storey setbacks: a 4 x 4 box, three blocks high, with glazed sides and a cornice.
for (const T of [51, 39]) {
  let spot = null;
  for (const [k, t] of TOP) {
    if (t !== T || spot) continue;
    const [x0, z0] = k.split(",").map(Number);
    let ring = true;
    for (let dz = -1; dz <= 4 && ring; dz++) for (let dx = -1; dx <= 4 && ring; dx++) if (top(x0 + dx, z0 + dz) !== T) ring = false;
    if (ring) spot = [x0, z0];
  }
  if (!spot) continue;
  const [x0, z0] = spot;
  for (let z = z0; z < z0 + 4; z++) for (let x = x0; x < x0 + 4; x++) {
    const edge = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 3;
    g.set(x, T, z, edge ? "smooth_sandstone" : "smooth_stone");                  // floor slab
    if (edge) g.set(x, T + 1, z, "smooth_sandstone");
    g.set(x, T + 2, z, "chiseled_sandstone");                                   // cornice and roof cap over the whole box
  }
  for (let z = z0; z < z0 + 4; z++) for (let x = x0; x < x0 + 4; x++) {         // glazed mid-bay on each side, one row up
    const onNS = z === z0 || z === z0 + 3, onEW = x === x0 || x === x0 + 3;
    if ((onNS && (x === x0 + 1 || x === x0 + 2)) || (onEW && !onNS && (z === z0 + 1 || z === z0 + 2)))
      g.set(x, T + 1, z, "glass_pane", onNS ? PANE.alongX : PANE.alongZ);
  }
}

// The crown: three stepped copper tiers on the tallest tier, then a lightning-rod finial, centred on the tier.
const tall = [...TOP].filter(([, t]) => t === MAXT).map(([k]) => k.split(",").map(Number));
const mx = tall.reduce((a, p) => a + p[0], 0) / tall.length, mz = tall.reduce((a, p) => a + p[1], 0) / tall.length;
const clear = (x, z, r) => { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (top(x + dx, z + dz) !== MAXT) return false; return true; };
const dist = (p) => (p[0] - mx) ** 2 + (p[1] - mz) ** 2;
let cr = 2, C = tall.filter(([x, z]) => clear(x, z, 2)).sort((a, b) => dist(a) - dist(b))[0];
if (!C) { cr = 1; C = tall.filter(([x, z]) => clear(x, z, 1)).sort((a, b) => dist(a) - dist(b))[0]; }
if (C) {
  for (let k = 0; k <= cr; k++) {
    const rad = cr - k, y = MAXT + k;
    for (let dz = -rad; dz <= rad; dz++) for (let dx = -rad; dx <= rad; dx++) g.set(C[0] + dx, y, C[1] + dz, "oxidized_cut_copper");
  }
  g.set(C[0], MAXT + cr + 1, C[1], "lightning_rod");
}

const { blocks, palette } = g.save(`${DIR}/NYC1034356.nbt`);
console.log(`NYC1034356: ${blocks} blocks, ${palette} palette entries, tiers ${JSON.stringify(TIERS)}, ${lanterns.length} lit window candidates, crown ${C ? "centred" : "skipped"}`);
