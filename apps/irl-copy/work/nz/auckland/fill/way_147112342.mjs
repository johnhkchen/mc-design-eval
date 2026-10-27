// Harbour Royal, Eden Terrace side of the CBD (way 147112342): a 1980s hotel tower of fifteen storeys, four blocks each, on
// a plinth of stone with a glazed lobby. The lidar roof is smoothed into two flat tiers: 60 for the body and a 65 penthouse
// over the core (a 5-block plant storey). Concrete piers and spandrels frame tinted glass, a stone cornice caps the body,
// and a few windows are lit from behind. Each cell is solid from y 0 to its ground, then walls, one air cell behind the
// glass, and a floor slab per storey; nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147112342.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..32, z 0..33

const g = new Voxels([33, 77, 34]);
const key = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); lidar.set(key(x, z), r); }
const inF = (x, z) => ground.has(key(x, z));

// 1. flat tiers from the lidar roof: the median of the 3x3 neighbourhood drops speckle, then two levels
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) vals.push(lidar.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  top.set(key(x, z), m >= 63 ? 65 : 60);
}

// outward faces of a footprint cell: [dx, dz] of each neighbour outside the footprint
const outward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inF(x + dx, z + dz));
const isEdge = (x, z) => outward(x, z).length > 0;

// storeys: a ground storey from the cell's ground to y 12, then floor lines every 4 blocks from 12 (16, 20 ... the podium
// cornice at 16 is stone)
const GROUND_TOP = 12;
const isLine = (y) => y >= GROUND_TOP && (y - GROUND_TOP) % 4 === 0;

// 2. lit windows: a glowstone one cell inside, on the floor line, behind a pane (only on single-face windows)
const lit = new Set();
const isPier = (x, z, y, face) => {
  if (face.length !== 1) return true;                       // corners are piers
  const [dx] = face[0];
  return dx !== 0 ? z % 3 === 0 : x % 3 === 0;             // E/W faces key on z, N/S faces key on x
};
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const face = outward(x, z);
  if (face.length !== 1) continue;
  const [dx, dz] = face[0];
  for (let y = GROUND_TOP + 5; y < top.get(key(x, z)) - 1; y++) {
    if ((y - GROUND_TOP) % 4 !== 1 || isPier(x, z, y, face)) continue;   // first row of glass, on a floor line
    if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && !isEdge(ix, iz)) lit.add(`${ix},${iz},${y}`);
  }
}

// 3. the facade: stone base and ground-floor glazing, then four-block storeys (line, two rows of glass or piers, spandrel)
const DOOR = [19, 0];                                      // the lobby entrance on the north face, the lowest cell
function facade(x, z, y, face, gr, T) {
  const roof = T - 1, parapet = T;
  if (y === parapet) return ["stone_brick_slab", { type: "bottom" }];
  if (y === gr) return ["stone_bricks"];                  // base course
  if (y < GROUND_TOP) {
    if (y === 11) return ["stone_bricks"];                 // ground-floor lintel
    if (isPier(x, z, y, face)) return ["stone_bricks"];
    return ["light_blue_stained_glass"];
  }
  const rel = (y - GROUND_TOP) % 4;
  if (rel === 0) return [y === 16 ? "stone_bricks" : "smooth_stone"];   // podium cornice at 16
  if (rel === 3) return ["white_concrete"];                // spandrel band
  if (isPier(x, z, y, face)) return ["white_concrete"];
  const [dx] = face[0];
  const st = dx !== 0 ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" };
  return ["light_blue_stained_glass_pane", st];
}

// 4. fill every footprint column
for (const [x, z, gr] of cells) {
  const T = top.get(key(x, z)), face = outward(x, z), edge = face.length > 0;
  // foundation: solid from 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // ground floor slab, then the walls, air, floor lines and roof
  const isDoor = x === DOOR[0] && z === DOOR[1];
  if (isDoor) g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  else g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  for (let y = gr + 1; y <= T; y++) {
    if (y === T) { if (edge) g.set(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }
    if (y === T - 1) { g.set(x, y, z, "gray_concrete"); continue; }
    // the lobby canopy over the entrance: a slab across three cells, carried by posts at its two ends
    if (z === 1 && x >= 18 && x <= 20 && y === gr + 3) { g.set(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }
    if (z === 1 && (x === 18 || x === 20) && y < gr + 3) { g.set(x, y, z, "stone_bricks"); continue; }
    if (edge) {
      if (isDoor && y === gr + 1) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      const [b, st] = facade(x, z, y, face, gr, T);
      g.set(x, y, z, b, st);
      continue;
    }
    if (isLine(y) && y <= T - 2) g.set(x, y, z, "smooth_stone");          // floor slab per storey
    else if (lit.has(`${x},${z},${y}`)) g.set(x, y, z, "glowstone");      // a light behind the glass
  }
}

// 5. roof plant on the 60 body: 2x2x2 units standing on the roof, kept off the crown and the walls
for (const [x0, z0] of [[12, 13], [17, 12], [21, 16], [9, 17]]) {
  const block = [];
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) block.push([x0 + dx, z0 + dz]);
  if (block.every(([x, z]) => inF(x, z) && !isEdge(x, z) && top.get(key(x, z)) === 60)) {
    for (const [x, z] of block) for (let y = 60; y <= 61; y++) g.set(x, y, z, y === 60 ? "light_gray_concrete" : "iron_block");
  }
}

const info = g.save(`${DIR}/way_147112342.nbt`);
console.log(`way_147112342: ${info.blocks} blocks, palette ${info.palette}, lit windows ${lit.size}`);
