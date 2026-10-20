import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335587036";
const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const W = 2, H = 19, D = 30;
const g = new Voxels([W, H, D]);

const ROOF = 7;        // roof and parapet course, 7 blocks above lowest ground
const SLAB_Y = 4;      // storey line between shopfront and upper floor
const PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const ground = Math.round(gr);
  const front = x === 1;                 // x=1 is the street-facing side
  const end = z === 0 || z === D - 1;   // end walls

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Walls from ground up to the roof course.
  for (let y = ground; y < ROOF; y++) {
    if (y === SLAB_Y) { g.set(x, y, z, "light_gray_concrete"); continue; }

    if (y < SLAB_Y) {
      // Ground floor: shopfront on the front, base course elsewhere.
      if (!front || end) {
        g.set(x, y, z, "stone_bricks");
      } else if (z % 4 === 0) {
        g.set(x, y, z, "white_concrete");                 // pillar
      } else if (z === 14) {
        // Entrance: door at the front, glass transom above.
        if (y <= ground + 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "east",
            half: y === ground ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          g.set(x, y, z, "glass_pane", PANE);
        }
      } else {
        g.set(x, y, z, "glass_pane", PANE);               // shopfront glazing
      }
      continue;
    }

    // Upper storey (y 5..6): window grid with frames.
    const isWindow = !end && (z % 4 === 1 || z % 4 === 2);
    if (isWindow) {
      if (front && y === 5 && z % 8 === 5) {
        g.set(x, y, z, "shroomlight");                    // warm light behind glass
      } else {
        g.set(x, y, z, "glass_pane", PANE);
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Parapet / roof slab across every cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  // Cornice on the street face.
  if (front) g.set(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof equipment on the back side, standing on the roof slab.
for (const z of [5, 6, 22, 23]) {
  if (cells.some(([x, zz]) => x === 0 && zz === z)) {
    g.set(0, ROOF + 1, z, "iron_block");
  }
}

g.save(`${SRC}/${ID}.nbt`);
