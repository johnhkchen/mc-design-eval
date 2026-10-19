// 18 East 46th Street, 1958 commercial and office building: a stepped curtain-wall office slab on a granite base,
// 16 x 27 blocks, 54 blocks (about 60 m, 18 storeys) at its highest. Lidar roof heights are snapped to four flat tiers
// (27, 36, 48, 54 blocks = 9, 12, 16, 18 storeys of 3 blocks), so the massing reads as setbacks: a low wing at the NW
// corner, a 12-storey band along the frontage, a 16-storey middle and the 18-storey slab to the south. The two lidar-zero
// cells inside the footprint are open light wells. The north edge (low z, 46th Street) is the frontage: a glazed
// shopfront on the ground storey with a centred lobby (x 6-9) under a canopy and double doors. Each storey is 3 blocks:
// a light-grey spandrel, a glass band with iron mullions every third block, and a light-grey transom. The facade is a
// one-block shell (depth 0), with an air gap behind the glass (depth 1) that carries a floor slab per storey; the core
// beyond is solid (no interiors). Gravel roofs, a one-block parapet on every facade edge, and a 3 x 3 mechanical
// penthouse on the 54 tier. Glowstone sits behind some panes and lanterns light the shopfront.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035395.cells.json`, "utf8"));
const X = 16, Z = 27, Y = 58;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const key = (x, z) => `${x},${z}`;
const built = (x, z) => cell.has(key(x, z)) && cell.get(key(x, z)).roof > 0;   // roof 0 inside the footprint = light well
const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// Lidar roof heights snapped to four flat tiers (blocks above y 0).
const tier = (r) => (r <= 31 ? 27 : r <= 41 ? 36 : r <= 50 ? 48 : 54);
const H = new Map();
for (const [k, c] of cell) if (c.roof > 0) H.set(k, tier(c.roof));
const h = (x, z) => H.get(key(x, z)) ?? 0;

// Depth: 0 = facade shell (a neighbour is open ground, outside the footprint, or a lower tier: the setback walls),
// 1 = the air gap behind it, 2+ = solid core. Breadth-first from the shell.
const depth = new Map();
const queue = [];
for (const k of H.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (nbrs(x, z).some(([a, b]) => !built(a, b) || h(a, b) < h(x, z))) { depth.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(key(x, z));
  for (const [a, b] of nbrs(x, z)) if (built(a, b) && !depth.has(key(a, b))) { depth.set(key(a, b), d + 1); queue.push([a, b]); }
}

const GLASS = "light_blue_stained_glass", MULL = "iron_block", SPAN = "light_gray_concrete", BASE = "polished_granite";
const ROOF = "gravel", CORE = "stone", PARA = "smooth_stone";

const g = new Voxels([X, Y, Z]);
const windows = [], shop = [];

for (const k of H.keys()) {
  const [x, z] = k.split(",").map(Number);
  const top = h(x, z), d = depth.get(k);
  const front = !built(x, z - 1);                         // north face = the 46th Street frontage
  const ns = front || !built(x, z + 1);                   // exposed on a street-side face: mullions run along x
  const along = ns ? x : z;
  const lobby = front && x >= 6 && x <= 9;
  for (let y = 0; y < top; y++) {
    const r = y % 3, st = Math.floor(y / 3);
    let b = null;
    if (y === 0) b = BASE;
    else if (y === top - 1 && d >= 1) b = ROOF;
    else if (d >= 2) b = CORE;
    else if (d === 1) { if (r === 0) b = SPAN; }          // floor slab per storey in the air gap
    else if (st === 0) {                                  // ground storey, y 1-2
      if (front) {
        if (lobby) b = x === 7 || x === 8 ? null : BASE;  // doors go in afterwards
        else { b = along % 3 === 0 ? MULL : GLASS; shop.push([x, y, z, along]); }
      } else b = BASE;
    } else if (lobby && y === 3) b = PARA;                // canopy over the entrance (a stone slab)
    else if (r === 1) { b = along % 3 === 0 ? MULL : GLASS; if (b === GLASS) windows.push([x, y, z]); }
    else b = SPAN;
    if (b) g.set(x, y, z, b);
  }
  if (d === 0) g.set(x, top, z, PARA);                    // parapet on every facade edge
}

// Doors into the lobby (iron, double, x 7 and 8) on the 46th Street face.
for (const x of [7, 8]) {
  g.set(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
}

// Warm light: glowstone behind about one pane in ten on the upper storeys, lanterns behind the shopfront.
for (const [x, y, z] of windows) {
  if ((x * 31 + y * 17 + z * 7) % 10 !== 0) continue;
  const gap = nbrs(x, z).find(([a, b]) => built(a, b) && depth.get(key(a, b)) === 1 && h(a, b) > y);
  if (gap) g.set(gap[0], y, gap[1], "glowstone");
}
for (const [x, y, z, along] of shop) {
  if (y !== 1 || along % 3 === 0 || along % 3 === 2) continue;
  const gap = nbrs(x, z).find(([a, b]) => built(a, b) && depth.get(key(a, b)) === 1);
  if (gap) g.set(gap[0], y, gap[1], "lantern", { hanging: "false", waterlogged: "false" });
}

// Mechanical penthouse on the 54 tier, centred: a solid 3 x 3 box, iron louvres on the middle of each face, a stone roof.
for (let x = 8; x <= 10; x++) for (let z = 19; z <= 21; z++) {
  g.set(x, 54, z, SPAN); g.set(x, 55, z, SPAN); g.set(x, 56, z, "stone");
}
for (const [x, z] of [[9, 19], [9, 21], [8, 20], [10, 20]]) g.set(x, 55, z, "iron_bars");

// Check: every block above y 0 has something under it or beside it at its own level (no floating courses).
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!g.get(x, y, z)) continue;
  const under = g.get(x, y - 1, z);
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!under && !side) floating++;
}
if (floating) console.warn(`floating blocks: ${floating}`);

const { blocks, palette } = g.save(`${DIR}/NYC1035395.nbt`);
console.log(`NYC1035395.nbt: ${blocks} blocks, ${palette} palette entries, floating ${floating}`);
