import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039818";
const W = 27, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground heights (clamped so the 2-storey body stays above foundation)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(8, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x);
  bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z);
}

// Exterior faces of a footprint cell
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Street front: south face (fallback north), entrance at the middle tile
const cx = Math.floor((bx0 + bx1) / 2);
let front = null;
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (x === cx && !has(x, z + 1)) {
    if (!front || z > front.z) front = { x, z, face: "south", gr };
  }
}
if (!front) {
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (x === cx && !has(x, z - 1)) {
      if (!front || z < front.z) front = { x, z, face: "north", gr };
    }
  }
}
if (!front) {
  const [k, gr] = [...ground.entries()][0];
  const [x, z] = k.split(",").map(Number);
  front = { x, z, face: faces(x, z)[0] ?? "south", gr };
}

function put(x, y, z, id, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const TERRA = "white_terracotta";
const QUARTZ = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const PANE = "light_blue_stained_glass_pane";
const TOP = 12; // parapet cap row

// Pass 1: foundations, walls, storey lines, cornice, parapet
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = faces(x, z);
  if (perim.length === 0) continue; // interior handled in pass 2

  const single = perim.length === 1 ? perim[0] : null;
  const alongX = single === "north" || single === "south";
  const t = alongX ? x - bx0 : z - bz0;
  const isWin = single !== null && t % 3 === 1;
  const isDoorCell = single !== null && single === front.face && x === front.x && z === front.z;

  for (let y = gr; y <= TOP; y++) {
    // Entrance: dark oak door with a lintel canopy above
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: front.face,
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorCell && y === gr + 3) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; } // base course
    if (y === 5 || y === 10) { put(x, y, z, QUARTZ); continue; } // storey line / cornice
    if (y === TOP) { put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === 11) { put(x, y, z, TERRA); continue; }

    if (y <= 4) {
      // Ground storey: shopfront glass in bays, terracotta piers and lintel
      if (isWin && y >= gr + 1 && y <= gr + 3) put(x, y, z, GLASS);
      else put(x, y, z, TERRA);
      continue;
    }

    // Second storey: punched windows in terracotta frame
    if (isWin && (y === 7 || y === 8)) {
      const props = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, PANE, props);
    } else {
      put(x, y, z, TERRA);
    }
  }
}

// Pass 2: interior floors, air gaps, warm lights, roof plant
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = faces(x, z);
  if (perim.length > 0) continue;

  for (const y of [gr, 5, 10]) {
    if (y >= gr && y <= 10) put(x, y, z, "smooth_stone");
  }
  if (gr <= 11) put(x, 11, z, "gray_concrete");

  // Roof plant: AC boxes spaced across the deck
  if (x % 6 === 2 && z % 5 === 2) {
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "light_gray_concrete");
  }
}

// Central roof mast
if (has(Math.floor((bx0 + bx1) / 2), Math.floor((bz0 + bz1) / 2))) {
  const mx = Math.floor((bx0 + bx1) / 2), mz = Math.floor((bz0 + bz1) / 2);
  for (let y = 12; y <= 16; y++) put(mx, y, mz, "iron_bars");
}

// Warm lights: glowstone behind some second-floor windows
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const perim = faces(x, z);
  if (perim.length !== 1) continue;
  const f = perim[0];
  const alongX = f === "north" || f === "south";
  const t = alongX ? x - bx0 : z - bz0;
  if (t % 3 !== 1 || t % 6 !== 1) continue;
  let ix = x, iz = z;
  if (f === "north") iz = z + 1;
  else if (f === "south") iz = z - 1;
  else if (f === "west") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || faces(ix, iz).length > 0) continue;
  if (7 >= gr) put(ix, 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
