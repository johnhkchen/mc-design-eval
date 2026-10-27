// way 1095570511: a two-storey interwar brick-and-plaster shop block on a 3-tier massing (7 / 9 / 11 blocks), with a
// stair bump and a tower on the NW corner. Shell + floor slabs, glass with air behind, glowstone behind some upper windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_1095570511";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));   // [x, z, ground, roof]

// Lidar roof heights smoothed into three clean tiers: the body (7), a stair bump (9), the tower (11).
const tier = (r) => (r >= 10 ? 11 : r >= 8 ? 9 : 7);
const col = new Map();
for (const [x, z, gnd, roof] of cells) col.set(`${x},${z}`, { gnd, h: tier(roof) });
const fp = (x, z) => col.has(`${x},${z}`);
const NB = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(NB).filter((d) => !fp(x + NB[d][0], z + NB[d][1]));
const boundary = (x, z) => exposed(x, z).length > 0;

const g = new Voxels([11, 24, 9]);
const floorsFor = (h) => (h >= 11 ? [3, 6, 9] : h >= 9 ? [3, 6] : [3]);   // solid storey lines
const bandsFor = (h) => (h >= 11 ? [[1, 2], [4, 5], [7, 8]] : h >= 9 ? [[1, 2], [4, 5], [7, 7]] : [[1, 2], [4, 5]]);
const inBand = (h, y) => bandsFor(h).some(([a, b]) => y >= a && y <= b);
const glow = [];

for (const [key, { gnd, h }] of col) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z), bnd = ex.length > 0;
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone");   // foundation up to the cell's ground
  for (let y = gnd; y < h; y++) {
    if (y === h - 1) { if (bnd) g.set(x, y, z, "smooth_quartz_slab", { type: "top" }); else g.set(x, y, z, "smooth_stone"); continue; }   // cornice / roof
    if (y === 0) { g.set(x, y, z, bnd ? "bricks" : "smooth_stone"); continue; }   // brick base course / floor
    if (floorsFor(h).includes(y)) {   // storey line: string course outside, floor slab inside
      if (!bnd) g.set(x, y, z, "smooth_stone");
      else if (y === 3 && ex.includes("S")) g.set(x, y, z, "dark_oak_slab", { type: "bottom" });   // shopfront canopy
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (!bnd || !inBand(h, y)) continue;   // interior air behind the glass
    const ground = y <= 2;
    if (ground && ex.includes("S")) {   // shopfront: glass, one door at the south middle
      if (x === 6 && z === 7) g.set(x, y, z, "oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false" });
      else g.set(x, y, z, "glass_pane");
      continue;
    }
    if (ex.length >= 2) { g.set(x, y, z, "smooth_quartz"); continue; }   // corner piers
    const d = ex[0], bay = d === "N" || d === "S" ? x : z;
    if (bay % 2 === 1) {
      g.set(x, y, z, "glass_pane");
      const [ix, iz] = [x - NB[d][0], z - NB[d][1]];
      if (y === 4 && bay % 4 === 3 && fp(ix, iz) && !boundary(ix, iz)) glow.push([ix, iz]);   // warm light behind some panes
    } else g.set(x, y, z, "smooth_quartz");
  }
}

for (const [x, z] of glow) g.set(x, 4, z, "glowstone");
// tower roof plant: an iron box with a lantern on top of the cornice
g.set(1, 11, 2, "iron_block");
g.set(1, 11, 3, "lantern", { hanging: "false" });

const res = g.save(`${DIR}/${NAME}.nbt`);
console.log(`${NAME}.nbt: ${res.blocks} blocks, palette ${res.palette}`);
