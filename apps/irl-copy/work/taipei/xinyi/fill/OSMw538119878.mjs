import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119878";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const at = new Map();
for (const [x, z, gr] of cells) at.set(`${x},${z}`, gr);
const has = (x, z) => at.has(`${x},${z}`);

// is this footprint cell on the outside of the footprint?
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// street-facing side: the northernmost (smallest z) row; entrance at its middle
let zMin = Infinity;
for (const [, z] of cells) zMin = Math.min(zMin, z);
const frontXs = cells.filter(([, z]) => z === zMin).map(([x]) => x).sort((a, b) => a - b);
const entranceX = frontXs[Math.floor(frontXs.length / 2)];

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";

for (const [x, z, b] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // interior: floor slabs per storey, air between, roof deck on top
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "light_gray_concrete");
    // a few rooftop plant boxes
    if (x % 8 === 4 && z % 6 === 3) {
      put(x, b + 11, z, "iron_block");
      put(x, b + 12, z, "iron_block");
    }
    continue;
  }

  // exterior shell
  const pillar = (x + z) % 3 === 0;
  const isEntrance = x === entranceX && z === zMin;

  // base course / plinth
  put(x, b, z, "polished_granite");

  // ground storey (shopfront)
  if (isEntrance) {
    put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, GLASS); // transom
  } else {
    for (let y = b + 1; y <= b + 3; y++) put(x, y, z, pillar ? FRAME : GLASS);
  }
  // ground-floor lintel and storey line
  put(x, b + 4, z, FRAME);
  put(x, b + 5, z, FRAME);

  // upper storey windows, a few lit warmly from behind the glass
  for (let y = b + 6; y <= b + 8; y++) {
    if (pillar) put(x, y, z, FRAME);
    else if (y === b + 7 && (x * 5 + z * 3) % 11 === 0) put(x, y, z, "glowstone");
    else put(x, y, z, GLASS);
  }

  // upper band, cornice and parapet
  put(x, b + 9, z, FRAME);
  put(x, b + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  put(x, b + 11, z, FRAME);
}
g.save(`${DIR}/${ID}.nbt`);
