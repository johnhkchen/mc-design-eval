import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403766";
const W = 24, H = 23, D = 20;

// Footprint: [x, z, ground] per cell. Ground is relative to the lowest ground under the footprint.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const v = Math.round(gr);
  groundMap.set(key(x, z), v);
  minG = Math.min(minG, v);
}
const ground = (x, z) => groundMap.get(key(x, z)) - minG;
const has = (x, z) => groundMap.has(key(x, z));

const NB = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(NB).filter((d) => !has(x + NB[d][0], z + NB[d][1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Two storeys of 5 blocks, parapet to 11 blocks above the cell's ground.
const STOREY = 5;

// Entrance: a south-facing perimeter cell nearest the middle of the frontage.
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(([a, b]) => [a, b])) {
    if (!exposed(x, z).includes("S")) continue;
    const score = Math.abs(x - 11.5) * 10 - z;
    if (score < best) { best = score; entrance = [x, z]; }
  }
}

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const base = ground(x, z);
  const ex = exposed(x, z);
  const perimeter = ex.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor slabs per storey and roof slab, air between.
    put(x, base, z, "smooth_stone");
    put(x, base + STOREY, z, "smooth_stone");
    put(x, base + 2 * STOREY, z, "light_gray_concrete");

    // Warm lights standing on the floor slabs, seen through the glass.
    if ((2 * x + z) % 7 === 0) put(x, base + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    if ((x + 3 * z) % 9 === 4) put(x, base + STOREY + 1, z, "lantern", { hanging: "false", waterlogged: "false" });

    // Roof plant boxes on the roof slab.
    if ((5 * x + 3 * z) % 13 === 0) put(x, base + 2 * STOREY + 1, z, "iron_block");
    continue;
  }

  // Perimeter: solid facade, windows cut as glass panes with mullions.
  const onZFace = ex.includes("N") || ex.includes("S");
  const bay = onZFace ? x : z;
  const facadeFacing = onZFace ? "z" : "x";

  for (let s = 0; s < 2; s++) {
    const yb = base + s * STOREY;

    // Storey line / base course.
    put(x, yb, z, s === 0 ? "stone_bricks" : "polished_andesite");
    // Lintel band.
    put(x, yb + 4, z, "white_concrete");

    for (let dy = 1; dy <= 3; dy++) {
      const y = yb + dy;
      const isWindow = bay % 3 !== 0;
      if (!isWindow) {
        put(x, y, z, "white_concrete");
      } else {
        const connect = facadeFacing === "z"
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "glass_pane", connect);
      }
    }
  }

  // Ground-floor entrance on the south frontage.
  if (entrance && x === entrance[0] && z === entrance[1]) {
    const yb = base;
    put(x, yb + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, yb + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, yb + 3, z, "red_concrete");
  }

  // Cornice and parapet.
  put(x, base + 2 * STOREY, z, "smooth_stone");
  put(x, base + 2 * STOREY + 1, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
