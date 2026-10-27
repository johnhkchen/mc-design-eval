import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1990s-2000s glass office tower on a basalt plinth, the Auckland CBD look: blue-tinted curtain wall, white
// concrete spandrels and low wings, iron mullions on the tower, a plant room and mast on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1041821931.cells.json`, "utf8"));

const X = 12, Y = 247, Z = 20;
const FOUND = "stone", PLINTH = "polished_deepslate", SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", FRAME_TOWER = "iron_block", FRAME_LOW = "white_concrete";
const PLANT = "light_gray_concrete", LIGHT = "glowstone", DOOR = "dark_oak_door";
const TOWER = 200;                                   // lidar roofs at or above this are the tower's flat top
const STOREY = 4;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Roofs snap to the storey grid (4 blocks); the tower's 230..234 lidar noise becomes one flat top at 234
const snapTop = (r) => (r >= TOWER ? 234 : Math.max(STOREY, Math.round(r / STOREY) * STOREY));

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, top: snapTop(r) });
const xz = (k) => k.split(",").map(Number);
const inside = (x, z) => cell.has(`${x},${z}`);
// a side is open to air at height y when it is outside the footprint or above the neighbour's roof
const open = (x, y, z) => { const c = cell.get(`${x},${z}`); return !c || y >= c.top; };
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => open(x + dx, y, z + dz));

const v = new Voxels([X, Y, Z]);

// The facade: a plinth course, shopfront glass under a lintel, then storeys of spandrel + glass with mullions
const facade = (x, y, z, c, sides) => {
  if (y >= c.top - 2) return PLINTH;                                       // parapet
  if (y < STOREY && (y === c.g || y === STOREY - 1)) return PLINTH;       // base course and ground-floor lintel
  if (y % STOREY === 0) return SPANDREL;                                   // floor line
  if (sides.length > 1 || (x + z) % 3 === 0) return c.top >= TOWER ? FRAME_TOWER : FRAME_LOW;
  return GLASS;
};

// The interior is air behind the glass, with one floor slab per storey and a roof cap
const interiorFloor = (y, c) => (y === c.top - 1 ? PLINTH : y % STOREY === 0 ? SPANDREL : null);

// Entrance: a ground-floor cell on the north face near the middle of the frontage
let door = null;
for (const [k, c] of cell) {
  const [x, z] = xz(k);
  if (c.g !== 0 || !exposed(x, 0, z).some(([dx, dz]) => dx === 0 && dz === -1)) continue;
  if (!door || Math.abs(x - 5.5) < Math.abs(door.x - 5.5)) door = { x, z, facing: "north" };
}

for (const [k, c] of cell) {
  const [x, z] = xz(k);
  for (let y = 0; y < c.top; y++) {
    if (y < c.g) { v.set(x, y, z, FOUND); continue; }
    const sides = exposed(x, y, z);
    if (sides.length) { v.set(x, y, z, facade(x, y, z, c, sides)); continue; }
    const floor = interiorFloor(y, c);
    if (floor) v.set(x, y, z, floor);
    // a warm lamp on the slab, just inside a window
    if (y % STOREY === 1 && y < c.top - 4 && (x * 3 + z * 5 + (y >> 2) * 7) % 5 === 0) {
      const lit = SIDES.some(([dx, dz]) => inside(x + dx, z + dz) && exposed(x + dx, y, z + dz).length > 0);
      if (lit) v.set(x, y, z, LIGHT);
    }
  }
}

if (door) {
  v.set(door.x, 0, door.z, DOOR, { facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(door.x, 1, door.z, DOOR, { facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // a canopy band over the door, in the recess
  for (const [dx, dz] of [[0, 0], [-1, 0], [1, 0]]) {
    if (inside(door.x + dx, door.z + dz)) v.set(door.x + dx, 2, door.z + dz, "polished_deepslate_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Plant room on the tower's flat top: the cells whose 3x3 neighbourhood is all tower
const towerTop = (x, z) => inside(x, z) && cell.get(`${x},${z}`).top >= TOWER;
const plant = [];
for (const [k, c] of cell) {
  const [x, z] = xz(k);
  if (c.top < TOWER) continue;
  let all = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!towerTop(x + dx, z + dz)) all = false;
  if (all) plant.push([x, z]);
}
const inPlant = (x, z) => plant.some(([px, pz]) => px === x && pz === z);
for (const [x, z] of plant) {
  for (let y = 234; y < 238; y++) {
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inPlant(x + dx, z + dz));
    if (y === 237 || edge) v.set(x, y, z, PLANT);
  }
}
if (plant.length) {
  const [mx, mz] = plant.reduce((a, b) => (Math.abs(b[0] - 5.5) + Math.abs(b[1] - 9.5) < Math.abs(a[0] - 5.5) + Math.abs(a[1] - 9.5) ? b : a));
  for (let y = 238; y < 244; y++) v.set(mx, y, mz, "iron_bars");
}

const out = `${DIR}/way_1041821931.nbt`;
const { blocks, palette } = v.save(out);

// Nothing floats: every block has something under it or beside it at its height (floor slabs hang off the walls)
let floating = 0;
v.forEachCell((i) => {
  const x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  const solid = (a, b, c) => v.val(a, b, c) !== 0;
  if (!solid(x, y - 1, z) && !SIDES.some(([dx, dz]) => solid(x + dx, y, z + dz))) floating++;
});
console.log(JSON.stringify({ blocks, palette, floating, door, plantCells: plant.length, top: Math.max(...[...cell.values()].map((c) => c.top)) }));
