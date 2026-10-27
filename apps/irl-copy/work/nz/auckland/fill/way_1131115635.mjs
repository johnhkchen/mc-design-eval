// Grafton Hall B: a 1960s-70s reinforced-concrete office and teaching block, six storeys on its tallest tier, stepping
// down in tiers to four and two. White spandrels, light-grey concrete piers, tinted glass panes, a stone plinth on the
// lidar ground, a lobby entrance under a canopy on posts, and a flat roof with plant boxes. Storey lines sit on one
// datum (y = 2 + 4k) on every cell, so the floors line up across the slope and only the plinth steps with the ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1131115635.cells.json", "utf8"));

const W = 72, H = 37, D = 87;
const LINE0 = 2;                              // storey lines at y = 2 + 4k
const TIERS = [6, 10, 14, 18, 22, 26];        // flat roof tiers on the storey lines (top surface y)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// each footprint cell: ground g, roof tier t (lidar roof snapped to the nearest tier, ties taller, at least one storey above ground)
const cell = new Map();
for (const [x, z, g, r] of cells) {
  let i = 0;
  for (let k = 0; k < TIERS.length; k++) if (Math.abs(TIERS[k] - r) <= Math.abs(TIERS[i] - r)) i = k;
  while (TIERS[i] < g + 4 && i < TIERS.length - 1) i++;
  cell.set(`${x},${z}`, { x, z, g, t: TIERS[i] });
}
const at = (x, z) => cell.get(`${x},${z}`);

// the directions in which a cell's row y opens to air: off the footprint, or past a lower neighbour's roof
const faces = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.t; });
const outer = (c) => DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
// 0 = slab, 1 and 2 = window, 3 = head band
const off = (y) => ((y - LINE0) % 4 + 4) % 4;

const v = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => { if (x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) v.set(x, y, z, b, s); };
const free = (x, z) => !at(x, z) && x >= 0 && z >= 0 && x < W && z < D;

// the entrance: a ground-storey face on the outer edge with two clear cells outside it, the southernmost first
const door = (() => {
  const cands = [...cell.values()].filter((c) => c.g <= 3 && c.t >= 10).sort((a, b) => b.z - a.z || a.x - b.x);
  for (const c of cands) for (const [dx, dz] of outer(c)) {
    if (!free(c.x + dx, c.z + dz) || !free(c.x + 2 * dx, c.z + 2 * dz)) continue;
    if (c.g + 3 >= c.t) continue;
    return { c, dx, dz };
  }
  return null;
})();
const doorKey = door ? `${door.c.x},${door.c.z}` : "";

for (const c of cell.values()) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");

  for (let y = c.g; y < c.t; y++) {
    const f = faces(c, y), out = f.length > 0;
    if (y === c.g) { put(c.x, y, c.z, out ? "stone_bricks" : "smooth_stone"); continue; }     // plinth course on the ground
    if (y === c.t - 1) { put(c.x, y, c.z, out ? "white_concrete" : "stone"); continue; }      // cornice over the roof membrane
    if (!out) { if (off(y) === 0) put(c.x, y, c.z, "smooth_stone"); continue; }             // interior: slab per storey, else air
    const [dx] = f[0];
    const along = dx !== 0 ? c.z : c.x;
    const pier = along % 3 === 0;
    if (pier) { put(c.x, y, c.z, "light_gray_concrete"); continue; }
    if (off(y) === 0 || off(y) === 3) { put(c.x, y, c.z, "white_concrete"); continue; }     // spandrel and head bands
    // window bay: shopfront glass on the ground storey, panes above; lit bays carry a glowstone just inside
    const shop = y - c.g <= 2;
    if (shop) { put(c.x, y, c.z, "light_blue_stained_glass"); continue; }
    const [fdx, fdz] = f[0];
    const pane = fdx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    put(c.x, y, c.z, "light_blue_stained_glass_pane", pane);
  }

  // coping on the outer edge, above the top tier
  if (outer(c).length) put(c.x, c.t, c.z, "smooth_stone");
}

// warm lights: a glowstone just inside some lit window bays (air behind the glass, nothing else in it)
for (const c of cell.values()) {
  for (let y = c.g + 3; y < c.t - 1; y++) {
    if (off(y) !== 1 && off(y) !== 2) continue;
    if (y - c.g <= 2) continue;
    const f = faces(c, y);
    if (!f.length || ((c.x + 2 * c.z + 3 * y) % 7) !== 0) continue;
    const [dx, dz] = f[0];
    const ic = at(c.x - dx, c.z - dz);
    if (!ic || faces(ic, y).length || y < ic.g || y >= ic.t) continue;
    put(ic.x, y, ic.z, "glowstone");
  }
}

// entrance: glass door in the face, a canopy on two posts, a lantern under it; the forecourt is filled to the ground
if (door) {
  const { c, dx, dz } = door, facing = FACING[`${dx},${dz}`];
  const lat = [-dz, dx];                                    // along the face
  const C = c.g + 3;                                        // canopy row above the door
  for (const y of [c.g + 1, c.g + 2]) {
    const half = y === c.g + 1 ? "lower" : "upper";
    put(c.x, y, c.z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  }
  for (let k = 1; k <= 2; k++) for (let l = -1; l <= 1; l++) {
    const x = c.x + dx * k + lat[0] * l, z = c.z + dz * k + lat[1] * l;
    if (!free(x, z)) continue;
    for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");
    put(x, c.g, z, "smooth_stone");
    put(x, C, z, "smooth_stone");                           // canopy
  }
  for (const l of [-1, 1]) {
    const x = c.x + dx * 2 + lat[0] * l, z = c.z + dz * 2 + lat[1] * l;
    if (!free(x, z)) continue;
    for (let y = c.g + 1; y < C; y++) put(x, y, z, "polished_andesite");
  }
  put(c.x + dx, C - 1, c.z + dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant: 3 x 3 service boxes on the top tiers, clear of the edges
for (const c of cell.values()) {
  if (c.t < 22 || c.x % 10 !== 5 || c.z % 10 !== 5) continue;
  const block = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.t !== c.t || outer(n).length) { block.length = 0; break; }
    block.push(n);
  }
  if (block.length !== 9) continue;
  for (const n of block) {
    put(n.x, c.t, n.z, "light_gray_concrete");
    put(n.x, c.t + 1, n.z, n === c ? "light_blue_stained_glass" : "light_gray_concrete");
  }
}

v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1131115635.nbt");
