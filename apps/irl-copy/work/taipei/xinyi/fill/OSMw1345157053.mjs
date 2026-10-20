import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-style commercial block: stone plinth, cream tiled walls,
// tinted glass bays, a stone cornice and parapet, a dark-oak entrance on the
// z=0 (street) face, and a rooftop plant unit.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1345157053";
const W = 4, H = 19, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane: connects in the plane of the wall it sits in.
const pane = (x, y, z, plane) => {
  const conn = plane === "z"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  put(x, y, z, "gray_stained_glass_pane", { ...conn, waterlogged: "false" });
};

for (const [x, z, gr] of cells) {
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Foundation under the cell, then the ground-floor slab at its ground level.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "smooth_stone");

  if (perim) {
    // Plinth course, cream tiled walls, cornice band, parapet.
    put(x, gr + 1, z, "stone_bricks");
    for (let y = gr + 2; y <= gr + 4; y++) put(x, y, z, "smooth_quartz");
    put(x, gr + 5, z, "stone_bricks");
    put(x, gr + 7, z, "stone_bricks");

    const zFace = z === 0 || z === D - 1;
    const xFace = x === 0 || x === W - 1;

    if (z === 0 && x === 1) {
      // Entrance: dark oak door, stone lintel, hanging lantern under the cornice.
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "stone_bricks");
      put(x, gr + 4, z, "stone_bricks");
      put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (zFace && (x === 1 || x === 2)) {
      for (let y = gr + 2; y <= gr + 4; y++) pane(x, y, z, "z");
    } else if (xFace && z % 2 === 1 && z < D - 1) {
      for (let y = gr + 2; y <= gr + 4; y++) pane(x, y, z, "x");
    }
  }

  // Roof deck over every cell, interior air storey below it.
  put(x, gr + 6, z, "smooth_stone");

  // Rooftop plant: two concrete units on the roof at the z=5 row.
  if (z === 5 && (x === 1 || x === 2)) {
    put(x, gr + 7, z, "light_gray_concrete");
  }
}

// Warm lights just inside some windows (interior air gap behind the glass).
const glow = (x, z) => {
  if (!has(x, z)) return;
  put(x, gAt(x, z) + 3, z, "glowstone");
};
if (has(2, 0)) glow(2, 1);
if (has(0, 3)) glow(1, 3);
if (has(3, 3)) glow(2, 3);

g.save(`${DIR}/${ID}.nbt`);
