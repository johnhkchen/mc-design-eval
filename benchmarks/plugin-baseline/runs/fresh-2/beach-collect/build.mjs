// Stage 1 — FORM: site, two stacked offset volumes, glazing, deck, undercroft. Roof comes next (mcd roof --preset cafe).
// Coordinates: x east, y up, z south. Front = NORTH (-z); the sea is SOUTH (+z).
import { Grid, B, carve } from "../../../../../../minecraft-design/tools/src/build.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const HERE = dirname(fileURLToPath(import.meta.url));

const g = new Grid([42, 18, 38]);

// palette by role
const WALL = "white_concrete", TRIM = "smooth_quartz", DARK = "gray_concrete", PLINTH = "gray_concrete";
const WOOD = "birch", DECK = "birch_planks";

// ---- SITE: sand, shoreline, sea -----------------------------------------------------------------------------------
const shore = (x) => 33 + Math.round(Math.sin(x / 4.5) * 1.2 + Math.sin(x / 11) * 1.0);
for (let x = 0; x < 42; x++) for (let z = 0; z < 38; z++) {
  g.set(x, 0, z, "sand");
  if (z >= shore(x)) g.set(x, 1, z, "water", { level: "0" });
  else g.set(x, 1, z, z >= shore(x) - 2 ? "sand" : "sand");
}
// wet-sand edge along the water
for (let x = 0; x < 42; x++) for (const dz of [1, 2]) if (shore(x) - dz >= 0) g.set(x, 1, shore(x) - dz, dz === 1 ? "smooth_sandstone" : "sand");

// ---- VOLUMES -------------------------------------------------------------------------------------------------------
// L (lower): x 5..25, z 10..22 · floor y2 · walls y3..6 · slab y7.   U (upper): x 13..34, z 10..26 · floor y7 · walls y8..11
const L = { x0: 5, x1: 25, z0: 10, z1: 22 }, U = { x0: 13, x1: 34, z0: 10, z1: 26 };
const ring = (b, y, block) => {
  for (let x = b.x0; x <= b.x1; x++) for (const z of [b.z0, b.z1]) g.set(x, y, z, block);
  for (let z = b.z0; z <= b.z1; z++) for (const x of [b.x0, b.x1]) g.set(x, y, z, block);
};
const walls = (b, y0, y1, block) => { for (let y = y0; y <= y1; y++) ring(b, y, block); };

// L: floor (dark plinth ring, pale timber inside), walls, ceiling/terrace slab
g.fill([L.x0, 2, L.z0], [L.x1, 2, L.z1], DECK);
ring(L, 2, PLINTH);
walls(L, 3, 6, WALL);
g.fill([L.x0, 7, L.z0], [L.x1, 7, L.z1], DECK);
ring(L, 7, PLINTH);
// U: floor/soffit (pale timber) with a dark datum ring, walls
g.fill([U.x0, 7, U.z0], [U.x1, 7, U.z1], DECK);
ring(U, 7, PLINTH);
walls(U, 8, 11, WALL);
// interior ceiling of U is the roof plate (mcd roof); clear the volume interiors
carve(g, [L.x0 + 1, 3, L.z0 + 1], [L.x1 - 1, 6, L.z1 - 1]);
carve(g, [U.x0 + 1, 8, U.z0 + 1], [U.x1 - 1, 11, U.z1 - 1]);

// ---- UNDERCROFT floor + south sun deck + steps ------------------------------------------------------------------------
g.fill([26, 2, 10], [37, 2, 27], "smooth_stone");               // covered terrace / carport floor under the cantilever
g.fill([4, 2, 23], [37, 2, 30], DECK);                           // sun deck, runs under the overhang
// stepped edge down to sand, two flights with a landing
for (const sx of [16, 17, 18, 19, 30, 31, 32]) g.set(sx, 2, 31, ...B.stairs(WOOD, "north"));
// slim columns carrying the cantilever (quartz pillars)
for (const [x, z] of [[34, 10], [34, 18], [34, 26], [24, 26], [13, 26]]) for (let y = 3; y <= 6; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });

// ---- ROOF TERRACE on L (west), floor y7: decking + glass balustrade (kept 1 high) -----------------------------------
for (let x = L.x0; x <= 12; x++) { g.set(x, 8, L.z0, ...B.pane("glass_pane")); g.set(x, 8, L.z1, ...B.pane("glass_pane")); }
for (let z = L.z0; z <= L.z1; z++) g.set(L.x0, 8, z, ...B.pane("glass_pane"));

// ---- OPENINGS ------------------------------------------------------------------------------------------------------
const glass = (x, y, z) => g.set(x, y, z, ...B.pane("glass_pane"));
// SOUTH L: floor-to-ceiling glazing, black mullions every 4, white corner piers
for (let x = L.x0 + 1; x <= L.x1 - 1; x++) for (let y = 3; y <= 6; y++) glass(x, y, L.z1);
for (let x = L.x0 + 1; x <= L.x1 - 1; x += 4) for (let y = 3; y <= 6; y++) g.set(x, y, L.z1, WALL);
for (let x = L.x0 + 1; x <= L.x1 - 1; x++) g.set(x, 6, L.z1, WALL);      // head beam
// SOUTH U: glazing between white piers (cantilevered face)
for (let x = U.x0 + 1; x <= U.x1 - 1; x++) for (let y = 8; y <= 10; y++) glass(x, y, U.z1);
for (const px of [18, 19, 25, 26, 31, 32]) for (let y = 8; y <= 11; y++) g.set(px, y, U.z1, TRIM);
for (let x = U.x0 + 1; x <= U.x1 - 1; x++) g.set(x, 11, U.z1, DARK);
// EAST U (undercroft end): corner glazing
for (let z = U.z0 + 1; z <= U.z1 - 1; z++) for (let y = 8; y <= 10; y++) glass(U.x1, y, z);
for (const pz of [14, 15, 21, 22]) for (let y = 8; y <= 11; y++) g.set(U.x1, y, pz, TRIM);
for (let z = U.z0 + 1; z <= U.z1 - 1; z++) g.set(U.x1, 11, z, DARK);
// NORTH U: long ribbon window y9..10 with solid piers; band at 8 and 11 stays white
for (let x = 15; x <= 32; x++) for (let y = 9; y <= 10; y++) glass(x, y, U.z0);
for (const px of [20, 21, 27, 28]) for (let y = 9; y <= 10; y++) g.set(px, y, U.z0, TRIM);
// WEST U: sliding doors to the roof terrace (glass wall + double doors)
for (let z = U.z0 + 2; z <= U.z1 - 2; z++) for (let y = 8; y <= 10; y++) glass(U.x0, y, z);
for (const pz of [12, 24]) for (let y = 8; y <= 11; y++) g.set(U.x0, y, pz, TRIM);
// WEST L / EAST L
for (let z = 13; z <= 19; z++) for (let y = 4; y <= 6; y++) glass(L.x0, y, z);
for (let z = 13; z <= 19; z += 3) for (let y = 4; y <= 6; y++) g.set(L.x0, y, z, DARK);
// NORTH L: clerestory slits west, tall window, recessed entry porch (recess by exclusion: no wall blocks at z=10)
for (let x = 7; x <= 11; x++) for (let y = 5; y <= 6; y++) glass(x, y, L.z0);
for (const x of [9]) for (let y = 5; y <= 6; y++) g.set(x, y, L.z0, DARK);
for (let x = 14; x <= 17; x++) for (let y = 4; y <= 6; y++) glass(x, y, L.z0);
for (const x of [14, 17]) for (let y = 4; y <= 6; y++) g.set(x, y, L.z0, DARK);
// entry: 3-wide porch x20..22, wall set back to z=11, door in it
for (let x = 20; x <= 22; x++) for (let y = 3; y <= 6; y++) g.set(x, y, L.z0, "air");
for (let x = 20; x <= 22; x++) for (let y = 3; y <= 6; y++) g.set(x, y, 11, WALL);
g.set(21, 3, 11, ...B.door(WOOD, "north", "lower", "left"));
g.set(21, 4, 11, ...B.door(WOOD, "north", "upper", "left"));
g.set(20, 3, 11, ...B.pane()); g.set(20, 4, 11, ...B.pane()); g.set(22, 3, 11, ...B.pane()); g.set(22, 4, 11, ...B.pane());
for (let x = 20; x <= 22; x++) g.set(x, 2, 10, "smooth_quartz");   // threshold slab strip across the porch
// EAST L wall (faces the undercroft): the way out to the carport/terrace
for (let z = 13; z <= 19; z++) for (let y = 3; y <= 6; y++) glass(L.x1, y, z);
for (let z = 13; z <= 19; z += 3) for (let y = 3; y <= 6; y++) g.set(L.x1, y, z, DARK);

// ---- save stage ---------------------------------------------------------------------------------------------------
const out = join(HERE, "stage1.nbt");
g.save(out);
console.log(JSON.stringify({ saved: out, size: g.size }));
