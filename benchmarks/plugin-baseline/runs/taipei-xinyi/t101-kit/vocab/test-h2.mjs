// Smoke test for vocab/h2.mjs: each helper runs once on a small grid. Every block it changes must lie inside the
// footprint the test gave it, and the air-only rule must hold. Run: node vocab/test-h2.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { glassCell, ledgeSlab, litWindow, coin, mallMass, canopy, roofGarden, capStep, deckLights } from "./h2.mjs";

let fails = 0;
const inside = (p, b) => p[0] >= b.x0 && p[0] <= b.x1 && p[1] >= b.y0 && p[1] <= b.y1 && p[2] >= b.z0 && p[2] <= b.z1;

// Fresh 40 x 24 x 40 grid with a stone ground at y 0. setup(g) runs first, then run(g) is measured: the blocks it
// changes must be placed inside box, and it must change something.
function check(name, box, { setup = () => {}, run, after = () => true }) {
  const g = new Grid([40, 24, 40]);
  g.fill([0, 0, 0], [39, 0, 39], "stone");
  setup(g);
  const before = new Map([...g.cells].map(([k, c]) => [k, c.block]));
  const made = run(g);
  let changed = 0, outside = 0;
  for (const [k, c] of g.cells) {
    if (before.get(k) === c.block) continue;
    changed++;
    if (!inside(c.pos, box)) outside++;
  }
  const ok = made > 0 && changed > 0 && outside === 0 && after(g);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: ${changed} blocks, ${outside} outside the footprint`);
}

const ring = (r) => { const out = []; for (let x = r.x0; x <= r.x1; x++) { out.push([x, r.z0]); out.push([x, r.z1]); } for (let z = r.z0 + 1; z < r.z1; z++) { out.push([r.x0, z]); out.push([r.x1, z]); } return out; };

const band = { x0: 4, z0: 4, x1: 24, z1: 24 };
check("glassCell", { x0: 4, y0: 1, z0: 4, x1: 24, y1: 3, z1: 24 }, {
  run: (g) => {
    let placed = 0;
    for (let y = 1; y <= 3; y++) for (const [x, z] of ring(band)) placed += glassCell(g, x, y, z, { box: band, kind: "pedestal" }) ? 1 : 0;
    return placed;
  },
});

check("ledgeSlab", { x0: 4, y0: 6, z0: 4, x1: 20, y1: 6, z1: 20 }, {
  run: (g) => ledgeSlab(g, { box: { x0: 4, z0: 4, x1: 20, z1: 20 }, y: 6, notch: "double", top: "smooth_quartz", lanternRing: 3, every: 5 }),
  after: (g) => g.blockAt(4, 6, 4) === "minecraft:air" && g.blockAt(5, 6, 4) === "minecraft:air", // notch cells left out
});

check("litWindow", { x0: 11, y0: 8, z0: 10, x1: 11, y1: 8, z1: 10 }, {
  setup: (g) => g.set(10, 8, 10, "cyan_stained_glass"),
  run: (g) => {
    const first = litWindow(g, [10, 8, 10], "east", "warm") ? 1 : 0;
    if (litWindow(g, [10, 8, 10], "east", "cool")) fails++; // refused: the cell is no longer air
    return first;
  },
  after: (g) => g.blockAt(11, 8, 10) === "minecraft:ochre_froglight",
});

check("coin", { x0: 9, y0: 1, z0: 10, x1: 31, y1: 23, z1: 12 }, {
  run: (g) => coin(g, "south", [20, 12, 10], { wallAt: (y) => (y >= 15 ? 9 : 10) }),
});

check("mallMass", { x0: 2, y0: 1, z0: 2, x1: 30, y1: 9, z1: 30 }, {
  run: (g) => mallMass(g, { x0: 2, y0: 1, z0: 2, x1: 30, z1: 30 }, 8, { parapet: 1, plan: (x, z) => !(x > 20 && z > 20) }),
});

check("canopy", { x0: 12, y0: 1, z0: 12, x1: 20, y1: 6, z1: 20 }, {
  run: (g) => canopy(g, { x0: 12, z0: 12, x1: 20, z1: 20 }, 6, [[13, 13], [19, 19]]),
  after: (g) => g.blockAt(13, 1, 13) === "minecraft:quartz_pillar",
});

check("roofGarden", { x0: 4, y0: 5, z0: 4, x1: 30, y1: 12, z1: 30 }, {
  setup: (g) => {
    g.fill([4, 5, 4], [30, 5, 30], "smooth_stone");
    for (const [x, z] of ring({ x0: 4, z0: 4, x1: 30, z1: 30 })) g.set(x, 6, z, "smooth_quartz");
  },
  run: (g) => roofGarden(g, { x0: 4, z0: 4, x1: 30, z1: 30, y: 5 }, { skylight: { x0: 14, z0: 4, x1: 16, z1: 30 }, parapet: 1 }),
});

check("capStep", { x0: 5, y0: 3, z0: 5, x1: 14, y1: 7, z1: 14 }, {
  setup: (g) => g.set(6, 3, 6, "stone"),
  run: (g) => capStep(g, [
    { x0: 5, z0: 5, x1: 14, z1: 14, y0: 3, y1: 5, block: "iron_block" },
    { x0: 7, z0: 7, x1: 12, z1: 12, y0: 6, y1: 7, block: "light_gray_concrete" },
  ]),
  after: (g) => g.blockAt(6, 3, 6) === "minecraft:stone", // air only: the existing block is kept
});

check("deckLights", { x0: 5, y0: 6, z0: 5, x1: 15, y1: 6, z1: 15 }, {
  setup: (g) => g.fill([4, 6, 4], [16, 6, 16], "smooth_stone"),
  run: (g) => deckLights(g, { x0: 4, z0: 4, x1: 16, z1: 16, y: 6 }, 1, 4, { flush: true }),
});

console.log(fails ? `${fails} FAILED` : "all helpers passed");
process.exitCode = fails ? 1 : 0;
