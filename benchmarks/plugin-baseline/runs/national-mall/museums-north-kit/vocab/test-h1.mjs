// Calls each h1 helper once on a fresh 1.21.1 grid and checks that every block it placed is inside the footprint given.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const DATA_VERSION = 3955;                                       // 1.21.1
const AIR = "minecraft:air";
const cases = [
  ["ashlarBay", (g) => h1.ashlarBay(g, 20, 41, "south"), [[20, 1, 41], [23, 10, 42]]],
  ["balustrade", (g) => h1.balustrade(g, 25, 33, 41, 12), [[25, 12, 41], [33, 15, 41]]],
  ["lanternCap", (g) => h1.lanternCap(g, 56, 26, 27), [[56, 27, 26], [58, 29, 28]]],
  ["redTileHip", (g) => h1.redTileHip(g, [10, 10, 30, 19], 12, 15), [[10, 12, 10], [30, 18, 19]]],
  ["panelSlotWall", (g) => h1.panelSlotWall(g, 10, 30, "south", 21), [[10, 1, 28], [30, 7, 30]]],
  ["glassFront", (g) => h1.glassFront(g, 20, 40, 24), [[19, 1, 24], [41, 6, 26]]],
  ["porchCanopy", (g) => h1.porchCanopy(g, 40, 22, 58, 31, 8), [[40, 4, 22], [58, 8, 31]]],
  ["lampPost", (g) => h1.lampPost(g, 5, 2, 5), [[5, 2, 5], [5, 4, 5]]],
];

let fails = 0;
const fail = (msg) => { fails++; console.log(`  FAIL ${msg}`); };
for (const [name, run, [lo, hi]] of cases) {
  const g = new Grid([60, 30, 60], { dataVersion: DATA_VERSION });
  const r = run(g);
  const placed = [...g].filter((c) => c.block !== AIR);
  const outside = placed.filter((c) => c.pos.some((v, i) => v < lo[i] || v > hi[i]));
  if (placed.length === 0) fail(`${name}: placed nothing`);
  if (outside.length) fail(`${name}: ${outside.length} block(s) outside the footprint, e.g. ${JSON.stringify(outside[0].pos)}`);
  if (r.refused.length) fail(`${name}: refused ${r.refused.length} write(s) on empty ground, e.g. ${JSON.stringify(r.refused[0])}`);
  if (r.notes?.length) console.log(`  note ${name}: ${r.notes.join("; ")}`);
  console.log(`${outside.length || placed.length === 0 || r.refused.length ? "  FAIL" : "  ok  "} ${name}: ${placed.length} blocks in ${JSON.stringify(lo)}..${JSON.stringify(hi)}`);
}

// Air only: a stone already in the way is kept and reported.
{
  const g = new Grid([60, 30, 60], { dataVersion: DATA_VERSION });
  g.set(20, 5, 41, "stone");
  const r = h1.ashlarBay(g, 20, 41, "south");
  if (g.blockAt(20, 5, 41) !== "minecraft:stone" || !r.refused.some((w) => w[0] === 20 && w[1] === 5 && w[2] === 41)) fail("ashlarBay overwrote stone");
  else console.log("  ok   ashlarBay keeps existing stone and reports it");
}

if (fails) { console.log(`${fails} failure(s)`); process.exit(1); }
console.log("all h1 helpers passed");
