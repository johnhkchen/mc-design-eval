import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458736";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 15 x 20 footprint, roof about 11 blocks above lowest ground.
// Read as a 2-storey Taipei commercial block of the 1980s-90s:
// stone-base shopfront, white tiled reinforced-concrete upper floor,
// quartz cornice, parapet, and a rooftop water tank.
const W = 15, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const inS = new Set();
const gmap = new Map();
for (const [x, z, gr] of cells) {
  inS.add(`${x},${z}`);
  gmap.set(`${x},${z}`, gr);
}
const has = (x, z) => inS.has(`${x},${z}`);
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Door: middle perimeter cell on the lowest-z (north) edge.
let minZ = Infinity, minX = Infinity;
for (const [x, z] of cells) { minZ = Math.min(minZ, z); minX = Math.min(minX, x); }
const doorEdge = cells
  .filter(([x, z]) => z === minZ && perim(x, z))
  .sort((a, b) => a[0] - b[0]);
const door = doorEdge.length ? doorEdge[Math.floor(doorEdge.length / 2)] : null;
const doorKey = door ? `${door[0]},${door[1]}` : null;

for (const [x, z, b] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const p = perim(x, z);
  const bay = (x + z) % 3 === 0; // white tiled pilasters between glazing bays
  const isDoor = doorKey === `${x},${z}`;

  // Ground floor interior: floor-to-ceiling air; warm light behind some glass.
  if (!p && (x * 5 + z) % 6 === 0) put(x, b + 2, z, "glowstone");

  // Floor / storey slab between storeys and under the roof, all cells.
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 9, z, p ? "quartz_block" : "light_gray_concrete");

  // Upper-storey interior light.
  if (!p && (x * 7 + z * 3) % 5 === 0) put(x, b + 7, z, "shroomlight");

  if (!p) continue;

  // Perimeter facade.
  put(x, b, z, "stone_bricks");                  // base course
  put(x, b + 4, z, "smooth_stone");              // ground-floor storey line
  put(x, b + 10, z, "white_concrete");           // parapet

  // Ground floor shopfront.
  for (let dy = 1; dy <= 3; dy++) {
    if (isDoor) {
      if (dy === 1) put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (dy === 2) put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, b + 3, z, "glass_pane", pane); // transom
    } else if (bay) {
      put(x, b + dy, z, "white_concrete");
    } else {
      put(x, b + dy, z, "glass_pane", pane);
    }
  }

  // Upper storey: window grid with tiled pilasters.
  for (let dy = 6; dy <= 8; dy++) {
    if (bay) put(x, b + dy, z, "white_concrete");
    else put(x, b + dy, z, "glass_pane", pane);
  }

  // Cornice.
  put(x, b + 9, z, "quartz_block");
}

// Rooftop water tank (3x3 box on the roof, if the whole footprint allows it).
const bx0 = minX;
const tankCells = [];
for (let x = bx0 + 4; x <= bx0 + 6; x++) {
  for (let z = minZ + 6; z <= minZ + 8; z++) tankCells.push([x, z]);
}
const tankOk = tankCells.every(([x, z]) => has(x, z) && !perim(x, z));
if (tankOk) {
  for (const [x, z] of tankCells) {
    const b = gmap.get(`${x},${z}`);
    const ring = x === bx0 + 4 || x === bx0 + 6 || z === minZ + 6 || z === minZ + 8;
    if (ring) {
      put(x, b + 10, z, "light_gray_concrete");
      put(x, b + 11, z, "light_gray_concrete");
    } else {
      put(x, b + 10, z, "iron_bars");
    }
    put(x, b + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
