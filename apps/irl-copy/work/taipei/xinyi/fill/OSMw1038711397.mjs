import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038711397.cells.json", "utf8"));
const g = new Voxels([14, 23, 19]);

// Two-storey 1990s commercial block: granite base, white tile upper floors with
// light-blue glass bands, red fascia sign band over a glazed shopfront, roof parapet
// and a few rooftop AC units. Street frontage on the z=18 side with a double entrance.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const ROOF_Y = 11;
const DOOR_Z = 18;
const DOOR_X = [6, 7];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const wallX = !has(x - 1, z) || !has(x + 1, z); // exposed on an east/west edge
  const wallZ = !has(x, z - 1) || !has(x, z + 1); // exposed on a north/south edge
  const wall = wallX || wallZ;
  const corner = wallX && wallZ;
  // Position along the face this cell sits on (for mullion/window rhythm)
  const t = wallZ ? x : z;
  const isDoor = z === DOOR_Z && DOOR_X.includes(x) && gr + 2 <= 4;

  // Floor / base course
  g.set(x, gr, z, wall ? "polished_granite" : "polished_andesite");

  for (let y = gr + 1; y <= ROOF_Y; y++) {
    if (!wall) {
      // Interior: only floor slabs (storey line and roof deck), air otherwise
      if (y === 5 && gr < 5) g.set(x, y, z, "smooth_stone");
      if (y === 10 && gr < 10) g.set(x, y, z, "light_gray_concrete");
      // Roof equipment on the deck
      if (y === 11 && gr <= 9 && x % 4 === 2 && z % 5 === 2) g.set(x, y, z, "iron_block");
      // Warm light behind upper-floor glass (air gap, lamp on the slab at y=5)
      if (y === 6 && gr <= 5 && x % 5 === 2 && z % 6 === 3) g.set(x, y, z, "glowstone");
      continue;
    }

    if (y === ROOF_Y) {
      g.set(x, y, z, "smooth_quartz"); // parapet
    } else if (y === 10) {
      g.set(x, y, z, "stone_bricks"); // cornice
    } else if (y === 5) {
      g.set(x, y, z, "smooth_quartz"); // storey line
    } else if (y < 5) {
      // Ground storey: shopfront with red fascia band at y=4
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south",
          half,
          hinge: x === 6 ? "left" : "right",
          open: "false",
          powered: "false",
        });
      } else if (y === 4 && !corner) {
        g.set(x, y, z, "red_concrete"); // fascia sign band
      } else if (corner || t % 3 === 0) {
        g.set(x, y, z, "smooth_quartz"); // shopfront mullion / pier
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else {
      // Upper storey (y 6..9): white tile with punched window bands
      if (corner) {
        g.set(x, y, z, "smooth_quartz");
      } else if (y >= 6 && y <= 8 && t % 3 === 1) {
        g.set(x, y, z, "light_blue_stained_glass");
      } else if (y >= 6 && y <= 8 && t % 3 === 0) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038711397.nbt");
