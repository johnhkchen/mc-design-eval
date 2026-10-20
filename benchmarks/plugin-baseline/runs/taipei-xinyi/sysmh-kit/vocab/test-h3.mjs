// Calls each h3 helper once and checks it placed blocks only inside the footprint it was given. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { cheek_wall, eave_bracket, hip_ridge, portal_lintel, name_board, gallery_lantern, hedge_run } from "./h3.mjs";

const g = new Grid([160, 50, 160], { dataVersion: 3955 });   // Minecraft 1.21.1
let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.log(`FAIL ${msg}`); } };
const inBox = ([x0, y0, z0], [x1, y1, z1]) => ([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// Every placed cell inside the box the helper was given, something placed, nothing refused on a clean grid.
const run = (name, r, box, min = 1) => {
  check(r.placed.length >= min, `${name}: placed ${r.placed.length}`);
  check(r.placed.every(inBox(...box)), `${name}: a cell outside ${JSON.stringify(box)}`);
  check(r.refused.length === 0, `${name}: refused ${JSON.stringify(r.refused)}`);
  console.log(`${name}: ${r.placed.length} placed`);
};

run("cheek_wall", cheek_wall(g, 52, 55, 144, 155), [[52, 1, 144], [55, 2, 155]]);
run("eave_bracket", eave_bracket(g, 53, 17, "north"), [[52, 21, 17], [54, 21, 17]], 2);
run("hip_ridge", hip_ridge(g, "nw"), [[14, 26, 14], [40, 42, 40]], 27);
run("portal_lintel", portal_lintel(g, 49, 102, 130, 141), [[49, 36, 130], [102, 42, 141]], 100);
run("name_board", name_board(g, "south", 64, 87, 32, 35, 133), [[63, 31, 133], [88, 36, 134]], 100);
check([...g.cells.values()].some((c) => c.block.endsWith("_wall_banner")), "name_board: no letters placed");
g.set(21, 22, 17, "smooth_stone");                           // the beam the lantern hangs from
run("gallery_lantern", gallery_lantern(g, 21, 17), [[21, 20, 17], [21, 21, 17]], 2);
run("hedge_run", hedge_run(g, 4, 51, 144), [[4, 1, 144], [51, 2, 145]], 100);

// States: a hanging lantern, a top slab, persistent leaves.
check(g.get(21, 20, 17)?.state?.hanging === "true", "gallery_lantern: lantern not hanging");
check(g.get(52, 21, 17)?.state?.type === "top", "eave_bracket: slab not type top");
check(g.get(4, 1, 144)?.state?.persistent === "true", "hedge_run: leaves not persistent");

// A cell that is not air is refused, never overwritten.
const g2 = new Grid([20, 10, 20]);
g2.set(5, 1, 5, "stone");
const r = cheek_wall(g2, 4, 6, 4, 6);
check(r.refused.length === 1 && r.refused[0].at.join() === "5,1,5", `refusal: ${JSON.stringify(r.refused)}`);
check(g2.blockAt(5, 1, 5) === "minecraft:stone", "refusal: existing block was overwritten");

console.log(failed ? `${failed} check(s) failed` : "all h3 checks passed");
process.exitCode = failed ? 1 : 0;
