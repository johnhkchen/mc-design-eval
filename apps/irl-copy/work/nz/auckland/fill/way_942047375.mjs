// The Strand (OSM way 942047375): a 1980s-90s commercial block over shops. Precast white concrete frame on a
// granite base, tinted glass in a pilaster grid, a recessed shop entrance under a granite lintel, and a stepped
// tower (6 -> 8 -> 10 -> 12 storeys) rising from the lidar roof record. Hollow: air behind the glass, a floor slab
// per storey, every column solid from y 0 to its deck, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_942047375.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_942047375.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 83, D = 50, H = 61;

const k2 = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { x, z, g, r }]));
const inside = (x, z) => foot.has(k2(x, z));
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// 1. Smooth the lidar roof (5x5 mean over footprint cells), quantise to whole storeys (4 blocks each).
const storeysOf = (h) => (h < 28 ? 6 : h < 31 ? 8 : h < 34 ? 10 : 12);
const avg = new Map();
for (const c of foot.values()) {
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = foot.get(k2(c.x + dx, c.z + dz)); if (o) { s += o.r; n++; }
  }
  avg.set(k2(c.x, c.z), s / n);
}
const tier0 = new Map([...avg].map(([k, h]) => [k, storeysOf(h)]));
// 2. One majority pass (3x3) so single cells do not poke up as spikes.
const tier = new Map();
for (const c of foot.values()) {
  const k = k2(c.x, c.z), count = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const t = tier0.get(k2(c.x + dx, c.z + dz)); if (t !== undefined) count.set(t, (count.get(t) || 0) + 1);
  }
  let best = tier0.get(k), bn = count.get(best) || 0;
  for (const [t, n] of count) if (n > bn) { best = t; bn = n; }
  tier.set(k, best);
}
const deckOf = (x, z) => 1 + 4 * tier.get(k2(x, z));   // y of the roof deck: the top block of the column

// A face is exposed where the neighbour is outside the footprint or stands lower than this block.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || y > deckOf(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const hash = (x, y, z) => ((x * 31 + z * 17 + y * 7) % 11 + 11) % 11;
const doorState = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

for (const c of foot.values()) {
  const { x, z } = c, deck = deckOf(x, z), nS = tier.get(k2(x, z));
  const perimeter = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz));

  // foundation: solid from y 0 under every cell (the lowest ground is y 0; the 1-block steps sit on it)
  g.set(x, 0, z, "stone_bricks");

  // the entrance: one perimeter cell in 15 on a single street-facing side, on the ground floor
  const single = exposed(x, z, 1);
  const ent = perimeter && single.length === 1 && (single[0][0] === 0) && ((x + z) % 15 === 7) ? single[0] : null;

  for (let y = 1; y <= deck; y++) {
    if (y === deck) { g.set(x, y, z, "gray_concrete"); continue; }   // roof deck
    const k = Math.floor((y - 1) / 4), j = (y - 1) % 4, ground = k === 0;
    const E = exposed(x, z, y);

    if (E.length === 0) {                                             // interior: a floor slab per storey, air between
      if (j === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (ent && ground) {                                              // recessed entrance: door, lantern, granite lintel
      if (j === 0) { g.set(x, y, z, "dark_oak_door", doorState(ent[2], "lower")); continue; }
      if (j === 1) { g.set(x, y, z, "dark_oak_door", doorState(ent[2], "upper")); continue; }
      if (j === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      if (j === 3) { g.set(x, y, z, "polished_granite"); continue; }
    }

    // the bay index along the face: pilasters every third cell, both faces at a corner
    const corner = E.length > 1;
    const t = E[0][0] !== 0 ? z : x;
    const pilaster = corner || t % 3 === 0;
    const glassBlock = ground ? "glass" : nS >= 10 ? "cyan_stained_glass" : "light_blue_stained_glass";

    let b;
    if (j === 0) b = ground ? "polished_granite" : "white_concrete";      // spandrel / base course
    else if (j === 3) b = ground ? "smooth_stone" : "white_concrete";     // head band / fascia
    else if (pilaster) b = ground ? "polished_granite" : "light_gray_concrete";
    else if (j === 1 && hash(x, y, z) === 0) b = "glowstone";             // warm light behind the glass
    else if (j === 1 && hash(x, y, z) === 6) b = "shroomlight";
    else b = glassBlock;
    g.set(x, y, z, b);
  }

  // parapet on the outside edge; roof plant on the open deck of the tier
  if (perimeter) g.set(x, deck + 1, z, "white_concrete");
  const open = DIRS.every(([dx, dz]) => inside(x + dx, z + dz) && deckOf(x + dx, z + dz) <= deck);
  if (open && x % 8 >= 3 && x % 8 <= 4 && z % 8 >= 3 && z % 8 <= 4) {
    for (let y = deck + 1; y <= deck + 2; y++) g.set(x, y, z, "iron_block");
  }
}

const stats = g.save(OUT);
const tiers = {};
for (const t of tier.values()) tiers[t] = (tiers[t] || 0) + 1;
console.log(JSON.stringify({ cells: foot.size, tierCellCounts: tiers, ...stats }));
