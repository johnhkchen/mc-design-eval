import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542602808";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 37, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DECK = 11;          // roof surface level (about 11 blocks above lowest ground)
const FLOOR2 = 5;         // storey line between ground and second floor
const FLOOR3 = 10;        // top of second storey / cornice line
const PARAPET = 12;       // parapet course above the deck

const FRONT_Z = D - 1;    // south face carries the entrance
const DOOR_X = Math.floor(W / 2);

// Pass 1: foundations, floor slabs, walls
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perimeter = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const u = x + z; // index running around the perimeter

  // floor slabs at every storey line and the deck (interior and exterior)
  const slabs = [gr, FLOOR2, FLOOR3, DECK];
  if (!perimeter) {
    for (const y of slabs) {
      if (y >= gr && y < H) g.set(x, y, z, y === gr ? "smooth_stone" : "smooth_stone");
    }
    continue;
  }

  // perimeter wall column from ground to the parapet
  for (let y = gr; y <= PARAPET; y++) {
    if (y >= H) break;
    let id = null;
    let props = undefined;

    if (y === gr) {
      id = "stone_bricks";                       // base course / plinth
    } else if (y === PARAPET) {
      id = "stone_brick_wall";                   // parapet
    } else if (y === DECK) {
      id = "stone_bricks";                       // roof edge
    } else if (y === FLOOR3) {
      id = "stone_bricks";                       // cornice
    } else if (y === FLOOR2) {
      id = "white_concrete";                     // storey band
    } else if (y < FLOOR2) {
      // ground floor: shopfront with concrete piers and a lintel
      const pier = u % 4 === 0 || y === 4;
      id = pier ? "white_concrete" : "glass";
    } else {
      // upper storey: window grid with mullions
      const mullion = u % 3 === 0;
      if (mullion) {
        id = "white_concrete";
      } else if (y === 7 && (u * 5 + x) % 4 === 0) {
        id = "glowstone";                        // warm lit window
      } else {
        id = "light_blue_stained_glass";
      }
    }

    if (id) g.set(x, y, z, id, props);
  }

  // roof slab stays solid across the footprint
  if (DECK >= gr) g.set(x, DECK, z, "stone_bricks");
}

// Pass 2: entrance on the south face (door and warm lobby light)
if (has(DOOR_X, FRONT_Z)) {
  const gr = ground.get(`${DOOR_X},${FRONT_Z}`);
  const doorProps = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false"
  });
  g.set(DOOR_X, gr + 1, FRONT_Z, "dark_oak_door", doorProps("lower"));
  g.set(DOOR_X, gr + 2, FRONT_Z, "dark_oak_door", doorProps("upper"));
  // lintel over the entrance and a warm light beside it
  g.set(DOOR_X, gr + 3, FRONT_Z, "white_concrete");
  if (has(DOOR_X - 2, FRONT_Z)) g.set(DOOR_X - 2, gr + 2, FRONT_Z, "shroomlight");
  if (has(DOOR_X + 2, FRONT_Z)) g.set(DOOR_X + 2, gr + 2, FRONT_Z, "shroomlight");
}

// Pass 3: roof equipment (air-conditioning plant) standing on the deck
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const perimeter = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  if (perimeter) continue;
  if (x % 6 === 0 && z % 5 === 0 && x > 2 && x < W - 3 && z > 2 && z < D - 3) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
