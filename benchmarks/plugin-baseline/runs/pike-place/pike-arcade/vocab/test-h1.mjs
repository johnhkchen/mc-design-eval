// Calls each H1 helper on a small grid; checks each placed block lies inside the footprint given, that the return value
// is the number placed, and that no existing block was overwritten. Run: node vocab/test-h1.mjs
import assert from "node:assert/strict";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { post_bay, stall, stall_sign, cornice, du_window, quoins, stack, market_clock } from "./h1.mjs";

const g = new Grid([16, 16, 16], { dataVersion: 3955 });
const key = (x, y, z) => `${x},${y},${z}`;
const solids = () => new Map(g.solids().map((c) => [key(...c.pos), c.block]));

// box = [x0, y0, z0, x1, y1, z1], inclusive
function check(name, box, call) {
  const before = solids(), n = call(), after = solids();
  const added = [...after.keys()].filter((k) => !before.has(k));
  assert.ok(n > 0, `${name}: placed nothing`);
  assert.equal(added.length, n, `${name}: returned ${n} but wrote ${added.length}`);
  const [x0, y0, z0, x1, y1, z1] = box;
  for (const k of added) {
    const [x, y, z] = k.split(",").map(Number);
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1, `${name}: wrote ${k} outside ${box}`);
  }
  for (const [k, b] of before) assert.equal(after.get(k), b, `${name}: overwrote ${k}`);
  console.log(`ok ${name}: ${n} blocks`);
}

// Existing blocks that the helpers must leave alone (an earlier part owns them).
g.set(4, 2, 4, "stone");

check("post_bay", [4, 2, 3, 4, 6, 9], () => post_bay(g, { x: 4, z: 4, y0: 2, h: 4, beamY: 6, beamZ: [4, 8] }));
assert.equal(g.blockAt(4, 2, 4), "minecraft:stone", "post_bay: wrote over the stone at its footing");

["produce", "flowers", "fish", "honey", "crates"].forEach((kind, i) => {
  const z0 = 1 + 2 * i, z1 = z0 + 1;
  check(`stall ${kind}`, [6, 2, z0, 8, 4, z1], () => stall(g, { x0: 6, x1: 8, z0, z1, y: 2, kind }));
});

g.set(11, 4, 12, "dark_oak_planks"); // the beam the sign hangs from
check("stall_sign", [11, 2, 12, 11, 3, 12], () => stall_sign(g, { x: 11, y: 2, z: 12, text: "FRESH PRODUCE", face: "east" }));
assert.equal(stall_sign(g, { x: 11, y: 2, z: 13, text: "X", face: "east" }), 0, "stall_sign: placed with no beam above");

check("cornice", [12, 7, 1, 12, 8, 5], () => cornice(g, { x: 12, y: 8, z0: 1, z1: 5, face: "east" }));

assert.equal(du_window(g, { at: 2, face: "west", f: 2, start: 6, ground: 3 }), 0, "du_window: placed underground");
check("du_window", [1, 3, 7, 3, 6, 9], () => du_window(g, { at: 2, face: "west", f: 2, start: 6, ground: 2 }));

check("quoins", [14, 9, 2, 14, 14, 2], () => quoins(g, { x: 14, z: 2, y0: 9, y1: 14 }));
check("stack", [8, 4, 8, 11, 11, 11], () => stack(g, { x: 9, z: 9, y0: 4, ridgeY: 7 }));

check("market_clock east, neon", [14, 5, 3, 15, 11, 9], () => market_clock(g, { center: [15, 8, 6], face: "east", radius: 3, neon: true }));
check("market_clock south", [3, 5, 15, 9, 11, 15], () => market_clock(g, { center: [6, 8, 15], face: "south", radius: 3 }));

console.log("all H1 helper checks passed");
