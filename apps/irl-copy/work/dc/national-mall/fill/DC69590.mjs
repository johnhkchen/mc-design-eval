// DC69590: 550 1st St NW, read from the lidar record as a six-storey concrete-and-glass educational block of the
// 1960s-70s (the era is a reading of the massing, not a fact from the address). A 13 x 30 footprint on a slope: a rim of
// five storeys (lidar 11) round a six-storey core (lidar 13), and a four-by-four penthouse tower on the south-west
// podium (lidar 14). Storeys are two blocks: a spandrel row of light concrete, then a row of tinted glass panes, with
// white concrete piers every third cell. A granite plinth follows the slope, and the stone foundation under the
// downhill cells shows as extra plinth, so nothing floats. The entrance is on the west street face, a recessed
// bronze-look door under a stone hood, with a hanging lantern inside. Some windows show warm lanterns standing
// on the floor slab behind the glass. Interiors are a floor slab per storey with air between, so no room is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69590.cells.json`, "utf8"));
const W = 13, D = 30, H = 16;

const key = (x, z) => `${x},${z}`;
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const inside = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// Per footprint cell: ground, the smoothed tier (lidar >= 14 is the penthouse, the rim is 11, the core 13), and its faces.
const info = new Map();
for (const [x, z, g, r] of cells) {
  const fs = FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
  const facade = fs.length > 0;
  const T = r >= 14 ? 14 : facade ? 11 : 13;
  info.set(key(x, z), { x, z, g, T, fs, facade });
}

// Piers on every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (c) => c.fs.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);
const ENTRY = { x: 0, z: 20 };
const isDoor = (x, z) => x === ENTRY.x && z === ENTRY.z;

// Warm lights: a glass pane on a lit window (not the ground floor, not a pier) gets a lantern standing on the
// floor slab just inside it. The entrance has a hanging lantern under the slab above it.
const lamps = new Map();
for (const c of info.values()) {
  if (!c.facade || isPier(c) || isDoor(c.x, c.z)) continue;
  for (let y = 3; y < c.T - 1; y += 2) {
    if (hash(c.x, y, c.z) % 6 !== 0) continue;
    const [ix, iz] = INWARD[c.fs[0]];
    const tx = c.x + ix, tz = c.z + iz;
    const t = info.get(key(tx, tz));
    if (t && !t.facade) lamps.set(`${tx},${y},${tz}`, false);
  }
}
lamps.set(`1,1,${ENTRY.z}`, true);

const GLASS = "light_blue_stained_glass_pane", PIER = "white_concrete", SPANDREL = "light_gray_concrete";
const BASE = "polished_granite", FOUND = "stone", SLAB = "smooth_stone", HOOD = "stone_brick_slab", PLANT = "light_gray_concrete";
const DOOR = "iron_door";
// The full blocks a glass pane joins to (vanilla panes connect to glass panes and solid faces).
const SOLID = new Set([PIER, SPANDREL, BASE, FOUND, SLAB]);

// The block id at one cell, or null for air.
const kindAt = (x, y, z) => {
  const c = info.get(key(x, z));
  if (!c) return null;
  const { g, T, facade } = c;
  if (y === T && !facade && x >= 5 && x <= 7 && (z === 17 || z === 18)) return PLANT;   // a plant room on the core roof
  if (y < 0 || y >= T) return null;
  if (facade && isDoor(x, z) && y <= 1) return DOOR;
  if (y < g) return facade ? BASE : FOUND;                              // the plinth, or the foundation under the slope
  if (y === T - 1) return SLAB;                                          // cornice and roof deck
  if (facade) {
    if (x === 0 && y === 2 && z >= 18 && z <= 22) return HOOD;           // stone hood over the entrance
    if (isPier(c)) return PIER;
    return y % 2 === 1 ? GLASS : SPANDREL;
  }
  if (y % 2 === 0) return SLAB;                                          // floor slab per storey
  if (lamps.has(`${x},${y},${z}`)) return "lantern";
  return null;                                                           // air behind the glass
};

const paneState = (x, y, z) => {
  const side = (dx, dz) => {
    const n = kindAt(x + dx, y, z + dz);
    return n === GLASS || SOLID.has(n);
  };
  return { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
};

const g3 = new Voxels([W, H, D]);
for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const id = kindAt(x, y, z);
  if (!id) continue;
  if (id === GLASS) g3.set(x, y, z, GLASS, paneState(x, y, z));
  else if (id === DOOR) g3.set(x, y, z, DOOR, { facing: "west", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  else if (id === HOOD) g3.set(x, y, z, HOOD, { type: "top", waterlogged: "false" });
  else if (id === "lantern") g3.set(x, y, z, "lantern", { hanging: String(lamps.get(`${x},${y},${z}`)), waterlogged: "false" });
  else g3.set(x, y, z, id);
}

const out = `${DIR}/DC69590.nbt`;
console.log(g3.save(out));
