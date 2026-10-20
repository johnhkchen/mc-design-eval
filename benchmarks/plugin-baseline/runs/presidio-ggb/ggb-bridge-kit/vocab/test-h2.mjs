// Smoke test for vocab/h2.mjs: each helper once on its own small grid. Every block it writes must sit inside the
// footprint it was given, a cell built before the call is left alone, and a few spot checks read back the states.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { fluteFace, portalStrut, fenderRing, deckSection, deckLamp, suspender } from "./h2.mjs";

const snap = (g) => new Map([...g.cells].map(([k, c]) => [k, c.block]));
const is = (g, x, y, z, id) => g.blockAt(x, y, z) === `minecraft:${id}`;
const none = () => {};

let failed = 0;
function run(name, box, prefill, call, expect) {
  const g = new Grid([50, 120, 30], { dataVersion: 3955 });
  prefill(g);
  const before = snap(g);
  const out = call(g);
  const [x0, y0, z0, x1, y1, z1] = box;
  const outside = [];
  for (const [k, c] of g.cells) {
    if (before.get(k) === c.block) continue;
    const [x, y, z] = k.split(",").map(Number);
    if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) outside.push(k);
  }
  const ok = outside.length === 0 && out.placed > 0 && expect(g, out);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${out.placed} placed, ${out.refused.length} refused` +
    (outside.length ? `, outside the footprint: ${outside.join(" ")}` : ""));
}

run("fluteFace (north face of S1, skin)", [14, 8, 8, 18, 12, 15],
  (g) => g.fill([14, 8, 8], [18, 12, 15], "orange_terracotta"),
  (g) => fluteFace(g, "north", 8, 12, 14, 18, 8, 15, [14, 16, 18], [15, 17], { skin: true }),
  (g) => g.isAir(15, 10, 8) && is(g, 15, 10, 9, "red_terracotta") && is(g, 16, 10, 8, "orange_terracotta"));

run("portalStrut 1 (haunches, frame)", [19, 53, 10, 27, 60, 13], none,
  (g) => portalStrut(g, 19, 10, 55, 60, true),
  (g) => is(g, 19, 53, 10, "orange_terracotta") && g.isAir(21, 57, 10) && is(g, 22, 57, 10, "orange_concrete") &&
    is(g, 23, 60, 11, "shroomlight"));

run("portalStrut top (crown light at 114)", [19, 104, 10, 27, 114, 13], none,
  (g) => portalStrut(g, 19, 10, 106, 112, true, { light: 114 }),
  (g) => is(g, 23, 114, 12, "shroomlight") && g.isAir(21, 109, 10) && is(g, 22, 109, 10, "orange_concrete"));

run("portalStrut lower (plain box)", [19, 28, 10, 27, 33, 13], none,
  (g) => portalStrut(g, 19, 10, 28, 33, false, { frame: false }),
  (g) => is(g, 21, 30, 10, "orange_terracotta") && is(g, 23, 33, 11, "orange_terracotta"));

run("fenderRing", [0, 1, 0, 46, 3, 23], none,
  (g) => fenderRing(g, 23, 11.5),
  (g) => is(g, 23, 3, 0, "polished_andesite") && is(g, 23, 2, 0, "light_gray_concrete") && g.isAir(23, 3, 11));

run("deckSection plot 1 (x 0, z 0..15)", [0, 34, 0, 14, 39, 15], none,
  (g) => deckSection(g, 0, 0, 15),
  (g) => is(g, 7, 38, 3, "yellow_concrete") && is(g, 7, 35, 4, "shroomlight") && is(g, 0, 39, 4, "orange_concrete") &&
    is(g, 0, 39, 1, "red_sandstone_wall") && g.get(0, 39, 1).state.north === "low" && g.get(0, 39, 1).state.up === "false");

run("deckSection tower deck (x 16, z 0..7)", [16, 34, 0, 30, 39, 7], none,
  (g) => deckSection(g, 16, 0, 7),
  (g) => is(g, 16, 34, 0, "orange_terracotta") && is(g, 23, 35, 4, "shroomlight") && is(g, 21, 38, 3, "white_concrete"));

run("deckSection portal (x 16, z 8..15)", [19, 34, 8, 27, 38, 15], none,
  (g) => deckSection(g, 16, 8, 15, { portal: true }),
  (g) => is(g, 23, 35, 8, "shroomlight") && g.isAir(19, 37, 8) && is(g, 19, 38, 8, "gray_concrete"));

run("deckSection refuses a built cell", [16, 34, 0, 30, 39, 7], (g) => g.set(20, 38, 3, "stone"),
  (g) => deckSection(g, 16, 0, 7),
  (g, out) => is(g, 20, 38, 3, "stone") && out.refused.some(([x, y, z]) => x === 20 && y === 38 && z === 3));

run("deckLamp", [1, 39, 8, 1, 42, 8], none,
  (g) => deckLamp(g, 1, 8),
  (g) => is(g, 1, 39, 8, "orange_terracotta") && is(g, 1, 41, 8, "red_sandstone_wall") && is(g, 1, 42, 8, "lantern") &&
    g.get(1, 42, 8).state.hanging === "false");

run("suspender", [0, 40, 0, 0, 44, 0], none,
  (g) => suspender(g, 0, 0, 40, 44),
  (g) => is(g, 0, 40, 0, "red_stained_glass_pane") && is(g, 0, 44, 0, "red_stained_glass_pane"));

if (failed) {
  console.error(`${failed} check(s) failed`);
  process.exit(1);
}
console.log("all h2 checks passed");
