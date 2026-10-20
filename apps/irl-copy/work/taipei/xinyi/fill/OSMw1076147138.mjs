import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1076147138";
const W = 27, H = 38, D = 13;

// Record-driven design: a five-storey, late-1990s/2000s Taipei office block.
// Roof at y=26 (about 26 blocks above lowest ground), 5-block storeys,
// white tiled/concrete facade with light-blue glass and pale frames,
// granite base, quartz cornice, parapet, and a rooftop plant box.
const ROOF = 26;
const PARAPET_TOP = 28;
const PLANT_TOP = 31;

const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_granite";
const CORNICE = "quartz_slab";
const FLOOR = "smooth_stone";
const FOUND = "stone_bricks";
const DECK = "light_gray_concrete";
const PLANT = "gray_concrete";
const PLANT_CAP = "stone_brick_slab";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

let minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) { minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// 1. Foundation, lobby floor, interior floor slabs, roof deck, and facade walls.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const edge = isEdge(x, z);

  if (!edge) {
    put(x, gr, z, FLOOR);
    for (const fy of [5, 10, 15, 20, 25]) if (fy >= gr) put(x, fy, z, FLOOR);
    put(x, ROOF, z, DECK);
    continue;
  }

  // Facade cell: walls from its ground up to the cornice.
  // Index along the wall: x on the front/back rows, z on the end walls.
  const i = (z === minZ || z === maxZ) ? x : z;
  const mullion = i % 3 === 0;

  put(x, gr, z, BASE);
  for (let y = gr + 1; y < ROOF; y++) {
    const ly = y % 5;
    if (ly === 0 || ly === 4) {
      put(x, y, z, WALL);
    } else {
      // ly 1..3: window band
      if (mullion) {
        put(x, y, z, FRAME);
      } else {
        const lit = y >= 5 && ((i + y) % 8 === 4);
        put(x, y, z, lit ? "glowstone" : GLASS);
      }
    }
  }

  // Cornice and parapet on the edge.
  put(x, ROOF, z, CORNICE, { type: "bottom", waterlogged: "false" });
  put(x, ROOF + 1, z, WALL);
  put(x, ROOF + 2, z, WALL);
}

// 2. Entrance on the front row (z = minZ), near the middle of its width.
const frontXs = cells.filter(([x, z]) => z === minZ).map(([x]) => x);
const midX = (Math.min(...frontXs) + Math.max(...frontXs)) / 2;
const doorX = frontXs.reduce((a, b) => (Math.abs(b - midX) < Math.abs(a - midX) ? b : a));
const dz = minZ;
const dg = gAt(doorX, dz);

if (dg !== undefined) {
  // Canopy band over the entrance, two-plus blocks above the door head.
  const canopyY = Math.min(dg + 2, 4);
  for (let x = doorX - 2; x <= doorX + 2; x++) {
    if (!has(x, dz)) continue;
    put(x, canopyY, dz, PLANT_CAP.replace("_cap", "") === "" ? "" : "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // Door: lower and upper halves, opening outward toward -z.
  put(doorX, dg, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, dg + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Warm lights flanking the door, inside the glass line.
  for (const sx of [doorX - 1, doorX + 1]) {
    if (has(sx, dz) && dg + 2 < canopyY) put(sx, dg + 1, dz, "glowstone");
  }
}

// 3. Rooftop plant enclosure: a box on the roof deck, capped with a slab.
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x < 7 || x > 13 || z < 3 || z > 8) continue;
  for (let y = ROOF + 1; y <= PLANT_TOP - 1; y++) put(x, y, z, PLANT);
  put(x, PLANT_TOP, z, PLANT_CAP, { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
