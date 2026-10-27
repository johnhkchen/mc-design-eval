// Way 912170822, Mt Eden / Eden Terrace: a two-storey interwar brick shop-and-office block with a cream
// plaster band course, a ground-floor shopfront and a flat roof behind a parapet, plus a small lift/plant room.
// Footprint 10 x 7 (cells from the lidar), roof 11 blocks above lowest ground (parapet top at y 10).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170822.cells.json", "utf8"));
const g = new Voxels([10, 23, 7]);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                   // east, west, south, north (+z is south)

const WIN_ZONES = [[2, 3], [6, 8]];                                 // ground-storey and upper-storey glazing rows
const inWinZone = (y) => WIN_ZONES.some(([a, b]) => y >= a && y <= b);
const panes = [];                                                  // glass panes; their connections are set last

// the outward faces of each footprint cell, and the wall bays along each edge
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isCorner = (exp) => exp.length > 1;
const bayOf = (x, z, exp) => {
  const [dx, dz] = exp[0];
  return dz !== 0 ? x : z;                                        // a south/north wall runs along x, an east/west one along z
};
const isWindowBay = (x, z, exp) => bayOf(x, z, exp) % 3 !== 0;   // two glazed bays, then a brick pier

// the front is the north face (z 0): the shopfront on x 1 and 3, the entrance on x 2
for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;                                            // 10: the parapet's top block; the roof surface is at 11
  const exp = exposed(x, z);
  if (!exp.length) {                                               // interior: foundation, ground floor, floor slab, roof slab
    for (let y = 0; y < ground; y++) g.set(x, y, z, "cobblestone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, top, z, "smooth_stone");
    continue;
  }
  const corner = isCorner(exp);
  const bay = corner ? null : isWindowBay(x, z, exp);
  for (let y = 0; y <= top; y++) {
    if (y === 0) { g.set(x, y, z, "cobblestone"); continue; }    // plinth of rubble
    if (y === 1) { g.set(x, y, z, "stone_bricks"); continue; }     // base course
    if (y === 4) { g.set(x, y, z, z === 0 && x >= 1 && x <= 3 ? "red_terracotta" : "quartz_block"); continue; }   // lintel band; shop awning on the front
    if (y === 5) { g.set(x, y, z, "smooth_stone"); continue; }    // storey string course
    if (y === 9) { g.set(x, y, z, "quartz_block"); continue; }    // cornice
    if (y === top) { g.set(x, y, z, "bricks"); continue; }        // parapet
    if (inWinZone(y) && bay) { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); continue; }
    g.set(x, y, z, "bricks");                                     // brick pier or spandrel
  }
  if (z === 0 && (x === 1 || x === 3)) for (const y of [2, 3]) { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }   // shopfront glass
  if (z === 0 && x === 2) { g.set(x, 3, z, "glass_pane"); panes.push([x, 3, z]); }                                       // transom over the entrance
}

// the entrance: an oak door (lower and upper halves) on the plinth course, under the glass transom
g.set(2, 1, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light: lanterns on the ground-floor floor, glowstone on the upper floor, set behind some windows
const inward = (x, z, exp) => { const [dx, dz] = exp[0]; return [x - dx, z - dz]; };
let n = 0;
for (const [x, z, ground, roof] of cells) {
  const exp = exposed(x, z);
  if (!exp.length || isCorner(exp)) continue;
  if (!isWindowBay(x, z, exp)) continue;
  const [ix, iz] = inward(x, z, exp);
  if (!has(ix, iz) || exposed(ix, iz).length) continue;           // only a true interior cell
  n++;
  if (n % 2 === 0) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (n % 3 === 0) g.set(ix, 6, iz, "glowstone");
}

// lift and plant room on the roof, on the interior cells (6..7, 3..4), walls y 11-12, roof slab at y 13
for (let x = 6; x <= 7; x++) for (let z = 3; z <= 4; z++) {
  for (let y = 11; y <= 12; y++) g.set(x, y, z, "bricks");
  g.set(x, 13, z, "stone_bricks");
}

// glass panes connect to the neighbouring non-air block on each side, as a placed pane would
for (const [x, y, z] of panes) {
  const c = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170822.nbt");
console.log("built", g.count(), "blocks");
