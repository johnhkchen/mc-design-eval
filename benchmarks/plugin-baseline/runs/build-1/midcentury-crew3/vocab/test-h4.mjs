// Calls each h4 helper once on a 34 x 9 x 34 grid (plan.md's coordinates) and checks that every block it wrote lies inside
// the footprint it was given, that a block already in its way is left alone, and that the cells it must leave clear are
// air. Run: node vocab/test-h4.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h4 from "./h4.mjs";

const SIZE = [34, 9, 34];

// box: [x0, y0, z0, x1, y1, z1], inclusive. pre: blocks set before the call. clear: cells that must stay air.
const cases = [
  { name: "glass_bay", run: (g) => h4.glass_bay(g, 10, 13, 25, 2, 4), box: [10, 2, 25, 13, 4, 25] },
  { name: "glass_bay_z", run: (g) => h4.glass_bay_z(g, 31, 14, 19, 6, 6), box: [31, 6, 14, 31, 6, 19] },
  { name: "ledgestone_wall", run: (g) => h4.ledgestone_wall(g, 11, 17, 7), box: [11, 1, 7, 17, 5, 7] },
  { name: "carport", run: (g) => h4.carport(g, 0, 7, 9, 21), box: [0, 1, 7, 9, 5, 21] },
  { name: "car_50s (north)", run: (g) => h4.car_50s(g, 3, 1), box: [3, 1, 1, 5, 2, 7], pre: [[4, 1, 4, "stone"]] },
  { name: "car_50s (east)", run: (g) => h4.car_50s(g, 3, 1, "east"), box: [3, 1, 1, 9, 2, 3] },
  { name: "mailbox", run: (g) => h4.mailbox(g, 9, 1), box: [9, 1, 1, 9, 2, 1] },
  { name: "garden_lamp", run: (g) => h4.garden_lamp(g, 17, 5), box: [17, 1, 5, 17, 3, 5] },
  { name: "sofa_low", run: (g) => h4.sofa_low(g, 12, 19, 3, "x", "south"), box: [11, 2, 18, 15, 2, 19] },
  { name: "conversation_pit", run: (g) => h4.conversation_pit(g, 13, 20, 17, 23), box: [13, 1, 20, 17, 1, 23] },
  { name: "bed_double", run: (g) => h4.bed_double(g, 28, 19, "north"), box: [27, 2, 17, 29, 3, 19], clear: [[28, 2, 20], [28, 3, 20]] },
];

const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

let failed = 0;
for (const c of cases) {
  const g = new Grid(SIZE);
  for (const [x, y, z, block] of c.pre ?? []) g.set(x, y, z, block);
  const pre = new Set((c.pre ?? []).map((p) => p.slice(0, 3).join(",")));
  const r = c.run(g);
  const written = [...g.cells.values()].filter((cell) => !pre.has(cell.pos.join(",")));
  const problems = [];
  if (r.placed !== written.length) problems.push(`reported ${r.placed} placed, grid holds ${written.length}`);
  if (written.length === 0) problems.push("placed nothing");
  for (const cell of written) if (!inBox(cell.pos, c.box)) problems.push(`wrote outside the footprint at ${cell.pos.join(",")} (${cell.block})`);
  for (const [x, y, z, block] of c.pre ?? []) if (g.blockAt(x, y, z) !== `minecraft:${block}`) problems.push(`overwrote ${block} at ${x},${y},${z}`);
  for (const [x, y, z] of c.clear ?? []) if (!g.isAir(x, y, z)) problems.push(`lane not clear at ${x},${y},${z} (${g.blockAt(x, y, z)})`);
  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "ok  "} ${c.name}: placed ${r.placed}, skipped ${r.skipped}${problems.length ? ` - ${problems.join("; ")}` : ""}`);
}
console.log(failed ? `${failed} helper(s) failed` : "all h4 helpers passed");
process.exitCode = failed ? 1 : 0;
