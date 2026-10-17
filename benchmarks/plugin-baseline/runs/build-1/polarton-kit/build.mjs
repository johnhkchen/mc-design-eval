// Builds the Polarton row from its parts: the ground, then every part in plan order. runParts lets each part only ADD into
// air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part.
// Usage: node build.mjs <out.nbt>
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE } from "./vocab/base.mjs";

// [part name (as in plan.md), module]. A module not written yet is a no-op, so make.sh still yields the ground.
const PARTS = [
  ["shells plots 0-3", "parts/shell-a.mjs"],
  ["shells plots 4-7", "parts/shell-b.mjs"],
  ["roofs", "parts/roofs.mjs"],
  ["openings and ways in", "parts/fittings.mjs"],
  ["chimneys, stairs, hearths", "parts/hearths.mjs"],
  ["grounds", "parts/grounds.mjs"],
  ["room: gin wagon bay", "parts/room-1.mjs"],
  ["room: gin machine room", "parts/room-2.mjs"],
  ["room: gin loft", "parts/room-3.mjs"],
  ["room: schoolhouse cloakroom", "parts/room-4.mjs"],
  ["room: classroom", "parts/room-5.mjs"],
  ["room: farmhouse living room", "parts/room-6.mjs"],
  ["room: farmhouse kitchen ell", "parts/room-7.mjs"],
  ["room: farmhouse loft", "parts/room-8.mjs"],
  ["room: forge shed", "parts/room-9.mjs"],
  ["room: cart lean-to", "parts/room-10.mjs"],
  ["room: church nave", "parts/room-11.mjs"],
  ["room: church belfry", "parts/room-12.mjs"],
  ["room: tobacco barn", "parts/room-13.mjs"],
  ["room: corn crib bin", "parts/room-14.mjs"],
  ["room: granary", "parts/room-15.mjs"],
  ["room: owner parlor and dining", "parts/room-16.mjs"],
  ["room: owner stair hall", "parts/room-17.mjs"],
  ["room: owner upper bedrooms", "parts/room-18.mjs"],
];

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const list = [];
for (const [name, file] of PARTS) {
  const mod = await import(new URL(file, import.meta.url).href).catch((e) => {
    if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
    console.warn(`part not written yet: ${file}`);
    return null;
  });
  list.push([name, mod?.build ?? (() => {})]);
}

const g = new Grid(SITE.size, { dataVersion: SITE.dataVersion });
// The ground: grass_block at y0 across the row (x 0..95, z 0..18). Every part's foundation, lane and yard is written over it.
g.fill([0, 0, 0], [SITE.size[0] - 1, 0, SITE.size[2] - 1], "grass_block");

runParts(g, list, {
  palette: fileURLToPath(new URL("./palette.json", import.meta.url)),
  roof: fileURLToPath(new URL("./roof.json", import.meta.url)),
});

g.save(out);
console.log(`saved ${out}`);
