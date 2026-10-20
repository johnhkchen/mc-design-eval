import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617864";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 4 x 17, two storeys of ~5 blocks, flat roof at y 11.
const W = 4, H = 23, D = 17;
const ROOF = 11;
const STOREY_LINE = 5;   // top of ground storey
const FRIEZE = 10;       // top of upper storey
const PARAPET = 12;

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Materials: 1990s-2000s Taipei commercial block, pale concrete, granite-look base,
// blue-tinted glazing, stone parapet.
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const PIER = "light_gray_concrete";
const FRAME = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone";
const ROOFM = "smooth_stone";
const PARAPET_M = "stone_brick_wall";
const WALL_STATE = { up: "true", north: "none", south: "none", east: "none", west: "none" };

// Pass 1: foundations, floor slabs, roof.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(4, gr0));
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, FLOOR);          // ground floor slab
  g.set(x, STOREY_LINE, z, FLOOR); // upper floor slab
  g.set(x, ROOF, z, ROOFM);        // flat roof
}

// Pass 2: facade skin on footprint edge cells.
for (const [x, z, gr0] of cells) {
  if (!isEdge(x, z)) continue;
  const gr = Math.max(0, Math.min(4, gr0));

  // Base course on the ground.
  g.set(x, gr, z, BASE);

  // Ground storey: piers on even z, shopfront glass on odd z.
  for (let y = gr + 1; y <= 4; y++) {
    if (z % 2 === 0) g.set(x, y, z, PIER);
    else g.set(x, y, z, GLASS);
  }

  // Storey line belt course.
  g.set(x, STOREY_LINE, z, BASE);

  // Upper storey: window bays on odd z, piers on even z.
  for (let y = STOREY_LINE + 1; y <= FRIEZE; y++) {
    if (y === FRIEZE) {
      g.set(x, y, z, PIER); // frieze band
    } else if (z % 2 === 0) {
      g.set(x, y, z, PIER);
    } else if (y === STOREY_LINE + 1 || y === FRIEZE - 1) {
      g.set(x, y, z, FRAME); // sill and head frames
    } else {
      g.set(x, y, z, GLASS);
    }
  }

  // Parapet on the roof edge.
  g.set(x, PARAPET, z, PARAPET_M, WALL_STATE);
}

// Pass 3: entrance on the x=0 street face at z=8 (recessed door in the pier).
const doorZ = 8;
const doorCell = cells.find(([x, z]) => x === 0 && z === doorZ);
if (doorCell) {
  const gr = Math.max(0, Math.min(4, doorCell[2]));
  if (gr + 2 <= 4) {
    g.set(0, gr + 1, doorZ, "iron_door", {
      facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(0, gr + 2, doorZ, "iron_door", {
      facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lintel over the door.
    g.set(0, gr + 3, doorZ, PIER);
  }
}

// Pass 4: warm light behind some upper windows (glowstone in the air gap).
const litZ = [1, 7, 13];
for (const z of litZ) {
  if (has(1, z) && !isEdge(1, z)) g.set(1, 7, z, "glowstone");
  if (has(2, z) && !isEdge(2, z)) g.set(2, 7, z, "glowstone");
}

// Pass 5: roof plant room on the roof, sitting on the roof slab.
for (let x = 1; x <= 2; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, 12, z, PIER);
    g.set(x, 13, z, PIER);
  }
}

g.save(`${DIR}/${ID}.nbt`);
