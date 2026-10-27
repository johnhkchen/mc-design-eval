// The Aucklander: a 1970s concrete-and-glass office block, 16 storeys on a 15-storey wing (the lidar's 60-66 roofs).
// Massing follows the lidar roof per cell, smoothed into two flat tiers: the tower core at 64 with a plant room and
// a 2-block parapet to 67, the wings at 60. Storeys are 4 blocks on absolute lines (y = 4k), so the floors run
// straight across the whole footprint. Only the shell (cells with an open side: off the footprint, or beside a lower
// tier) carries facade; interior cells are air with a floor slab per storey. Ground is filled solid to each cell's
// lidar ground, so the downhill side shows its extra plinth, not a floating wall.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020918.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 18, Y = 79, Z = 20;
const LIGHT = "light_gray_concrete", WHITE = "white_concrete", GLASS = "light_blue_stained_glass";
const STONE = "stone_bricks", BASE = "polished_andesite", GLOW = "glowstone";

// per cell: g = lidar ground, T = the flat tier it rises to (tower core 64, wings 60)
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, T: r >= 63 ? 64 : 60 });
const at = (x, z) => fp.get(`${x},${z}`);
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// shell: an exposed side, i.e. off the footprint or against a lower tier
const isShell = (x, z) => {
  const c = at(x, z);
  return SIDES.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < c.T; });
};

const v = new Voxels([X, Y, Z]);
const shell = new Set();
for (const k of fp.keys()) { const [x, z] = k.split(",").map(Number); if (isShell(x, z)) shell.add(k); }

for (const [k, { g, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) v.set(x, y, z, STONE);
  if (!shell.has(k)) {
    // interior: a floor slab per storey line and the roof slab; air between
    for (let y = 0; y <= T; y += 4) if (y >= g) v.set(x, y, z, LIGHT);
    continue;
  }
  const pier = (x + z) % 3 === 0;
  for (let y = g; y <= T; y++) {
    let b;
    if (y === g) b = BASE;                                  // base course on the foundation
    else if (y === T) b = LIGHT;                            // cornice / roof slab
    else if (y % 4 === 0) b = LIGHT;                        // floor band
    else if (y % 4 === 3) b = WHITE;                        // head band
    else b = pier ? (y < 4 ? STONE : WHITE) : GLASS;        // mullions and glazing; ground storey gets stone piers
    v.set(x, y, z, b);
  }
  // parapet on the shell: one block on wings, two on the tower core
  for (let y = T + 1; y <= T + (T === 64 ? 2 : 1); y++) v.set(x, y, z, WHITE);
}

// entrance on the north face (z = 0, all ground 0): double door in the glass bay, with a canopy band above
v.set(1, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(1, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [0, 1, 2]) v.set(x, 2, 0, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// roof equipment: a plant room on the tower core
for (const x of [4, 5]) for (const z of [8, 9]) { v.set(x, 65, z, LIGHT); v.set(x, 66, z, LIGHT); }

// warm light behind some glazing: a glowstone in the air cell just inside the glass
const inside = (x, z, y) => {
  for (const [dx, dz] of SIDES) {
    const nk = `${x + dx},${z + dz}`, n = fp.get(nk);
    if (n && !shell.has(nk) && y >= n.g && y <= n.T) return [x + dx, z + dz];
  }
  return null;
};
for (const k of shell) {
  const [x, z] = k.split(",").map(Number), c = at(x, z);
  if ((x + z) % 3 === 0) continue;                          // piers are never lit
  for (let y = c.g + 1; y < c.T; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    if (y < 4 && y % 4 === 0) continue;
    if ((x * 7 + z * 3 + y) % 5 !== 0) continue;
    const i = inside(x, z, y);
    if (i) v.set(i[0], y, i[1], GLOW);
  }
}

v.save(`${DIR}/way_293020918.nbt`);
console.log("shell cells", shell.size, "of", fp.size, "blocks", v.count());
