// Part "facade fittings": the fittings that can land after the shells. The shells carve every OPENINGS cell (windows,
// doors, sliding doors, shutters' wall cells) as AIR, and runParts locks that air as built, so every glass pane, door
// and shutter that was aimed at an opening is refused here and is left out (see left). What lands: the arcade arches
// over the shell's piers, the bike-shop awning and lantern, the flag at x120 z1, the boathouse door frame.
import { awning, flag, eaveLantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // ---- plot 1, army administration: Mission arches over the two arcade bays (the piers at 39, 42, 45, 46 are the shell's)
  for (const x of [40, 41, 43, 44]) {
    const first = x === 40 || x === 43;   // the first cell of each bay faces east, the second west (arcade's rule)
    g.set(x, 3, 2, ...B.stairs("smooth_sandstone", first ? "east" : "west", "top"));
  }

  // ---- plot 5, bike shop: the awning over the shopfront and the lantern under it
  awning(g, 109, 116, 0, 3, "south");
  eaveLantern(g, 112, 2, 0);

  // ---- plot 6, coast guard station: the flagpole and cloth
  flag(g, 120, 1);

  // ---- plot 9, 1890 boathouse: the door frame over the gable
  for (const x of [153, 154]) g.set(x, 3, 0, "birch_planks");
}
