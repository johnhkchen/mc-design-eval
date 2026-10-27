// A slim late-20th-century concrete-and-glass tower on Eden Terrace's ridge: a 104-block (about 86 m, roughly 25 storeys)
// stepped crown on the north side, shoulders stepping down south and east, low brick wings on the west and at the
// south-east corner. Light-grey concrete piers and spandrels, tinted glass panes, white storey bands and a stone plinth
// on the sloping ground. Interior air behind the glass, a floor slab per storey, a glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_464644562.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_464644562.nbt";
const X = 13, H = 115, Z = 9;

// the lidar roof, smoothed into flat tiers, each a multiple of the 4-block storey
const tier = (r) => (r >= 100 ? 104 : r >= 88 ? 96 : r >= 68 ? 76 : r >= 56 ? 64 : r >= 40 ? 52 : r >= 22 ? 32 : 12);

const col = new Map();                                    // "x,z" -> { g: ground, t: roof top (surface) }
for (const [x, z, g, roof] of cells) col.set(`${x},${z}`, { g, t: tier(roof) });

const solidAt = (x, y, z) => { const c = col.get(`${x},${z}`); return !!c && y >= 0 && y < c.t; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];          // (dx, dz) outward normals
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solidAt(x + dx, y, z + dz));

const put = new Map();                                    // "x,y,z" -> [block, state]: the whole design, then written once
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, [block, state]);
const GLASS = "light_blue_stained_glass_pane", CONCRETE = "light_gray_concrete", BAND = "white_concrete";
const plain = { waterlogged: "false" };

const glazing = [];                                       // glass cells with an outward face: candidates for a lamp behind
for (const [key, { g, t }] of col) {
  const [x, z] = key.split(",").map(Number);
  const wing = t <= 12;
  const pier = wing ? "bricks" : CONCRETE;
  for (let y = 0; y < t; y++) {
    if (y < g) { set(x, y, z, "stone_bricks"); continue; }          // plinth under the sloping ground
    const ex = exposed(x, y, z);
    if (y === t - 1) { set(x, y, z, ex.length ? BAND : CONCRETE); continue; }   // roof slab, cornice on the edge
    const r = (y - g) % 4;                                          // 0 floor slab, 1-2 glazing, 3 spandrel
    if (r === 0) { set(x, y, z, ex.length ? BAND : CONCRETE); continue; }     // storey line / floor
    if (!ex.length) continue;                                        // interior: air behind the facade
    if (r === 3) { set(x, y, z, pier); continue; }                   // spandrel band under each storey's glass
    const [dx, dz] = ex[0];
    const along = dz !== 0 ? x : z;
    if (ex.length > 1 || along % 2 === 0) { set(x, y, z, pier); continue; }   // corners and mullions
    const state = dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    set(x, y, z, GLASS, state);
    if (r === 2) glazing.push({ x, y, z, dx, dz });
  }
  if (exposed(x, t, z).length) set(x, t, z, "smooth_stone_slab", { type: "bottom", ...plain });   // parapet on the roof edge
}

// a warm light behind some panes: the cell just inside must be inside the building and empty (no wall, no slab there)
for (const { x, y, z, dx, dz } of glazing) {
  if ((x * 7 + z * 5 + Math.floor(y / 4)) % 6 !== 0) continue;
  const [ix, iz] = [x - dx, z - dz], c = col.get(`${ix},${iz}`), k = `${ix},${y},${iz}`;
  if (c && y >= c.g && y < c.t && !put.has(k)) set(ix, y, iz, "glowstone");
}

// the entrance on the south face: a glass door under a canopy, piers either side
{
  const { g } = col.get("10,8");
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(10, g + 1, 8, "iron_door", { ...door, half: "lower" });
  set(10, g + 2, 8, "iron_door", { ...door, half: "upper" });
  for (const x of [9, 10, 11]) set(x, g + 3, 8, "smooth_stone_slab", { type: "top", ...plain });
  set(9, g + 1, 8, CONCRETE);
  set(11, g + 1, 8, CONCRETE);
}

// roof plant room on the crown: a 2x2 box of concrete with a lid
for (const [x, z] of [[5, 2], [6, 2], [5, 3], [6, 3]]) {
  set(x, 104, z, CONCRETE);
  set(x, 105, z, CONCRETE);
  set(x, 106, z, "smooth_stone_slab", { type: "bottom", ...plain });
}

const vox = new Voxels([X, H, Z]);
for (const [k, [block, state]] of put) {
  const [x, y, z] = k.split(",").map(Number);
  vox.set(x, y, z, block, state);
}
const stats = vox.save(OUT);
console.log(JSON.stringify(stats));
