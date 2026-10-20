// Smoke test for vocab/h3.mjs: each helper runs once on a small grid. Checks that it placed blocks, that every block
// landed inside the footprint it was given, and that a block already standing in the footprint was left alone.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { cornice, porchBay, bannerRun, pavilion, leanTo, cannon, hangLantern } from "./h3.mjs";

const SIZE = [96, 12, 30];
let failed = 0;

function check(name, [lo, hi], { stand = null, pre = () => {}, call, expect = (n) => n > 0 }) {
  const g = new Grid(SIZE, { dataVersion: 3955 });
  if (stand) g.set(...stand, "stone");
  pre(g);
  const before = new Set(g.cells.keys());
  const n = call(g);
  const inside = (p) => p.every((v, i) => v >= Math.min(lo[i], hi[i]) && v <= Math.max(lo[i], hi[i]));
  // only what the helper wrote counts: scaffolding the test set up beforehand is not the helper's
  const outside = [...g.cells.entries()].filter(([k, c]) => !before.has(k) && !inside(c.pos)).length;
  const kept = !stand || g.blockAt(...stand) === "minecraft:stone";
  const ok = expect(n) && outside === 0 && kept;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${n}, outside footprint ${outside}${kept ? "" : ", standing block overwritten"}`);
  return g;
}

check("cornice", [[2, 9, 6], [20, 9, 6]], {
  stand: [5, 9, 6],
  call: (g) => cornice(g, 2, 20, 6, "south"),
});

check("porchBay", [[1, 1, 15], [5, 7, 17]], {
  stand: [2, 5, 16],
  call: (g) => porchBay(g, 1, 15, 17, { span: 5 }),
});

check("bannerRun", [[2, 4, 17], [7, 6, 18]], {
  call: (g) => bannerRun(g, "DISNEY", 2, 7, 18, 4, { panels: [[2, 4, 5, 6]] }),
});

check("pavilion", [[2, 1, 1], [21, 7, 6]], {
  stand: [5, 4, 1],
  call: (g) => pavilion(g, 2, 1, 21, 6, { open: (x, y, z) => z === 1 && (x === 11 || x === 12) && y <= 2 }),
});

check("leanTo", [[52, 5, 18], [56, 6, 21]], {
  stand: [53, 6, 19],
  call: (g) => leanTo(g, 52, 56, 18, 21, 5),
});

check("cannon", [[58, 0, 23], [60, 0, 25]], {
  call: (g) => cannon(g, 59, 23),
});

// a lantern hangs from the block above: placed under a beam, refused in open air
const lamp = check("hangLantern", [[60, 3, 19], [60, 3, 19]], {
  pre: (g) => g.set(60, 4, 19, "smooth_quartz"),
  call: (g) => hangLantern(g, 60, 3, 19),
});
if (lamp.blockAt(60, 3, 19) !== "minecraft:lantern" || lamp.get(60, 3, 19).state.hanging !== "true") { failed++; console.log("FAIL hangLantern: not a hanging lantern"); }
check("hangLantern with nothing above (refused)", [[60, 3, 19], [60, 3, 19]], {
  call: (g) => hangLantern(g, 60, 3, 19),
  expect: (n) => n === 0,
});

console.log(failed ? `${failed} check(s) failed` : "all helpers passed");
process.exit(failed ? 1 : 0);
