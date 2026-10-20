// Smoke test for vocab/h2.mjs: each helper once on a small grid; every cell it changes must lie in its footprint.
// Run: node vocab/test-h2.mjs
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h2 from "./h2.mjs";

const snap = (g) => new Map([...g].map((c) => [c.pos.join(","), JSON.stringify([c.block, c.state ?? {}])]));
const changedOutside = (g, before, [a, b]) => [...g].filter((c) => {
  const [x, y, z] = c.pos;
  const inside = x >= a[0] && x <= b[0] && y >= a[1] && y <= b[1] && z >= a[2] && z <= b[2];
  return !inside && before.get(c.pos.join(",")) !== JSON.stringify([c.block, c.state ?? {}]);
}).map((c) => c.pos);

// stone at y1, dirt under the surface, grass_block at H(x, z)
function ground(g, [x0, x1], [z0, z1], H) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const h = H(x, z);
    g.set(x, 1, z, "stone");
    for (let y = 2; y < h; y++) g.set(x, y, z, "dirt");
    g.set(x, h, z, "grass_block");
  }
}

// run one helper: it must change cells only inside `box`, refuse nothing, and place something
function run(name, g, box, fn) {
  const before = snap(g);
  const res = fn();
  const outside = changedOutside(g, before, box);
  assert.deepEqual(outside, [], `${name} wrote outside its footprint: ${JSON.stringify(outside.slice(0, 5))}`);
  assert.deepEqual(res.refused, [], `${name} refused: ${JSON.stringify(res.refused.slice(0, 5))}`);
  assert.ok(res.placed > 0, `${name} placed nothing`);
  console.log(`ok ${name}: ${res.placed} writes`);
  return res;
}
const count = (g, id) => [...g].filter((c) => c.block === `minecraft:${id}`).length;

// pathRibbon: surface steps from 2 to 3 at x = 8, so the lower cells get a half step
{
  const g = new Grid([30, 12, 24]), H = (x) => (x >= 8 ? 3 : 2);
  ground(g, [0, 29], [0, 23], H);
  const res = run("pathRibbon", g, [[0, 1, 0], [29, 6, 23]], () =>
    h2.pathRibbon(g, [[2, 4], [12, 6], [20, 12]], 2, 0.5, { heightAt: H }));
  assert.ok(count(g, "smooth_sandstone_slab") > 0, "pathRibbon made no half step at the rise");
  assert.equal(res.steep, 0);
}

// moundLawn: lawn at y3, crown at y4, mossy slab ring at the crown edge
{
  const g = new Grid([30, 10, 30]);
  ground(g, [0, 29], [0, 29], () => 3);
  run("moundLawn", g, [[7, 3, 7], [23, 4, 23]], () => h2.moundLawn(g, 15, 15, 7, 3, 3));
  assert.ok(count(g, "mossy_cobblestone_slab") > 0, "moundLawn made no edging ring");
}

// portalFace: face at x10..11, surround at x12, rail at y7
{
  const g = new Grid([24, 12, 30]);
  ground(g, [0, 23], [0, 29], () => 2);
  run("portalFace", g, [[10, 2, 4], [12, 7, 20]], () => h2.portalFace(g, {
    x: 10, z0: 4, z1: 20, yLo: 2, yHi: 6, mouthY: [3, 5], mouths: [[6, 11], [13, 18]], rail: [4, 20],
  }));
  assert.equal(g.blockAt(10, 4, 8), "minecraft:air", "portalFace left the mouth closed");
}

// stationRoof: spec file only
{
  const file = join(mkdtempSync(join(tmpdir(), "h2-")), "roof.json");
  const spec = h2.stationRoof(file, { footprint: [4, 23, 14, 32], y: 9, material: "dark_oak", overhang: { north: 2, south: 1, east: 1, west: 1 }, fascia: "stripped_dark_oak_log" });
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), spec);
  assert.equal(spec.preset, "cafe");
  console.log("ok stationRoof: roof.json written");
}

// boulder: andesite/tuff blob on the ground at y3, moss on top
{
  const g = new Grid([30, 10, 30]);
  ground(g, [0, 29], [0, 29], () => 3);
  run("boulder", g, [[17, 4, 17], [23, 6, 23]], () => h2.boulder(g, 20, 3, 20, 1.5));
  assert.ok(count(g, "moss_carpet") > 0, "boulder has no moss");
}

// pine: trunk on the ground at y3, persistent crown
{
  const g = new Grid([40, 20, 40]);
  ground(g, [0, 39], [0, 39], () => 3);
  run("pine", g, [[25, 4, 5], [35, 10, 15]], () => h2.pine(g, 30, 3, 10, 7));
  assert.equal(g.get(30, 9, 12).block, "minecraft:spruce_leaves");
  assert.equal(g.get(30, 9, 12).state.persistent, "true");
}

// picnicTable: two legs, a top slab and two benches on the ground at y4
{
  const g = new Grid([12, 10, 40]);
  ground(g, [0, 11], [0, 39], () => 4);
  run("picnicTable", g, [[5, 5, 29], [6, 6, 31]], () => h2.picnicTable(g, 5, 4, 30));
}

// wallLantern: hangs under a cap, stands on a wall top, and is refused with nothing to hang from
{
  const g = new Grid([20, 10, 30]);
  g.set(12, 7, 20, ...B.slab("birch", "top"));
  g.set(16, 4, 20, "white_terracotta");
  run("wallLantern hanging", g, [[12, 6, 20], [12, 6, 20]], () => h2.wallLantern(g, 12, 6, 20, { hanging: true }));
  run("wallLantern standing", g, [[16, 5, 20], [16, 5, 20]], () => h2.wallLantern(g, 16, 5, 20));
  const none = h2.wallLantern(g, 14, 6, 20, { hanging: true });
  assert.equal(none.placed, 0);
  assert.equal(none.refused.length, 1);
  console.log("ok wallLantern refuses a lantern with nothing to hang from");
}

console.log("all h2 helpers passed");
