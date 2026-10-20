// Smoke test for vocab/h1.mjs: calls each helper once on a small grid and checks that every block it changed lies
// inside the footprint it returned, and that nothing was refused where the area was clear. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const g = new Grid([64, 16, 40]);
// a road at y 4 for crosswalk, and one block at y 0 for bench to stand on; everything else is clear air
g.fill([4, 4, 0], [12, 4, 6], "gray_concrete");
g.set(40, 0, 6, "smooth_stone");
// a stone where the umbrella pole goes: it must stay, and be reported as refused
g.set(36, 2, 10, "stone");

const snap = () => new Map([...g.cells].map(([k, v]) => [k, JSON.stringify(v)]));
let failures = 0;

function check(name, call, { expectRefused = 0 } = {}) {
  const before = snap();
  const res = call();
  const [x0, y0, z0, x1, y1, z1] = res.box;
  const inside = (x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
  const changed = [...g.cells].filter(([k, v]) => before.get(k) !== JSON.stringify(v)).map(([, v]) => v.pos);
  const outside = changed.filter((p) => !inside(...p));
  const ok = res.placed > 0 && outside.length === 0 && changed.length === res.placed && res.refused.length === expectRefused;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${res.placed}, refused ${res.refused.length}, outside ${outside.length}`);
}

check("groundColumn", () => h1.groundColumn(g, 30, 2, 3));
check("crosswalk", () => h1.crosswalk(g, 2, 4));
check("wellWall", () => h1.wellWall(g, 20, 0, 26, 6));
check("planterBox", () => h1.planterBox(g, 30, 10));
check("umbrella", () => h1.umbrella(g, 36, 10), { expectRefused: 1 });
check("prometheus", () => h1.prometheus(g, 20, 24));
check("basin", () => h1.basin(g, { x0: 20, x1: 22, z0: 20, z1: 35 }));
check("darkWall", () => h1.darkWall(g, 50, 18, 51, 37));
check("pool", () => h1.pool(g, 56, 20, 0));
check("bench", () => h1.bench(g, 40, 6, "north"));

if (g.blockAt(36, 2, 10) !== "minecraft:stone") { failures++; console.log("FAIL umbrella overwrote the stone pole cell"); }
console.log(failures ? `${failures} failure(s)` : "all helpers passed");
process.exit(failures ? 1 : 0);
