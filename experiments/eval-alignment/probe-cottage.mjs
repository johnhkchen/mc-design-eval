import { readFileSync } from "node:fs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
const raw = JSON.parse(readFileSync(new URL("../../builds/cottage/final-artifact.json", import.meta.url)));
const occ = artifactOccupancy(raw);
const byY = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minY = Infinity, maxY = -Infinity;
const blocks = new Map();
for (const [key, block] of occ.cells) {
  const [x, y, z] = key.split(",").map(Number);
  byY.set(y, (byY.get(y) || 0) + 1);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  blocks.set(block, (blocks.get(block) || 0) + 1);
}
console.log("cells", occ.cells.size, "| y", minY, "..", maxY, "| x", minX, "..", maxX, "| z", minZ, "..", maxZ);
console.log("span x", maxX - minX + 1, "z", maxZ - minZ + 1);
console.log("--- cells per y (wall→roof taper shows the eave) ---");
for (let y = minY; y <= maxY; y++) console.log(`y=${y}\t${byY.get(y) || 0}`);
console.log("--- top blocks ---");
[...blocks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([b, n]) => console.log(`${n}\t${b}`));
