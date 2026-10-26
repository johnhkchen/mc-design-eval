import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86602.cells.json`, "utf8"));

const W = 10, D = 10, H = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
const has = (x, z) => map.has(key(x, z));
const y0 = Math.min(...cells.map((c) => Math.round(c[2])));

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const band = (y) => y >= y0 + 5 && (y - y0 - 5) % 4 === 0;
const roofOf = (x, z) => {
  const c = map.get(key(x, z));
  return Math.min(Math.max(c.gr + 8, c.rf), H - 4);
};

// Pass 1: foundations, walls, floors, roof deck and cornice
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const roof = roofOf(x, z);
  const edge = isEdge(x, z);
  const u = (z === 0 || z === D - 1) ? x : z;

  // foundation, solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < roof; y++) {
    // roof deck / cornice on top course
    if (y === roof - 1) {
      g.set(x, y, z, edge ? "calcite" : "smooth_stone");
      continue;
    }
    // storey floor lines and spandrel bands
    if (band(y)) {
      g.set(x, y, z, edge ? "white_concrete" : "smooth_stone");
      continue;
    }
    if (!edge) continue; // interior: air gap, no interiors

    if (y === gr) { g.set(x, y, z, "calcite"); continue; } // base course

    if (y < y0 + 5) {
      // ground-floor shopfront: glass bays between stone piers
      g.set(x, y, z, u % 3 === 0 ? "stone_bricks" : "light_blue_stained_glass");
      continue;
    }

    // upper storeys: window grid of panes in brick piers
    g.set(x, y, z, u % 2 === 1 ? "light_blue_stained_glass_pane" : "bricks");
  }
}

// Pass 2: entrance on south face (z = 0), warm lights behind some windows
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const edge = isEdge(x, z);
  if (!edge) continue;

  // entrance: stone pilasters flank the door, calcite lintel above it
  if (z === 0 && (x === 3 || x === 6) && gr + 2 < y0 + 5) {
    g.set(x, gr + 1, z, "stone_bricks");
    g.set(x, gr + 2, z, "stone_bricks");
  }
  if (z === 0 && (x === 4 || x === 5) && gr + 3 < y0 + 5) {
    g.set(x, gr + 3, z, "calcite");
  }
  if (z === 0 && x === 4 && gr + 2 < y0 + 5) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }

  // glowstone behind selected upper windows (not corners)
  const xEdge = x === 0 || x === W - 1;
  const zEdge = z === 0 || z === D - 1;
  if (xEdge && zEdge) continue;
  let ix = x, iz = z;
  if (zEdge) iz = z === 0 ? 1 : D - 2;
  if (xEdge) ix = x === 0 ? 1 : W - 2;
  const u = zEdge ? x : z;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;

  const roof = roofOf(x, z);
  for (let y = y0 + 5; y < roof - 1; y++) {
    if (band(y) || y < gr + 1) continue;
    if (u % 2 === 1 && (u + y) % 6 === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// Pass 3: roof plant penthouse (3..6 square), solid so nothing hangs over air
for (let x = 3; x <= 6; x++) {
  for (let z = 3; z <= 6; z++) {
    if (!has(x, z)) continue;
    const roof = roofOf(x, z);
    const ring = x === 3 || x === 6 || z === 3 || z === 6;
    for (let y = roof; y <= roof + 1; y++) {
      g.set(x, y, z, ring ? "white_concrete" : "smooth_stone");
    }
    g.set(x, roof + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86602.nbt`);
