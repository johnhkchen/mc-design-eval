import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 22 x 10 footprint, roof ~11 blocks above lowest ground.
// Read as a 2-storey Xinyi-era commercial block: stone plinth, white-concrete
// piers, glazed bays, shopfront on the ground floor, flat roof with a parapet
// and one small plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343646";
const W = 22, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// place a block only on footprint cells and inside the grid
function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// along-facade coordinate: x on the long faces, z on the short ends
const facadeS = (x, z) => (z === 0 || z === D - 1 ? x : z);
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (const [x, z, g0] of cells) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  // ground-floor slab / plinth course
  put(x, g0, z, edge ? "stone_bricks" : "light_gray_concrete");

  if (edge) {
    const s = facadeS(x, z);
    const pier = isCorner(x, z) || s % 3 === 0;

    // storey 1: shopfront (glass bays, polished andesite piers, fascia head)
    const b1 = g0 + 1;
    for (let y = b1; y <= b1 + 2; y++) {
      put(x, y, z, pier ? "polished_andesite" : "glass_pane");
    }
    put(x, b1 + 3, z, "light_gray_concrete");

    // entrance: single door at x=10 on the street face, glass beside it
    if (z === 0 && x === 10) {
      put(x, b1, z, "oak_door", { ...DOOR, half: "lower" });
      put(x, b1 + 1, z, "oak_door", { ...DOOR, half: "upper" });
    }

    // storey 2: glazed bays between white-concrete piers
    const b2 = g0 + 6;
    put(x, b2, z, "smooth_stone");
    for (let y = b2 + 1; y <= b2 + 2; y++) {
      put(x, y, z, pier ? "white_concrete" : "glass_pane");
    }
    put(x, b2 + 3, z, "white_concrete");

    // storey line between floors, cornice and parapet
    put(x, g0 + 5, z, "light_gray_concrete");
    put(x, g0 + 10, z, "quartz_block");
    put(x, g0 + 11, z, "white_concrete");
  }

  // floor slab between storeys and roof slab (full footprint)
  if (!edge) {
    put(x, g0 + 5, z, "light_gray_concrete");
    put(x, g0 + 10, z, "smooth_stone");
  }
}

// warm light in some windows, standing on the floor slabs behind the glass
for (let x = 1; x <= W - 2; x++) {
  if (!has(x, 2)) continue;
  const g0 = gAt(x, 2);
  if (x % 6 === 1) put(x, g0 + 1, 2, "glowstone");
  if (x % 6 === 4) put(x, g0 + 6, 2, "glowstone");
}

// roof plant box on the interior of the roof
for (let x = 4; x <= 7; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!has(x, z)) continue;
    const g0 = gAt(x, z);
    put(x, g0 + 11, z, "stone_bricks");
    put(x, g0 + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
