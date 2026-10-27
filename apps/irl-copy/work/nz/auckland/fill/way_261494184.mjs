// Horse & Trap, Mt Eden / Eden Terrace: a three-storey brick and plaster hotel-pub of the early 1900s, with a
// parapet, a two-storey wing to the south-west, and a central entrance on the north face.
// Footprint cells come from the lidar record: [x, z, ground, roof]. Massing follows the roof, smoothed into three tiers
// (15 core, 14 main, 9 wing); every column stands on a foundation that runs down to its own ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_261494184.cells.json`, "utf8"));

const W = 23, D = 25, H = 27;
const g = new Voxels([W, H, D]);

// roof lidar -> clean tiers: the core at 15, the main block at 14, the low wings at 9 (two storeys and a parapet)
const tier = (r) => (r >= 15 ? 15 : r >= 13 ? 14 : 9);
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, roof: tier(roof) });
const cellAt = (x, z) => col.get(`${x},${z}`);

// N, E, S, W as [dx, dz]; a face is open at row y when the neighbour is missing or its roof is below y
const DIRS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const opposite = { n: "s", s: "n", e: "w", w: "e" };
function openFaces(x, z, y) {
  const out = [];
  for (const d of ["n", "e", "s", "w"]) {
    const [dx, dz] = DIRS[d];
    const nb = cellAt(x + dx, z + dz);
    if (!nb || y >= nb.roof) out.push(d);
  }
  return out;
}

// the entrance: north face, the middle of the main block
const DOOR = [18, 2];
const DOOR_BAY = new Set(["17,2", "18,2", "19,2"]);

// the wall runs east-west on the north and south faces, north-south on east and west
const pane = (face) => (face === "n" || face === "s")
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" };

const stand = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, { ground, roof }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < roof; y++) {
    // foundation: rubble from y 0 up to this cell's ground
    if (y < ground) { stand(x, y, z, "cobblestone"); continue; }
    const k = y - ground;                       // height above this cell's ground
    const open = openFaces(x, z, y);
    const shell = open.length > 0;
    const outside = open.filter((d) => !cellAt(x + DIRS[d][0], z + DIRS[d][1]));  // faces onto the street or the air
    if (y === roof - 1) { stand(x, y, z, shell ? "stone_brick_slab" : "smooth_stone"); continue; }   // coping, or the iron roof in pale stone
    if (!shell) {                                // interior: a floor slab per storey, air between
      if (k % 4 === 0) stand(x, y, z, "oak_planks");
      continue;
    }
    if (y === roof - 2) { stand(x, y, z, "white_concrete"); continue; }     // cornice under the coping
    if (DOOR_BAY.has(key)) {                     // the entrance bay: door (k 0-1), sidelights, a timber canopy beam over
      const isDoor = x === DOOR[0] && z === DOOR[1], face = outside[0];
      if (k < 2 && isDoor) { stand(x, y, z, "oak_door", { facing: "south", half: k === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (k === 2) { stand(x, y, z, "oak_planks"); continue; }                  // canopy beam
      if (k === 1 && !isDoor) { stand(x, y, z, "glass_pane", pane(face)); continue; }   // sidelights
      if (k === 3) { stand(x, y, z, "bricks"); continue; }
    }
    if (k === 0) { stand(x, y, z, "stone_bricks"); continue; }             // base course
    if (k % 4 === 0) { stand(x, y, z, "white_concrete"); continue; }       // storey line
    if (k % 4 === 3) { stand(x, y, z, "bricks"); continue; }             // spandrel
    // windows in pairs with a brick pier every third bay, on every storey (the ground floor is the bar's shopfront)
    const face = outside[0];
    const idx = face === "n" || face === "s" ? x : z;
    if (outside.length === 1 && idx % 3 !== 0) { stand(x, y, z, "glass_pane", pane(face)); continue; }
    stand(x, y, z, "bricks");
  }
}

// the lit windows: glowstone two cells in behind a few upper-storey glass panes, so the air gap stays
for (const [key, { ground, roof }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = ground + 1; y < roof - 2; y++) {
    const k = y - ground; if (k % 4 !== 1 && k % 4 !== 2) continue;
    const open = openFaces(x, z, y);
    const outside = open.filter((d) => !cellAt(x + DIRS[d][0], z + DIRS[d][1]));
    if (outside.length !== 1 || open.length !== 1) continue;
    if (k < 4 || ((x + z + k) % 6) !== 1) continue;
    const inward = opposite[outside[0]];
    const [ix, iz] = DIRS[inward];
    const one = cellAt(x + ix, z + iz), two = cellAt(x + 2 * ix, z + 2 * iz);
    if (!one || !two || openFaces(x + ix, z + iz, y).length || openFaces(x + 2 * ix, z + 2 * iz, y).length) continue;
    stand(x + 2 * ix, y, z + 2 * iz, "glowstone");
  }
}

// roof equipment: two brick chimneys on the core, a stone cap on each
const chimneyAt = [[12, 8], [17, 11]];
for (const [tx, tz] of chimneyAt) {
  let best = null, bestD = Infinity;
  for (const [key, c] of col) {
    if (c.roof !== 15) continue;
    const [x, z] = key.split(",").map(Number);
    if (openFaces(x, z, c.roof - 1).length) continue;
    const d = Math.abs(x - tx) + Math.abs(z - tz);
    if (d < bestD) { bestD = d; best = [x, z, c.roof]; }
  }
  if (!best) continue;
  const [x, z, r] = best;
  for (let y = r; y < r + 3; y++) stand(x, y, z, "bricks");
  stand(x, r + 3, z, "stone_brick_slab");
}

const res = g.save(`${DIR}/way_261494184.nbt`);
console.log(JSON.stringify({ built: "way_261494184.nbt", ...res, cells: col.size }));
