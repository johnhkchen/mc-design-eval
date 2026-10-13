// Calls every h1 helper once on a grid with solid ground to y4, and checks that each one changed only cells inside the
// footprint it was given, placed something, and refused nothing. Also checks that the air-only rule holds.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const SIZE = [44, 40, 40];
const cases = [
  ["post", (g) => h1.post(g, 2, 5, 8, 5), [[2, 5, 5], [2, 8, 5]]],
  ["jettyBracket", (g) => h1.jettyBracket(g, 4, 11, 4, "south"), [[4, 11, 4], [4, 11, 4]]],
  ["gableFrame", (g) => h1.gableFrame(g, 2, 21, 3, "north"), [[2, 24, 3], [21, 34, 3]]],
  ["monitorVent", (g) => h1.monitorVent(g, 11, 12, 35, 14, 22), [[11, 35, 14], [12, 37, 22]]],
  ["hatchLadder", (g) => h1.hatchLadder(g, 11, 16, "south"), [[11, 5, 16], [11, 12, 16]]],
  ["pierPanel", (g) => h1.pierPanel(g, 9, "north", "oak"), [[9, 9, 4], [9, 11, 5]]],
  ["lampPost", (g) => h1.lampPost(g, 1, 1), [[1, 5, 1], [1, 8, 1]]],
  ["pavingPatch", (g) => h1.pavingPatch(g, 0, 10, 0, 3, { replace: true }), [[0, 4, 0], [10, 4, 3]]],
];

const ground = () => {
  const g = new Grid(SIZE);
  g.fill([0, 0, 0], [SIZE[0] - 1, 4, SIZE[2] - 1], "stone");
  return g;
};
const cellsOf = (g) => {
  const m = new Map();
  for (let x = 0; x < SIZE[0]; x++) for (let y = 0; y < SIZE[1]; y++) for (let z = 0; z < SIZE[2]; z++) m.set(`${x},${y},${z}`, g.blockAt(x, y, z));
  return m;
};

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };
for (const [name, run, [a, b]] of cases) {
  const g = ground(), before = cellsOf(g);
  const r = run(g), after = cellsOf(g);
  const inside = (x, y, z) => [x, y, z].every((v, i) => v >= Math.min(a[i], b[i]) && v <= Math.max(a[i], b[i]));
  const changed = [...after].filter(([k, v]) => v !== before.get(k)).map(([k]) => k.split(",").map(Number));
  const outside = changed.filter((c) => !inside(...c));
  if (!r.placed) fail(`${name}: placed nothing`);
  if (r.refused.length) fail(`${name}: refused ${r.refused.slice(0, 4).join("; ")}`);
  if (changed.length !== r.placed) fail(`${name}: changed ${changed.length} cells, reported ${r.placed}`);
  if (outside.length) fail(`${name}: wrote outside its footprint at ${outside.slice(0, 4).join(" ")}`);
  else console.log(`ok ${name}: ${r.placed} placed`);
}

// air-only: a post into a stone column is refused and changes nothing
const g = ground();
const r = h1.post(g, 5, 2, 3, 5);
if (r.placed || r.refused.length !== 2) fail(`air-only: post into ground placed ${r.placed}, refused ${r.refused.length}`);
else console.log("ok air-only: post into ground refused");

console.log(failed ? `${failed} check(s) failed` : "all h1 checks passed");
process.exit(failed ? 1 : 0);
