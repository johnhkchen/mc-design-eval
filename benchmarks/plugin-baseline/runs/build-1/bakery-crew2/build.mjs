// Builds the Bäckerei from its parts: the ground, then every part in plan order. runParts lets each part only ADD into
// air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part. The roof
// (roof.json) is laid right after the shell. A part whose file does not exist yet is skipped, so a build never fails
// because another part is still being written.
// Usage: node build.mjs <out.nbt>
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE, GROUND_Y } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

// The parts, in plan order: [report name, module].
const PARTS = [
  ["P1 shell", "parts/shell.mjs"],
  ["P2 roofs", "parts/roofs.mjs"],
  ["P3 oven and chimney", "parts/oven.mjs"],
  ["P4 front facade", "parts/facade.mjs"],
  ["P5 yard and street", "parts/yard.mjs"],
  ["P6 sides, back and wing", "parts/sides.mjs"],
  ["room 1 shop", "parts/room-1.mjs"],
  ["room 2 Backstube", "parts/room-2.mjs"],
  ["room 3 bakehouse", "parts/room-3.mjs"],
  ["room 4 Stube", "parts/room-4.mjs"],
  ["room 5 Schlafkammer", "parts/room-5.mjs"],
  ["room 6 Mehlboden", "parts/room-6.mjs"],
];

const list = [];
for (const [name, file] of PARTS) {
  const url = new URL(file, import.meta.url);
  if (!existsSync(url)) {
    console.warn(`${name}: ${file} not written yet, skipped`);
    list.push([name, () => {}]);
    continue;
  }
  list.push([name, (await import(url.href)).build]);
}

// The ground: grass_block at y0 across the whole lot. Every part's street, sidewalk, yard and foundation is written over it.
const ground = () => {
  const g = new Grid(SITE.size);
  g.fill([SITE.lot.x0, GROUND_Y, SITE.lot.z0], [SITE.lot.x1, GROUND_Y, SITE.lot.z1], "grass_block");
  return g;
};
const palette = fileURLToPath(new URL("./palette.json", import.meta.url));
const roof = fileURLToPath(new URL("./roof.json", import.meta.url));

// The roof sits on walls, so it is laid only once the shell has written some (a stub shell leaves the bare ground,
// and the roof tool would find no walls to sit on).
const probe = ground();
runParts(probe, [list[0]], { palette, report: null, log: () => {} });
const shellBuilt = [...probe].some((c) => c.pos[1] > GROUND_Y);

const g = ground();
runParts(g, list, { palette, roof: shellBuilt ? roof : undefined });

g.save(out);
console.log(`saved ${out}`);
