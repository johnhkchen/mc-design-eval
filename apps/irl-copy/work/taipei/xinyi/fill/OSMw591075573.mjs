import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075573";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 14 x 7 footprint, roof about 25 blocks above lowest ground, five storeys.
const W = 14, H = 37, D = 7;
const ROOF = 25;
const STOREYS = 5;

const g = new Voxels([W, H, D]);

// Footprint: key "x,z" -> ground height (already relative to y 0).
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 15, Math.round(gr))));

const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey line k for a cell with ground gr. Storeys are evenly divided up to the common roof.
const S = (gr, k) => (k === 0 ? gr : k >= STOREYS ? ROOF : Math.round(gr + (k * (ROOF - gr)) / STOREYS));

const storeyOf = (gr, y) => {
  for (let k = 0; k < STOREYS; k++) if (y < S(gr, k + 1)) return k;
  return STOREYS - 1;
};

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: slabs at each storey line only, no rooms.
    for (let k = 0; k <= STOREYS; k++) {
      put(x, S(gr, k), z, k === 0 ? "stone_bricks" : "light_gray_concrete");
    }
    continue;
  }

  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const zFace = !nS || !nN;
  const xFace = !nE || !nW;
  const corner = zFace && xFace;
  const southFace = !nS;

  // Inward direction, used to place warm lights behind windows.
  let ix = 0, iz = 0;
  if (!nS) iz = -1;
  else if (!nN) iz = 1;
  else if (!nE) ix = -1;
  else if (!nW) ix = 1;
  const inwardOk = !corner && has(x + ix, z + iz) && !isPerim(x + ix, z + iz);

  // Window or pier test for this facade cell.
  let windowCell = false;
  if (!corner) {
    if (zFace) windowCell = x % 2 === 1 && x > 0 && x < W - 1;
    else if (xFace) windowCell = z % 2 === 1;
  }

  // Body from ground up to the top of the parapet.
  for (let y = gr; y <= ROOF + 1; y++) {
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }
    if (y === ROOF + 1) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }

    const k = storeyOf(gr, y);
    const base = S(gr, k);
    const top = S(gr, k + 1);
    const h = top - base;
    const rel = y - base;

    if (rel === 0) {
      put(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (rel === h - 1 || corner || !windowCell) {
      put(x, y, z, rel === h - 1 ? "light_gray_concrete" : "white_concrete");
      continue;
    }

    // Window zone on a window bay.
    if (k === 0 && southFace && (x === 6 || x === 7)) {
      if (rel === 1) { put(x, y, z, "dark_oak_door", DOOR("lower")); continue; }
      if (rel === 2) { put(x, y, z, "dark_oak_door", DOOR("upper")); continue; }
    }
    put(x, y, z, "glass");

    // Warm light behind some glass, on a storey-mid row.
    if (inwardOk && rel === 2 && (x + z + k) % 3 === 0) {
      put(x + ix, y, z + iz, "glowstone");
    }
  }
}

// Shopfront canopy-style accent: a dark band above the ground-floor door on the south face.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if ((x === 5 || x === 8) && z === D - 1 && has(x, z)) {
    const h = S(gr, 1) - S(gr, 0);
    if (h >= 4) put(x, S(gr, 0) + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

// Rooftop penthouse on the roof slab, centred on the plan.
for (let x = 4; x <= 9; x++) {
  for (let z = 2; z <= 4; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
if (has(6, 3) && !isPerim(6, 3)) put(6, ROOF + 3, 3, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
