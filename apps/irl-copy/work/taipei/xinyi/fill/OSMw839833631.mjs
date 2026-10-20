import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw839833631: no record. Footprint 16 x 21, roof ~11 blocks above lowest ground.
// Read as a two-storey commercial block (about 5 blocks per storey) with a flat roof,
// a white-tiled concrete facade, stone plinth and storey bands, shopfront glazing on
// the ground floor, punched upper windows, a parapet cornice and roof plant.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833631.cells.json", "utf8"));

const W = 16, H = 23, D = 21;
const ROOF = 11;       // roof top, absolute from lowest ground
const BAND_1 = 5;      // second-floor slab line
const BAND_2 = 10;     // roof deck line

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const missingCount = (x, z) =>
  (has(x + 1, z) ? 0 : 1) + (has(x - 1, z) ? 0 : 1) +
  (has(x, z + 1) ? 0 : 1) + (has(x, z - 1) ? 0 : 1);
const isPerim = (x, z) => missingCount(x, z) > 0;
const isCorner = (x, z) => {
  const n = !has(x, z - 1), s = !has(x, z + 1), e = !has(x + 1, z), w = !has(x - 1, z);
  return (n || s) && (e || w);
};

// Street side: the lowest-z edge of the footprint.
let minZ = Infinity;
for (const [, z] of cells) if (z < minZ) minZ = z;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const columnCells = new Set();
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) && x % 4 === 0 && z % 4 === 0) columnCells.add(`${x},${z}`);
}

// Pass 1: foundations, plinths, floor and roof decks, interior columns.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr >= ROOF) continue;

  // Ground-floor slab (top of foundation).
  put(x, gr, z, isPerim(x, z) ? "stone_bricks" : "smooth_stone");

  // Second-floor slab and roof deck, every cell.
  if (BAND_1 > gr) put(x, BAND_1, z, "smooth_stone");
  if (BAND_2 > gr) put(x, BAND_2, z, "light_gray_concrete");

  // Interior columns carry the slabs.
  if (columnCells.has(`${x},${z}`)) {
    for (let y = gr + 1; y < BAND_2; y++) put(x, y, z, "white_concrete");
  }
}

// Pass 2: perimeter walls, storey bands, cornice, openings and entrance.
const doorX = (() => {
  // centre of the street-side edge
  const xs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  return xs.length ? xs[Math.floor(xs.length / 2)] : -1;
})();

for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || gr >= ROOF) continue;
  const corner = isCorner(x, z);

  // Facade: white concrete from the plinth to the parapet.
  for (let y = gr; y <= ROOF; y++) put(x, y, z, "white_concrete");

  // Plinth course at the base.
  put(x, gr, z, "stone_bricks");

  // Storey bands.
  if (BAND_1 > gr) put(x, BAND_1, z, "smooth_stone");
  if (BAND_2 > gr) put(x, BAND_2, z, "smooth_stone");

  // Cornice / parapet cap.
  put(x, ROOF, z, "smooth_stone_slab", { type: "top" });

  if (corner) continue;

  // Ground-floor shopfront band (dark glass alternating with solid piers).
  const shopTop = gr + 3;
  for (let y = gr + 1; y <= shopTop; y++) {
    put(x, y, z, (x + z) % 2 === 1 ? "tinted_glass" : "white_concrete");
  }
  // Lintel course above the shopfront, below the storey band.
  if (gr + 4 < BAND_1) put(x, gr + 4, z, "white_concrete");

  // Upper-floor windows: glass panes in an alternating grid.
  if ((x + z) % 2 === 0) {
    for (let y = 6; y <= 8; y++) put(x, y, z, "glass_pane");
  }

  // Street-side entrance with a door and warm lantern.
  if (z === minZ && x === doorX) {
    put(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: warm light behind some upper windows, roof plant on the deck.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || gr >= ROOF || isCorner(x, z)) continue;
  if ((x + z) % 2 !== 0) continue;
  if ((x * 2 + z) % 7 !== 0) continue;
  // Find an interior neighbour to hold the light behind the glass.
  const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
  for (const [nx, nz] of nbrs) {
    if (!has(nx, nz)) continue;
    if (isPerim(nx, nz)) continue;
    if (columnCells.has(`${nx},${nz}`)) continue;
    const ng = ground.get(`${nx},${nz}`);
    if (ng >= 7) continue;
    put(nx, 7, nz, "glowstone");
    break;
  }
}

// Roof plant: a few condenser units and an equipment box on the deck.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z) || gr >= ROOF) continue;
  if (columnCells.has(`${x},${z}`)) continue;
  if ((x * 3 + z * 5) % 11 === 0) {
    put(x, ROOF, z, "iron_block");
  } else if ((x * 3 + z * 5) % 11 === 1) {
    put(x, ROOF, z, "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833631.nbt");
