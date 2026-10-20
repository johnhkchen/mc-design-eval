import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167411.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw535167411.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 12, H = 38, D = 25;
const ROOF = 26;        // parapet top, about 26 blocks above lowest ground
const STOREY = 5;       // storey height in blocks
const g = new Voxels([W, H, D]);

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => { if (inBounds(x, y, z)) g.set(x, y, z, id, props); };

// Era: 1980s Taipei commercial mid-rise. Cream ceramic-tile walls, tinted glass
// in aluminium frames, red-tile shopfront signage band, dark gray roof deck,
// water tank on the roof.
const WALL = "smooth_quartz";
const WALL_SLAB = "smooth_quartz_slab";
const PLINTH = "stone_bricks";
const BASE = "polished_andesite";
const FLOOR = "smooth_stone";
const DECK = "gray_concrete";
const GLASS = "gray_stained_glass_pane";
const SILL = "light_gray_concrete";
const SIGN = "red_terracotta";
const SIGN_SLAB = "red_terracotta_slab";
const LAMP = "shroomlight";

// Entrance cell on the north (z = 0) frontage, near the centre of the 12 m width.
const doorCells = [[5, 0], [6, 0]].filter(([x, z]) => has(x, z));
const isDoor = (x, z) => doorCells.some(([dx, dz]) => dx === x && dz === z);
const doorX = doorCells.length ? doorCells[0][0] : -1;
const doorZ = doorCells.length ? doorCells[0][1] : -1;

for (const [x, z, gr] of cells) {
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const ext = edgeZ || edgeX;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  if (!ext) {
    // Interior cell: no rooms, just a floor slab per storey and the roof deck.
    put(x, gr, z, FLOOR);
    for (let k = 1; k <= 4; k++) {
      const y = STOREY * k;
      if (y > gr) put(x, y, z, FLOOR);
    }
    if (ROOF - 1 > gr) put(x, ROOF - 1, z, DECK);
    continue;
  }

  // Exterior cell: plinth band, then full wall up to the parapet.
  put(x, gr, z, BASE);
  for (let y = gr + 1; y <= ROOF - 2; y++) {
    if (y % STOREY === 0) put(x, y, z, WALL_SLAB, { type: "bottom" });
    else put(x, y, z, WALL);
  }

  // Ground floor shopfront: glass with a door on the front.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor(x, z)) continue;
    put(x, y, z, GLASS);
  }
  // Signage band / canopy over the shopfront.
  if (isDoor(x, z)) put(x, gr + 4, z, SIGN_SLAB, { type: "bottom" });
  else put(x, gr + 4, z, SIGN);

  // Upper storeys: window grid with sills; alternating bays on each facade.
  const windowCell =
    (edgeZ && x % 2 === 1) || (edgeX && z % 2 === 0);
  if (windowCell) {
    for (let k = 1; k <= 4; k++) {
      const base = STOREY * k;
      if (base <= gr + 4) continue;
      put(x, base + 1, z, SILL);
      for (let y = base + 2; y <= base + 4; y++) put(x, y, z, GLASS);
    }
  }

  // Parapet cornice at the top of the wall.
  put(x, ROOF - 1, z, WALL);
  put(x, ROOF, z, WALL_SLAB, { type: "bottom" });
}

// Doors (lower and upper halves), facing the street on the north side.
for (const [dx, dz] of doorCells) {
  const gr = ground.get(`${dx},${dz}`);
  put(dx, gr + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm lights standing on the interior floor, visible through some windows.
for (const [x, z, gr] of cells) {
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  if (!(edgeZ || edgeX)) continue;
  const windowCell = (edgeZ && x % 2 === 1) || (edgeX && z % 2 === 0);
  if (!windowCell || (x + z) % 5 !== 0) continue;
  let ix = x, iz = z;
  if (!has(x, z - 1)) iz = z + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz)) continue;
  for (let k = 1; k <= 4; k++) {
    const y = STOREY * k;
    if (y <= gr + 4) continue;
    put(ix, y + 1, iz, LAMP);
  }
}

// Roof plant: a water tank on a 2x2 interior footprint, plus a small mech box.
const roofBlock = (x, z) => has(x, z) && !(!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const tankCells = [[3, 10], [4, 10], [3, 11], [4, 11]];
if (tankCells.every(([x, z]) => roofBlock(x, z))) {
  for (const [x, z] of tankCells) {
    for (let y = ROOF; y <= ROOF + 2; y++) put(x, y, z, "white_concrete");
    put(x, ROOF + 3, z, "dark_oak_slab", { type: "bottom" });
  }
}
if (roofBlock(7, 15)) {
  put(7, ROOF, 15, "light_gray_concrete");
  put(7, ROOF + 1, 15, "light_gray_concrete");
}

g.save(OUT);
