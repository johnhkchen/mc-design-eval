// 41 East 51 Street, 1986: a commercial and office tower on a 39 x 41 Midtown block. Its lidar roof reads a 25-block
// podium at the north edge, a 41 and a 58 setback stepping up from it, and a 80-block crown with an 83-block parapet
// (the lidar's 82-83 on the edges is the parapet, not extra floors). The roof is smoothed (a 3x3 majority) and snapped
// to flat tiers of 3, 9, 25, 41, 58, 80 or 83 blocks, each at least one storey above its own ground. The skin is the
// 1980s grid: a light precast spandrel every 3 blocks, polished-andesite mullions every third block, tinted glass
// between, a granite plinth and cyan shopfront glass at street level, a dark-oak door in a granite-framed bay on the
// north (51st Street) front and a second on the south. Behind some panes sit glowstone lights in the air gap.
// Each storey is a floor slab on the storey line; the interior is air, so no room is modelled. Each column is solid
// from y 0 up to its ground, and every skin cell stands on the skin below it, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1076267.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 39, Z = 41, Y = 95;
const LEVELS = [3, 9, 25, 41, 58, 80, 83];   // flat roof tiers (top surface heights); ties go to the lower one

const key = (x, z) => `${x},${z}`;
const snap = (r) => LEVELS.reduce((best, l) => (Math.abs(l - r) < Math.abs(best - r) ? l : best));

// Columns: ground g and top H (exclusive), from the lidar roof snapped to the tiers and lifted to one storey above ground.
const col = new Map();
for (const [x, z, g, r] of cells) col.set(key(x, z), { x, z, g, H: Math.max(snap(r), g + 3) });

// One majority pass over the 3x3 neighbourhood removes single-cell lidar speckle without moving the tier edges.
const smoothed = new Map();
for (const c of col.values()) {
  const count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = col.get(key(c.x + dx, c.z + dz)); if (n) count.set(n.H, (count.get(n.H) ?? 0) + 1);
  }
  let best = c.H, bestN = 0;
  for (const [h, n] of count) if (n > bestN || (n === bestN && h < best)) { best = h; bestN = n; }
  smoothed.set(key(c.x, c.z), bestN >= 6 ? best : c.H);
}
for (const c of col.values()) c.H = smoothed.get(key(c.x, c.z));

const at = (x, z) => col.get(key(x, z));
const OUT = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north (low z, 51st Street), south, west, east
// The faces a column shows at height y: its footprint edge, or a neighbour whose top is below y.
const exposed = (x, z, y) => OUT.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.H <= y; });

const v = new Voxels([X, Y, Z]);
const glow = [];
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// Doors: a dark-oak door in a granite bay on the north and south fronts, facing outwards.
const doorAt = new Map([
  [key(16, 0), { facing: "north" }],
  [key(22, 40), { facing: "south" }],
]);

for (const c of col.values()) {
  const { x, z, g, H } = c;
  for (let y = 0; y < H; y++) {
    if (y < g) { put(x, y, z, "stone"); continue; }
    const ex = exposed(x, z, y);
    if (!ex.length) {
      if (y === H - 1) put(x, y, z, "gray_concrete");            // interior roof deck
      else if (y % 3 === 0) put(x, y, z, "smooth_stone");        // storey floor slab
      continue;
    }
    if (y === H - 1) { put(x, y, z, "polished_andesite"); continue; }   // parapet and cornice on the exposed top

    const [dx, dz] = ex[0];
    const u = dx === 0 ? x : z;                                 // position along the face
    const mullion = u % 3 === 0;
    const door = doorAt.get(key(x, z));
    if (y < 3) {                                                // street storey: plinth, then shopfront
      if (y === 0) { put(x, y, z, "polished_granite"); continue; }
      if (door) {
        put(x, y, z, "dark_oak_door", { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      // entrance bay: granite jambs flank the door at 2 cells either side
      const jamb = (z === 0 && x >= 14 && x <= 18) || (z === 40 && x >= 20 && x <= 24);
      if (jamb) { put(x, y, z, (x === 14 || x === 18 || x === 20 || x === 24) ? "polished_granite" : "cyan_stained_glass"); continue; }
      put(x, y, z, mullion ? "polished_andesite" : "cyan_stained_glass");
      continue;
    }
    const rel = y % 3, k = Math.floor(y / 3);
    if (rel === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // precast spandrel on each storey line
    if (mullion) { put(x, y, z, "polished_andesite"); continue; }        // frame
    put(x, y, z, "gray_stained_glass");
    if ((u * 7 + k * 5 + rel) % 27 === 0) glow.push([x - dx, y, z - dz]); // air gap behind this pane (about one in 27)
  }
}

// Warm lights in the air gap behind some panes, only where the cell inside is air (not a floor or a column).
let lit = 0;
for (const [x, y, z] of glow) {
  const c = at(x, z);
  if (!c || y < c.g || y >= c.H - 1 || y % 3 === 0) continue;
  if (exposed(x, z, y).length) continue;
  put(x, y, z, "glowstone"); lit++;
}

// Roof equipment on the 80-block crown: two plant boxes, under the 83-block parapet.
for (const c of col.values()) {
  if (c.H !== 80) continue;
  const inBox = (c.x >= 10 && c.x <= 13 && c.z >= 22 && c.z <= 25) || (c.x >= 26 && c.x <= 28 && c.z >= 14 && c.z <= 16);
  if (!inBox || exposed(c.x, c.z, 79).length) continue;
  put(c.x, 80, c.z, "light_gray_concrete"); put(c.x, 81, c.z, "light_gray_concrete");
}

const out = v.save(`${DIR}/NYC1076267.nbt`);
const top = Math.max(...[...col.values()].map((c) => c.H));
console.log(JSON.stringify({ cells: col.size, top, lit, ...out }));
