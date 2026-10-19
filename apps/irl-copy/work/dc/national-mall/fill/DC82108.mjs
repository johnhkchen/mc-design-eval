// DC82108: a early-1900s red-brick apartment block on I Street SE, Capitol Hill, read from the lidar record. Two storeys
// of flats on a stone base over a plinth, a parapet, and a lower wing on the east side. Lidar roof, 5x5 median, three
// flat tiers: 2 blocks (low wing), 4 (one storey over the base), 6 (two storeys, the tallest core). Each storey is two
// blocks, a window row over a pale stone string course, so a storey has room for an air gap behind its glass and a
// floor slab. Walls are red brick with calcite string courses and cornice, stone-brick foundation and base course,
// piers every third cell along each face, two-cell glass bays with stone sills and heads, one dark-oak door on the
// north face under a stone lintel, and a pair of roof units on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC82108.cells.json`, "utf8"));
const W = 17, H = 18, D = 23;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 5x5 footprint neighbourhood (the 3x3 still ragged the west wall), then three flat tiers.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 1 ? 2 : s <= 3 ? 4 : 6;
};

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
const ENTRY = { x: 7, z: 0 };

const info = new Map();
for (const [x, z, g] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const corner = fs.some((f) => f === "N" || f === "S") && fs.some((f) => f === "E" || f === "W");
  const along = fs.some((f) => f === "N" || f === "S") ? x : z;            // index along the face the cell shows
  const pier = facade && (corner || along % 3 === 0);
  const door = x === ENTRY.x && z === ENTRY.z;
  info.set(key(x, z), { x, z, g, T: Math.max(tierOf(x, z), g + 1), facade, pier, door });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const BASE = "stone_bricks", BRICK = "bricks", TRIM = "calcite", INNER = "stone", GLASS = "glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air. Storey rows are absolute: even rows are the
// string course and floor lines, odd rows are the window rows, and the top row (T-1) is the cornice or deck.
const blockAt = (c, y) => {
  const { x, z, g, T } = c;
  if (y < g) return [c.facade ? BASE : INNER];                          // foundation under the cell's ground
  if (y >= T) return null;
  if (y === T - 1) return [c.facade ? TRIM : "gravel"];                  // cornice and parapet, gravel roof inside
  if (c.door) {
    if (y === g) return ["dark_oak_door", DOOR("lower")];
    if (y === g + 1) return ["dark_oak_door", DOOR("upper")];
    if (y === g + 2) return [TRIM];                                     // stone lintel over the door
  }
  if (!c.facade) {
    if (y % 2 === 0 || !c.room) return [INNER];                         // floor slabs, solid core
    const h = hash(x, y, z) % 19;                                       // room air behind a window row
    if (h === 0) return ["lantern", LANTERN];
    if (h === 1) return ["shroomlight"];
    if (h === 2) return ["glowstone"];
    return null;
  }
  if (y === 0) return [BASE];                                           // base course on the ground
  if (y % 2 === 0) return [TRIM];                                       // string course at each storey line
  if (c.pier) return [BRICK];
  if (c.door) return [TRIM];                                            // (door cell above the door: lintel row)
  return [GLASS];                                                       // window row: glass pane in the bay
};

const vox = new Voxels([W, H, D]);
const glass = new Set();
const gk = (x, y, z) => `${x},${y},${z}`;
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) glass.add(gk(c.x, y, c.z));
    vox.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Panes join their neighbours in the same row, so a bay reads as one continuous frame of glass.
const joins = (x, y, z) => ({ north: glass.has(gk(x, y, z - 1)), south: glass.has(gk(x, y, z + 1)), east: glass.has(gk(x + 1, y, z)), west: glass.has(gk(x - 1, y, z)) });
const TF = (b) => (b ? "true" : "false");
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const j = joins(x, y, z);
  vox.set(x, y, z, GLASS, { north: TF(j.north), south: TF(j.south), east: TF(j.east), west: TF(j.west), waterlogged: "false" });
}

// Warm lights stand on the floor slab inside, and a roof unit sits on the tallest core, above the lidar.
// The first lidar-tallest interior cell nearest the middle of the core gets a two-cell unit.
const core = [...info.values()].filter((c) => !c.facade && c.T === 6).sort((a, b) => (Math.abs(a.x - 8) + Math.abs(a.z - 11)) - (Math.abs(b.x - 8) + Math.abs(b.z - 11)));
if (core.length) {
  const u = core[0];
  vox.set(u.x, 6, u.z, "iron_block");
  if (core[1] && core[1].z === u.z && Math.abs(core[1].x - u.x) === 1) vox.set(core[1].x, 6, core[1].z, "iron_block");
}

const out = `${DIR}/DC82108.nbt`;
const r = vox.save(out);
console.log(`DC82108: ${r.blocks} blocks, palette ${r.palette} -> ${out}`);
