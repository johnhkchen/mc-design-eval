// Calls each h2 helper once on a plot-sized grid and checks every write landed inside the footprint it was given.
// Also checks the air-only rule (a second wingBody writes nothing) and that a lantern over a bottom slab is refused.
// Run: node vocab/test-h2.mjs   (exits 1 on failure)
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { wingBody, pediment, windowBay, westSteps, ringPost, attic, tholos, baseGlow } from "./h2.mjs";

const g = new Grid([36, 46, 96], { dataVersion: 3955 }); // 1.21.1
let writes = [];
const rec = new Proxy(g, {
  get(t, p) {
    if (p === "set") return (x, y, z, ...rest) => { writes.push([x, y, z]); return t.set(x, y, z, ...rest); };
    const v = Reflect.get(t, p);
    return typeof v === "function" ? v.bind(t) : v;
  },
});

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL ${msg}`); };
function check(name, [x0, x1, y0, y1, z0, z1], run) {
  writes = [];
  const r = run();
  const inside = writes.every(([x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);
  if (writes.length === 0) fail(`${name}: placed nothing`);
  else if (!inside) fail(`${name}: wrote outside its footprint`);
  else if (r.refused.length) fail(`${name}: refused ${JSON.stringify(r.refused.slice(0, 3))}`);
  else console.log(`ok   ${name}: ${r.placed} placed`);
}

// Wall box is x5..33: the portico floor (x34) and the pediments (x34..35) sit outside it.
check("wingBody", [5, 33, 5, 12, 2, 18], () => wingBody(rec, { x0: 5, x1: 33, z0: 2, z1: 18 }));
writes = [];
const again = wingBody(rec, { x0: 5, x1: 33, z0: 2, z1: 18 });
if (writes.length || again.refused.length === 0) fail("wingBody re-run overwrote existing blocks");
else console.log(`ok   wingBody re-run is air-only: ${again.refused.length} refused, 0 written`);
check("pediment", [34, 35, 11, 14, 6, 14], () => pediment(rec, { x0: 34, x1: 35, z0: 6, z1: 14, y0: 11 }));
check("windowBay", [5, 7, 6, 8, 8, 8], () => windowBay(rec, { face: "west", wall: 5, pos: 8, y0: 6, y1: 7, tall: true, lit: true }));
check("westSteps", [1, 9, 0, 5, 37, 40], () => westSteps(rec, { z0: 37, z1: 40 }));
check("ringPost", [12, 27, 15, 20, 40, 55], () => ringPost(rec, { cx: 20, cz: 48, d: 16, y0: 15, y1: 20, block: "quartz_pillar", every: 2 }));
check("attic", [13, 26, 22, 25, 41, 54], () => attic(rec, { cx: 20, cz: 48 }));
check("tholos", [18, 21, 34, 37, 46, 49], () => tholos(rec, { cx: 20, cz: 48 }));

// baseGlow needs a support under the lantern: a full block is accepted, a bottom slab is refused.
g.set(4, 4, 4, "smooth_quartz");
g.set(6, 4, 6, "smooth_stone_slab", { type: "bottom" });
check("baseGlow", [4, 4, 5, 5, 4, 4], () => baseGlow(rec, [[4, 5, 4]]));
writes = [];
const slabGlow = baseGlow(rec, [[6, 5, 6]]);
if (writes.length || slabGlow.refused.length !== 1) fail("baseGlow placed a lantern over a bottom slab");
else console.log("ok   baseGlow over a bottom slab is refused");

console.log(failed ? `${failed} check(s) failed` : "all h2 checks passed");
process.exit(failed ? 1 : 0);
