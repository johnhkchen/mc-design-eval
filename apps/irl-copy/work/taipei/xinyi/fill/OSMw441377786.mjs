import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377786";
const W = 78, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity;
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, g);
  if (g < minG) minG = g;
}
const has = (x, z) => ground.has(`${x},${z}`);
const isExt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street face is the z-minimum side ("n"); other exposed sides follow.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  return "e";
}
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const OUT = { n: "north", s: "south", w: "west", e: "east" };

// Entrance column: middle of the street (n) face.
const frontXs = cells
  .filter(([x, z]) => isExt(x, z) && faceOf(x, z) === "n")
  .map(([x]) => x);
const mid = frontXs.length
  ? Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2)
  : -1;

const g_ = new Voxels([W, H, D]);

for (const [x, z, gRaw] of cells) {
  const g = gRaw - minG;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) g_.set(x, y, z, "stone_bricks");

  if (!isExt(x, z)) {
    // Interior: floor slabs per storey, roof deck, no interior fit-out.
    g_.set(x, g, z, "light_gray_concrete");
    if (g < 5) g_.set(x, 5, z, "smooth_stone");
    if (g < 9) g_.set(x, 9, z, "gray_concrete");
    // Roof plant: 2x2 units on the deck.
    if ((x % 12 === 6 || x % 12 === 7) && (z === 5 || z === 6) && g < 10) {
      g_.set(x, 10, z, "iron_block");
    }
    continue;
  }

  // Exterior shell.
  const face = faceOf(x, z);
  const [dx, dz] = DIRS[face];
  const t = face === "n" || face === "s" ? x : z;
  const pier = t % 4 === 0;
  const isEnt = face === "n" && x === mid;
  const band = face === "n" && Math.abs(x - mid) <= 2;

  for (let y = g; y <= 10; y++) {
    let b = "white_concrete";
    let props;
    const win = !pier && ((y > g && y <= 3) || y === 7 || y === 8);

    if (y === g) b = "polished_andesite";          // base course
    else if (y === 5 || y === 9) b = "polished_andesite"; // storey belt / cornice
    else if (y === 10) b = "white_concrete";        // parapet
    else if (y === 6 || y === 4) b = "white_concrete"; // sills and lintels
    else if (win) b = "glass";

    if (isEnt && (y === g + 1 || y === g + 2)) {
      b = "dark_oak_door";
      props = {
        facing: OUT[face],
        half: y === g + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (band && y === g + 3) {
      b = "dark_oak_slab";
      props = { type: "bottom", waterlogged: "false" };
    }

    if (props) g_.set(x, y, z, b, props);
    else g_.set(x, y, z, b);

    // Warm light behind some bays, on the inner side of the glass.
    if (win && t % 8 === 2) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isExt(ix, iz)) {
        const lp = { hanging: "false", waterlogged: "false" };
        if (y === g + 1 && g + 1 <= 3) g_.set(ix, g + 1, iz, "lantern", lp);
        if (y === 7 && g < 5) g_.set(ix, 6, iz, "lantern", lp);
      }
    }
  }

  // Interior floor under the exterior cell (for cells with no base yet).
  if (g > 10) g_.set(x, g, z, "white_concrete");
}

g_.save(`${DIR}/${ID}.nbt`);
