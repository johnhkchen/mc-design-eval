import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0548-7F";
const W = 22, H = 47, D = 16;
const TOP = 35; // roof deck level, about 35 blocks above the lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: two door bays on the north face (z = 0), framed by stone pilasters.
const isDoorCell = (x, z) => z === 0 && (x === 10 || x === 11) && has(x, z);
const isDoorSurround = (x, z) => z === 0 && (x === 9 || x === 12) && has(x, z);

for (const [x, z, gr] of cells) {
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  const pier = corner || (edgeX && z % 3 === 0) || (edgeZ && x % 3 === 0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Inward direction for warm light placed behind the glass.
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1; else if (!has(x + 1, z)) dx = -1;
  if (!has(x, z - 1)) dz = 1; else if (!has(x, z + 1)) dz = -1;
  const inX = x + dx, inZ = z + dz;
  const inwardOk = (dx !== 0) !== (dz !== 0) && has(inX, inZ);

  for (let y = gr; y < TOP; y++) {
    if (!perim) {
      // Interior: floor slabs only, air otherwise (no interiors).
      if (y % 5 === 0 && y > 0) put(x, y, z, "smooth_quartz");
      continue;
    }

    // Entrance doors (ground storey only).
    if (isDoorCell(x, z) && gr < 5 && (y === gr || (y === gr + 1 && gr + 1 < 5))) {
      put(x, y, z, "spruce_door", {
        facing: "north",
        half: y === gr + 1 ? "upper" : "lower",
        hinge: "left",
        open: "false",
        powered: "false",
        waterlogged: "false",
      });
      continue;
    }

    // Lintel band over the door, with a warm light centred above it.
    if (z === 0 && x >= 9 && x <= 12 && gr < 5 && y === 3 && has(x, z)) {
      put(x, y, z, x === 10 || x === 11 ? "glowstone" : "stone_bricks");
      continue;
    }

    // Stone pilasters framing the entrance.
    if (isDoorSurround(x, z) && gr < 5 && y >= gr && y <= 3) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (y === gr && gr < 5) {
      // Base course at street level.
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (y % 5 === 0 && y > 0) {
      // Storey line / floor slab band.
      put(x, y, z, "smooth_quartz");
      continue;
    }

    const r = y % 5;
    if (r === 4) {
      // Spandrel below each floor line.
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (pier) {
      // White tile piers act as the window frames.
      put(x, y, z, "white_concrete");
      continue;
    }

    // Blue-tinted glazing.
    put(x, y, z, "light_blue_stained_glass");

    // Warm light in a subset of windows, placed in the air gap just inside.
    if (r === 2 && inwardOk && ((x * 5 + z * 3 + Math.floor(y / 5)) % 7 === 0)) {
      if (groundAt(inX, inZ) <= y) put(inX, y, inZ, "shroomlight");
    }
  }

  // Cornice / roof cap at TOP for every footprint cell.
  put(x, TOP, z, "smooth_quartz");

  // Continuous parapet ring on the perimeter, with corner piers on top.
  if (perim) {
    put(x, TOP + 1, z, "light_gray_concrete");
    if (corner) put(x, TOP + 2, z, "light_gray_concrete");
  }
}

// Rooftop plant: a solid box in the middle of the roof, with a mast on top.
for (let x = 7; x <= 14; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!has(x, z)) continue;
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "light_gray_concrete");
  }
}
if (has(11, 7)) {
  for (let y = TOP + 3; y <= TOP + 7; y++) put(11, y, 7, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
