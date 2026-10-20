import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, c. 1980s-90s Xinyi fabric:
// white-concrete frame with pale quartz cornice, light-blue glazing, stone-brick base,
// shopfront on the north (street) face, flat roof with plant units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888753";
const W = 30, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const FRAME = "white_concrete";
const BASE = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const CORNICE = "quartz_block";
const FLOOR = "smooth_stone";

// Entrance column on the north (street) face
const DOOR_X = 14;
const doorGround = gnd(DOOR_X, 0) ?? 0;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const ns = n || s, ew = w || e;
  const perim = n || s || w || e;
  const b = gr; // storey 1 floor level for this cell

  if (!perim) {
    // Interior: floor slabs only, air gap between
    put(x, b + 5, z, FLOOR);
    put(x, b + 10, z, FLOOR);
    continue;
  }

  // Perimeter pillars: corners plus every third column on the long faces
  const pillar =
    (ns && (x % 3 === 0 || x === 0 || x === W - 1)) ||
    (ew && (z % 3 === 0 || z === 0 || z === D - 1));

  const isNorth = n;
  const isDoorCol = isNorth && x === DOOR_X;

  // Base course
  put(x, b, z, BASE);

  // Storey 1 glazing band (shopfront on the street face)
  for (let y = b + 1; y <= b + 3; y++) {
    if (pillar) put(x, y, z, FRAME);
    else put(x, y, z, GLASS);
  }
  put(x, b + 4, z, FRAME); // lintel
  put(x, b + 5, z, CORNICE); // storey line
  // Storey 2 glazing band
  for (let y = b + 6; y <= b + 8; y++) {
    if (pillar) put(x, y, z, FRAME);
    else put(x, y, z, GLASS);
  }
  put(x, b + 9, z, FRAME); // sill / lintel
  put(x, b + 10, z, CORNICE); // cornice
  put(x, b + 11, z, FRAME); // parapet

  // Entrance door (double-leaf read: door at DOOR_X, glass at neighbour)
  if (isDoorCol && z === 0) {
    put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, GLASS);
  }
}

// Canopy over the entrance, carried on the lintel walls at x 12 and 17
for (let x = DOOR_X - 2; x <= DOOR_X + 3; x++) {
  for (let z = 0; z <= 1; z++) {
    if (!has(x, z)) continue;
    const b = gnd(x, z);
    put(x, b + 4, z, "dark_oak_planks");
  }
}

// Warm lights behind the glazing, standing on the floor inside the air gap
for (let x = 1; x < W - 1; x++) {
  if (!has(x, 1) || !has(x, 0) || !has(x, 2) || !has(x - 1, 1) || !has(x + 1, 1)) continue;
  const b = gnd(x, 1);
  if (x % 6 === 1) put(x, b, 1, "glowstone");          // storey 1, behind shopfront
  if (x % 6 === 4) put(x, b + 6, 1, "shroomlight");    // storey 2
}

// Roof plant units on the flat roof (stand on the roof slab at b+10)
const units = [
  [5, 7, 4, 5],
  [20, 23, 6, 7],
];
for (const [x0, x1, z0, z1] of units) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      const b = gnd(x, z);
      put(x, b + 11, z, "light_gray_concrete");
      put(x, b + 12, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
