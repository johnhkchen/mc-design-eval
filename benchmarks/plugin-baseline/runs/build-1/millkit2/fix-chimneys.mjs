// Tool fix applied after the run (plugin chimney.mjs v2): each chimney's wide top runs down to the roof, so no
// 3x3 crown stands on a 1-wide shaft clear of the roof (within 5 courses of a roof; over a porch or yard it stays a
// corbelled cap). Only air cells and a roof slab under a column change.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const g = load("v1.nbt"), s = (c) => String(c?.block ?? "air").replace(/^minecraft:/, ""), air = (x, y, z) => /(^|_)air$/.test(s(g.get(x, y, z)));
let filled = 0, stacks = 0;
for (const c of [...g]) {
  if (!/campfire$/.test(s(c)) || s(g.get(c.pos[0], c.pos[1] - 1, c.pos[2])) !== "hay_block") continue;
  const [fx, fy, fz] = c.pos, rim = fy + 1, mat = s(g.get(fx + 1, rim, fz)); stacks++;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const x = fx + dx, z = fz + dz;
    if (s(g.get(x, rim, z)) !== mat || (dx === 0 && dz === 0)) continue;     // a column of the stack's top
    let y = fy - 2; while (y >= 0 && fy - 2 - y < 6 && air(x, y, z)) y--;
    const stop = g.get(x, y, z), sb = s(stop);
    // only down onto a roof within 5 courses; over a porch or a yard the top stays a corbelled cap
    if (fy - 2 - y > 5 || /fence|trapdoor|lantern|door|pane|bars|chain|leaves|(^|_)air$/.test(sb)) continue;
    if (/_slab$/.test(sb) && stop.state?.type === "bottom") g.set(x, y, z, mat);   // the stack goes through the roof's slab
    for (let yy = fy - 2; yy > y; yy--) { g.set(x, yy, z, mat); filled++; }
  }
}
g.save("v2.nbt"); g.save("v2.litematic");
console.log(JSON.stringify({ stacks, filled }));
