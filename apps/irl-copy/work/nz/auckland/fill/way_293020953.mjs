// Way 293020953: a two-storey brick commercial block with a basalt plinth, a one-storey lower wing on its south-west
// side, and a shopfront entrance on the north face. Built only on the footprint cells: a foundation fill from y 0 to
// each cell's ground, floor slabs at the ground, at the belt (y 4) and under the roof deck, a one-block shell with
// glass in piers of white concrete, and an open air gap behind the glass. The lidar roof is smoothed into two tiers
// (8 and 7); the 5 and 6 cells are lidar noise on the wing edge, so they join the 7 tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020953.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020953.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(key(x, z), { ground, roof: roof >= 8 ? 8 : 7 });
const inF = (x, z) => F.has(key(x, z));

// minecraft facings: north is -z, east is +x
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

const SIZE = [22, 21, 17];
const g = new Voxels(SIZE);
const kind = new Map();          // cell key -> "exterior" | "interior", for the post-passes
const glass = [];                // glass panes, for the connection pass

const isExterior = (x, z) => exposed(x, z).length > 0;

// the entrance: a door in the north face, on the lower ground near the middle of the street front
const ENTRANCE = { x: 16, z: 0, facing: "north" };

// 1. the massing: foundation, floors, the shell, the roof deck and its cornice
for (const [k, { ground: g0, roof: R }] of F) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z), exterior = ex.length > 0, corner = ex.length >= 2;
  kind.set(k, exterior ? "exterior" : "interior");
  const top = R - 1;                              // the roof deck's y; the solid top of the cell is R - 1

  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");                       // foundation to ground
  g.set(x, g0, z, exterior ? "stone_bricks" : "smooth_stone");                       // ground floor slab / plinth
  const isEntrance = x === ENTRANCE.x && z === ENTRANCE.z;
  if (4 > g0 && 4 < top) {                                                           // belt and first floor slab
    if (isEntrance) g.set(x, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });  // the canopy hood over the door
    else g.set(x, 4, z, exterior ? "stone_bricks" : "smooth_stone");
  }
  g.set(x, top, z, exterior ? "stone_bricks" : "smooth_stone");                      // roof deck

  if (exterior) {
    for (let y = g0 + 1; y < top; y++) {
      if (y === 4) continue;                       // the belt was placed above
      // bays of four along each face: a pier, two windows, then a brick panel; corners are piers
      const bay = (ex.includes("north") || ex.includes("south") ? x : z) % 4;
      const pier = corner || bay === 0;
      const panel = !corner && bay === 3;
      const isEntrance = x === ENTRANCE.x && z === ENTRANCE.z;
      if (isEntrance && (y === g0 + 1 || y === g0 + 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: ENTRANCE.facing, half: y === g0 + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isEntrance && y === 3) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; } // the canopy hood over the door
      if (y < 4) {                                 // ground storey: shopfront glass in stone piers, brick panels
        if (pier || isEntrance) g.set(x, y, z, "stone_bricks");
        else if (panel) g.set(x, y, z, "bricks");
        else { g.set(x, y, z, "glass_pane"); glass.push([x, y, z]); }
      } else {                                     // upper storey: windows in white concrete piers, brick panels
        if (pier) g.set(x, y, z, "white_concrete");
        else if (panel) g.set(x, y, z, "bricks");
        else { g.set(x, y, z, "glass_pane"); glass.push([x, y, z]); }
      }
    }
    // the cornice: outward-facing stairs on each face, a full block on the corners
    if (corner) g.set(x, R, z, "stone_bricks");
    else g.set(x, R, z, "stone_brick_stairs", { facing: ex[0], half: "bottom", shape: "straight", waterlogged: "false" });
  }
}

// 2. warm lights behind some glass: lanterns on the shopfront floor, glowstone in the upper storey
for (const [x, y, z] of glass) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0], [dx, dz] = DIRS[OPP[d]];      // the step inward from the glass
  const ix = x + dx, iz = z + dz;
  if (!inF(ix, iz) || isExterior(ix, iz)) continue;
  if (y < 4 && (x + z) % 2 === 0) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if (y >= 5 && (x + z) % 3 === 0) g.set(ix, y, iz, "glowstone");
}

// 3. the roof: two iron units on the main tier
const units = [[11, 7], [12, 7]].filter(([x, z]) => inF(x, z) && F.get(key(x, z)).roof === 8 && !isExterior(x, z));
for (const [x, z] of units) g.set(x, 8, z, "iron_block");

// 4. pane connections: a pane joins the wall cells beside it on the same course, as it does in the world
for (const [x, y, z] of glass) {
  const state = {};
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    state[name] = inF(nx, nz) && isExterior(nx, nz) && g.get(nx, y, nz) ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", { ...state, waterlogged: "false" });
}

const stats = g.save(OUT);
console.log(`way_293020953: ${cells.length} footprint cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
