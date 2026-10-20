// Smoke test for vocab/h1.mjs: calls every helper once on a grid and checks that each changed cell lies inside the
// footprint the helper was given, plus the refusals. Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const DATA_VERSION_1_21_1 = 3955;
const fails = [];
const snapshot = (g) => new Map([...g].map((c) => [c.pos.join(), JSON.stringify([c.block, c.state ?? {}])]));

// Run one helper on a fresh grid; every cell whose content changed must sit inside box [x0,y0,z0,x1,y1,z1].
function check(name, setup, call, box) {
  const g = new Grid([160, 24, 40], { dataVersion: DATA_VERSION_1_21_1 });
  setup?.(g);
  const before = snapshot(g);
  const res = call(g);
  let changed = 0;
  for (const c of g) {
    const [x, y, z] = c.pos;
    if (before.get(c.pos.join()) === JSON.stringify([c.block, c.state ?? {}])) continue;
    changed++;
    const inside = x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
    if (!inside) fails.push(`${name}: ${c.block} at ${x},${y},${z} is outside ${box.join(",")}`);
  }
  if (!changed) fails.push(`${name}: placed nothing`);
  console.log(`${name}: ${changed} cells changed, refused ${res.refused.length}`);
  return { g, res };
}

// A wall on a 9x9 rectangle, cornice round it, and a column, a slab flight, a lantern, a door, a hanging lamp,
// the East body, its slot, and the atrium
check("marbleWall", null, (g) => h1.marbleWall(g, [4, 4, 14, 12], { ground: 1 }), [4, 1, 4, 14, 12, 12]);
check("corniceRing", null, (g) => h1.corniceRing(g, [4, 4, 14, 12], 12), [3, 12, 3, 15, 12, 13]);
check("ionicColumn", null, (g) => h1.ionicColumn(g, 9, 8), [9, 4, 8, 9, 10, 8]);
check("slabSteps", null, (g) => h1.slabSteps(g, [
  { x0: 6, x1: 12, z: 2, y: 3, kind: "slab" },
  { x0: 6, x1: 12, z: 1, y: 2, kind: "block" },
]), [6, 2, 1, 12, 3, 2]);
check("oculusLantern", null, (g) => h1.oculusLantern(g, 10, 10, 20), [9, 20, 9, 11, 21, 11]);
check("recessDoor", null, (g) => h1.recessDoor(g, 10, 4, "north", 3), [8, 4, 4, 12, 9, 5]);

// the lamp needs a block above and a clear 2-high lane below: a refused lamp with nothing above must place nothing
check("hangLamp", (g) => g.set(20, 13, 20, "smooth_quartz"), (g) => h1.hangLamp(g, 20, 12, 20), [20, 11, 20, 20, 12, 20]);
const noSupport = h1.hangLamp(new Grid([40, 24, 40], { dataVersion: DATA_VERSION_1_21_1 }), 20, 12, 20);
if (noSupport.placed !== 0 || noSupport.refused.length !== 1) fails.push("hangLamp: placed without a block above");

check("planarWall", null, (g) => h1.planarWall(g, [[12, 105, 112], [13, 105, 112]]), [105, 0, 12, 112, 14, 13]);
check("entranceSlot", null, (g) => h1.entranceSlot(g, 108, 13), [108, 0, 13, 111, 5, 18]);

const rows = [];
for (let z = 9; z <= 23; z++) {
  const half = Math.min(z - 9, 23 - z);
  rows.push([z, 114, 114 + 3 * half]);
}
check("atriumRoof", null, (g) => h1.atriumRoof(g, rows), [114, 14, 9, 135, 15, 23]);

// air only: an existing block inside an ionic column's footprint is kept and reported
{
  const g = new Grid([40, 24, 40], { dataVersion: DATA_VERSION_1_21_1 });
  g.set(9, 6, 8, "stone");
  const res = h1.ionicColumn(g, 9, 8);
  if (g.blockAt(9, 6, 8) !== "minecraft:stone" || res.refused.length !== 1) fails.push("ionicColumn: overwrote an existing block");
}

if (fails.length) {
  console.log(fails.join("\n"));
  process.exitCode = 1;
} else console.log("ok: 10 helpers, footprints and refusals hold");
