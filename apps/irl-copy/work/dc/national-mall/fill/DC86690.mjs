// 1550 M St NW: a 1970s-80s precast-concrete office block. Granite-look plinth, pale precast piers and spandrels,
// tinted glass in the window rows, a stepped penthouse on the 20-block tower, and a double-door entrance on the east face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86690.cells.json", "utf8"));

const W = 6, D = 16, H = 32;
const G = new Map(), R = new Map();                       // "x,z" -> ground top, roof height (both from lidar, y 0 = lowest ground)
for (const [x, z, ground, roof] of cells) { G.set(`${x},${z}`, ground); R.set(`${x},${z}`, roof); }
const inFp = (x, z) => R.has(`${x},${z}`);
const g = (x, z) => G.get(`${x},${z}`), r = (x, z) => R.get(`${x},${z}`);

const M = {
  found: "stone_bricks", plinth: "polished_andesite", pier: "white_concrete", spandrel: "light_gray_concrete",
  glass: "gray_stained_glass", cornice: "smooth_stone", roofDeck: "gray_concrete", slab: "smooth_stone", glow: "glowstone",
};

// a cell's face is exposed if a side neighbour is outside the footprint or stands lower than this height
const exposedDirs = (x, y, z) => {
  const out = [];
  if (!inFp(x - 1, z) || y >= r(x - 1, z)) out.push("x");
  if (!inFp(x + 1, z) || y >= r(x + 1, z)) out.push("x");
  if (!inFp(x, z - 1) || y >= r(x, z - 1)) out.push("z");
  if (!inFp(x, z + 1) || y >= r(x, z + 1)) out.push("z");
  return out;
};

// piers every 3 blocks on the long faces (z), and at the ends/middle of the short faces (x); corners are piers
const isPier = (x, z, dirs) => dirs.includes("x") ? z % 3 === 0 : (x === 0 || x === 3 || x === 5);

const vox = new Voxels([W, H, D]);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  const gr = g(x, z), top = r(x, z);
  for (let y = 0; y < top; y++) {
    // foundation: fill from y 0 up to this cell's ground
    if (y < gr) { vox.set(x, y, z, M.found); continue; }
    const dirs = exposedDirs(x, y, z);
    if (dirs.length === 0) {                               // interior: floor slabs, roof deck, air gap otherwise
      if (y === gr || (y >= 3 && y % 2 === 1 && y < top - 1)) vox.set(x, y, z, M.slab);
      else if (y === top - 1) vox.set(x, y, z, M.roofDeck);
      continue;
    }
    // entrance: double doors on the east face at ground level, lanterns hung just inside
    if (x === W - 1 && (z === 7 || z === 8) && gr === 1 && (y === 1 || y === 2)) {
      const half = y === 1 ? "lower" : "upper";
      vox.set(x, y, z, "iron_door", { facing: "east", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === W - 2 && (z === 7 || z === 8) && y === 2 && gr === 1) {
      vox.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    const pier = isPier(x, z, dirs);
    let m;
    if (y === top - 1) m = M.cornice;                      // cornice / parapet course on the roof line
    else if (y === gr) m = M.plinth;                       // base course
    else if (y < 3) m = pier ? M.pier : M.glass;           // ground storey: shopfront glazing
    else if (y % 2 === 1) m = pier ? M.pier : M.spandrel;  // storey lines: precast spandrel panels
    else if (pier) m = M.pier;                             // window rows: glass between piers
    else m = (x * 7 + y * 5 + z * 3) % 29 === 0 && y >= 6 ? M.glow : M.glass;   // a few lit offices
    vox.set(x, y, z, m);
  }
}

// rooftop mechanical box on the main roof
for (const x of [1, 2]) for (const z of [13, 14]) vox.set(x, 18, z, "light_gray_concrete");

const out = vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86690.nbt");
console.log(out);
