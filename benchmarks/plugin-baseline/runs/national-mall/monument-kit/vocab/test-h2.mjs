// Calls each h2 helper once on a small grid and checks that every block it changed lies inside the footprint it was given,
// and that its return count matches the cells changed. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { shaftCourse, obsWindows, plazaDisc, pavilionBox, floodlight, lampPost, lodgeHip } from "./h2.mjs";

// Ground: stone to y 4, grass_block at y 5 (the plaza's level).
const g = new Grid([32, 16, 32]);
g.fill([0, 0, 0], [31, 4, 31], "stone");
g.fill([0, 5, 0], [31, 5, 31], "grass_block");

const snap = () => new Map([...g].map((c) => [c.pos.join(","), JSON.stringify([c.block, c.state ?? {}])]));
let failed = 0;

// Runs call(), then checks: changes inside box [x0,y0,z0,x1,y1,z1] (inclusive), count == changed cells, and extra(g).
function check(name, box, call, extra = () => true) {
  const before = snap();
  const n = call();
  const changed = [...snap()].filter(([k, v]) => before.get(k) !== v);
  const inside = changed.every(([k]) => {
    const [x, y, z] = k.split(",").map(Number);
    return x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
  });
  const ok = n > 0 && n === changed.length && inside && extra();
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: placed ${n}, changed ${changed.length}, inside footprint ${inside}`);
}

// Shaft, 5 wide at x10..14 z10..14 over y6..11; a stone at (10,6,10) must survive (air only, no replace).
g.set(10, 6, 10, "stone");
check("shaftCourse", [10, 6, 10, 14, 11, 14], () => {
  let n = 0;
  for (let y = 6; y <= 11; y++) n += shaftCourse(g, y, 10, 10, 14, 14);
  return n;
}, () => g.blockAt(10, 6, 10) === "minecraft:stone");

check("obsWindows", [10, 9, 10, 14, 10, 14], () => obsWindows(g, 12, 12, 9, 10, { replace: true }),
  () => g.blockAt(11, 9, 10) === "minecraft:tinted_glass" && g.blockAt(12, 10, 12) === "minecraft:glowstone");

check("plazaDisc", [9, 5, 9, 31, 5, 31], () => plazaDisc(g, 5, 20, 20, 0, 10.5, "smooth_stone", { replace: true }),
  () => g.blockAt(20, 5, 20) === "minecraft:smooth_stone");

check("pavilionBox", [20, 6, 12, 24, 8, 15], () => pavilionBox(g, 20, 12, 24, 15, 5, "east"),
  () => g.blockAt(24, 6, 13) === "minecraft:air" && g.blockAt(24, 6, 12) === "minecraft:polished_diorite");

check("floodlight", [3, 5, 3, 3, 5, 3], () => floodlight(g, 3, 5, 3, { replace: true }),
  () => g.blockAt(3, 5, 3) === "minecraft:ochre_froglight");

check("lampPost", [3, 6, 3, 3, 7, 3], () => lampPost(g, 3, 3, 5));

check("lodgeHip", [26, 6, 26, 28, 8, 27], () => lodgeHip(g, 26, 26, 28, 27, 5, { slit: [26, 6, 27] }),
  () => g.blockAt(26, 6, 27) === "minecraft:glass_pane");

console.log(failed ? `${failed} helper(s) failed` : "all h2 helpers passed");
process.exitCode = failed ? 1 : 0;
