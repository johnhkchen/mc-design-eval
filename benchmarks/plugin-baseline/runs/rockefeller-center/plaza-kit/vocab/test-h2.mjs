// Calls every h2 helper once on a small grid and checks that each block it placed sits inside the footprint it was given.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { halfStep, paverBand, rinkRim, glassFront, parapet, zodiacRing, cascade, goldRing, jet } from "./h2.mjs";

const SIZE = [70, 12, 50];
const key = (c) => `${c.block}${JSON.stringify(c.state ?? {})}`;
let failed = 0;

// One case: a fresh grid, optional setup, the helper call, and the footprint box [x0,y0,z0,x1,y1,z1] it may write in.
function run(name, setup, call, box) {
  const g = new Grid(SIZE, { dataVersion: 3955 });
  setup?.(g);
  const before = new Map([...g.cells].map(([k, c]) => [k, key(c)]));
  const res = call(g);
  const outside = [...g.cells].filter(([k, c]) => before.get(k) !== key(c)).filter(([, c]) => {
    const [x, y, z] = c.pos;
    return x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5];
  }).map(([k]) => k);
  const ok = res.placed > 0 && outside.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed}, refused ${res.refused.length}${outside.length ? `, outside the box: ${outside.join(" ")}` : ""}`);
}

const surface = (block, x0, x1, y, z0, z1) => (g) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, y, z, block); };

run("halfStep", surface("smooth_stone", 3, 3, 2, 3, 3), (g) => halfStep(g, 3, 3, 2, { material: "smooth_stone", overwrite: true }), [3, 2, 3, 3, 2, 3]);
run("paverBand", surface("smooth_stone", 0, 20, 4, 0, 20), (g) => paverBand(g, "x", 10, 0, 20, 4, { overwrite: true }), [10, 4, 0, 10, 4, 20]);
run("rinkRim", undefined, (g) => rinkRim(g, 23, 40, 13, 42, 1, { gaps: [[40, 25, 40, 28], [30, 13, 33, 13], [30, 42, 33, 42]] }), [23, 1, 13, 40, 2, 42]);
run("glassFront", undefined, (g) => glassFront(g, 9, "south", { x0: 22, x1: 43, door: [32, 33] }), [22, 1, 9, 43, 3, 9]);
run("parapet", undefined, (g) => parapet(g, "z", 9, 20, 45, 5), [20, 5, 9, 45, 6, 9]);
run("zodiacRing", undefined, (g) => zodiacRing(g, 19, [5.5, 27.5], 4.5), [19, 1, 23, 19, 10, 32]);
run("cascade", undefined, (g) => cascade(g, 20, 5, 20, 23), [20, 5, 20, 20, 6, 23]);
run("goldRing", undefined, (g) => goldRing(g, 21, [5.5, 27.5], 3.5), [21, 2, 24, 21, 9, 31]);
run("jet", (g) => g.set(63, 1, 7, "water"), (g) => jet(g, 63, 7, 0, { overwrite: true }), [63, 1, 7, 63, 2, 7]);

// Air-only default: a half step over a block it was not told to replace is refused, and nothing changes.
{
  const g = new Grid(SIZE, { dataVersion: 3955 });
  g.set(3, 2, 3, "smooth_stone");
  const res = halfStep(g, 3, 3, 2);
  const ok = res.placed === 0 && res.refused.length === 1 && g.blockAt(3, 2, 3) === "minecraft:smooth_stone";
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} halfStep refuses a surface it was not told to replace`);
}

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exitCode = failed ? 1 : 0;
