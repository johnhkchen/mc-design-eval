import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643638447";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 19, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground levels, normalised so the lowest ground is y 0.
const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr] of cells) raw.set(key(x, z), Math.round(gr));
const minG = Math.min(...raw.values());
const ground = new Map();
for (const [k, v] of raw) ground.set(k, v - minG);

const has = (x, z) => ground.has(key(x, z));
const exterior = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Storey plan (relative to each cell's ground gr):
//   dy 0      stone base course (also the ground-floor slab)
//   dy 1..4   ground storey: shopfront at front, glazed bays, quartz piers
//   dy 5      cornice / roof deck
//   dy 6      parapet (top surface = gr + 7)
const FRONT = 0, BACK = D - 1;
const DOOR_X = 13;

for (const [k, gr] of ground) {
  const [xs, zs] = k.split(",").map(Number);
  const x = xs, z = zs;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ext = exterior(x, z);

  // Base course / ground-floor slab.
  g.set(x, gr, z, "stone_bricks");

  if (!ext) {
    // Interior: air behind the glass, floor slab above the ground storey.
    g.set(x, gr + 5, z, "smooth_stone");
    continue;
  }

  const front = z === FRONT;
  const back = z === BACK;
  const pier = x % 3 === 0;

  if (front || back) {
    for (let dy = 1; dy <= 4; dy++) {
      let b;
      if (pier) {
        b = "quartz_pillar";
      } else if (front && dy === 1) {
        b = "light_blue_stained_glass";           // shopfront glazing
      } else if (dy === 4) {
        b = "white_terracotta";                   // transom band
      } else if (dy === 1 && back) {
        b = "white_terracotta";
      } else {
        b = "light_blue_stained_glass";           // window
      }
      g.set(x, gr + dy, z, b, b === "quartz_pillar" ? { axis: "y" } : undefined);
    }
    // Entrance on the front face.
    if (front && x === DOOR_X) {
      g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 3, z, "stone_bricks");        // lintel
    }
  } else {
    // End walls (x = 0 or x = W-1).
    for (let dy = 1; dy <= 4; dy++) {
      const win = (dy === 2 || dy === 3) && z === 2;
      g.set(x, gr + dy, z, win ? "light_blue_stained_glass" : "white_terracotta");
    }
  }

  // Cornice and parapet.
  g.set(x, gr + 5, z, "smooth_stone");
  g.set(x, gr + 6, z, "quartz_block");
}

// Warm light behind some front and back windows (inside the air gap).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!(z === FRONT || z === BACK)) continue;
  if (x === 0 || x === W - 1 || x % 3 === 0) continue;
  if (x === DOOR_X) continue;
  if (x % 6 !== 1) continue;
  const innerZ = z === FRONT ? 1 : D - 2;
  if (has(x, innerZ) && !exterior(x, innerZ)) {
    g.set(x, gr + 2, innerZ, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
