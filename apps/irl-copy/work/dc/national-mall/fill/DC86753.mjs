import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86753 - 1401 N St NW, Washington DC 20005
// Residential-Apartment-Elevator: a 1920s-30s red-brick elevator apartment block on a granite base, with limestone
// (smooth quartz) storey lines and cornice, a stone-brick parapet, and a set-back penthouse on the lidar's 14-15 core.
// The lidar's 12 podium is the main roof; the 14 ring steps in to a 15 core. Storey lines sit on one datum (y = 1 + 3k)
// so the tiers stay level across the slope. Walls are a one-block skin with an air gap behind the glass; the rest is solid.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86753";
const W = 16, H = 27, D = 16;
const DATUM = 1;                                   // storey lines at y = DATUM + 3k
const DIRS4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const v3 = (x, y, z) => `${x},${y},${z}`;
const cells = new Map();
for (const [x, z, gr, rf] of raw) cells.set(key(x, z), { x, z, g: gr, r: rf });
const cellAt = (x, z) => cells.get(key(x, z));

// Penthouse: distance from the lidar's 14-15 core to anything lower (or outside the footprint)
const dist = new Map();
for (const c of cells.values()) dist.set(key(c.x, c.z), c.r >= 14 ? Infinity : 0);
for (let pass = 0; pass < 30; pass++) for (const c of cells.values()) {
  if (c.r < 14) continue;
  let d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS4) {
    const n = dist.get(key(c.x + dx, c.z + dz));
    d = Math.min(d, (n === undefined ? 0 : n) + 1);
  }
  dist.set(key(c.x, c.z), d);
}

// Tiers: penthouse core 15 (two cells in), a 14 setback ring at its edge, the 12 podium everywhere else (lidar's 13 is noise)
for (const c of cells.values()) {
  const d = dist.get(key(c.x, c.z));
  c.T = c.r >= 14 ? (d >= 2 ? 15 : 14) : 12;
  c.built = c.T - c.g >= 2;
}

// Solid: foundation below each cell's ground, and the built column from its ground to its tier
const inS = (x, y, z) => {
  const c = cellAt(x, z);
  if (!c || y < 0) return false;
  if (y < c.g) return true;
  return c.built && y < c.T;
};
const exposure = (x, y, z) => DIRS4.filter(([dx, dz]) => !inS(x + dx, y, z + dz));

// Skin: solid voxels with a horizontal neighbour outside the solid (the faces people see)
const skin = new Map();
for (const c of cells.values()) {
  if (!c.built) continue;
  for (let y = c.g; y < c.T; y++) {
    const e = exposure(c.x, y, c.z);
    if (e.length) skin.set(v3(c.x, y, c.z), e);
  }
}

const DOOR_X = 12;                                 // main entrance on the north face (z = 0), one bay wide
const skinMat = (c, x, y, z, e) => {
  if (y === c.T - 1) return ["stone_bricks"];                       // parapet cap
  if (y === c.T - 2) return ["smooth_quartz"];                      // cornice
  if (y === c.g) return ["polished_granite"];                       // base course
  if (c.z === 0 && z === 0 && x === DOOR_X && (y === c.g || y === c.g + 1)) {
    return ["dark_oak_door", { facing: "north", half: y === c.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (z === 0 && x >= DOOR_X - 1 && x <= DOOR_X + 1 && y === c.g + 2) return ["smooth_quartz"];   // entrance lintel
  if (z === 0 && x >= DOOR_X - 1 && x <= DOOR_X + 1 && y === c.g + 3) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];   // hood over the door
  if (z === 0 && (x === DOOR_X - 1 || x === DOOR_X + 1) && y < c.g + 2) return ["polished_granite"];       // door surround, stone against the brick
  if (y > c.g && (y - DATUM) % 3 === 0) return ["smooth_quartz"];   // storey line (sill and lintel)
  const [dx] = e[0];
  const u = dx !== 0 ? z : x;                                       // position along the face
  // the lidar outline is stair-stepped, so many cells see two faces: piers stand there, not quoins
  return e.length > 1 || u % 3 === 0 ? ["bricks"] : ["light_blue_stained_glass"];  // piers and glazed bays
};

// Pre-pass: the skin's materials, and the cells behind some windows that get a warm light
const mat = new Map();
const glow = new Set();
for (const [k, e] of skin) {
  const [x, y, z] = k.split(",").map(Number);
  const c = cellAt(x, z);
  mat.set(k, skinMat(c, x, y, z, e));
  const m = mat.get(k)[0];
  if (m === "light_blue_stained_glass" && e.length === 1) {
    const [dx, dz] = e[0];
    const xi = x - dx, zi = z - dz;
    if (!skin.has(v3(xi, y, zi)) && (xi * 7 + y * 5 + zi * 3) % 9 === 0) glow.add(v3(xi, y, zi));
  }
}

const ringTwo = (x, y, z) => DIRS4.some(([dx, dz]) => skin.has(v3(x + dx, y, z + dz)));

const g = new Voxels([W, H, D]);
const put = (x, y, z, [block, state]) => (state ? g.set(x, y, z, block, state) : g.set(x, y, z, block));

for (const c of cells.values()) {
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone_bricks");   // foundation to the cell's ground
  if (!c.built) continue;

  for (let y = c.g; y < c.T; y++) {
    const k = v3(c.x, y, c.z);
    if (mat.has(k)) { put(c.x, y, c.z, mat.get(k)); continue; }
    if (y === c.T - 1) { g.set(c.x, y, c.z, "stone"); continue; }                // roof deck
    if (y === c.T - 2) { g.set(c.x, y, c.z, "smooth_stone"); continue; }         // ceiling under the roof
    if (y > c.g && (y - DATUM) % 3 === 0) { g.set(c.x, y, c.z, "smooth_stone"); continue; }  // storey floor slab
    if (glow.has(k)) { g.set(c.x, y, c.z, "glowstone"); continue; }
    if (ringTwo(c.x, y, c.z)) continue;                                          // air gap behind the glass
    g.set(c.x, y, c.z, "stone");                                                 // solid core
  }
}

// Roof equipment: HVAC boxes on the podium roof, set in from the parapet; a stair and lift bulkhead on the penthouse
for (const c of cells.values()) {
  if (!c.built || exposure(c.x, c.T - 1, c.z).length) continue;
  if (c.T === 12 && c.x % 5 === 2 && c.z % 4 === 1) {
    for (let y = c.T; y < c.T + 2; y++) g.set(c.x, y, c.z, "light_gray_concrete");
  }
  if (c.T === 15 && (c.x === 8 || c.x === 9) && (c.z === 10 || c.z === 11)) {
    for (let y = c.T; y < c.T + 2; y++) g.set(c.x, y, c.z, "stone_bricks");
  }
}

const tally = {};
g.forEachCell((i, p) => { const b = g.palette[p].block; tally[b] = (tally[b] ?? 0) + 1; });
console.log(ID, tally, g.save(`${DIR}/${ID}.nbt`));
