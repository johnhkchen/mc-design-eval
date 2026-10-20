import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw831858852.cells.json`, "utf8"));

// Footprint 32 x 14, roof about 11 blocks above lowest ground.
// Reading: a 1990s Xinyi low-rise commercial block, two storeys of about 5 blocks,
// grey granite base, white tile piers, blue-tinted glass, shopfront entrance.
const W = 32, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wd = !has(x - 1, z);
  const E = !has(x + 1, z);
  const ext = N || S || Wd || E;
  const corner = (N || S) && (Wd || E);
  const along = (N || S) ? x : z;

  // Window grid: a pier every third bay, glass between; corners are solid piers.
  const bay = corner || along % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";

  // Foundation fill up to the cell's ground, then granite base course on top.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_granite");

  if (ext) {
    // Ground floor shopfront: glass bays between piers, 3 blocks tall.
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, bay);
    // Sign band at the top of the ground floor.
    put(x, gr + 4, z, "smooth_stone");
    // Floor slab between storeys.
    put(x, gr + 5, z, "smooth_stone");
    // Upper storey: spandrels top and bottom, windows between.
    put(x, gr + 6, z, "white_concrete");
    put(x, gr + 7, z, bay);
    put(x, gr + 8, z, bay);
    put(x, gr + 9, z, "white_concrete");
    // Cornice / parapet.
    put(x, gr + 10, z, "white_concrete");
  } else {
    // Interior: air gap behind glass, floor slabs per storey, roof slab.
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // Warm lights: hanging lanterns and glowstone in some interior bays.
    if (x % 5 === 2 && z % 3 === 1) {
      put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
      put(x, gr + 9, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    if (x % 5 === 0 && z % 3 === 1) {
      put(x, gr + 8, z, "glowstone");
    }
    // Roof equipment: small rooftop units on some interior roof cells.
    if (x % 8 === 4 && z % 2 === 0) {
      put(x, gr + 11, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Entrance: a pair of doors in the middle of the street-facing (north) frontage,
// with a white header above.
for (const [x, z, gr] of cells) {
  if ((x === 14 || x === 15) && !has(x, z - 1)) {
    put(x, gr + 1, z, "iron_door", {
      facing: "north",
      half: "lower",
      hinge: x === 14 ? "left" : "right",
      open: "false",
      powered: "false",
    });
    put(x, gr + 2, z, "iron_door", {
      facing: "north",
      half: "upper",
      hinge: x === 14 ? "left" : "right",
      open: "false",
      powered: "false",
    });
    put(x, gr + 3, z, "white_concrete");
  }
}

g.save(`${dir}/OSMw831858852.nbt`);
