import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw458212379";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 39, H = 23, D = 35;
const CORNICE = 10;   // roof slab / cornice course
const PARAPET = 11;   // parapet top, lidar roof height above lowest ground
const STOREY_LINE = 5;

const vox = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const perim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Largest z present for each x column (front = south face, +z)
const maxZ = new Map();
for (const [x, z] of cells) maxZ.set(x, Math.max(maxZ.get(x) ?? -1, z));

// Bay pier test: piers every 3 bays and at corners
function isPier(x, z) {
  const cornerish = (has(x + 1, z) && !has(x, z + 1) && !has(x, z - 1)) ||
                    (has(x - 1, z) && !has(x, z + 1) && !has(x, z - 1)) ||
                    (!has(x + 1, z) && !has(x - 1, z)) && false;
  const onZFace = !has(x, z + 1) || !has(x, z - 1);
  const coord = onZFace ? x : z;
  const exposedBoth = (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));
  return coord % 3 === 0 || exposedBoth || cornerish;
}

// Perimeter wall block at height y for cell with ground gr
function wallBlock(x, z, y, gr) {
  if (y === STOREY_LINE || y === CORNICE) return "light_gray_concrete";
  if (y === 4 || y === 9) return "white_concrete";
  const win = (y >= gr + 1 && y <= 3) || (y >= 6 && y <= 8);
  if (win) return isPier(x, z) ? "light_gray_concrete" : "light_blue_stained_glass";
  return "white_concrete";
}

// Pass 1: foundations, interior slabs, walls, parapet
for (const [x, z, gr] of cells) {
  // foundation fill from y 0 up to ground
  for (let y = 0; y < gr && y < H; y++) vox.set(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // ground floor slab, storey slab, roof slab (interior, no walls)
    if (gr < H) vox.set(x, gr, z, "light_gray_concrete");
    if (STOREY_LINE > gr && STOREY_LINE < H) vox.set(x, STOREY_LINE, z, "light_gray_concrete");
    if (gr <= CORNICE) vox.set(x, CORNICE, z, "light_gray_concrete");
  } else {
    for (let y = gr; y <= CORNICE && y < H; y++) {
      const b = wallBlock(x, z, y, gr);
      if (b) vox.set(x, y, z, b);
    }
    if (gr <= PARAPET) vox.set(x, PARAPET, z, "white_concrete");
  }
}

// Pass 2: entrance on the south (max z) face, centred near x = 19
for (const [x, z, gr] of cells) {
  if (!perim(x, z) || z !== maxZ.get(x)) continue;
  if (x < 17 || x > 21) continue;
  if (gr + 3 > CORNICE) continue;
  vox.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(x, gr + 2, z, "light_blue_stained_glass");
  vox.set(x, gr + 3, z, "light_gray_concrete");
  // canopy-like lintel band just inside the entrance bays
  if (has(x - 1, z) && perim(x - 1, z) && z === maxZ.get(x - 1)) {
    // leave neighbouring piers intact
  }
}

// Pass 3: warm lanterns hung under the storey-2 ceiling, behind windows
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  if ((x + z) % 4 !== 0) continue;
  if (isPier(x, z)) continue;
  // inward neighbour (opposite the exposed side)
  const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .find(([nx, nz]) => has(nx, nz) && !perim(nx, nz));
  if (!inward) continue;
  const [ix, iz] = inward;
  if (CORNICE - 1 > 6) {
    vox.set(ix, 9, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: roof equipment on the cornice slab (stair/lift core and AC plant)
for (const [x, z, gr] of cells) {
  if (gr > CORNICE) continue;
  const core = x >= 16 && x <= 22 && z >= 14 && z <= 20 && !perim(x, z);
  if (core) {
    vox.set(x, PARAPET, z, "light_gray_concrete");
    if (x >= 17 && x <= 21 && z >= 15 && z <= 19) {
      vox.set(x, PARAPET + 1, z, "light_gray_concrete");
      vox.set(x, PARAPET + 2, z, "smooth_stone");
    }
  }
  const plant = x >= 5 && x <= 8 && z >= 5 && z <= 7 && !perim(x, z);
  if (plant) vox.set(x, PARAPET, z, "smooth_stone");
}

vox.save(`${DIR}/${ID}.nbt`);
