// 300 New Jersey Ave NW (DC58916): a 1980s Capitol Hill office block, light stone-clad with tinted glass bays.
// Massing follows the lidar roof per cell: a 3x3 majority pass, then snapped to two flat tiers (14 = 4 storeys on
// a podium, 17 = a 5-storey tower), so the lidar noise becomes clean setbacks. Storeys are 3 blocks, floors on y = 1, 4, 7...
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC58916.cells.json`, "utf8"));   // [x, z, ground, roof]
const H = 22;                                                                  // tallest tier 17, plus roof plant
const g = new Voxels([36, H, 29]);

const cell = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { x, z, gr, r }]));
const at = (x, z) => cell.get(`${x},${z}`);
const TIERS = [14, 17];
const nearestTier = (r) => TIERS.reduce((b, t) => (Math.abs(t - r) < Math.abs(b - r) ? t : b), TIERS[0]);

// Tier per cell: snap the lidar roof, then two majority passes over the 3x3 neighbourhood so the tiers come out flat.
for (const c of cell.values()) c.tier = nearestTier(c.r);
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of cell.values()) {
    const votes = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = at(c.x + dx, c.z + dz); if (n) votes.set(n.tier, (votes.get(n.tier) || 0) + 1);
    }
    let best = c.tier, bestN = votes.get(c.tier) || 0;
    for (const [t, n] of votes) if (n > bestN) { best = t; bestN = n; }
    next.set(`${c.x},${c.z}`, best);
  }
  for (const c of cell.values()) c.tier = next.get(`${c.x},${c.z}`);
}

// A facade cell has an open side (outside the footprint) or a neighbour with a lower top: its walls show.
const facade = (c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
  const n = at(c.x + dx, c.z + dz); return !n || n.tier < c.tier;
});
for (const c of cell.values()) { c.top = c.tier; c.edge = facade(c); }

const winBlock = (x, y, z, ground) => {
  if (y < ground + 3) return "light_blue_stained_glass";                       // shopfront glazing
  return (x * 31 + y * 17 + z * 13) % 23 === 0 ? "glowstone" : "light_blue_stained_glass";   // a few lit windows
};

for (const c of cell.values()) {
  const { x, z, gr, top, edge } = c;
  for (let y = 0; y < top; y++) {
    if (y < gr) { g.set(x, y, z, edge ? "polished_granite" : "stone_bricks"); continue; }   // foundation
    if (y === top - 1) { g.set(x, y, z, edge ? "smooth_quartz" : "gray_concrete"); continue; }   // parapet / roof
    if (!edge) { if (y === 0 || (y - 1) % 3 === 0) g.set(x, y, z, "smooth_quartz"); continue; }   // floor slab, else air gap
    if (y === gr) g.set(x, y, z, "polished_granite");                          // base course
    else if ((y - 1) % 3 === 0) g.set(x, y, z, "smooth_quartz");               // storey line
    else if ((x + z) % 4 === 0) g.set(x, y, z, "quartz_pillar");               // mullion
    else g.set(x, y, z, winBlock(x, y, z, gr));
  }
}

// Entrance on the north face: granite piers, a dark awning band, an open doorway with a threshold.
for (let x = 20; x <= 23; x++) {
  const c = at(x, 0); if (!c) continue;
  g.set(x, c.gr + 3, 0, "black_concrete");                                    // awning band over the door
}
for (const x of [20, 23]) {
  const c = at(x, 0); if (!c) continue;
  for (let y = c.gr; y <= c.gr + 2; y++) g.set(x, y, 0, "polished_granite");
}
for (const x of [21, 22]) {
  const c = at(x, 0); if (!c) continue;
  for (let z = 0; z <= 1; z++) for (let y = c.gr + 1; y <= c.gr + 2; y++) g.set(x, y, z, "air");
  g.set(x, c.gr, 0, "smooth_quartz");                                         // threshold
}

// Roof plant on the interior of each tier: a few boxes on the 17 tower, a few on the 14 podium.
for (const c of cell.values()) {
  if (c.edge) continue;
  if (c.top === 17 && (c.x * 7 + c.z * 5) % 17 === 0) {
    g.set(c.x, 17, c.z, "light_gray_concrete"); g.set(c.x, 18, c.z, "light_gray_concrete");
  } else if (c.top === 14 && (c.x * 3 + c.z * 7) % 19 === 0) {
    g.set(c.x, 14, c.z, "light_gray_concrete");
  }
}

const out = g.save(`${dir}/DC58916.nbt`);
console.log(JSON.stringify(out));
