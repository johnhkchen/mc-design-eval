import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169558";
const W = 57, H = 41, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Six storeys of 5 blocks, flat roof at y=28 (parapet to 30), rooftop plant and mast above.
const B = [0, 5, 10, 15, 20, 25];
const E = [5, 10, 15, 20, 25, 29];
const ROOF = 28;
const storeyOf = (y) => {
  for (let k = 0; k < B.length; k++) if (y >= B[k] && y < E[k]) return k;
  return -1;
};

const outward = (x, z) => {
  if (!has(x, z - 1)) return { dx: 0, dz: -1, facing: "north" };
  if (!has(x, z + 1)) return { dx: 0, dz: 1, facing: "south" };
  if (!has(x - 1, z)) return { dx: -1, dz: 0, facing: "west" };
  return { dx: 1, dz: 0, facing: "east" };
};

// Entrance: on the long north face, nearest the middle of the facade.
let door = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isEdge(x, z)) continue;
  if (outward(x, z).facing !== "north") continue;
  if (!door || Math.abs(x - W / 2) < Math.abs(door[0] - W / 2)) door = [x, z];
}
if (!door) {
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (isEdge(x, z)) { door = [x, z]; break; }
  }
}

const glowCells = [];

// Main volume
for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: storey slabs and roof slab, air gaps between.
    for (let k = 1; k < B.length; k++) {
      if (B[k] >= gc && B[k] <= ROOF) put(x, B[k], z, "light_gray_concrete");
    }
    if (ROOF >= gc) put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Perimeter facade.
  const pier = (x + z) % 3 === 0;
  put(x, gc, z, "polished_granite");
  for (let y = gc + 1; y < ROOF; y++) {
    const k = storeyOf(y);
    const local = y - B[k];
    if (k === 0) {
      if (local === 4) put(x, y, z, "smooth_quartz");
      else if (pier) put(x, y, z, "stone_bricks");
      else put(x, y, z, "light_blue_stained_glass");
    } else if (local === 0 || local === 4) {
      put(x, y, z, "white_concrete");
    } else if (pier) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
      if (local === 2) glowCells.push([x, y, z, k]);
    }
  }
  put(x, ROOF, z, "smooth_quartz");        // cornice
  put(x, 29, z, "white_concrete");         // parapet
  put(x, 30, z, "smooth_quartz");          // parapet cap
}

// Warm light behind some ground-to-upper windows (inward interior cell).
for (const [x, y, z, k] of glowCells) {
  if ((x * 7 + z * 5 + k) % 4 !== 0) continue;
  let ix = x, iz = z;
  if (z === 0) iz = 1; else if (z === D - 1) iz = D - 2;
  else if (x === 0) ix = 1; else if (x === W - 1) ix = W - 2;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  if (gnd(ix, iz) > y) continue;
  put(ix, y, iz, "glowstone");
}

// Entrance doors and canopy.
if (door) {
  const [dx0, dz0] = door;
  const out = outward(dx0, dz0);
  const gd = gnd(dx0, dz0);
  const lo = { facing: out.facing, half: "lower", hinge: "left", open: "false", powered: "false" };
  const up = { facing: out.facing, half: "upper", hinge: "left", open: "false", powered: "false" };
  put(dx0, gd + 1, dz0, "oak_door", lo);
  put(dx0, gd + 2, dz0, "oak_door", up);
  for (let x = dx0 - 2; x <= dx0 + 2; x++) {
    if (!has(x, dz0) || !isEdge(x, dz0)) continue;
    const y = B[1] - 1;
    if (y >= gnd(x, dz0)) put(x, y, dz0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Rooftop plant room and mast.
for (let x = 20; x <= 36; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    for (let y = 29; y <= 31; y++) put(x, y, z, "light_gray_concrete");
    put(x, 32, z, "smooth_quartz");
  }
}
if (has(28, 8)) {
  for (let y = 33; y <= 38; y++) put(28, y, 8, "iron_bars");
  put(28, 39, 8, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
