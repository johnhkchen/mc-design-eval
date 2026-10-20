import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365477";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground y
const FP = new Map();
for (const [x, z, gr] of cells) FP.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => FP.has(`${x},${z}`);
const ground = (x, z) => FP.get(`${x},${z}`);

const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) =>
  has(x, z) ? Object.keys(OUT).filter(f => !has(x + OUT[f][0], z + OUT[f][1])) : [];
const along = (f, x, z) => (f === "N" || f === "S" ? x : z);
const lastOf = f => (f === "N" || f === "S" ? W - 1 : D - 1);
// Window pattern: piers at 0, 3, 6 and the last index; windows elsewhere
const winIdx = (f, x, z) => {
  const i = along(f, x, z), L = lastOf(f);
  return i > 0 && i < L && i % 3 !== 0;
};
const isWindow = (x, z, f) => has(x, z) && faces(x, z).includes(f) && winIdx(f, x, z);
const isInterior = (x, z) => has(x, z) && faces(x, z).length === 0;

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const paneProps = (x, z, f) => {
  const s = b => (b ? "true" : "false");
  if (f === "N" || f === "S") {
    return {
      north: "false", south: "false",
      east: s(isWindow(x + 1, z, f)), west: s(isWindow(x - 1, z, f)),
      waterlogged: "false",
    };
  }
  return {
    north: s(isWindow(x, z - 1, f)), south: s(isWindow(x, z + 1, f)),
    east: "false", west: "false",
    waterlogged: "false",
  };
};
const pane = (x, y, z, f) => put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z, f));

// ---- Shell ----
for (const [key, gr] of FP) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  if (fs.length === 0) {
    // Interior: floor slabs per storey and roof deck
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    put(x, gr + 11, z, "gray_concrete");
    continue;
  }

  // Primary street face: north if exposed, else first exposed face
  const f = fs.includes("N") ? "N" : fs[0];
  const i = along(f, x, z);
  const win = winIdx(f, x, z);
  const shop = f === "N";
  const door = shop && i === 4;
  const [ox, oz] = OUT[f];
  const ix = x - ox, iz = z - oz; // inward cell

  // Base course
  put(x, gr + 1, z, "stone_bricks");

  // Storey 1
  if (door) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "smooth_stone");
  } else if (shop) {
    if (win) { pane(x, gr + 2, z, f); pane(x, gr + 3, z, f); }
    else { put(x, gr + 2, z, "white_concrete"); put(x, gr + 3, z, "white_concrete"); }
  } else {
    for (const y of [gr + 2, gr + 3, gr + 4]) {
      if (win) pane(x, y, z, f); else put(x, y, z, "white_concrete");
    }
  }

  // Shopfront sign band / lintel row
  if (shop && i >= 1 && i <= W - 2) put(x, gr + 4, z, "red_terracotta");
  else if (!shop && win) { /* already glazed above */ }
  else if (!shop) put(x, gr + 4, z, "white_concrete");
  else put(x, gr + 4, z, "white_concrete");

  // Storey line
  put(x, gr + 5, z, "smooth_stone");

  // Storey 2
  put(x, gr + 6, z, "white_concrete");
  for (const y of [gr + 7, gr + 8, gr + 9]) {
    if (win) pane(x, y, z, f); else put(x, y, z, "white_concrete");
  }

  // Cornice, parapet and cap
  put(x, gr + 10, z, "smooth_stone");
  put(x, gr + 11, z, "white_concrete");
  put(x, gr + 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind some glazing (inside air gap)
  if (has(ix, iz) && isInterior(ix, iz)) {
    if (win && ((i + gr) % 4 === 0)) put(ix, gr + 8, iz, "glowstone");
    if (shop && (i === 2 || i === 6)) put(ix, gr + 2, iz, "glowstone");
  }
}

// ---- Roof equipment on interior cells (standing on roof deck) ----
for (const [key, gr] of FP) {
  const [x, z] = key.split(",").map(Number);
  if (!isInterior(x, z)) continue;
  // Mechanical penthouse
  if (x >= 2 && x <= 3 && z >= 5 && z <= 7) {
    put(x, gr + 12, z, "light_gray_concrete");
    put(x, gr + 13, z, "light_gray_concrete");
    put(x, gr + 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // Water tank
  if (x >= 5 && x <= 6 && z >= 10 && z <= 11) {
    put(x, gr + 12, z, "iron_block");
    put(x, gr + 13, z, "iron_block");
  }
  // Lightning rod
  if (x === 4 && z === 3) {
    put(x, gr + 12, z, "lightning_rod", { facing: "up", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
