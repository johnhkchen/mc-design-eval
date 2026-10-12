// Builds the town hall: the ground course, then every part in plan order, saved to the path given as argv[2].
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y, GRASS_BLOCK } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as dressings from "./parts/dressings.mjs";
import * as fittings from "./parts/fittings.mjs";
import * as chimneys from "./parts/chimneys.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

const lawn = (g) => g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], GRASS_BLOCK);

// The roof reads its eave from the walls, so runParts would throw while the shell is still a stub. Lay it only once
// the shell has built something above ground; until then it is left out, as runParts does for a missing roof.json.
const probe = lawn(new Grid(SITE_SIZE));
shell.build(probe);
const walled = [...probe].some((c) => c.pos[1] > GROUND_Y);
if (!walled) console.log("roof: left out, the shell has no walls yet");

const g = lawn(new Grid(SITE_SIZE));

runParts(g, [
  ["Masonry shell", shell.build],
  ["Roofs", roofs.build],
  ["Dressings", dressings.build],
  ["Fittings and lettering", fittings.build],
  ["Chimneys and hearths", chimneys.build],
  ["Grounds", grounds.build],
  ["room: Vestibule", room1.build],
  ["room: Entrance hall", room2.build],
  ["room: Registry bay", room3.build],
  ["room: Waiting bay", room4.build],
  ["room: Clerk's office", room5.build],
  ["room: Mayor's office", room6.build],
  ["room: Council chamber", room7.build],
  ["room: Committee room west", room8.build],
  ["room: Committee room east", room9.build],
  ["room: Clock room", room10.build],
  ["room: Belfry", room11.build],
], { palette: "palette.json", roof: walled ? "roof.json" : undefined });

g.save(out);
console.log(`saved ${out}`);
