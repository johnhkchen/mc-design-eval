// Calls each h4 helper once on a small grid (1.21.1) and checks every write it makes lands inside the footprint the test
// gives it, that ground (y 0) is never written, and that an existing block in the footprint survives.
// Run: node vocab/test-h4.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h4 from "./h4.mjs";

const SHAPE = [[9, 18, 29], [10, 19, 28], [11, 20, 27], [12, 21, 26], [13, 22, 25], [14, 23, 24]];
const cases = [
  ["clapboardWall", (g) => h4.clapboardWall(g, { box: [2, 2, 13, 13, 8, 13], body: "white_concrete", trim: "quartz_pillar", band: "smooth_quartz", holes: [[6, 2, 13, 9, 4, 13]] }), [2, 2, 13, 13, 8, 13]],
  ["shutterPair", (g) => h4.shutterPair(g, { x0: 6, x1: 9, y: 2, z: 12, face: "north", trap: "dark_oak" }), [6, 2, 12, 9, 3, 12]],
  ["shapedParapet", (g) => h4.shapedParapet(g, { z: 13, steps: SHAPE.map(([y, a, b]) => [y, a, b]), piers: 10, vent: { x0: 23, x1: 24, y: 11 } }), [18, 9, 13, 29, 14, 13]],
  ["rafterTails", (g) => h4.rafterTails(g, { x0: 36, x1: 44, z: 12, y: 5, into: "south" }), [36, 5, 12, 44, 5, 12]],
  ["pedimentPorch", (g) => h4.pedimentPorch(g, { x0: 55, x1: 57, z0: 10, z1: 12, y: 1, facing: "north" }), [55, 1, 10, 57, 7, 12]],
  ["chimneyStack", (g) => h4.chimneyStack(g, { wall: [2, 1, 17], into: "east", top: 15 }), [0, 1, 16, 2, 16, 18]],
  ["kitchenStove", (g) => h4.kitchenStove(g, { x: 10, y: 2, z: 20, facing: "north" }), [10, 2, 20, 12, 3, 20]],
  ["coatRack", (g) => h4.coatRack(g, { x: 89, y: 2, z: 17, facing: "west" }), [89, 2, 17, 89, 3, 17]],
];

let failed = 0;
for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = new Grid([112, 20, 24], { dataVersion: 3955 });
  for (let x = 0; x < 112; x++) for (let z = 0; z < 24; z++) g.set(x, 0, z, "grass_block");
  g.set(x1, y1, z1, "stone");        // an existing block at the footprint's far corner: must survive (air-only writes)
  const writes = [];
  const set = g.set.bind(g);
  g.set = (x, y, z, b, s, nbt) => { writes.push([x, y, z, b]); return set(x, y, z, b, s, nbt); };
  const n = call(g);
  const outside = writes.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ground = writes.filter(([, y]) => y === 0);
  const kept = g.blockAt(x1, y1, z1) === "minecraft:stone";
  const ok = n > 0 && outside.length === 0 && ground.length === 0 && kept;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${n} placed${outside.length ? `, outside ${JSON.stringify(outside)}` : ""}${ground.length ? `, ground ${ground.length}` : ""}${kept ? "" : ", overwrote the existing block"}`);
}
if (failed) { console.log(`${failed} helper(s) failed`); process.exitCode = 1; } else console.log("all h4 helpers ok");
