import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey concrete shophouse/office block, c. 1980s-90s Xinyi.
// Light concrete walls, a polished-andesite base, storey bands, glass-pane
// bays with white pillars, a shopfront door on the north frontage, a parapet
// cap, and a plant box on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw539951304.cells.json`, "utf8"));

const W = 18, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const ROOF = 11;        // roof deck level (about 11 blocks above lowest ground)
const BAND = 5;         // storey line between floors
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Front (north, min-z) frontage cells that are plain edge cells, for the door.
const frontXs = [];
for (const [x, z] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1), W2 = !has(x - 1, z), E = !has(x + 1, z);
  const exp = [N, S, W2, E].filter(Boolean).length;
  if (N && exp === 1) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1), W2 = !has(x - 1, z), E = !has(x + 1, z);
  const exp = [N, S, W2, E].filter(Boolean).length;
  const perim = exp > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, no interior fit-out.
    put(x, gr, z, "smooth_stone");
    if (BAND >= gr) put(x, BAND, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    // Roof plant room on the central interior cells.
    if (x >= 5 && x <= 8 && z >= 8 && z <= 11) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter wall.
  put(x, gr, z, "polished_andesite");          // base course

  // Facade orientation and bay rhythm.
  let idx = 0, pane = null;
  if (exp > 1) {
    pane = null;                               // corner pillar
  } else if (N || S) {
    idx = x; pane = PANE_NS;
  } else {
    idx = z; pane = PANE_EW;
  }
  const isWindow = exp === 1 && idx % 2 === 1;
  const isDoorCell = N && exp === 1 && x === doorX;
  const isLit = isWindow && idx % 4 === 1;

  // Ground floor: shopfront glazing, door in the middle of the north frontage.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoorCell) {
      if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (isWindow) {
      put(x, y, z, "glass_pane", pane);
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Lintel above the ground-floor openings.
  put(x, gr + 4, z, "white_concrete");

  // Storey band between the floors.
  if (BAND > gr + 4) put(x, BAND, z, "light_gray_concrete");

  // Upper floor: spandrels, glazing, occasional warm glow behind the glass.
  put(x, 6, z, "white_concrete");
  for (let y = 7; y <= 9; y++) {
    if (isWindow) {
      if (isLit && y === 8) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane", pane);
    } else {
      put(x, y, z, "white_concrete");
    }
  }
  put(x, 10, z, "white_concrete");

  // Roof deck, parapet, and cap.
  put(x, ROOF, z, "gray_concrete");
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/OSMw539951304.nbt`);
