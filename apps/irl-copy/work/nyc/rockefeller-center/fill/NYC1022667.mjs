// 114 West 47th Street, 1987 Midtown office tower: a polished-granite base on a one-storey shopfront streetwall (the
// 47th Street front, z 0, entered at the middle under a canopy), then a tinted-glass curtain wall with light spandrels and
// polished-andesite mullions stepping back in 3-block storeys to a tar-roofed penthouse and a lit crown on the tallest tier.
// Footprint 43 x 55 (x runs along the street, low z = north = the street front). The lidar roof is smoothed into flat
// tiers: its roof holes (the light-well cells read 0-4) are filled from their tall neighbours, then each cell's roof is a
// median of the 7 x 7 around it, rounded to the 3-block storey line. The envelope is a one-cell ring with air behind every
// pane (a floor slab per storey, nothing else inside), glowstone behind a few windows, and a foundation fill to each ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022667.cells.json`, "utf8"));
const X = 43, Z = 55, H = 116;
const key = (x, z) => `${x},${z}`;

// 1. Roof: fill the light-well holes (roof under 5 with tall neighbours) from the outside in, then smooth.
const at = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const around = (x, z, R) => { const out = []; for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const n = at.get(key(x + dx, z + dz)); if (n) out.push(n); } return out; };
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
// A hole is a cell reading under 5 with mostly tall neighbours (the light well); low wings at the edge stay low.
const hole = new Set();
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  if (c.r < 5 && median(around(x, z, 3).map((n) => n.r)) >= 40) hole.add(k);
}
for (let pass = 0; pass < 12 && hole.size; pass++) {
  const fills = [];
  for (const k of hole) {
    const [x, z] = k.split(",").map(Number);
    const ok = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = key(x + dx, z + dz);
      if (at.has(n) && !hole.has(n) && at.get(n).r >= 5) ok.push(at.get(n).r);
    }
    if (ok.length >= 3) fills.push([k, median(ok)]);
  }
  for (const [k, r] of fills) { at.get(k).r = r; hole.delete(k); }
}
const smoothed = new Map();
for (const [k] of at) {
  const [x, z] = k.split(",").map(Number);
  const near = around(x, z, 3).map((n) => n.r);
  smoothed.set(k, median(near));
}
// Every cell: its roof tier (a 3-block storey line, never under a storey above grade).
for (const [k, c] of at) c.T = Math.max(c.g + 3, 3 * Math.round(smoothed.get(k) / 3));
const MAXT = Math.max(...[...at.values()].map((c) => c.T));

// 2. Neighbours: a side is open when the cell beyond it is outside the footprint or stands below this height.
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const openSides = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const n = at.get(key(x + DIRS[d][0], z + DIRS[d][1]));
  return !n || y >= n.T;
});

const g = new Voxels([X, H, Z]);
const panes = [];
const pane = (x, y, z, block) => { g.set(x, y, z, block); if (block.endsWith("glass_pane")) panes.push([x, y, z]); };

for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone");
  // Storeys: a base (one storey above grade), then curtain-wall storeys of 3 blocks: a slab, then two window rows.
  for (let y = c.g; y < c.T; y++) {
    const sides = openSides(x, z, y);
    const envelope = sides.length > 0;
    const slab = y % 3 === 0;
    if (envelope && y < c.g + 3) {
      if (sides.includes("north") && z === 0) {
        // Shopfront: granite plinth, clear glass with black mullions, the entrance (double doors at x 20-21) under a
        // black canopy band across the transom.
        const door = (x === 20 || x === 21) && y <= c.g + 1;
        if (door) g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === c.g ? "lower" : "upper", hinge: x === 20 ? "left" : "right", open: "false", powered: "false" });
        else if (y === c.g) g.set(x, y, z, "polished_granite");
        else if (y === c.g + 2 && x >= 17 && x <= 24) g.set(x, y, z, "black_concrete");
        else if (x % 4 === 2) g.set(x, y, z, "black_concrete");
        else pane(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "polished_granite");
      }
    } else if (envelope) {
      if (slab) g.set(x, y, z, "light_gray_concrete");
      else if ((sides.some((d) => d === "north" || d === "south") && x % 3 === 0) || (sides.some((d) => d === "east" || d === "west") && z % 3 === 0)) g.set(x, y, z, "polished_andesite");
      else pane(x, y, z, "light_blue_stained_glass_pane");
    } else if (slab) {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
  // Tar roof on every tier, a light parapet on the outer ring, a lit crown on the tallest tier.
  g.set(x, c.T - 1, z, "gray_concrete");
  const outer = openSides(x, z, c.T).some((d) => !at.get(key(x + DIRS[d][0], z + DIRS[d][1])));
  if (outer) g.set(x, c.T, z, "light_gray_concrete");
  if (outer && c.T === MAXT && (x + z) % 6 === 0) g.set(x, c.T, z, "shroomlight");
}

// 3. Mechanical penthouse on the tallest tier, a solid stone box with a light cap, clear of the outer ring.
for (const [k, c] of at) {
  const [x, z] = k.split(",").map(Number);
  if (c.T !== MAXT || x < 14 || x > 28 || z < 16 || z > 30) continue;
  for (let y = c.T; y < c.T + 4; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, c.T + 4, z, "light_gray_concrete");
}

// 4. Warm light in a few windows: glowstone one cell behind the glass, in the air gap.
panes.forEach(([x, y, z], i) => {
  if ((x * 31 + y * 17 + z * 13) % 19 !== 0) return;
  const c = at.get(key(x, z));
  const out = openSides(x, z, y)[0];
  if (!out) return;
  const [dx, dz] = DIRS[out].map((v) => -v);
  if (g.get(x + dx, y, z + dz) === null && at.has(key(x + dx, z + dz))) g.set(x + dx, y, z + dz, "glowstone");
});

// 5. Panes connect to the glass, mullions and shopfront around them (the same plane), not to air.
for (const [x, y, z] of panes) {
  const has = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  const state = (block) => ({ east: String(has(1, 0)), west: String(has(-1, 0)), north: String(has(0, -1)), south: String(has(0, 1)), waterlogged: "false" });
  const cur = g.get(x, y, z);
  if (cur) g.set(x, y, z, cur.block, state(cur.block));
}

const { blocks, palette } = g.save(`${DIR}/NYC1022667.nbt`);
console.log(`NYC1022667: ${blocks} blocks, ${palette} palette entries, roof tiers to y ${MAXT}`);
