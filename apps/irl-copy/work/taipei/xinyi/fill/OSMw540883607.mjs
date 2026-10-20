import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883607";
const W = 8, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: ground level per cell, clamped so the shell stays below the roof line.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.floor(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// Street frontage faces south (+z): cells with no footprint neighbour at z+1.
const isFront = (x, z) => has(x, z) && !has(x, z + 1);
const isCorner = (x, z) => edge(x, z) && (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Inward neighbour (an interior footprint cell) used to place light behind a window.
const inward = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !edge(nx, nz)) return [nx, nz];
  }
  return null;
};

// Door on the street face: middle front cell.
const frontCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => isFront(x, z) && !isCorner(x, z))
  .sort((a, b) => a[0] - b[0]);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

// Interior cell to carry a small rooftop planter near the centre.
let planter = null;
for (const [x, z] of [[3, 5], [4, 5], [3, 6], [4, 6], [3, 4], [4, 4]]) {
  if (has(x, z) && !edge(x, z)) { planter = [x, z]; break; }
}

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gnd(x, z);
  const exterior = edge(x, z);
  const front = isFront(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground slab (floor of storey 1) on every cell.
  put(x, gr, z, "smooth_stone");

  // Storey line between floors.
  if (gr < 5) put(x, 5, z, "light_gray_concrete");

  // Roof deck (ceiling of storey 2 and roof surface) on every cell.
  if (gr < 10) put(x, 10, z, "stone_bricks");

  // Parapet coping on the perimeter.
  if (exterior) put(x, 11, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  if (!exterior) continue;

  // Storey 1 walls (gr+1 .. 4).
  for (let y = gr + 1; y <= 4; y++) {
    if (front) {
      if (y <= gr + 2) {
        // Shopfront glazing with dark frames.
        const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;
        if (isDoor && y === gr + 1) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (isDoor && y === gr + 2) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if ((x + z) % 3 === 0) {
          put(x, y, z, "dark_oak_planks");
        } else {
          put(x, y, z, "glass_pane");
        }
      } else if (y === gr + 3) {
        put(x, y, z, "red_terracotta");
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if (!isCorner(x, z) && y <= gr + 3 && (x + z) % 3 !== 0) {
      put(x, y, z, "glass_pane");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Storey 2 walls (6 .. 9).
  for (let y = 6; y <= 9; y++) {
    if (y === 6 || y === 9 || isCorner(x, z) || (x + z) % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Warm light behind some upper-storey windows.
  if (!isCorner(x, z) && (x + z) % 3 === 1) {
    const inn = inward(x, z);
    if (inn) put(inn[0], 7, inn[1], "glowstone");
  }
}

// Shopfront light behind a few street-face glass panes.
for (const [x, z] of frontCells) {
  if ((x + z) % 3 === 2 && doorCell && Math.abs(x - doorCell[0]) >= 2) {
    const gr = gnd(x, z);
    const inn = inward(x, z);
    if (inn && gr + 1 <= 4) put(inn[0], gr + 1, inn[1], "glowstone");
  }
}

// Canopy/awning cap over the shopfront at the street edge, carried on the frontage.
for (const [x, z] of frontCells) {
  const gr = gnd(x, z);
  if (gr + 4 <= 4) put(x, gr + 4, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Small rooftop planter on the roof deck.
if (planter) {
  const [px, pz] = planter;
  put(px, 11, pz, "azalea_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
