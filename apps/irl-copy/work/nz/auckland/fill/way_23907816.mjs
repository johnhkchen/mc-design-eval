// Fisher Building: an interwar stripped-classical commercial tower, the record gives no era so this is a judgement from
// its massing (about 11 storeys, a stepped lidar roof). Cream render (smooth quartz) on 4-block storeys with dark stone
// bands at each floor line, quartz piers between the window bays, a lit shopfront on the lowest street edge under a dark
// awning with a centred door, lit windows behind the glass, a plant room on the top tier.
// Lidar roofs are smoothed into flat tiers: tower 46, setback 44, setback 40, wings 32 / 26, podium edges 12 / 5.
// Every column is solid from y 0 up to its tier (nothing floats); the only air is one block behind each window or shop
// glass, so the facade reads as a wall with depth.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_23907816.cells.json", "utf8"));
const SIZE = [31, 59, 28];

const CORE = "stone", ROOF = "gray_concrete", CORNICE = "stone_bricks", BAND = "stone_bricks", BASE = "stone_bricks";
const WALL = "smooth_quartz", PIER = "quartz_pillar", GLASS = "light_blue_stained_glass_pane", SHOP = "cyan_stained_glass_pane";
const AWNING = "black_concrete", DOOR = "iron_door", LAMP = "glowstone", PLANT = "smooth_quartz", PLANT_CAP = "stone_bricks";

const tierOf = (R) => (R >= 45 ? 46 : R >= 43 ? 44 : R >= 39 ? 40 : R >= 29 ? 32 : R >= 25 ? 26 : R >= 11 ? 12 : 5);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const AXIS = { north: "z", south: "z", east: "x", west: "x" };
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const k2 = (x, z) => `${x},${z}`;

const cellMap = new Map();
for (const [x, z, g, R] of cells) cellMap.set(k2(x, z), { x, z, g, T: Math.max(tierOf(R), g + 4) });
const at = (x, z) => cellMap.get(k2(x, z));
const nb = (c, d) => at(c.x + DIRS[d][0], c.z + DIRS[d][1]);
const outside = (c, d) => !nb(c, d);

// The entrance: the three-bay run on one street edge with the lowest ground. The bay takes its highest ground as
// the entrance level, and the middle bay is the door.
let ent = null;
for (const c of cellMap.values()) for (const d of Object.keys(DIRS)) {
  if (!outside(c, d)) continue;
  const [ax, az] = AXIS[d] === "z" ? [1, 0] : [0, 1];
  const bay = [-1, 0, 1].map((o) => at(c.x + ax * o, c.z + az * o));
  if (bay.some((b) => !b || !outside(b, d))) continue;
  const lvl = Math.max(...bay.map((b) => b.g));
  if (!ent || lvl < ent.lvl) ent = { d, bay, lvl };
}
if (!ent) throw new Error("no three-bay street edge for the entrance");
for (const b of ent.bay) { b.g = ent.lvl; b.T = Math.max(b.T, b.g + 4); }
const mid = ent.bay[1];

// The faces of c at height y that open on air: outside the footprint, or above a lower neighbour's top.
const faces = (c, y) => (y <= c.g || y >= c.T ? [] : Object.keys(DIRS).filter((d) => { const n = nb(c, d); return !n || n.T <= y; }));
const pane = (d) => (AXIS[d] === "z"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels(SIZE);
for (const c of cellMap.values()) {
  for (let y = 0; y < c.T; y++) g.set(c.x, y, c.z, y === c.T - 1 ? ROOF : CORE);
  // the foundation on an open side is dressed stone, not earth
  if (Object.keys(DIRS).some((d) => outside(c, d))) for (let y = 0; y <= c.g; y++) g.set(c.x, y, c.z, BASE);
}

// The facade: every open face from its ground up to its top, one storey pattern for the whole building.
let windows = 0, lamps = 0;
for (const c of cellMap.values()) for (let y = c.g + 1; y < c.T; y++) {
  const f = faces(c, y);
  if (!f.length) continue;
  const d = f.find((k) => outside(c, k)) ?? f[0];
  const corner = f.some((k) => AXIS[k] !== AXIS[d]);
  const [dx, dz] = DIRS[d];
  const inward = at(c.x - dx, c.z - dz);
  const air = inward && !faces(inward, y).length;
  if (ent && c === mid && (y === ent.lvl + 1 || y === ent.lvl + 2)) {
    g.set(c.x, y, c.z, DOOR, { facing: d, half: y === ent.lvl + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    if (air) g.set(inward.x, y, inward.z, "air");
    continue;
  }
  const u = AXIS[d] === "z" ? c.x : c.z;
  const shopRow = y === c.g + 2 && y <= 4;
  if (y === c.T - 1) g.set(c.x, y, c.z, CORNICE);
  else if (y === c.g + 1 && y <= 4) g.set(c.x, y, c.z, BASE);
  else if (y === 3 && c.g <= 1) g.set(c.x, y, c.z, AWNING);   // one awning line at y 3, not a step per ground level
  else if (shopRow || y % 4 === 1 || y % 4 === 2) {
    if (corner || u % 3 === 0) g.set(c.x, y, c.z, PIER);
    else {
      g.set(c.x, y, c.z, shopRow ? SHOP : GLASS, pane(d));
      if (air) {
        g.set(inward.x, y, inward.z, "air");
        windows++;
        // warm light behind glass: every shop bay, one window in four above
        const h = hash(c.x, y, c.z);
        if (shopRow ? h % 3 !== 0 : y % 4 === 1 && h % 4 === 0) { g.set(inward.x, y, inward.z, LAMP); lamps++; }
      }
    }
  } else if (y % 4 === 0) g.set(c.x, y, c.z, BAND);
  else g.set(c.x, y, c.z, corner ? PIER : WALL);
}

// The door opens on a one-block vestibule (air), and the entrance bay shares the awning line.
// The roof plant room: a 3x3 box on the top tier, at the core's centre, standing on the roof surface.
const top = [...cellMap.values()].filter((c) => c.T === 46);
const solid3 = (c) => [-1, 0, 1].every((i) => [-1, 0, 1].every((j) => at(c.x + i, c.z + j)?.T === 46));
const cands = top.filter(solid3);
const mx = top.reduce((s, c) => s + c.x, 0) / top.length, mz = top.reduce((s, c) => s + c.z, 0) / top.length;
const plant = cands.reduce((best, c) => ((c.x - mx) ** 2 + (c.z - mz) ** 2 < (best.x - mx) ** 2 + (best.z - mz) ** 2 ? c : best));
for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
  for (let y = 46; y <= 47; y++) g.set(plant.x + i, y, plant.z + j, PLANT);
  g.set(plant.x + i, 48, plant.z + j, PLANT_CAP);
}

const info = g.save(DIR + "way_23907816.nbt");
console.log(JSON.stringify({ ...info, entrance: ent.d, entranceLevel: ent.lvl, windows, lamps, plant: [plant.x, plant.z] }));
