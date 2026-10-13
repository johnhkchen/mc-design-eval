// Build the shop row: the grid at the lot's size, the ground, then every part in plan.md's order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { LOT, BUILD_Z0, GROUND_TOP, DIRT, STONE, GRASS_BLOCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

// The grid's coordinates are the plan's world coordinates (sockets.json and rooms.json use them too), so build.nbt sits at
// the world origin. A structure can't hold z below BUILD_Z0 (0), so the yard and rear lane (z -8..-1) are outside it.
const g = new Grid([LOT.x1 + 1, LOT.y1 + 1, LOT.z1 + 1]);

// The ground: stone under y 3, dirt to the ground top, grass on the lot's outer ring. Parts build over it (ground cells stay writable).
const { x0, x1, y0, z1 } = LOT, z0 = BUILD_Z0;
g.fill([x0, y0, z0], [x1, 2, z1], STONE);
g.fill([x0, 3, z0], [x1, GROUND_TOP, z1], DIRT);
for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) g.set(x, GROUND_TOP, z, GRASS_BLOCK);

// A part whose file is missing (another worker's copy) builds as nothing, so make.sh still yields a build.
async function part(name) {
  const file = `./parts/${name}.mjs`;
  try { return await import(file); } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND" && e.message.includes(`parts/${name}.mjs`)) { console.log(`part ${name}: file missing, built as nothing`); return { build() {} }; }
    throw e;
  }
}
const P = Object.fromEntries(await Promise.all(["shell", "stairs", "roof", "shopfronts", "windows", "chimneys", "yard",
  ...Array.from({ length: 16 }, (_, i) => `room-${i + 1}`)].map(async (n) => [n, await part(n)])));

runParts(g, [
  ["masonry shell", P.shell.build],
  ["Stairs and ladders", P.stairs.build],
  ["mansard roof", P.roof.build],
  ["shopfronts", P.shopfronts.build],
  ["windows and doors", P.windows.build],
  ["chimneys", P.chimneys.build],
  ["yard and street", P.yard.build],
  ["room: keeper aisle 1", P["room-1"].build],
  ["room: keeper aisle 2", P["room-2"].build],
  ["room: stair lobby", P["room-3"].build],
  ["room: bin store", P["room-4"].build],
  ["room: corridor 1", P["room-5"].build],
  ["room: corridor 2", P["room-6"].build],
  ["room: flat 1W front room", P["room-7"].build],
  ["room: flat 1W back room", P["room-8"].build],
  ["room: flat 1E front room", P["room-9"].build],
  ["room: flat 1E back room", P["room-10"].build],
  ["room: flat 2W front room", P["room-11"].build],
  ["room: flat 2W back room", P["room-12"].build],
  ["room: flat 2E front room", P["room-13"].build],
  ["room: flat 2E back room", P["room-14"].build],
  ["room: landing 1", P["room-15"].build],
  ["room: landing 2", P["room-16"].build],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}: grid ${g.size.join("x")} (world coordinates, x 0.., z ${BUILD_Z0}..)`);
