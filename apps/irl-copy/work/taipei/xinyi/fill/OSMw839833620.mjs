import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 17 x 19 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, early-1990s Taipei commercial block: granite base course,
// quartz mullions, tinted-glass shopfront and upper window bands, white spandrels,
// a stone cornice, a parapet, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833620";
const W = 17, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Roof plane: about 11 blocks above the lowest ground, lifted only if the site is steep.
const R = Math.max(11, maxG + 6);

const OUT = [[0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"]];

// Main entrance: a non-corner perimeter cell facing outward, nearest the middle of its side.
const cx = (W - 1) / 2, cz = (D - 1) / 2;
let door = null, best = Infinity;
for (const [x, z, gr] of cells) {
  if (isCorner(x, z)) continue;
  OUT.forEach(([dx, dz, name], i) => {
    if (!has(x + dx, z + dz)) {
      const s = i * 1000 + Math.abs(x - cx) + Math.abs(z - cz) * 0.5;
      if (s < best) { best = s; door = { x, z, gr, dx, dz, name }; }
    }
  });
}

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  const per = isPerim(x, z);
  const cor = isCorner(x, z);

  // Foundation under every footprint cell, up to its ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground slab on which the building stands.
  g.set(x, gr, z, per ? "granite" : "smooth_stone");

  // Storey line between the two floors, solid across the whole footprint.
  g.set(x, gr + 5, z, "smooth_stone");

  // Roof slab.
  g.set(x, R, z, "light_gray_concrete");

  if (per) {
    const pillar = cor || (x + z) % 3 === 0;
    for (let y = gr + 1; y <= R - 1; y++) {
      let id;
      if (y === gr + 1) id = "granite";                 // base course
      else if (y === gr + 5) id = "smooth_stone";       // storey line
      else if (y === R - 1) id = "smooth_stone";        // cornice
      else if (y === gr + 9) id = "white_concrete";     // upper spandrel
      else id = pillar ? "quartz_block" : "glass";      // shopfront / window bands
      g.set(x, y, z, id);
    }

    // Parapet.
    g.set(x, R + 1, z, "white_concrete");

    // Entrance.
    if (door && door.x === x && door.z === z) {
      const props = { facing: door.name, hinge: "left", open: "false", powered: "false" };
      g.set(x, gr + 1, z, "dark_oak_door", { ...props, half: "lower" });
      g.set(x, gr + 2, z, "dark_oak_door", { ...props, half: "upper" });
      g.set(x, gr + 3, z, "quartz_block");
      g.set(x, gr + 4, z, "quartz_block");
    }
  }
}

// Interior lights behind the glass: a few lanterns and glowstone, no furnishing.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if ((x * 5 + z * 7) % 11 === 0) g.set(x, gr + 1, z, "lantern", { hanging: "false" });
  if ((x * 3 + z * 5) % 13 === 0) g.set(x, gr + 6, z, "lantern", { hanging: "false" });
  if ((x * 7 + z * 2) % 17 === 0) g.set(x, gr + 1, z, "glowstone");
}

// Lamps flanking the entrance inside the shell.
if (door) {
  const ix = door.x - door.dx, iz = door.z - door.dz;
  if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, door.gr + 1, iz, "lantern", { hanging: "false" });
}

// Roof plant: air-handling boxes and a water tank.
if (R + 2 <= H - 1) {
  for (const [x, z] of cells.map(([a, b]) => [a, b])) {
    if (isPerim(x, z)) continue;
    if ((x * 4 + z * 3) % 9 === 0) g.set(x, R + 1, z, "stone_bricks");
  }
  // Water tank: 2x2 interior block, placed on the first fully interior 2x2 found.
  let tank = null;
  for (const [x, z] of cells) {
    if ([[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => has(x + a, z + b) && !isPerim(x + a, z + b))) {
      tank = { x, z };
      break;
    }
  }
  if (tank) {
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      g.set(tank.x + a, R + 1, tank.z + b, "oak_planks");
      g.set(tank.x + a, R + 2, tank.z + b, "oak_planks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
