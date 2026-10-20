import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541374049";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 11 x 17, roof about 11 blocks above lowest ground.
// Read as a two-storey Xinyi-era low-rise commercial block (1980s-90s):
// warm quartz-tile walls, stone base course, glass window bands, quartz cornice and parapet.
const W = 11, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const S = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door goes on the south (max z) edge, nearest the middle of the facade.
let maxZ = -Infinity;
for (const [, z] of cells) if (z > maxZ) maxZ = z;
let doorX = null;
for (const [x, z] of cells) {
  if (z !== maxZ) continue;
  if (doorX === null || Math.abs(x - 5) < Math.abs(doorX - 5)) doorX = x;
}
const isDoor = (x, z) => z === maxZ && x === doorX;

for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to ground, then the ground-floor slab.
  for (let y = 0; y < gy; y++) S(x, y, z, "stone_bricks");
  S(x, gy, z, "smooth_stone");

  if (!isEdge(x, z)) {
    // Interior: floor slabs and roof only, air between (no interiors).
    S(x, gy + 5, z, "smooth_stone");
    S(x, gy + 10, z, "smooth_stone");
    // Rooftop plant on some interior cells.
    if ((x * 2 + z) % 5 === 0) {
      S(x, gy + 11, z, "iron_block");
    } else if ((x + 3 * z) % 7 === 0) {
      S(x, gy + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior wall ring.
  S(x, gy + 1, z, "stone_bricks"); // base course
  S(x, gy + 5, z, "polished_andesite"); // storey line
  S(x, gy + 6, z, "smooth_quartz");
  S(x, gy + 10, z, "smooth_quartz"); // cornice over roof slab
  S(x, gy + 11, z, "smooth_quartz"); // parapet

  if (isDoor(x, z)) {
    // Entrance: door at gy+2/gy+3 with transom glass above.
    S(x, gy + 2, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    S(x, gy + 3, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    S(x, gy + 4, z, "light_blue_stained_glass_pane");
    S(x, gy + 7, z, "light_blue_stained_glass_pane");
    S(x, gy + 8, z, "light_blue_stained_glass_pane");
    S(x, gy + 9, z, "light_blue_stained_glass_pane");
    continue;
  }

  // Piers every third cell along the facade; panes between them.
  const pier = (x + z) % 3 === 0;
  for (const [base, s] of [[gy + 2, 1], [gy + 7, 2]]) {
    for (let k = 0; k < 3; k++) {
      const y = base + k;
      if (pier) {
        S(x, y, z, "smooth_quartz");
      } else if (k === 1 && (x * 3 + z + s) % 5 === 0) {
        // Warm light behind the glass in some windows.
        S(x, y, z, "glowstone");
      } else {
        S(x, y, z, "light_blue_stained_glass_pane");
      }
    }
  }
  // Ground-floor lintel and transoms keep the storey lines readable.
  if (!pier) {
    S(x, gy + 5, z, "polished_andesite");
  } else {
    S(x, gy + 5, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
