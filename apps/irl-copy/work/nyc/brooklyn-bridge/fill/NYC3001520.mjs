import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 11 Willow Street, Brooklyn Heights: 1854 Italianate-era brick walk-up.
// Brick front/back with stone string courses and a corbelled cornice, stone-block
// foundation, regular 3-block storeys with paired window bays, a dark-oak entrance door.
const W = 14, H = 25, D = 5;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001520.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, ground, roof] of cells) map.set(`${x},${z}`, { g: ground, r: roof });

const B = Math.min(...cells.map(c => c[2]));        // lowest ground: base of the storey grid
const Rtop = Math.max(...cells.map(c => c[3]));     // highest roof
const nS = Math.max(1, Math.floor((Rtop - 2 - B) / 3)); // storeys on a 3-block module

const isWindowX = x => x > 0 && x < W - 1 && x % 3 !== 1; // bays between piers at x=1,4,7,10,13
const DOOR_X = 7;

for (const [key, { g: gr, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  const perimeter = z === 0 || z === D - 1 || x === 0 || x === W - 1;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor interior floor.
  if (!perimeter) g.set(x, gr, z, "smooth_stone");

  // Walls: solid brick on the perimeter, air inside (air gap behind glass).
  if (perimeter) {
    for (let y = gr; y < r - 1; y++) g.set(x, y, z, "bricks");
  }

  // Storey floor slabs across the interior, and string courses on the facades.
  for (let k = 0; k < nS; k++) {
    const yb = B + 3 * k;
    if (yb < gr || yb >= r - 2) continue;
    if (!perimeter) g.set(x, yb, z, "smooth_stone");
    else if (z === 0 || z === D - 1) g.set(x, yb, z, "stone_bricks");
  }

  // Facade articulation: windows, door, lights.
  if (perimeter && (z === 0 || z === D - 1)) {
    for (let k = 0; k < nS; k++) {
      const yb = B + 3 * k;
      if (yb + 2 >= r - 2) continue;
      const isFront = z === 0;

      if (isFront && k === 0 && x === DOOR_X) {
        // Entrance door on the pier, under a stone lintel course.
        if (gr <= yb + 1) {
          g.set(x, yb + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          g.set(x, yb + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        continue;
      }

      if (isWindowX(x) && yb + 1 >= gr) {
        g.set(x, yb + 1, z, "glass");
        g.set(x, yb + 2, z, "glass");
        // Warm light behind some panes, placed in the air gap at z=1.
        if (isFront && map.has(`${x},1`) && ((k === 0 && (x === 5 || x === 11)) || (k === 1 && x === 8) || (k === 2 && x === 2))) {
          g.set(x, yb + 1, 1, "glowstone");
        } else if (isFront && map.has(`${x},1`) && k === 1 && x === 3) {
          g.set(x, yb + 1, 1, "shroomlight");
        }
      }
    }
  }

  // Cornice: corbel course below a capping slab on the perimeter, smooth roof deck inside.
  if (perimeter) {
    if (r - 2 >= gr) g.set(x, r - 2, z, "stone_bricks");
    g.set(x, r - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, r - 1, z, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001520.nbt");
