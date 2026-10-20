import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690430";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function set(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Exposed faces of a footprint cell: S = max-z (street front), N, W, E
function faces(x, z) {
  const f = [];
  if (!has(x, z + 1)) f.push("S");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Inward neighbour across the wall for each face
const inward = {
  S: (x, z) => [x, z - 1],
  N: (x, z) => [x, z + 1],
  W: (x, z) => [x + 1, z],
  E: (x, z) => [x - 1, z],
};

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";

// Pass 1: foundations, floors, roofs for every footprint cell
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const isEdge = f.length > 0;
  const top = gr + 10; // roof deck level, ~11 blocks above lowest ground with parapet

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Base course on the ground line
  set(x, gr, z, isEdge ? "stone_bricks" : "gray_concrete");

  // Floor slab between storeys
  set(x, gr + 5, z, isEdge ? PIER : "light_gray_concrete");

  // Roof deck
  set(x, top, z, isEdge ? "stone_bricks" : "gray_concrete");

  if (isEdge) {
    // Parapet over the roof edge
    set(x, top + 1, z, "stone_brick_wall");
  } else {
    // Roof plant: small units scattered on the deck
    if (x % 6 === 3 && z % 7 === 3) {
      set(x, top + 1, z, "light_gray_concrete");
      set(x, top + 2, z, "iron_block");
    }
  }
}

// Pass 2: facades on edge cells
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length === 0) continue;

  const face = f.includes("S") ? "S" : f[0];
  const p = (face === "S" || face === "N") ? x : z; // position along the wall

  // Storey 1 windows / shopfront (gr+1 .. gr+3)
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (face === "S") {
      if (p === 8) {
        if (y === gr + 1) set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else set(x, y, z, GLASS);
      } else if (p === 0 || p === 17) {
        set(x, y, z, PIER);
      } else {
        set(x, y, z, GLASS);
      }
    } else {
      set(x, y, z, p % 3 !== 0 ? GLASS : PIER);
    }
  }

  // Storey 1 lintel / signage band (gr+4)
  set(x, gr + 4, z, face === "S" ? "red_concrete" : PIER);

  // Storey 2 spandrels and windows
  set(x, gr + 6, z, PIER);
  for (let y = gr + 7; y <= gr + 8; y++) {
    set(x, y, z, p % 3 !== 0 ? GLASS : PIER);
  }
  set(x, gr + 9, z, PIER);
}

// Pass 3: warm lights behind some glass, on the interior side of the wall
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length === 0) continue;

  const face = f.includes("S") ? "S" : f[0];
  const p = (face === "S" || face === "N") ? x : z;
  const [ix, iz] = inward[face](x, z);
  if (!has(ix, iz) || faces(ix, iz).length > 0) continue; // need a real interior cell

  for (const y of [gr + 2, gr + 8]) {
    const isWindow = (face === "S") ? (p !== 0 && p !== 17 && p !== 8) : (p % 3 !== 0);
    if (isWindow && (p + gr) % 4 === 1) {
      set(ix, y, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
