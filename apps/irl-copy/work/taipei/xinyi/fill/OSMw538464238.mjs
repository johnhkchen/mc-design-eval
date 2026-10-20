import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538464238.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538464238.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Door: middle of the north (min z) exterior face
const northFace = cells
  .filter(([x, z]) => isEdge(x, z) && !has(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northFace.length ? northFace[Math.floor(northFace.length / 2)] : null;
const doorCell = doorX === null ? null : cells.find(([x, z]) => x === doorX && !has(x, z - 1));
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const t = x + z;
  const isDoor = key(x, z) === doorKey;
  // Pillars every 4 along the facade; windows on the other two columns; plain wall on the rest
  const pillar = edge && !isDoor && t % 4 === 0;
  const upperWindow = edge && !isDoor && (t % 4 === 1 || t % 4 === 2);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Ground floor slab / base course
  put(x, gr, z, edge ? "stone_bricks" : "light_gray_concrete");

  // Ground storey (gr+1 .. gr+3 shopfront, gr+4 storey band)
  if (edge) {
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isDoor) continue;
      put(x, y, z, pillar ? "white_concrete" : "glass");
    }
    put(x, gr + 4, z, "light_gray_concrete");
  }
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Upper floor slab at gr+5 (floor slab across the whole footprint)
  put(x, gr + 5, z, "light_gray_concrete");

  // Upper storey (gr+6 .. gr+9)
  if (edge) {
    if (upperWindow) {
      put(x, gr + 6, z, "iron_bars"); // sill railing
      const lit = (x + 2 * z) % 3 === 0;
      put(x, gr + 7, z, lit ? "glowstone" : "glass_pane"); // warm glow behind some panes
      put(x, gr + 8, z, "glass_pane");
      put(x, gr + 9, z, "white_concrete"); // head
    } else {
      for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    }
  }

  // Roof deck and cornice at gr+10
  put(x, gr + 10, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Parapet at gr+11 around the edge
  if (edge) put(x, gr + 11, z, "white_concrete");

  // Roof equipment: a few AC units on the interior roof
  if (!edge && (x * 3 + z) % 7 === 0) put(x, gr + 11, z, "iron_block");
}

g.save(OUT);
