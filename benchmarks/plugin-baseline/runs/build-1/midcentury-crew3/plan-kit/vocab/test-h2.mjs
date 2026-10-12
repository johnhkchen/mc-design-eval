// Calls every h2 helper once on a small grid. Each call must place something, and every cell it changes (new or
// swapped) must sit inside the footprint it was given. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const g = new Grid([34, 9, 34]);
const blocks = () => new Map([...g.cells].map(([k, c]) => [k, c.block]));
let failures = 0;

// run one helper: the cells it changes must all lie in footprint [x0, y0, z0, x1, y1, z1]
function run(name, footprint, call) {
  const before = blocks();
  const n = call();
  const [x0, y0, z0, x1, y1, z1] = footprint;
  const changed = [...g.cells].filter(([k, c]) => before.get(k) !== c.block).map(([, c]) => c.pos);
  const outside = changed.filter(([x, y, z]) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  const ok = n > 0 && n === changed.length && outside.length === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${n} placed${outside.length ? `, outside: ${JSON.stringify(outside)}` : ""}`);
}

// ground the helpers that replace or stand on something (the earlier parts' cells)
for (let x = 9; x <= 32; x++) for (let z = 6; z <= 27; z++) {
  const inHole = (x >= 17 && x <= 21 && z >= 12 && z <= 17) || (x >= 20 && x <= 21 && z >= 21 && z <= 22);
  if (!inHole) g.set(x, 6, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
for (let x = 1; x <= 8; x++) g.set(x, 0, 4, "smooth_stone");
g.set(13, 5, 16, "dark_oak_log", { axis: "y" }); // the beam the dining pendant hangs from
g.set(26, 2, 3, "stone"); // a cell an earlier part owns: must survive

run("header_course", [9, 5, 8, 14, 5, 8], () => h2.header_course(g, 9, 8, 14, 8, 5));
run("clerestory", [22, 4, 8, 30, 4, 8], () => h2.clerestory(g, 22, 8, 4));
run("fascia_ring", [9, 6, 6, 32, 6, 27], () =>
  h2.fascia_ring(g, { x0: 9, z0: 6, x1: 32, z1: 27, y: 6, half: "bottom", holes: [[17, 12, 21, 17], [20, 21, 21, 22]], swap: "smooth_stone_slab" }));
run("joint_row", [1, 0, 4, 8, 0, 4], () => h2.joint_row(g, 1, 8, 4, 0, { swap: "smooth_stone" }));
run("saguaro", [25, 1, 3, 26, 3, 3], () => h2.saguaro(g, 26, 3, 3));
if (g.blockAt(26, 2, 3) !== "minecraft:stone") { failures++; console.log("FAIL saguaro wrote over the earlier stone"); }
run("lounger", [20, 1, 27, 21, 1, 27], () => h2.lounger(g, 20, 27, "x"));
run("terrazzo_floor", [14, 1, 14, 16, 1, 16], () => h2.terrazzo_floor(g, [14, 1, 14, 16, 1, 16], 7));
run("sideboard", [17, 2, 9, 19, 4, 9], () => h2.sideboard(g, 17, 9, 3, "x", "south"));
run("dining_set", [12, 2, 14, 15, 4, 18], () => h2.dining_set(g, 13, 15));
run("bath_fit", [26, 2, 14, 27, 3, 16], () => h2.bath_fit(g, 26, 14));

console.log(failures ? `${failures} failure(s)` : "all h2 helpers passed");
process.exit(failures ? 1 : 0);
