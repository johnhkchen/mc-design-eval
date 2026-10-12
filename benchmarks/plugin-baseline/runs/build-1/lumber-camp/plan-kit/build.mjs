// Lumber camp build: the ground, then every part in order; saves the structure to the path given as argv[2].
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, GROUND_Y, GRASS_BLOCK } from "./vocab/base.mjs";
import * as bunkhouse from "./parts/bunkhouse.mjs";
import * as sawmill from "./parts/sawmill.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as fire from "./parts/fire.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";

const out = process.argv[2] ?? "build.nbt";
const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["26.3"] });

// The ground under everything (grounds.mjs adds the patches and paths over it; parts may replace it freely).
g.fill([0, GROUND_Y, 0], [SIZE[0] - 1, GROUND_Y, SIZE[2] - 1], GRASS_BLOCK);

// reroof reads the eave off the walls and throws on an empty shell, so the roof waits until the bunkhouse part has
// put something down: a probe run of the shell on its own grid (the stubs place nothing). A path that doesn't exist
// makes runParts skip the roof with a note.
const probe = new Grid(SIZE);
bunkhouse.build(probe);
const roof = probe.cells.size ? "roof.json" : "roof-after-shell.json";

runParts(g, [
  ["Bunkhouse log shell", bunkhouse.build],
  ["Sawmill pole frame", sawmill.build],
  ["Roofs", roofs.build],
  ["Fittings", fittings.build],
  ["Chimneys, stacks and fires", fire.build],
  ["Grounds, yard and woodshed", grounds.build],
  ["room: Bunkroom", room1.build],
  ["room: Mess and cook hall", room2.build],
  ["room: Loft", room3.build],
  ["room: Front porch", room4.build],
  ["room: Woodshed", room5.build],
  ["room: Sawmill hall", room6.build],
], { palette: "palette.json", roof });

g.save(out);
console.log(`saved ${out}: ${g.cells.size} blocks`);
