// Calls each h3 helper once on a small grid. Every cell a helper changes must lie inside the footprint it was given,
// and it must write at least the expected number of cells. Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bandRing, cornerStrip, litClump, uplightRow, mallFacade, slabRamp, lampPost, spireSection, deckRail } from "./h3.mjs";

const g = new Grid([80, 60, 80], { dataVersion: 3955 });   // 1.21.1
const snap = () => new Map([...g].map((c) => [c.pos.join(","), JSON.stringify([c.block, c.state ?? null])]));
let failed = 0;

function check(name, fp, call, min = 1) {
  const before = snap();
  const n = call();
  const outside = [...snap()]
    .filter(([k, v]) => before.get(k) !== v)
    .map(([k]) => k.split(",").map(Number))
    .filter(([x, y, z]) => x < fp.x0 || x > fp.x1 || y < fp.y0 || y > fp.y1 || z < fp.z0 || z > fp.z1);
  const ok = n >= min && outside.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: wrote ${n}${outside.length ? `, outside footprint at ${outside.slice(0, 3).join(" ")}` : ""}`);
}

check("bandRing", { x0: 2, y0: 2, z0: 2, x1: 30, y1: 8, z1: 30 },
  () => bandRing(g, { box: { x0: 2, z0: 2, x1: 30, z1: 30 }, y0: 2, y1: 8, ctx: { floorRes: 2 } }), 100);

check("cornerStrip", { x0: 34, y0: 2, z0: 2, x1: 54, y1: 8, z1: 22 },
  () => cornerStrip(g, { box: { x0: 34, z0: 2, x1: 54, z1: 22 }, bands: [{ inset: 0, y0: 2, y1: 8 }] }), 28);

// A hollow glass wall at z 40, air in front (z 39) and behind (z 41): the clump lights its inside cells.
for (let x = 2; x <= 30; x++) for (let y = 2; y <= 20; y++) g.set(x, y, 40, "cyan_stained_glass");
check("litClump", { x0: 2, y0: 2, z0: 40, x1: 30, y1: 20, z1: 41 },
  () => litClump(g, "north", 7, 0.12, { x0: 2, y0: 2, z0: 40, x1: 30, y1: 20, z1: 41 }));

check("uplightRow", { x0: 34, y0: 1, z0: 59, x1: 54, y1: 1, z1: 59 },
  () => uplightRow(g, "north", 34, 54, 1, 60), 21);

check("mallFacade", { x0: 2, y0: 2, z0: 70, x1: 30, y1: 40, z1: 70 },
  () => mallFacade(g, "north", { from: 2, to: 30, wall: 70, top: 40 }), 1000);

check("slabRamp", { x0: 34, y0: 2, z0: 72, x1: 54, y1: 2, z1: 73 },
  () => slabRamp(g, { face: "north", from: 34, to: 54, y: 2, slab: 72, landing: 73 }), 42);

// A block already in place (the stone) must survive: only the two posts and the lantern are air-written.
g.set(60, 3, 10, "stone");
check("lampPost", { x0: 60, y0: 2, z0: 10, x1: 60, y1: 4, z1: 10 }, () => lampPost(g, 60, 2, 10), 2);
if (g.blockAt(60, 3, 10) !== "minecraft:stone") { failed++; console.log("FAIL lampPost overwrote the stone at 60,3,10"); }

check("spireSection", { x0: 64, y0: 2, z0: 30, x1: 65, y1: 6, z1: 31 },
  () => spireSection(g, { x: 64, z: 30, y0: 2, y1: 6, kind: "iron_block", size: 2 }), 20);

check("deckRail", { x0: 66, y0: 13, z0: 40, x1: 74, y1: 13, z1: 48 },
  () => deckRail(g, { x0: 66, z0: 40, x1: 74, z1: 48 }, 13), 32);

console.log(failed ? `${failed} check(s) failed` : "all h3 helpers passed");
process.exitCode = failed ? 1 : 0;
