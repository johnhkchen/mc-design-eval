// FR245184601: a commercial block on the Paris footprint (14 x 23 cells), read as an early-20th-century stone shop-and-office
// building: a plinth and base course, a shopfront ground storey, two upper storeys of glazed bays between stone piers and
// string courses, and a parapet. The lidar's roof is smoothed into four flat tiers (4, 7, 12, 14 blocks) so the massing
// steps down from a taller western block to a low eastern wing. Walls are pale stone; the skin is one block thick with
// glass panes set in it, a one-block air gap behind each window (glowstone in some), and solid stone everywhere else.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184601.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184601.nbt";

const W = 14, D = 23, H = 17;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(key(x, z), r);
const inFp = (x, z) => roofAt.has(key(x, z));

// Lidar roof smoothed by the median of each cell's footprint neighbourhood, then snapped to four flat tiers (top surface, blocks).
const tierOf = (r) => (r <= 5 ? 4 : r <= 9 ? 7 : r <= 11 ? 12 : 14);
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tier = new Map();
for (const [x, z, , r] of cells) {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(roofAt.get(key(x + dx, z + dz)));
  tier.set(key(x, z), tierOf(median(around)));
}
const T = (x, z) => tier.get(key(x, z));

// Distance from the outside edge (1 on the perimeter): the air gap behind a window is only carved inside the skin.
const dist = new Map();
const queue = [];
for (const [x, z] of [...tier.keys()].map((k) => k.split(",").map(Number)))
  if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(key(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) if (inFp(x + dx, z + dz) && !dist.has(key(x + dx, z + dz))) { dist.set(key(x + dx, z + dz), d + 1); queue.push([x + dx, z + dz]); }
}

// The faces of a cell at height y that are open to the air: the neighbour is outside the footprint, or its tier is below y.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const t = T(x + dx, z + dz); return t === undefined || t <= y; });

const BODY = "calcite", STONE = "stone_bricks", LIGHT = "smooth_stone", ROOF = "deepslate_tiles", PANE = "glass_pane", SHOP = "glass";

// Storey rows on the skin, from the ground: 2 stallboard, 3-4 shop glass, 5 fascia, 6 string course, 7 sill, 8-9 upper
// glazing, 10 lintel, 11 string course, 12 attic sill, 13 parapet. A 4-tier cell's top row is its cornice (y 2 shop, y 3 parapet).
const WINDOW_ROWS = new Set([3, 4, 8, 9]);
const rowBlock = (y, t, pier) => {
  if (y === 2) return t === 4 ? (pier ? STONE : SHOP) : STONE;
  if (y === 3 || y === 4) return pier ? STONE : SHOP;
  if (y === 5) return BODY;
  if (y === 6) return LIGHT;
  if (y === 7) return BODY;
  if (y === 8 || y === 9) return pier ? STONE : PANE;
  if (y === 10) return BODY;
  if (y === 11) return LIGHT;
  if (y === 12) return BODY;
  return LIGHT;
};

const g = new Voxels([W, H, D]);
const windows = [];                                  // [x, y, z, inward dx, inward dz] for each glazed skin cell
for (const [x, z] of [...tier.keys()].map((k) => k.split(",").map(Number))) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y <= 1) { g.set(x, y, z, STONE); continue; }                       // plinth and base course
    const ex = exposed(x, z, y);
    if (y === t - 1) {                                                     // top row: parapet on the skin, roof inside
      g.set(x, y, z, ex.length ? LIGHT : ROOF);
      continue;
    }
    if (!ex.length) { g.set(x, y, z, BODY); continue; }                    // solid core, no interior rooms
    const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
    if (xFace && zFace) { g.set(x, y, z, STONE); continue; }               // corner pilasters
    const along = xFace ? z : x;
    const pier = along % 3 === 0;
    const block = rowBlock(y, t, pier);
    g.set(x, y, z, block);
    if (block === PANE || block === SHOP) {
      const [dx, dz] = ex[0];
      windows.push([x, y, z, -dx, -dz]);
    }
  }
}

// The air gap behind each window: one block inside the skin, where that cell is itself solid mass with a window row.
// Glowstone sits in some of them, warm behind the glass.
let lamp = 0;
for (const [x, y, z, ix, iz] of windows) {
  const bx = x + ix, bz = z + iz;
  if (!inFp(bx, bz) || (dist.get(key(bx, bz)) ?? 0) < 2) continue;
  const tb = T(bx, bz);
  if (tb < 7 || y >= tb - 1 || !WINDOW_ROWS.has(y) || exposed(bx, bz, y).length) continue;
  g.set(bx, y, bz, "air");
  if ((y === 8 && (bx + bz) % 3 === 0) || (y === 3 && (bx * 2 + bz) % 5 === 0)) { g.set(bx, y, bz, "glowstone"); lamp++; }
}

// The entrance: a dark oak door on the outside face of an upper-tier cell nearest the middle of the block, with a stone
// lintel above. Its facing is the outward normal, so the hinge side reads from the street.
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const doorCand = [...tier.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => T(x, z) >= 7 && exposed(x, z, 2).some(([dx, dz]) => T(x + dx, z + dz) === undefined && !(dx === 0 && dz === 0)))
  .sort((a, b) => Math.abs(a[1] - 11) - Math.abs(b[1] - 11));
const door = doorCand[0];
if (door) {
  const [x, z] = door;
  const [dx, dz] = exposed(x, z, 2).find(([dx, dz]) => T(x + dx, z + dz) === undefined);
  const st = { facing: FACING[dx + "," + dz], hinge: "left", open: "false", powered: "false" };
  g.set(x, 2, z, "dark_oak_door", { ...st, half: "lower" });
  g.set(x, 3, z, "dark_oak_door", { ...st, half: "upper" });
  g.set(x, 4, z, STONE);
}

// Roof plant on the roofs of the upper tiers: a solid plant box with a half-slab cap, on a sparse grid.
for (const [x, z] of [...tier.keys()].map((k) => k.split(",").map(Number))) {
  const t = T(x, z);
  if (t < 12 || exposed(x, z, t - 1).length) continue;
  if ((x * 5 + z * 7) % 13 === 0) { g.set(x, t, z, BODY); g.set(x, t + 1, z, STONE, { type: "bottom" }); }
}

const info = g.save(OUT);
console.log(`built ${OUT}: ${info.blocks} blocks, palette ${info.palette}, windows ${windows.length}, lamps ${lamp}, door ${door ? door.join(",") : "none"}`);
