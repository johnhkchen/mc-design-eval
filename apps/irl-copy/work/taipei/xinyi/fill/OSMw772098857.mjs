import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1980s-90s low-rise commercial block: two storeys over a shopfront ground floor,
// white tiled wall, smooth quartz bands, a parapet cornice and rooftop plant.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw772098857";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 25, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Door: on the lowest-z street face, nearest to x = 12.
let doorKey = null;
{
  const faceCells = cells.filter(([x, z]) => !has(x, z - 1));
  if (faceCells.length) {
    const minZ = Math.min(...faceCells.map(([, z]) => z));
    const cand = faceCells.filter(([, z]) => z === minZ)
      .sort((a, b) => Math.abs(a[0] - 12) - Math.abs(b[0] - 12));
    doorKey = `${cand[0][0]},${cand[0][1]}`;
  }
}

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const TRIM = "smooth_quartz";

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation and base course.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");

  const faceZ = !has(x, z - 1) || !has(x, z + 1);
  const faceX = !has(x - 1, z) || !has(x + 1, z);
  const exterior = faceX || faceZ;

  if (!exterior) {
    // Interior: floor slab per storey, roof deck, and rooftop plant.
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "smooth_stone");
    if (x >= 6 && x <= 8 && z >= 4 && z <= 5) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    if (x === 18 && z === 7) {
      for (let y = gr + 11; y <= gr + 14; y++) put(x, y, z, "iron_bars");
    }
    continue;
  }

  const corner = faceX && faceZ;
  const idx = faceZ ? x : z;
  const pilaster = corner || idx % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;

  // Ground floor: shopfront.
  if (isDoor) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, GLASS);
    put(x, gr + 4, z, TRIM);
  } else if (pilaster) {
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, WALL);
  } else {
    const lit = idx % 5 === 2;
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, lit ? "glowstone" : GLASS);
    put(x, gr + 4, z, TRIM);
  }

  // Storey line.
  put(x, gr + 5, z, TRIM);

  // Upper floor: window bays between quartz piers.
  if (pilaster) {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, TRIM);
  } else {
    put(x, gr + 6, z, TRIM);
    const lit = idx % 7 === 3;
    put(x, gr + 7, z, lit ? "glowstone" : GLASS);
    put(x, gr + 8, z, lit ? "glowstone" : GLASS);
    put(x, gr + 9, z, TRIM);
  }

  // Cornice and parapet.
  put(x, gr + 10, z, TRIM);
  put(x, gr + 11, z, WALL);
}
g.save(`${dir}/${id}.nbt`);
