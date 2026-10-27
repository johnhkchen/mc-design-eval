// Way 912170793: a three-storey brick commercial block (1920s-30s, Eden Terrace / Karangahape Rd type) on an 8 x 6 footprint.
// Street face is z = 0: a shopfront on the ground floor, a recessed door, a stone hood, and glass bays above. Lidar roofs
// are smoothed to two tiers: 9 (two storeys, a cornice) at the front and 12 (three storeys) at the back, with a plant room
// and rooftop units on the taller tier. Perimeter cells are walls (brick piers, glass bays, painted quoins at the corners,
// stone plinth, smooth-stone string courses); interior cells are air between floor slabs at y 1, 5, 9 and the roof cap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170793.cells.json`, "utf8"));   // [x, z, ground, roof]

const PLINTH = "stone_bricks", BAND = "smooth_stone", BRICK = "bricks", QUOIN = "white_concrete", GLASS = "glass_pane";
const SLAB = "smooth_stone", CORE = "stone_bricks", ROOF_UNIT = "light_gray_concrete", LIGHT = "glowstone";
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([8, 24, 6]);
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => foot.has(`${x},${z}`);
const exposed = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
// the core: interior cells with no exterior wall beside them. It is solid, so a window sees a one-cell air gap and
// then the core, never the sky through the far side
const core = (x, z) => !exposed(x, z) && [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]].every(([a, b]) => !exposed(a, b));

// lidar roofs smoothed into two clean tiers: 8-9 -> 9, 11-12 -> 12
const tierOf = (r) => (r <= 9 ? 9 : 12);

for (const [x, z, ground, roof] of cells) {
  const R = tierOf(roof);
  const faces = [["n", !has(x, z - 1)], ["s", !has(x, z + 1)], ["w", !has(x - 1, z)], ["e", !has(x + 1, z)]]
    .filter(([, out]) => out).map(([f]) => f);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;
  const street = z === 0 && faces.includes("n");
  const along = faces.includes("n") || faces.includes("s") ? x : z;

  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, PLINTH);

  for (let y = ground; y < R; y++) {
    if (!perimeter) {
      // the ring of interior cells behind the walls is air between floor slabs (y 1, 5, 9 on the tall tier) with the
      // roof cap on top; the core is solid
      if (core(x, z)) { g.set(x, y, z, CORE); continue; }
      if (y === 1 || y === 5 || (y === 9 && R === 12) || y === R - 1) g.set(x, y, z, SLAB);
      continue;
    }
    if (y === 0 || y === 1) { g.set(x, y, z, PLINTH); continue; }            // base course on the plinth
    if (y === R - 1) { g.set(x, y, z, BAND); continue; }                      // cornice / parapet
    if (y === 5 || (y === 9 && R === 12)) { g.set(x, y, z, BAND); continue; } // storey lines
    if (corner) { g.set(x, y, z, QUOIN); continue; }                          // painted quoins
    if (street) {
      if (x === 3 && (y === 2 || y === 3)) { g.set(x, y, z, "oak_door", { ...DOOR, half: y === 2 ? "lower" : "upper" }); continue; }
      if (x === 3 && y === 4) { g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" }); continue; }
      if (y <= 4) { g.set(x, y, z, GLASS); continue; }                        // shopfront glass
    }
    const bay = along % 2 === 0;                                              // glass bays, brick piers between
    g.set(x, y, z, bay ? GLASS : BRICK);
  }
}

// plant room on the tall tier's back corner, rooftop units beside it
for (const [x, z] of [[6, 3], [7, 3], [6, 4], [7, 4]]) {
  g.set(x, 12, z, BRICK); g.set(x, 13, z, BRICK); g.set(x, 14, z, SLAB);
}
g.set(1, 12, 3, ROOF_UNIT);
g.set(2, 12, 4, ROOF_UNIT);

// warm light behind the shopfront and one upper bay
g.set(4, 1, 2, LIGHT); g.set(5, 1, 2, LIGHT); g.set(4, 1, 6, LIGHT);

const out = `${DIR}/way_912170793.nbt`;
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
