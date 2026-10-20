import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw449681999";
const W = 18, H = 23, D = 20;

// Record: no building name. Footprint 18 x 20, roof ~11 blocks above lowest ground.
// Read as a two-storey, mid-century commercial block: stone base course, white
// concrete frame with light-blue glass bays, quartz storey lines and cornice,
// shopfront ground floor, flat roof with parapet and a water tank.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());
const ROOF = minG + 11;          // roof deck top, 11 above lowest ground

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dirName = (dx, dz) => (dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north");
const exteriorDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerimeter = (x, z) => exteriorDirs(x, z).length > 0;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// tangential position along a wall, and whether its neighbours are also footprint
const tangent = (x, z, dz) => (dz !== 0 ? x : z);
const tanInside = (x, z, dz) => (dz !== 0 ? has(x - 1, z) && has(x + 1, z) : has(x, z - 1) && has(x, z + 1));

// Build each footprint cell
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation under the ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone");

  const ext = exteriorDirs(x, z);

  // interior cells: floor slabs only, air between
  if (ext.length === 0) {
    put(x, G, z, "smooth_stone");
    if (G + 5 < ROOF) put(x, G + 5, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
    continue;
  }

  const corner = ext.length >= 2;
  const [dx, dz] = ext[0];
  const t = tangent(x, z, dz);
  const pillar = ((t % 3) + 3) % 3 === 0;
  const winCol = !corner && !pillar && tanInside(x, z, dz) && ((t % 3) + 3) % 3 === 1;

  const wallBlock = (y) => {
    if (y === G) return "stone_bricks";                  // base course
    if (y === ROOF) return "white_concrete";             // parapet base
    if (y === ROOF - 1) return "quartz_block";           // cornice
    if (corner) return "light_gray_concrete";            // corner piers
    if (y === G + 5) return "smooth_quartz";             // storey line
    if (y < G + 5) {                                     // ground storey shopfront
      if (y === G + 4) return "smooth_stone";            // fascia
      if (pillar || !tanInside(x, z, dz)) return "light_gray_concrete";
      return "glass";
    }
    // upper storey
    if (y === ROOF - 2) return "smooth_quartz";          // lintel course
    if (winCol && y >= G + 6 && y <= ROOF - 3) return "light_blue_stained_glass";
    return pillar ? "light_gray_concrete" : "white_concrete";
  };

  for (let y = G; y <= ROOF; y++) put(x, y, z, wallBlock(y));

  // parapet and cap
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: south-facing plain wall cell nearest the footprint's centre line
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const cx = cellList.reduce((s, [x]) => s + x, 0) / cellList.length;
let door = null;
for (const [x, z] of cellList) {
  const ext = exteriorDirs(x, z);
  if (ext.length !== 1 || ext[0][1] !== 1) continue;
  if (!tanInside(x, z, 1)) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door.x - cx)) door = { x, z };
}
if (door) {
  const G = ground.get(`${door.x},${door.z}`);
  const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(door.x, G + 1, door.z, "dark_oak_door", { ...props, half: "lower" });
  put(door.x, G + 2, door.z, "dark_oak_door", { ...props, half: "upper" });
  put(door.x, G + 3, door.z, "glass");
  put(door.x, G + 4, door.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm lights behind some windows (placed on the interior floor slab)
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ext = exteriorDirs(x, z);
  if (ext.length !== 1) continue;
  const [dx, dz] = ext[0];
  const t = tangent(x, z, dz);
  const m = ((t % 3) + 3) % 3;
  if (m !== 1 || !tanInside(x, z, dz)) continue;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  const bay = Math.floor(t / 3);
  if (bay % 2 === 0) put(ix, G + 6, iz, "shroomlight");
  else put(ix, G + 1, iz, "glowstone");
}

// Roof plant: water tank (2x2 steel body with stone cap) and two AC units
const interiorRoof = (x, z) => has(x, z) && !isPerimeter(x, z);
const roofCells = cellList.filter(([x, z]) => interiorRoof(x, z));
const rc = { x: cx, z: cellList.reduce((s, [, z]) => s + z, 0) / cellList.length };
roofCells.sort((a, b) =>
  Math.hypot(a[0] - rc.x, a[1] - rc.z) - Math.hypot(b[0] - rc.x, b[1] - rc.z));

let tank = null;
for (const [x, z] of roofCells) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([qx, qz]) => interiorRoof(qx, qz))) { tank = quad; break; }
}
const used = new Set();
if (tank) {
  for (const [qx, qz] of tank) {
    used.add(`${qx},${qz}`);
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(qx, y, qz, "iron_block");
    put(qx, ROOF + 4, qz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
let acCount = 0;
for (const [x, z] of roofCells) {
  if (acCount >= 2) break;
  if (used.has(`${x},${z}`)) continue;
  if (tank && tank.some(([qx, qz]) => Math.abs(qx - x) <= 1 && Math.abs(qz - z) <= 1)) continue;
  put(x, ROOF + 1, z, "iron_block");
  used.add(`${x},${z}`);
  acCount++;
}

g.save(`${DIR}/${ID}.nbt`);
