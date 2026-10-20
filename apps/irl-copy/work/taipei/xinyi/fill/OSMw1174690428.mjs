import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for OSMw1174690428. Read as a low-rise 1980s Taipei commercial block:
// a two-storey concrete frame with a white tiled facade, a shopfront ground floor,
// a glazed upper floor on a 3-block bay rhythm, a quartz cornice and parapet, and a
// flat roof with plant boxes. Roof top sits at y=11 (about 11 blocks above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw1174690428.cells.json`, "utf8"));

const W = 23, H = 23, D = 29;
const g = new Voxels([W, H, D]);

const ROOF = 11;   // parapet top
const DECK = 10;   // roof slab / cornice level
const FLOOR = 5;   // storey line between the two floors

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// [face name, dx, dz] for the outward direction of each exposed side
const FACES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposedOf = (x, z) => FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => exposedOf(x, z).length > 0;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const lights = [];

for (const [x0, z0] of cells) {
  const x = x0, z = z0;
  const gr = ground.get(`${x},${z}`);
  const exposed = exposedOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Cells whose ground already reaches the roof level carry nothing above
  if (gr > DECK) continue;

  if (exposed.length === 0) {
    // Interior: floor slab at storey line, roof deck, and plant boxes on the roof
    if (gr <= FLOOR) put(x, FLOOR, z, "smooth_quartz");
    put(x, DECK, z, "light_gray_concrete");
    if (x % 7 === 3 && z % 7 === 3) {
      put(x, DECK + 1, z, "stone_bricks");
      put(x, DECK + 2, z, "stone_bricks");
    }
    continue;
  }

  // Perimeter: pattern follows the single exposed face, corners are solid piers
  const corner = exposed.length > 1;
  const [, dx, dz] = exposed[0];
  const idx = dx !== 0 ? z : x;

  for (let y = gr; y <= DECK; y++) {
    let id;
    if (y === gr) id = "stone_bricks";                     // base course
    else if (y === DECK) id = "quartz_block";              // cornice
    else if (y === FLOOR) id = "smooth_quartz";            // storey line
    else if (corner) id = "light_gray_concrete";           // corner piers
    else if (y < FLOOR) {                                  // shopfront storey
      if (y === 4) id = "white_concrete";                  // fascia band
      else id = idx % 3 === 0 ? "gray_concrete" : "glass";
    } else {                                               // upper storey
      id = idx % 3 === 0 ? "white_concrete" : "gray_stained_glass";
    }
    put(x, y, z, id);
  }

  // Parapet on the roof edge
  put(x, ROOF, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind some upper-floor windows
  if (!corner && idx % 6 === 1 && gr <= 7) lights.push([x, z, dx, dz]);
}

// Shroomlights on the inner side of selected upper-floor windows
for (const [x, z, dx, dz] of lights) {
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz)) continue;
  if (isPerim(ix, iz)) continue;
  if (ground.get(`${ix},${iz}`) > 7) continue;
  put(ix, 7, iz, "shroomlight");
}

// Entrance: two-high dark oak door in the middle of the north (street) frontage
const northCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (northCells.length) {
  const [dxx, dzz, dg0] = northCells[Math.floor(northCells.length / 2)];
  const dg = Math.round(dg0);
  if (dg + 2 <= FLOOR - 1) {
    const doorProps = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    put(dxx, dg + 1, dzz, "dark_oak_door", doorProps("lower"));
    put(dxx, dg + 2, dzz, "dark_oak_door", doorProps("upper"));
    // Small warm lantern over the door, sitting in the lintel line
    put(dxx, dg + 3, dzz, "glass");
  }
}

g.save(`${DIR}/OSMw1174690428.nbt`);
