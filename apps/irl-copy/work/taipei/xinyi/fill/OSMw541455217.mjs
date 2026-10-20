import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, Xinyi district: cream quartz-clad
// walls, polished andesite spandrels, stone-brick plinth, light-blue glass
// bands, and a flat roof with parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455217";
const W = 16, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gy = (x, z) => G.get(`${x},${z}`);

// Which sides of a cell have no neighbouring footprint cell.
const missing = (x, z) => {
  const m = [];
  if (!has(x, z - 1)) m.push("n");
  if (!has(x, z + 1)) m.push("s");
  if (!has(x + 1, z)) m.push("e");
  if (!has(x - 1, z)) m.push("w");
  return m;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, b] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const m = missing(x, z);
  const per = m.length > 0;

  if (!per) {
    // Interior: floor slabs per storey, air in between, flat roof, plant.
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "gray_concrete");
    if ((x + z) % 5 === 0) put(x, b + 11, z, "iron_block");
    continue;
  }

  const face = m[0];
  const t = (face === "n" || face === "s") ? x : z;
  const onEntrance = face === "s" && (x === 7 || x === 8);
  const hinge = x === 7 ? "left" : "right";

  // Ground floor.
  put(x, b, z, "stone_bricks");
  if (onEntrance) {
    put(x, b + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    put(x, b + 3, z, "smooth_quartz");
    put(x, b + 4, z, "polished_andesite");
  } else {
    put(x, b + 1, z, "stone_bricks");
    const mullion = t % 3 === 0;
    put(x, b + 2, z, mullion ? "polished_andesite" : "glass");
    put(x, b + 3, z, mullion ? "polished_andesite" : "glass");
    put(x, b + 4, z, "smooth_quartz");
  }

  // Upper storey.
  put(x, b + 5, z, "polished_andesite");
  put(x, b + 6, z, "smooth_quartz");
  const mull2 = t % 3 === 0;
  put(x, b + 7, z, mull2 ? "smooth_quartz" : "light_blue_stained_glass");
  put(x, b + 8, z, mull2 ? "smooth_quartz" : "light_blue_stained_glass");
  put(x, b + 9, z, "smooth_quartz");

  // Cornice and parapet.
  put(x, b + 10, z, "polished_andesite");
  put(x, b + 11, z, "smooth_quartz");

  // Warm light behind some upper-floor glass, on the interior side.
  if (!onEntrance && !mull2 && (t + b) % 4 === 0) {
    let ix = x, iz = z;
    if (face === "n") iz = z + 1;
    else if (face === "s") iz = z - 1;
    else if (face === "e") ix = x - 1;
    else ix = x + 1;
    if (has(ix, iz) && missing(ix, iz).length === 0) {
      put(ix, gy(ix, iz) + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
