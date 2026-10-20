import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459517.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459517.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 21, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

// Front = the row with the smallest z (street side).
const minZ = Math.min(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs[Math.floor(frontXs.length / 2)];

// Pass 1: structure, shopfront, windows, roof.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const pier = edge && (x % 5 === 0 || !has(x - 1, z) || !has(x + 1, z));

  // Ground floor level: granite base course on the perimeter, smooth stone floor inside.
  put(x, gr, z, edge ? "polished_granite" : "smooth_stone");

  if (edge) {
    // Shopfront storey (gr+1..gr+3): piers and glass panes with frames.
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
    }
    // Canopy/fascia band above shopfront.
    put(x, gr + 4, z, "light_gray_concrete");
    // Storey line at the second floor.
    put(x, gr + 5, z, "light_gray_concrete");
    // Upper storey windows (gr+6..gr+8) in a grid of piers and glass.
    for (let y = gr + 6; y <= gr + 8; y++) {
      put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
    }
    // Spandrel and parapet cornice.
    put(x, gr + 9, z, "light_gray_concrete");
    put(x, gr + 10, z, "smooth_stone");
  } else {
    // Interior: air gap with a floor slab at each storey and the roof slab.
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
  }

  // Rooftop plant on a few interior roof cells.
  if (!edge && x % 6 === 3 && z % 3 === 1) put(x, gr + 11, z, "iron_block");
}

// Pass 2: warm lights behind some upper front windows.
for (const [x, z, gr] of cells) {
  if (z !== minZ || isEdge(x, z) === false) continue;
  if (x % 5 === 0 || x % 4 !== 1) continue;
  if (has(x, z + 1) && !isEdge(x, z + 1)) put(x, gr + 7, z + 1, "glowstone");
}

// Entrance: door, lantern under the canopy, and a recessed bay.
const entGround = ground.get(key(entranceX, minZ));
if (entGround !== undefined) {
  put(entranceX, entGround + 1, minZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(entranceX, entGround + 2, minZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(entranceX, entGround + 3, minZ, "lantern", { hanging: "true" });
  // Canopy over the entrance bay.
  for (let dx = -2; dx <= 2; dx++) {
    const cx = entranceX + dx;
    if (has(cx, minZ)) put(cx, entGround + 4, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
