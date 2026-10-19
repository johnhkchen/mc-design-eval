// 35 East 50th Street, 1930: a Midtown commercial and office block in the Art Deco masonry manner, 4 storeys (12 blocks)
// on a 13 x 27 footprint with a 3-storey rear wing. The street is the high-z side (x 0..11, the 12-wide frontage). Lidar roofs are median-smoothed over
// 3x3 and snapped to two clean tiers: 9 (3 storeys, rear wing) and 12 (4 storeys, the main block). Every column stands
// solid from y 0 (foundation) or its own ground up to its tier, so nothing hangs.
// Materials: polished granite sill course, calcite piers and walls, smooth quartz quoins and cornice, polished blackstone
// spandrel bands, cyan stained-glass windows in 2-wide bays between 1-wide piers, clear glass shopfront with an iron door
// on the centre pier, a stone roof deck with a small stone-brick penthouse. Interior is air behind the glazing with a
// floor slab per storey (no rooms); glowstone lamps sit behind some windows and in the lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035463.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 13, D = 27, H = 26;

const MAT = {
  foundation: "polished_granite", sill: "polished_granite", pier: "calcite", quoin: "smooth_quartz",
  spandrel: "polished_blackstone", glass: "cyan_stained_glass_pane", shop: "glass_pane", cornice: "smooth_quartz",
  floor: "smooth_stone", roof: "stone", lamp: "glowstone", vent: "stone_bricks", ventCap: "smooth_quartz",
};
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const DOOR_X = 6;                                    // the street entrance sits on the centre pier of the 12-wide front
const STREET_Z = D - 1;                              // high z is the street

// Footprint: cells with a roof, minus lidar specks (a cell needs two footprint neighbours to stay).
const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, g, r] of cells) if (r > 0) info.set(key(x, z), { g, r });
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (let pass = 0; pass < 2; pass++) {
  for (const k of [...info.keys()]) {
    const [x, z] = k.split(",").map(Number);
    if (NB4.filter(([dx, dz]) => info.has(key(x + dx, z + dz))).length < 2) info.delete(k);
  }
}

// Tiers: the lidar roofs capped at 12 (its 14s sit on the 1-cell edge and read as stray towers), median-smoothed over
// 5x5 so the edge returns cannot stand as 1-wide stacks, then snapped to 9 or 12 (3-block storeys).
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
const TIER = (v) => (v <= 10 ? 9 : 12);
const top = new Map(), gnd = new Map();
for (const [k, c] of info) {
  const [x, z] = k.split(",").map(Number);
  const nb = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = info.get(key(x + dx, z + dz)); if (n) nb.push(Math.min(n.r, 12)); }
  top.set(k, TIER(median(nb)));
  gnd.set(k, c.g);
}

const T = (x, z) => top.get(key(x, z)) ?? 0;
const solid = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < T(x, z);
// Exposed sides of a block: S = street (high z), N = rear, E = high x, W = low x.
const FACES = [["S", 0, 1], ["N", 0, -1], ["E", 1, 0], ["W", -1, 0]];
const faces = (x, y, z) => FACES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([f]) => f);
const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

const plan = new Map(), facade = new Set();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(K(x, y, z), { block, state });

for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z), g = gnd.get(k);
  for (let y = 0; y < t; y++) {
    const fs = faces(x, y, z);
    if (y < g) {                                     // foundation fills from y 0 up to this cell's ground
      if (fs.length) { put(x, y, z, MAT.foundation); facade.add(K(x, y, z)); } else put(x, y, z, MAT.floor);
      continue;
    }
    if (!fs.length) {                                // interior: a floor slab per storey, roof deck on top
      if (y === t - 1) put(x, y, z, MAT.roof);
      else if (y === g || y % 3 === 0) put(x, y, z, MAT.floor);
      continue;
    }
    facade.add(K(x, y, z));
    if (y === t - 1) { put(x, y, z, MAT.cornice); continue; }        // cornice on every exposed top edge
    if (y === g) { put(x, y, z, MAT.sill); continue; }               // sill course on the ground
    if (y % 3 === 0) { put(x, y, z, MAT.spandrel); continue; }       // spandrel band at each storey line
    if (fs.length >= 2) { put(x, y, z, MAT.quoin); continue; }       // corner quoins
    const u = fs.includes("S") || fs.includes("N") ? x : z;          // along the face: 1-wide piers every 3 cells
    if (u % 3 === 0) { put(x, y, z, MAT.pier); continue; }
    const street = fs.includes("S") && y < 3;
    put(x, y, z, street ? MAT.shop : MAT.glass);
  }
}

// Street entrance: an iron door on the centre pier, lower and upper half, on the sill.
for (const half of ["lower", "upper"]) {
  const y = half === "lower" ? 1 : 2;
  if (T(DOOR_X, STREET_Z) > y) put(DOOR_X, y, STREET_Z, "iron_door", DOOR(half));
}

// Warm lights: a lobby lamp behind the door, and glowstone behind some upper-storey windows (only on the row above a
// floor slab, so it always stands on something).
const lobby = [DOOR_X, 1, STREET_Z - 1];
if (!plan.has(K(...lobby)) && !faces(...lobby).length) put(...lobby, MAT.lamp);
for (const k of facade) {
  const [x, y, z] = k.split(",").map(Number);
  const p = plan.get(k);
  if (!p || p.block !== MAT.glass || y % 3 !== 1) continue;
  if ((x * 7 + y * 5 + z * 3) % 10 !== 0) continue;
  const fs = faces(x, y, z);
  if (fs.length !== 1) continue;
  const [dx, dz] = inward[fs[0]];
  const ix = x + dx, iz = z + dz;
  if (!solid(ix, y, iz) || faces(ix, y, iz).length || plan.has(K(ix, y, iz))) continue;
  put(ix, y, iz, MAT.lamp);
}

// Rooftop penthouse: a 3 x 3 stone-brick box, two blocks tall with a quartz cap, on the 12-tier roof. It is placed only
// if the whole patch is interior roof deck, so it never comes out as a thin stack.
const patchOk = (x0, z0) => {
  for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 3; x++) if (T(x, z) !== 12 || faces(x, 11, z).length) return false;
  return true;
};
const ph = [];
for (let z = 0; z <= D - 3 && !ph.length; z++) for (let x = 0; x <= W - 3 && !ph.length; x++) if (patchOk(x, z)) ph.push([x, z]);
if (ph.length) {
  const [x0, z0] = ph[0];
  for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 3; x++) for (const y of [12, 13]) put(x, y, z, y === 13 ? MAT.ventCap : MAT.vent);
}

// Pane connections: a pane joins the facade neighbours in its own wall plane, nothing else.
const paneState = (x, y, z) => {
  const alongX = faces(x, y, z).some((f) => f === "S" || f === "N");   // a street or rear wall runs along x
  const a = facade.has(K(x + 1, y, z)), b = facade.has(K(x - 1, y, z));
  const c = facade.has(K(x, y, z + 1)), d = facade.has(K(x, y, z - 1));
  const s = alongX
    ? { north: "false", south: "false", east: String(a), west: String(b) }
    : { north: String(d), south: String(c), east: "false", west: "false" };
  return { ...s, waterlogged: "false" };
};

const v = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  v.set(x, y, z, block, block.endsWith("glass_pane") ? paneState(x, y, z) : state);
}
const { blocks, palette } = v.save(`${DIR}/NYC1035463.nbt`);
console.log(`NYC1035463: ${blocks} blocks, palette ${palette}`);
