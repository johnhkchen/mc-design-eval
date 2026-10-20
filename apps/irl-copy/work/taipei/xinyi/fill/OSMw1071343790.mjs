import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown-era mid-rise commercial block, two storeys of ~5 blocks over a stone plinth,
// pale quartz piers, blue-tinted glass bays, shopfront ground floor, flat parapet roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343790";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const BASE = "stone_bricks";
const WALL = "smooth_quartz";
const SLAB = "polished_andesite";
const GLASS = "light_blue_stained_glass";
const SHOP = "glass";
const BOX = "light_gray_concrete";

const map = new Map();
for (const [x, z, gr] of cells) {
  map.set(`${x},${z}`, Math.max(0, Math.min(12, Math.round(gr))));
}
const has = (x, z) => map.has(`${x},${z}`);
const groundOf = (x, z) => map.get(`${x},${z}`);
const isExterior = (x, z) =>
  has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const isInterior = (x, z) => has(x, z) && !isExterior(x, z);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = groundOf(x, z);
  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const exterior = exN || exS || exW || exE;
  const alongX = exN || exS;
  const corner = (exN || exS) && (exW || exE);
  const u = alongX ? x : z;
  const pier = corner || u % 3 === 0;

  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  if (!exterior) {
    // Interior: floor slabs only, air between them (no interiors modelled).
    put(x, gr, z, SLAB);
    if (gr < 5) put(x, 5, z, SLAB);
    put(x, 10, z, SLAB);
    // Roof plant boxes on the terrace of the flat roof.
    if (x % 7 === 3 && z % 4 === 1) {
      put(x, 11, z, BOX);
      put(x, 12, z, BOX);
    }
    // Lantern beside the entrance, on the ground floor.
    if (z === 13 - 1 && x === 15 && gr <= 1) {
      // handled by the entrance pass below (kept simple)
    }
    continue;
  }

  // Exterior shell: base course, storeys, cornice, parapet.
  put(x, gr, z, BASE);
  for (let y = gr + 1; y <= 10; y++) {
    let b;
    if (y === 4 || y === 5 || y === 6 || y === 9 || y === 10) b = WALL;
    else if (y <= 3) b = pier ? WALL : SHOP;
    else b = pier ? WALL : GLASS;
    put(x, y, z, b);

    // Warm light behind selected upper windows, in the interior cell just inside the glass.
    if (b === GLASS && y === 7 && u % 9 === 1) {
      let ix = x, iz = z;
      if (exN) iz = z + 1;
      else if (exS) iz = z - 1;
      else if (exW) ix = x + 1;
      else if (exE) ix = x - 1;
      if (isInterior(ix, iz)) put(ix, 7, iz, "glowstone");
    }
  }
  // Parapet.
  put(x, 11, z, WALL);
}

// Entrance on the south face: two-high dark oak door in the shopfront, with a lantern inside.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = groundOf(x, z);
  const exS = !has(x, z + 1);
  if (!exS) continue;
  if (x !== 16 || gr > 1) continue;
  const facing = "north";
  put(x, gr + 1, z, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(x, gr + 2, z, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  if (isInterior(x - 1, z - 1)) put(x - 1, gr + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
  if (isInterior(x + 1, z - 1)) put(x + 1, gr + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
