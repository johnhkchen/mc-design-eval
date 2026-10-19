// 16 East 52nd Street, 1927: a stepped Midtown office block of brick on a granite base, limestone storey belts and
// quoins, steel-sash windows in 3-wide bays with mullions, a shopfront with a central door under a copper hood on the
// 52nd Street face, and four tiers (9, 13, 17 and 19 storeys) that follow the lidar roof. A penthouse with a copper cap
// and a lightning rod sits on the top tier. The volume is a one-block shell with a 1-block air gap behind the glass,
// floor slabs at every storey line, and the foundation solid at y 0.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035475.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const X = 20, Z = 20, Y = 70;
const g = new Voxels([X, Y, Z]);
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;

// Lidar roof per cell (a 0 here = no reading, from the record's 1s), a 3x3 median of the readings, then snapped to the
// four tiers: 27 (wings), 39 (mid setback), 51 (upper), 57 (tower top). Tiers sit on storey lines (3 blocks each).
const raw = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, , r] of cells) if (r > 1) raw[z][x] = r;
const TIERS = [27, 39, 51, 57];
const T = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const a = x + dx, b = z + dz;
    if (inFoot(a, b) && raw[b][a] > 0) v.push(raw[b][a]);
  }
  v.sort((p, q) => p - q);
  const m = v.length ? v[v.length >> 1] : 27;
  T[z][x] = TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best));
}

const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const HOR = DIRS.filter(([, b]) => b === 0);
const occ = (x, y, z) => inFoot(x, z) && y >= 0 && y < T[z][x];
const exposed = (x, y, z) => DIRS.filter(([a, b, c]) => !occ(x + a, y + b, z + c));
const interior = (x, y, z) => occ(x, y, z) && exposed(x, y, z).length === 0;

const STREET_Z = Z - 1;                 // the 52nd Street face (south, high z)
const ENTRY = [9, 10, 11], DOOR_X = 10; // the centre bay: door, shop glass either side
const panes = new Map();                // "x,y,z" -> { block, plane, inward }, glass and mullions in the air gap

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < T[z][x]; y++) {
  const ex = exposed(x, y, z);
  if (!ex.length) {                                   // interior: air, with a floor slab at each storey line
    if (y % 3 === 0 && y > 0 && y < T[z][x] - 1) g.set(x, y, z, "smooth_stone");
    continue;
  }
  const hor = ex.filter(([, b]) => b === 0), top = ex.some(([, b]) => b === 1);
  if (y === 0) { g.set(x, y, z, hor.length ? "polished_granite" : "stone_bricks"); continue; }   // granite plinth
  if (top) { g.set(x, y, z, hor.length ? "smooth_stone" : "stone_bricks"); continue; }           // roof, limestone coping at the edge
  if (hor.length === 0) continue;
  if (hor.length >= 2) { g.set(x, y, z, "smooth_stone"); continue; }                             // quoin
  const [dx, , dz] = hor[0];
  const street = dz === 1 && z === STREET_Z, ground = y < 3;
  if (street && y === 3 && ENTRY.includes(x)) { g.set(x, y, z, "oxidized_copper"); continue; }   // entrance hood
  if (y % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }                                   // storey belt
  if (street && ground && x === DOOR_X) {
    g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  const u = dz !== 0 ? x : z;                                                                       // position along the face
  if (u % 4 === 0) { g.set(x, y, z, street && ground ? "polished_granite" : "bricks"); continue; }  // brick pier
  const ix = x - dx, iz = z - dz;                                                                   // one block in, behind the glass
  if (!interior(ix, y, iz)) { g.set(x, y, z, "bricks"); continue; }
  g.set(x, y, z, "air");                                                                            // the recess
  const shop = street && ground, mullion = !shop && u % 4 === 2;
  panes.set(`${ix},${y},${iz}`, {
    block: mullion ? "iron_bars" : shop ? "glass_pane" : "gray_stained_glass_pane",
    plane: dz !== 0 ? "z" : "x", inward: [-dx, 0, -dz],
  });
}

// Pane and bar connections run along their own wall; a few windows have a warm light a block behind the glass.
for (const [key, p] of panes) {
  const [px, py, pz] = key.split(",").map(Number);
  const same = (a, b, c) => panes.get(`${a},${b},${c}`)?.plane === p.plane;
  const st = p.plane === "z"
    ? { north: "false", south: "false", east: String(same(px + 1, py, pz)), west: String(same(px - 1, py, pz)) }
    : { north: String(same(px, py, pz - 1)), south: String(same(px, py, pz + 1)), east: "false", west: "false" };
  g.set(px, py, pz, p.block, { ...st, waterlogged: "false" });
  if ((px * 7 + py * 5 + pz * 11) % 6 === 0) {
    const [a, b, c] = p.inward, lx = px + a, lz = pz + c;
    if (interior(lx, py, lz)) g.set(lx, py, lz, "glowstone");
  }
}

// Parapets on every roof edge that meets open air or a lower tier, as connected stone walls.
const parapet = new Set();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = T[z][x];
  const edge = HOR.some(([a, , c]) => !inFoot(x + a, z + c) || T[z + c][x + a] < t);
  if (edge) parapet.add(`${x},${t},${z}`);
}
for (const key of parapet) {
  const [x, y, z] = key.split(",").map(Number);
  const link = (a, c) => (parapet.has(`${x + a},${y},${z + c}`) ? "low" : "none");
  g.set(x, y, z, "stone_brick_wall", { up: "true", north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

// Roof equipment: a mechanical house on the wing and a stair house on the middle setback, both on their roof decks.
const box = (x0, x1, z0, z1, y0, y1, block, cap) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (let y = y0; y <= y1; y++) g.set(x, y, z, block);
    if (cap) g.set(x, y1 + 1, z, cap);
  }
};
box(4, 5, 0, 1, 27, 28, "bricks", "smooth_stone");
box(2, 3, 4, 5, 39, 40, "bricks", "smooth_stone");

// Penthouse on the tower top: brick walls round an open room, copper cap, lightning rod.
const PH = { x0: 14, x1: 17, z0: 12, z1: 15 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  for (let y = 57; y <= 59; y++) if (ring) g.set(x, y, z, "bricks");
  g.set(x, 60, z, "oxidized_copper");
}
g.set(15, 61, 13, "lightning_rod", { facing: "up", waterlogged: "false" });

const { blocks, palette } = g.save(`${DIR}/NYC1035475.nbt`);

// Checks: every block is joined to something (no floating cells), and count the cantilevers (nothing below).
let floating = 0, cantilever = 0, maxY = 0;
for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!g.get(x, y, z)) continue;
  maxY = Math.max(maxY, y);
  const nb = DIRS.filter(([a, b, c]) => g.get(x + a, y + b, z + c)).length;
  if (nb === 0 && y > 0) floating++;
  if (y > 0 && !g.get(x, y - 1, z)) cantilever++;
}
console.log(`saved NYC1035475.nbt: ${blocks} blocks, ${palette} palette entries, top at y ${maxY}`);
console.log(`floating (no neighbour): ${floating}; cantilevered (nothing below): ${cantilever}`);
console.log(`tiers (roof blocks): ${[...new Set(T.flat())].sort((a, b) => a - b).join(", ")}`);
