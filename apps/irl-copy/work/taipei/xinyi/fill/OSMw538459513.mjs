import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459513.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459513.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 23, D = 18, H = 23;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Lowest ground under the building: y0 for absolute storey lines
const minG = Math.min(...cells.map(c => c[2]));
const TOP = minG + 10;          // top course of walls / parapet; roof surface at minG + 11

// Perimeter: any side touching a non-footprint cell
const faceZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const faceX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isPerim = (x, z) => faceX(x, z) || faceZ(x, z);

// Mullion pattern: every third bay along each wall, corners always solid
const isPillar = (x, z) => {
  const fz = faceZ(x, z), fx = faceX(x, z);
  if (fz && fx) return true;
  if (fz) return x % 3 === 0;
  if (fx) return z % 3 === 0;
  return false;
};

// Entrance: on the north (z-min) face, closest to the middle of the frontage
let door = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  if (!door || Math.abs(x - W / 2) < Math.abs(door.x - W / 2)) door = { x, z };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const pillar = perim && isPillar(x, z);

  for (let y = gr; y <= TOP; y++) {
    // Roof surface
    if (y === TOP) {
      g.set(x, y, z, perim ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!perim) {
      // Interior: floor slabs per storey, no fitted rooms, a few warm lights behind glass
      if (y === minG || y === minG + 5) {
        g.set(x, y, z, "smooth_stone");
      } else if (y === minG + 7 && (x + z) % 4 === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    const dy = y - minG;
    if (dy === 0) {
      g.set(x, y, z, "polished_granite");                      // base course
    } else if (dy >= 1 && dy <= 3) {
      // Shopfront: glass with frames, lantern over the entrance
      if (door && x === door.x && z === door.z && dy <= 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: dy === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (door && x === door.x && z === door.z && dy === 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, pillar ? "smooth_quartz" : "glass_pane");
      }
    } else if (dy === 4 || dy === 5 || dy === 9) {
      g.set(x, y, z, "smooth_quartz");                         // lintel, storey line, cornice band
    } else if (dy >= 6 && dy <= 8) {
      // Upper storey window grid
      g.set(x, y, z, pillar ? "light_gray_concrete" : "glass_pane");
    }
  }

  // Parapet course is the top layer above; roof plant stands on the roof surface
  if (!perim && x >= 9 && x <= 13 && z >= 6 && z <= 11) {
    g.set(x, TOP + 1, z, "light_gray_concrete");
  }
}

g.save(OUT);
