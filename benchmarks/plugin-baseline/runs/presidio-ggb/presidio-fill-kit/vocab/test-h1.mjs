// Calls every H1 helper once on a small grid and checks that each wrote only inside the footprint it was given.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { corner_boards, door, shutter, quoins, belfry, weathered_concrete, magazine_door, cypress } from "./h1.mjs";

const g = new Grid([20, 12, 16], { dataVersion: 3955 });
const inBox = (box, [x, y, z]) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
const state = (c) => c.block + JSON.stringify(c.state ?? {});
const snap = () => new Map([...g].map((c) => [c.pos.join(","), state(c)]));
let fails = 0;

function run(name, box, fn) {
  const before = snap(), r = fn();
  const changed = [...g].filter((c) => before.get(c.pos.join(",")) !== state(c));
  const stray = changed.filter((c) => !inBox(box, c.pos));
  const ok = stray.length === 0 && r.placed > 0 && r.refused.length === 0;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${r.placed} placed, ${r.refused.length} refused` +
    (stray.length ? `; wrote outside footprint at ${stray.map((c) => c.pos.join(",")).join(" ")}` : ""));
}

// the cells each call may write, as boxes [x0, y0, z0, x1, y1, z1]
run("corner_boards", [2, 1, 2, 2, 3, 2], () => { g.fill([2, 1, 2], [2, 3, 2], "white_concrete"); return corner_boards(g, [2, 2], 1, 3, { replace: ["white_concrete"] }); });
run("door (single)", [4, 1, 4, 4, 2, 4], () => door(g, [4, 1, 4], "south", "birch"));
run("door (double)", [6, 1, 4, 7, 2, 4], () => door(g, [6, 1, 4], "south", "iron", { double: true }));
run("shutter", [9, 1, 4, 9, 1, 4], () => shutter(g, [9, 1, 4], "south", "warped"));
run("quoins", [11, 2, 4, 11, 5, 4], () => { g.fill([11, 2, 4], [11, 5, 4], "bricks"); return quoins(g, [11, 4], [2, 3, 4, 5], { replace: ["bricks"] }); });
run("belfry", [13, 8, 4, 16, 10, 4], () => belfry(g, [13, 8, 4], { face: "south" }));
run("weathered_concrete", [1, 1, 8, 4, 3, 9], () => weathered_concrete(g, [1, 1, 8, 4, 3, 9]));
run("magazine_door", [7, 1, 12, 10, 3, 12], () => { g.fill([7, 1, 12], [10, 3, 12], "andesite"); return magazine_door(g, [8, 1, 12]); });
run("cypress", [14, 1, 11, 16, 6, 13], () => cypress(g, [15, 1, 12], 6));

// refusal: a block in the upper half of the door cell blocks the whole door, and nothing is written
g.set(17, 2, 2, "stone");
const r = door(g, [17, 1, 2], "north", "spruce");
const refusedOk = r.placed === 0 && r.refused.length === 2 && g.blockAt(17, 1, 2) === "minecraft:air";
if (!refusedOk) fails++;
console.log(`${refusedOk ? "ok  " : "FAIL"} door refuses whole when blocked: ${r.placed} placed, ${r.refused.length} refused`);

process.exitCode = fails ? 1 : 0;
console.log(fails ? `${fails} check(s) failed` : "all H1 helpers wrote only inside their footprints");
