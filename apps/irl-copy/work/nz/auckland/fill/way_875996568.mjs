// Way 875996568: a 1960s-70s Auckland office block on a podium (Maungawhau view, CBD edge).
// Massing follows the lidar roof per cell, smoothed into 4-block storey tiers; floors are absolute (level) so the
// downhill side shows its extra storeys. The shell is one block thick with an air gap behind the glass and a floor
// slab per storey; no interiors. Concrete frame with glazed bays, a base course, storey lines, a coping, a shopfront
// with a door and hood, roof plant, a lit window here and there, and a lightning-rod mast on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_875996568.cells.json", "utf8"));

// lidar roof -> clean 4-block storey tiers, never under the ground + one storey
const tier = (r, g) => Math.max(g + 4, Math.max(8, Math.round(r / 4) * 4));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a height opening (3x3 min, then 3x3 max, footprint cells only): narrow lidar spikes on the flanks drop to their
// neighbourhood instead of standing up as chimneys; plateaus and the tower core survive
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r: tier(r, g) }]));
const window3 = (x, z) => [[0, 0], ...DIRS, [1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dz]) => raw.get(`${x + dx},${z + dz}`)).filter(Boolean);
const eroded = new Map([...raw].map(([k, c]) => { const [x, z] = k.split(",").map(Number); return [k, Math.min(...window3(x, z).map((n) => n.r))]; }));
const cols = new Map([...raw].map(([k, c]) => {
  const [x, z] = k.split(",").map(Number);
  const dil = Math.max(...[[0, 0], ...DIRS, [1, 1], [1, -1], [-1, 1], [-1, -1]].map(([dx, dz]) => eroded.get(`${x + dx},${z + dz}`) ?? 0));
  // the tower core keeps the lidar's 40: opening it would leave a one-block mast
  return [k, { g: c.g, r: c.r >= 40 ? c.r : Math.max(c.g + 4, Math.min(c.r, dil)) }];
}));
const col = (x, z) => cols.get(`${x},${z}`);
const inM = (x, y, z) => { const c = col(x, z); return !!c && y >= 0 && y < c.r; };
const shellAt = (x, y, z) => DIRS.some(([dx, dz]) => !inM(x + dx, y, z + dz));
const floorRow = (c, y) => y === c.g || (y > c.g && y % 4 === 0);

const g = new Voxels([52, 52, 18]);
const lamps = [];
const hood = [];
const top = [];

for (const [key, c] of cols) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.r; y++) {
    if (y < c.g) { g.set(x, y, z, "stone_bricks"); continue; }
    const shell = shellAt(x, y, z);
    if (y === c.r - 1) { g.set(x, y, z, shell ? "smooth_stone" : "gray_concrete"); if (!shell) top.push([x, y, z]); continue; }
    if (floorRow(c, y)) { g.set(x, y, z, shell && y === c.g ? "polished_andesite" : "light_gray_concrete"); continue; }
    if (!shell) continue;                                  // air behind the glass
    const exp = DIRS.filter(([dx, dz]) => !inM(x + dx, y, z + dz));
    const gFloor = (Math.floor(c.g / 4) + 1) * 4;          // first storey line above the ground
    if (y < gFloor ? y === gFloor - 1 : y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
    const bay = exp.some(([dx]) => dx !== 0) ? z : x;     // bays run along the face
    if (exp.length >= 2 || bay % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    const [ix, iz] = [-exp[0][0], -exp[0][1]];
    const tx = x + ix, tz = z + iz;
    if (inM(tx, y, tz) && !shellAt(tx, y, tz) && !floorRow(col(tx, tz), y) && y < col(tx, tz).r - 1 && y >= col(tx, tz).g) {
      const h = (x * 31 + z * 17 + y * 7) % 11;
      if (h === 0) lamps.push([tx, y, tz, "glowstone"]);
      else if (h === 5 && (x + y) % 3 === 0) lamps.push([tx, y, tz, "shroomlight"]);
    }
  }
}

// lamps behind the glass
for (const [x, y, z, b] of lamps) g.set(x, y, z, b);

// entrance: door on the north face of the ground storey, a stone hood over it on the storey line below the glass
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(9, 0, 2, "dark_oak_door", { ...door, half: "lower" });
g.set(9, 1, 2, "dark_oak_door", { ...door, half: "upper" });
for (const x of [8, 9, 10]) g.set(x, 3, 2, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });

// roof plant on the low wings: iron units on a few interior roof cells
for (const [x, y, z] of top) {
  const c = col(x, z);
  if (c.r > 16) continue;
  if (DIRS.every(([dx, dz]) => inM(x + dx, y, z + dz) && col(x + dx, z + dz).r === c.r) && (x * 5 + z * 3) % 13 === 0) g.set(x, c.r, z, "iron_block");
}

// tower crown: a lightning-rod mast on the tallest core cell
let crown = null;
for (const [key, c] of cols) {
  if (c.r < 40) continue;
  const [x, z] = key.split(",").map(Number);
  const n = DIRS.filter(([dx, dz]) => col(x + dx, z + dz)?.r === 40).length;
  if (!crown || n > crown.n) crown = { x, z, n };
}
if (crown) { g.set(crown.x, 40, crown.z, "lightning_rod"); g.set(crown.x, 41, crown.z, "lightning_rod"); }

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_875996568.nbt");
console.log(`way_875996568.nbt: ${out.blocks} blocks, ${out.palette} palette entries, ${lamps.length} lamps`);
