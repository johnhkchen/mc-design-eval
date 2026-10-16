// Builds build.nbt from scratch: the site's ground, then every part in plan order (runParts locks each part's blocks).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";
import * as shellA from "./parts/shell_a.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as shellB from "./parts/shell_b.mjs";
import * as roofs from "./parts/roofs.mjs";
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

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}

// The stair joiner carves its stairwells through the shell's floors (carve: true, by name); every other part only adds into air.
// The roof is roof.json's, laid after the first part; it is skipped while roof.json doesn't exist.
const PARTS = [
  ["Shell A (plots 0-3)", shellA.build],
  ["Stairs and ladders", stairs.build],
  ["Shell B (plots 4-7)", shellB.build],
  ["Roofs", roofs.build],
  ["Fittings", fittings.build],
  ["Chimneys, hearths and ovens", chimneys.build],
  ["Grounds and yards", grounds.build],
  ["room: P0 west front room", room1.build],
  ["room: P0 west back room", room2.build],
  ["room: P0 east front room", room3.build],
  ["room: P0 east back room", room4.build],
  ["room: P0 shared porch", room5.build],
  ["room: P1 galerie", room6.build],
  ["room: P1 salle", room7.build],
  ["room: P1 east chamber", room8.build],
  ["room: P1 west cabinet", room9.build],
  ["room: P1 east cabinet", room10.build],
  ["room: P2 living room", room11.build],
  ["room: P2 dining room", room12.build],
  ["room: P2 stair hall", room13.build],
  ["room: P2 kitchen", room14.build],
  ["room: P2 front bedroom", room15.build],
  ["room: P2 landing", room16.build],
  ["room: P2 back bedroom", room17.build],
  ["room: P3 wraparound porch", room18.build],
  ["room: P3 parlour", room19.build],
  ["room: P3 stair hall", room20.build],
  ["room: P3 kitchen-dining", room21.build],
  ["room: P3 master bedroom", room22.build],
  ["room: P3 upper landing", room23.build],
  ["room: P3 back bedroom", room24.build],
  ["room: P3 tower room", room25.build],
  ["room: P3 belvedere", room26.build],
  ["room: P4 porch in the angle", room27.build],
  ["room: P4 parlour", room28.build],
  ["room: P4 ground bedroom", room29.build],
  ["room: P4 stair strip", room30.build],
  ["room: P4 wing kitchen", room31.build],
  ["room: P4 attic bedroom", room32.build],
  ["room: P5 barn aisle and stalls", room33.build],
  ["room: P5 hay loft", room34.build],
  ["room: P5 wagon lean-to", room35.build],
  ["room: P6 pavilion", room36.build],
  ["room: P6 oven court", room37.build],
  ["room: P7 west parlour", room38.build],
  ["room: P7 west kitchen", room39.build],
  ["room: P7 west bedroom front", room40.build],
  ["room: P7 west bedroom back", room41.build],
  ["room: P7 east parlour", room42.build],
  ["room: P7 east kitchen", room43.build],
  ["room: P7 east bedroom front", room44.build],
  ["room: P7 east bedroom back", room45.build],
  ["room: P7 gallery", room46.build],
];

function buildWith(roof) {
  const g = new Grid(SITE_SIZE);
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "grass_block");
  runParts(g, PARTS, { palette: "palette.json", roof });
  return g;
}

// While the shell is still a stub there are no walls to roof: build without the roof then (as the sibling kits do).
let g;
try {
  g = buildWith("roof.json");
} catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log(`roof: skipped, ${e.message} (the shell has no walls yet)`);
  g = buildWith(undefined);
}
g.save(out);
