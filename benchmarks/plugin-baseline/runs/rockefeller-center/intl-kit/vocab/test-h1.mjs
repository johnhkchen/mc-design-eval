// Calls every h1 helper once on a small grid; each must place blocks only inside the footprint it was given, and must
// refuse (not overwrite) a solid block already in its footprint. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const fresh = () => new Grid([16, 12, 16], { dataVersion: 3955 });

// [name, call(g), footprint [x0, y0, z0, x1, y1, z1]]
const cases = [
  ["pier_strip_face", (g) => h1.pier_strip_face(g, { face: "east", at: 12, from: 2, to: 11, y0: 2, y1: 7, pierMod: 2, litSeed: 1 }), [10, 2, 2, 12, 7, 11]],
  ["deck_light", (g) => { g.fill([2, 5, 2], [7, 5, 7], "smooth_stone"); return h1.deck_light(g, [[3, 5, 3], [6, 5, 6]]); }, [2, 5, 2, 7, 5, 7]],
  ["deco_panel", (g) => h1.deco_panel(g, { x: 10, z0: 4, z1: 10, y0: 3, y1: 9, face: "east" }), [10, 3, 4, 10, 9, 10]],
  ["bronze_door", (g) => h1.bronze_door(g, { x: 6, y: 2, z: 4, face: "east" }), [6, 2, 2, 7, 5, 7]],
  ["lit_bay", (g) => h1.lit_bay(g, 3, 4, 5, { lit: true }), [3, 4, 5, 3, 4, 5]],
  ["atlas_figure", (g) => h1.atlas_figure(g, { x: 2, y: 1, z: 2 }), [2, 1, 2, 6, 10, 7]],
  ["ring_ellipse", (g) => h1.ring_ellipse(g, [8, 6, 8], "xz", 3, 4), [5, 6, 4, 11, 6, 12]],
  ["uplight", (g) => h1.uplight(g, 10, 12), [10, 1, 12, 10, 1, 12]],
  ["lamp_post", (g) => h1.lamp_post(g, 14, 1, 3), [14, 1, 3, 14, 3, 3]],
  ["vent", (g) => h1.vent(g, 4, 9, 10, { facing: "north" }), [4, 9, 10, 5, 10, 10]],
];

let failures = 0;
const report = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); };

for (const [name, call, [x0, y0, z0, x1, y1, z1]] of cases) {
  const g = fresh();
  const res = call(g);
  const outside = g.solids().filter(({ pos: [x, y, z] }) => x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1);
  report(res.placed > 0 && outside.length === 0 && res.refused.length === 0,
    `${name}: placed ${res.placed}, outside footprint ${outside.length}, refused ${res.refused.length}`);
}

// Air only: a solid block already in the footprint is refused and left as it was.
{
  const g = fresh();
  g.set(14, 2, 3, "stone");
  const res = h1.lamp_post(g, 14, 1, 3);
  report(g.blockAt(14, 2, 3) === "minecraft:stone" && res.refused.some(([x, y, z]) => x === 14 && y === 2 && z === 3),
    `lamp_post leaves a solid cell alone (refused ${res.refused.length})`);
}

// Flush lights replace only a deck or paving surface, never a stone block.
{
  const g = fresh();
  g.set(4, 5, 4, "stone");
  const res = h1.deck_light(g, [[4, 5, 4]]);
  report(g.blockAt(4, 5, 4) === "minecraft:stone" && res.refused.length === 1, `deck_light refuses a non-deck block (refused ${res.refused.length})`);
}

if (failures) { console.log(`${failures} failing`); process.exit(1); }
console.log("all h1 helpers pass");
