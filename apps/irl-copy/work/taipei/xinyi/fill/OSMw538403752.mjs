import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw538403752: no record. Read as a 1970s-80s Taipei concrete-frame mixed-use block:
// two storeys of 5 blocks each, shopfront ground floor, pale tiled facade, flat roof
// with a stair/lift penthouse and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403752";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]

const W = 19, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const inFp = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Levels (absolute y): ground storey gc..4, slab 5, upper storey 6..9, slab 10,
// roof deck 11 (lidar roof ~11 above lowest ground), parapet 12.
const SLAB1 = 5, SLAB2 = 10, ROOF = 11;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// 1. Foundation, floor slabs, roof deck
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  for (const y of [SLAB1, SLAB2, ROOF]) if (y >= gc) put(x, y, z, "light_gray_concrete");
}

// 2. Facades on edge cells
for (const [x, z, gc] of cells) {
  const missing = DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
  if (missing.length === 0) continue;
  const [mdx, mdz] = missing[0];
  const ix = x - mdx, iz = z - mdz; // inward neighbour
  const p = (x + z) % 3;            // bay pattern: 0 = pilaster, else window bay

  // Ground storey: plinth, shopfront glass, fascia
  for (let y = gc; y <= 4; y++) {
    if (y === gc) { put(x, y, z, "stone_bricks"); continue; }
    if (p === 0) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === 4) put(x, y, z, "smooth_stone");
    else put(x, y, z, "glass");
  }

  // Upper storey: pilasters, sill, glazing, lintel
  for (let y = 6; y <= 9; y++) {
    if (p === 0) put(x, y, z, "light_gray_concrete");
    else if (y === 7 || y === 8) {
      put(x, y, z, "light_blue_stained_glass_pane");
      if ((x * 5 + z * 3) % 4 === 0 && inFp(ix, iz)) put(ix, 7, iz, "glowstone");
    } else put(x, y, z, "white_concrete");
  }

  // Parapet and cornice
  put(x, 12, z, p === 0 ? "light_gray_concrete" : "white_concrete");
  if (p === 0) put(x, 13, z, "light_gray_concrete");
}

// 3. Entrance on the south-most edge, near the middle of the frontage
{
  let best = null;
  for (const [x, z, gc] of cells) {
    const edge = DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
    if (!edge || gc > 3) continue;
    const score = z * 100 - Math.abs(x - 9);
    if (!best || score > best.score) best = { x, z, gc, score };
  }
  if (best) {
    put(best.x, best.gc, best.z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    if (best.gc + 1 <= 3)
      put(best.x, best.gc + 1, best.z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(best.x, best.gc + 2, best.z, "light_gray_concrete");
  }
}

// 4. Roof penthouse (stair/lift), x 6..11, z 5..10, on the roof deck
const PH = { x0: 6, x1: 11, z0: 5, z1: 10 };
const phOk = [];
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) phOk.push(inFp(x, z));
if (phOk.every(Boolean)) {
  for (let x = PH.x0; x <= PH.x1; x++)
    for (let z = PH.z0; z <= PH.z1; z++) {
      const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
      for (let y = 12; y <= 15; y++) {
        if (!edge) continue;
        if (y === 13 || y === 14) {
          if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");
          else put(x, y, z, "light_blue_stained_glass_pane");
        } else put(x, y, z, "white_concrete");
      }
      put(x, 16, z, "light_gray_concrete");
    }
}

// 5. Rooftop water tank on a stand, clear of the penthouse
const tankCells = [[2, 2], [3, 2], [2, 3], [3, 3]];
if (tankCells.every(([x, z]) => inFp(x, z))) {
  for (const [x, z] of tankCells) {
    put(x, 12, z, "stone_bricks");
    for (let y = 13; y <= 15; y++) put(x, y, z, "spruce_planks");
    put(x, 16, z, "spruce_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
