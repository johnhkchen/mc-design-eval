// Calls every h2.mjs helper once at its plan.md coordinates and checks each placed only inside the footprint it returned;
// then checks a helper leaves existing blocks alone (air only). Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const SIZE = [96, 34, 96];
const COLUMNS = [[25, 35], [31, 35], [37, 35], [43, 35], [51, 35], [57, 35], [63, 35], [69, 35]];
const CALLS = [
  ["galleryFloor", (g) => h2.galleryFloor(g, 25, 35, 70, 41, { skip: COLUMNS })],
  ["tallWindow", (g) => h2.tallWindow(g, 28, 42, "north", 4, 5, { sill: false, replace: true })],
  ["grandStair", (g) => h2.grandStair(g, 45, 60)],
  ["liveOak", (g) => h2.liveOak(g, 41, 8)],
  ["forecourtOval", (g) => h2.forecourtOval(g, 37, 24, 58, 31)],
  ["parterreBed", (g) => h2.parterreBed(g, 6, 38, 16, 46)],
  ["carriageHouse", (g) => h2.carriageHouse(g, 76, 40)],
  ["porchLantern", (g) => h2.porchLantern(g, 47, 16, 38)],
];

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };

for (const [name, call] of CALLS) {
  const g = new Grid(SIZE);
  const r = call(g);
  const [x0, y0, z0, x1, y1, z1] = r.box;
  const cells = [...g].filter((c) => c.block !== "minecraft:air");
  const outside = cells.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  if (cells.length === 0) fail(`${name}: placed nothing`);
  if (outside.length) fail(`${name}: ${outside.length} blocks outside its footprint, first at ${outside[0].pos}`);
  if (r.placed !== cells.length) fail(`${name}: reported ${r.placed} placed, grid has ${cells.length}`);
  console.log(`${name}: ${cells.length} blocks in ${JSON.stringify(r.box)}${r.clipped ? `, ${r.clipped} clipped at the grid edge` : ""}`);
}

// Air only: a block already in the footprint is kept, and reported as skipped.
{
  const g = new Grid(SIZE);
  g.set(25, 3, 35, "stone");
  const r = h2.galleryFloor(g, 25, 35, 70, 41, { skip: COLUMNS });
  if (r.skipped !== 1 || g.blockAt(25, 3, 35) !== "minecraft:stone") fail("galleryFloor overwrote a non-air cell");
  console.log(`air only: skipped ${r.skipped}, kept ${g.blockAt(25, 3, 35)}`);
}

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
