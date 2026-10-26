// FR245184794: a commercial block of cream limestone (Haussmann-style render-free stone, a zinc-grey mansard-colour roof).
// The record says one storey, but the lidar tops (14-32 blocks) decide the massing: a 16-block body (three storeys of
// five blocks), a 22-block step where the lidar reads 20-23, and a 32-block tower along the west edge, snapped to those
// three flat tiers. Each storey is five blocks: a band row at its floor and a lintel row above the windows, three rows
// of glass between. The ground floor is a shopfront with a door on the north face; upper storeys are glass-pane
// windows between calcite piers. The footprint is a one-cell ring of walls round air, with a floor slab per storey and
// a roof deck of deepslate tiles behind a calcite parapet, so each window has air behind it and a few warm lights
// stand in that air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184794.cells.json", "utf8"));

const STONE = "calcite";           // Paris limestone, cream: walls, piers, parapet
const BAND = "smooth_sandstone";   // floor bands, lintels, cornice
const PLINTH = "stone_bricks";     // base course
const FLOOR = "smooth_stone";      // storey slabs and the ceiling under the roof
const ROOF = "deepslate_tiles";    // zinc-grey roof covering
const SHOP = "glass";              // shopfront glazing
const PANE = "glass_pane";         // upper-storey windows
const DOOR = "dark_oak_door";      // shop door
const CHIM = "bricks";             // roof stacks
const LAMP = "glowstone";          // warm light behind the west glass
const LAMP2 = "shroomlight";       // warm light behind the east glass

const byXZ = new Map();
for (const [x, z, gr, r] of cells) byXZ.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => byXZ.has(`${x},${z}`);
const ring = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Lidar tops -> three flat tiers (a setback stepping down from the west tower)
const tier = (r) => (r >= 24 ? 32 : r >= 20 ? 22 : 16);
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on the x faces: runs along z
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // on the z faces: runs along x

const H = 48;
const g = new Voxels([9, H, 17]);

for (const [x, z, gr, r] of cells) {
  const T = tier(r);
  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);                       // foundation under a sloped ground
  if (!ring(x, z)) {                                                          // interior: slabs and the roof deck only
    for (let y = gr; y < T; y++) {
      if (y === T - 1) g.set(x, y, z, ROOF);
      else if (y === T - 2 || (y % 5 === 0 && y <= T - 3)) g.set(x, y, z, FLOOR);
    }
    continue;
  }
  const xFace = !inFp(x - 1, z) || !inFp(x + 1, z);                          // a wall facing west or east, running along z
  const zFace = !inFp(x, z - 1) || !inFp(x, z + 1);                          // a wall facing north or south, running along x
  const corner = xFace && zFace;
  const a = xFace ? z : x;                                                    // position along the face: even = pier, odd = window
  const pane = xFace ? PANE_EW : PANE_NS;
  for (let y = gr; y < T; y++) {
    const k = Math.floor(y / 5), m = y % 5;
    if (y === 0) g.set(x, y, z, PLINTH);
    else if (y === T - 1) g.set(x, y, z, STONE);                             // parapet
    else if (y === T - 2 || m === 0 || m === 4) g.set(x, y, z, BAND);        // floor bands, lintels, cornice
    else if (corner || a % 2 === 0) g.set(x, y, z, STONE);                   // piers
    else if (k === 0) g.set(x, y, z, SHOP);                                  // shopfront glazing
    else g.set(x, y, z, PANE, pane);                                         // upper windows
  }
}

// Entrance: the shop door on the north face, in the pier at x 4
g.set(4, 1, 0, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 0, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Roof stacks on the 16 body
g.set(2, 16, 4, CHIM); g.set(2, 17, 4, CHIM);
g.set(6, 16, 12, CHIM); g.set(6, 17, 12, CHIM);

// Warm lights in the air behind the glass: a few per storey, on the west and east faces
for (const [x, z, , r] of cells) {
  if (x !== 1 && x !== 7) continue;
  if (z < 1 || z > 15) continue;
  const T = tier(r);
  for (let k = 0; 5 * k + 3 < T - 2; k++) {
    const y = 5 * k + 2;
    if (x === 1 && z % 6 === 1) g.set(x, y, z, LAMP);
    if (x === 7 && z % 6 === 4) g.set(x, y, z, LAMP2);
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184794.nbt";
console.log(g.save(out));
