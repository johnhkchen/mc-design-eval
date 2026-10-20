import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542014192";

// Record: 10 x 19 footprint, roof about 11 blocks above lowest ground.
// Reading: a 1990s-2000s Xinyi shophouse-style commercial block, two storeys,
// shopfront at ground, red fascia, glass and white-concrete facade, stone cornice,
// flat roof with plant boxes.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 10, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  const gc = Math.min(14, Math.max(0, Math.round(gr)));
  G.set(key(x, z), gc);
}
const has = (x, z) => G.has(key(x, z));
const gnd = (x, z) => G.get(key(x, z));

// Outward/inward directions: N, S, W, E
const DIRS = [
  { name: "N", dx: 0, dz: -1, along: "x" },
  { name: "S", dx: 0, dz: 1, along: "x" },
  { name: "W", dx: -1, dz: 0, along: "z" },
  { name: "E", dx: 1, dz: 0, along: "z" },
];

const isPerim = (x, z) => DIRS.some(d => !has(x + d.dx, z + d.dz));

// Facade block for an outer cell face at height y.
function faceBlock(d, x, z, y, gc, top) {
  const along = d.along === "x" ? x : z;
  const k = y - gc;
  if (y === top - 1) return ["white_concrete"];                       // parapet
  if (y === top - 2) return ["smooth_stone_slab", { type: "top", waterlogged: "false" }]; // cornice
  if (y === gc) return ["polished_andesite"];                          // base course
  if (k >= 1 && k <= 3) {                                              // shopfront
    if (along % 3 === 0) return ["white_concrete"];                    // piers
    return ["glass"];
  }
  if (k === 4) return ["red_terracotta"];                              // shop fascia
  if (k === 5) return ["light_gray_concrete"];                         // storey spandrel
  // upper storey windows with white-concrete mullions
  if (along % 2 === 0) return ["glass"];
  return ["white_concrete"];
}

// Pass 1: foundations, floors, roof deck, facades.
const perim = new Map();
for (const [kk] of G) {
  const [x, z] = kk.split(",").map(Number);
  perim.set(kk, isPerim(x, z));
}

for (const [kk, gc] of G) {
  const [x, z] = kk.split(",").map(Number);
  const top = Math.max(11, gc + 7);
  const p = perim.get(kk);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  if (!p) {
    // Interior cell: air gap with floor slabs only.
    g.set(x, gc, z, "smooth_stone");
    if (gc + 5 < top - 1) g.set(x, gc + 5, z, "smooth_stone");
    g.set(x, top - 1, z, "light_gray_concrete"); // roof deck
  } else {
    // Perimeter cell: the cell itself is the facade column.
    const face = DIRS.find(d => !has(x + d.dx, z + d.dz));
    for (let y = gc; y < top; y++) {
      if (y >= top) break;
      const [id, props] = faceBlock(face, x, z, y, gc, top);
      g.set(x, y, z, id, props);
    }
  }
}

// Pass 2: warm light behind some upper windows, in the interior cell just inside.
for (const [kk, gc] of G) {
  const [x, z] = kk.split(",").map(Number);
  if (!perim.get(kk)) continue;
  const top = Math.max(11, gc + 7);
  for (const d of DIRS) {
    if (has(x + d.dx, z + d.dz) === false) {
      const ix = x - d.dx, iz = z - d.dz;
      if (!has(ix, iz) || perim.get(key(ix, iz))) continue;
      for (let y = gc + 6; y <= top - 3; y++) {
        const k = y - gc;
        if (k < 6 || k > 8) continue;
        if ((x * 3 + z * 5 + k) % 7 === 0) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Pass 3: rooftop plant boxes on interior roof cells.
for (const [kk, gc] of G) {
  const [x, z] = kk.split(",").map(Number);
  if (perim.get(kk)) continue;
  const top = Math.max(11, gc + 7);
  if ((x + 2 * z) % 7 === 3 && top + 1 < H) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
