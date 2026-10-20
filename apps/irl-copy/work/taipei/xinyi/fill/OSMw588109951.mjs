import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109951";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 46, H = 76, D = 35;
const TOP = 64;                 // roof level above lowest ground
const SETBACK = 10;             // top two storeys step back from the perimeter ring
const g = new Voxels([W, H, D]);

// ---- footprint and ground ----
const gmin = Math.min(...cells.map(c => c[2]));
const ground = new Map();
const key = (x, z) => x + "," + z;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr - gmin);
const has = (x, z) => ground.has(key(x, z));

// depth from outside edge (1 = perimeter cell)
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1)) {
    depth.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dep = (x, z) => depth.get(key(x, z)) ?? 1;

// entrance: north face (min z), cell nearest the mean x of that face
const zMin = Math.min(...cells.map(c => c[1]));
const faceXs = cells.filter(c => c[1] === zMin).map(c => c[0]);
const entranceX = faceXs.length
  ? faceXs.reduce((a, b) => Math.abs(a - faceXs.reduce((s, v) => s + v, 0) / faceXs.length) <=
      Math.abs(b - faceXs.reduce((s, v) => s + v, 0) / faceXs.length) ? a : b)
  : -1;

// tallest-depth cell hosts the mast
let mastCell = null, mastDepth = -1;
for (const [x, z] of cells) {
  if (dep(x, z) > mastDepth) { mastDepth = dep(x, z); mastCell = [x, z]; }
}

// ---- helpers ----
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const FOUND = "stone_bricks";
const WALL = "white_concrete";
const MULL = "light_gray_concrete";
const SLAB = "smooth_stone";
const GLASS = "light_blue_stained_glass";
const ROOF = "light_gray_concrete";
const CORNICE = "stone_bricks";

// ---- build each footprint cell ----
for (const [x, z] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  const gr = ground.get(key(x, z));
  const dd = dep(x, z);
  const topC = dd <= 2 ? TOP - SETBACK : TOP;

  // foundation up to local ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // storeys
  for (let y = gr; y < topC; y++) {
    const rel = y - gr;
    if (rel === 0) {
      put(x, y, z, dd === 1 ? FOUND : SLAB);            // base course / ground slab
    } else if (rel % 5 === 0) {
      put(x, y, z, SLAB);                               // floor slab / storey line
    } else if (dd === 1) {
      if (rel % 5 === 4) {
        put(x, y, z, WALL);                             // spandrel
      } else {
        const p = x + z;
        const isEntrance = z === zMin && x === entranceX && rel < 3;
        if (isEntrance) {
          if (rel === 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (rel === 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (p % 3 === 0) {
          put(x, y, z, MULL);                           // mullion
        } else {
          put(x, y, z, GLASS);                          // glazing
        }
      }
    } else {
      // interior: air gap behind glass, occasional warm light
      if (dd === 2 && rel % 5 === 2 && (x * 31 + z * 17) % 11 === 0) {
        put(x, y, z, "glowstone");
      }
    }
  }

  // roof / setback deck
  if (dd >= 3) {
    put(x, TOP - 1, z, dd === 3 ? CORNICE : ROOF);
  } else {
    put(x, TOP - SETBACK, z, ROOF);                     // terrace deck on the setback
    if (dd === 1) put(x, TOP - SETBACK + 1, z, CORNICE); // parapet on the deck
  }

  // rooftop penthouse on the inner core
  if (dd >= 6) {
    for (let y = TOP; y <= TOP + 2; y++) put(x, y, z, WALL);
    put(x, TOP + 3, z, CORNICE);
  }
}

// ---- mast on the deepest cell ----
if (mastCell) {
  const [mx, mz] = mastCell;
  const base = mastDepth >= 6 ? TOP + 4 : TOP;
  for (let y = base; y < base + 7 && y < H; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
