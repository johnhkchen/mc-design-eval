import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901772";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise 1990s Xinyi commercial block: two storeys, shopfront on the street
// (south, z = 5) face, white-tile walls, quartz storey lines, red fascia,
// parapet roof with plant. Roof sits about 11 blocks above the lowest ground.
const W = 14, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, h] of cells) ground.set(`${x},${z}`, h);
const has = (x, z) => ground.has(`${x},${z}`);
const B = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const WALL = "white_concrete";
const TRIM = "quartz_block";
const GLASS = "light_blue_stained_glass";

for (const [x, z, b] of cells) {
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const perim = west || east || north || south;
  const corner = (west || east) && (north || south);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey, roof slab, a little plant on the roof.
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 9, z, "stone_bricks");
    if (x >= 3 && x <= 4 && z >= 2 && z <= 3) put(x, b + 10, z, "iron_block");
    continue;
  }

  // Perimeter shell, storey by storey (o = offset above this cell's ground).
  const idx = (south || north) ? x : z;
  for (let o = 0; o <= 10; o++) {
    const y = b + o;
    if (o === 0) { put(x, y, z, "polished_granite"); continue; }
    if (o === 5 || o === 9) { put(x, y, z, TRIM); continue; }
    if (o === 10) { put(x, y, z, TRIM); continue; }

    if (corner) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

    if (south && o >= 1 && o <= 3) {
      // Shopfront on the street face, entrance door at x = 7.
      if (x === 7) {
        if (o === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (o === 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, GLASS);
      } else {
        put(x, y, z, GLASS);
      }
      continue;
    }
    if (south && o === 4) { put(x, y, z, "red_concrete"); continue; }

    const isWindowRow = (o >= 1 && o <= 4) || (o >= 6 && o <= 8);
    if (isWindowRow && idx % 3 !== 0) put(x, y, z, GLASS);
    else put(x, y, z, WALL);
  }
}

// Warm light: shroomlights behind some back-face windows, lanterns in the shop.
for (const x of [4, 8, 11]) {
  if (has(x, 1) && has(x, 0) && !(has(x - 1, 1) === false) && !(has(x + 1, 1) === false)) {
    const b = B(x, 1);
    put(x, b + 2, 1, "shroomlight");
  }
}
for (const x of [6, 8]) {
  if (has(x, 4)) {
    const b = B(x, 4);
    put(x, b + 4, 4, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
