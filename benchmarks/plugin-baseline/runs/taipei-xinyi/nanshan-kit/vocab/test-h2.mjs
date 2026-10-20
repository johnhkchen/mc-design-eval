// Tests for vocab/h2.mjs: every helper once on its own 1.21.1 grid. Every cell that changes must sit inside the footprint
// the helper was given, pre-existing blocks must survive, and a few placed blocks are checked by name.
// Run: node vocab/test-h2.mjs   (exits non-zero on the first failure)
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const inside = (p, b) => p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1 && p[2] >= b.z0 && p[2] <= b.z1;

function check(name, fp, { pre = () => {}, run, expect = [], minimum = 1 }) {
  const g = new Grid([250, 400, 130], { dataVersion: 3955 });
  pre(g);
  const before = new Map([...g.cells.values()].map((c) => [c.pos.join(), c.block]));
  const n = run(g);
  for (const c of g.cells.values()) {
    if (before.get(c.pos.join()) === c.block) continue;
    assert.ok(inside(c.pos, fp), `${name}: wrote ${c.block} at ${c.pos}, outside its footprint`);
  }
  for (const [x, y, z, block] of expect) assert.equal(g.blockAt(x, y, z), block, `${name}: block at ${x},${y},${z}`);
  assert.ok(n >= minimum, `${name}: placed ${n}, expected at least ${minimum}`);
  console.log(`ok  ${name}: ${n} placed`);
}

for (const name of ["floorLine", "lobbyGlass", "crownFin", "litWindows", "plaqueFascia", "terraceDeck", "kiosk", "slabRamp", "ribFace", "glassHip"])
  assert.equal(typeof h2[name], "function", `${name} is not exported`);

check("floorLine", { x0: 10, x1: 20, y0: 19, y1: 19, z0: 11, z1: 11 }, {
  pre: (g) => g.set(12, 19, 11, "stone"),
  run: (g) => h2.floorLine(g, "north", 19, { x0: 10, x1: 20, y0: 4, y1: 30, z0: 10, z1: 20 }),
  expect: [[12, 19, 11, "minecraft:stone"], [13, 19, 11, "minecraft:light_gray_concrete"]],
  minimum: 10,
});

check("lobbyGlass", { x0: 20, x1: 31, y0: 4, y1: 18, z0: 20, z1: 31 }, {
  run: (g) => h2.lobbyGlass(g, { x0: 20, x1: 31, y0: 4, y1: 18, z0: 20, z1: 31 }, 6, "quartz_pillar"),
  expect: [[20, 4, 20, "minecraft:quartz_pillar"], [21, 4, 21, "minecraft:glass"], [21, 4, 20, "minecraft:air"]],
  minimum: 200,
});

check("crownFin", { x0: 195, x1: 195, y0: 353, y1: 382, z0: 12, z1: 12 }, {
  run: (g) => h2.crownFin(g, 195, "north", 381, { box: { x0: 166, x1: 229, y0: 353, y1: 381, z0: 12, z1: 75 } }),
  expect: [[195, 365, 12, "minecraft:smooth_quartz"], [195, 366, 12, "minecraft:quartz_pillar"], [195, 382, 12, "minecraft:end_rod"]],
  minimum: 30,
});

check("litWindows", { x0: 0, x1: 23, y0: 19, y1: 40, z0: 21, z1: 21 }, {
  run: (g) => h2.litWindows(g, "south", 2, { x0: 0, x1: 23, y0: 19, y1: 40, z0: 0, z1: 23 }, { seed: 3 }),
  minimum: 1,
});

check("plaqueFascia", { x0: 28, x1: 52, y0: 7, y1: 8, z0: 11, z1: 12 }, {
  pre: (g) => g.fill([28, 4, 12], [52, 8, 12], "smooth_quartz"),
  run: (g) => h2.plaqueFascia(g, "SHOP", [40, 7, 12], "north"),
  expect: [[36, 8, 12, "minecraft:smooth_quartz"]],
  minimum: 4,
});

check("terraceDeck", { x0: 0, x1: 5, y0: 19, y1: 20, z0: 72, z1: 83 }, {
  run: (g) => h2.terraceDeck(g, { x0: 0, x1: 5, y0: 19, y1: 19, z0: 72, z1: 83 }, 19),
  expect: [[3, 19, 75, "minecraft:air"], [0, 20, 80, "minecraft:glass_pane"], [0, 19, 80, "minecraft:smooth_stone_slab"]],
  minimum: 40,
});

check("kiosk", { x0: 18, x1: 29, y0: 3, y1: 10, z0: 84, z1: 89 }, {
  run: (g) => h2.kiosk(g, { x0: 18, x1: 29, y0: 3, y1: 10, z0: 84, z1: 89 }),
  expect: [[18, 10, 84, "minecraft:quartz_slab"], [18, 3, 84, "minecraft:glass"], [19, 9, 85, "minecraft:sea_lantern"]],
  minimum: 100,
});

check("slabRamp", { x0: 0, x1: 11, y0: 1, y1: 3, z0: 0, z1: 2 }, {
  run: (g) => h2.slabRamp(g, [11, 1, 0], [0, 3, 0], 3),
  expect: [[11, 2, 0, "minecraft:polished_andesite_slab"], [0, 3, 0, "minecraft:polished_andesite"], [0, 3, 2, "minecraft:polished_andesite"]],
  minimum: 30,
});

check("ribFace", { x0: 166, x1: 229, y0: 15, y1: 60, z0: 12, z1: 13 }, {
  run: (g) => h2.ribFace(g, "north", { box: { x0: 166, x1: 229, y0: 15, y1: 60, z0: 12, z1: 75 }, y0: 15, y1: 60 }),
  expect: [[166, 20, 12, "minecraft:white_concrete"], [167, 20, 12, "minecraft:air"], [170, 22, 13, "minecraft:light_gray_stained_glass"], [170, 20, 13, "minecraft:cyan_stained_glass"]],
  minimum: 1000,
});

check("glassHip", { x0: 6, x1: 50, y0: 372, y1: 384, z0: 71, z1: 116 }, {
  run: (g) => h2.glassHip(g, { x0: 6, x1: 50, z0: 71, z1: 116 }, { x0: 18, x1: 38, z0: 83, z1: 104 }, 372, 384),
  expect: [[18, 384, 83, "minecraft:iron_block"], [24, 384, 93, "minecraft:white_stained_glass"], [6, 372, 71, "minecraft:iron_block"]],
  minimum: 1000,
});

console.log("all h2 helper tests passed");
