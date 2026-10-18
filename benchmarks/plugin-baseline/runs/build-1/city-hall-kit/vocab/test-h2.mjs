// Calls every helper in h2.mjs once on a small grid and checks that the blocks it placed lie in the footprint it was
// given, and that the helper's count matches what it placed. Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { fset, rusticatedBase, entablature, plainWall, triglyphs, baseWindowDressing, atticPanel, pedimentRelief, leadDome, hangingLantern } from "./h2.mjs";

// A north-face frame in plan.md's faceFrame shape (plot edge at z 0): at(u, d) -> [x, z]; dir(token) -> compass.
// Facing out is north, so in is south, and left (east when facing in) is east.
const F = { at: (u, d) => [u, d], dir: (t) => ({ out: "north", in: "south", left: "east", right: "west" })[t] ?? t };

let failures = 0;

// Runs call(g) on a fresh grid, with `pre` cells already holding stone; checks the placed blocks against box [x0,y0,z0,x1,y1,z1].
function run({ name, size, box, pre = [], call, extra = () => {} }) {
  const g = new Grid(size);
  const preKeys = new Set(pre.map((p) => p.join(",")));
  for (const p of pre) g.set(p[0], p[1], p[2], "stone");
  try {
    const n = call(g);
    const placed = [...g.cells.values()].filter((c) => !preKeys.has(c.pos.join(",")));
    const outside = placed.filter(({ pos: [x, y, z] }) => x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]);
    assert.equal(n, placed.length, "return count matches the blocks placed");
    assert.ok(placed.length > 0, "placed nothing");
    assert.equal(outside.length, 0, `${outside.length} block(s) outside the footprint, first at ${outside[0]?.pos}`);
    extra(g);
    console.log(`ok   ${name}: ${placed.length} blocks in footprint`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`);
  }
}

run({ name: "fset (facing tokens through the frame)", size: [8, 8, 8], box: [2, 4, 3, 2, 4, 3],
  call: (g) => fset(g, F, 2, 3, 4, "smooth_quartz_stairs", { facing: "out", half: "top", shape: "straight" }),
  extra: (g) => assert.equal(g.get(2, 4, 3).state.facing, "north") });

run({ name: "rusticatedBase", size: [16, 12, 8], box: [2, 1, 1, 12, 9, 4],
  call: (g) => rusticatedBase(g, F, 2, 12, 2, { openings: [{ u0: 5, u1: 7, y0: 3, y1: 7 }, { u0: 9, u1: 10, y0: 1, y1: 2, door: true }] }),
  extra: (g) => {
    assert.equal(g.get(6, 5, 2), undefined, "opening left open");
    assert.equal(g.get(3, 4, 2), undefined, "joint face left out");
    assert.equal(g.get(3, 4, 3).block, "minecraft:diorite", "joint shows diorite");
    assert.equal(g.get(9, 1, 1), undefined, "door leaves out the plinth");
  } });

run({ name: "entablature", size: [16, 40, 10], box: [2, 34, 2, 13, 36, 7],
  call: (g) => entablature(g, F, 2, 13, 2, { plainFrom: 6, plainTo: 9 }),
  extra: (g) => {
    assert.equal(g.get(4, 35, 2), undefined, "triglyph cell left empty");
    assert.equal(g.get(5, 35, 2).block, "minecraft:calcite", "frieze between triglyphs");
    assert.equal(g.get(7, 35, 2).block, "minecraft:smooth_quartz", "plain run has no triglyphs");
  } });

run({ name: "plainWall", size: [28, 42, 26], box: [20, 0, 20, 24, 40, 22],
  call: (g) => plainWall(g, [20, 0, 20, 24, 40, 22]),
  extra: (g) => {
    assert.equal(g.get(20, 35, 20).block, "minecraft:smooth_quartz", "band");
    assert.equal(g.get(20, 10, 20).block, "minecraft:polished_diorite", "ashlar");
  } });

run({ name: "triglyphs", size: [16, 40, 4], box: [2, 35, 2, 13, 35, 2],
  call: (g) => triglyphs(g, F, 2, 13, 2, { skipFrom: 8, skipTo: 9 }),
  extra: (g) => {
    assert.equal(g.get(8, 35, 2), undefined, "skipped span left empty");
    assert.equal(g.get(7, 35, 2).block, "minecraft:chiseled_quartz_block", "triglyph at u mod 4 = 3");
  } });

run({ name: "baseWindowDressing (keystone cell held)", size: [24, 10, 6], box: [20, 2, 2, 21, 8, 3],
  pre: [[20, 8, 3]],
  call: (g) => baseWindowDressing(g, F, 20, 3),
  extra: (g) => {
    assert.equal(g.get(20, 8, 3).block, "minecraft:stone", "solid cell not overwritten");
    assert.deepEqual(g.refused.map((r) => r.slice(0, 3)), [[20, 8, 3]], "the keystone aimed at solid stone is refused and reported");
  } });

run({ name: "atticPanel", size: [32, 44, 12], box: [24, 38, 9, 31, 41, 10],
  call: (g) => atticPanel(g, F, 24, 31, 10),
  extra: (g) => {
    assert.equal(g.get(24, 39, 9).block, "minecraft:chiseled_quartz_block", "border proud at d-1");
    assert.equal(g.get(27, 39, 10).block, "minecraft:calcite", "field at d");
  } });

run({ name: "pedimentRelief", size: [120, 46, 3], box: [77, 38, 1, 114, 43, 1],
  call: (g) => pedimentRelief(g, { x0: 64, z: 1 }),
  extra: (g) => assert.equal(g.get(95, 42, 1).block, "minecraft:chiseled_quartz_block", "seated figure's body") });

run({ name: "leadDome", size: [44, 102, 44], box: [0, 71, 0, 43, 101, 43],
  call: (g) => leadDome(g, { cx: 21.5, cz: 21.5, y0: 71 }),
  extra: (g) => {
    const blocks = [...g.cells.values()].map((c) => c.block);
    for (const b of ["minecraft:gold_block", "minecraft:polished_andesite", "minecraft:glowstone"])
      assert.ok(blocks.includes(b), `no ${b}`);
  } });

run({ name: "hangingLantern", size: [16, 40, 16], box: [10, 30, 10, 10, 32, 10],
  pre: [[10, 33, 10]],
  call: (g) => hangingLantern(g, 10, 30, 10, 2),
  extra: (g) => {
    assert.equal(g.get(10, 30, 10).state.hanging, "true", "lantern hangs");
    assert.throws(() => hangingLantern(new Grid([4, 4, 4]), 1, 1, 1, 0), /no solid block above/);
  } });

if (failures) {
  console.log(`${failures} helper test(s) failed`);
  process.exitCode = 1;
} else {
  console.log("all helper tests passed");
}
