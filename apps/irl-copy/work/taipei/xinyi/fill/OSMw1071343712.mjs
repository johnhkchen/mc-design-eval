import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era read from the record: a 1970s-80s Xinyi-district mid-rise. Three storeys of
// white concrete with a stone base, blue-glass ribbon windows in white piers, a
// shopfront ground floor, a cornice and parapet, and a plant room on a flat roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343712";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 29, D = 22;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const ROOF_DECK = 15;   // interior roof deck / top of the third storey
const PARAPET = 16;     // top parapet course; surface reads ~17 blocks
const DOOR = { x: 5, z: 0 };

for (const [x, z, gr] of cells) {
  // Which faces are exterior? A missing neighbour means the cell is on that face.
  const faceAlongZ = !has(x - 1, z) || !has(x + 1, z); // wall runs north-south, index t = z
  const faceAlongX = !has(x, z - 1) || !has(x, z + 1); // wall runs east-west, index t = x
  const edge = faceAlongZ || faceAlongX;
  const t = faceAlongZ ? z : x;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= PARAPET; y++) {
    if (!edge) {
      // Interior: floor slabs at the top of each storey, roof deck, otherwise air.
      if (y === 4 || y === 9 || y === 14 || y === ROOF_DECK) {
        g.set(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Exterior shell
    if (y === ROOF_DECK) { g.set(x, y, z, "smooth_stone"); continue; } // cornice
    if (y === PARAPET) { g.set(x, y, z, "white_concrete"); continue; }

    const band = Math.floor(y / 5);
    const r = y % 5;

    if (r === 0) {
      // Base course at y 0, storey lines at 5 and 10
      g.set(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (r === 4) {
      // Spandrel under each window band; black canopy over the entrance
      const canopy = z === 0 && x >= DOOR.x - 1 && x <= DOOR.x + 1 && faceAlongX;
      g.set(x, y, z, canopy ? "black_concrete" : "white_concrete");
      continue;
    }

    // Window zone (rows 1-3)
    const isPier = t % 3 === 0;
    const paneProps = faceAlongZ
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

    if (band === 0) {
      // Shopfront
      if (x === DOOR.x && z === DOOR.z && faceAlongX) {
        if (r === 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (r === 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
        }
        continue;
      }
      if (isPier) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      continue;
    }

    // Upper storeys: sill, then two rows of glass between piers
    if (r === 1) { g.set(x, y, z, "smooth_stone"); continue; }
    if (isPier) { g.set(x, y, z, "white_concrete"); continue; }
    const lit = r === 2 && (t * 3 + band * 5) % 11 === 0;
    if (lit) g.set(x, y, z, "glowstone");
    else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
}

// Plant room on the roof, central interior cells
for (const [x, z, gr] of cells) {
  const faceAlongZ = !has(x - 1, z) || !has(x + 1, z);
  const faceAlongX = !has(x, z - 1) || !has(x, z + 1);
  if (faceAlongZ || faceAlongX || gr > ROOF_DECK) continue;

  if (x >= 4 && x <= 6 && z >= 7 && z <= 14) {
    const ringEdge = x === 4 || x === 6 || z === 7 || z === 14;
    for (let y = 16; y <= 18; y++) {
      if (y === 17 && ringEdge) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, 19, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }

  // Small condenser units on the roof
  if (x === 8 && (z === 3 || z === 4)) {
    g.set(x, 16, z, "iron_block");
  }
}

// Antenna on the plant room
if (has(5, 10)) {
  for (let y = 20; y <= 22; y++) {
    g.set(5, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
