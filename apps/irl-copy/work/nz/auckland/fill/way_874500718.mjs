// Quay West: a glazed concrete-frame office tower on a podium, built from the lidar roof record. The record gives a
// 121 m (145-block) roof on a ~25-block (six-storey) podium; storeys are 4 blocks (3.3 m), so the tower is about 30
// storeys over the podium. Every storey line sits on the one global grid (roof - 1 - 4k), so tiers and the podium
// share floor lines. The shell is one block thick with air behind the glass; each storey has a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_874500718.cells.json", "utf8"));

const X = 67, Z = 72, Y = 157;
const FOUND = "stone_bricks", BASE = "stone_bricks", FRAME = "white_concrete", SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", ROOF = "light_gray_concrete", PARAPET = "white_concrete", LINTEL = "chiseled_stone_bricks";
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// lidar roofs smoothed into clean tiers: the tower steps 129 -> 137 -> 145, the podium snaps to the storey grid
function tierTop(r, g) {
  let h;
  if (r >= 141) h = 145;
  else if (r >= 134) h = 137;
  else if (r >= 120) h = 129;
  else if (r >= 90) h = 101;
  else if (r <= 12) h = 13;
  else h = 4 * Math.round((r - 1) / 4) + 1;
  while (h < g + 4) h += 4;                 // at least one storey above its own ground
  return h;
}

const col = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, ground, roof] of cells) col[x][z] = { g: ground, top: tierTop(roof, ground) };

const inFp = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && col[x][z] !== null;
// a neighbour is open at y when it is outside the footprint or its column has ended below y
const open = (x, z, y) => !inFp(x, z) || y >= col[x][z].top;
const exposures = (x, z, y) => DIRS.filter(([dx, dz]) => open(x + dx, z + dz, y));
// floor slabs and the roof cap sit on the grid: m = 0
const isSlab = (H, y) => (H - 1 - y) % 4 === 0;
const alongOf = (ex, x, z) => (ex.some(([dx]) => dx) ? z : x);
const isCorner = (ex) => ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);

function facade(x, z, y, ex, g, H) {
  if (isCorner(ex) || alongOf(ex, x, z) % 3 === 0) return FRAME;     // mullions and corners
  if (y === g) return BASE;                                          // base course
  if (y - g < 4) return GLASS;                                       // shopfront band
  return (H - 1 - y) % 4 === 3 ? SPANDREL : GLASS;                   // spandrel under each window band
}

const v = new Voxels([X, Y, Z]);
const cellsList = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = col[x][z]; if (!c) continue;
  cellsList.push([x, z]);
  for (let y = 0; y < c.g; y++) v.set(x, y, z, FOUND);
  for (let y = c.g; y < c.top; y++) {
    if (y === c.top - 1) { v.set(x, y, z, ROOF); continue; }
    if (isSlab(c.top, y)) { v.set(x, y, z, FRAME); continue; }
    const ex = exposures(x, z, y);
    if (ex.length) v.set(x, y, z, facade(x, z, y, ex, c.g, c.top));
  }
  if (exposures(x, z, c.top).length) v.set(x, c.top, z, PARAPET);
}

// the entrance: on the outward face with the most ground-storey frontage, at the middle of its run
const faces = new Map();
for (const [x, z] of cellsList) {
  const { g, top: H } = col[x][z];
  if (g + 3 >= H - 1 || isSlab(H, g + 1) || isSlab(H, g + 2)) continue;
  const ex = exposures(x, z, g + 1);
  if (!ex.length || isCorner(ex)) continue;
  const [dx, dz, name] = ex[0];
  if (!faces.has(name)) faces.set(name, []);
  faces.get(name).push({ x, z, dx, dz, name, g, H });
}
let run = [...faces.values()].sort((a, b) => b.length - a.length)[0] ?? [];
if (run.length) {
  run.sort((a, b) => alongOf([[a.dx, a.dz]], a.x, a.z) - alongOf([[b.dx, b.dz]], b.x, b.z));
  const e = run[run.length >> 1];
  const { x, z, g, H, name } = e;
  const state = (half) => ({ facing: name, half, hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 1, z, "iron_door", state("lower"));
  v.set(x, g + 2, z, "iron_door", state("upper"));
  // lintel over the door, three bays wide, where the row is not a floor slab
  if (!isSlab(H, g + 3)) for (const d of [-1, 0, 1]) {
    const bx = e.dx ? x : x + d, bz = e.dx ? z + d : z;
    if (inFp(bx, bz)) v.set(bx, g + 3, bz, LINTEL);
  }
}

// warm light behind some glass: a hanging lantern from the floor slab above, one cell inside a window bay
const isAir = (x, z, y) => {
  if (!inFp(x, z)) return false;
  const { g, top: H } = col[x][z];
  return y >= g && y < H - 1 && !isSlab(H, y) && exposures(x, z, y).length === 0;
};
for (const [x, z] of cellsList) {
  const { g, top: H } = col[x][z];
  for (let y = g + 4; y < H - 1; y++) {
    if (isSlab(H, y) || (H - 1 - y) % 4 !== 1) continue;   // the lower glass row, under a slab
    const ex = exposures(x, z, y);
    if (!ex.length || isCorner(ex) || alongOf(ex, x, z) % 3 === 0) continue;
    if ((x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
    const [dx, dz] = ex[0];
    if (!isAir(x - dx, z - dz, y)) continue;
    v.set(x - dx, y, z - dz, "lantern", { hanging: "true" });
  }
}

// roof plant on terraces and the tower top: 3x2 boxes of plant on the storey grid, two blocks high
for (const [x, z] of cellsList) {
  const { top: H } = col[x][z];
  if (exposures(x, z, H).length) continue;
  if (x % 11 >= 4 && x % 11 <= 6 && z % 11 >= 4 && z % 11 <= 5) {
    v.set(x, H, z, ROOF);
    v.set(x, H + 1, z, ROOF);
  }
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_874500718.nbt");
