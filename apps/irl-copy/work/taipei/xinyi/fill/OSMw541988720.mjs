import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Reads as a 1990s-era two-storey commercial block with a
// stone base, pale concrete piers, tinted-glass window bands, shopfronts on
// the street floor, a stone-capped parapet and a rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988720";
const W = 24, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey rhythm (k is height above each cell's own ground):
// 0 base course, 1-4 storey one, 5 string course, 6-9 storey two,
// 10 roof deck, 11-12 parapet with stone cap.
const bodyBlock = (k, a, maxA, corner, floorOne) => {
  const pier = corner || a % 4 === 0 || a === maxA;
  if (k === 0) return "smooth_stone";
  if (k === 5) return "smooth_stone";
  if (k === 10) return "stone_bricks";
  if (k === 11) return "white_concrete";
  if (k === 12) return "smooth_stone_slab";
  if (pier) return "light_gray_concrete";
  const win = a % 4 === 1 || a % 4 === 2;
  if (floorOne) {
    if (k >= 1 && k <= 3 && win) return "glass";
    if (k === 4) return win ? "smooth_stone" : "white_concrete";
    return "white_concrete";
  }
  if (k >= 6 && k <= 8 && win) return "light_blue_stained_glass";
  if (k === 9) return win ? "smooth_stone" : "white_concrete";
  return "white_concrete";
};

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const edge = xEdge || zEdge;
  const corner = xEdge && zEdge;

  // Floors: base course, storey string course, roof deck (all cells).
  put(x, gr + 0, z, "smooth_stone");
  put(x, gr + 5, z, edge ? "smooth_stone" : "light_gray_concrete");
  put(x, gr + 10, z, "stone_bricks");

  if (!edge) {
    // Rooftop plant box in the middle of the roof.
    if (x >= 9 && x <= 14 && z >= 4 && z <= 9) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Facade face: outward normal, along-face coordinate, and its max.
  let face, a, maxA;
  if (!has(x, z + 1)) { face = "S"; a = x; maxA = W - 1; }
  else if (!has(x, z - 1)) { face = "N"; a = x; maxA = W - 1; }
  else if (!has(x + 1, z)) { face = "E"; a = z; maxA = D - 1; }
  else { face = "W"; a = z; maxA = D - 1; }

  // Inward neighbour for the glow behind glass.
  const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  const inwardOk = has(ix, iz) && !(
    !has(ix - 1, iz) || !has(ix + 1, iz) || !has(ix, iz - 1) || !has(ix, iz + 1)
  );

  for (let k = 1; k <= 12; k++) {
    if (k === 5 || k === 10) continue;
    const floorOne = k <= 4;
    const id = bodyBlock(k, a, maxA, corner, floorOne);
    put(x, gr + k, z, id);
  }

  // Street entrance on the south face, one door at x = 10.
  if (face === "S" && a === 10) {
    const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "spruce_door", { ...base, half: "lower" });
    put(x, gr + 2, z, "spruce_door", { ...base, half: "upper" });
    put(x, gr + 3, z, "glass");
  }

  // Warm light behind some upper-floor and shopfront windows.
  const winHere = !corner && !(a % 4 === 0 || a === maxA) && (a % 4 === 1 || a % 4 === 2);
  if (winHere && inwardOk && a % 8 === 1) {
    put(ix, gr + 2, iz, "glowstone");
    put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
