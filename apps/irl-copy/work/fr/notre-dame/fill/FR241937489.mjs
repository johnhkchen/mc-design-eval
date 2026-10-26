// FR241937489: Hôtel Les Rives de Notre-Dame, a commercial block on the Ile de la Cite's quai (Haussmann-era, cream
// limestone, a zinc-slate roof). The lidar tops are one 24-block main body with a 12-block pavilion at the north-west
// corner; they snap to those two tiers (smoothing the 20-23 noise). Each storey is four blocks (a band line every
// fourth row); the ground floor is a shopfront with a door on the north face, upper storeys are glass-pane windows with
// sill rows and a balcony rail on the second floor. The footprint is a one-cell ring of walls round air with a floor
// slab per storey, so each window has air behind it and a few warm lights stand in that air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937489.cells.json", "utf8"));

const BODY = "calcite";            // Paris limestone, cream
const BAND = "smooth_sandstone";   // storey lines and cornice
const PLINTH = "stone_bricks";     // foundation
const FLOOR = "smooth_stone";      // storey slabs
const ROOF = "deepslate_tiles";    // slate roof
const SHOP = "glass";              // shopfront glazing
const PANE = "glass_pane";         // upper-storey windows
const RAIL = "iron_bars";          // second-floor balcony rail
const CHIM = "bricks";             // chimney stacks

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const ring = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Lidar tops -> two clean tiers: the 12-block pavilion (under 18) and the 24-block main body
const snap = (r) => (r < 18 ? 12 : 24);

const H = 40;
const g = new Voxels([8, H, 18]);
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z

for (const [x, z, , r] of cells) {
  const T = snap(r);
  const edge = ring(x, z);
  const north = !inFp(x, z - 1), south = !inFp(x, z + 1), west = !inFp(x - 1, z), east = !inFp(x + 1, z);
  const alongX = north || south;                  // the face runs along x, so its windows are placed by x
  const along = alongX ? x : z;
  const face = north || south || west || east;
  const windowCol = face && along % 3 === 1;      // one window column every three cells, as a Haussmann bay
  const door = north && x === 4 && z === 0;       // the hotel's entrance on the street face

  g.set(x, 0, z, PLINTH);                         // foundation: the lowest ground is y 0 under every cell

  for (let y = 1; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, edge ? BODY : ROOF); continue; }   // parapet on the walls, slate inside
    if (y === T - 2) { g.set(x, y, z, edge ? BAND : FLOOR); continue; }  // cornice on the walls, ceiling slab inside
    if (!edge) { if (y % 4 === 0) g.set(x, y, z, FLOOR); continue; }     // interior: only the storey slabs
    if (y % 4 === 0) { g.set(x, y, z, BAND); continue; }                 // storey line
    if (face && y <= 3) {                                                // shopfront: glazed bays between stone pillars
      if (door && y <= 2) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (door && y === 3) { g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }  // hood over the door
      if (along % 3 !== 0) { g.set(x, y, z, SHOP); continue; }
      g.set(x, y, z, BODY); continue;                                    // pillar
    }
    if (windowCol && y % 4 === 1) { g.set(x, y, z, y === 5 ? RAIL : BODY); continue; }  // sill row; the second floor's rail
    if (windowCol) { g.set(x, y, z, PANE, alongX ? PANE_NS : PANE_EW); continue; }     // window glass
    g.set(x, y, z, BODY);
  }
}

// Chimney stacks on the main body's interior roof
for (const [x, z] of [[2, 3], [5, 12]]) { g.set(x, 24, z, CHIM); g.set(x, 25, z, CHIM); }

// Warm lights in the air behind some street windows (the storey-two and storey-three bays), so the facade glows at dusk
for (const [x, y, z] of [[1, 6, 1], [4, 6, 1], [1, 10, 1], [4, 14, 1]]) g.set(x, y, z, "shroomlight");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937489.nbt");
