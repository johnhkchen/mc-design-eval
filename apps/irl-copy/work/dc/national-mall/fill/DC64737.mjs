import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64737.cells.json`, "utf8"));

// 1250 I St NW: 1970s-80s precast-and-tinted-glass office block with a stone
// base, a recessed lobby band, pilaster piers, a cornice and a stone roof cap.
const W = 14, H = 31, D = 21;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const roof = Math.min(Math.max(rf, gr + 3), 29);
  map.set(`${x},${z}`, { gr: Math.max(0, gr), rf: roof });
}
const has = (x, z) => map.has(`${x},${z}`);
const doorX = (x) => x === 6 || x === 7;

for (const [key, { gr, rf }] of map) {
  const [x, z] = key.split(",").map(Number);

  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const front = edge && z === 0;
  // Pilasters: corners plus every third column, so each bay reads as a pier.
  const pier = corner || (x + z) % 3 === 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < rf; y++) {
    const k = y - gr;

    // Interior: solid core, no rooms.
    if (!edge) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Entrance on the front (z = 0) ground storey.
    if (front && doorX(x) && k <= 1) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: k === 0 ? "lower" : "upper",
        hinge: x === 6 ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // Lantern-lit canopy over the entrance, carried by two stone piers.
    if (front && x >= 5 && x <= 8 && k === 2) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (front && (x === 5 || x === 8) && k === 1) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (k === 0) {
      // Base course, projecting slightly as a plinth.
      g.set(x, y, z, "polished_andesite");
    } else if (k === 1) {
      // Recessed lobby/shopfront glass between stone piers.
      g.set(x, y, z, pier ? "stone_bricks" : "light_blue_stained_glass");
    } else if (y === rf - 1) {
      // Projecting cornice band at the top of the building.
      g.set(x, y, z, "smooth_stone");
    } else if (k % 2 === 0) {
      // Precast spandrel at each floor line, with a slab-line shadow.
      g.set(x, y, z, pier ? "stone_bricks" : "light_gray_concrete");
    } else {
      // Window course: precast pilasters, tinted glass, a few lit offices.
      if (pier) {
        g.set(x, y, z, "stone_bricks");
      } else if ((x * 7 + z * 13 + y * 5) % 23 === 0) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Roof cap: a stone slab on the perimeter gives a clean edge without battlements.
  if (edge && rf <= 30) g.set(x, rf, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/DC64737.nbt`);
