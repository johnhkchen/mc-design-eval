// 801 Pennsylvania Ave NW: a stepped commercial office block. The lidar roof steps from 12-13 blocks on the
// perimeter wings, through 14-17 on the main body, to 18-19 on the core. Each tier is cut to an odd top (13, 15, 17,
// 19) so its deck lands on an even floor line; storeys are two blocks (a band over a glass row), with a two-block
// shopfront storey at the base. Facade: pale concrete piers and bands, glass in the bays, a granite base, and a
// stone parapet. Behind the glass, air and a lit lantern or glowstone now and then, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73864.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/DC73864.nbt`;
const GLASS = "light_blue_stained_glass_pane";

// Lidar roof height -> tier top (odd, so the deck just under it sits on an even floor line).
const tierTop = (r) => (r <= 13 ? 13 : r <= 15 ? 15 : r <= 17 ? 17 : 19);

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, top: tierTop(roof) });
const cellAt = (x, z) => cell.get(`${x},${z}`);
// Solid volume: inside the footprint, above its ground, below its tier top. Outside: nothing.
const has = (x, y, z) => { const c = cellAt(x, z); return !!c && y >= c.ground && y < c.top; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// The horizontal faces at height y that look onto air (outside, or below a neighbouring lower tier).
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !has(x + dx, y, z + dz));

const floorRow = (y) => y === 0 || (y >= 4 && y % 2 === 0);
const glassRow = (y) => y === 1 || y === 2 || (y >= 5 && y % 2 === 1);

const B = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

for (const [key, { top, ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = ground; y < top; y++) {
    const out = exposed(x, y, z);
    const ring = out.length > 0;
    if (y === top - 1) { put(x, y, z, ring ? "light_gray_concrete" : "gray_concrete"); continue; }   // roof membrane
    if (y === 0) { put(x, y, z, ring ? "polished_granite" : "smooth_stone"); continue; }             // base course
    if (floorRow(y)) { put(x, y, z, ring ? "light_gray_concrete" : "smooth_stone"); continue; }     // storey slab
    if (!ring) continue;                                                                            // air behind the glass
    if (y === 3) { put(x, y, z, "light_gray_concrete"); continue; }                                 // shopfront head band
    const bay = out.every(([dx, dz]) => (dx ? z : x) % 3 !== 0);                                    // off the pier lines
    if (glassRow(y) && bay) put(x, y, z, GLASS, { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
    else put(x, y, z, "white_concrete");
  }
  // Parapet on the roof edge; plant on the open roof of the tiers that have one.
  if (exposed(x, top, z).length) put(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  else if (top >= 17 && x % 6 >= 2 && x % 6 <= 3 && z % 6 >= 2 && z % 6 <= 3) put(x, top, z, "iron_block");
}

// Entrance on the south face: double doors between granite piers, a granite head, and a hanging lantern inside.
for (const x of [13, 14]) {
  const hinge = x === 13 ? "left" : "right";
  put(x, 1, 29, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 2, 29, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  put(x, 3, 29, "polished_granite");
}
for (const x of [12, 15]) { put(x, 1, 29, "polished_granite"); put(x, 2, 29, "polished_granite"); }
put(13, 3, 28, "lantern", { hanging: "true", waterlogged: "false" });

// Glass connections: a pane joins whatever solid or pane sits beside it in the wall plane.
for (const [key, b] of B) {
  if (b.block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  const near = (dx, dz) => B.has(`${x + dx},${y},${z + dz}`);
  b.state = { east: String(near(1, 0)), west: String(near(-1, 0)), north: String(near(0, -1)), south: String(near(0, 1)), waterlogged: "false" };
}

// Warm light: a lantern or glowstone on the floor just inside some lit windows.
let lamps = 0;
for (const [key, b] of [...B]) {
  if (b.block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  if (y % 2 === 0) continue;                                // only standing where there is a floor under the lamp
  const h = (x * 7 + z * 13 + y * 5) % 9;
  if (h !== 0 && h !== 4) continue;
  const out = exposed(x, y, z)[0];
  if (!out) continue;
  const [dx, dz] = out, ix = x - dx, iz = z - dz;
  if (!has(ix, y, iz) || B.has(`${ix},${y},${iz}`)) continue;
  put(ix, y, iz, h === 0 ? "lantern" : "glowstone", h === 0 ? { hanging: "false", waterlogged: "false" } : undefined);
  lamps++;
}

const v = new Voxels([28, 31, 30]);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  v.set(x, y, z, block, state);
}
const stats = v.save(OUT);
console.log(`DC73864: ${stats.blocks} blocks, ${stats.palette} palette entries, ${lamps} lit rooms -> ${OUT}`);
