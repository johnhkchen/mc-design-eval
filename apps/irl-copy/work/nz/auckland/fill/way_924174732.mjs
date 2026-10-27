// Precinct Apartments: a 30-storey glass-and-concrete apartment tower on a podium, Auckland CBD, c. 2000.
// Massing follows the lidar roof: each footprint cell's roof is median-smoothed, then snapped to a few
// storey-multiple tiers (podium 20/28, wings 56/84, shoulders 108/116, tower 120). Every tier's storeys are
// counted down from its own top, so each slab stands on the solid core or facade below it. The core is solid
// and each cell has a one-block air gap behind the facade, so there are no rooms and nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SRC = `${DIR}/way_924174732.cells.json`;
const OUT = `${DIR}/way_924174732.nbt`;

const W = 53, D = 37, H = 132;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const TIERS = [20, 28, 56, 84, 108, 116, 120];

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const key = (x, z) => `${x},${z}`;
const roofRaw = new Map(raw.map(([x, z, , r]) => [key(x, z), r]));
const cellAt = (x, z) => cells.get(key(x, z));
const cells = new Map();

// Median of the roof over the footprint's 3x3 neighbourhood, then the snapped tier.
const tierOf = (r) => (r <= 24 ? 20 : r <= 32 ? 28 : r <= 70 ? 56 : r <= 100 ? 84 : r <= 110 ? 108 : r <= 115 ? 116 : 120);
for (const [x, z, g] of raw) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = roofRaw.get(key(x + dx, z + dz)); if (r !== undefined) vals.push(r);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  cells.set(key(x, z), { x, z, g, T: Math.max(tierOf(med), g + 4) });
}

// Directions where row y of cell c faces open air: no neighbour, or a neighbour whose roof is below y.
function opens(c, y) {
  const out = [];
  for (const [dx, dz] of DIRS) { const n = cellAt(c.x + dx, c.z + dz); if (!n || n.T <= y) out.push([dx, dz]); }
  return out;
}
const isPer = (c, y) => y >= c.g && y < c.T && opens(c, y).length > 0;
// Interior cell next to a facade at row y: the air gap behind the glass.
const isGap = (c, y) => !isPer(c, y) && DIRS.some(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return n && isPer(n, y); });

// Entrance: two doors on the north facade, the first pair of north-face cells at the tower's base.
const northFace = [...cells.values()].filter((c) => !cellAt(c.x, c.z - 1) && c.T >= 100);
const doorZ = Math.min(...northFace.map((c) => c.z));
const doorX = (() => {
  const xs = northFace.filter((c) => c.z === doorZ).map((c) => c.x).sort((a, b) => a - b);
  for (const x of xs) if (xs.includes(x + 1) && x >= 14) return x;
  return xs[Math.floor(xs.length / 2)];
})();
const isDoor = (c) => c.z === doorZ && (c.x === doorX || c.x === doorX + 1);
const isCanopy = (c) => c.z === doorZ && c.x >= doorX - 1 && c.x <= doorX + 2;

const podium = (c) => c.T <= 28;

// Facade block for a perimeter cell in a glass row: corners are piers, every fourth bay a mullion.
function facade(c, ex) {
  if (ex.length >= 2) return ["white_concrete"];
  const bay = ex[0][0] !== 0 ? c.z : c.x;
  return bay % 4 === 0 ? ["gray_concrete"] : ["light_blue_stained_glass"];
}

// Block at (x, y, z) for the cell's storey rows, or null for air.
function rowBlock(c, y) {
  const { x, z, g, T } = c;
  const per = isPer(c, y), ex = per ? opens(c, y) : null, gap = !per && isGap(c, y);
  if (y === g) return per ? ["polished_andesite"] : ["smooth_stone"];                // base course
  if (y === T - 1) return per ? ["white_concrete"] : [podium(c) ? "moss_block" : "light_gray_concrete"]; // parapet / roof deck
  if (y === g + 3) {                                                                // ground-storey fascia / entrance canopy
    if (per && isCanopy(c) && ex.some(([, dz]) => dz === -1)) return ["black_concrete"];
    return ["smooth_stone"];
  }
  if (y === g + 1 || y === g + 2) {                                                 // shopfront / lobby
    if (per) {
      if (isDoor(c)) return ["iron_door", { facing: "north", half: y === g + 1 ? "lower" : "upper", hinge: x === doorX ? "left" : "right", open: "false", powered: "false" }];
      if (ex.length >= 2) return ["black_concrete"];
      const bay = ex[0][0] !== 0 ? z : x;
      return bay % 3 === 0 ? ["black_concrete"] : ["glass"];
    }
    if (gap && x % 4 === 1) return ["lantern", { hanging: "false", waterlogged: "false" }];
    return gap ? null : ["stone"];
  }
  if ((T - y) % 4 === 0) return per ? ["white_concrete"] : ["smooth_stone"];         // floor slab / spandrel
  if (per) return facade(c, ex);
  if (gap && (T - y) % 4 === 3 && (x * 31 + y * 17 + z * 13) % 8 === 0) return ["glowstone"]; // a lit room behind the glass
  return gap ? null : ["stone"];
}

const v = new Voxels([W, H, D]);
for (const c of cells.values()) {
  for (let y = 0; y < c.g; y++) v.set(c.x, y, c.z, "stone_bricks");                 // foundation under the ground
  for (let y = c.g; y < c.T; y++) {
    const r = rowBlock(c, y);
    if (r) v.set(c.x, y, c.z, r[0], r[1]);
  }
  // Roof plant on the shoulders and tower, and a roof garden on the podium.
  if (c.T >= 108 && !isPer(c, c.T - 1) && c.x % 5 === 2 && c.z % 5 === 2) {
    v.set(c.x, c.T, c.z, "light_gray_concrete"); v.set(c.x, c.T + 1, c.z, "light_gray_concrete");
  }
  if (podium(c) && !isPer(c, c.T - 1) && (c.x * 7 + c.z * 5) % 11 === 0) {
    v.set(c.x, c.T, c.z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
  }
}

// Lightning rod on the tower, at the top cell nearest the centre of the tallest tier.
const top = [...cells.values()].filter((c) => c.T === 120 && !isPer(c, 119));
const cx = top.reduce((s, c) => s + c.x, 0) / top.length, cz = top.reduce((s, c) => s + c.z, 0) / top.length;
const rod = top.reduce((best, c) => ((c.x - cx) ** 2 + (c.z - cz) ** 2 < (best.x - cx) ** 2 + (best.z - cz) ** 2 ? c : best));
for (let y = 120; y < 123; y++) v.set(rod.x, y, rod.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = v.save(OUT);
console.log(`saved ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries; door at x ${doorX}-${doorX + 1}, z ${doorZ}`);
