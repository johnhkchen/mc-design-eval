import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-1970s Taipei shophouse-style block: 2 storeys (5 blocks each), white tiled
// walls, stone base course, a shopfront on the street (north, z=0) face, a grid of
// framed windows on the long sides, a flat roof with cornice and parapet, and a
// stair-housing plus AC plant on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401658";
const W = 6, H = 24, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const base = (x, z) => ground.get(`${x},${z}`);

const ST = {
  wall: "white_terracotta",
  base: "stone_bricks",
  pier: "white_concrete",
  glass: "light_blue_stained_glass",
  frame: "stone_bricks",
  band: "smooth_stone",
  roof: "light_gray_concrete",
  found: "stone",
  sign: "gray_concrete",
  glow: "glowstone",
  ac: "iron_block",
};

// Writes only inside the footprint and inside the volume.
function put(x, y, z, blk, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, blk, props);
  else g.set(x, y, z, blk);
}

// Which outward face a footprint cell sits on (null = interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "front";
  if (!has(x, z + 1)) return "back";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gr] of cells) {
  const b = gr;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, ST.found);

  const face = faceOf(x, z);

  // Interior cells: floor slabs and roof slab only; air between.
  if (!face) {
    put(x, b, z, ST.band);
    put(x, b + 5, z, ST.band);
    put(x, b + 11, z, ST.roof);
    continue;
  }

  // Perimeter: wall column from base to the top of the second storey.
  for (let y = b; y <= b + 10; y++) put(x, y, z, ST.wall);
  put(x, b, z, ST.base);

  // Storey line, cornice, parapet with coping.
  put(x, b + 5, z, ST.band);
  put(x, b + 11, z, ST.band);
  put(x, b + 12, z, ST.band);

  if (face === "front") {
    // Shopfront at the street face.
    for (let y = b + 1; y <= b + 3; y++) {
      for (let xx = 1; xx <= 4; xx++) put(xx, y, z, ST.glass);
      put(0, y, z, ST.pier);
      put(5, y, z, ST.pier);
    }
    // Entrance door at x=2.
    put(2, b + 1, z, "oak_door", DOOR_LOWER);
    put(2, b + 2, z, "oak_door", DOOR_UPPER);
    // Sign / awning band over the shopfront.
    for (let xx = 0; xx <= 5; xx++) put(xx, b + 4, z, ST.sign);
    // Upper storey: piers and a window grid.
    for (let y = b + 6; y <= b + 10; y++) {
      put(0, y, z, ST.pier);
      put(5, y, z, ST.pier);
    }
    put(0, b + 6, z, ST.pier);
    for (let xx = 1; xx <= 4; xx++) {
      put(xx, b + 6, z, ST.band);
      put(xx, b + 10, z, ST.band);
      for (let y = b + 7; y <= b + 9; y++) {
        put(xx, y, z, xx === 3 ? ST.frame : ST.glass);
      }
    }
    // Upper shopfront piers at the corners show as a continuous column.
    put(5, b + 6, z, ST.pier);
  } else if (face === "back") {
    // Plain service face with a few small upper windows.
    for (let xx = 1; xx <= 4; xx++) {
      put(xx, b + 1, z, ST.band);
      put(xx, b + 6, z, ST.band);
      put(xx, b + 10, z, ST.band);
    }
    for (let y = b + 7; y <= b + 9; y++) {
      put(2, y, z, ST.glass);
      put(3, y, z, ST.glass);
    }
  } else {
    // West / east long sides: pilasters every 4 blocks, paired windows between.
    const rel = z % 4;
    const inner = face === "west" ? 1 : 4;
    if (rel === 0) {
      for (let y = b + 1; y <= b + 10; y++) put(x, y, z, ST.pier);
    } else {
      // Ground storey window.
      put(x, b + 1, z, ST.band);
      put(x, b + 4, z, ST.band);
      for (let y = b + 2; y <= b + 3; y++) {
        put(x, y, z, rel === 2 ? ST.frame : ST.glass);
      }
      // Upper storey window.
      put(x, b + 6, z, ST.band);
      put(x, b + 10, z, ST.band);
      for (let y = b + 7; y <= b + 9; y++) {
        put(x, y, z, rel === 2 ? ST.frame : ST.glass);
      }
      // Warm light behind some upper windows.
      if (rel === 1 && z % 8 === 1) put(inner, b + 8, z, ST.glow);
    }
  }
}

// Roof plant and stair housing, standing on the roof slab at b+11.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const b = base(x, z);
  if (!b && b !== 0) continue;

  // AC plant block at the north-west end of the roof.
  if (x >= 1 && x <= 2 && z >= 3 && z <= 4) {
    for (let y = b + 12; y <= b + 13; y++) put(x, y, z, ST.ac);
  }

  // Stair housing at the south end of the roof: walls to b+14, cap at b+15.
  if (x >= 1 && x <= 4 && z >= 18 && z <= 21) {
    const edge = x === 1 || x === 4 || z === 18 || z === 21;
    for (let y = b + 12; y <= b + 14; y++) {
      if (edge) put(x, y, z, ST.wall);
    }
    put(x, b + 15, z, ST.band);
  }
}

// Stair-housing door on the north side of the housing.
for (let x = 1; x <= 4; x++) {
  if (has(x, 18) && x === 2) {
    const b = base(x, 18);
    put(x, b + 12, 18, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 13, 18, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
