// FR245184458: an Indifférencié block on the Île de la Cité's north side, a 5 x 7 footprint of four Haussmann-style
// storeys in cream limestone with a zinc-grey roof (materials from the 1900s Paris stock; the Notre-Dame quarter).
// The lidar roofs (6-20 blocks, 1.4 blocks a metre) snap to four flat tiers of one-storey steps: 5, 10, 15 and 20 blocks,
// so every storey is 5 blocks and each tier stands on the one below. The ground is a plinth course at y 0; walls start
// one block up. The north street face has a shopfront (glass display bay, stone pillars, a door with a hood); the other
// faces are one-block window bays on one-block piers, with a sill row, two glass rows and a lintel band per storey, and
// an iron-bar balcony rail at the second floor. The interior is air: a floor slab at every storey line, a roof slab at
// the top, and a few lanterns hung from the slabs above so the rooms glow at dusk. Chimneys stand on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184458.cells.json", "utf8"));

const BODY = "calcite";            // cream limestone walls
const BAND = "smooth_sandstone";   // storey lines, lintels and the cornice
const PLINTH = "stone_bricks";     // foundation course
const FLOOR = "smooth_stone";      // storey slabs
const ROOF = "deepslate_tiles";    // slate roof
const SHOP = "glass";              // shopfront glazing
const PANE = "glass_pane";         // upper-storey windows
const RAIL = "iron_bars";          // second-floor balcony rail
const CHIM = "bricks";             // chimney stack
const CANOPY = "stone_brick_slab"; // hood over the door

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);

// Lidar roof heights -> four clean 5-block storey tiers
const tierOf = (r) => (r < 8 ? 5 : r < 13 ? 10 : r < 18 ? 15 : 20);

const g = new Voxels([5, 24, 7]);
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z

for (const [x, z, , r] of cells) {
  const R = tierOf(r);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const edge = north || south || west || east;
  const alongX = north || south;                  // the face runs along x, so its bays are placed by x
  const along = alongX ? x : z;
  const window = edge && along % 2 === 0;         // a glass bay on every other block: the piers between are body stone
  const door = north && x === 4 && z === 0;       // the hotel's entrance on the street face

  g.set(x, 0, z, PLINTH);                         // foundation course: the lowest ground is y 0 under every cell

  for (let y = 1; y <= R - 1; y++) {
    if (y === R - 1) { g.set(x, y, z, edge ? BAND : ROOF); continue; }   // cornice on the walls, slate roof inside
    if (!edge) { if (y % 5 === 4 || y === R - 2) g.set(x, y, z, FLOOR); continue; }   // interior: storey slabs only
    if (y % 5 === 4) { g.set(x, y, z, BAND); continue; }                 // storey line

    if (north && y <= 3) {                                               // shopfront on the street face
      if (door && y <= 2) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (door && y === 3) { g.set(x, y, z, CANOPY, { type: "bottom", waterlogged: "false" }); continue; }
      if (along % 2 === 1) { g.set(x, y, z, SHOP); continue; }            // display glass
      g.set(x, y, z, BODY); continue;                                    // pier
    }
    if (window && y % 5 === 1) { g.set(x, y, z, y === 6 ? RAIL : BODY); continue; }   // sill row; the second floor's rail
    if (window && (y % 5 === 2 || y % 5 === 3)) { g.set(x, y, z, PANE, alongX ? PANE_X : PANE_Z); continue; }   // glass
    g.set(x, y, z, BODY);
  }
}

// Chimney stack on the top tier's interior roof
g.set(3, 20, 1, CHIM); g.set(3, 21, 1, CHIM);

// Lanterns hung from the storey slabs above, so the rooms behind the glass glow at dusk
for (const [x, y, z] of [[2, 3, 1], [3, 8, 1], [2, 3, 2]]) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184458.nbt");
