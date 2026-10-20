// Glazing, doors, lighting (plan.md OPENINGS, FLOORS, Lighting): panes in every opening the shells left as air, the
// glass and iron doors, the drum slits, the atrium's hidden light, the NMAAHC amber and the entrance glass. Every write
// goes only into air (a cell an earlier part filled is left alone), so an opening that isn't there is skipped and reported.
import { tallWindow, thermalWindow, glassFront, OCHRE_FROGLIGHT, GLASS_PANE } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const strip = (b) => String(b ?? "air").replace("minecraft:", "");
const isAir = (g, x, y, z) => strip(g.blockAt(x, y, z)) === "air";

// Glass panes for a set of cells on one wall plane: "z" runs along x (a south or north face), "x" runs along z (an east
// or west face). A pane connects sideways to a neighbour that is glass in this set or any solid block, so a window of
// panes reads as one window and meets the wall at its ends. Returns the number placed; occupied cells are skipped.
function glazeCells(g, cells, plane = "z") {
  const todo = cells.filter(([x, y, z]) => isAir(g, x, y, z));
  const key = (x, y, z) => `${x},${y},${z}`;
  const mine = new Set(todo.map(([x, y, z]) => key(x, y, z)));
  const [a, b] = plane === "z" ? ["west", "east"] : ["north", "south"];
  const [da, db] = plane === "z" ? [[-1, 0, 0], [1, 0, 0]] : [[0, 0, -1], [0, 0, 1]];
  const joins = (x, y, z, d) => {
    const [nx, ny, nz] = [x + d[0], y, z + d[2]];
    return mine.has(key(nx, ny, nz)) || (g.inBounds(nx, ny, nz) && !isAir(g, nx, ny, nz));
  };
  for (const [x, y, z] of todo) {
    const state = { north: "false", south: "false", east: "false", west: "false" };
    state[a] = joins(x, y, z, da) ? "true" : "false";
    state[b] = joins(x, y, z, db) ? "true" : "false";
    g.set(x, y, z, GLASS_PANE, state);
  }
  return todo.length;
}

// A two-leaf door (both halves) at x, y0 (lower) and y0+1 (upper), facing out of the building.
function ironDoor(g, x, y0, z, facing, hinge) {
  g.set(x, y0, z, ...B.door("iron", facing, "lower", hinge));
  g.set(x, y0 + 1, z, ...B.door("iron", facing, "upper", hinge));
}

function nmnh(g) {
  // South range: the shell left one bay of air at each of these x (z41 wall, z40 behind it); a tall window in each.
  const southBays = [35, 39, 43, 71, 75, 79];
  for (const x of southBays) tallWindow(g, x, 5, 41, "south");
  // Ground-storey windows, 1 wide, 2 high, under each tall window.
  glazeCells(g, southBays.flatMap((x) => [[x, 2, 41], [x, 3, 41]]), "z");
  // End pavilions: two windows each on the z42 face, y5..9.
  const pav = [24, 25, 28, 29, 85, 86, 89, 90];
  glazeCells(g, pav.flatMap((x) => [5, 6, 7, 8, 9].map((y) => [x, y, 42])), "z");
  // Main door (glass, 3 wide, y5..8) and the side doors in the pavilion (iron, y5..6, glass transom above at y7).
  glazeCells(g, [56, 57, 58].flatMap((x) => [5, 6, 7, 8].map((y) => [x, y, 39])), "z");
  for (const x of [51, 52, 62, 63]) {
    if (!isAir(g, x, 5, 39)) continue;
    ironDoor(g, x, 5, 39, "south", "left");
    glazeCells(g, [[x, 7, 39]], "z");
  }
  // Thermal window (half round, plan FACADES); the helper refuses any cell the roof already filled.
  thermalWindow(g, 57, 12, 40, "south");
  // North range windows, every 4 cells on z3, y5..9 (the north range is solid behind, so glass sits on the face).
  const north = [];
  for (let x = 27; x <= 87; x += 4) for (let y = 5; y <= 9; y++) north.push([x, y, 3]);
  glazeCells(g, north, "z");
  // North door, 5 wide, y2..4.
  glazeCells(g, [55, 56, 57, 58, 59].flatMap((x) => [2, 3, 4].map((y) => [x, y, 3])), "z");
  // Drum slits: one 1x5 slit centred on each of the four flats (y13..17), in the drum shell's air.
  glazeCells(g, [13, 14, 15, 16, 17].map((y) => [57, y, 18]), "z");
  glazeCells(g, [13, 14, 15, 16, 17].map((y) => [57, y, 36]), "z");
  glazeCells(g, [13, 14, 15, 16, 17].map((y) => [48, y, 27]), "x");
  glazeCells(g, [13, 14, 15, 16, 17].map((y) => [66, y, 27]), "x");
  // Light courts and the portico stay open to the sky; no light is set there (the grounds part lights them).
}

function nmah(g) {
  // South glass front: recessed under the overhang, doors and soffit lights set by the helper.
  glassFront(g, 142, 162, 24);
  // Atrium: hidden froglights on its floor perimeter, every 4 cells, lighting it up through the open well.
  for (let x = 146; x <= 158; x += 4) for (const z of [11, 17]) setIf(g, x, 1, z, OCHRE_FROGLIGHT, { axis: "y" });
  for (let z = 11; z <= 17; z += 3) for (const x of [146, 158]) setIf(g, x, 1, z, OCHRE_FROGLIGHT, { axis: "y" });
  // West doors (x122, z15..17, y1..2) and north doors (z2, x150..154, y1..2) stay open: the NMAH shell carved them as
  // air and locks those cells, so no glass can go in from this part.
}

function nmaahc(g) {
  // Main doors on the south base face (z20, x199..203, y4..5): glass doors, 5 wide, 2 high.
  glazeCells(g, [199, 200, 201, 202, 203].flatMap((x) => [4, 5].map((y) => [x, y, 20])), "z");
}

function setIf(g, x, y, z, block, state) {
  if (isAir(g, x, y, z)) g.set(x, y, z, block, state);
}

export function build(g) {
  nmnh(g);
  nmah(g);
  nmaahc(g);
}
