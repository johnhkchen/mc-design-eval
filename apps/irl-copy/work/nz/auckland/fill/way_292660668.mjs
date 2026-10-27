import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Chorus House: a late-1990s glass-and-concrete office tower on a stone podium, the CBD's usual 1990s type: pale
// concrete spandrels, blue-grey reflective glazing in vertical bays, a dark stone base with shopfronts at street level,
// a set-back stack of tiers, and a lift-overrun and telecom mast on the crown. Lidar tiers (roof tops, y from 0):
// 10 (one-storey annex), 18 (podium), 90 (tower shaft), 98 and 102 (crown), with the ground under each cell as foundation.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660668.cells.json", "utf8"));
const g = new Voxels([91, 115, 65]);

const B = 6;                       // ground-floor slab level, above the lidar ground (0..5 under this footprint)
const STOREY = 4;                  // storey course: slab, two glass rows, header
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// Smooth the lidar roof with a 5x5 median over footprint cells, then snap it to five flat tiers.
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const tierOfRaw = (s) => (s <= 14 ? 10 : s <= 50 ? 18 : s <= 92 ? 90 : s <= 100 ? 98 : 102);
const tierMap = new Map();
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (roofAt.has(key(x + dx, z + dz))) v.push(roofAt.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  tierMap.set(key(x, z), tierOfRaw(v[v.length >> 1]));
}
const has = (x, z) => tierMap.has(key(x, z));
const Tof = (x, z) => tierMap.get(key(x, z));
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

// A footprint edge (any side open) carries the facade at every storey; a cell beside a lower tier carries it only
// above that tier's roof, so each setback shows its own wall standing on the tier below.
const edge = (x, z) => NB.some(([dx, dz]) => !has(x + dx, z + dz));
const lowerNb = (x, z) => NB.map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => has(a, b) && Tof(a, b) < Tof(x, z));
const facade = (x, z, y) => y >= B && y < Tof(x, z) && (edge(x, z) || lowerNb(x, z).some(([a, b]) => y >= Tof(a, b)));
const pier = (x, z) => !edge(x, z) && x % 6 === 3 && z % 6 === 3;   // structural columns carry each plate and the roof
const onXFace = (x, z) => [[1, 0], [-1, 0]].some(([dx, dz]) => !has(x + dx, z + dz) || Tof(x + dx, z + dz) < Tof(x, z));

// The entrance: a street-facing (north, -z) podium cell nearest the middle of the front.
const doorCands = cells.filter(([x, z]) => !has(x, z - 1) && [10, 18].includes(Tof(x, z)));
const [dx0, dz0] = doorCands.reduce((best, c) => (Math.abs(c[0] - 45) < Math.abs(best[0] - 45) ? c : best));

// ---- the massing: foundation, plinth, storeys, and the facade of each cell
for (const [x, z, gr] of cells) {
  const T = Tof(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");                   // foundation under the ground line
  for (let y = gr; y < B; y++) g.set(x, y, z, "stone_bricks");            // plinth, showing on the downhill side
  if (pier(x, z)) { for (let y = B; y < T; y++) g.set(x, y, z, "light_gray_concrete"); continue; }
  const idx = onXFace(x, z) ? z : x;
  for (let y = B; y < T; y++) {
    const k = Math.floor((y - B) / STOREY), rel = (y - B) % STOREY;
    if (!facade(x, z, y)) {
      if (y === T - 1) g.set(x, y, z, "gray_concrete");                   // roof
      else if (rel === 0) g.set(x, y, z, "stone");                        // floor slab, air behind the glass
      continue;
    }
    if (rel === 0 || rel === 3) {
      g.set(x, y, z, k === 0 ? "stone_bricks" : "white_concrete");        // floor line and header bands
    } else if (k === 0) {
      g.set(x, y, z, idx % 2 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");   // shopfront mullions
    } else {
      const bay = Math.floor(idx / 3);
      const block = idx % 3 === 0 ? "light_gray_concrete" : bay % 4 === 2 ? "cyan_stained_glass" : "light_blue_stained_glass";
      g.set(x, y, z, block);
      // a warm lamp just inside some windows, the air gap behind the glass
      if (rel === 1 && idx % 3 !== 0 && (x * 7 + z * 3 + k * 5) % 13 === 0) {
        const inside = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => has(a, b) && !facade(a, b, y) && !pier(a, b) && Tof(a, b) > y);
        if (inside) g.set(inside[0], y, inside[1], "glowstone");
      }
    }
  }
  if (edge(x, z)) g.set(x, T, z, "white_concrete");                       // parapet on the open edge
}

// ---- entrance: iron doors in the street front, a stone lintel and canopy over the three bays
g.set(dx0, B, dz0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, B + 1, dz0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const a of [dx0 - 1, dx0, dx0 + 1]) if (has(a, dz0)) for (const y of [B + 2, B + 3]) g.set(a, y, dz0, "stone_bricks");

// ---- crown: a plant room on the 102 tier with a telecom mast above it
const crown = cells.filter(([x, z]) => Tof(x, z) === 102);
const cx = Math.round(crown.reduce((s, c) => s + c[0], 0) / crown.length);
const cz = Math.round(crown.reduce((s, c) => s + c[1], 0) / crown.length);
let plant = 0;
for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 3; z <= cz + 3; z++) {
  if (Tof(x, z) !== 102 || edge(x, z)) continue;
  for (const y of [102, 103]) g.set(x, y, z, "light_gray_concrete");
  plant++;
}
for (let y = 104; y <= 112; y++) g.set(cx, y, cz, "iron_bars");

// ---- roof plant on the tower shaft (three 2x2 units, spaced), and planted terraces on the podium
const shaftTop = [];
for (const [x, z] of cells) {
  if (Tof(x, z) !== 90 || edge(x, z) || pier(x, z)) continue;
  if (shaftTop.some(([a, b]) => Math.abs(a - x) < 14 && Math.abs(b - z) < 14)) continue;
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => Tof(x + dx, z + dz) === 90 && !edge(x + dx, z + dz) && !pier(x + dx, z + dz));
  if (!ok) continue;
  shaftTop.push([x, z]);
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const y of [90, 91]) g.set(x + dx, y, z + dz, "light_gray_concrete");
  if (shaftTop.length === 3) break;
}
let terraces = 0;
for (const [x, z] of cells) {
  if (Tof(x, z) !== 18 || edge(x, z) || facade(x, z, 17) || (x * 3 + z * 5) % 7 !== 0) continue;
  g.set(x, 17, z, "moss_block"); terraces++;
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292660668.nbt";
const r = g.save(out);
console.log(JSON.stringify({ cells: cells.length, plant, shaftRoofUnits: shaftTop.length, terraces, door: [dx0, dz0], crown: [cx, cz], ...r }));
