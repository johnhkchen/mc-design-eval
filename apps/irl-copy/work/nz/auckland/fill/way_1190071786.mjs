// Way 1190071786: a two-storey early-20th-century brick shop-top block (Auckland's Mt Eden / Eden Terrace commercial
// row), 3 tiers from the lidar roof heights (R 11 / 10 / 9 / 8). Base course, shopfront with a dark-oak fascia and one
// door at the ground, sash-style windows on piers, stone string courses at the floor lines, a frieze with dentils and
// a parapet coping; warm glowstone behind some glass; a brick chimney on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1190071786.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..6

// roof top R (blocks above y 0) -> the cell's top layer D = R - 1
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, D: roof - 1 });
const at = (x, z) => cell.get(`${x},${z}`);

// Exposed sides: a neighbour outside the footprint, or one whose roof is lower (a setback face).
const NEIGH = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function exposed(x, z) {
  const c = at(x, z); const out = [];
  for (const [d, [dx, dz]] of Object.entries(NEIGH)) {
    const n = at(x + dx, z + dz);
    if (!n || n.D < c.D) out.push(d);
  }
  return out;
}

// What a block is at (x, y, z): [block, state?] or null for air. Built only on footprint cells.
function role(x, y, z) {
  const c = at(x, z); if (!c || y > c.D) return null;
  const sides = exposed(x, z), ring = sides.length > 0;
  if (y === 0) return ["stone_bricks"];                                   // base course / foundation, every cell
  if (y === c.D) return ring ? ["stone_bricks"] : ["smooth_stone"];       // parapet coping on the wall, roof deck inside
  if (y === 4 || (y === 8 && c.D > 8)) return ring ? ["stone_bricks"] : ["smooth_stone"]; // floor slab / string course
  if (!ring) return null;                                                 // interior air behind the walls
  // the face this block sits on: north/south faces run along x, east/west along z; a corner is a pier
  const zFace = sides.includes("N") || sides.includes("S");
  const xFace = sides.includes("E") || sides.includes("W");
  const corner = zFace && xFace;
  const u = zFace ? x : z;
  const bay = !corner && u % 2 === 1;                                     // odd bays are windows, even are piers
  const glassState = zFace ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                           : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  if (y <= 3) {                                                           // ground storey: shopfront
    if (y === 3) return ["dark_oak_planks"];                              // fascia
    return bay ? ["glass_pane", glassState] : ["dark_oak_log", { axis: "y" }]; // glazing at y 1-2, dark-oak piers
  }
  if (y === 5) return bay ? ["stone_bricks"] : ["bricks"];                // window sill / brick pier
  if (y === 9 && c.D === 10) return [u % 2 ? "chiseled_stone_bricks" : "stone_bricks"]; // frieze with dentils
  if (y >= 6 && y <= c.D - 1 && y !== 8) return bay ? ["glass_pane", glassState] : ["bricks"];
  return ["bricks"];
}

const g = new Voxels([10, 24, 7]);
const put = (x, y, z, r) => { if (r) g.set(x, y, z, r[0], r[1]); };
for (let z = 0; z < 7; z++) for (let x = 0; x < 10; x++) for (let y = 0; y < 24; y++) put(x, y, z, role(x, y, z));

// the entrance: one door on the south face of the lower tier, a lintel fascia over it
g.set(8, 1, 6, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(8, 2, 6, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(8, 3, 6, "dark_oak_planks");

// warm light: glowstone on the inside of about one window in three, behind the glass (ground shop and upper storey)
for (let z = 0; z < 7; z++) for (let x = 0; x < 10; x++) {
  const c = at(x, z); if (!c) continue;
  const sides = exposed(x, z); if (!sides.length) continue;
  for (const y of [2, 6]) {
    if (y > c.D - 1) continue;
    const r = role(x, y, z); if (!r || r[0] !== "glass_pane") continue;
    if ((x + z + y) % 3 !== 0) continue;
    const [dx, dz] = NEIGH[sides[0]];
    const ix = x - dx, iz = z - dz;                                       // inward neighbour
    if (!at(ix, iz) || exposed(ix, iz).length) continue;                  // must be interior
    if (role(ix, y, iz)) continue;                                        // must be air
    g.set(ix, y, iz, "glowstone");
  }
}

// roof equipment: a brick flue on the top tier, standing on its roof deck
g.set(2, 11, 2, "bricks"); g.set(2, 12, 2, "bricks");
g.set(2, 13, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1190071786.nbt");
console.log(JSON.stringify(res));
