// Calls each h2 helper once on a small grid and checks that it placed blocks where it was given and nowhere else.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stringCourse, flatArch, porticoColumn, townHallLetters, belfryOpening, dormer, stairFlight, flagpole } from "./h2.mjs";

const fresh = () => new Grid([40, 40, 40]);
const snap = (g) => new Map([...g.cells].map(([k, c]) => [k, c.block + JSON.stringify(c.state ?? {})]));
const inBox = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;

let failed = 0;
// run(g) does the call; want is the placed count; box is the footprint the call was given; prep(g) sets up the grid first.
function check(name, { prep = () => {}, run, want, box }) {
  const g = fresh();
  prep(g);
  const before = snap(g);
  const r = run(g);
  const changed = [...g.cells.values()].filter((c) => before.get(`${c.pos}`) !== c.block + JSON.stringify(c.state ?? {}));
  const outside = changed.filter((c) => !inBox(c.pos, box));
  const ok = r.placed === want && outside.length === 0 && changed.length === want;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${r.placed} (want ${want}), changed ${changed.length}, outside footprint ${outside.length}`);
}

check("stringCourse", { run: (g) => stringCourse(g, "north", 10, 4, 36), want: 66, box: [4, 10, 9, 36, 10, 10] });
check("flatArch", {
  prep: (g) => g.fill([6, 9, 10], [8, 9, 10], "bricks"),
  run: (g) => flatArch(g, "north", 10, 6, 8, 9, { over: true }), want: 3, box: [6, 9, 10, 8, 9, 10],
});
check("porticoColumn", { run: (g) => porticoColumn(g, 15, 6), want: 11, box: [15, 4, 6, 15, 14, 6] });
check("townHallLetters", {
  prep: (g) => g.fill([15, 15, 6], [25, 16, 6], "smooth_quartz"),
  run: (g) => townHallLetters(g, "north", 6, 15, 25, 15), want: 1, box: [15, 15, 5, 25, 16, 6],
});
check("belfryOpening", {
  prep: (g) => g.fill([18, 31, 10], [22, 35, 10], "bricks"),
  run: (g) => belfryOpening(g, "north", 10, 19, 21, 32, { over: true }), want: 9, box: [19, 32, 10, 21, 34, 10],
});
check("dormer", { run: (g) => dormer(g, "north", 20, 12, 22), want: 15, box: [10, 22, 20, 14, 24, 20] });
check("stairFlight", { run: (g) => stairFlight(g, 11, 12, 24, 4, { dir: "north", rail: "east" }), want: 63, box: [11, 4, 18, 12, 11, 24] });
check("flagpole", { run: (g) => flagpole(g, 7, 6), want: 11, box: [7, 1, 6, 7, 11, 6] });

// The air-only rule: a cell that is already built is skipped, not overwritten.
{
  const g = fresh();
  g.set(7, 5, 6, "bricks");
  const r = flagpole(g, 7, 6);
  const ok = r.skipped.some((s) => s[0] === 7 && s[1] === 5 && s[2] === 6) && g.blockAt(7, 5, 6) === "minecraft:bricks";
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} air-only: built cell kept, reported as skipped`);
}

if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log("all h2 checks passed");
