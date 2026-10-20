// Calls every h1 helper once on a small grid and checks each placed only inside the footprint it was given.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  groundColumn, taperRing, pyramidCourse, shaftCourse, obsWindows, plazaDisc, seatingArc, pavilionBox,
  flagPole, floodlight, walkCell, lampPost, oakTree, lodgeHip,
} from "./h1.mjs";

const SIZE = [40, 72, 40];

// Stone to y4 and grass at y5 everywhere: the plaza level the helpers stand on.
const ground = () => {
  const g = new Grid(SIZE);
  g.fill([0, 0, 0], [39, 4, 39], "stone");
  g.fill([0, 5, 0], [39, 5, 39], "grass_block");
  return g;
};

// Runs fn on a grid from setup, checks every changed cell is inside box ([x0,y0,z0],[x1,y1,z1]) and that the
// return value counts the cells changed.
const check = (name, box, fn, setup = ground) => {
  const g = setup();
  const before = new Map(g.cells);
  const n = fn(g);
  const changed = [...g.cells.keys()].filter((k) => g.cells.get(k) !== before.get(k));
  const [[x0, y0, z0], [x1, y1, z1]] = box;
  for (const k of changed) {
    const [x, y, z] = g.cells.get(k).pos;
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name}: wrote outside footprint at ${k}`);
  }
  assert.equal(n, changed.length, `${name}: returned ${n}, changed ${changed.length}`);
  assert.ok(n > 0, `${name}: placed nothing`);
  console.log(`ok ${name}: ${n} blocks`);
  return g;
};

check("groundColumn", [[5, 0, 5], [5, 5, 5]], (g) => groundColumn(g, 5, 5, 5), () => new Grid(SIZE));

const taperBox = [[10, 10, 10], [16, 10, 16]];
const g1 = check("taperRing", taperBox, (g) => taperRing(g, 10, 10, 10, 16, 16));
assert.equal(taperRing(g1, 10, 10, 10, 16, 16), 0, "taperRing: second call must write nothing (air only)");

check("pyramidCourse", [[18, 10, 18], [22, 17, 22]], (g) => pyramidCourse(g, 20, 10, 20));
check("shaftCourse", [[10, 30, 10], [16, 30, 16]], (g) => shaftCourse(g, 30, 10, 10, 16, 16));

check("obsWindows", [[18, 66, 18], [22, 67, 22]],
  (g) => { assert.equal(obsWindows(g, 20, 20), 0, "obsWindows: refused without over"); return obsWindows(g, 20, 20, { over: true }); },
  () => { const g = ground(); g.fill([18, 66, 18], [22, 67, 22], "smooth_quartz"); return g; });

check("plazaDisc", [[9, 5, 9], [31, 5, 31]], (g) => plazaDisc(g, 20, 20, 5, 0, 10.5, "smooth_stone", { over: true }));
check("seatingArc", [[9, 6, 9], [31, 7, 31]], (g) => seatingArc(g, 20, 20, 6));

const pav = check("pavilionBox", [[30, 6, 20], [34, 8, 23]], (g) => pavilionBox(g, 30, 6, 20, "east"));
assert.ok(pav.isAir(34, 6, 21) && pav.isAir(34, 7, 22), "pavilionBox: entrance must stay open");
assert.equal(pav.get(32, 7, 21).block, "minecraft:lantern", "pavilionBox: hanging lantern missing");

check("flagPole", [[36, 6, 20], [37, 11, 20]], (g) => flagPole(g, 0, 20, 20, 16, 5));
check("floodlight", [[20, 5, 20], [20, 5, 20]], (g) => floodlight(g, 20, 5, 20, { over: true }));

check("walkCell", [[20, 5, 20], [20, 6, 20]],
  (g) => walkCell(g, 20, 5, 20, { over: true }),
  () => { const g = ground(); g.set(21, 6, 20, "grass_block"); return g; });
check("lampPost", [[20, 6, 20], [20, 7, 20]], (g) => lampPost(g, 20, 5, 20));
check("oakTree", [[18, 6, 18], [22, 12, 22]], (g) => oakTree(g, 20, 5, 20));
check("lodgeHip", [[30, 3, 36], [32, 5, 37]], (g) => lodgeHip(g, 30, 3, 36), () => new Grid(SIZE));

console.log("h1: all helpers passed");
