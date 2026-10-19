// National Postal Museum (the Old Post Office Building, 2 Massachusetts Ave NE): a stone Romanesque/Beaux-Arts
// office block of about 1910, built as a shell. Walls are 1 block thick with air behind the glass, a stone floor
// slab every 3 blocks (absolute y % 3 == 0 is a belt course outside and a floor slab inside), a ceiling course
// under a deepslate roof, and the lidar roof tiers (12 cornice, 13 main roof, 14 core) read from the roof record.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79894.cells.json", "utf8"));

const W = 53, D = 68, H = 26;
const idx = (x, z) => z * W + x;
const groundAt = new Int16Array(W * D).fill(-1);      // -1 = outside the footprint
const roofAt = new Int16Array(W * D).fill(-1);
for (const [x, z, gr, r] of cells) { groundAt[idx(x, z)] = gr; roofAt[idx(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && groundAt[idx(x, z)] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

// Lidar noise into flat tiers: the wall ring keeps its own cornice height, the interior takes the 5x5 mode
// (ties go to the value nearest the cell's own lidar height).
const roof = new Int16Array(W * D).fill(-1);
for (const [x, z, , r0] of cells) {
  if (outward(x, z).length) { roof[idx(x, z)] = r0; continue; }
  const count = new Map();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (!inside(x + dx, z + dz)) continue;
    const r = roofAt[idx(x + dx, z + dz)];
    count.set(r, (count.get(r) || 0) + 1);
  }
  let best = null;
  for (const [r, n] of count) if (!best || n > best[1] || (n === best[1] && Math.abs(r - r0) < Math.abs(best[0] - r0))) best = [r, n];
  roof[idx(x, z)] = best[0];
}

const g = new Voxels([W, H, D]);

// Exterior skin: belt course every 3 rows, piers in a 4-block bay rhythm, glass between them. Along a z-face the
// wall runs along x; along an x-face it runs along z.
function skin(x, y, z, faces) {
  if (y % 3 === 0) return "polished_andesite";
  const zFace = faces.some(([, dz]) => dz !== 0);
  const along = zFace ? x : z;
  if (along % 4 === 0) return "chiseled_stone_bricks";
  if (along % 4 === 3) return "stone_bricks";
  return "light_blue_stained_glass";
}

const lanternSpots = [];
for (const [x, z, gr] of cells) {
  const faces = outward(x, z);
  const exterior = faces.length > 0;
  const r = roof[idx(x, z)];
  const top = r - 1;                                  // the top block row; the roof surface is at y = r
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation: nothing floats on a slope
  for (let y = gr; y <= top; y++) {
    if (y === top) { g.set(x, y, z, exterior ? "chiseled_stone_bricks" : "deepslate_tiles"); continue; }   // cornice / roof
    if (exterior) { g.set(x, y, z, skin(x, y, z, faces)); continue; }
    if (y % 3 === 0 || y === top - 1) g.set(x, y, z, "stone");          // floor slabs and the ceiling under the roof
  }
  // Warm lanterns hang from the floor slab over a window's inside air.
  if (exterior) for (const [dx, dz] of faces) {
    const xi = x - dx, zi = z - dz;
    for (let y = gr; y < top - 1; y++) {
      if (y % 3 !== 2) continue;                       // the window's top row, under the next floor slab
      if (!inside(xi, zi) || outward(xi, zi).length) continue;
      if ((x * 31 + z * 17 + y * 7) % 4 === 0) lanternSpots.push([xi, y, zi]);
    }
    break;
  }
}
for (const [x, y, z] of lanternSpots) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

// Entrance on the street (z-min) face, nearest the middle of that face: a pair of doors in a stone frame.
const zMin = cells.filter(([x, z]) => outward(x, z).some(([dx, dz]) => dz === -1));
const mid = zMin.map(([x]) => x).sort((a, b) => a - b)[Math.floor(zMin.length / 2)];
const pairStart = inside(mid + 1, 0) && outward(mid + 1, 0).some(([, dz]) => dz === -1) ? mid : mid - 1;
const door = [pairStart, pairStart + 1];
const dgr = Math.max(...door.map((x) => groundAt[idx(x, 0)]));
for (let i = 0; i < 2; i++) {
  const hinge = i === 0 ? "left" : "right";
  const st = { facing: "south", open: "false", powered: "false", hinge };
  g.set(door[i], dgr, 0, "dark_oak_door", { ...st, half: "lower" });
  g.set(door[i], dgr + 1, 0, "dark_oak_door", { ...st, half: "upper" });
}
for (let y = dgr; y <= dgr + 2; y++) {
  for (const x of [pairStart - 1, pairStart + 2]) if (inside(x, 0)) g.set(x, y, 0, "chiseled_stone_bricks");
}
for (const x of [pairStart - 1, pairStart, pairStart + 1, pairStart + 2]) if (inside(x, 0)) g.set(x, dgr + 2, 0, "chiseled_stone_bricks");

// Roof plant: copper ventilator housings on 2x2 patches of flat roof, the same top height under all four cells.
let plant = 0;
for (let z = 4; z < D - 5 && plant < 6; z += 5) for (let x = 4; x < W - 5 && plant < 6; x += 6) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([cx, cz]) => inside(cx, cz) && !outward(cx, cz).length)) continue;
  const top = roof[idx(x, z)];
  if (!cs.every(([cx, cz]) => roof[idx(cx, cz)] === top) || top !== 13) continue;
  for (const [cx, cz] of cs) g.set(cx, top, cz, "oxidized_copper");
  plant++;
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79894.nbt");
