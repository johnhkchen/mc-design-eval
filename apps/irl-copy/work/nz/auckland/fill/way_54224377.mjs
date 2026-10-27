// The Chancery Car Park (way 54224377), central Auckland: a reinforced-concrete multi-storey car park of the 1970s-80s.
// Exposed light-grey concrete frame (fins and floor slabs), white spandrel bands on every storey, open-deck
// parking behind iron-bar screens, a smooth-stone base course on a stone-brick plinth, shopfronts with lit glass on
// the ground floor, and a stepped massing that follows the lidar roof: 5 storeys on the main body, a 6-7 storey
// podium and an 8-storey stair/lift tower at the south-east corner. Storey lines sit on a global 4-block grid, so
// each tier stands on what is below it; the plinth is solid from y 0 up to the first storey slab above the ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_54224377.cells.json", "utf8"));
const g = new Voxels([126, 47, 77]);

const PLINTH = "stone_bricks", BASE = "smooth_stone", CONC = "light_gray_concrete", SPAN = "white_concrete";
const SCREEN = "iron_bars", SHOPFRAME = "black_concrete", GLASS = "glass_pane", LINTEL = "smooth_stone", CAP = "smooth_stone_slab";
const DOOR_FACING = { "-1,0": "east", "1,0": "west", "0,-1": "south", "0,1": "north" };   // door faces inward, away from outward normal

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { gr, r }]));
const inside = (x, z) => raw.has(key(x, z));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// 1. Smooth the lidar roof with a 5 x 5 footprint median, snap it to the storey grid (slabs at 1, 5, 9 ... 33)
// 2. The first storey slab above the cell's ground (S0): the plinth is solid below it, so nothing floats on a slope
// 3. The roof is never below the first slab (a cell whose roof is at S0 is just the roof slab on its plinth)
const info = [];
for (const [k, { gr, r }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = raw.get(key(x + dx, z + dz)); if (n) near.push(n.r); }
  const m = median(near);
  const S0 = 1 + 4 * (Math.floor((gr - 1) / 4) + 1);
  const T = Math.max(1 + 4 * Math.round((m - 1) / 4), S0);
  info.push({ x, z, gr, S0, T });
}
const topOf = new Map(info.map((c) => [key(c.x, c.z), c.T]));
// a facade cell: on the footprint edge, or beside a lower tier (its face is outside the building there)
const outward = (x, z) => (!inside(x - 1, z) ? [-1, 0] : !inside(x + 1, z) ? [1, 0] : !inside(x, z - 1) ? [0, -1] : !inside(x, z + 1) ? [0, 1] : null);
for (const c of info) {
  const { x, z, T } = c;
  c.out = outward(x, z);
  const lower = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inside(x + dx, z + dz) && topOf.get(key(x + dx, z + dz)) < T);
  c.wall = !!c.out || lower;
}

// 4. Build each column: plinth, storey slabs, facade, interior columns, parapet, rooftop plant
for (const c of info) {
  const { x, z, S0, T, wall, out } = c;
  // the plinth: stone brick, with concrete pilasters on the facade so the solid base is not one flat wall
  const bay = (((x + z) % 8) + 8) % 8;
  for (let y = 0; y < S0; y++) g.set(x, y, z, y === S0 - 1 ? BASE : wall && bay === 0 ? CONC : PLINTH);
  for (let y = S0; y <= T; y += 4) g.set(x, y, z, CONC);     // a floor slab per storey, and the roof slab at T

  for (let S = S0; S + 4 <= T; S += 4) {
    const j = (S - S0) / 4, ground = j === 0;
    if (!wall) continue;
    const p = (((x + z) % 8) + 8) % 8;
    const shop = ground && out && (Math.floor(x / 16) + Math.floor(z / 16)) % 3 === 0;
    const isDoor = ground && out && p === 3 && Math.floor((x + z) / 8) % 4 === 1;
    if (isDoor) {
      const facing = DOOR_FACING[out.join(",")];
      g.set(x, S + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, S + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, S + 3, z, LINTEL);
    } else if (shop) {
      // shopfront: lit glass with black frames, a fascia band over; mullions on p === 0
      if (p === 0) { for (let y = S + 1; y <= S + 3; y++) g.set(x, y, z, SHOPFRAME); }
      else {
        g.set(x, S + 1, z, (x + z) % 16 === 4 ? "glowstone" : GLASS);
        g.set(x, S + 2, z, GLASS);
        g.set(x, S + 3, z, SHOPFRAME);
      }
    } else if (p === 0) {
      // concrete fin, full storey height
      for (let y = S + 1; y <= S + 3; y++) g.set(x, y, z, CONC);
    } else {
      // open deck behind an iron-bar screen; a spandrel band at each storey line; a warm lantern in some bays
      g.set(x, S + 1, z, SCREEN);
      g.set(x, S + 2, z, SCREEN);
      g.set(x, S + 3, z, SPAN);
      if (!ground && p === 4 && (Math.floor(x / 8) + Math.floor(z / 8) + j) % 3 === 0)
        g.set(x, S + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  if (wall) {
    g.set(x, T + 1, z, SPAN);                                   // parapet
    if (((x + z) % 8 + 8) % 8 === 0) g.set(x, T + 2, z, CAP, { type: "bottom", waterlogged: "false" });
  } else if (T >= 25 && x % 16 >= 5 && x % 16 <= 6 && z % 16 >= 5 && z % 16 <= 6) {
    // stair and lift cores on the upper tiers: a solid box with a lantern on the roof
    for (let y = T + 1; y <= T + 3; y++) g.set(x, y, z, CONC);
    g.set(x, T + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  if (!wall && x % 8 === 4 && z % 8 === 4)                      // interior columns on a 8-block bay grid
    for (let y = S0 + 1; y < T; y++) g.set(x, y, z, CONC);
}

const file = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_54224377.nbt";
console.log(g.save(file));
