import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755105";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const foot = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  foot.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const inF = (x, z) => foot.has(`${x},${z}`);
const isEdge = (x, z) => !(inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1));

// Storey levels (two storeys of 5 blocks, roof about 11 above lowest ground)
const S1 = minG + 5;   // first-floor line
const S2 = minG + 10;  // roof slab / cornice line
const T = minG + 11;   // parapet cap

function setS(x, y, z, id, st) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

// Outward face of an edge cell, or null for interior cells
function edgeFace(x, z) {
  if (!inF(x, z - 1)) return "north";
  if (!inF(x, z + 1)) return "south";
  if (!inF(x - 1, z)) return "west";
  if (!inF(x + 1, z)) return "east";
  return null;
}

// Along-facade coordinate
const posOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

function wallBlock(face, pos, y) {
  if (y === minG) return ["stone_bricks"];                       // base course
  if (y === S1) return ["light_gray_concrete"];                   // storey line
  if (y === S2) return ["smooth_stone"];                          // cornice
  if (y === T) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];
  if (y > S2) return ["white_concrete"];                          // parapet

  // Entrance on the south face, centre bay
  if (face === "south" && pos === 5 && (y === minG + 1 || y === minG + 2)) {
    const half = y === minG + 1 ? "lower" : "upper";
    return ["iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" }];
  }

  const solid = pos === 0 || pos === 11 || pos % 3 === 0;
  const groundBand = y >= minG + 1 && y <= minG + 3;
  const upperBand = y >= minG + 6 && y <= minG + 8;
  if (groundBand || upperBand) {
    if (!solid) return ["glass_pane"];
    if (pos === 0 || pos === 11) return ["white_concrete"];
    return ["smooth_quartz"];                                     // mullion
  }
  return ["white_concrete"];
}

// Pass 1: foundations, floors, and walls
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) setS(x, y, z, "stone_bricks");
  setS(x, minG, z, "smooth_stone");                               // ground floor slab

  const face = edgeFace(x, z);
  if (!face) {
    setS(x, S1, z, "smooth_stone");                               // first-floor slab
    setS(x, S2, z, "stone");                                      // roof slab
    continue;
  }
  const pos = posOf(face, x, z);
  for (let y = Math.max(gr, minG); y <= T; y++) {
    const [id, st] = wallBlock(face, pos, y);
    setS(x, y, z, id, st);
  }
}

// Pass 2: warm lights behind some windows (interior cell just inside the glass)
for (const [x, z] of [...foot.keys()].map(k => k.split(",").map(Number))) {
  const face = edgeFace(x, z);
  if (!face) continue;
  const pos = posOf(face, x, z);
  const solid = pos === 0 || pos === 11 || pos % 3 === 0;
  if (solid || pos % 6 !== 1) continue;
  let ix = x, iz = z;
  if (face === "north") iz = z + 1;
  else if (face === "south") iz = z - 1;
  else if (face === "west") ix = x + 1;
  else ix = x - 1;
  if (!inF(ix, iz) || isEdge(ix, iz)) continue;
  for (const y of [minG + 2, minG + 7]) setS(ix, y, iz, "glowstone");
}

// Pass 3: roof equipment on the interior of the roof
for (let x = 3; x <= 4; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!inF(x, z) || isEdge(x, z)) continue;
    setS(x, S2 + 1, z, "gray_concrete");
    setS(x, S2 + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
