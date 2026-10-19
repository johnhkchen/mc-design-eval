// 44 West 47th Street (NYC1034346): a 2009 Midtown glass office tower on a granite base. Lidar gives a 137-block
// shaft with a 128-block setback ring, a 26-block podium on the north and south ends and a 41-block wing on the west.
// Each footprint cell is a column from y 0 up to its tier's top, so every block stands on the one below. Floors are
// slabs at every third row; the facade is spandrel, mullioned glass and a shopfront at street level; the interior is air.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const here = (f) => fileURLToPath(new URL(f, import.meta.url));
const cells = JSON.parse(readFileSync(here("./NYC1034346.cells.json"), "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });

// A cell whose lidar roof is no higher than its ground is open paving: nothing stands on it.
const open = (c) => c.roof <= c.ground + 3;
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
// Lidar noise is smoothed (5x5 median over building cells) and snapped to four flat tiers, each on a storey line
// (top = 3n + 2, so the roof is a floor slab's row). 26 podium, 41 wing, 128 setback ring, 137 tower shaft.
const tierOf = (r) => (r < 33 ? 26 : r < 100 ? 41 : r < 132.5 ? 128 : 137);
const top = new Map();                       // "x,z" -> blocks at y < top (1 = open paving)
for (const [k, c] of cell) {
  if (open(c)) { top.set(k, 1); continue; }
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const n = cell.get(key(x + dx, z + dz)); if (n && !open(n)) near.push(n.roof);
  }
  top.set(k, tierOf(median(near)));
}
const topAt = (x, z) => top.get(key(x, z)) ?? 0;   // outside the footprint is ground
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Street level: a lobby bay on the north frontage (z 0), doors in its middle two cells, a canopy over it.
const lobby = (x) => x >= 14 && x <= 21;
const door = (x, z, y) => z === 0 && (x === 16 || x === 17) && (y === 1 || y === 2);
const pane = (x, y, z) => {
  const h = (x * 7 + z * 13 + Math.floor(y / 3) * 5) % 11;
  return h === 0 ? "cyan_stained_glass" : h === 5 ? "gray_stained_glass" : "light_blue_stained_glass";
};

const g = new Voxels([36, 150, 55]);
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  const t = top.get(k);
  g.set(x, 0, z, "polished_granite");       // foundation and base course; open paving is granite too
  if (t <= 1) continue;

  for (let y = 1; y <= t - 2; y++) {
    const ex = DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);   // faces that look out at this height
    const outer = ex.length > 0;
    if (door(x, z, y)) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (z <= 1 && lobby(x) && y === 3) { g.set(x, y, z, "polished_granite"); continue; }   // canopy over the entrance
    if (y % 3 === 1) {                      // floor slab; on the outside it is the base course or a spandrel
      g.set(x, y, z, !outer ? "smooth_stone" : y === 1 ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (!outer) continue;                   // air behind the glass
    const onZWall = ex.some(([, dz]) => dz !== 0);
    const mullion = onZWall ? x % 3 === 0 : z % 3 === 0;
    if (y <= 3) {                           // shopfront: glass bays between granite piers
      g.set(x, y, z, mullion ? "polished_granite" : "light_blue_stained_glass");
      continue;
    }
    if (mullion) { g.set(x, y, z, "gray_concrete"); continue; }
    g.set(x, y, z, pane(x, y, z));
    // A few lit offices: glowstone in the air behind a pane, one storey in twenty-three windows.
    const [dx, dz] = ex[0];
    if (y % 3 === 2 && ((x * 131 + z * 197 + Math.floor(y / 3) * 277) % 23) === 0 && top.has(key(x - dx, z - dz))) {
      g.set(x - dx, y, z - dz, "glowstone");
    }
  }

  // Roof at t-1, cornice or parapet at t on the edge. The podium is a planted terrace.
  const edge = DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) < t);
  const surface = edge ? "light_gray_concrete" : t === 26 && (x + z) % 3 === 0 ? "moss_block" : "gray_concrete";
  g.set(x, t - 1, z, surface);
  if (edge) g.set(x, t, z, "smooth_stone");
}

// Mechanical penthouse on the tower roof: a solid plant box, glazed on its outer walls, capped.
for (const [k] of top) {
  const [x, z] = k.split(",").map(Number);
  if (top.get(k) !== 137 || x < 14 || x > 23 || z < 20 || z > 28) continue;
  const rim = x === 14 || x === 23 || z === 20 || z === 28;
  g.set(x, 137, z, "light_gray_concrete");
  g.set(x, 138, z, rim ? pane(x, 138, z) : "gray_concrete");
  g.set(x, 139, z, "light_gray_concrete");
}

const stats = g.save(here("./NYC1034346.nbt"));
console.log(`NYC1034346.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
