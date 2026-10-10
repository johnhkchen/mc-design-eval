// Ivy on the outside of the upper timber storeys: vines hung on the plaster/log walls, in air only.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const [src, dst] = process.argv.slice(2);
const g = load(src);
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const OPAQUE = /calcite|planks|_log$|stone|bricks|tuff|cobblestone|andesite/;
const OUT = { west: [-1, 0, 0], east: [1, 0, 0], north: [0, 0, -1], south: [0, 0, 1] };
const ATTACH = { west: "east", east: "west", north: "south", south: "north" };   // vine state on the wall side

// upper storey wall cells: floor 1 y11..13 (x2..10, z2..10), floor 2 y15..17 (x1..9, z1..9)
const storeys = [[11, 13, 2, 10, 2, 10], [15, 17, 1, 9, 1, 9]];
const walls = [];
for (const [y0, y1, x0, x1, z0, z1] of storeys) for (let y = y0; y <= y1; y++) {
  for (let x = x0; x <= x1; x++) { walls.push([x, y, z0, "north"], [x, y, z1, "south"]); }
  for (let z = z0; z <= z1; z++) { walls.push([x0, y, z, "west"], [x1, y, z, "east"]); }
}
let placed = 0;
for (const [x, y, z, side] of walls) {
  const d = OUT[side];
  const vx = x + d[0], vz = z + d[2];
  if (!g.inBounds(vx, y, vz) || !g.isAir(vx, y, vz)) continue;
  if (!OPAQUE.test(g.blockAt(x, y, z))) continue;
  if (hash(x, y, z) > 0.4) continue;
  g.set(vx, y, vz, "vine", { [ATTACH[side]]: "true", north: "false", south: "false", east: "false", west: "false", up: "false", down: "false", ...{ [ATTACH[side]]: "true" } });
  placed++;
}
g.save(dst);
console.log("vines placed", placed, "->", dst);
