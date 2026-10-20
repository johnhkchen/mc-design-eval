// Calls each vocab/h2.mjs helper once on a small grid and checks what it wrote: inside its footprint, nothing refused,
// and a few block states right. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { poolBasin, walkStrip, oakTree, pilaster, terraceFlight, memorialPlatform, lionCouchant, smallStatue } from "./h2.mjs";

// Flat ground x 0..7 (top y 1), then a rise of 1 every 6 cells from x 8 (tops 3, 4, 5 ...). Grass on top, stone below.
const H = (x) => (x < 8 ? 1 : 3 + Math.floor((x - 8) / 6));
const g = new Grid([40, 24, 30], { dataVersion: 3955 });                 // 1.21.1
for (let x = 0; x < 40; x++) for (let z = 0; z < 30; z++) {
  g.fill([x, 0, z], [x, H(x) - 1, z], "stone");
  g.set(x, H(x), z, "grass_block");
}

const inside = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
const runs = {
  poolBasin: poolBasin(g, 2, 2, 5, 9),
  walkStrip: walkStrip(g, 8, 2, 20, 4),
  oakTree: oakTree(g, 4, 14, 6, 3),
  pilaster: pilaster(g, 1, 27, 2, 4),
  terraceFlight: terraceFlight(g, { x0: 18, x1: 20, z0: 7, z1: 15, y0: 5, steps: 3, facing: "east" }),
  memorialPlatform: memorialPlatform(g, { x0: 9, z0: 20, x1: 11, z1: 26, y0: 4, topY: 6, stepZ: [22, 24] }),
  lionCouchant: lionCouchant(g, 6, 2, 20, "east"),
  smallStatue: smallStatue(g, 1, 20, "P"),
};

let failed = 0;
for (const [name, r] of Object.entries(runs)) {
  const outside = r.cells.filter((c) => !inside(r.footprint, c));
  const ok = r.cells.length > 0 && outside.length === 0 && r.refused.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${r.cells.length} cells, ${outside.length} outside, ${r.refused.length} refused`);
  for (const f of r.refused) console.log(`     refused ${JSON.stringify(f)}`);
}

// spot checks: the water, the half-step, the leaves, the flight's stairs
const checks = [
  ["water at y 2", g.blockAt(3, 2, 5) === "minecraft:water"],
  ["walk half-step where H rises", g.blockAt(14, 4, 3) === "minecraft:smooth_sandstone_slab"],
  ["walk surface on the flat", g.blockAt(12, 3, 3) === "minecraft:smooth_sandstone"],
  ["crown leaves persistent", runs.oakTree.cells.filter(([x, y, z]) => /leaves$/.test(g.blockAt(x, y, z))).every(([x, y, z]) => g.get(x, y, z).state?.persistent === "true")],
  ["flight tread faces east", g.get(18, 5, 8)?.block === "minecraft:quartz_stairs" && g.get(18, 5, 8).state.facing === "east"],
];
for (const [name, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
}

console.log(failed ? `${failed} check(s) failed` : "all helpers passed");
process.exit(failed ? 1 : 0);
