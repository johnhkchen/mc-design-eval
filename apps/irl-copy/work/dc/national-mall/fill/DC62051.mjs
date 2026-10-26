// 1301 Massachusetts Ave NW: a 1920s brick elevator apartment block (Georgian Revival): red brick walls, limestone
// quoins, a band over every floor deck, a glazed bay rhythm on each face, a cornice coping, and a taller setback core.
// The lidar roof heights are the massing: an 11-high podium with a 13-high core (and a 12-high tier at the north).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62051.cells.json`, "utf8"));

// roof height per footprint cell; -1 outside the footprint, so a side with nothing beside it is exposed
const H = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const roofAt = (x, z) => H.get(`${x},${z}`) ?? -1;
const solid = (x, z, y) => y < roofAt(x, z);                  // the cell holds material at row y
const SIDES = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const INWARD = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] };

const BAND = [4, 6, 8, 10];                                   // a limestone band over each floor deck
const WINDOW = [2, 5, 7, 9, 11];                              // glass rows (2 = the ground floor)
const ENTRY = (x, z, y) => z === 1 && x >= 3 && x <= 5 && y >= 1 && y <= 3;   // the street door with its pilasters

const g = new Voxels([15, 25, 18]);
// the lowest ground is 0 under every cell, so there is no foundation to fill; rows run from y 0 up to each roof
for (const [x, z, , r] of cells) {
  for (let y = 0; y < r; y++) {
    const ex = Object.keys(SIDES).filter((d) => !solid(x + SIDES[d][0], z + SIDES[d][1], y));
    const top = y === r - 1;
    if (top) { g.set(x, y, z, ex.length ? "smooth_sandstone" : "stone"); continue; }    // coping, else the roof
    if (!ex.length) { if (y === 0 || BAND.includes(y)) g.set(x, y, z, "stone"); continue; }  // interior decks; air between
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                             // plinth
    if (BAND.includes(y)) { g.set(x, y, z, y === 4 || y === 10 ? "smooth_sandstone" : "bricks"); continue; }  // limestone string courses, brick spandrels
    if (ENTRY(x, z, y)) {
      if (x === 4 && y <= 2) g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "smooth_sandstone");
      continue;
    }
    const corner = ex.some((d) => d === "n" || d === "s") && ex.some((d) => d === "e" || d === "w");
    if (corner) { g.set(x, y, z, "smooth_sandstone"); continue; }                         // limestone quoins
    const alongX = ex.includes("n") || ex.includes("s");
    const bay = alongX ? x : z;
    if (!WINDOW.includes(y) || bay % 3 === 0) { g.set(x, y, z, "bricks"); continue; }     // piers and spandrels
    g.set(x, y, z, "glass_pane", alongX ? { north: "false", south: "false", east: "true", west: "true" }
                                        : { north: "true", south: "true", east: "false", west: "false" });
    // some windows show a warm lantern hung in the room behind the glass
    if (y > 2 && (x * 7 + z * 3 + y) % 4 === 0) {
      const [dx, dz] = INWARD[ex[0]], ix = x + dx, iz = z + dz;
      if (roofAt(ix, iz) > y && solid(ix, iz, y + 1)) g.set(ix, y, iz, "lantern", { hanging: "true" });
    }
  }
}

// two mechanical penthouses on the podium roof (a 2 x 2 box, two high)
for (const [x0, z0] of [[11, 6], [2, 11]])
  for (let y = 11; y <= 12; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) g.set(x0 + dx, y, z0 + dz, "stone_bricks");

const out = g.save(`${DIR}/DC62051.nbt`);
console.log(`DC62051.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
