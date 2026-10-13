// Calls every part-2 helper once on a fresh grid and checks it wrote only inside the box it returned, above ground,
// and that a non-over call leaves an existing wall alone. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h2.mjs";

const fresh = () => new Grid([32, 24, 32]);
const inside = (c, [x0, y0, z0, x1, y1, z1]) => c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1 && c[2] >= z0 && c[2] <= z1;

const cases = {
  partyPilaster: (g) => h.partyPilaster(g, 11, 12, 3, 22),
  windowDress: (g) => h.windowDress(g, 5, 8, 10, 12, 2, "cut_sandstone"),
  stoop: (g) => h.stoop(g, 4, 9, 1, "south"),
  bracketCornice: (g) => h.bracketCornice(g, 11, 19, 11, 22, "south", { brackets: [12, 14, 16, 18] }),
  stairFlight: (g) => h.stairFlight(g, 9, 20, 7, "spruce", { railX: 10 }),
  areaRailing: (g) => h.areaRailing(g, 7, 10, 1, 9),
  streetTree: (g) => h.streetTree(g, 2, 7),
};

let failed = 0;
const fail = (msg) => { failed++; console.log("FAIL " + msg); };

for (const [name, call] of Object.entries(cases)) {
  const g = fresh();
  const r = call(g);
  const written = [...g];
  if (r.cells.length === 0) fail(`${name}: placed nothing`);
  if (written.length !== r.cells.length) fail(`${name}: ${written.length} cells in grid, ${r.cells.length} reported`);
  for (const c of written) {
    if (!inside(c.pos, r.box)) fail(`${name}: wrote ${c.pos} outside box ${r.box}`);
    if (c.pos[1] < 1) fail(`${name}: wrote ground/floor at y=${c.pos[1]}`);
  }
  console.log(`${name}: ${r.cells.length} placed, ${r.skipped} skipped, box ${r.box}`);
}

// air only: a wall already there is left alone by a plain (non-over) call
{
  const g = fresh();
  for (let y = 3; y <= 22; y++) g.set(11, y, 12, "minecraft:bricks");
  const r = h.partyPilaster(g, 11, 12, 3, 22);
  if (r.cells.length !== 0 || r.skipped !== 20) fail(`partyPilaster on a wall: placed ${r.cells.length}, skipped ${r.skipped}`);
  const o = h.partyPilaster(g, 11, 12, 3, 22, { over: true });
  if (o.cells.length !== 20 || g.blockAt(11, 5, 12) !== "minecraft:cut_sandstone") fail("partyPilaster over:true did not trim the wall");
}

// stairs face the way they climb; the stoop's steps and the flight's stairs are facing south
{
  const g = fresh();
  h.stoop(g, 4, 9, 1, "south");
  if (g.get(4, 1, 9)?.state?.facing !== "south" || g.get(4, 2, 10)?.block !== "minecraft:stone_brick_stairs") fail("stoop steps wrong");
  const f = fresh();
  h.stairFlight(f, 9, 20, 7, "spruce");
  if (f.get(9, 6, 23)?.state?.facing !== "south" || f.get(9, 3, 20)?.block !== "minecraft:spruce_stairs") fail("stairFlight steps wrong");
}

console.log(failed ? `${failed} check(s) FAILED` : "test-h2: all checks passed");
process.exit(failed ? 1 : 0);
