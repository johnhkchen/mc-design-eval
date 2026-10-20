import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883630";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 9 x 23 x 13: footprint 0..8 by 0..12, height room to y 22.
const W = 9, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Ground per footprint cell, clamped so the storey lines still fit under the roof.
const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gy))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Building read: 1970s-80s Taipei mid-rise, two storeys, white tiled concrete
// frame, light-blue glass bays, a shopfront-height ground storey with a central
// entrance on the z=12 face, a light-grey band at each floor line and a cornice,
// and a white parapet at y=11 (roof is about 11 blocks above the lowest ground).
const ROOF = 11;
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const FOUND = "gray_concrete";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";

for (const [x, z, gyRaw] of cells) {
  const gy = ground.get(`${x},${z}`);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground, so nothing floats on a slope.
  for (let y = 0; y < gy; y++) g.set(x, y, z, FOUND);

  if (edge) {
    // Base course on the ground line.
    g.set(x, gy, z, BASE);

    // Pier columns on alternate bays (corners and the building's long faces).
    const pier = (x === 0 || x === 8) ? (z % 2 === 0) : (x % 2 === 0);

    for (let y = gy + 1; y <= ROOF - 1; y++) {
      let m;
      if (y === 5 || y === 10) {
        m = BAND; // floor line and cornice
      } else if (y < 5) {
        // Ground storey: glazed shopfront bays, white piers and lintel at y=4.
        m = (pier || y === 4) ? WALL : GLASS;
      } else {
        // Upper storey: glazed bays between sill (6) and lintel (9).
        m = (pier || y === 6 || y === 9) ? WALL : GLASS;
      }
      g.set(x, y, z, m);
    }

    // Parapet cap.
    g.set(x, ROOF, z, WALL);
  } else {
    // Interior: floor slabs only, air between them (no interiors).
    g.set(x, gy, z, FLOOR);
    if (gy <= 5) g.set(x, 5, z, FLOOR);
    if (gy <= 10) g.set(x, 10, z, FLOOR);
  }
}

// Central entrance on the z=12 face: white surround, double-height door, lintel.
if (has(4, 12)) {
  const gy = ground.get("4,12");
  for (let x = 3; x <= 5; x++) {
    for (let y = gy + 1; y <= gy + 3; y++) {
      g.set(x, y, 12, WALL);
    }
  }
  g.set(4, gy + 1, 12, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(4, gy + 2, 12, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lantern flanking the entrance inside, on the floor.
  if (has(4, 11) && !isEdge(4, 11)) {
    g.set(4, gy + 1, 11, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Warm light behind some glass bays: shroomlight upstairs, glowstone downstairs.
for (const [x, z] of cells) {
  const gy = ground.get(`${x},${z}`);
  if (!isEdge(x, z)) continue;
  // Inward neighbour, used as the room behind the glass.
  let ix = x, iz = z;
  if (x === 0) ix = 1; else if (x === 8) ix = 7;
  else if (z === 0) iz = 1; else if (z === 12) iz = 11;
  if ((ix === x && iz === z) || !has(ix, iz) || isEdge(ix, iz)) continue;

  for (const y of [1, 2, 3, 7, 8]) {
    if (y <= gy) continue;
    const isGlass = y < 5 ? true : true;
    const pier = (x === 0 || x === 8) ? (z % 2 === 0) : (x % 2 === 0);
    if (pier || (x === 4 && z === 12)) continue;
    if (!isGlass) continue;
    if ((x + z + y) % 7 === 0) {
      g.set(ix, y, iz, y < 5 ? "glowstone" : "shroomlight");
    }
  }
}

// Roof equipment: a few air-conditioning plant blocks on the flat roof.
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (x > 1 && x < 7 && z > 2 && z < 10 && (x + 2 * z) % 7 === 3) {
    g.set(x, ROOF, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
