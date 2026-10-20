// Two-storey 1980s-style commercial block in Xinyi: plinth, shopfront ground floor
// with glass and piers, a lighter upper storey with window bands and spandrels,
// a cornice-and-parapet roof, a rooftop plant room, and a central entrance.
// Roof sits 11 blocks above the lowest ground (~2 storeys of 5 blocks, plus parapet).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752110";
const W = 21, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
// [facing name, dx, dz] for the side that faces outside the footprint
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => outward(x, z).length > 0;

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const keys = [...ground.keys()].map(k => k.split(",").map(Number));
const minG = Math.min(...ground.values());
const S1 = minG + 5;             // first floor line (ground storey is 5 blocks)
const R = Math.min(minG + 11, 19); // roof slab top; parapet above it

// ---- Pass 1: foundation, floor slabs, roof slab ----
for (const [x, z] of keys) {
  const gg = gAt(x, z);
  for (let y = 0; y < gg; y++) set(x, y, z, "stone_bricks");        // foundation
  if (S1 >= gg) set(x, S1, z, "light_gray_concrete");              // floor slab / storey line
  if (R >= gg) set(x, R, z, "smooth_stone");                       // roof slab
}

// ---- Pass 2: facades on edge cells ----
for (const [x, z] of keys) {
  if (!isEdge(x, z)) continue;
  const gg = gAt(x, z);
  const [, ox, oz] = outward(x, z)[0];
  const inX = x - ox, inZ = z - oz;
  const interiorBehind = has(inX, inZ) && !isEdge(inX, inZ);

  for (let y = gg; y < R; y++) {
    if (y === S1) continue; // slab already placed
    if (y < S1) {
      // Ground storey: shopfront
      if (y === gg) set(x, y, z, "stone_bricks");                  // base course
      else if (y === S1 - 1) set(x, y, z, "smooth_quartz");         // fascia
      else if ((x + z) % 3 === 0) set(x, y, z, "light_gray_concrete"); // piers
      else {
        set(x, y, z, "light_blue_stained_glass");
        if (interiorBehind && (x * 2 + z + y) % 5 === 0) set(inX, y, inZ, "glowstone");
      }
    } else {
      // Upper storey: spandrels top and bottom, window rows between piers
      if (y === S1 + 1 || y === R - 1) {
        set(x, y, z, "smooth_quartz");
      } else if ((x + z) % 3 === 0) {
        set(x, y, z, "light_gray_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass");
        if (interiorBehind && (x * 5 + z * 3 + y) % 7 === 0) set(inX, y, inZ, "shroomlight");
      }
    }
  }

  // Parapet and cornice cap on the roof edge
  if (R >= gg && R + 2 < H) {
    set(x, R + 1, z, "white_concrete");
    set(x, R + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- Pass 3: rooftop plant room and AC units ----
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let x = cx - 3; x <= cx - 1; x++) {
  for (let z = cz - 2; z <= cz; z++) {
    if (!has(x, z) || isEdge(x, z) || gAt(x, z) > R) continue;
    set(x, R + 1, z, "light_gray_concrete");
    set(x, R + 2, z, "light_gray_concrete");
  }
}
for (const [x, z] of [[cx + 2, cz - 1], [cx + 3, cz + 1]]) {
  if (has(x, z) && !isEdge(x, z) && gAt(x, z) <= R) set(x, R + 1, z, "iron_block");
}

// ---- Pass 4: entrance on the north-facing edge, near the middle ----
const northCells = keys.filter(([x, z]) => isEdge(x, z) && outward(x, z).some(d => d[0] === "north"));
const pool = northCells.length ? northCells : keys.filter(([x, z]) => isEdge(x, z));
const meanX = pool.reduce((s, [x]) => s + x, 0) / pool.length;
pool.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
if (pool.length) {
  const [ex, ez] = pool[0];
  const eg = gAt(ex, ez);
  const [face] = outward(ex, ez)[0];
  if (eg + 1 < S1) {
    set(ex, eg, ez, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    set(ex, eg + 1, ez, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Lantern-lit canopy band above the door
  set(ex, S1 - 1, ez, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
