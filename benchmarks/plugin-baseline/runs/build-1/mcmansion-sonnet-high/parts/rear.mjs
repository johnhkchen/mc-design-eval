// Sides, rear and deck (P5): the west, east and south windows and doors (plan OPENINGS, W/E/S rows), the shutters where
// the east wall has room for them, the kitchen French doors, the garage and bonus doors on x12, and the back deck with
// its steps, patio set, grill, lounge chairs and potted ferns. The shell already reserved every opening and built its
// sill row, so this part only fills the openings (glass and doors) and places objects in air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "../vocab.mjs";

const { GLASS_PANE, WHITE_STAINED_GLASS_PANE } = V;

// Glass cells this part wrote, so the pane connections can be set once everything is in place.
const panes = [];

/** Glass in a w x h opening, like vocab window({fill:true}) but with the pane colour chosen (bath glass is white). */
function glaze(g, x0, y0, z0, face, w, h, block = GLASS_PANE) {
  const along = face === "north" || face === "south";
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const [x, y, z] = along ? [x0 + i, y0 + j, z0] : [x0, y0 + j, z0 + i];
    g.set(x, y, z, block, {});
    panes.push([x, y, z]);
  }
}

/** An arched window (vocab archWin) that also records its glass cells for the pane pass. */
function arch(g, x0, y0, z0, face, w, h) {
  V.archWin(g, x0, y0, z0, face, w, h);
  const along = face === "north" || face === "south";
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const [x, y, z] = along ? [x0 + i, y0 + j, z0] : [x0, y0 + j, z0 + i];
    if (j === h - 1 && (i === 0 || i === w - 1)) continue;   // the top corners are smooth_quartz_stairs
    panes.push([x, y, z]);
  }
}

/** A single door (two halves) at (x, y..y+1, z), open, hinge left or right, facing the outward direction. */
function door(g, x, y, z, mat, facing, hinge) {
  const st = (half) => ({ facing, half, hinge, open: "true", powered: "false" });
  g.set(x, y, z, `${mat}_door`, st("lower"));
  g.set(x, y + 1, z, `${mat}_door`, st("upper"));
}

/** Pane connections: a pane joins each in-plane neighbour that is not air (other panes, wall, frame), like the game does. */
function connectPanes(g) {
  for (const [x, y, z] of panes) {
    const name = g.blockAt(x, y, z).replace("minecraft:", "");
    const east = !g.isAir(x + 1, y, z), west = !g.isAir(x - 1, y, z);
    const north = !g.isAir(x, y, z - 1), south = !g.isAir(x, y, z + 1);
    g.set(x, y, z, name, { north: String(north), south: String(south), east: String(east), west: String(west), waterlogged: "false" });
  }
}

export function build(g) {
  // ---- west wall: garage windows (x0), garage side door, mudroom wall window (x12, z20..23) ----
  glaze(g, 0, 3, 9, "west", 3, 2);                    // garage W, S1 (z9..11)
  glaze(g, 0, 7, 10, "west", 3, 2);                   // garage W, S2 (z10..12)
  door(g, 0, 2, 16, "dark_oak", "west", "left");      // garage side door (0,2..3,16)
  glaze(g, 12, 3, 21, "west", 2, 2);                  // mudroom / bedroom 4 west windows (z21..22)
  glaze(g, 12, 7, 21, "west", 2, 2);

  // ---- west wall of the east wing (x33, z24..27) ----
  glaze(g, 33, 3, 24, "west", 2, 2);                  // family room W (z24..25)
  glaze(g, 33, 7, 24, "west", 2, 2);                  // primary closet W (z24..25)

  // ---- east side: centre block east face (x33, z9..11) with shutters ----
  // z11 of these windows is the front's window shutter (33, y, 11), so only the z10 column is glazed here.
  glaze(g, 33, 3, 10, "east", 1, 2);
  glaze(g, 33, 7, 10, "east", 1, 2);
  V.shutterPair(g, 10, 11, 3, 4, 33, "east");
  V.shutterPair(g, 10, 11, 7, 8, 33, "east");

  // ---- east wing east face (x43). Shutters would sit at x44, outside the 44-wide grid, so none here. ----
  glaze(g, 43, 3, 15, "east", 3, 2);                  // family room E (z15..17)
  glaze(g, 43, 3, 21, "east", 3, 2);                  // family room E (z21..23)
  glaze(g, 43, 7, 15, "east", 3, 2);                  // primary bedroom E (z15..17)
  glaze(g, 43, 7, 19, "east", 2, 2);                  // primary bedroom E (z19..20)
  glaze(g, 43, 7, 24, "east", 2, 2);                  // primary bath E (z24..25)

  // ---- south: centre block rear (z23): mudroom, kitchen, French doors, bedroom 4, upper hall arch, hall bath ----
  glaze(g, 14, 3, 23, "south", 3, 2);                 // mudroom S (x14..16)
  glaze(g, 21, 3, 23, "south", 3, 2);                 // kitchen S (x21..23)
  glaze(g, 29, 3, 23, "south", 3, 2);                 // kitchen S (x29..31)
  V.frenchDoor(g, 25, 23);                            // kitchen French doors onto the deck (25..26,2..3,23)
  glaze(g, 14, 7, 23, "south", 3, 2);                 // bedroom 4 S (x14..16)
  arch(g, 21, 7, 23, "south", 4, 2);                  // upper hall S arched window (x21..24)
  glaze(g, 29, 7, 23, "south", 2, 2, WHITE_STAINED_GLASS_PANE);   // hall bath S (x29..30), bath glass

  // ---- south: garage rear (z19) ----
  glaze(g, 5, 3, 19, "south", 3, 2);
  glaze(g, 5, 7, 19, "south", 3, 2);

  // ---- south: east wing rear (z27): tall arched windows at S1, plain at S2 ----
  arch(g, 35, 2, 27, "south", 3, 3);                  // walk-in closet / family room tall arch (x35..37)
  arch(g, 39, 2, 27, "south", 3, 3);                  // family room tall arch (x39..41)
  glaze(g, 35, 7, 27, "south", 2, 2);                 // walk-in closet S (x35..36)
  glaze(g, 40, 7, 27, "south", 2, 2);                 // primary bath S (x40..41)

  // ---- x12 shared walls: garage-to-mudroom door and bonus room door ----
  door(g, 12, 2, 18, "birch", "east", "left");        // (12,2..3,18)
  door(g, 12, 6, 16, "birch", "east", "left");        // (12,6..7,16)

  // ---- back deck: boards, rail on the west, east and south edges (the north edge is the house wall) ----
  V.deck(g, 14, 24, 32, 30, {
    rail: ["west", "east", "south"],
    skip: (x, z) => z === 30 && x >= 22 && x <= 24,   // open gap where the steps meet the deck
  });
  for (let x = 22; x <= 24; x++) g.set(x, 1, 31, ...B.stairs("spruce", "north", "bottom"));   // steps to the lawn
  V.patioSet(g, 18, 27);                              // dark oak table with four spruce chairs
  g.set(30, 2, 25, "blast_furnace", { facing: "west", lit: "false" });   // grill
  g.set(30, 2, 26, "barrel", { facing: "up", open: "false" });
  g.set(14, 3, 29, "potted_fern", {});                // pots on the rail beside the corner posts
  g.set(32, 3, 29, "potted_fern", {});
  g.set(27, 2, 28, ...B.stairs("spruce", "south", "bottom"));   // two-chair lounge
  g.set(28, 2, 28, ...B.stairs("spruce", "south", "bottom"));

  connectPanes(g);
}
