// Smoke test for vocab/h1.mjs: every helper once at its plan position on a grass ground. Each must place something, and
// change only cells inside the box it reports. Then three checks on the rules: sidewalk is refused without { over },
// a block in the way is skipped, and the leaves are persistent.
// Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const fresh = () => {
  const g = new Grid([42, 16, 38]);
  g.fill([0, 0, 0], [41, 0, 37], "grass_block");
  return g;
};
const snap = (g) => new Map([...g].map((c) => [c.pos.join(","), `${c.block} ${JSON.stringify(c.state ?? {})}`]));
const inside = (p, [x0, y0, z0, x1, y1, z1]) =>
  p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1 && p[2] >= z0 && p[2] <= z1;

// Plan positions, with the box each call should be confined to.
const cases = [
  ["canopy_deck", [6, 9, 34, 20], [6, 7, 9, 34, 9, 20]],
  ["fuel_pump", [13, 14], [13, 2, 14, 14, 4, 14]],
  ["fuel_pump", [26, 15], [26, 2, 15, 27, 4, 15]],
  ["curb_cut", [7, 14, { over: true }], [7, 0, 5, 14, 0, 6]],
  ["awning", [10, 23], [10, 5, 22, 23, 5, 23]],
  ["brand_roundel", [20, 8, 8], [19, 7, 8, 21, 9, 8]],
  ["price_pylon", [37, 8], [37, 1, 7, 40, 13, 9]],
  ["light_pole", [5, 21], [5, 1, 21, 5, 6, 21]],
  ["light_pole", [36, 21], [36, 1, 21, 36, 6, 21]],
  ["propane_cage", [25, 22], [25, 1, 22, 26, 2, 23]],
  ["hedge_run", [0, 41, 36], [0, 1, 36, 41, 2, 36]],
];

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log(`FAIL ${msg}`); } };

for (const [name, args, box] of cases) {
  const g = fresh(), before = snap(g);
  const r = h1[name](g, ...args);
  check(r.placed > 0, `${name} placed nothing`);
  check(JSON.stringify(r.box) === JSON.stringify(box), `${name} reported box ${r.box} not ${box}`);
  for (const [k, v] of snap(g)) {
    if (before.get(k) !== v) check(inside(k.split(",").map(Number), box), `${name} changed ${k} outside ${box}`);
  }
  console.log(`${name}(${args.filter((a) => typeof a !== "object").join(",")}): ${r.placed} placed, ${r.skipped.length} skipped`);
}

// the sidewalk is an earlier part's ground: refused without { over }
{
  const g = fresh();
  g.fill([0, 0, 5], [41, 0, 6], "smooth_stone");
  const r = h1.curb_cut(g, 7, 14);
  check(r.placed === 0 && r.skipped.length === 16, "curb_cut paved over the sidewalk without { over }");
}

// a block in the way is skipped, not overwritten
{
  const g = fresh();
  g.set(13, 3, 14, "stone");
  const r = h1.fuel_pump(g, 13, 14);
  check(g.blockAt(13, 3, 14) === "minecraft:stone" && r.skipped.length === 1, "fuel_pump overwrote a block in its way");
}

// leaves are persistent
{
  const g = fresh();
  h1.hedge_run(g, 0, 5, 36);
  check([...g].filter((c) => /leaves|azalea/.test(c.block)).every((c) => c.state?.persistent === "true"), "hedge leaves not persistent");
}

console.log(failures ? `${failures} failure(s)` : "test-h1: all helpers pass");
process.exit(failures ? 1 : 0);
