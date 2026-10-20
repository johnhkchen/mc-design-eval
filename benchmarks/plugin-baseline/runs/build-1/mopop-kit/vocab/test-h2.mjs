// Calls every h2 helper once and checks that each placed blocks only inside the footprint it was given.
// Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { fold, softEdge, bridgeLobe, tPylon, curtainWall, glassBand, plaza, bed, lampPost } from "./h2.mjs";

const g = new Grid([102, 47, 153]);   // the plot's size (plan.md SITE)
let fails = 0;
const check = (name, cells, box, extra = true) => {
  const outside = cells.filter((c) => !c.every((v, i) => v >= box[i] && v <= box[i + 3]));
  const ok = cells.length > 0 && outside.length === 0 && extra;
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${cells.length} cells${outside.length ? `, ${outside.length} outside ${box}` : ""}`);
};

// fold: a 4-thick iron wall on the west side, grooved from (4,28,34) to (4,10,44), outward -x
g.fill([4, 8, 30], [7, 30, 50], "iron_block");
const feet = [[4, 28, 34], [4, 10, 44]];
const foldBox = [4 - 2, 10 - 2, 34 - 3, 4 + 2, 28 + 2, 44 + 3];
check("fold", fold(g, { center: [23, 44], stairs: "polished_diorite_stairs" }, { from: feet[0], to: feet[1], outward: [-1, 0, 0], shadow: "light_gray_concrete" }), foldBox);

// softEdge: two upside-down stairs under an overhang, in air
const edge = [[30, 17, 40, "west"], [30, 17, 41, "west"]];
check("softEdge", softEdge(g, { cells: edge, stairs: "polished_diorite_stairs" }), [30, 17, 40, 30, 17, 41]);

check("bridgeLobe", bridgeLobe(g), [33, 12, 66, 59, 32, 90]);

check("tPylon", tPylon(g, { x: 46, z: 5 }), [43, 1, 5, 50, 8, 6]);

// curtainWall: a solid stone cell in the wall line must survive (air only)
g.set(42, 3, 58, "stone");
const wall = curtainWall(g, { axis: "z", fixed: 42, from: 56, to: 62 });
check("curtainWall", wall, [42, 1, 56, 42, 7, 62], g.blockAt(42, 3, 58) === "minecraft:stone");

// glassBand cuts a window through a solid north face of the bridge lobe
g.fill([40, 22, 66, 52, 24, 66], "light_blue_concrete");
check("glassBand", glassBand(g, { box: [40, 22, 66, 52, 24, 66], into: "shell" }), [40, 22, 66, 52, 24, 66]);

check("plaza", plaza(g, { mask: [[60, 0, 64, 3]] }), [60, 0, 0, 64, 0, 3]);

check("bed", bed(g, { box: [70, 140, 80, 146] }), [70, 0, 140, 80, 1, 146]);

check("lampPost", lampPost(g, { x: 10, z: 10 }), [10, 1, 10, 10, 4, 10]);

console.log(fails ? `${fails} FAILED` : "all h2 helpers passed");
process.exit(fails ? 1 : 0);
