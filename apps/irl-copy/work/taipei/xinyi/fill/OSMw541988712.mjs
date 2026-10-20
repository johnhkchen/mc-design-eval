import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988712.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988712.nbt";

const W = 17, H = 23, D = 20;
const ROOF_TOP = 11;           // parapet top, lidar roof ~11 above lowest ground
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint: key -> ground height (clamped so the body always has room for two storeys)
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.min(Math.max(0, Math.round(gr)), 4));
}
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const isCorner = (x, z) => {
  const xe = !has(x + 1, z) || !has(x - 1, z);
  const ze = !has(x, z + 1) || !has(x, z - 1);
  return xe && ze;
};
const inward = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
};

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellList = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});
const xs = cellList.map(c => c.x), zs = cellList.map(c => c.z);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2;

// 1. Foundation, floors, roof deck
for (const { x, z, gr } of cellList) {
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    set(x, gr, z, "light_gray_concrete");          // ground floor slab
    if (5 > gr) set(x, 5, z, "light_gray_concrete"); // second floor slab
    set(x, 10, z, "light_gray_concrete");          // roof deck
  }
}

// 2. Facade walls
// Ground floor: stone base, window zone y1-3, red sign band y4.
// Storey line y5, sill y6, upper windows y7-8, lintel y9, cornice y10, parapet y11.
for (const { x, z, gr } of cellList) {
  if (!isEdge(x, z)) continue;
  const pier = isCorner(x, z) || (x + z) % 3 === 0;
  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === gr) { set(x, y, z, "stone_bricks"); continue; }
    if (y === 4) { set(x, y, z, "red_terracotta"); continue; }
    if (y === 5 || y === 6 || y === 9 || y === 10 || y === 11) {
      set(x, y, z, "smooth_quartz"); continue;
    }
    // window zones: y 1..3 (ground), 7..8 (upper)
    const upper = y >= 7;
    if (pier) { set(x, y, z, "smooth_quartz"); continue; }
    const lit = (x * 7 + z * 3 + (upper ? 1 : 0)) % 6 === 0;
    const inn = inward(x, z);
    if (lit && inn) {
      set(x, y, z, upper ? "light_blue_stained_glass_pane" : "light_blue_stained_glass_pane");
      set(inn[0], y, inn[1], "glowstone");          // glowstone behind the glass
    } else if (lit) {
      set(x, y, z, "yellow_stained_glass_pane");    // warm pane at dusk
    } else {
      set(x, y, z, upper ? "light_blue_stained_glass_pane" : "light_blue_stained_glass_pane");
    }
  }
}

// 3. Main entrance on the south (max z) edge, nearest the centre line
let door = null;
for (const { x, z, gr } of cellList) {
  if (z !== maxZ || !isEdge(x, z)) continue;
  if (!door || Math.abs(x - midX) < Math.abs(door.x - midX)) door = { x, z, gr };
}
if (door) {
  const y0 = door.gr + 1;
  set(door.x, y0, door.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(door.x, y0 + 1, door.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // small warm lantern-style light above the door, on the sign band line
  set(door.x, 3, door.z, "smooth_quartz");
}

// 4. Roof equipment: water tank (3x3 interior) and a lightning rod
const interior3x3 = (cx, cz) => {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (!has(cx + dx, cz + dz) || isEdge(cx + dx, cz + dz)) return false;
  return true;
};
let tank = null;
const cx0 = (minX + maxX) / 2, cz0 = (minZ + maxZ) / 2;
for (const { x, z } of cellList) {
  if (!interior3x3(x, z)) continue;
  const d = Math.hypot(x - cx0, z - cz0);
  if (!tank || d < tank.d) tank = { x, z, d };
}
if (tank) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      set(tank.x + dx, 11, tank.z + dz, "stone_bricks");
      set(tank.x + dx, 12, tank.z + dz, "stone_bricks");
      set(tank.x + dx, 13, tank.z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
}
for (const { x, z } of cellList) {
  if (isEdge(x, z) || (tank && Math.abs(x - tank.x) <= 1 && Math.abs(z - tank.z) <= 1)) continue;
  if (x === minX + 1 && z === minZ + 1) {
    for (let y = 11; y <= 14; y++)
      set(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    break;
  }
}

g.save(OUT);
