import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 旭園: a 1970s-80s Taipei residential-commercial block. Six storeys of
// white tiled concrete, dark mullions, glass in pale aluminium-look frames,
// a stone plinth, a shop-front ground storey with a lintel entrance, and a
// small roof penthouse with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147850019";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, H = 43, D = 47;
const ROOF = 31;               // roof slab top, from lidar
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

const used = new Set();
const put = (x, y, z, block, props) => {
  if (!inB(x, y, z)) return;
  used.add(`${x},${y},${z}`);
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Outward face of an edge cell (first missing neighbour), or null for interior.
function faceOf(x, z) {
  for (const name of ["north", "south", "west", "east"]) {
    const [dx, dz] = DIRS[name];
    if (!has(x + dx, z + dz)) return name;
  }
  return null;
}

// Window test: edge cell, not a mullion column, inside storey band 1..3 of each 5-block storey.
function windowAt(x, z, y) {
  if (!has(x, z)) return false;
  const f = faceOf(x, z);
  if (!f) return false;
  const s = (f === "east" || f === "west") ? z : x;
  if (s % 3 === 0) return false;
  if (y <= gnd(x, z) || y >= ROOF) return false;
  const yy = y % 5;
  return yy >= 1 && yy <= 3;
}

// Glass pane connections along the wall plane only.
function paneProps(x, y, z, f) {
  const conn = (nx, nz) => has(nx, nz) && faceOf(nx, nz) === f && windowAt(nx, nz, y);
  if (f === "east" || f === "west") {
    return { north: String(conn(x, z - 1)), south: String(conn(x, z + 1)), east: "false", west: "false", waterlogged: "false" };
  }
  return { north: "false", south: "false", east: String(conn(x + 1, z)), west: String(conn(x - 1, z)), waterlogged: "false" };
}

// 1. Foundation, plinth, floors, walls, windows, roof.
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  const s = f === "east" || f === "west" ? z : x;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone");          // foundation to ground
  put(x, gr, z, f ? "stone_bricks" : "smooth_stone");          // base course / ground floor

  for (let y = gr + 1; y <= ROOF; y++) {
    const yy = y % 5;
    if (y === ROOF) { put(x, y, z, f ? "smooth_quartz" : "light_gray_concrete"); continue; }
    if (yy === 0) { put(x, y, z, f ? "smooth_quartz" : "light_gray_concrete"); continue; } // floor slab line
    if (!f) continue;                                                                       // interior air
    if (yy === 4) { put(x, y, z, "smooth_quartz"); continue; }                              // storey band
    if (windowAt(x, z, y)) put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, y, z, f));
    else if (s % 3 === 0) put(x, y, z, "gray_concrete");                                    // mullion
    else put(x, y, z, "white_concrete");                                                    // tiled wall
  }

  // Parapet and cornice on the roof edge.
  if (f) {
    put(x, ROOF + 1, z, "smooth_quartz");
    put(x, ROOF + 2, z, "smooth_quartz");
  }
}

// 2. Warm light behind some upper-storey windows (glowstone on the inner air cell).
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  if (!f) continue;
  const [dx, dz] = DIRS[f];
  for (let y = 6; y < ROOF; y++) {
    if (y % 5 !== 2 || !windowAt(x, z, y)) continue;
    if (((x * 7 + z * 3 + y) % 6) !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    if (used.has(`${ix},${y},${iz}`)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// 3. Roof penthouse with boundary walls, glass band and a cap.
for (let x = 12; x <= 20; x++) {
  for (let z = 18; z <= 28; z++) {
    if (!has(x, z)) continue;
    const boundary = x === 12 || x === 20 || z === 18 || z === 28;
    if (boundary) {
      put(x, 32, z, "smooth_quartz");
      for (const y of [33, 34]) {
        put(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "glass");
      }
    }
    put(x, 35, z, boundary ? "smooth_quartz" : "light_gray_concrete");
  }
}
// Mast on the penthouse.
if (has(16, 23)) {
  for (let y = 36; y <= 39; y++) put(16, y, 23, "lightning_rod");
}

// 4. Entrance: prefer the north face, nearest the middle; door plus solid lintel.
let best = null;
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  if (!f) continue;
  const pri = f === "north" ? 0 : f === "south" ? 1 : 2;
  const score = pri * 100 + Math.abs(x - 16) + gr * 10;
  if (!best || score < best.score) best = { x, z, gr, f, score };
}
if (best) {
  const { x: fx, z: fz, gr, f } = best;
  const base = { facing: f, hinge: "left", open: "false", powered: "false" };
  put(fx, gr + 1, fz, "oak_door", { ...base, half: "lower" });
  put(fx, gr + 2, fz, "oak_door", { ...base, half: "upper" });
  const along = (f === "north" || f === "south")
    ? [[fx - 1, fz], [fx, fz], [fx + 1, fz]]
    : [[fx, fz - 1], [fx, fz], [fx, fz + 1]];
  for (const [ax, az] of along) {
    if (has(ax, az)) put(ax, gr + 3, az, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
