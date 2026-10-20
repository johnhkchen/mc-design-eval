// Calls each h2 helper once on one small grid; every block it changes must lie inside the footprint it was given,
// and the count must match what it reports. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { string_course, door_hood, mission_parapet, colonnade, dormer, glacis, deck_stair } from "./h2.mjs";

const g = new Grid([48, 10, 30]);
const sig = (c) => JSON.stringify([c.block, c.state ?? {}]);
const at = (x, y, z) => g.get(x, y, z);
const id = (c) => c?.block.replace(/^minecraft:/, "");   // the grid stores ids with the namespace
const topOf = (x, z) => { for (let y = 9; y >= 0; y--) if (at(x, y, z)) return y; return -1; };
const fails = [];
const expect = (ok, msg) => { if (!ok) fails.push(msg); };

function check(name, box, fn) {
  const before = new Map([...g.cells.values()].map((c) => [c.pos.join(","), sig(c)]));
  const r = fn();
  const changed = [...g.cells.values()].filter((c) => sig(c) !== before.get(c.pos.join(",")));
  const [x0, y0, z0, x1, y1, z1] = box;
  const outside = changed.filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  expect(outside.length === 0, `${name}: wrote outside its footprint at ${outside.map((c) => c.pos.join(",")).join(" ")}`);
  expect(r.placed === changed.length, `${name}: reports ${r.placed} placed, changed ${changed.length}`);
  expect(r.placed > 0, `${name}: placed nothing`);
  return r;
}

// string_course: solid walls on the ring; the default (air only) writes nothing, { replace } lays the 24-cell ring
g.fill([0, 1, 0], [6, 5, 6], "white_concrete");
const dry = string_course(g, [0, 0, 6, 6], 3, "smooth_quartz");
expect(dry.placed === 0 && dry.refused.length === 24, "string_course: default must refuse walls (air only)");
expect(check("string_course", [0, 3, 0, 6, 3, 6], () => string_course(g, [0, 0, 6, 6], 3, "smooth_quartz", { replace: true })).placed === 24,
  "string_course: ring should be 24 cells");

check("door_hood", [9, 3, 9, 9, 3, 9], () => door_hood(g, [9, 3, 9], "south"));
expect(id(at(9, 3, 9)) === "granite_stairs" && at(9, 3, 9).state.facing === "north", "door_hood: granite_stairs facing north");

check("mission_parapet", [11, 6, 9, 14, 8, 9], () => mission_parapet(g, [11, 6, 9]));

check("colonnade", [30, 1, 12, 41, 5, 12], () => colonnade(g, { xs: [30, 32, 34, 37, 39, 41], z: 12, y0: 1, y1: 5, floorY: 3 }));
const rails = [...g.cells.values()].filter((c) => id(c) === "birch_fence").map((c) => c.pos[0]).sort((a, b) => a - b);
expect(rails.join() === "31,33,35,36,38,40", `colonnade: rail x's ${rails.join()}`);

check("dormer", [44, 7, 5, 46, 8, 6], () => dormer(g, 44, 46, 5, 7));
expect(id(at(45, 7, 6)) === "glass_pane", "dormer: window pane in the front centre");

check("glacis", [0, 1, 20, 17, 4, 27], () => glacis(g, [0, 20, 17, 27], 0));
expect(topOf(5, 20) === 1 && topOf(5, 26) === 4, `glacis: tops ${topOf(5, 20)} / ${topOf(5, 26)}, want 1 / 4`);

check("deck_stair", [19, 1, 20, 22, 3, 22], () => deck_stair(g, [20, 1, 22], "north"));
expect(id(at(20, 3, 20)) === "polished_andesite_stairs" && at(20, 3, 20).state.facing === "north", "deck_stair: top step faces north");

if (fails.length) { for (const f of fails) console.error("FAIL", f); process.exitCode = 1; }
else console.log("h2 ok: 7 helpers, footprints held, plan values match");
