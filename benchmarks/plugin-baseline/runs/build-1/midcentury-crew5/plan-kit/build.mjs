// Mid-century house generator: `node build.mjs [out.nbt]` (default build.nbt here). make.sh runs it and moves the result into place.
// Coordinates are plan.md's absolute ones. A structure grid is 0-based, so cells below y=0 (the bedding at y=-1 and the
// pool basin at y=-2..-1) cannot be stored: they are dropped and counted, and the pool reads as shallow water at y=0.
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as shell from "./parts/shell.mjs";
import * as site from "./parts/site.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as facades from "./parts/facades.mjs";
import * as front from "./parts/front.mjs";
import * as back from "./parts/back.mjs";
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
import { GRID, inPool } from "./vocab/base.mjs";
import { renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, "build.nbt");
const SIZE = GRID;

const grid = new Grid(SIZE);
// the ground: dirt at y=0 over the lot except the kidney pool, which stays open (cells set here stay writable by every part)
for (let x = 0; x < SIZE[0]; x++) for (let z = 0; z < SIZE[2]; z++) if (!inPool(x, z)) grid.set(x, 0, z, "dirt");

// wrap the grid so writes below y=0 are dropped and counted instead of thrown
let dropped = 0;
const g = new Proxy(grid, {
  get(target, prop) {
    if (prop === "set") return (x, y, z, ...rest) => { if (y < 0) { dropped++; return g; } return target.set(x, y, z, ...rest); };
    const v = Reflect.get(target, prop);
    return typeof v === "function" ? v.bind(target) : v;
  },
});

const reports = runParts(g, [
  ["house shell and ground", shell.build],
  ["site, carport and paving", site.build],
  ["roofs, beams and fireplace stack", roofs.build],
  ["facades, glazing and entry", facades.build],
  ["car and front garden", front.build],
  ["pool, patio and garden details", back.build],
  ["room: gallery", room1.build],
  ["room: kitchen", room2.build],
  ["room: dining", room3.build],
  ["room: living", room4.build],
  ["room: atrium", room5.build],
  ["room: corridor", room6.build],
  ["room: bedroom 1", room7.build],
  ["room: bath 1", room8.build],
  ["room: bath 2", room9.build],
  ["room: bedroom 2", room10.build],
  ["room: master bedroom", room11.build],
], { palette: join(here, "palette.json") });
console.log(`cells below y=0 dropped (bedding and pool basin): ${dropped}`);
const tmp = out + ".tmp.nbt";
grid.save(tmp);
renameSync(tmp, out);
console.log(JSON.stringify({ saved: out, size: SIZE, parts: reports.map((r) => `${r.part}:${r.placed}${r.refused ? `(refused ${r.refused})` : ""}`) }));
