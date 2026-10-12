// villa-haiku: builds the villa from its parts, in plan order, and saves it to the path in argv[2].
// make.sh runs this to a temp file, then moves it into place. Usage: node build.mjs <out.nbt>
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ENTRANCE, ROOMS, SITE, siteGrid } from "./vocab.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");
const here = (f) => fileURLToPath(new URL(f, import.meta.url));

// 1. the ground: the site's grass at y0, the street included (the plinth and the street paving replace it)
const g = siteGrid();
g.fill([0, 0, -SITE.street], [SITE.w - 1, 0, SITE.d - 1], "grass_block");

// 2. the parts in plan order: the five structural parts, then the eighteen rooms (rooms.json order)
const modules = [
  ["shell", "./parts/shell.mjs"],
  ["roofs", "./parts/roofs.mjs"],
  ["peristyle", "./parts/peristyle.mjs"],
  ["atrium", "./parts/atrium.mjs"],
  ["facade", "./parts/facade.mjs"],
  ...ROOMS.map((r, i) => [`room: ${r.name}`, `./parts/room-${i + 1}.mjs`]),
];
const parts = [];
for (const [name, path] of modules) parts.push([name, (await import(path)).build]);
const palette = JSON.parse(readFileSync(here("./palette.json"), "utf8"));
runParts(g, parts, { palette, report: here("./parts-report.json") });

g.save(out);

// 3. the rooms in the file's frame (nbt has no negative z): `$MCD walk build.nbt --rooms rooms.nbt.json`
const shift = ([x0, y0, z0, x1, y1, z1]) => [x0, y0, z0 + SITE.street, x1, y1, z1 + SITE.street];
const fileRooms = {
  entrance: [ENTRANCE[0], ENTRANCE[1], ENTRANCE[2] + SITE.street],
  rooms: ROOMS.map((r) => ({ name: r.name, box: shift(r.box) })),
};
writeFileSync(here("./rooms.nbt.json"), JSON.stringify(fileRooms, null, 1));
console.log(`saved ${out} (${g.size.join("x")}); rooms in the file frame: rooms.nbt.json`);
