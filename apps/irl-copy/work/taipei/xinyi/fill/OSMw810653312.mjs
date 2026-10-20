import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw810653312.cells.json`, "utf8"));

const W = 201, H = 19, D = 108;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Roof slab level: about 7 blocks above the lowest ground, stepping up with
// the terrain where the ground is higher, clamped to the volume.
const roofAt = (gr) => Math.min(H - 3, Math.max(7, gr + 4));

// Entrance zones along the perimeter (every 60 blocks, 8 wide)
const isEntrance = (x, z) => ((x + z) % 60) < 8;

for (const [x, z, gr] of cells) {
  const R = roofAt(gr);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Concourse floor slab at ground level
  g.set(x, gr, z, "light_gray_concrete");

  if (edge) {
    // Perimeter walls: plinth, glazed storey band, cornice and parapet
    g.set(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y <= R - 2; y++) {
      if (y <= gr + 3 && isEntrance(x, z)) {
        g.set(x, y, z, "glass"); // entrance opening
        continue;
      }
      if (y === gr + 1) {
        g.set(x, y, z, "stone_bricks"); // lower base course above plinth
        continue;
      }
      if ((x + z) % 4 === 0) {
        g.set(x, y, z, "white_concrete"); // mullion
      } else if (y === gr + 2 && (x + z) % 12 === 6) {
        g.set(x, y, z, "shroomlight"); // warm light behind glass
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
    // Entrance canopy over the openings
    if (isEntrance(x, z)) {
      g.set(x, gr + 4, z, "smooth_stone_slab", { type: "bottom" });
    }
    // Cornice and parapet
    g.set(x, R - 1, z, "smooth_stone");
    g.set(x, R, z, "white_concrete");
  } else {
    // Interior columns on an 8-block grid carry the roof
    if (x % 8 === 0 && z % 8 === 0) {
      for (let y = gr + 1; y <= R - 1; y++) g.set(x, y, z, "white_concrete");
    }
  }

  // Roof slab over every footprint cell, with skylight strips over the concourse
  if (!edge && (x % 8 === 3 || x % 8 === 4)) {
    g.set(x, R, z, "light_blue_stained_glass");
  } else if (!edge) {
    g.set(x, R, z, "light_gray_concrete");
  }

  // Roof equipment: a few plant boxes on the roof
  if (!edge && x % 40 >= 20 && x % 40 <= 25 && z % 30 >= 10 && z % 30 <= 14 && R + 1 < H) {
    g.set(x, R + 1, z, "light_gray_concrete");
  }
}

g.save(`${dir}/OSMw810653312.nbt`);
