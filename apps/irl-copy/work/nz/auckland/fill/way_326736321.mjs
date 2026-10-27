// Mt Eden side of the CBD: a c.1910s Edwardian brick-and-plaster commercial block. Its lidar roof gives three
// tiers (10 = two storeys with a parapet, 8 = a two-storey wing, 4 = a single-storey shop), smoothed to flat tiers.
// The street front is the z 0 side: a dark-oak shopfront with a central door under a canopy. Storeys sit on a stone
// base; a smooth quartz string course and cornice; brick infill with quartz pilasters; glass panes with an air gap
// behind them, lit by lanterns and glowstone; a gray roof deck with a parapet, coping and a rooftop water tank.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326736321.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 15, H = 23, D = 18;
const key = (x, z) => `${x},${z}`;

// Tier from the lidar roof, then the most common tier in each cell's 3x3 footprint neighbourhood (ties go up).
const tierOf = (r) => (r >= 9 ? 10 : r >= 6 ? 8 : 4);
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const tier = new Map();
for (const [x, z] of cells) {
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roof.get(key(x + dx, z + dz)); if (r === undefined) continue;
    const t = tierOf(r); votes.set(t, (votes.get(t) ?? 0) + 1);
  }
  let best = -1, pick = 0;
  for (const [t, n] of votes) if (n > best || (n === best && t > pick)) { best = n; pick = t; }
  tier.set(key(x, z), pick);
}

// A wall face is exposed where the neighbour is outside the footprint, or lower than this height.
const FACES = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];   // N = z 0, the street front
const tOf = (x, z) => tier.get(key(x, z));
const exposed = (x, z, y) => FACES.filter(([, dx, dz]) => { const t = tOf(x + dx, z + dz); return t === undefined || t <= y; });
const DOOR = [5, 0];
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

const g = new Voxels([W, H, D]);
const carved = new Set();      // air gap behind the glass, "x,y,z"
const windows = [];            // {x, z, face}: a window cell, for its lights and its air gap
const glass = [];              // every pane, to connect it after the blocks are in place

for (const [x, z] of cells) {
  const t = tier.get(key(x, z));
  g.set(x, 0, z, "stone_bricks");                                       // base course, the lowest ground
  for (let y = 1; y < t; y++) {
    const faces = exposed(x, z, y);
    if (!faces.length) {                                                // interior: floor slabs and the roof deck only
      if (y === t - 1) g.set(x, y, z, "gray_concrete");
      else if (y === 4 && t >= 8) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2)) {       // the entrance
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const north = faces.some((f) => f[0] === "N");
    const corner = faces.length > 1;
    const along = faces[0][0] === "N" || faces[0][0] === "S" ? x : z;
    const win = !corner && along % 3 !== 0;                             // piers at corners, bays of two panes between
    const cornice = t === 10 ? 8 : t - 1;
    let block;
    if (y === 3 && z === 0 && x >= 4 && x <= 6) block = "dark_oak_planks";   // canopy over the shopfront
    else if (y === cornice) block = "smooth_quartz";
    else if (t === 10 && y === 9) block = "bricks";                      // parapet
    else if (y <= 2) block = win ? "glass_pane" : north ? "dark_oak_planks" : "bricks";
    else if (y === 3) block = "bricks";                                  // ground-floor lintel
    else if (y === 4) block = "smooth_quartz";                           // string course
    else if (y <= 6) block = win ? "glass_pane" : "smooth_quartz";       // upper pilasters
    else block = "bricks";                                              // spandrel
    if (block === "glass_pane") {
      glass.push([x, y, z]);
      if (faces.length === 1) windows.push({ x, z, face: faces[0][0], y });
    }
    g.set(x, y, z, block, block === "glass_pane" ? {} : undefined);
  }
  if (exposed(x, z, t - 1).length) g.set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });  // coping
}

// Air behind every window: the inward cell is cleared at the window's storeys.
for (const w of windows) {
  const [dx, dz] = INWARD[w.face];
  const ix = w.x + dx, iz = w.z + dz;
  if (!tier.has(key(ix, iz))) continue;
  carved.add(`${ix},${w.y},${iz}`);
}
for (const k of carved) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, "air"); }

// Warm light: lanterns on the shopfront floor, glowstone behind some upper panes; each stands on the floor slab.
for (const w of windows) {
  const [dx, dz] = INWARD[w.face];
  const ix = w.x + dx, iz = w.z + dz;
  if (!tier.has(key(ix, iz))) continue;
  if (w.y === 1 && (w.x + w.z) % 2 === 0) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if (w.y === 5 && (w.x + w.z) % 3 === 0) g.set(ix, 5, iz, "glowstone");
}

// Roof: a rooftop water tank on the gray deck of the two-storey block.
for (const x of [6, 7]) for (const z of [10, 11]) g.set(x, 10, z, "iron_block");

// Panes connect to whatever stands beside them in the wall plane.
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of glass) {
  g.set(x, y, z, "glass_pane", {
    north: solid(x, y, z - 1) ? "true" : "false", south: solid(x, y, z + 1) ? "true" : "false",
    east: solid(x + 1, y, z) ? "true" : "false", west: solid(x - 1, y, z) ? "true" : "false", waterlogged: "false",
  });
}

const out = g.save(`${DIR}/way_326736321.nbt`);
console.log(`way_326736321: ${out.blocks} blocks, ${out.palette} palette entries, ${windows.length} windows`);
