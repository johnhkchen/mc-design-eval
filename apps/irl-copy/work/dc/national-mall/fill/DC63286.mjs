// 1739 9th St NW (Religious, Shaw): a brick church on a stone plinth. Gothic-revival plan read from the lidar roofs:
// the tall nave block sits NW of centre (roof 8), lower aisles and a chapel wing run east and south. The west face of
// the nave is the street-facing front, with the door, a stone surround and a window per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63286.cells.json", "utf8"));
const W = 15, D = 13, H = 19;
const ground = Array.from({ length: D }, () => Array(W).fill(-1));   // [z][x], -1 = off the footprint
const lidar = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g, r] of cells) { ground[z][x] = g; lidar[z][x] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z][x] >= 0;

// the lidar roof, median-smoothed over each cell's footprint neighbourhood: clean tiers, no noise steps
const roof = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(lidar[z + dz][x + dx]);
  v.sort((a, b) => a - b); roof[z][x] = v[Math.floor(v.length / 2)];
}
const G = (x, z) => ground[z][x], R = (x, z) => roof[z][x];
const occ = (x, y, z) => inF(x, z) && y >= 0 && y < R(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                       // +x, -x, +z, -z
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !occ(x + dx, y, z + dz));

// the wall's role at a cell: "shell" cells touch air on one or more sides; the storey pitch is 3 blocks
// (belt course on the storey line, two rows of window below it), and piers are two-wide glass / one-wide stone
const faceU = ([dx]) => (dx ? "z" : "x");
const isWindow = (x, y, z, d) => {
  if (!occ(x, y, z) || y < G(x, z) || y >= R(x, z) - 1) return false;
  const e = exposed(x, y, z); if (e.length !== 1 || e[0][0] !== d[0] || e[0][1] !== d[1]) return false;
  const u = faceU(d) === "z" ? z : x, rel = y - G(x, z);
  return rel % 3 !== 0 && u % 3 !== 2;
};
// a pane joins its neighbours along the face (east/west on a z-facing wall, north/south on an x-facing one)
const pane = (x, y, z, d) => {
  const [a, b] = d[0] ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
  const on = (o) => (isWindow(x + o[0], y, z + o[1], d) ? "true" : "false");
  const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (d[0]) { s.north = on(b); s.south = on(a); } else { s.west = on(b); s.east = on(a); }
  return s;
};

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);
const BRICK = "bricks", STONE = "stone_bricks", TRIM = "cut_sandstone", ROOF = "deepslate_tiles", FLOOR = "smooth_stone";

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const g = G(x, z), r = R(x, z);
  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y < g; y++) put(x, y, z, STONE);
  for (let y = g; y < r; y++) {
    const rel = y - g, e = exposed(x, y, z), top = y === r - 1;
    if (top) { put(x, y, z, e.length ? STONE : ROOF); continue; }    // cornice (stone) at the edge, tiled roof on top
    if (e.length === 0) {                                             // interior: floor slab per storey, air between
      if (rel % 3 === 0) put(x, y, z, FLOOR);
      continue;
    }
    if (e.length >= 2) { put(x, y, z, TRIM); continue; }              // corner quoins
    const d = e[0], u = faceU(d) === "z" ? z : x;
    if (rel % 3 === 0) put(x, y, z, TRIM);                            // storey belt course
    else if (u % 3 === 2) put(x, y, z, STONE);                        // stone pier between windows
    else put(x, y, z, "glass_pane", pane(x, y, z, d));
  }
}

// the west front: the nave door (2 high) under a stone lintel, its jambs in stone
for (const z of [3, 4, 5]) {
  const g = G(2, z);
  if (!exposed(2, g, z).some(([dx]) => dx === -1)) continue;
  if (z !== 4) { put(2, g, z, TRIM); put(2, g + 1, z, STONE); put(2, g + 2, z, STONE); continue; }
  put(2, g, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(2, g + 1, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(2, g + 2, z, TRIM);
}

// the bell tower: a 2x2 belfry on the tallest block, glass louvres under a tiled cap and an end-rod finial
const BELFRY = [[3, 4], [4, 4], [3, 5], [4, 5]];
const inBelfry = (x, z) => BELFRY.some(([bx, bz]) => bx === x && bz === z);
for (const [x, z] of BELFRY) {
  for (let y = 8; y <= 10; y++) {
    if (y === 9) {
      const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
      if (inBelfry(x + 1, z)) s.east = "true"; if (inBelfry(x - 1, z)) s.west = "true";
      if (inBelfry(x, z + 1)) s.south = "true"; if (inBelfry(x, z - 1)) s.north = "true";
      put(x, y, z, "glass_pane", s);
    } else put(x, y, z, y === 8 ? STONE : TRIM);
  }
  put(x, 11, z, ROOF);
}
put(3, 12, 4, "end_rod", { facing: "up" });

// warm light behind some windows: a glowstone in the air gap inside the glass
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  for (let y = G(x, z); y < R(x, z) - 1; y++) {
    const rel = y - G(x, z); if (rel % 3 === 0) continue;
    for (const d of DIRS) {
      if (!isWindow(x, y, z, d) || (x * 7 + y * 5 + z * 3) % 4 !== 0) continue;
      const ix = x - d[0], iz = z - d[1];
      if (inF(ix, iz) && occ(ix, y, iz) && exposed(ix, y, iz).length === 0 && y % 3 !== 0 && vox.val(ix, y, iz) === 0) {
        put(ix, y, iz, (ix + iz + y) % 2 ? "glowstone" : "shroomlight");
      }
    }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63286.nbt";
console.log(vox.save(out));
