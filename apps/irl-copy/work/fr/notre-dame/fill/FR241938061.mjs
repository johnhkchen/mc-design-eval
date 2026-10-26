// FR241938061: a residential block of 1823, seven storeys on the west half (roof 28) stepping down to six and five on the
// east (lidar 20-26, snapped to storey tiers). Cream render walls over a stone base course, a slate roof behind a parapet,
// glass windows in a grid, a door on the street (north) face and brick chimneys; some windows lit from behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938061.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const STOREY = 4;                                        // blocks per storey: seven storeys make the lidar's 28
const tier = (r) => Math.round(r / STOREY) * STOREY;     // lidar noise into flat storey tiers
const TOP = new Map(), GROUND = new Map();               // "x,z" -> top surface height (air above it); lowest ground
for (const [x, z, ground, r] of cells) { TOP.set(`${x},${z}`, tier(r)); GROUND.set(`${x},${z}`, ground); }
const top = (x, z) => TOP.get(`${x},${z}`) ?? -1;       // -1 outside the footprint: outdoors
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];        // N, S, W, E faces (north is the street)
// the faces of a cell at height y that look onto open air (outside, or a neighbour that stands lower there)
const exposed = (x, y, z) => SIDES.flatMap((d, f) => (y >= top(x + d[0], z + d[1]) ? [f] : []));

const WALL = "smooth_quartz", BAND = "stone_bricks", ROOF = "deepslate_tiles", FLOOR = "spruce_planks";
const BRICK = "bricks", GLASS = "glass_pane";
const g = new Voxels([8, 44, 7]);
const panes = [];
const DOOR = [3, 1];                                     // on the north face, the street side

const cellsOf = [...TOP.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of cellsOf) {
  const t = top(x, z), ground = GROUND.get(`${x},${z}`);
  for (let y = 0; y < ground; y++) g.set(x, y, z, BAND);          // foundation up to the lowest ground under the cell
  for (let y = 0; y < t - 1; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) { if (y % STOREY === 0) g.set(x, y, z, FLOOR); continue; }  // interior: a floor per storey, air between
    const band = y % STOREY;                             // 0 string course, 1-2 window band, 3 lintel
    if (band === 0) g.set(x, y, z, BAND);
    else if (band === 3 || faces.length > 1 || (faces[0] < 2 ? x : z) % 2) g.set(x, y, z, WALL);   // piers and corners
    else { g.set(x, y, z, GLASS); panes.push([x, y, z, faces[0]]); }
  }
  g.set(x, t - 1, z, ROOF);                              // the roof covering, on every cell of the tier
  if (SIDES.some((d) => top(x + d[0], z + d[1]) < 0)) g.set(x, t, z, BAND);   // parapet on the outer edge
}

// two chimney stacks rising from the roof, a brick flue with a stone cap
for (const [x, z] of [[2, 3], [4, 4], [6, 3]]) {
  const t = top(x, z);
  for (let y = t; y < t + 3; y++) g.set(x, y, z, BRICK);
  g.set(x, t + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// the door: a dark oak door on the north face, lintel of stone above it
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const [dx, dz] = DOOR;
g.set(dx, 0, dz, "dark_oak_door", door("lower"));
g.set(dx, 1, dz, "dark_oak_door", door("upper"));
g.set(dx, 2, dz, BAND);

// warm light: a glowstone in the room behind every seventh window
for (const [x, y, z, f] of panes) {
  if (g.get(x, y, z)?.block !== `minecraft:${GLASS}`) continue;
  const [ix, iz] = [x - SIDES[f][0], z - SIDES[f][1]];   // the room behind the glass
  if (top(ix, iz) < 0 || y >= top(ix, iz) - 1 || exposed(ix, y, iz).length) continue;
  if ((3 * x + 5 * z + y) % 7 === 0) g.set(ix, y, iz, "glowstone");
}

// glass panes join their neighbours (panes, piers, lights), as vanilla panes do
for (const [x, y, z] of panes) {
  if (g.get(x, y, z)?.block !== `minecraft:${GLASS}`) continue;
  const on = (dx2, dz2) => (g.get(x + dx2, y, z + dz2) ? "true" : "false");
  g.set(x, y, z, GLASS, { north: on(0, -1), south: on(0, 1), west: on(-1, 0), east: on(1, 0), waterlogged: "false" });
}

g.save(`${DIR}/FR241938061.nbt`);
