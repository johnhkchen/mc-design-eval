// Annex, Mt Eden / Eden Terrace fringe: a 1970s-80s three-storey office block over a shopfront ground floor.
// Massing from the lidar roof: the core (roof 9-10) carries two storeys and a parapet at y 10; the mid and edge
// (roof 7-8, 5-6) step down to one storey at y 7 and y 6. Walls are white concrete with light-gray string courses
// and mullions, blue-tinted glass in the window bays, a stone plinth. Interior is air with one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769194871.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..20, z 0..14

const g = new Voxels([21, 22, 15]);
const BASE = 3;                                      // ground-floor slab and first course above the plinth, for every cell
const topFor = (roof) => (roof >= 9 ? 10 : roof >= 7 ? 7 : 6);   // flat tiers: core two storeys, mid and edge one storey
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: topFor(roof) }]));
const at = (x, z) => fp.get(`${x},${z}`);

// a wall cell where the cell next to it is outside the footprint, or stands lower (a setback face)
const boundary = (x, z, top) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < top; });
const nextToBoundary = (x, z, top) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = at(x + dx, z + dz); return n && n.top === top && boundary(x + dx, z + dz, top); });

const DOOR = [10, 0];                                // entrance on the north face, centre of the street front
const pier = (x, z, every) => (x + z) % every === 0;

for (const [x, z, , roof] of cells) {
  const top = topFor(roof), bnd = boundary(x, z, top), roofY = top - 1;
  // foundation fill from y 0 up to the cell's ground, then a stone plinth to the first course
  for (let y = 0; y < BASE; y++) g.set(x, y, z, "stone_bricks");

  if (!bnd) {
    // interior: a floor slab per storey and the roof; the rest is air behind the glass
    g.set(x, BASE, z, "smooth_stone");
    if (top === 10) g.set(x, 7, z, "smooth_stone");
    g.set(x, roofY, z, "light_gray_concrete");
    // warm light just inside a window bay: ground floor and the upper storey
    if (nextToBoundary(x, z, top) && (x + 2 * z) % 5 === 1) g.set(x, 4, z, "glowstone");
    if (top === 10 && nextToBoundary(x, z, top) && (x + 2 * z) % 7 === 3) g.set(x, 8, z, "glowstone");
    // roof plant on the core roof, a few units
    if (top === 10 && x % 5 === 1 && z % 5 === 2 && !nextToBoundary(x, z, top)) g.set(x, 10, z, "iron_block");
    continue;
  }

  for (let y = BASE; y < top; y++) {
    let block = "white_concrete";
    if (y === roofY) block = "smooth_stone";                              // parapet cap / roof edge
    else if (y === BASE) block = "polished_andesite";                     // base course
    else if (y <= 5) block = pier(x, z, 4) ? "light_gray_concrete" : "light_blue_stained_glass";  // shopfront
    else if (top === 10 && y === 6) block = "light_gray_concrete";        // storey string course
    else if (top === 10 && y === 7) block = "white_concrete";             // upper spandrel
    else if (top === 10 && y === 8) block = pier(x, z, 3) ? "light_gray_concrete" : "light_blue_stained_glass";
    g.set(x, y, z, block);
  }
}

// entrance: a stair step up from the street, the door, and a lintel over it
const [dx, dz] = DOOR;
g.set(dx, 2, dz, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
g.set(dx, BASE, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, BASE + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dx, BASE + 2, dz, "light_gray_concrete");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_769194871.nbt";
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
