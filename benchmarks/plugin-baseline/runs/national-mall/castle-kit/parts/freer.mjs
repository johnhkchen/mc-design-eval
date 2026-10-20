// Plot 2 Freer Gallery, complete: ring walls round a court, cornice, three-arch loggia, door and small windows,
// low andesite hip, court with fountain, four oak trees and paving, terrace, lanterns. Coordinates from plan.md (Plot 2,
// OPENINGS and FLOORS). No earlier part owns a cell in this plot, so the writes go straight to the grid.
import { GRASS_BLOCK, FREER_TREES } from "../vocab/base.mjs";
import { cornice, loggia, courtTree, fountain, lampPost } from "../vocab.mjs";

const BODY = "white_terracotta", PLINTH = "smooth_stone", CORNICE = "polished_diorite", GLASS = "gray_stained_glass_pane";
const PAVING = "smooth_stone", ROOF = "andesite_slab", ROOF_CORE = "polished_andesite";

// the body ring: outer walls x107/x135, z2/z25; the court (open) x117..125 z11..18 with its walls one cell out (x116/x126, z10/z19)
const court = (x, z) => x >= 117 && x <= 125 && z >= 11 && z <= 18;
const courtWall = (x, z) => x >= 116 && x <= 126 && z >= 10 && z <= 19 && !court(x, z);
const outerWall = (x, z) => x === 107 || x === 135 || z === 2 || z === 25;

// a 1x1 glass pane; `along` is the way its wall runs ("x" on north/south walls, "z" on east/west), so it joins its neighbours
function pane(g, x, y, z, along) {
  const state = along === "x"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  g.set(x, y, z, GLASS, state);
}
// a window: the pane at y, polished diorite sill below it and lintel above, all in the wall
function windowAt(g, x, y, z, along) {
  pane(g, x, y, z, along);
  g.set(x, y - 1, z, CORNICE);
  g.set(x, y + 1, z, CORNICE);
}

export function build(g) {
  // the plot's first course replaces the grass: clear it, so walls, piers and paving stand on the ground
  g.fill([107, 0, 0], [136, 0, 25], "minecraft:air");

  // body: outer ring and court walls (white terracotta over a smooth stone plinth); the rooms between are hollow over bottom slabs
  for (let x = 107; x <= 135; x++) for (let z = 2; z <= 25; z++) {
    if (court(x, z)) continue;
    if (outerWall(x, z) || courtWall(x, z)) {
      g.set(x, 0, z, PLINTH);
      for (let y = 1; y <= 4; y++) g.set(x, y, z, BODY);
    } else g.set(x, 0, z, "smooth_stone_slab", { type: "bottom" });
  }

  // windows: 1x1 at y1 and y3; on the north front, pairs at x109..113 and x129..133; on the W, E and S faces every 3rd cell from 2 in from a corner; court faces every 2nd cell
  for (const y of [1, 3]) {
    for (const x of [109, 111, 113, 129, 131, 133]) windowAt(g, x, y, 2, "x");
    for (const x of [109, 112, 115, 118, 121, 124, 127, 130, 133]) windowAt(g, x, y, 25, "x");
    for (const z of [4, 7, 10, 13, 16, 19, 22]) { windowAt(g, 107, y, z, "z"); windowAt(g, 135, y, z, "z"); }
    for (const x of [117, 119, 121, 123, 125]) { windowAt(g, x, y, 10, "x"); windowAt(g, x, y, 19, "x"); }
    for (const z of [11, 13, 15, 17]) { windowAt(g, 116, y, z, "z"); windowAt(g, 126, y, z, "z"); }
  }
  // main door behind the loggia: glass panes, y0..2
  for (const x of [120, 121, 122]) for (let y = 0; y <= 2; y++) pane(g, x, y, 2, "x");

  // cornice at y5 proud 1 on the outer ring, diorite caps on the court walls
  cornice(g, [107, 2, 135, 25], 5);
  for (let x = 107; x <= 135; x++) for (let z = 2; z <= 25; z++) if (courtWall(x, z)) g.set(x, 5, z, CORNICE);

  // loggia: three round arches (x116..118, 120..122, 124..126), piers, frieze at y4, hanging lanterns; cap at y5 on its front row
  loggia(g, 115, 127, 0, { y: 0 });
  for (let x = 115; x <= 127; x++) g.set(x, 5, 0, "smooth_stone_slab", { type: "top" });

  // terrace and loggia floor: smooth stone paving at y0 (piers are already set, so their cells are skipped)
  for (let x = 112; x <= 129; x++) for (const z of [0, 1]) if (g.isAir(x, 0, z)) g.set(x, 0, z, PAVING);

  // roof: a low hip in two tiers. Eave tier of andesite slab on the ring and the loggia (y6), polished andesite inside it
  // (y6), and a top tier of andesite slab (y7) set in 4 cells from the outer wall. The court stays open to the sky.
  for (let x = 107; x <= 135; x++) for (let z = 2; z <= 25; z++) {
    if (court(x, z)) continue;
    const inset = Math.min(x - 107, 135 - x, z - 2, 25 - z);
    if (inset >= 2) g.set(x, 6, z, ROOF_CORE);
    else g.set(x, 6, z, ROOF, { type: "bottom" });
  }
  for (let x = 115; x <= 127; x++) for (const z of [0, 1]) g.set(x, 6, z, ROOF, { type: "bottom" });
  for (let x = 111; x <= 131; x++) for (let z = 6; z <= 21; z++) {
    if (court(x, z)) continue;
    g.set(x, 7, z, ROOF, { type: "bottom" });
  }

  // court: four oak trees, the fountain basin, four lamps at the corners, paving on the rest of the open ground
  for (const [x, z] of FREER_TREES) courtTree(g, x, z);
  fountain(g, 0, 0, 0, 0, { box: [119, 13, 123, 16] });
  for (const [x, z] of [[117, 11], [125, 11], [117, 18], [125, 18]]) lampPost(g, x, 0, z, { material: CORNICE });
  for (let x = 117; x <= 125; x++) for (let z = 11; z <= 18; z++) if (g.isAir(x, 0, z)) g.set(x, 0, z, PAVING);

  // the lawn: any cell of the plot left unbuilt keeps its grass
  for (let x = 107; x <= 136; x++) for (let z = 0; z <= 25; z++) if (g.isAir(x, 0, z)) g.set(x, 0, z, GRASS_BLOCK);
}
