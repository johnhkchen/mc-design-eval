// Calls each h1 helper once on a small grid and checks that every cell it changed lies inside the footprint it was
// given. Dirt sits under y 6, so a write into the ground also fails. Run: node vocab/test-h1.mjs
import { Grid, guard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { brickWall, cornice, console as consoleHelper, hangingSign, sashWindow, streetDoor, chimney, lampPost } from "./h1.mjs";

const g = new Grid([32, 36, 24]);
for (let x = 0; x < 32; x++) for (let z = 0; z < 24; z++) for (let y = 0; y <= 5; y++) g.set(x, y, z, "dirt");
const snap = () => { const m = new Map(); for (let x = 0; x < 32; x++) for (let y = 0; y < 36; y++) for (let z = 0; z < 24; z++) m.set(`${x},${y},${z}`, g.blockAt(x, y, z)); return m; };
const inside = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const failures = [];

function run(name, box, fn) {
  const before = snap(), r = fn(), after = snap();
  let changed = 0;
  for (const [k, v] of after) {
    if (before.get(k) === v) continue;
    changed++;
    const [x, y, z] = k.split(",").map(Number);
    if (!inside(box, x, y, z)) failures.push(`${name}: wrote ${k} (${v}) outside its footprint`);
  }
  if (!changed) failures.push(`${name}: placed nothing`);
  console.log(`${name}: ${changed} cells changed, ${r.skipped?.length ?? 0} skipped`);
  return r;
}

// the street front (z 19) is a brick wall, so the trim and openings below go into it
run("brickWall", [0, 6, 19, 31, 30, 19], () => brickWall(g, [0, 6, 19, 31, 30, 19]));
if (g.blockAt(3, 6, 19) !== "minecraft:polished_andesite") failures.push("brickWall: plinth at y 6 is not polished_andesite");
run("cornice", [3, 23, 19, 26, 23, 20], () => cornice(g, 23, 19, 3, 26, { into: "wall" }));
run("console", [4, 10, 19, 4, 12, 20], () => consoleHelper(g, 4, 19, { into: "wall" }));
run("hangingSign", [4, 10, 20, 4, 11, 21], () => hangingSign(g, 4, 19, "TENANT 1"));
run("sashWindow", [5, 14, 19, 5, 18, 20], () => sashWindow(g, 5, 15, 19, { into: "wall" }));
run("streetDoor", [22, 7, 19, 25, 11, 21], () => streetDoor(g, 23, 7, 19, { into: "wall" }));
if (g.get(23, 7, 19)?.block !== "minecraft:dark_oak_door" || g.get(23, 8, 19)?.block !== "minecraft:dark_oak_door") failures.push("streetDoor: both halves of the left leaf not written");
run("chimney", [0, 6, 8, 3, 33, 11], () => chimney(g, 1, 9, { fire: true }));
run("lampPost", [14, 7, 21, 14, 10, 21], () => lampPost(g, 14, 21));

// a protected cell (guard / runParts reservation) is refused, not written
const gp = guard(new Grid([8, 12, 8]), new Set(["3,7,3"]));
const lp = lampPost(gp, 3, 3);
if (!lp.skipped.some(([x, y, z]) => x === 3 && y === 7 && z === 3) || gp.blockAt(3, 8, 3) === "minecraft:air") failures.push("lampPost: protected cell not respected");

if (failures.length) { for (const f of failures) console.error("FAIL " + f); process.exit(1); }
console.log("h1: all helpers stay inside their footprints");
