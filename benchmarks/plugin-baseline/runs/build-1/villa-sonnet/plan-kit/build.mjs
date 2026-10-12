// Builds the villa from its parts: the ground, then every part in plan order. runParts lets each part only ADD into air
// (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part.
// Usage: node build.mjs <out.nbt>
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE } from "./vocab.mjs";
import * as shell from "./parts/shell.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as street from "./parts/street.mjs";
import * as atrium from "./parts/atrium.mjs";
import * as peristyle from "./parts/peristyle.mjs";
import * as finish from "./parts/finish.mjs";
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

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
// The ground: grass_block at y0 across the whole site. Every part's foundation, street and rear lane is written over it.
g.fill([0, 0, 0], [SITE.size[0] - 1, 0, SITE.size[2] - 1], "grass_block");

runParts(
  g,
  [
    ["P1 shell", shell.build],
    ["P2 roofs", roofs.build],
    ["P3 street", street.build],
    ["P4 atrium", atrium.build],
    ["P5 peristyle", peristyle.build],
    ["P6 finish", finish.build],
    ["room 1 Fauces", room1.build],
    ["room 2 Taberna W1", room2.build],
    ["room 3 Taberna W2", room3.build],
    ["room 4 Taberna E3", room4.build],
    ["room 5 Taberna E4", room5.build],
    ["room 6 Atrium", room6.build],
    ["room 7 Cubiculum C1", room7.build],
    ["room 8 Cubiculum C2", room8.build],
    ["room 9 Cubiculum C3", room9.build],
    ["room 10 Cubiculum C4", room10.build],
    ["room 11 Tablinum", room11.build],
    ["room 12 Culina", room12.build],
    ["room 13 Triclinium", room13.build],
    ["room 14 Cubiculum C5", room14.build],
    ["room 15 Lararium", room15.build],
    ["room 16 Cubiculum C7", room16.build],
    ["room 17 Storeroom C8", room17.build],
    ["room 18 Peristyle colonnade", room18.build],
  ],
  { palette: fileURLToPath(new URL("./palette.json", import.meta.url)) },
);

g.save(out);
console.log(`saved ${out}`);
