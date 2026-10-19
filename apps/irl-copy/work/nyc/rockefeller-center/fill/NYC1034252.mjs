// NYC1034252: 556 Fifth Avenue, a 1927 limestone-and-granite office block with a stepped roof. Lidar roofs fall in three
// tiers (30, 34, 36 blocks, 37 at the top corner); each cell takes its tier after a 3x3 majority pass, so the tiers read as
// flat setbacks instead of lidar speckle. A penthouse stands 3 blocks over the centre of the 36 tier. Storeys are 3 blocks:
// spandrel (stone bricks) under each window, glass, then a calcite head. Piers (calcite) run every third cell, the ground
// floor has a granite base and a dark fascia over shopfront glass, and the Fifth Avenue entrance is a recessed vestibule
// with a canopy and hanging lanterns. Warm glowstone sits behind some panes. The roof is smooth stone with a stone brick
// parapet; the court is a grade-level light well.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${HERE}/NYC1034252.cells.json`, "utf8"));
const W = 28, D = 13, Y = 49;
const TIER_H = [30, 34, 36];                                    // roof height of each tier
const COURT = -2, NONE = -1;

// Tier per cell from the lidar roof: 0 = 30 tier (<=32), 1 = 34 tier (33-34), 2 = 36 tier (>=35). The court has no roof.
const tier = Array.from({ length: W }, () => Array(D).fill(NONE));
for (const [x, z, , r] of cells) tier[x][z] = r === 0 ? COURT : r <= 32 ? 0 : r <= 34 ? 1 : 2;

// 3x3 majority pass over the footprint: a cell takes a tier when at least 5 of its 9 neighbours (itself included) agree.
const smooth = tier.map((c) => c.slice());
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (tier[x][z] < 0) continue;
  const votes = [0, 0, 0];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const t = tier[x + dx]?.[z + dz];
    if (t >= 0) votes[t]++;
  }
  const best = votes.indexOf(Math.max(...votes));
  if (votes[best] >= 5) smooth[x][z] = best;
}

// Roof height per cell: the tier, plus a 3-block penthouse on the centre of the 36 tier.
const h = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const t = smooth[x][z];
  if (t < 0) continue;
  h[x][z] = TIER_H[t];
  if (t === 2 && x >= 10 && x <= 16 && z >= 5 && z <= 7) h[x][z] = 39;
}

// Recessed Fifth Avenue vestibule: cells (0, z 5..7) are open below the canopy; the door sits at z 6.
const isVoid = (x, y, z) => x === 0 && z >= 5 && z <= 7 && y <= 2;
const H = (x, z) => (x < 0 || x >= W || z < 0 || z >= D ? 0 : h[x][z]);
const DIRS = [[-1, 0, "x"], [1, 0, "x"], [0, -1, "z"], [0, 1, "z"]];
// A face is exposed at height y when the neighbour is outside, a court, lower than y, or open vestibule.
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return isVoid(nx, y, nz) || H(nx, nz) <= y;
});

const g = new Voxels([W, Y, D]);
const parapets = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
const pane = (axis) => (axis === "x"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const top = h[x][z];
  for (let y = 0; y < top; y++) {
    if (isVoid(x, y, z)) { if (y === 0) g.set(x, y, z, "smooth_stone"); continue; }
    const ex = exposed(x, y, z);
    if (y === top - 1) {
      if (ex.length) { g.set(x, y, z, "stone_brick_wall", { up: "true" }); parapets.add(key(x, y, z)); }
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!ex.length) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); continue; }   // interior: one floor slab per storey, air between
    const k = Math.floor(y / 3), r = y % 3;
    const pier = ex.some(([, , axis]) => (axis === "x" ? z : x) % 3 === 0);
    const axis = ex.some(([, , a]) => a === "x") ? "x" : "z";
    const along = axis === "x" ? z : x;
    if (pier) {
      g.set(x, y, z, "calcite");
    } else if (k === 0) {
      if (r === 0) g.set(x, y, z, "polished_granite");
      else if (r === 1) g.set(x, y, z, "light_blue_stained_glass_pane", pane(axis));
      else g.set(x, y, z, "dark_oak_planks");
    } else if (r === 0) g.set(x, y, z, "stone_bricks");
    else if (r === 1) {
      g.set(x, y, z, "light_blue_stained_glass_pane", pane(axis));
      // Warm light behind some panes: the cell one step inward, if it is inside the building and open.
      const [dx, dz] = ex.find(([, , a]) => a === axis);
      const ix = x - dx, iz = z - dz;
      const inside = H(ix, iz) > y && !isVoid(ix, y, iz) && exposed(ix, y, iz).length === 0;
      if (inside && (along + 2 * k) % 5 === 0) g.set(ix, y, iz, "glowstone");
    } else g.set(x, y, z, "smooth_quartz");
  }
}

// Parapet walls connect to neighbouring parapets on the same roof.
for (const k of parapets) {
  const [x, y, z] = k.split(",").map(Number);
  const arm = (dx, dz) => (parapets.has(key(x + dx, y, z + dz)) ? "low" : "none");
  g.set(x, y, z, "stone_brick_wall", { north: arm(0, -1), south: arm(0, 1), east: arm(1, 0), west: arm(-1, 0), up: "true", waterlogged: "false" });
}

// Entrance: door on the vestibule's back cell, lintel above, canopy over the recess, lanterns hanging either side.
const door = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });
g.set(0, 0, 6, "dark_oak_door", door("lower"));
g.set(0, 1, 6, "dark_oak_door", door("upper"));
g.set(0, 2, 6, "smooth_quartz");
for (const z of [5, 6, 7]) g.set(0, 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
for (const z of [5, 7]) g.set(0, 2, z, "lantern", { hanging: "true", waterlogged: "false" });

// Two chimney stacks on the interior of the 36 tier.
let chimneys = 0;
for (const [x, z] of [[21, 4], [5, 9], [18, 9], [12, 11]]) {
  if (chimneys >= 2 || H(x, z) !== 36 || exposed(x, 35, z).length) continue;
  g.set(x, 36, z, "bricks");
  g.set(x, 37, z, "bricks");
  chimneys++;
}

const stats = g.save(`${HERE}/NYC1034252.nbt`);
const hs = {};
for (const row of h) for (const v of row) if (v) hs[v] = (hs[v] || 0) + 1;
console.log(JSON.stringify({ blocks: stats.blocks, palette: stats.palette, heights: hs, chimneys }));
