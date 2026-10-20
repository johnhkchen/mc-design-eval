// Calls every h3 helper once on a small grid and checks each placed only inside the footprint it was given, and only into air.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { colonnade, balustrade, pilaster, cupola, domeBase, domeShell, statue } from "./h3.mjs";

const SIZE = [40, 50, 60];

// Stone under the helpers' footprints (earlier parts' ground and floors); the helpers must leave it alone.
const ground = () => {
  const g = new Grid(SIZE, { dataVersion: 3955 });
  g.fill([0, 0, 0], [39, 4, 59], "stone");
  g.fill([0, 25, 0], [39, 25, 59], "smooth_stone");
  return g;
};

// Runs fn on a grid from setup and checks every changed cell is inside box ([x0,y0,z0],[x1,y1,z1]), was air before
// (unless over), and that the return value counts the cells changed.
const check = (name, box, fn, setup = ground, { over = false } = {}) => {
  const g = setup();
  const before = new Map(g.cells);
  const n = fn(g);
  const changed = [...g.cells.keys()].filter((k) => g.cells.get(k) !== before.get(k));
  const [[x0, y0, z0], [x1, y1, z1]] = box;
  for (const k of changed) {
    const [x, y, z] = g.cells.get(k).pos;
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name}: wrote outside footprint at ${k}`);
    if (!over) assert.equal(before.get(k)?.block ?? "minecraft:air", "minecraft:air", `${name}: wrote over a block at ${k}`);
  }
  assert.equal(n, changed.length, `${name}: returned ${n}, changed ${changed.length}`);
  assert.ok(n > 0, `${name}: placed nothing`);
  console.log(`ok ${name}: ${n} blocks`);
  return g;
};

const g1 = check("colonnade", [[3, 5, 3], [3, 10, 7]], (g) => colonnade(g, { axis: "x", at: 3, zs: [3, 5, 7], y0: 5, y1: 10 }));
assert.equal(colonnade(g1, { axis: "x", at: 3, zs: [3, 5, 7], y0: 5, y1: 10 }), 0, "colonnade: second call must write nothing");

check("balustrade", [[5, 12, 2], [5, 12, 18]], (g) => balustrade(g, { line: { axis: "x", at: 5, from: 2, to: 18 }, y: 12, skip: (x, z) => z >= 8 && z <= 12 }));
check("pilaster", [[6, 5, 9], [6, 10, 9]], (g) => pilaster(g, { x: 6, z: 9, y0: 5, y1: 10 }));
check("pilaster over wall", [[6, 5, 9], [6, 10, 9]],
  (g) => pilaster(g, { x: 6, z: 9, y0: 5, y1: 10, over: true }),
  () => { const g = ground(); g.fill([6, 5, 9], [6, 10, 9], "smooth_quartz"); return g; }, { over: true });

const g2 = check("cupola", [[18, 12, 29], [21, 15, 32]], (g) => cupola(g, { x0: 18, z0: 29, y0: 12 }));
const panes = [...g2.cells.values()].filter((c) => c.block === "minecraft:gray_stained_glass_pane").length;
assert.equal(panes, 16, "cupola: 4 faces x 2 cells x 2 high panes");

check("domeBase", [[11, 12, 39], [28, 14, 56]], (g) => domeBase(g, { cx: 20, cz: 48 }));

const g3 = check("domeShell", [[14, 26, 42], [25, 33, 53]], (g) => domeShell(g, { cx: 20, cz: 48 }));
const shellPanes = [...g3.cells.values()].filter((c) => c.block === "minecraft:gray_stained_glass_pane" && c.pos[1] === 27).length;
assert.equal(shellPanes, 8, "domeShell: eight windows at y27");

check("statue", [[19, 38, 47], [19, 41, 47]], (g) => statue(g, { x: 19, z: 47, y0: 38 }));

console.log("h3: all helpers pass");
