// Auckland, Mt Eden / Newton: a two-storey 1920s-30s brick and plaster shop-top block. Dark timber shopfronts on the
// ground floor, brick piers and glass in the upper storey between cream plaster string, sill and cornice courses, a
// parapet cap, a lower rim tier, one recessed door under a canopy, and roof units. Walls are one footprint cell thick
// (the edge cells); the cells inside are air with a floor slab per storey, so each window has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237140.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..22, z 0..53

// Roof: the lidar says 10 across the main block and 8 to 9 along the rim, which reads as one lower tier at 9.
const ROOF = 10, LOW = 9;
const at = new Map();
for (const [x, z, gnd, roof] of cells) at.set(`${x},${z}`, { x, z, gnd, R: roof >= 10 ? ROOF : LOW, out: [], step: [], edge: false });
const cellAt = (x, z) => at.get(`${x},${z}`);

const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N is the -z edge, the street side of the rim
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };      // the step from a facade into the building
for (const c of at.values()) {
  for (const [d, [dx, dz]] of Object.entries(SIDE)) {
    const nb = cellAt(c.x + dx, c.z + dz);
    if (!nb) c.out.push(d);                 // the open air: a facade
    else if (nb.R !== c.R) c.step.push(d); // a tier wall, against the lower or the higher roof
  }
  c.edge = c.out.length + c.step.length > 0;
}

// Storey lines: the ground slab at the cell's ground, a first-floor slab 4 up while a storey and a cornice still fit.
const s2Of = (c) => (c.gnd + 4 <= c.R - 3 ? c.gnd + 4 : null);

// The door: the north facade of the middle of the street-side cells.
const DOOR = cellAt(20, 0);

// What an edge cell shows at height y: a facade with piers, openings and courses.
function skin(c, y, along) {
  const s2 = s2Of(c), top = c.R;
  if (y <= c.gnd) return ["polished_andesite"];                                              // plinth and base course
  if (y === top - 1) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];   // parapet cap
  if (y === top - 2 || y === s2) return ["smooth_quartz"];                                  // cornice and string course
  const pier = ((along % 3) + 3) % 3 === 0;                                                 // one brick or timber pier per 3 cells
  const groundTop = s2 ?? top - 2;
  if (y < groundTop) {                                                                       // the ground floor: shopfront
    if (y === groundTop - 1) return ["smooth_quartz"];                                      // fascia
    return pier ? ["dark_oak_planks"] : ["glass"];
  }
  if (s2 !== null && y === s2 + 1 && top - 2 - s2 >= 3) return pier ? ["bricks"] : ["smooth_quartz"];   // upper sill
  return pier ? ["bricks"] : ["glass"];
}

const g = new Voxels([23, 23, 54]);
const put = (x, y, z, [name, st]) => g.set(x, y, z, name, st);
let lamps = 0, windows = 0;

for (const c of at.values()) {
  const { x, z, gnd, R } = c, s2 = s2Of(c);
  if (!c.edge) {                                 // inside: foundation, floor slabs, a roof deck; air between
    for (let y = 0; y < gnd; y++) put(x, y, z, ["stone"]);
    put(x, gnd, z, ["smooth_stone"]);
    if (s2 !== null) put(x, s2, z, ["smooth_stone"]);
    put(x, R - 1, z, ["stone_bricks"]);
    continue;
  }
  // The footprint's diagonal edges are stair-steps, so most rim cells face two ways: the first open side carries the
  // facade. A tier wall shows above the lower roof beside it, so it takes the same openings.
  const face = c.out[0] ?? c.step[0];
  const along = face === "N" || face === "S" ? x : z;
  for (let y = 0; y < R; y++) {
    if (c === DOOR && c.out.includes("N")) {    // recessed entrance: a door in the glass, a canopy over it
      if (y === gnd + 1) { put(x, y, z, ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]); continue; }
      if (y === gnd + 2) { put(x, y, z, ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }]); continue; }
      if (y === gnd + 3) { put(x, y, z, ["dark_oak_slab", { type: "bottom", waterlogged: "false" }]); continue; }
    }
    const sk = skin(c, y, along);
    put(x, y, z, sk);
    // a warm light behind some glass: the air cell inside the facade, where the building is not walled
    if (sk[0] === "glass") {
      windows++;
      const inn = cellAt(x + IN[face][0], z + IN[face][1]);
      if (inn && !inn.edge && (along + y) % 4 === 0) { g.set(inn.x, y, inn.z, "glowstone"); lamps++; }
    }
  }
}

// Roof units: a 2x2 plant on the main roof, away from the parapet.
let units = 0;
for (const c of at.values()) {
  if (c.edge || c.R !== ROOF || c.x % 6 !== 1 || c.z % 9 !== 5) continue;
  const quad = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]].map(([x, z]) => cellAt(x, z));
  if (quad.some((q) => !q || q.edge || q.R !== ROOF)) continue;
  for (const q of quad) g.set(q.x, ROOF, q.z, "iron_block");
  units++;
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237140.nbt");
console.log(JSON.stringify({ cells: at.size, edge: [...at.values()].filter((c) => c.edge).length, windows, lamps, units, ...stats }));
