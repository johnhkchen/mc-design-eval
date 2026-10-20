// Smoke test for vocab/h1.mjs: every helper once on an all-air grid; every block it places must sit inside the
// footprint the test gives it. Plus: a solid cell is not overwritten, and a door has both halves.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h1.mjs";

const inside = (box, [x, y, z]) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];

const cases = [
  ["shopfront_bay", (g) => h.shopfront_bay(g, { x: 2, z0: 2, floorY: 2, face: "west", post: "stripped_spruce_log", bulk: "spruce_planks", head: "spruce_planks", doorMat: "spruce" }), [2, 3, 2, 2, 8, 10]],
  ["paired_window", (g) => h.paired_window(g, { x: 2, z: 3 }), [2, 11, 3, 3, 15, 4]],
  ["round_logo", (g) => h.round_logo(g, { x: 1, zc: 10, yc: 14 }), [1, 12, 8, 1, 16, 12]],
  ["lozenge_banner", (g) => h.lozenge_banner(g, { x: 1, y: 8, z: 5 }), [1, 8, 5, 1, 8, 5]],
  ["cornice_run", (g) => h.cornice_run(g, { x: 1, y: 17, z0: 4, z1: 12, face: "west", corona: false, cap: false }), [0, 17, 4, 1, 19, 12]],
  ["pilaster", (g) => h.pilaster(g, { x: 2, z: 4, y0: 10, y1: 16, headY: 20, quoin: true }), [2, 10, 4, 2, 21, 5]],
  ["vent_hutch", (g) => h.vent_hutch(g, { x: 14, z: 20, y: 18 }), [14, 18, 20, 15, 19, 20]],
  ["dusk_glow", (g) => h.dusk_glow(g, { x: 4, y: 9, z: 12, kind: "ceiling" }), [4, 9, 12, 4, 9, 12]],
  ["kells_front", (g) => h.kells_front(g, { x: 4, z0: 6, floorY: 3 }), [4, 3, 5, 4, 8, 18]],
];

let failures = 0;
const fail = (msg) => { failures++; console.log(`FAIL ${msg}`); };

for (const [name, call, box] of cases) {
  const g = new Grid([30, 30, 30]);
  const r = call(g);
  const cells = [...g];
  const outside = cells.filter((c) => !inside(box, c.pos));
  if (cells.length === 0) fail(`${name}: placed nothing`);
  if (outside.length) fail(`${name}: ${outside.length} block(s) outside the footprint, e.g. ${outside[0].pos} ${outside[0].block}`);
  if (r.placed !== cells.length) fail(`${name}: report says ${r.placed} placed, grid holds ${cells.length}`);
  if (!outside.length && cells.length && r.placed === cells.length) console.log(`ok   ${name}: ${cells.length} blocks, ${r.skipped.length} refused`);
}

// air only: a solid cell that is in the footprint keeps its block
{
  const g = new Grid([30, 30, 30]);
  g.set(14, 18, 20, "minecraft:stone");
  const r = h.vent_hutch(g, { x: 14, z: 20, y: 18 });
  if (g.blockAt(14, 18, 20) !== "minecraft:stone") fail("vent_hutch overwrote a solid cell");
  if (!r.skipped.some(([x, y, z]) => x === 14 && y === 18 && z === 20)) fail("vent_hutch did not report the refused cell");
  else console.log("ok   air-only: solid cell kept and reported");
}

// doors: both halves of each door pair
{
  const g = new Grid([30, 30, 30]);
  h.shopfront_bay(g, { x: 2, z0: 2, floorY: 2, face: "west", post: "stripped_spruce_log", bulk: "spruce_planks", head: "spruce_planks", doorMat: "spruce" });
  for (const z of [6, 7]) for (const [y, half] of [[3, "lower"], [4, "upper"]]) {
    const c = g.get(2, y, z);
    if (!c || c.block !== "minecraft:spruce_door" || c.state.half !== half) fail(`shopfront_bay door cell 2,${y},${z} is not the ${half} half`);
  }
  console.log("ok   shopfront_bay: both door halves");
}

console.log(failures ? `${failures} failure(s)` : "all helper checks passed");
process.exitCode = failures ? 1 : 0;
