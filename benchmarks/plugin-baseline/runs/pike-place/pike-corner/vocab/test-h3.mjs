// Calls each h3 helper once on an air grid and checks that everything it wrote lies inside the footprint the
// call was given (inclusive box x0,y0,z0,x1,y1,z1), and that it wrote something. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h3 from "./h3.mjs";

const g = new Grid([40, 30, 40], { dataVersion: 3955 });
g.set(15, 9, 15, "stone_bricks"); // what the hanging lantern hangs from
g.set(9, 4, 3, "stone_bricks"); // a frame cell already built: windowFrame must not overwrite it
const inside = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];

const cases = [
  ["quoins", () => h3.quoins(g, [4, 4], 2, 6), [4, 2, 4, 5, 6, 5]],
  ["windowFrame", () => h3.windowFrame(g, { at: [10, 3, 4], face: "west", w: 2, h: 3 }), [9, 2, 3, 9, 6, 6]],
  ["cornice", () => h3.cornice(g, { x0: 20, x1: 30, z0: 4, z1: 12, y: 12, face: "east" }), [30, 11, 4, 30, 12, 12]],
  ["bannerWord", () => h3.bannerWord(g, "ECO", { center: [10, 20, 8], face: "south" }), [9, 20, 8, 11, 20, 8]],
  ["lampPost", () => h3.lampPost(g, { at: [2, 1, 30], h: 4 }), [2, 1, 30, 2, 6, 30]],
  ["hangingLantern", () => h3.hangingLantern(g, { at: [15, 6, 15], drop: 2 }), [15, 6, 15, 15, 8, 15]],
  ["rooftopVent", () => h3.rooftopVent(g, { at: [25, 14, 25] }), [25, 14, 25, 26, 16, 26]],
  ["fireEscape", () => h3.fireEscape(g, { x0: 24, x1: 35, z0: 0, z1: 1, landings: [8, 14], ladderTo: 3 }), [24, 3, 0, 35, 15, 1]],
];

let failed = 0;
for (const [name, call, box] of cases) {
  const before = new Set(g.cells.keys());
  const placed = call();
  const written = [...g.cells.entries()].filter(([k]) => !before.has(k)).map(([, c]) => c.pos);
  const outside = written.filter((p) => !inside(box, p));
  const ok = placed > 0 && placed === written.length && outside.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${placed} blocks${outside.length ? `, outside ${JSON.stringify(outside)}` : ""}`);
}
if (g.blockAt(9, 4, 3) !=="minecraft:stone_bricks") { failed++; console.log("FAIL windowFrame overwrote a built wall"); }
console.log(failed ? `${failed} failed` : "all passed");
process.exitCode = failed ? 1 : 0;
