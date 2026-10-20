// Smoke test for vocab/h3.mjs: each helper once on a small grid with a stone ground at y0. A helper passes when it placed
// something, refused nothing, and every cell it changed lies inside the footprint it was given (the ground stays).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { fork_arch, coping_run, arch_lace, pool, helix, dome_ribbed, door_pair, poplar } from "./h3.mjs";

const SIZE = [48, 26, 48];
const inBox = ([x, y, z], [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const stateOf = (c) => JSON.stringify([c.block, c.state ?? null]);
const fresh = () => {
  const g = new Grid(SIZE);
  g.fill([0, 0, 0], [SIZE[0] - 1, 0, SIZE[2] - 1], "smooth_stone");
  return g;
};

// [name, footprint the helper must stay inside, the call]
const cases = [
  ["fork_arch", [4, 18, 30, 6, 18, 30], (g) => fork_arch(g, "south", 4, 18, 30)],
  ["coping_run", [2, 19, 2, 20, 20, 12], (g) => coping_run(g, [2, 2, 20, 12], 19)],
  ["arch_lace", [2, 10, 5, 15, 22, 5], (g) => arch_lace(g, { x0: 2, x1: 15, z: 5, spring: 10, crown: 22 })],
  ["pool", [20, 1, 20, 32, 1, 30], (g) => pool(g, [20, 20, 32, 30], 1)],
  ["helix", [36, 1, 36, 38, 12, 38], (g) => helix(g, 36, 36)],
  ["dome_ribbed", [1, 1, 1, 38, 23, 38], (g) => dome_ribbed(g, [19.5, 1, 19.5])],
  ["door_pair", [29, 1, 12, 30, 2, 12], (g) => door_pair(g, [30, 1, 12], "north")],
  ["poplar", [5, 1, 5, 7, 11, 7], (g) => poplar(g, 6, 6, 9)],
];

let failures = 0;
for (const [name, box, call] of cases) {
  const g = fresh();
  const before = new Map([...g].map((c) => [c.pos.join(","), stateOf(c)]));
  const r = call(g);
  const changed = [...g].filter((c) => before.get(c.pos.join(",")) !== stateOf(c));
  const outside = changed.filter((c) => !inBox(c.pos, box));
  const ok = r.placed > 0 && r.refused.length === 0 && changed.length === r.placed && outside.length === 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${r.placed} placed, ${r.refused.length} refused` +
    (outside.length ? `, ${outside.length} outside the footprint (first ${outside[0].pos})` : ""));
  if (!ok) failures++;
}

// a door pair is all or nothing: a taken cell means no leaf is written
{
  const g = fresh();
  g.set(29, 2, 12, "stone");
  const r = door_pair(g, [30, 1, 12], "north");
  const ok = r.placed === 0 && r.refused.length === 1 && g.blockAt(30, 1, 12) === "minecraft:air" && g.blockAt(29, 2, 12) === "minecraft:stone";
  console.log(`${ok ? "ok  " : "FAIL"} door_pair refuses a half-taken pair: ${r.placed} placed, ${r.refused.length} refused`);
  if (!ok) failures++;
}

console.log(failures ? `${failures} helper check(s) failed` : "all h3 helper checks passed");
process.exitCode = failures ? 1 : 0;
