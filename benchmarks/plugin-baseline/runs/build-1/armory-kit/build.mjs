// Builds the whole Armory + Chihuly kit: the ground, then every part in order, into the path given as argv[2].
import { readFileSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, GROUND_Y, SMOOTH_STONE } from "./vocab/base.mjs";
import * as armoryShell from "./parts/armory-shell.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as armoryRoof from "./parts/armory-roof.mjs";
import * as pavilions from "./parts/pavilions.mjs";
import * as glasshouse from "./parts/glasshouse.mjs";
import * as galleries from "./parts/galleries.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as roofDressing from "./parts/roof-dressing.mjs";
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

const out = process.argv[2];
// the roof reads its eave from the walls the shell lays, so it waits until the shell is built (a stub has no walls)
const shellIsStub = /export function build\(g\) \{\}/.test(readFileSync("parts/armory-shell.mjs", "utf8"));
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// the server is 1.21.1 (DataVersion 3955): every id in the palette is a 1.21.1 block
const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
g.fill([0, GROUND_Y, 0], [SITE.x - 1, GROUND_Y, SITE.z - 1], SMOOTH_STONE);

runParts(g, [
  ["Armory shell", armoryShell.build],
  ["Stairs and ladders", stairs.build],
  ["Armory roof and porch", armoryRoof.build],
  ["White pavilions and galleria", pavilions.build],
  ["Glasshouse and Chihuly flower", glasshouse.build],
  ["Galleries", galleries.build],
  ["Grounds and lighting", grounds.build],
  ["room: Armory lobby and shops", room1.build],
  ["room: Armory offices 2F", room2.build],
  ["room: Armory classrooms 3F", room3.build],
  ["room: Armory theatre and studios 4F", room4.build],
  ["room: Food hall ground (aisles and stalls)", room5.build],
  ["room: Food hall atrium volume", room6.build],
  ["room: South glass hall", room7.build],
  ["room: South vestibule", room8.build],
  ["room: West aisle 2F", room9.build],
  ["room: East aisle 2F", room10.build],
  ["room: West aisle 3F", room11.build],
  ["room: East aisle 3F", room12.build],
  ["room: West aisle 4F", room13.build],
  ["room: East aisle 4F", room14.build],
  ["room: Pavilion D shops", room15.build],
  ["room: Pavilion D event cafe", room16.build],
  ["room: Kiosk D1", room17.build],
  ["room: Annex D2 restrooms", room18.build],
  ["room: Galleria hall", room19.build],
  ["room: Galleria east arm", room20.build],
  ["room: Galleria cafe", room21.build],
  ["room: Glasshouse hall", room22.build],
  ["room: Glasshouse north vestibule", room23.build],
  ["room: Glasshouse south vestibule", room24.build],
  ["room: Galleries lobby and shop", room25.build],
  ["room: Gallery one", room26.build],
  ["room: Gallery two", room27.build],
  ["room: Gallery three", room28.build],
  ["room: Galleries cafe", room29.build],
], { palette: "palette.json", roof: shellIsStub ? undefined : "roof.json" });

// owner fix round: the roof dressing goes on the finished roof (the roof tool lays it after the shell, so no part could)
roofDressing.build(g);

g.save(out);
console.log(`saved ${out}`);
