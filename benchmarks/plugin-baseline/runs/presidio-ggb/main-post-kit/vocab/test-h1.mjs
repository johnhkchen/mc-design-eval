// Calls every h1 helper once on a small grid. Each must place blocks only inside the footprint it was given, and
// must write nothing into a footprint that is already built (air only). Run: node vocab/test-h1.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h1 from "./h1.mjs";

const SIZE = [24, 14, 24];
const inside = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// [name, footprint box (inclusive), call]
const cases = [
  ["groundCourse", [2, 0, 2, 8, 0, 6], (g) => h1.groundCourse(g, 2, 2, 8, 6)],
  ["sashWindow", [4, 1, 5, 4, 3, 6], (g) => h1.sashWindow(g, 4, 2, 5, "south")],
  ["ramp", [2, 0, 10, 7, 0, 10], (g) => h1.ramp(g, 2, 7, 10)],
  ["dormer", [3, 10, 12, 5, 12, 15], (g) => h1.dormer(g, 3, 5, 14, 2)],
  ["stuccoWall", [2, 1, 2, 12, 6, 12], (g) => h1.stuccoWall(g, [2, 1, 2, 12, 6, 12], 1)],
  ["oculus", [11, 7, 21, 13, 9, 21], (g) => h1.oculus(g, 12, 8, 21)],
  ["flagpole", [16, 0, 7, 16, 9, 9], (g) => h1.flagpole(g, 16, 9)],
  ["courtyardTree", [5, 1, 5, 7, 6, 7], (g) => h1.courtyardTree(g, 6, 6)],
];

const failures = [];
for (const [name, box, call] of cases) {
  // 1. on bare air: something is placed, and every block is inside the footprint
  const g = new Grid(SIZE);
  const { placed } = call(g);
  if (!placed) failures.push(`${name}: placed nothing`);
  for (const { pos: [x, y, z], block } of g.solids()) {
    if (!inside(box, x, y, z)) failures.push(`${name}: ${block} at ${x},${y},${z} is outside the footprint`);
  }

  // 2. over a built footprint: nothing is written (air only)
  const h = new Grid(SIZE);
  h.fill(box.slice(0, 3), box.slice(3), "minecraft:stone");
  const again = call(h);
  if (again.placed) failures.push(`${name}: wrote ${again.placed} blocks into built cells`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`h1: ${cases.length}/${cases.length} helpers ok`);
}
