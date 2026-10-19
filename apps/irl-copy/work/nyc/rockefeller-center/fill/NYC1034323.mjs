// 37 West 46th Street, a 1920 mixed residential and commercial building: an 8 x 24 midblock lot, seven storeys at the
// rear and a stepped front. Street face at low z (46th Street, north). Storeys are 3 blocks: a ground-floor shopfront
// (y 1-3), then upper floors whose windows sit at y 5-6, 8-9, ... with sandstone storey lines at y 4, 7, 10, ... The lidar
// roof is read as three clean tiers: z 0-3 at 14 (four storeys), z 4-8 at 17 (five), z 9-23 at 23 (seven); the east
// column is a firewall carried to 23 over the neighbours' lower roofs. Brick walls of one block, no interiors: air
// behind every window, floor slabs on each storey line, roof deck on each top. Glowstone sits behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034323.cells.json`, "utf8"));
const X = 8, Y = 35, Z = 24;

const inFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inFoot.has(`${x},${z}`);

// Smoothed tiers (block heights): the lidar median per zone, with the east firewall carried to 23.
const top = (x, z) => (!has(x, z) ? 0 : x === 7 ? 23 : z <= 3 ? 14 : z <= 8 ? 17 : 23);
// Air on this side of a cell: outside the footprint, or the neighbour's top is at or below this height.
const outside = (x, y, z) => !has(x, z) || top(x, z) <= y;
const exposed = (x, y, z) => outside(x - 1, y, z) || outside(x + 1, y, z) || outside(x, y, z - 1) || outside(x, y, z + 1);
const northOpen = (x, y, z) => outside(x, y, z - 1);   // a face to the low-z side (street front, setback faces)
const southOpen = (x, y, z) => outside(x, y, z + 1);   // a face to the high-z side (rear, the rear tower's north wall)

const BRICK = "bricks", STONE = "smooth_sandstone", FLOOR = "smooth_stone", ROOF = "stone", BASE = "polished_granite";
const PANE = (ew) => (ew ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
const DOOR = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 9 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const lights = [];

for (const key of inFoot) {
  const [x, z] = key.split(",").map(Number), T = top(x, z);

  // 0. Base course and foundation: y 0 across the lot (granite, where the lidar ground is 1 this is the foundation).
  g.set(x, 0, z, BASE);

  for (let y = 1; y < T; y++) {
    const ext = exposed(x, y, z);

    // Roof deck, and the storey lines (floor slabs) at y 4, 7, 10, ...: a belt course on the outside, a floor inside.
    if (y === T - 1) { g.set(x, y, z, ext ? STONE : ROOF); continue; }
    if (y >= 4 && y % 3 === 1) { g.set(x, y, z, ext ? STONE : FLOOR); continue; }

    // Interior storey air: nothing built.
    if (!ext) continue;

    // Ground floor, the street front at z 0: a granite shopfront with a black awning over the entrance.
    if (y <= 3 && z === 0) {
      if (x === 0 || x === 7) { g.set(x, y, z, BASE); continue; }
      if (y === 3) { g.set(x, y, z, x >= 2 && x <= 4 ? "black_concrete" : BASE); continue; }
      if (x === 3) { g.set(x, y, z, "dark_oak_door", DOOR("south", y === 1 ? "lower" : "upper")); continue; }
      g.set(x, y, z, "glass_pane", PANE(true));
      continue;
    }

    // Ground floor at the rear: a service door and windows.
    if (y <= 3 && z === 23) {
      if (y === 3 || x === 0 || x === 7) { g.set(x, y, z, BRICK); continue; }
      if (x === 3) { g.set(x, y, z, "dark_oak_door", DOOR("north", y === 1 ? "lower" : "upper")); continue; }
      g.set(x, y, z, "glass_pane", PANE(true));
      continue;
    }

    // Upper storeys: a window grid (two-block windows at y 5-6, 8-9, ...) on the street, setback and rear faces; piers
    // of brick between them. The side (party) walls are blank brick, with stone pilasters every six cells for rhythm.
    const winRow = y >= 5 && y % 3 !== 1;
    const winCol = x === 1 || x === 2 || x === 4 || x === 5;
    if (winRow && winCol && (northOpen(x, y, z) || southOpen(x, y, z))) {
      g.set(x, y, z, "glass_pane", PANE(true));
      if (y % 3 === 2 && lit(x, y, z)) lights.push([x, y, northOpen(x, y, z) ? z + 1 : z - 1]);
      continue;
    }
    const sideBay = (x === 0 || x === 7) && z % 6 === 0;
    g.set(x, y, z, sideBay ? "stone_bricks" : BRICK);
  }
}

// Warm lights just inside the glass: the shop windows at the street, and some upper windows.
for (const [x, y, z] of lights) if (has(x, z) && !exposed(x, y, z)) g.set(x, y, z, "glowstone");
for (const x of [1, 5]) if (!exposed(x, 1, 1)) g.set(x, 1, 1, "glowstone");

// Roof: a bulkhead on the rear tower and a timber water tower on legs.
for (let x = 2; x <= 5; x++) for (let z = 11; z <= 14; z++) {
  for (let y = 23; y <= 25; y++) g.set(x, y, z, BRICK);
  g.set(x, 26, z, STONE);
}
for (const x of [3, 4]) g.set(x, 24, 11, "glass_pane", PANE(true));
for (const [x, z] of [[5, 18], [6, 18], [5, 19], [6, 19]]) {
  g.set(x, 23, z, "oak_fence"); g.set(x, 24, z, "oak_fence");
  for (let y = 25; y <= 27; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 28, z, "dark_oak_planks");
}

const info = g.save(`${DIR}/NYC1034323.nbt`);
console.log(JSON.stringify(info));
