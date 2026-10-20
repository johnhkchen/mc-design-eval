import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540298920";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 7 x 25, height 23 (roof ~11 above lowest ground, room for plant on top).
const W = 7, H = 23, D = 25;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Per-cell facade info: exposed sides, inward offset, along-facade index.
function facade(x, z) {
  const exW = !has(x - 1, z), exE = !has(x + 1, z);
  const exN = !has(x, z - 1), exS = !has(x, z + 1);
  const exX = exW || exE, exZ = exN || exS;
  const perim = exX || exZ;
  let along = 0;
  if (exX && !exZ) along = z;
  else if (exZ && !exX) along = x;
  else along = x + z;
  // inward offset (toward building interior), only for single-direction faces
  let ix = 0, iz = 0;
  if (exW && !exE) ix = 1;
  if (exE && !exW) ix = -1;
  if (exN && !exS) iz = 1;
  if (exS && !exN) iz = -1;
  return { perim, along, ix, iz, exN, exS, exW, exE };
}

// Pass 1: structure, storey by storey.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const f = facade(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab / plinth at ground level.
  put(x, gr, z, "stone_bricks");

  if (f.perim) {
    const pillar = f.along % 3 === 0;
    // Ground floor shopfront: glass with white pillars.
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, pillar ? "light_gray_concrete" : "glass");
    }
    // Lintel over shopfront.
    put(x, gr + 4, z, "white_concrete");
  } else {
    // Interior: air above plinth; ground storey left open.
  }

  // Storey line / floor slab at g+5.
  put(x, gr + 5, z, f.perim ? "light_gray_concrete" : "smooth_stone");

  if (f.perim) {
    const pillar = f.along % 3 === 0;
    // Upper storey windows g+6..g+8, spandrel at g+9.
    for (let y = gr + 6; y <= gr + 8; y++) {
      put(x, y, z, pillar ? "white_concrete" : "glass");
    }
    put(x, gr + 9, z, "white_concrete");
    // Cornice course.
    put(x, gr + 10, z, "smooth_stone");
    // Parapet coping.
    put(x, gr + 11, z, "smooth_stone");
  } else {
    // Roof slab over interior.
    put(x, gr + 11, z, "gray_concrete");
  }
}

// Pass 2: entrance, warm lights behind glass, roof plant (after all columns exist).
let zmin = Infinity;
for (const key of G.keys()) zmin = Math.min(zmin, Number(key.split(",")[1]));
let entrance = null;
for (const key of G.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (z !== zmin) continue;
  if (!entrance || Math.abs(x - 3) < Math.abs(entrance.x - 3)) entrance = { x, z };
}
if (entrance) {
  const gr = G.get(`${entrance.x},${entrance.z}`);
  put(entrance.x, gr + 1, entrance.z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(entrance.x, gr + 2, entrance.z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Glass transom over the door.
  put(entrance.x, gr + 3, entrance.z, "glass");
}

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const f = facade(x, z);
  if (!f.perim) continue;
  if (f.ix === 0 && f.iz === 0) continue; // corners: no single inward direction
  if (f.along % 6 !== 2) continue;
  const lx = x + f.ix, lz = z + f.iz;
  if (!has(lx, lz)) continue;
  // Lantern standing on the floor slab, lit behind the window.
  if (entrance && lx === entrance.x && lz === entrance.z) continue;
  put(lx, gr + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
  put(lx, gr + 6, lz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: AC boxes and a lightning rod on the interior roof.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const f = facade(x, z);
  if (f.perim) continue;
  if ((x + z) % 9 === 4 && gr + 13 < H) {
    put(x, gr + 12, z, "light_gray_concrete");
    put(x, gr + 13, z, "smooth_stone");
  }
}
// Central mast on the highest interior cell near the middle.
let mastCell = null;
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (facade(x, z).perim) continue;
  const d = Math.abs(x - 3) + Math.abs(z - D / 2);
  if (!mastCell || d < mastCell.d) mastCell = { x, z, gr, d };
}
if (mastCell && mastCell.gr + 14 < H) {
  for (let y = mastCell.gr + 12; y <= mastCell.gr + 13; y++) {
    put(mastCell.x, y, mastCell.z, "iron_bars");
  }
  put(mastCell.x, mastCell.gr + 14, mastCell.z, "lightning_rod", {
    facing: "up", powered: "false", waterlogged: "false",
  });
}

g.save(`${dir}/${id}.nbt`);
