import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 9 x 15, roof ~11 blocks above lowest ground.
// Read as a two-storey, c.1970s-80s Taipei low-rise commercial block:
// reinforced-concrete frame, white-painted wall with light-grey bands,
// stone-base plinth, tinted-glass shopfront on the street (north) side,
// punched windows above, parapet roof with a small rooftop water tank.
// Storeys are 5 blocks each: ground G..G+4, floor slab G+5, upper G+6..G+9,
// roof slab G+10, parapet G+11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865195";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 9, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, st) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

// Directions: N = z-1 (street side), S = z+1, W = x-1, E = x+1
const DIRS = {
  N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0],
};
function openFaces(x, z) {
  const out = [];
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(k);
  }
  return out;
}

// Pre-compute exterior/entrance layout
const entranceCandidates = [];
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  const open = openFaces(x, z);
  if (open.length === 1 && open[0] === "N") entranceCandidates.push([x, z]);
}
const midX = Math.floor(W / 2);
entranceCandidates.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const entrance = entranceCandidates.length ? entranceCandidates[0] : null;

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < G && y < H; y++) put(x, y, z, "stone_bricks");
}

// 2. Body of each footprint cell, stacked from its own ground
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (G + 11 >= H) continue; // guard: keep within the world height
  const open = openFaces(x, z);
  const ext = open.length > 0;

  if (!ext) {
    // Interior: floor slabs only, air elsewhere (no interiors)
    put(x, G, z, "smooth_stone");
    put(x, G + 5, z, "smooth_stone");
    put(x, G + 10, z, "light_gray_concrete");
    continue;
  }

  // Exterior shell
  put(x, G, z, "stone_bricks");                 // base course
  for (let y = G + 1; y <= G + 9; y++) put(x, y, z, "white_concrete");
  put(x, G + 5, z, "light_gray_concrete");       // storey line
  put(x, G + 10, z, "light_gray_concrete");      // cornice / roof edge
  put(x, G + 11, z, "white_concrete");           // parapet

  const corner = open.length >= 2;
  const face = open[0];
  const idx = (face === "N" || face === "S") ? x : z;
  const mullion = corner || idx % 2 === 0;

  // Ground floor shopfront: glass between white mullions
  if (!mullion) {
    for (let y = G + 1; y <= G + 3; y++) put(x, y, z, "cyan_stained_glass_pane");
  } else {
    for (let y = G + 1; y <= G + 3; y++) put(x, y, z, "white_concrete");
  }
  put(x, G + 4, z, "light_gray_concrete");       // shopfront head

  // Upper storeys: punched windows on single-face wall cells
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;
  if (!corner && !mullion) {
    for (const yy of [G + 2, G + 3, G + 7, G + 8]) {
      put(x, yy, z, "light_blue_stained_glass_pane");
    }
  } else if (!corner) {
    // piers keep white
  }

  // Entrance: door opening on the north (street) face
  if (isEntrance) {
    put(x, G + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, G + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, G + 3, z, "cyan_stained_glass_pane"); // transom
    put(x, G + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // canopy lintel
  }

  // Warm light behind some upper windows (glowstone in the interior cell)
  if (!corner && !isEntrance && (x + z) % 3 === 0) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz; // inward neighbour
    if (has(ix, iz) && openFaces(ix, iz).length === 0) {
      put(ix, G + 2, iz, "glowstone");
      put(ix, G + 7, iz, "glowstone");
    }
  }
}

// 3. Rooftop water tank (small, central, on the interior roof)
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x === 2 && z === 6 && G <= 10) {
    const block = [[2, 6], [3, 6], [2, 7], [3, 7]];
    if (block.every(([bx, bz]) => has(bx, bz) && openFaces(bx, bz).length === 0)) {
      for (const [bx, bz] of block) {
        const bg = gAt(bx, bz);
        put(bx, bg + 11, bz, "gray_concrete");
        put(bx, bg + 12, bz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
