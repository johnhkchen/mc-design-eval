import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR2223059882";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 63, D = 50, H = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup
const map = new Map();
for (const [x, z, ground, roof] of cells) map.set(`${x},${z}`, { ground, roof });
const has = (x, z) => map.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Massing: common eaves from median lidar roof, ridge a few blocks above
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...cells.map(c => c[2]));
const WT = Math.max(Math.round(medRoof) - 2, maxG + 3); // eaves / wall top
const RIDGE = Math.min(H - 2, WT + 3);

// Materials: light render walls, dark slate roof, stone plinth and cornice
const WALL = "calcite";
const PLINTH = "stone_bricks";
const BAND = "chiseled_stone_bricks";
const FLOOR = "smooth_stone";
const FOUND = "cobblestone";
const ROOF = "deepslate_tiles";
const WOOD = "dark_oak_planks";

// Foundation, plinth, floor and walls
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, edge ? PLINTH : FLOOR);
  if (!edge) continue;
  g.set(x, gr + 1, z, PLINTH); // base course reads as plinth
  for (let y = gr + 2; y <= WT - 2; y++) g.set(x, y, z, WALL);
  g.set(x, WT - 1, z, BAND); // cornice band under the roof
}

// Windows, warm light and the barn gate on the perimeter
const DOORS = [30, 31];
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const onLong = z === 0 || z === D - 1;
  const onShort = x === 0 || x === W - 1;

  // Main south barn gate: wooden frame with a double door in the middle
  if (z === D - 1 && x >= 26 && x <= 36) {
    if (DOORS.includes(x)) {
      const hinge = x === 30 ? "left" : "right";
      g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
      g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    } else {
      for (let y = gr + 1; y <= Math.min(gr + 3, WT - 2); y++) g.set(x, y, z, WOOD);
    }
    continue;
  }

  const winSpot = (onLong && x % 6 === 3 && x >= 3 && x <= W - 4) || (onShort && z % 6 === 3 && z >= 3 && z <= D - 4);
  if (!winSpot) continue;
  for (let y = gr + 2; y <= Math.min(gr + 4, WT - 2); y++) g.set(x, y, z, "glass_pane");

  // warm glowstone floor light just inside, behind the glass
  const ix = onShort ? (x === 0 ? 1 : W - 2) : x;
  const iz = onLong ? (z === 0 ? 1 : D - 2) : z;
  if (has(ix, iz) && !isEdge(ix, iz)) g.set(ix, gr + 1, iz, "glowstone");
}

// Interior posts carrying the roof (air gap elsewhere)
for (const px of [10, 21, 31, 41, 52]) {
  for (const pz of [12, 24, 37]) {
    if (!has(px, pz) || isEdge(px, pz)) continue;
    const gr = map.get(`${px},${pz}`).ground;
    for (let y = gr + 1; y <= WT - 1; y++) g.set(px, y, pz, PLINTH);
  }
}

// Roof: solid slate mass from the eaves, pitched toward the long ridge with stair courses
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const d = Math.min(z, D - 1 - z);
  const h = Math.min(RIDGE, WT + 1 + Math.floor(d / 3));
  for (let y = WT; y <= h - 1; y++) g.set(x, y, z, ROOF);
  if (h === RIDGE) {
    g.set(x, h, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
  } else {
    const facing = z <= (D - 1) / 2 ? "north" : "south";
    g.set(x, h, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
