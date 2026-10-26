import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1614 17th St NW (Dupont Circle): a 1910s Renaissance Revival apartment house. Red brick walls, limestone (calcite)
// string courses and cornice, a 3x3 central pavilion one storey above the body, a low east wing. The front is the
// z = 0 face, where the entrance is.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74274.cells.json`, "utf8"));
const W = 11, D = 8, H_MAX = 24;

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// lidar tiers, de-noised: the pavilion (roof 12) stands at 12, the body (10-11) at 10, the east wing (2-3) at 3
const topOf = (x, z) => {
  const c = foot.get(`${x},${z}`); if (!c) return 0;
  return c.roof >= 12 ? 12 : c.roof <= 3 ? 3 : 10;
};

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward-facing sides of row y of a cell: a neighbour that is outside the footprint or lower than this row
const exposed = (x, z, y) => NB.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);

// rows: 0 plinth, 3/6 string courses (and floor slabs), 9 cornice line of the body, 10 attic windows of the pavilion
const FLOOR = new Set([0, 3, 6, 9]);
const WIN = new Set([1, 2, 4, 5, 7, 8, 10]);
const portico = (x, z) => z === 0 && x >= 5 && x <= 7;   // the entrance bay: piers, door, dark canopy

const g = new Voxels([W, H_MAX, D]);
const glazed = [];

for (const [key, { ground }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const top = topOf(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");   // foundation under a sloping lot (none here: ground is 0)
  for (let y = ground; y < top; y++) {
    const faces = exposed(x, z, y);
    if (y === top - 1) { g.set(x, y, z, faces.length ? "calcite" : "stone"); continue; }   // cornice ring, roof deck
    if (!faces.length) { if (FLOOR.has(y)) g.set(x, y, z, "smooth_stone"); continue; }     // air gap, floor slabs
    if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }                        // plinth
    if (FLOOR.has(y)) { g.set(x, y, z, "calcite"); continue; }                             // string course
    if (WIN.has(y) && (x + z) % 2 === 1 && !(portico(x, z) && y <= 2)) { glazed.push([x, y, z, faces]); continue; }
    g.set(x, y, z, "bricks");
  }
}

// glass panes: arms run along the wall they sit in, so a pane reads as a sash, not a post
for (const [x, y, z, faces] of glazed) {
  const onZ = faces.some(([, dz]) => dz !== 0);
  const state = onZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  g.set(x, y, z, "glass_pane", state);
}
// warm glass: glowstone in the air gap behind a scattering of windows (never in a floor row)
for (const [x, y, z, faces] of glazed) {
  if ((x * 3 + z * 5 + y) % 9 !== 0) continue;
  const [dx, dz] = faces[0];
  const bx = x - dx, bz = z - dz;
  if (!g.get(bx, y, bz)) g.set(bx, y, bz, "glowstone");
}

// entrance: a dark canopy over the door, the door with its upper half, and a lamp in the hall behind it
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(6, 1, 0, "dark_oak_door", { ...door, half: "lower" });
g.set(6, 2, 0, "dark_oak_door", { ...door, half: "upper" });
for (const x of [5, 6, 7]) g.set(x, 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(6, 1, 1, "glowstone");

// roof: a brick stack on the body and an air-conditioning unit on the deck
g.set(2, 10, 6, "bricks"); g.set(2, 11, 6, "bricks");
g.set(7, 10, 1, "iron_block");

const { blocks, palette } = g.save(`${DIR}/DC74274.nbt`);
console.log(JSON.stringify({ blocks, palette, glazed: glazed.length }));
