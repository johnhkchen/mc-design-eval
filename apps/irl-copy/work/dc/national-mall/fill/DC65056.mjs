// 1515 Rhode Island Ave NW: a 1920s brick hotel with cream stone trim, stepped 3 tiers (10 / 13 / 16) on a stone plinth.
// Storeys are 3 blocks above a 4-block ground floor. Windows are glass panes in a brick wall; quoins, string courses,
// cornice and parapet are cream stone. Interiors are air behind the glass with a floor slab at each storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65056.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65056.nbt";

const W = 42, D = 30, H = 27;
const FOUND = "stone_bricks", BRICK = "bricks", STONE = "quartz_block", GLASS = "glass_pane";
const FLOOR = "smooth_stone", PARAPET = "stone_bricks", PIER = "stone_bricks", LIGHT = "glowstone";
const SHOP = "gray_stained_glass_pane";

const key = (x, z) => `${x},${z}`;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map(), roofRaw = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roofRaw.set(key(x, z), r); }
const inFoot = (x, z) => roofRaw.has(key(x, z));

// Lidar roof heights are noisy: median of the 3x3 footprint neighbourhood, then snapped to storey tiers
// (0 = no building: the cell is just the plinth; 4 / 7 / 10 / 13 / 16 = the storey lines).
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(roofRaw.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r) => (r <= 3 ? 0 : r <= 6 ? 4 : r <= 9 ? 7 : r <= 12 ? 10 : r <= 15 ? 13 : 16);
const top = new Map();
for (const k of roofRaw.keys()) { const [x, z] = k.split(",").map(Number); top.set(k, tier(median(x, z))); }
const topAt = (x, z) => (inFoot(x, z) ? top.get(key(x, z)) : 0);

const B = new Voxels([W, H, D]);
const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // north (z-), south, west, east
const DOOR_X = 35;

for (const k of roofRaw.keys()) {
  const [x, z] = k.split(",").map(Number);
  const g = ground.get(k), t = top.get(k);
  for (let y = 0; y < g; y++) B.set(x, y, z, FOUND);
  if (t === 0) continue;
  const starts = [g, 4, 7, 10, 13, 16].filter((s, i, a) => s < t && a.indexOf(s) === i);
  for (let y = g; y < t; y++) {
    const exp = dirs.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
    if (!exp.length) {
      if (starts.includes(y) || y === t - 1) B.set(x, y, z, FLOOR); // interior: a slab per storey, air between
      continue;
    }
    const s0 = starts.filter((s) => s <= y).pop();
    const rel = y - s0, isGround = s0 === g;
    const onNS = exp.some(([, dz]) => dz !== 0);
    const idx = onNS ? x : z;
    const winCol = idx % 3 !== 0;                                     // two panes, then a brick pier
    if (y === t - 1) { B.set(x, y, z, STONE); }                       // cornice course
    else if (isGround) {
      if (y === g) B.set(x, y, z, PIER);                               // plinth course
      else if (winCol) B.set(x, y, z, SHOP);                           // shopfront glazing
      else B.set(x, y, z, PIER);
    } else if (rel === 0) B.set(x, y, z, STONE);                      // string course
    else if (winCol) B.set(x, y, z, GLASS);
    else B.set(x, y, z, BRICK);
    // a warm room behind some panes: glowstone on the inside cell, in air
    const lit = (isGround && y === g + 1 && winCol && (x + z) % 4 === 0) || (!isGround && rel > 0 && winCol && (x + 2 * z + y) % 5 === 0);
    if (lit && y < t - 1) {
      const [dx, dz] = exp[0], ix = x - dx, iz = z - dz;
      if (inFoot(ix, iz) && topAt(ix, iz) > y) B.set(ix, y, iz, LIGHT);
    }
  }
  // parapet on the roof edge: exposed at the top of the cornice
  if (dirs.some(([dx, dz]) => topAt(x + dx, z + dz) <= t - 1)) B.set(x, t, z, PARAPET);
}

// entrance on the north (street) face: double-height door in the storefront, a stone canopy over it
B.set(DOOR_X, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
B.set(DOOR_X, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) B.set(x, 3, 0, "stone_brick_slab", { type: "bottom" });

// rooftop penthouse: a 3x3 box on the tower's flat roof, centred where the 3x3 is all top tier 16
let best = null, cx = 0, cz = 0, n = 0;
for (const [k, t] of top) if (t === 16) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; n++; }
cx /= n; cz /= n;
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  let ok = true;
  for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) ok = topAt(x + dx, z + dz) === 16;
  if (ok) { const d = (x - cx) ** 2 + (z - cz) ** 2; if (!best || d < best.d) best = { x, z, d }; }
}
if (best) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = best.x + dx, z = best.z + dz;
    for (const y of [16, 17]) B.set(x, y, z, BRICK);
    B.set(x, 18, z, FOUND);
  }
  // glass in the penthouse's faces at mid-height
  for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    B.set(best.x + dx, 17, best.z + dz, GLASS);
  }
}

const info = B.save(OUT);
console.log(`DC65056: ${info.blocks} blocks, palette ${info.palette}`);
