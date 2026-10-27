import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Queens Arcade, Queen Street, Auckland: a brick Edwardian podium (3-4 storeys) with a concrete-and-glass
// tower group rising from it, setbacks stepping down to the podium. Shell only: floor slabs per storey, a
// roof cap per tier, one-block walls with glazing and air behind; no rooms.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089919.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089919.nbt";

// footprint and lidar roof heights (blocks above y 0)
const R = new Map();
for (const [x, z, , roof] of cells) R.set(x + "," + z, roof);
const inF = (x, z) => R.has(x + "," + z);

// Lidar roof -> flat tiers: 3x3 median (noise out, towers kept), then 4 tier tops
// 14 = 3 storeys + cornice, 18 = 4 storeys, 24 = six-storey setback ring, 40 = the tower (39 lidar)
const MED = new Map();
for (const key of R.keys()) {
  const [x, z] = key.split(",").map(Number);
  const xs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) xs.push(R.get((x + dx) + "," + (z + dz)));
  xs.sort((a, b) => a - b);
  MED.set(key, xs[xs.length >> 1]);
}
// the lidar's tall cells are a few 1-2 cell fragments; grown by one cell they make two chunky towers, not needles
const TALL = new Set();
for (const [key, m] of MED) if (m >= 28) {
  const [x, z] = key.split(",").map(Number);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) TALL.add((x + dx) + "," + (z + dz));
}
// the setback ring (24) needs a mass behind it: a lone tall cell reads as a spike, so it steps down to 18
const massAt = (x, z) => { let n = 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (MED.get((x + dx) + "," + (z + dz)) >= 20) n++; return n; };
const TOP = new Map();
for (const key of R.keys()) {
  const m = MED.get(key);
  const [x, z] = key.split(",").map(Number);
  TOP.set(key, TALL.has(key) ? 40 : m < 16 ? 14 : m < 20 || massAt(x, z) < 5 ? 18 : 24);
}
const top = (x, z) => TOP.get(x + "," + z) ?? 0;   // 0 outside the footprint

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a side is a face when the neighbour is outside the footprint or its column is lower at this height
const faces = (x, y, z) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);
const outsideDirs = (x, z) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) === 0);
const isPerimeter = (x, z) => outsideDirs(x, z).length > 0;

const V = new Voxels([71, 52, 44]);
const kindOf = (t) => (t <= 18 ? "brick" : "concrete");
const MAT = {
  brick: { pier: "bricks", frame: "stone_bricks", glass: "glass_pane", cap: "stone_bricks", parapet: "stone_bricks", spandrel: "stone_bricks" },
  concrete: { pier: "white_concrete", frame: "white_concrete", glass: "light_blue_stained_glass_pane", cap: "smooth_stone", parapet: "white_concrete", spandrel: "light_gray_concrete" },
};

// the entrance: on the Queen Street face (the -z side), the podium cell nearest the middle of the frontage
let door = null;
for (const key of R.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (TOP.get(key) !== 14 || !outsideDirs(x, z).some(([dx, dz]) => dz === -1)) continue;
  if (x < 2 || x > 68 || !inF(x - 1, z) || !inF(x + 1, z)) continue;
  if (!door || Math.abs(x - 35) < Math.abs(door[0] - 35)) door = [x, z];
}
if (!door) throw new Error("no podium cell on the -z frontage for the entrance");
const [dX, dZ] = door;

// the tops and the storey levels: floor slabs at y = 1 + 4k, plinth at y 0
const FLOOR = (y) => y >= 1 && (y - 1) % 4 === 0;
const lights = [];
for (const key of R.keys()) {
  const [x, z] = key.split(",").map(Number);
  const t = TOP.get(key), kind = kindOf(t), M = MAT[kind];
  const perim = isPerimeter(x, z);

  for (let y = 0; y < t; y++) {
    if (y === 0) { V.set(x, y, z, "stone_bricks"); continue; }                   // plinth / foundation
    if (FLOOR(y)) { V.set(x, y, z, "smooth_stone"); continue; }                  // storey slab, and the string course on a face
    if (y === t - 1) { V.set(x, y, z, M.cap); continue; }                         // roof cap, the tier's top layer
    const fs = faces(x, y, z);
    if (fs.length === 0) continue;                                                // interior air behind the glass

    const k = Math.floor((y - 1) / 4), r = (y - 1) % 4;                           // storey k, row r (1..2 glass, 3 spandrel)
    const [dx, dz] = fs.find(([a, b]) => top(x + a, z + b) === 0) ?? fs[0];
    const i = dz !== 0 ? x : z;                                                   // position along the face
    const isDoor = x === dX && z === dZ && dz === -1 && k === 0;

    if (isDoor) {
      if (r === 1) V.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      else if (r === 2) V.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      else V.set(x, y, z, M.frame);
      continue;
    }
    if (r === 3) { V.set(x, y, z, k === 0 ? "stone_bricks" : M.spandrel); continue; }   // lintel / spandrel
    const nearDoor = k === 0 && Math.abs(x - dX) + Math.abs(z - dZ) <= 2 && dz === -1 && z === dZ;
    const pier = k === 0 ? (i % 4 === 0 || nearDoor) : (i % 3 === 0);
    if (pier) { V.set(x, y, z, k === 0 ? "stone_bricks" : M.pier); continue; }
    // glazing: connects along the face to its neighbours
    const along = dz !== 0 ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
    V.set(x, y, z, M.glass, { ...along, waterlogged: "false" });
    // warm light behind some windows: a lantern on the floor slab inside, where the room is air
    const lit = k === 0 ? (i % 4 === 2 && r === 1) : (i % 6 === 1 && r === 1);
    if (lit && inF(x - dx, z - dz) && top(x - dx, z - dz) > y) lights.push([x - dx, y, z - dz]);
  }

  // the parapet / coping on the outside edge of the roof, and a little roof plant on the flat roofs
  if (perim && outsideDirs(x, z).length) V.set(x, t, z, M.parapet);
  else if (!perim && (t === 14 || t === 18 || t === 40) && x % 10 >= 4 && x % 10 <= 5 && z % 10 >= 4 && z % 10 <= 5 &&
           DIRS.every(([a, b]) => top(x + a, z + b) === t)) V.set(x, t, z, "iron_block");
}
for (const [x, y, z] of lights) V.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// the tower crown: a lightning rod on the highest roof, over the middle of the tower group
const crown = [...TOP.entries()].filter(([, t]) => t === 40).map(([k]) => k.split(",").map(Number));
if (crown.length) {
  const cx = Math.round(crown.reduce((s, [x]) => s + x, 0) / crown.length), cz = Math.round(crown.reduce((s, [, z]) => s + z, 0) / crown.length);
  let best = crown[0];
  for (const c of crown) if (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz)) best = c;
  V.set(best[0], 40, best[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

console.log(V.save(OUT));
