// Builds the Sears row (plan.md): the ground, then every part in the order of the parts list. Each part only adds to
// what earlier parts built (runParts locks their cells); the roof (roof.json) is laid right after the shell.
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE, SERVER_VERSION } from "./vocab/base.mjs";
import * as shellWest from "./parts/shell-west.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as shellEast from "./parts/shell-east.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as porches from "./parts/porches.mjs";
import * as fittings from "./parts/fittings.mjs";
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
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";
import * as room22 from "./parts/room-22.mjs";
import * as room23 from "./parts/room-23.mjs";
import * as room24 from "./parts/room-24.mjs";
import * as room25 from "./parts/room-25.mjs";
import * as room26 from "./parts/room-26.mjs";
import * as room27 from "./parts/room-27.mjs";
import * as room28 from "./parts/room-28.mjs";
import * as room29 from "./parts/room-29.mjs";
import * as room30 from "./parts/room-30.mjs";
import * as room31 from "./parts/room-31.mjs";
import * as room32 from "./parts/room-32.mjs";
import * as room33 from "./parts/room-33.mjs";
import * as room34 from "./parts/room-34.mjs";
import * as room35 from "./parts/room-35.mjs";
import * as room36 from "./parts/room-36.mjs";
import * as room37 from "./parts/room-37.mjs";
import * as room38 from "./parts/room-38.mjs";
import * as room39 from "./parts/room-39.mjs";
import * as room40 from "./parts/room-40.mjs";
import * as room41 from "./parts/room-41.mjs";
import * as room42 from "./parts/room-42.mjs";
import * as room43 from "./parts/room-43.mjs";
import * as room44 from "./parts/room-44.mjs";
import * as room45 from "./parts/room-45.mjs";
import * as room46 from "./parts/room-46.mjs";
import * as room47 from "./parts/room-47.mjs";
import * as room48 from "./parts/room-48.mjs";
import * as room49 from "./parts/room-49.mjs";
import * as room50 from "./parts/room-50.mjs";
import * as room51 from "./parts/room-51.mjs";
import * as room52 from "./parts/room-52.mjs";
import * as room53 from "./parts/room-53.mjs";
import * as room54 from "./parts/room-54.mjs";
import * as room55 from "./parts/room-55.mjs";

const [SX, SY, SZ] = SITE_SIZE;
const out = process.argv[2] ?? "build.nbt";

const g = new Grid([SX, SY, SZ], { dataVersion: DATA_VERSIONS[SERVER_VERSION] });

// the ground (y 0): street gravel z 0..2, smooth_stone z 3..4, lawn grass from z 5 to the back edge. Parts may replace it.
g.fill([0, 0, 0], [SX - 1, 0, 2], "gravel");
g.fill([0, 0, 3], [SX - 1, 0, 4], "smooth_stone");
g.fill([0, 0, 5], [SX - 1, 0, SZ - 1], "grass_block");

// the stairs part is named "Stairs and ladders": runParts makes it the stair joiner (it may carve through floors)
runParts(g, [
  ["shell west (plots 0-3)", shellWest.build],
  ["Stairs and ladders", stairs.build],
  ["shell east (plots 4-7)", shellEast.build],
  ["roofs", roofs.build],
  ["porches and facade ornament", porches.build],
  ["glazing, doors, shutters", fittings.build],
  ["chimneys, walks and grounds", grounds.build],
  ["room: P0 hall", room1.build],
  ["room: P0 parlour", room2.build],
  ["room: P0 dining room", room3.build],
  ["room: P0 kitchen", room4.build],
  ["room: P0 upper hall", room5.build],
  ["room: P0 west bedroom", room6.build],
  ["room: P0 east bedroom", room7.build],
  ["room: P0 attic", room8.build],
  ["room: P1 hall", room9.build],
  ["room: P1 living room", room10.build],
  ["room: P1 dining room", room11.build],
  ["room: P1 kitchen", room12.build],
  ["room: P1 upper hall", room13.build],
  ["room: P1 west bedroom", room14.build],
  ["room: P1 north-east bedroom", room15.build],
  ["room: P1 south-east bedroom", room16.build],
  ["room: P2 living and dining", room17.build],
  ["room: P2 kitchen", room18.build],
  ["room: P2 ground bedroom", room19.build],
  ["room: P2 loft west bedroom", room20.build],
  ["room: P2 loft east bedroom", room21.build],
  ["room: P3 hall", room22.build],
  ["room: P3 living room", room23.build],
  ["room: P3 dining room", room24.build],
  ["room: P3 kitchen", room25.build],
  ["room: P3 upper hall", room26.build],
  ["room: P3 west bedroom", room27.build],
  ["room: P3 dormer bedroom", room28.build],
  ["room: P3 rear bedroom", room29.build],
  ["room: P4 living room", room30.build],
  ["room: P4 hall", room31.build],
  ["room: P4 parlour", room32.build],
  ["room: P4 dining room", room33.build],
  ["room: P4 kitchen", room34.build],
  ["room: P4 upper hall", room35.build],
  ["room: P4 north-west bedroom", room36.build],
  ["room: P4 north-east bedroom", room37.build],
  ["room: P4 south-east bedroom", room38.build],
  ["room: P4 bath and store", room39.build],
  ["room: P5 hall", room40.build],
  ["room: P5 parlour", room41.build],
  ["room: P5 dining nook", room42.build],
  ["room: P5 kitchen and living", room43.build],
  ["room: P5 attic north bedroom", room44.build],
  ["room: P5 attic south bedroom", room45.build],
  ["room: P6 living and kitchen", room46.build],
  ["room: P6 west bedroom", room47.build],
  ["room: P6 back hall and bunk", room48.build],
  ["room: P7 living room", room49.build],
  ["room: P7 dining room", room50.build],
  ["room: P7 kitchen", room51.build],
  ["room: P7 upper hall", room52.build],
  ["room: P7 north-west bedroom", room53.build],
  ["room: P7 north-east bedroom", room54.build],
  ["room: P7 south-east bedroom", room55.build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}: ${g.cells.size} cells`);
