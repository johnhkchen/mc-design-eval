// way 170800703: a 1980s CBD office block, 14 storeys of 4 blocks (3.3 m), on a 21 x 33 footprint. Concrete frame
// with a tinted-glass curtain wall between light-grey piers, smooth-stone floor lines and spandrels, a stone-faced
// ground floor with a lobby door under a canopy, a stepped massing from the lidar roof, and a plant screen on top.
// The envelope is a glass skin with a one-block air gap behind it (glowstone in some bays), and the core is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170800703.cells.json", "utf8"));
const W = 21, D = 33, H = 70;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// the footprint and the lidar roof per cell; y 0 is the lowest ground, and each cell's ground is its third number
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { ground, roof });
const inFp = (x, z) => fp.has(key(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Roof tiers. Lidar returns under 8 blocks on the footprint's rim are ground noise, not roof: take the median of the
// real roofs around them. Then a 3x3 median smooths the stair-stepped top, and each cell goes to a whole storey pair
// (8 blocks), so the massing reads as flat tiers.
const roofAt = new Map();
for (const [k, { roof }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const around = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = fp.get(key(x + dx, z + dz)); if (n && n.roof >= 8) around.push(n.roof);
  }
  roofAt.set(k, roof >= 8 ? roof : (around.length ? median(around) : 8));
}
const T = new Map();                                     // top of each cell's column (blocks occupy y < T)
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  const around = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roofAt.get(key(x + dx, z + dz)); if (r !== undefined) around.push(r);
  }
  T.set(k, Math.max(8, 8 * Math.round(median(around) / 8)));
}
const top = (x, z) => (inFp(x, z) ? T.get(key(x, z)) : 0);

// a face is exposed at height y if the cell beside it is outside the footprint or its column stops below y
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const exposed = (x, z, y) => exposedDirs(x, z, y).length > 0;
// a block just inside the skin, with an exposed neighbour in plane, is the air gap behind the glass
const gap = (x, z, y) => !exposed(x, z, y) && DIRS.some(([dx, dz]) => inFp(x + dx, z + dz) && y < top(x + dx, z + dz) && exposed(x + dx, z + dz, y));
// piers every 4 blocks on each face (x faces run along z, z faces along x)
const pier = (x, z, y) => {
  const dirs = exposedDirs(x, z, y);
  const xFace = dirs.some(([dx]) => dx), zFace = dirs.some(([, dz]) => dz);
  return (xFace && z % 4 === 0) || (zFace && x % 4 === 0);
};
const lit = (x, y, z) => (x * 5 + z * 7 + (y >> 2) * 3) % 11 === 0;   // about one bay in eleven

const g = new Voxels([W, H, D]);
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    let b;
    if (y === 0) b = "polished_andesite";                           // base course, the foundation on the low side
    else if (y === t - 1) b = exposed(x, z, y) ? "smooth_stone" : "light_gray_concrete";   // cornice and roof deck
    else if (y % 4 === 0) b = "smooth_stone";                       // floor slab line
    else if (exposed(x, z, y)) {
      const ground = y < 4;
      if (pier(x, z, y)) b = ground ? "stone_bricks" : "light_gray_concrete";
      else if (y % 4 === 3) b = "smooth_stone";                     // spandrel under each window band
      else b = ground ? "glass" : "cyan_stained_glass";
    } else if (gap(x, z, y)) {
      if (y % 4 === 1 && lit(x, y, z)) b = "glowstone";             // a warm light behind the glass
      else continue;                                               // the air gap
    } else b = "light_gray_concrete";                               // solid core: no interiors
    g.set(x, y, z, b);
  }
}

// lobby door on the south face (the high-z edge), near the middle of the footprint, under a canopy
let door = null;
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (inFp(x, z + 1)) continue;
  if (!door || Math.abs(x - 10) < Math.abs(door.x - 10)) door = { x, z };
}
const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(door.x, 1, door.z, "oak_door", { ...doorState, half: "lower" });
g.set(door.x, 2, door.z, "oak_door", { ...doorState, half: "upper" });
for (let dx = -1; dx <= 1; dx++) for (let dz = 1; dz <= 2; dz++) g.set(door.x + dx, 3, door.z + dz, "smooth_stone");

// plant screen on the top tier, two blocks above the roof deck, over the middle of the tower
for (let x = 7; x <= 13; x++) for (let z = 12; z <= 20; z++) {
  if (!inFp(x, z) || top(x, z) < 56) continue;
  g.set(x, 56, z, "stone_bricks"); g.set(x, 57, z, "stone_bricks");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170800703.nbt";
console.log(g.save(out));
