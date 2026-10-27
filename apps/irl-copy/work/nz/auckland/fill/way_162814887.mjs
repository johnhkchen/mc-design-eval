// United Auckland (way 162814887), Eden Terrace below Maungawhau: a 1980s-style mid-rise office block, a concrete frame
// with precast light-grey bands and tinted blue-glass curtain walls, a stone plinth, and a stepped massing from the lidar.
// Lidar roof heights run 5-34 over the footprint: they are median-smoothed and quantised to 4-block storey tiers (1-7
// storeys, tops at y 10..34), so a 7-storey core stands on a 6-storey ring, a 3-storey wing and a 2-storey podium, every
// column solid from y 0 up to its roof. Ground-floor datum is y 6 on the whole footprint: stone from y 0 up to the grade
// (and to the datum), so the downhill side shows its extra base. Storeys are a floor slab every 4 blocks (y 6+4k) with
// three rows of glazing above; facade cells are the outer ring of the footprint (glass panes with concrete mullions every
// third column, connected to their neighbours), interiors are air. A double entrance with a stone hood on the z 0 face,
// glowstone at the bottom row behind some windows, and a plant room on the roof core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814887.cells.json", "utf8"));
const W = 24, D = 29, H = 47;
const DATUM = 6;                                   // ground-floor slab, the same on every cell
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => cell.has(`${x},${z}`);

// storey count from the lidar roof (surface = 7 + 4N - ish), then a 3x3 median over the footprint to clean the noise
const raw = (x, z) => Math.min(7, Math.max(1, Math.round((cell.get(`${x},${z}`).roof - 7) / 4)));
const N = new Map();
for (const [x, z] of [...cell.keys()].map(k => k.split(",").map(Number))) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) vals.push(raw(x + dx, z + dz));
  vals.sort((a, b) => a - b);
  N.set(`${x},${z}`, vals[Math.floor(vals.length / 2)]);
}
const nOf = (x, z) => (inFp(x, z) ? N.get(`${x},${z}`) : 0);
const top = (x, z) => DATUM + 4 * nOf(x, z);       // parapet block y; roof slab sits at top - 1
// a cell has an exposed face on storey k when a neighbour is outside the footprint or has no storey k
const facade = (x, z, k) => nOf(x, z) > k && DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || nOf(x + dx, z + dz) <= k);
// the neighbour on the inside (the air gap behind the glass) for a facade cell on storey k
const inward = (x, z, k) => DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inFp(a, b) && nOf(a, b) > k && !facade(a, b, k));

const SHOP = "cyan_stained_glass_pane", GLASS = "light_blue_stained_glass_pane";
const CONNECT = new Set(["stone_bricks", "white_concrete", "light_gray_concrete", "smooth_stone", "stone_brick_slab", SHOP, GLASS]);

const g = new Voxels([W, H, D]);
const glowCells = [];
const entrance = new Set(["4,0", "5,0"]);          // the double door on the z 0 face (the street side of the lidar footprint)

for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  const n = nOf(x, z), t = top(x, z);

  // plinth: stone from y 0 to the datum (over the grade on the uphill side), then the ground-floor slab
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, DATUM, z, "smooth_stone");

  for (let k = 0; k < n; k++) {
    const base = DATUM + 4 * k;                    // storey slab at base, glazing base+1..base+3
    if (k > 0) g.set(x, base, z, "light_gray_concrete");
    const isTop = k === n - 1;
    for (let r = 1; r <= 3; r++) {
      const y = base + r;
      if (isTop && r === 3) break;                 // roof row, set below
      if (!facade(x, z, k)) continue;             // interior: air
      if (k === 0 && entrance.has(`${x},${z}`) && r <= 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: r === 1 ? "lower" : "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
        continue;
      }
      if (k === 0 && entrance.has(`${x},${z}`) && r === 3) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
      if ((x + z) % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // mullion
      g.set(x, y, z, k === 0 ? SHOP : GLASS, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      if (r === 1) {
        const inn = inward(x, z, k);
        if (inn && (x * 5 + z * 3 + k * 2) % 7 === 0) glowCells.push([inn[0], base + 1, inn[1]]);
      }
    }
  }

  // roof slab over the whole tier (cornice on the edge, concrete inside), and a parapet on the exposed roof edge
  const roofY = t - 1;
  g.set(x, roofY, z, facade(x, z, n - 1) ? "stone_bricks" : "light_gray_concrete");
  if (facade(x, z, n - 1)) g.set(x, t, z, "stone_bricks");
}

// the warm light behind glass: glowstone on the storey floor (on the slab, so nothing hangs)
for (const [x, y, z] of glowCells) g.set(x, y, z, "glowstone");

// plant room on the 7-storey core: two-high boxes standing on the roof slab, set in the interior
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (nOf(x, z) !== 7 || facade(x, z, 6)) continue;
  if ((x % 4) === 1 && (z % 3) === 1) { g.set(x, 34, z, "light_gray_concrete"); g.set(x, 35, z, "stone_bricks"); }
}

// connect the panes to their solid neighbours (a pane arm only toward solid walls, mullions or other panes)
const side = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) {
  const b = g.get(x, y, z);
  if (!b || !(b.block.endsWith("_stained_glass_pane"))) continue;
  const st = {};
  for (const [dir, [dx, dz]] of Object.entries(side)) {
    const nb = g.get(x + dx, y, z + dz);
    st[dir] = nb && CONNECT.has(nb.block.replace("minecraft:", "")) ? "true" : "false";
  }
  g.set(x, y, z, b.block.replace("minecraft:", ""), { ...st, waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814887.nbt";
const info = g.save(out);
console.log(`saved ${out}: ${info.blocks} blocks, palette ${info.palette}`);
