// South Mall kit: lays the ground, then runs the six parts in order; saves the build to the path in argv[2].
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y, GRASS_BLOCK } from "./vocab/base.mjs";
import * as castleShell from "./parts/castle-shell.mjs";
import * as castleRoofs from "./parts/castle-roofs.mjs";
import * as aiShell from "./parts/ai-shell.mjs";
import * as aiRoofs from "./parts/ai-roofs.mjs";
import * as freer from "./parts/freer.mjs";
import * as hirshhorn from "./parts/hirshhorn.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// 1.21.1 (DataVersion 3955): the server's version; every block in the palette exists there
const g = new Grid(SITE_SIZE, { dataVersion: 3955 });
g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], GRASS_BLOCK);

runParts(g, [
  ["castle shell", castleShell.build],
  ["castle roofs and lights", castleRoofs.build],
  ["A&I shell", aiShell.build],
  ["A&I roofs and lights", aiRoofs.build],
  ["Freer palazzo", freer.build],
  ["Hirshhorn drum", hirshhorn.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
