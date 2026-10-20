import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343707.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343707.nbt";

// Footprint 20 x 47. Two-storey low-rise commercial block (1970s-80s Taipei
// concrete shophouse): stone plinth, white-plaster piers, light-grey spandrels,
// shopfront glass at street level, blue-glass windows above, a cornice and a
// parapet, and a small rooftop plant room. Storey lines are absolute:
// floor slab y=5, roof deck y=10, parapet y=11 (about 11 blocks above lowest ground).
const W = 20, H = 23, D = 47;
const SLAB = 5, ROOF = 10, PARAPET = 11;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const gnd = new Map();
for (const [x, z, gr] of cells) gnd.set(x + "," + z, Math.max(0, Math.min(H - 1, Math.round(gr))));
const inside = (x, z) => gnd.has(x + "," + z);
const groundOf = (x, z) => gnd.get(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const doorProps = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// Entrance: centre of the north (z-min) face.
const entranceX = Math.floor(W / 2);

for (const [x, z] of cells) {
  const gr = groundOf(x, z);

  // Side / facade detection (outward direction of the missing neighbour).
  let side = null, i = 0;
  if (!inside(x, z - 1)) { side = "N"; i = x; }
  else if (!inside(x, z + 1)) { side = "S"; i = x; }
  else if (!inside(x - 1, z)) { side = "W"; i = z; }
  else if (!inside(x + 1, z)) { side = "E"; i = z; }

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!side) {
    // Interior: floor slab and roof deck only, air between (no interiors).
    if (gr <= SLAB) put(x, SLAB, z, "light_gray_concrete");
    if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const pane = side === "N" || side === "S" ? paneNS : paneEW;
  const sideIdx = { N: 0, S: 1, W: 2, E: 3 }[side];
  const pos = i % 4;
  const bay = Math.floor(i / 4);
  const isEntrance = side === "N" && i === entranceX && gr <= 2;

  for (let y = gr; y <= PARAPET && y < H; y++) {
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }    // parapet
    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }  // cornice / roof edge
    if (y === SLAB) { put(x, y, z, "light_gray_concrete"); continue; }  // storey line

    if (y <= 4) {
      // Ground storey (commercial shopfront), only if ground is low enough.
      if (gr > 3) continue;
      if (y === 4) { put(x, y, z, "light_gray_concrete"); continue; }   // lintel band
      if (isEntrance) {
        if (y === gr + 1) { put(x, y, z, "dark_oak_door", doorProps(side === "N" ? "north" : "south", "lower")); continue; }
        if (y === gr + 2) { put(x, y, z, "dark_oak_door", doorProps(side === "N" ? "north" : "south", "upper")); continue; }
      }
      if (pos === 0) { put(x, y, z, "white_concrete"); continue; }     // pier
      put(x, y, z, "glass_pane", pane);                                  // shop glass
      continue;
    }

    // Upper storey (y 6..9): piers, sills, blue-glass windows, a few lit ones.
    if (y >= 6 && y <= 9) {
      if (pos === 0) { put(x, y, z, "white_concrete"); continue; }
      if (y === 6 || y === 9) { put(x, y, z, "light_gray_concrete"); continue; }
      const lit = y === 7 && pos === 2 && (bay + sideIdx) % 3 === 0;
      if (lit) { put(x, y, z, "glowstone"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", pane);
      continue;
    }
  }
}

// Rooftop: a plant room and a few AC units on the roof deck (y 10).
for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  if (gr > ROOF) continue;
  const interior = inside(x, z - 1) && inside(x, z + 1) && inside(x - 1, z) && inside(x + 1, z);
  if (!interior) continue;
  if (x >= 6 && x <= 13 && z >= 16 && z <= 30) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
  if ((x === 3 && z === 6) || (x === 16 && z === 40) || (x === 3 && z === 40)) {
    put(x, 11, z, "iron_block");
  }
}

g.save(OUT);
