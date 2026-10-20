import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986975.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541986975.nbt";

// Footprint 13 x 15, roof about 11 blocks above the lowest ground (~2 storeys of 5 blocks
// plus a parapet). Era: 1980s-90s Taiwanese mixed-use shophouse block, cream tiled
// facade, light concrete bands, glazed shopfront at street level, roof with plant boxes.
const W = 13, H = 23, D = 15;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(key(x, z), gr);
const has = (x, z) => GROUND.has(key(x, z));
const groundAt = (x, z) => GROUND.get(key(x, z));

const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inside(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const isEdgeCell = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const exposedDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Front entrance: the north-most row of footprint cells, door at the cell nearest the middle of that row.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontCells = cells
  .filter(([x, z]) => z === minZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const doorZ = minZ;

// Central cell for the roof mast.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let centreCell = cells[0];
let best = Infinity;
for (const c of cells) {
  const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
  if (d < best) { best = d; centreCell = c; }
}

for (const [x, z, ground] of cells) {
  const edge = isEdgeCell(x, z);
  const exposed = exposedDirs(x, z);
  const corner = exposed.length > 1;
  const top = ground + 11;

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  // 2. Floor slabs: ground floor, storey line, roof deck.
  put(x, ground, z, edge ? "stone_bricks" : "light_gray_concrete");
  put(x, ground + 5, z, edge ? "smooth_stone" : "light_gray_concrete");
  put(x, ground + 10, z, "light_gray_concrete");

  if (edge) {
    // 3. Walls: cream tile for both storeys, plus the roof-level band.
    for (let y = ground + 1; y <= ground + 4; y++) put(x, y, z, "white_terracotta");
    for (let y = ground + 6; y <= ground + 9; y++) put(x, y, z, "white_terracotta");
    put(x, ground + 10, z, "white_terracotta");
    // Parapet coping.
    put(x, top, z, "smooth_stone");
  } else {
    // Interior roof deck and a low parapet-free roof: plant boxes handled below.
  }

  // 4. Windows on non-corner edge cells, in a repeating bay rhythm.
  if (edge && !corner && exposed.length === 1) {
    const bay = (x + z) % 3;
    if (bay === 1) {
      // Storey 1 shopfront: glass with a concrete head band.
      for (let y = ground + 1; y <= ground + 3; y++) put(x, y, z, "glass_pane");
      put(x, ground + 4, z, "light_gray_concrete");
      // Storey 2 window: sill, glass, head.
      put(x, ground + 6, z, "light_gray_concrete");
      put(x, ground + 7, z, "glass_pane");
      put(x, ground + 8, z, "glass_pane");
      put(x, ground + 9, z, "light_gray_concrete");
    }
  }

  // 5. Corner pilasters: light concrete columns at building corners.
  if (edge && corner) {
    for (let y = ground + 1; y <= ground + 9; y++) put(x, y, z, "light_gray_concrete");
  }
}

// 6. Warm lights behind some windows: lanterns in the interior air beside the glass.
for (const [x, z, ground] of cells) {
  if (!isEdgeCell(x, z)) continue;
  const exposed = exposedDirs(x, z);
  if (exposed.length !== 1) continue;
  const [dx, dz] = exposed[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isEdgeCell(ix, iz)) continue;
  const bay = (x + z) % 3;
  if (bay !== 1) continue;
  if ((x * 3 + z) % 4 === 0) {
    put(ix, ground + 7, iz, "lantern", { hanging: "false" });
  } else if ((x * 3 + z) % 4 === 2) {
    put(ix, ground + 2, iz, "lantern", { hanging: "false" });
  }
}

// 7. Entrance: double-height opening with a canopy and hanging lantern.
if (doorX !== null && has(doorX, doorZ)) {
  const gr = groundAt(doorX, doorZ);
  // Clear the opening in the front wall.
  for (let y = gr + 1; y <= gr + 3; y++) put(doorX, y, doorZ, "air");
  // Door: lower and upper halves.
  put(doorX, gr + 1, doorZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gr + 2, doorZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy and a hanging lantern beneath it.
  put(doorX, gr + 4, doorZ, "smooth_stone");
  put(doorX, gr + 3, doorZ, "lantern", { hanging: "true" });
  // Transom glass above the door, under the canopy's edge in the neighbouring bay.
  const neighbour = frontCells.find((x) => x !== doorX);
  if (neighbour !== undefined && has(neighbour, doorZ)) {
    put(neighbour, groundAt(neighbour, doorZ) + 4, doorZ, "light_gray_concrete");
  }
}

// 8. Roof equipment: small plant boxes on the roof deck, and a mast at the centre.
for (const [x, z, ground] of cells) {
  if (isEdgeCell(x, z)) continue;
  const roofY = ground + 11;
  if ((x * 2 + z) % 7 === 0 && roofY < H) {
    put(x, roofY, z, "iron_block");
  }
}
{
  const [x, z, ground] = centreCell;
  const y0 = ground + 11;
  for (let y = y0; y <= y0 + 2 && y < H; y++) put(x, y, z, "lightning_rod");
}

g.save(OUT);
