// Front elevation (P3): everything on the street (north, z<0) face, filled into the openings P1 left.
// Portico and entry (E06..E08), garage carriage doors and arched garage windows (E14), all north windows with black
// shutters (E15, E16), the turret glass, wall lamps (E18), the house-number plaque (E19), door planters (E20).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  MASS, portico, entryDoor, archWin, window, shutterPair, carriageDoor, wallLamp, plaque, planter,
} from "../vocab.mjs";

// The fanlight (vocab fanlight()) minus its y5 glass row: P1's belt (smooth_quartz at y5) already fills (21..24,5,8)
// and is locked, so that row is refused. The belt reads as the transom's lintel; glass starts at y6.
function fanlight(g) {
  for (let x = 22; x <= 23; x++) g.set(x, 6, 8, "glass_pane", {});
  g.set(21, 6, 8, ...B.stairs("smooth_quartz", "west", "top"));
  g.set(24, 6, 8, ...B.stairs("smooth_quartz", "east", "top"));
  archWin(g, 21, 7, 8, "north", 4, 2);
}

export function build(g) {
  // ---- portico: 4 columns, entablature, porch floor, front steps ----
  portico(g);

  // ---- entry: double door, fanlight, arch window over it ----
  entryDoor(g);
  fanlight(g);

  // ---- garage wing (z6): three carriage doors, arched bonus-room windows above each, carriage lamps on the piers ----
  for (const x0 of [1, 5, 9]) {
    carriageDoor(g, x0);
    archWin(g, x0, 7, 6, "north", 3, 2);
  }
  for (const x of [0, 4, 8, 12]) wallLamp(g, x, 4, 5, "north");

  // ---- centre block (z8): office and bedroom 2 arched windows, both shuttered ----
  for (const y0 of [3, 7]) {
    archWin(g, 14, y0, 8, "north", 3, 2);
    shutterPair(g, 14, 16, y0, y0 + 1, 8, "north");
  }

  // ---- turret (z4): tall arched window, upper arched window, one-cell side windows ----
  archWin(g, 30, 2, 4, "north", 3, 3);
  archWin(g, 30, 7, 4, "north", 3, 2);
  window(g, 29, 3, 6, "west", 1, 2, { fill: true });
  window(g, 29, 7, 6, "west", 1, 2, { fill: true });
  window(g, 33, 3, 6, "east", 1, 2, { fill: true });
  window(g, 33, 7, 6, "east", 1, 2, { fill: true });
  shutterPair(g, 6, 6, 3, 4, 29, "west");
  shutterPair(g, 6, 6, 7, 8, 29, "west");
  shutterPair(g, 6, 6, 3, 4, 33, "east");
  shutterPair(g, 6, 6, 7, 8, 33, "east");

  // ---- east wing (z12): two arched windows per storey, shuttered ----
  // Shutters as shutterPair hangs them (outer plane z11), except where the chimney stack (shell-owned, MASS.chimney,
  // x37..39 over z10..12) stands: the x34 window's right shutter at x37 is dropped.
  const chimney = MASS.chimney;
  for (const x0 of [34, 40]) for (const y0 of [3, 7]) {
    archWin(g, x0, y0, 12, "north", 3, 2);
    for (let y = y0; y <= y0 + 1; y++) for (const x of [x0 - 1, x0 + 3]) {
      if (x >= chimney.x0 && x <= chimney.x1) continue;
      if (g.isAir(x, y, 11)) g.set(x, y, 11, ...B.trapdoor("dark_oak", "north", "bottom", true));
    }
  }

  // ---- entry lamps flanking the door, house number, door planters on the porch steps ----
  wallLamp(g, 21, 4, 7, "north");
  wallLamp(g, 24, 4, 7, "north");
  plaque(g, 25, 4, 7);
  planter(g, 19, 4);
  planter(g, 26, 4);
}
