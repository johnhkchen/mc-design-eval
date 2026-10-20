import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low two-storey commercial block (c. 1980s Taipei): stone base course,
// white tiled facade with pier-and-window bays, glass shopfronts at street level,
// a central entrance, and a parapet over a flat roof with rooftop plant.
const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542020168.cells.json", "utf8")
);
const W = 21, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isWall = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Outward face of a wall cell: returns { face, u, ix, iz } where u is the position along the face
// and (ix, iz) is the cell just inside the wall.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", u: x, ix: x, iz: z + 1 };
  if (!has(x, z + 1)) return { face: "south", u: x, ix: x, iz: z - 1 };
  if (!has(x - 1, z)) return { face: "west", u: z, ix: x + 1, iz: z };
  if (!has(x + 1, z)) return { face: "east", u: z, ix: x - 1, iz: z };
  return null;
}

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground, then base course / ground floor at y = gr.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "stone_bricks");

  // Floor slab between storeys and the roof deck, across the whole footprint.
  g.set(x, gr + 5, z, "smooth_quartz");
  g.set(x, gr + 10, z, "light_gray_concrete");

  if (!isWall(x, z)) continue;

  const info = faceOf(x, z);
  const { face, u, ix, iz } = info;
  const pier = u % 3 === 0;
  const isDoor = face === "south" && x === 10;

  // Parapet: wall cells rise one block above the roof deck.
  g.set(x, gr + 10, z, "white_concrete");
  g.set(x, gr + 11, z, "white_concrete");

  // Ground storey: glass shopfront with white piers and fascia.
  if (isDoor) {
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, "white_concrete");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      g.set(x, y, z, pier ? "white_concrete" : "glass");
    }
  }
  g.set(x, gr + 4, z, "white_concrete");

  // Upper storey: sill, glass pair, lintel.
  g.set(x, gr + 6, z, pier ? "white_concrete" : "smooth_stone");
  for (let y = gr + 7; y <= gr + 8; y++) {
    g.set(x, y, z, pier ? "white_concrete" : "glass");
  }
  g.set(x, gr + 9, z, "white_concrete");

  // Warm lights behind some upper-storey windows.
  if (!pier && u % 6 === 2 && has(ix, iz)) {
    g.set(ix, gr + 7, iz, "shroomlight");
  }
}

// Rooftop plant: a few units on the roof deck, on interior cells only.
const plant = [[5, 4], [6, 4], [14, 8], [15, 8], [10, 6]];
for (const [x, z] of plant) {
  if (!has(x, z) || isWall(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  g.set(x, gr + 11, z, "iron_block");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542020168.nbt");
