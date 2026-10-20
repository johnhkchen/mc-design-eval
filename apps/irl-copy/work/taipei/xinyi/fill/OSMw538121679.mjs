import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121679";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 15 x 19, roof about 11 blocks above lowest ground.
// Read as a late-1980s/1990s Xinyi-type low-rise commercial block:
// two storeys, stone plinth, cream-white concrete facade with
// light-blue glass shopfronts and windows, light-grey concrete frames,
// a cornice band and a flat parapeted roof.
const W = 15, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const footprint = new Map();
for (const [x, z, gr] of cells) footprint.set(key(x, z), gr);
const has = (x, z) => footprint.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const G = Math.min(...cells.map(c => c[2]));   // lowest ground under footprint
const ROOF = G + 10;                           // top of roof slab (about 11 above lowest ground)

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations, walls, floor slabs
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const top = Math.max(ROOF, gr);

  for (let y = gr; y < ROOF; y++) {
    const rel = y - G;
    if (edge) {
      if (y === gr) {
        put(x, y, z, "stone_bricks");                       // base course
      } else if (rel === 5) {
        put(x, y, z, "smooth_stone");                       // storey line
      } else if (rel >= 1 && rel <= 4) {
        // ground floor: shopfront
        if ((x + z) % 3 === 0) put(x, y, z, "light_gray_concrete");   // pillar
        else if (rel === 4) put(x, y, z, "white_concrete");           // lintel band
        else put(x, y, z, "light_blue_stained_glass");                // shopfront glass
      } else if (rel >= 6 && rel <= 9) {
        // upper storey: window grid
        if ((x + z) % 3 === 0) put(x, y, z, "light_gray_concrete");   // mullion
        else if (rel === 6 || rel === 9) put(x, y, z, "white_concrete"); // spandrel
        else {
          const lit = ((x * 3 + z * 5 + rel) % 7) === 0;
          put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    } else {
      // interior: air gap, with floor slabs at ground and second floor
      if (y === gr || rel === 5) put(x, y, z, "smooth_stone");
    }
  }

  // roof slab over every footprint cell
  put(x, ROOF, z, "light_gray_concrete");
  if (edge) {
    put(x, ROOF, z, "stone_brick_slab", SLAB_BOTTOM); // cornice ring
    put(x, ROOF + 1, z, "white_concrete");           // parapet
  }
}

// Pass 2: roof equipment in the middle of the roof
for (let x = 5; x <= 9; x++) {
  for (let z = 7; z <= 11; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    put(x, ROOF + 1, z, "stone_bricks");
    if (x >= 6 && x <= 8 && z >= 8 && z <= 10) put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// Pass 3: entrance on the street-facing edge (middle column, lowest z)
let door = null;
for (const [x, z, gr] of cells) {
  if (x !== Math.floor(W / 2) || !isEdge(x, z)) continue;
  if (!door || z < door[1]) door = [x, z, gr];
}
if (!door) {
  for (const [x, z, gr] of cells) {
    if (isEdge(x, z) && (!door || z < door[1])) door = [x, z, gr];
  }
}
if (door) {
  const [dx, dz, dg] = door;
  put(dx, dg + 1, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // warm lantern-style light beside the entrance inside the shopfront
  for (const [nx, nz] of [[dx - 1, dz], [dx + 1, dz]]) {
    if (has(nx, nz) && isEdge(nx, nz) && (nx + nz) % 3 !== 0) {
      put(nx, dg + 3, nz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
