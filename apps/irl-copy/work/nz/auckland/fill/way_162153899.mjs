// Way 162153899: a 1920s-30s brick commercial block (red brick, cream plaster bands, stone plinth, shopfront at street level),
// built from the lidar roof heights: each cell's roof is smoothed over its footprint neighbours and snapped to a storey tier
// (1, 2, 3 or 4 storeys on the 4-block grid that starts at y 2), so every storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153899.cells.json", "utf8"));

const W = 41, D = 23, H = 30;
const FLOOR0 = 2;                                        // the storey grid starts above the highest ground under the footprint
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => cell.has(key(x, z));

// lidar noise: median of the roof heights of the footprint cells within one cell, then snapped to a storey tier
// (the lidar's few 17s are one-cell spikes, not a tower, so the roof stops at three storeys above the grid)
const tierOf = (r) => (r <= 7 ? 6 : r <= 11 ? 10 : 14);
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const top = new Map();
for (const [k, { roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) near.push(cell.get(key(x + dx, z + dz)).roof);
  top.set(k, tierOf(median(near)));
}

// exposed faces: a neighbour outside the footprint
const exN = (x, z) => !inF(x, z - 1), exS = (x, z) => !inF(x, z + 1);
const exW = (x, z) => !inF(x - 1, z), exE = (x, z) => !inF(x + 1, z);
const perim = (x, z) => exN(x, z) || exS(x, z) || exW(x, z) || exE(x, z);
const corner = (x, z) => (exN(x, z) || exS(x, z)) && (exW(x, z) || exE(x, z));

// the entrance: a ground-floor cell on the south face, odd column (the window grid), nearest the middle of the front
let door = null;
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!exS(x, z) || corner(x, z) || x % 2 === 0) continue;
  if (!door || Math.abs(x - 20) < Math.abs(door.x - 20)) door = { x, z };
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glassPane = (x, z) => (exN(x, z) || exS(x, z)
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });
const windowAt = (x, z) => !corner(x, z) && (exN(x, z) || exS(x, z) ? x % 2 === 1 : z % 2 === 1);
const lit = (x, y, z) => ((x * 31 + z * 17 + y * 7) % 5 === 0);

for (const [k, { ground, roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const T = top.get(k);
  // foundation: solid from y 0 up to the storey grid, under every cell (ground is at most 2 here)
  for (let y = 0; y < FLOOR0; y++) put(x, y, z, "stone_bricks");
  if (!perim(x, z)) {
    // no interior: a floor slab per storey and a roof deck; the air between is the rooms
    for (let y = FLOOR0; y < T - 1; y += 4) put(x, y, z, "smooth_stone");
    put(x, T - 1, z, "smooth_stone");
    // roof plant on a few cells, copper boxes
    if ((x % 6 === 2) && (z % 5 === 1)) put(x, T, z, "oxidized_copper");
    continue;
  }
  for (let y = FLOOR0; y <= T; y++) {
    const off = (y - FLOOR0) % 4, band = Math.floor((y - FLOOR0) / 4);
    if (y === T) put(x, y, z, "smooth_quartz");                         // parapet coping
    else if (y === T - 1) put(x, y, z, "smooth_quartz");                // cornice
    else if (off === 0) put(x, y, z, y === FLOOR0 ? "stone_bricks" : "smooth_quartz");   // plinth, then storey lines
    else if (off === 1 || off === 2) {
      if (door && x === door.x && z === door.z && band === 0) {
        const half = y === FLOOR0 + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else if (windowAt(x, z)) {
        if (band === 0) put(x, y, z, "glass");                          // shopfront glazing
        else put(x, y, z, "glass_pane", glassPane(x, z));
      } else put(x, y, z, "bricks");
    } else put(x, y, z, "bricks");                                       // spandrel under the window
  }
}

// warm light behind some windows: glowstone on the inside cell, where the room is
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (!perim(x, z) || corner(x, z)) continue;
  const T = top.get(k);
  for (let y = FLOOR0; y <= T - 2; y++) {
    const off = (y - FLOOR0) % 4, band = Math.floor((y - FLOOR0) / 4);
    if (!(off === 1 || off === 2) || !windowAt(x, z) || !lit(x, y, z)) continue;
    if (door && x === door.x && z === door.z) continue;
    const [ix, iz] = exN(x, z) ? [x, z + 1] : exS(x, z) ? [x, z - 1] : exW(x, z) ? [x + 1, z] : [x - 1, z];
    if (!inF(ix, iz) || perim(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153899.nbt");
const tiers = {}; for (const t of top.values()) tiers[t] = (tiers[t] || 0) + 1;
console.log("cells", cell.size, "tiers (top y -> cells)", tiers, "door", door, info);
