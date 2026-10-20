import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (c. 1975-85) two-storey Taipei commercial block: stone base course,
// cream tile walls with light grey concrete piers, tinted glass windows, a shopfront
// on the ground storey, cornice and parapet, and a rooftop water tank.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891060.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540891060.nbt";

const W = 16, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let B = Infinity, xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), gr);
  B = Math.min(B, gr);
  xMin = Math.min(xMin, x); xMax = Math.max(xMax, x);
  zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
}

const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Storey levels relative to B (lowest ground under the footprint).
const F1 = B, F2 = B + 5, ROOF = B + 10, PARAPET = B + 11;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs (base course, storey line, roof) across every cell where not already solid.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);
  if (gr <= F1) put(x, F1, z, perim ? "stone_bricks" : "smooth_quartz");
  if (gr <= F2) put(x, F2, z, "smooth_quartz");
  if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");
}

// 3. Perimeter walls with a pier rhythm, shopfront, window grid, cornice and parapet.
const isPier = (x, z) => {
  const onZFace = z === zMin || z === zMax;
  const u = onZFace ? x : z;
  const u0 = onZFace ? xMin : zMin;
  const u1 = onZFace ? xMax : zMax;
  return u === u0 || u === u1 || (u - u0) % 3 === 0;
};

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const pier = isPier(x, z);
  const yStart = Math.max(gr, F1 + 1);
  for (let y = yStart; y <= PARAPET; y++) {
    let id;
    if (y === PARAPET) id = "light_gray_concrete";           // parapet coping
    else if (y === ROOF) id = "smooth_quartz";                // cornice band
    else if (y === F2) id = "smooth_quartz";                  // storey line
    else if (y <= F1 + 4) {                                   // ground storey: shopfront
      if (y === F1 + 4) id = pier ? "light_gray_concrete" : "white_terracotta"; // lintel
      else id = pier ? "light_gray_concrete" : "glass";
    } else {                                                  // upper storey
      if (y === F2 + 1 || y === F2 + 4) id = pier ? "light_gray_concrete" : "white_terracotta"; // head/sill
      else if (y === F2 + 2 || y === F2 + 3) id = pier ? "light_gray_concrete" : "light_blue_stained_glass_pane";
      else id = pier ? "light_gray_concrete" : "white_terracotta";
    }
    put(x, y, z, id);
  }
}

// 4. Warm light behind some upper windows (inward neighbour of window cells).
const inward = (x, z) => {
  if (z === zMin) return [x, z + 1];
  if (z === zMax) return [x, z - 1];
  if (x === xMin) return [x + 1, z];
  if (x === xMax) return [x - 1, z];
  return null;
};
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z) || isPier(x, z)) continue;
  if ((x + z) % 2 !== 0) continue;
  const inn = inward(x, z);
  if (!inn || !has(inn[0], inn[1])) continue;
  put(inn[0], F2 + 2, inn[1], (x + z) % 4 === 0 ? "glowstone" : "shroomlight");
}

// 5. Entrance on the street (z min) face: double door, transom above, hanging lantern inside.
let door = null;
const midX = Math.round((xMin + xMax) / 2);
for (let d = 0; d <= xMax - xMin && !door; d++) {
  for (const x of [midX + d, midX - d]) {
    if (x < xMin || x > xMax || !has(x, zMin)) continue;
    const gr = ground.get(key(x, zMin));
    if (Math.max(gr, F1 + 1) === F1 + 1) { door = { x, z: zMin, y: F1 + 1 }; break; }
  }
}
if (door) {
  const { x, z, y } = door;
  put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, y + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (has(x, z + 1)) put(x, F2 - 1, z + 1, "lantern", { hanging: "true" });
}

// 6. Roof: a steel water tank (2x2) near the centre with a timber cap.
const cx = Math.floor((xMin + xMax) / 2), cz = Math.floor((zMin + zMax) / 2);
let tank = null;
for (let dx = -1; dx <= 0 && !tank; dx++) {
  for (let dz = -1; dz <= 0 && !tank; dz++) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([ox, oz]) => {
      const x = cx + dx + ox, z = cz + dz + oz;
      return has(x, z) && !isPerim(x, z);
    });
    if (ok) tank = { x0: cx + dx, z0: cz + dz };
  }
}
if (tank) {
  for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    put(tank.x0 + ox, PARAPET, tank.z0 + oz, "iron_block");
    put(tank.x0 + ox, PARAPET + 1, tank.z0 + oz, "iron_block");
    put(tank.x0 + ox, PARAPET + 2, tank.z0 + oz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(OUT);
