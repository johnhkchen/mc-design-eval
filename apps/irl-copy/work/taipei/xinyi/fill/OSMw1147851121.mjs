import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 逸林華廈: 1970s-80s Taipei residential 華廈, five storeys of 5 blocks, roof 26 above lowest ground.
// White ceramic-tile walls, light-grey concrete slabs, stone-brick base and cornice,
// light-blue glass panes in white pillared bays, a central entrance canopy, and a rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147851121";
const W = 16, H = 38, D = 51;
const ROOF = 26;

const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const WALL = "white_terracotta";
const PILLAR = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const CORNICE = "stone_bricks";
const PARAPET = "white_terracotta";
const TANK = "white_concrete";
const TANK_TOP = "smooth_stone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gnd] of cells) ground.set(`${x},${z}`, gnd);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// 1. Main massing: foundation, floor slabs, facade bands, parapet
for (const [x, z, gnd] of cells) {
  const ed = edge(x, z);
  for (let y = 0; y <= ROOF; y++) {
    if (y < gnd) { put(x, y, z, FOUND); continue; }
    if (y === ROOF) { if (ed) put(x, y, z, PARAPET); continue; }
    if (y === 25) { put(x, y, z, ed ? CORNICE : SLAB); continue; }
    if (y % 5 === 0) { put(x, y, z, SLAB); continue; }
    if (!ed) continue; // interior air, no interiors modelled
    const k = Math.floor(y / 5);
    const r = y % 5;
    if (r === 4) { put(x, y, z, WALL); continue; } // storey spandrel line
    // r = 1..3: window band
    if (k === 0) {
      put(x, y, z, (x + z) % 3 === 0 ? PILLAR : GLASS);
    } else {
      put(x, y, z, (x + z) % 3 === 0 ? PILLAR : GLASS);
    }
  }
}

// 2. Entrance on the short (minimum-z) face, nearest the middle of the width
let minZ = Infinity;
for (const [x, z] of cells) if (edge(x, z) && z < minZ) minZ = z;
let doorX = null;
for (const [x, z] of cells) {
  if (!edge(x, z) || z !== minZ) continue;
  if (doorX === null || Math.abs(x - 8) < Math.abs(doorX - 8)) doorX = x;
}
if (doorX !== null) {
  const base = Math.max(1, gr(doorX, minZ));
  put(doorX, base, minZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, base + 1, minZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy over the entrance, carried on the door bay
  put(doorX, base + 2, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  // flank the door with pillars so it reads as an entrance bay
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, minZ) && edge(doorX + dx, minZ)) {
      for (let y = base; y <= base + 2; y++) put(doorX + dx, y, minZ, PILLAR);
    }
  }
}

// 3. Warm light: glowstone behind a sparse set of windows (interior cell just inside the glass)
for (const [x, z, gnd] of cells) {
  if (!edge(x, z)) continue;
  for (let k = 1; k <= 4; k++) {
    if (((x * 3 + z + k) % 9) !== 0) continue;
    const y = 5 * k + 2;
    if ((x + z) % 3 === 0) continue; // pillar, not a window
    if (y < gnd) continue;
    const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
      .find(([nx, nz]) => has(nx, nz) && !edge(nx, nz) && y >= gr(nx, nz));
    if (inward) put(inward[0], y, inward[1], "glowstone");
  }
}

// 4. Rooftop water tank: 2x2 interior block nearest the centroid
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx /= cells.length; cz /= cells.length;
let best = null, bestD = Infinity;
for (const [x, z] of cells) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => has(qx, qz) && !edge(qx, qz))) continue;
  const d = (x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2;
  if (d < bestD) { bestD = d; best = quad; }
}
if (best) {
  for (const [tx, tz] of best) {
    put(tx, ROOF, tz, TANK);
    put(tx, ROOF + 1, tz, TANK);
    put(tx, ROOF + 2, tz, TANK_TOP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
