import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1980s-90s Xinyi-style mid-rise: two storeys of concrete frame, a tinted-glass
// shopfront at street level, a ribbed upper storey with window bands, a stone
// cornice and parapet, and rooftop plant. Roof sits 11 blocks above base ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461852";
const W = 10, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(key(x, z), gr);

const has = (x, z) => groundMap.has(key(x, z));
const ground = (x, z) => groundMap.get(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pane connection state: connect to any footprint neighbour on each side.
function paneProps(x, z) {
  return {
    east: has(x + 1, z) ? "true" : "false",
    west: has(x - 1, z) ? "true" : "false",
    north: has(x, z - 1) ? "true" : "false",
    south: has(x, z + 1) ? "true" : "false",
    waterlogged: "false",
  };
}

// Front entrance: middle perimeter cell on the lowest-z edge.
const zMin = Math.min(...cells.map(c => c[1]));
const frontCells = cells.filter(c => c[1] === zMin).map(c => c[0]).sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;

// Find an interior cell behind a perimeter cell for warm light placement.
function inwardCell(x, z) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dz] of dirs) {
    if (!has(x + dx, z + dz) && has(x - dx, z - dz)) {
      const ix = x - dx, iz = z - dz;
      if (!isPerim(ix, iz)) return [ix, iz];
    }
  }
  return null;
}

for (const [x, z, b] of cells) {
  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab and first-floor slab (storey line).
  put(x, b, z, "smooth_stone");
  put(x, b + 5, z, "smooth_stone");

  // Roof deck over interior, cornice ring on the perimeter.
  if (isPerim(x, z)) {
    put(x, b + 10, z, "stone_bricks");
    put(x, b + 11, z, "stone_brick_wall");
  } else {
    put(x, b + 10, z, "gray_concrete");
    // Rooftop plant: sparse AC units and warm lanterns.
    if ((x * 3 + z) % 11 === 0) put(x, b + 11, z, "iron_block");
    else if ((x + z) % 7 === 3) put(x, b + 11, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  if (!isPerim(x, z)) continue;

  const i = x + z; // position along the facade

  // Storey 1: shopfront (b+1 .. b+4).
  const isDoor = z === zMin && x === doorX;
  put(x, b + 1, z, "polished_andesite");
  put(x, b + 2, z, "light_blue_stained_glass_pane", paneProps(x, z));
  put(x, b + 3, z, "light_blue_stained_glass_pane", paneProps(x, z));
  put(x, b + 4, z, "white_concrete");

  if (i % 3 === 0) {
    // Shopfront pillars.
    put(x, b + 2, z, "white_concrete");
    put(x, b + 3, z, "white_concrete");
  }

  if (isDoor) {
    const doorProps = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    put(x, b + 1, z, "oak_door", doorProps("lower"));
    put(x, b + 2, z, "oak_door", doorProps("upper"));
    put(x, b + 3, z, "white_concrete");
  }

  // Storey 2: ribbed window bands (b+6 .. b+9).
  put(x, b + 6, z, "white_concrete");
  put(x, b + 9, z, "white_concrete");
  for (const y of [b + 7, b + 8]) {
    if (i % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
    }
  }

  // Warm light behind a few upper windows.
  if (i % 6 === 2) {
    const inner = inwardCell(x, z);
    if (inner) put(inner[0], b + 7, inner[1], "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
