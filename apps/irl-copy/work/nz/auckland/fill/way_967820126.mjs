// Wellesley Court, a 1960s-70s concrete office block on the Auckland CBD ridge: a seven-storey main slab (28 blocks to the
// roof) with lower wings at 24 and a narrow two-storey lift/stair core stepping up to 36 on the west edge. Storey lines
// sit on absolute y (every 4 blocks), so the downhill side shows its extra storeys. The shell is one cell thick: glass
// and pale concrete piers on the outside, air behind, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_967820126.cells.json", "utf8"));
const W = 27, D = 38, H = 49;
const K = (x, z) => `${x},${z}`;

// the footprint: ground g and a storey-rounded roof tier t per cell (r/4 rounded, never below 24)
const F = new Map();
for (const [x, z, g, r] of cells) F.set(K(x, z), { g, t: Math.max(24, Math.round(r / 4) * 4) });
// lidar noise to flat tiers: each cell takes the median tier of its 3x3 footprint neighbourhood
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number); const ts = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = F.get(K(x + dx, z + dz)); if (n) ts.push(n.t); }
  ts.sort((a, b) => a - b); c.T = ts[Math.floor(ts.length / 2)];
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const inside = (x, y, z) => { const c = F.get(K(x, z)); return !!c && y >= 0 && y < c.T; };
const exterior = (x, y, z) => DIRS.some(([dx, dz]) => !inside(x + dx, y, z + dz));

// materials
const FOUND = "stone", BASE = "polished_andesite", PIER = "white_concrete", LINE = "white_concrete";
const GLASS = "light_blue_stained_glass", SHOP = "cyan_stained_glass", CORNICE = "light_gray_concrete";
const ROOF = "stone", FLOOR = "smooth_stone", LIGHT = "glowstone";

// the front: the south face (outside at z+1) on the ground storey, nearest the middle; the door sits at g+1, g+2
let door = null;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (c.g > 1 || exterior(x, c.g + 1, z) === false || inside(x, c.g + 1, z + 1)) continue;
  if (!door || Math.abs(x - 13) < Math.abs(door.x - 13)) door = { x, z, g: c.g };
}
const doorFacing = "south";
const alongFront = [[1, 0], [-1, 0]];   // the front runs along x

const v = new Voxels([W, H, D]);
const roofPlant = [];   // a plant room on the 28 tier, and the mast on the 36 tier, placed after the shell

for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const { g, T } = c;
  for (let y = 0; y < T; y++) {
    if (y < g) { v.set(x, y, z, FOUND); continue; }
    const ext = exterior(x, y, z) || y === T - 1;
    const pier = (x + z) % 3 === 0;
    if (!ext) {
      // interior: a floor slab per storey (and at the ground), air above it
      if (y % 4 === 0 || y === g) v.set(x, y, z, FLOOR);
      continue;
    }
    if (y === T - 1) { v.set(x, y, z, exterior(x, y, z) ? CORNICE : ROOF); continue; }
    if (y === g) { v.set(x, y, z, BASE); continue; }
    if (y % 4 === 0) { v.set(x, y, z, LINE); continue; }
    if (pier) { v.set(x, y, z, PIER); continue; }
    v.set(x, y, z, y < 4 ? SHOP : GLASS);
  }
}

// the entrance: a dark oak door on the front, glass either side, and a canopy band across the bay
if (door) {
  const { x, z, g } = door;
  v.set(x, g + 1, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 2, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const [dx, dz] of alongFront) {
    const bx = x + dx, bz = z + dz;
    if (inside(bx, g + 1, bz)) { v.set(bx, g + 1, bz, SHOP); v.set(bx, g + 2, bz, SHOP); }
  }
  for (const [dx] of [[0], [1], [-1]]) {
    if (inside(x + dx, g + 3, z)) v.set(x + dx, g + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm light behind some windows: glowstone on the air side of the glass, on the storey slab
let lit = 0;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g + 1; y < c.T - 1; y++) {
    if (y % 4 !== 1 || (x * 31 + z * 17 + y * 7) % 6 !== 0) continue;
    if (!inside(x, y, z) || exterior(x, y, z) || !inside(x, y - 1, z) || exterior(x, y - 1, z)) continue;
    const onGlass = DIRS.some(([dx, dz]) => exterior(x + dx, y, z + dz) && inside(x + dx, y, z + dz) && (x + dx + z + dz) % 3 !== 0);
    if (onGlass) { v.set(x, y, z, LIGHT); lit++; }
  }
}

// plant room on the 28 tier: a 3 x 3 box, two blocks high, standing on the roof
let plant = null;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (c.T !== 28) continue;
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) { const n = F.get(K(x + dx, z + dz)); if (!n || n.T !== 28) ok = false; }
  if (ok) { plant = { x, z, T: 28 }; break; }
}
if (plant) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = plant.T; y < plant.T + 2; y++) v.set(plant.x + dx, y, plant.z + dz, "stone_bricks");

// the core's mast: iron bars up from the 36 tier, a redstone lamp at the top for the aviation light
let mast = null;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (c.T === 36 && (!mast || DIRS.filter(([dx, dz]) => F.get(K(x + dx, z + dz))?.T === 36).length > mast.n)) mast = { x, z, T: 36, n: DIRS.filter(([dx, dz]) => F.get(K(x + dx, z + dz))?.T === 36).length };
}
if (mast) {
  for (let y = mast.T; y < mast.T + 4; y++) v.set(mast.x, y, mast.z, "iron_bars");
  v.set(mast.x, mast.T + 4, mast.z, "redstone_lamp", { lit: "true" });
}

const res = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_967820126.nbt");
console.log(JSON.stringify({ door, plant, mast: mast && { x: mast.x, z: mast.z }, lit, ...res }));
