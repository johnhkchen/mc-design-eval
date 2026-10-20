import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof about 26 blocks above lowest ground.
// Read as a 1990s-2000s Xinyi-district office or mixed block: five storeys of
// 5 blocks, pale cream-white cladding, blue-tinted glazing set back in
// recesses behind light-grey pier columns, a granite base course, a quartz
// cornice and parapet, and a roof plant core set back from the edges.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw338598199";
const W = 54, H = 38, D = 46;
const ROOF = 26;      // roof deck level (absolute y)
const TOP_FLOOR = 25; // top floor slab (belt) level
const CORE_R = 5;     // roof plant core inset radius

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gMap = new Map();
for (const c of cells) {
  const [x, z, gg] = c;
  gMap.set(key(x, z), Math.min(TOP_FLOOR, Math.max(0, Math.round(gg))));
}

const inside = (x, z) => gMap.has(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

function edgeFacing(x, z) {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x + 1, z)) return "east";
  if (!inside(x - 1, z)) return "west";
  return null;
}

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Facing of each edge cell (outward normal)
const facing = new Map();
for (const [k] of gMap) {
  const [x, z] = k.split(",").map(Number);
  const f = edgeFacing(x, z);
  if (f) facing.set(k, f);
}

// Roof plant core: cells whose square neighbourhood (radius CORE_R) is all footprint
function isCore(x, z) {
  for (let dx = -CORE_R; dx <= CORE_R; dx++)
    for (let dz = -CORE_R; dz <= CORE_R; dz++)
      if (!inside(x + dx, z + dz)) return false;
  return true;
}
const coreSet = new Set();
for (const [k] of gMap) {
  const [x, z] = k.split(",").map(Number);
  if (isCore(x, z)) coreSet.add(k);
}

// Pass 1: foundation, floor belts, facade with recessed glazing, roof deck
for (const [k, gr] of gMap) {
  const [x, z] = k.split(",").map(Number);
  const f = facing.get(k) ?? null;
  const isEdge = f !== null;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP_FLOOR; y++) {
    const r = y % 5;
    const s = Math.floor(y / 5);

    if (r === 0) {
      put(x, y, z, "quartz_block"); // floor slab / belt course
      continue;
    }
    if (!isEdge) continue; // interior stays air behind the glazing

    if (y === gr) {
      put(x, y, z, "polished_granite"); // base course
      continue;
    }
    if (r === 4) {
      put(x, y, z, "white_concrete"); // spandrel
      continue;
    }

    // r = 1..3: window band
    const u = (f === "north" || f === "south") ? x : z;
    if (u % 3 === 0) {
      put(x, y, z, "light_gray_concrete"); // pier column, full projection
      continue;
    }

    const glazing = s === 0 ? "glass" : "light_blue_stained_glass";
    const [dx, dz] = DIRS[OPP[f]];
    const ix = x + dx, iz = z + dz;
    const inwardOk = inside(ix, iz) && !facing.has(key(ix, iz)) &&
                     gMap.get(key(ix, iz)) <= y;
    if (inwardOk) {
      // Recessed window: leave the edge cell open, glass one cell inside
      put(ix, y, iz, glazing);
    } else {
      put(x, y, z, glazing); // flush fallback where no room to recess
    }
  }

  // Warm light behind some recessed windows (two cells in from the facade)
  if (isEdge) {
    const [dx, dz] = DIRS[OPP[f]];
    const ix = x + dx, iz = z + dz;
    const jx = x + 2 * dx, jz = z + 2 * dz;
    const u = (f === "north" || f === "south") ? x : z;
    const s = 1; // applied per storey below
    for (let y = gr; y <= TOP_FLOOR; y++) {
      const r = y % 5;
      const st = Math.floor(y / 5);
      if (r !== 2 || y === gr) continue;
      if (u % 3 === 0) continue;
      if ((u + st) % 4 !== 1) continue;
      const recessed = inside(ix, iz) && !facing.has(key(ix, iz)) &&
                       gMap.get(key(ix, iz)) <= y;
      if (!recessed) continue;
      if (inside(jx, jz) && !facing.has(key(jx, jz)) && gMap.get(key(jx, jz)) <= y) {
        put(jx, y, jz, "shroomlight");
      }
    }
  }

  // Roof: cornice on the edge, deck inside
  put(x, ROOF, z, isEdge ? "quartz_block" : "light_gray_concrete");
  // Parapet on the edge
  if (isEdge) put(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: roof plant core, set back from the edges
for (const k of coreSet) {
  const [x, z] = k.split(",").map(Number);
  const ring = !coreSet.has(key(x + 1, z)) || !coreSet.has(key(x - 1, z)) ||
               !coreSet.has(key(x, z + 1)) || !coreSet.has(key(x, z - 1));
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    put(x, y, z, ring ? "white_concrete" : "light_gray_concrete");
  }
  put(x, ROOF + 4, z, "smooth_stone");
}

// Pass 3: mast on the core centre
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (coreSet.has(key(cx, cz))) {
  for (let y = ROOF + 5; y <= ROOF + 7; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Pass 4: entrance on the south-facing edge nearest the middle, else any edge
let entrance = null;
let best = Infinity;
for (const [k, f] of facing) {
  if (f !== "south") continue;
  const [x] = k.split(",").map(Number);
  const d = Math.abs(x - W / 2);
  if (d < best) { best = d; entrance = k; }
}
if (!entrance) {
  for (const [k] of facing) { entrance = k; break; }
}
if (entrance) {
  const [ex, ez] = entrance.split(",").map(Number);
  const gr = gMap.get(entrance);
  const f = facing.get(entrance);
  const hinge = "left";
  // Recessed entrance: open the edge cell, lintel above, door set into the recess
  if ((gr + 1) % 5 !== 0 && gr + 1 <= TOP_FLOOR) {
    const [dx, dz] = DIRS[OPP[f]];
    const ix = ex + dx, iz = ez + dz;
    if (inside(ix, iz) && !facing.has(key(ix, iz))) {
      put(ix, gr + 2, iz, "chiseled_stone_bricks"); // lintel above the recess
    }
    put(ex, gr, ez, "dark_oak_door", { facing: f, half: "lower", hinge, open: "false", powered: "false" });
    put(ex, gr + 1, ez, "dark_oak_door", { facing: f, half: "upper", hinge, open: "false", powered: "false" });
    if ((gr + 2) % 5 !== 0 && gr + 2 <= TOP_FLOOR) {
      put(ex, gr + 2, ez, "chiseled_stone_bricks"); // lintel over the door
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
