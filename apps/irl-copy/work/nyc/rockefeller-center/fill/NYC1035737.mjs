// 685 Fifth Avenue (1926): a brick-and-limestone setback office/residential block with a granite shopfront
// base. Massing follows the lidar roof: smoothed with a 3x3 median, rounded to whole 3-block storeys, so every
// tier is flat and stands on the solid column beneath it. Each column is a shell (exterior walls, belt courses,
// window bays) over floor slabs at every storey, with air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035737.cells.json`, "utf8"));
const STOREY = 3, W = 34, D = 16;
const key = (x, z) => `${x},${z}`;
const roofAt = new Map(), groundAt = new Map();
for (const [x, z, g, r] of cells) { groundAt.set(key(x, z), g); roofAt.set(key(x, z), r); }
const inside = (x, z) => groundAt.has(key(x, z));
const ring = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// 1. Lidar dropouts (roof 0) take the median of their valid neighbours.
const roof = new Map();
for (const [k, r] of roofAt) {
  if (r > 0) { roof.set(k, r); continue; }
  const [x, z] = k.split(",").map(Number);
  const nb = ring.map(([dx, dz]) => roofAt.get(key(x + dx, z + dz))).filter((v) => v > 0);
  roof.set(k, nb.length ? median(nb) : STOREY);
}
// 2. A 3x3 median of the footprint smooths the lidar noise; storeys are whole numbers of 3 blocks.
const H = new Map();
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  const win = [[0, 0], ...ring].map(([dx, dz]) => roof.get(key(x + dx, z + dz))).filter((v) => v > 0);
  const storeys = Math.max(1, Math.round(median(win) / STOREY));
  H.set(k, storeys * STOREY);
}
// 3. Roof equipment: the tallest 3x3 core carries one more storey of plant room.
const tallest = Math.max(...H.values());
const top = [...H].filter(([, h]) => h === tallest).map(([k]) => k.split(",").map(Number));
const cx = Math.round(top.reduce((s, [x]) => s + x, 0) / top.length), cz = Math.round(top.reduce((s, [, z]) => s + z, 0) / top.length);
for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
  const k = key(cx + dx, cz + dz);
  if (H.has(k)) H.set(k, H.get(k) + STOREY);
}

const topAt = (x, z) => (inside(x, z) ? H.get(key(x, z)) : -1);
// Faces: 0 north (z-1), 1 south (z+1), 2 west (x-1), 3 east (x+1). A face is exposed where the neighbour is outside
// the footprint or its column ends below this block.
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposed = (x, z, y) => NB.flatMap(([dx, dz], i) => (!inside(x + dx, z + dz) || topAt(x + dx, z + dz) <= y ? [i] : []));

// The street entrance: a pier column on the south face, near the middle of that row.
const southXs = [...groundAt.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === D - 1).map(([x]) => x);
const mid = southXs.reduce((s, x) => s + x, 0) / southXs.length;
const doorX = southXs.filter((x) => x % 3 === 0).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];

const g = new Voxels([W, 77, D]);
for (const [k, h] of H) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < h; y++) {
    const f = exposed(x, z, y), shell = f.length > 0;
    const zf = f.filter((i) => i < 2), xf = f.filter((i) => i >= 2);
    if (y === 0) { g.set(x, y, z, shell ? "polished_granite" : "stone"); continue; }     // granite base, slab
    if (y % STOREY === 0) { g.set(x, y, z, shell ? "calcite" : "stone"); continue; }    // belt course / floor slab
    if (y === h - 1) { g.set(x, y, z, shell ? "calcite" : "gravel"); continue; }        // cornice / tar-and-gravel roof
    if (!shell) continue;                                                              // air behind the glass
    if (zf.length && xf.length) { g.set(x, y, z, "stone_bricks"); continue; }          // corner quoin
    const onZ = zf.length > 0, u = onZ ? x : z;
    if (y < STOREY) {                                                                  // shopfront
      if (onZ && z === D - 1 && x === doorX && y === 1) { g.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (onZ && z === D - 1 && x === doorX && y === 2) { g.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (onZ && z === D - 1 && y === 2 && Math.abs(x - doorX) === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      g.set(x, y, z, u % 3 === 0 ? "polished_granite" : "gray_stained_glass_pane");
      continue;
    }
    if (u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }                           // brick piers
    const lit = (x * 7919 + y * 104729 + z * 1299709) % 9 === 4;                       // about one window in nine
    g.set(x, y, z, lit ? "glowstone" : "gray_stained_glass_pane");
  }
}
const stats = g.save(`${dir}/NYC1035737.nbt`);
const maxY = Math.max(...H.values());
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, tallestTop: maxY, doorX, penthouseCentre: [cx, cz] }));
