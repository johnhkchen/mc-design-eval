// v2 revision of the ROXY cinema: fewer colour families (age + details come from rules.txt via mcd paint). Run: node edit.mjs  (v1.nbt -> stage4.nbt)
import { load, B } from "../../../../../../minecraft-design/tools/src/build.mjs";
const HERE = new URL(".", import.meta.url).pathname;
const g = load(HERE + "v1.nbt");
const CX = 15, Z0 = 6;
const mx = (x) => 2 * CX - x;

// 1. fewer colour families: teal stays on the front (sunburst field, fins glass); side and back panels go black
let n = 0;
for (const c of [...g]) {
  if (c.block !== "minecraft:cyan_concrete") continue;
  const [x, y, z] = c.pos;
  if (z <= 8 && x >= 9 && x <= 21) continue;      // entrance field behind the sunburst and doors
  g.set(x, y, z, "black_terracotta"); n++;
}
console.log("teal panels -> black:", n);

// 2. posters: gold / black / white only (no red, no cyan)
const posters = {
  3: ["yellow", [["stripe_center", "white"], ["border", "black"]]],
  4: ["white", [["rhombus", "black"], ["border", "yellow"]]],
  6: ["white", [["circle", "black"], ["stripe_bottom", "yellow"]]],
  7: ["yellow", [["cross", "white"], ["border", "black"]]],
};
for (const [xs, [c, pats]] of Object.entries(posters)) {
  const x = +xs;
  g.set(x, 5, Z0, ...B.banner(c, pats, { facing: "north" }));
  g.set(mx(x), 5, Z0, ...B.banner(c, pats, { facing: "north" }));
}

// the entrance field itself: muted cyan terracotta instead of saturated concrete
for (const c of [...g]) if (c.block === "minecraft:cyan_concrete") g.set(c.pos[0], c.pos[1], c.pos[2], "cyan_terracotta");

// 3. planter beds on the pavement in front of the wing piers (moss bed, azalea / flowers), clear of the lamp posts at x=5, 25
const flora = ["azalea", "flowering_azalea", "allium", "azalea"];
[3, 4, 6, 7].forEach((x, i) => {
  for (const xx of [x, 2 * CX - x]) { g.set(xx, 1, 5, "polished_blackstone_bricks"); g.set(xx, 2, 5, flora[(i + (xx > CX ? 1 : 0)) % 4]); }
});
console.log("done");
// stray dripstone left by weathering reads as a blemish: back to the base block
for (const c of [...g]) if (c.block === "minecraft:dripstone_block") g.set(...c.pos, "polished_blackstone");
g.save(HERE + "stage4.nbt");
