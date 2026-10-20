import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457996.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457996.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 15, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const F = new Map();
for (const c of cells) F.set(key(c[0], c[1]), c[2]);
const has = (x, z) => F.has(key(x, z));

const GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const FRAME = "stone_bricks";
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";

// Outward normal of an edge cell: [dx, dz, facing]
function outward(x, z) {
  if (!has(x, z - 1)) return [0, -1, "north"];
  if (!has(x, z + 1)) return [0, 1, "south"];
  if (!has(x - 1, z)) return [-1, 0, "west"];
  if (!has(x + 1, z)) return [1, 0, "east"];
  return null;
}

function missingCount(x, z) {
  let m = 0;
  if (!has(x - 1, z)) m++;
  if (!has(x + 1, z)) m++;
  if (!has(x, z - 1)) m++;
  if (!has(x, z + 1)) m++;
  return m;
}

// Pick the entrance: edge cells facing south (or north if no south face),
// nearest to their mean x-position.
let frontFace = "south";
if (!cells.some(([x, z]) => { const o = outward(x, z); return o && o[2] === "south" && missingCount(x, z) === 1; })) {
  frontFace = "north";
}
const frontCells = cells.filter(([x, z]) => {
  const o = outward(x, z);
  return o && o[2] === frontFace && missingCount(x, z) === 1;
});
let door = null;
if (frontCells.length) {
  const mean = frontCells.reduce((s, c) => s + c[0], 0) / frontCells.length;
  door = frontCells.reduce((best, c) =>
    Math.abs(c[0] - mean) < Math.abs(best[0] - mean) ? c : best);
  door = { x: door[0], z: door[1] };
}

function paneProps(face) {
  if (face === "north" || face === "south") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const miss = missingCount(x, z);
  const interior = miss === 0;

  // Floor slab at ground level and storey-2 floor line
  g.set(x, gr, z, interior ? FLOOR : BASE);
  if (interior) {
    g.set(x, gr + 5, z, FLOOR);
    g.set(x, gr + 10, z, ROOF); // roof membrane
  }

  if (interior) {
    // Roof equipment: small plant box near the centre
    if (Math.abs(x - 7) <= 1 && Math.abs(z - 7) <= 1) {
      g.set(x, gr + 11, z, TRIM);
      if (x === 7 && z === 7) {
        g.set(x, gr + 12, z, WALL);
        g.set(x, gr + 13, z, WALL);
      }
    }
    continue;
  }

  if (miss >= 2) {
    // Corner column: framed pillar running full height
    for (let y = 1; y <= 9; y++) g.set(x, gr + y, z, FRAME);
    g.set(x, gr + 10, z, WALL);
    g.set(x, gr + 11, z, FRAME);
    continue;
  }

  const [dx, dz, face] = outward(x, z);
  const along = (face === "north" || face === "south") ? x : z;
  const pane = paneProps(face);
  const isWin = along % 3 !== 0;

  // Storey 1 (shopfront) rows 1..3, transom row 4, band row 5
  for (let y = 1; y <= 3; y++) {
    if (isWin) g.set(x, gr + y, z, GLASS, pane);
    else g.set(x, gr + y, z, FRAME);
  }
  g.set(x, gr + 4, z, TRIM);
  g.set(x, gr + 5, z, FLOOR);

  // Storey 2 windows rows 6..8, spandrel row 9
  for (let y = 6; y <= 8; y++) {
    if (isWin) g.set(x, gr + y, z, GLASS, pane);
    else g.set(x, gr + y, z, WALL);
  }
  g.set(x, gr + 9, z, TRIM);

  // Parapet and cornice
  g.set(x, gr + 10, z, WALL);
  g.set(x, gr + 11, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Entrance: door on the chosen front cell, lantern above it
  if (door && door.x === x && door.z === z) {
    const inward = [-dx, -dz];
    const doorFacing = (face === "north") ? "south" : (face === "south") ? "north"
      : (face === "west") ? "east" : "west";
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    // Frame beside the door
    if (along % 3 === 1) g.set(x, gr + 4, z, FRAME);
    continue;
  }

  // Warm light behind some upper-storey windows (interior cell inward)
  if (isWin && along % 6 === 1) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && missingCount(ix, iz) === 0) {
      g.set(ix, gr + 7, iz, "glowstone");
    }
  }
}

g.save(OUT);
