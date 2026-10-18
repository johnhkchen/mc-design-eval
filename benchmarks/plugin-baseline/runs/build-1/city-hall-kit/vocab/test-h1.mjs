// Calls every h1.mjs helper once on a 64 x 72 x 64 grid and checks that each placed block lies inside the footprint it
// reports, that writes into a solid cell are refused, and a few states. Run: node vocab/test-h1.mjs (exit 1 on failure).
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as H from "./h1.mjs";

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const fresh = () => new Grid([64, 72, 64], { dataVersion: 3955 }); // 1.21.1
const inBox = (p, [x0, y0, z0, x1, y1, z1]) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;
const name = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");
const F = H.faceFrame("north", [0, 0, 63, 23]);

// faceFrame: east face, walking in from the east face (facing west), left is south
const E = H.faceFrame("east", [0, 0, 63, 23]);
ok(JSON.stringify(E.at(4, 2)) === "[61,4]", `faceFrame east at: ${E.at(4, 2)}`);
ok(E.dir("in") === "west" && E.dir("out") === "east" && E.dir("left") === "south", "faceFrame east dirs");
ok(H.faceFrame("south", [0, 0, 63, 23]).at(4, 2)[1] === 21, "faceFrame south depth");

// every helper: placed > 0, every placed cell inside the footprint it reports, nothing refused on an empty grid
const check = (label, res, g, { refusedOk = false, pre = [] } = {}) => {
  ok(res.placed > 0, `${label}: placed nothing`);
  const bad = [...g].filter((c) => !inBox(c.pos, res.box) && !pre.includes(c.pos.join()));
  ok(bad.length === 0, `${label}: ${bad.length} cell(s) outside footprint ${res.box}`);
  if (!refusedOk) ok(res.refused.length === 0, `${label}: refused ${JSON.stringify(res.refused.slice(0, 3))}`);
};

let g = fresh();
check("ringFill", H.ringFill(g, 17.5, 19.5, 37, 40, "polished_diorite"), g);
ok(name(g, 31 + 19, 38, 31) === "polished_diorite" && !g.get(31, 38, 31), "ringFill ring cell / centre left empty");

g = fresh();
check("deck", H.deck(g, 0, 0, 63, 63, 36, { hole: 18.5 }), g);
ok(!g.get(31, 36, 31) && name(g, 2, 36, 2) === "smooth_stone", "deck hole and course");

g = fresh();
check("recessedWall", H.recessedWall(g, F, 2, 11, 5, { windows: [6] }), g);
ok(name(g, 2, 20, 5) === "smooth_quartz" && name(g, 2, 21, 5) === "calcite", "recessedWall band");
ok(!g.get(6, 15, 5) && !g.get(6, 15, 6) && name(g, 2, 15, 6) === "polished_diorite", "recessedWall window open, wall beside it solid");

g = fresh();
check("antaPilaster", H.antaPilaster(g, F, 2, 0), g);
ok(name(g, 3, 33, 0) === "chiseled_quartz_block" && name(g, 3, 32, 0) === "smooth_quartz", "antaPilaster capital");

g = fresh();
check("balustrade", H.balustrade(g, F, 2, 12, 3, 40), g);
ok(name(g, 2, 40, 3) === "polished_diorite" && name(g, 5, 40, 3) === "diorite_wall", "balustrade pedestal / baluster");
ok(name(g, 5, 41, 3) === "polished_diorite_slab" && g.get(5, 41, 3).state.type === "bottom", "balustrade rail");
ok(g.get(5, 40, 3).state.east === "low" && g.get(5, 40, 3).state.north === "none", "balustrade baluster sides");

g = fresh();
check("glassRun", H.glassRun(g, F, 2, 5, 7, 11, 19), g);
const pane = g.get(3, 12, 7).state;
ok(pane.east === "true" && pane.west === "true" && pane.north === "false" && pane.south === "false", "glassRun connections");

g = fresh();
// pediment on a 64-wide grid: left 9 / right 54 (23 pairs, apex pair at x 31..32), base 37, apex 48
const P = H.pediment(g, F, { left: 9, right: 54, y0: 37, depth: 11 });
check("pediment", P, g, { refusedOk: true });
// the only refusals are the roof's first row at z 1, which the course behind the cornice already holds
ok(P.refused.every(([, , z]) => z === 1), `pediment: refusals outside z 1: ${JSON.stringify(P.refused.filter(([, , z]) => z !== 1))}`);
ok(P.refused.length === 46, `pediment: expected 46 course/roof collisions at z 1, got ${P.refused.length}`);
ok(name(g, 9, 37, 0) === "smooth_quartz_stairs" && g.get(9, 37, 0).state.facing === "east", "pediment raking cornice faces the apex");
ok(name(g, 31, 48, 5) === "polished_tuff" && name(g, 31, 49, 5) === "polished_tuff_slab", "pediment ridge and cap");
ok(name(g, 9, 38, 0) === "chiseled_quartz_block", "pediment end acroterion");

g = fresh();
check("drumUrn", H.drumUrn(g, 53, 31), g);
ok(name(g, 53, 68, 31) === "chiseled_quartz_block" && name(g, 53, 69, 31) === "smooth_quartz_slab", "drumUrn pair");

// standingLantern: on a full block with a clear lane, hanging false; refused on a slab or with a block overhead
g = fresh();
g.set(10, 9, 10, "polished_diorite");
const L = H.standingLantern(g, 10, 10, 10);
check("standingLantern", L, g, { pre: ["10,9,10"] });
ok(g.get(10, 10, 10).state.hanging === "false", "standingLantern hanging false");
g.set(20, 9, 20, "polished_diorite_slab", { type: "bottom" });
const S = H.standingLantern(g, 20, 10, 20);
ok(S.placed === 0 && S.refused.length === 1, "standingLantern refused on a slab");

// the air rule: a solid cell under a deck is refused and left as it was
g = fresh();
g.set(5, 36, 5, "polished_diorite");
const D = H.deck(g, 0, 0, 10, 10, 36);
ok(D.refused.some(([x, y, z]) => x === 5 && y === 36 && z === 5), "deck refuses a solid cell");
ok(name(g, 5, 36, 5) === "polished_diorite", "refused cell left unchanged");

if (fails.length) {
  console.error(`test-h1: ${fails.length} failure(s)`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("test-h1: all helpers passed");
