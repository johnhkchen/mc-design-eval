// Smoke test for vocab/h3.mjs: each helper once on a small grid. Every changed cell must lie in the footprint the
// helper returned, nothing may be refused, and the ground (y 0..3) must not change.
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([40, 20, 40]);
g.fill([0, 0, 0], [39, 3, 39], "stone");
g.fill([33, 8, 33], [36, 8, 38], "smooth_stone");   // the sill under the glow strip's candles

const snap = () => {
  const m = new Map();
  for (let x = 0; x < 40; x++) for (let y = 0; y < 20; y++) for (let z = 0; z < 40; z++) {
    const c = g.get(x, y, z);
    if (c) m.set(`${x},${y},${z}`, JSON.stringify([c.block, c.state ?? null]));
  }
  return m;
};
const inside = (b, x, y, z) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;
const ground = (m) => [...m].filter(([k]) => Number(k.split(",")[1]) <= 3);

function run(name, call) {
  const before = snap(), out = call(), after = snap();
  const changed = [...after].filter(([k, v]) => before.get(k) !== v).map(([k]) => k.split(",").map(Number));
  assert.ok(changed.length > 0, `${name} placed nothing`);
  for (const [x, y, z] of changed) assert.ok(inside(out.box, x, y, z), `${name} wrote ${x},${y},${z} outside ${JSON.stringify(out.box)}`);
  assert.deepEqual(out.refused, [], `${name} refused cells`);
  console.log(`ok ${name}: ${changed.length} blocks in ${JSON.stringify(out.box)}`);
  return after;
}

const groundBefore = ground(snap());
run("glassBay (kick)", () => h3.glassBay(g, { x: 5, z0: 5, F: 6, kick: true }));
run("glassBay (panel)", () => h3.glassBay(g, { x: 5, z0: 10, F: 6, panel: true }));
run("shopDoor", () => h3.shopDoor(g, { x: 5, z: 20, y: 7, facing: "west" }));
run("cornice", () => h3.cornice(g, { box: { x0: 20, x1: 30, z0: 20, z1: 30 }, y: 12 }));
run("glassRail", () => h3.glassRail(g, { from: [35, 5], to: [35, 25], y: 9 }));
run("lampPost", () => h3.lampPost(g, { x: 37, z: 5, y: 9 }));
run("stairFlight", () => h3.stairFlight(g, { from: [10, 4, 30], facing: "east", to: 8, width: 2 }));
run("glowStrip", () => h3.glowStrip(g, { x0: 33, x1: 36, z0: 33, z1: 38, y: 10 }));
assert.throws(() => h3.glowStrip(g, { x0: 0, x1: 4, z0: 0, z1: 0, y: 10 }), /4 deep/);

assert.deepEqual(ground(snap()), groundBefore, "the ground changed");
assert.equal(g.get(10, 4, 30).block, "minecraft:polished_andesite_stairs", "the first step is not in place");
console.log("test-h3: all helpers passed");
