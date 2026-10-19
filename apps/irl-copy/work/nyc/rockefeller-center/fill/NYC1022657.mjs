// 123 West 45 Street, 1930: a six-storey brick mixed-use walk-up on a 6 x 22 mid-block lot. The street front is the
// z=21 end (granite shopfront and a residential door under a canopy, then framed windows with calcite storey courses);
// the z=0 end is the rear yard with the same window grid. The side walls are party walls, blank brick with the courses.
// The lidar roof is smoothed (zeros take the neighbours' median, then a 3x3 median) and snapped to flat tiers of 6, 9,
// 12, 15 or 18 blocks, so the rear wings step down from the six-storey front. Every storey stands on a floor slab, and
// each shell cell (a footprint edge or a face onto a lower tier) is solid brick from its base to its top, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022657.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 6, Z = 22, H = 30;
const FRONT = Z - 1, BACK = 0;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const has = (x, z) => raw.has(key(x, z));
const med = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const near = (m, x, z) => { const v = []; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (m.has(key(x + dx, z + dz))) v.push(m.get(key(x + dx, z + dz))); return v; };

// Lidar noise: a zero roof is a missed return, so it takes the neighbours' median; then a 3x3 median smooths the rest.
const fixed = new Map();
for (const [k, r] of raw) fixed.set(k, r > 0 ? r : Math.round(med(near(raw, ...k.split(",").map(Number)).filter((v) => v > 0))));
const smooth = new Map();
for (const [k] of fixed) smooth.set(k, Math.round(med(near(fixed, ...k.split(",").map(Number)))));
const tierOf = (v) => (v >= 16 ? 18 : v >= 14 ? 15 : v >= 11 ? 12 : v >= 9 ? 9 : 6);
const top = (x, z) => tierOf(smooth.get(key(x, z)));

// A shell cell is a footprint edge or a face onto open air or a lower tier; those columns are solid brick.
const shell = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, b]) => !has(a, b) || top(a, b) < top(x, z));
const face = (z) => (z === FRONT ? "front" : z === BACK ? "back" : null);

const g = new Voxels([X, H, Z]);
for (const [x, z, ground] of cells) {
  const T = top(x, z), isShell = shell(x, z), f = face(z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");           // foundation: solid from y 0 up to the ground
  for (let y = ground; y < T; y++) {
    const rel = y - ground, k = Math.floor(rel / 3), r = rel % 3;     // storeys are 3 blocks: course, two window rows
    if (rel === 0) {                                                  // base course; the residential door sits in it
      if (isShell && f === "front" && x === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    if (isShell) {
      if (r === 0) g.set(x, y, z, "calcite");                         // storey line
      else if (f === "front" && k === 0) {                            // shopfront: granite piers, glass, door, canopy
        if (x === 0 || x === X - 1) g.set(x, y, z, "polished_granite");
        else if (r === 1 && x === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (r === 1) g.set(x, y, z, "glass");
        else g.set(x, y, z, "green_concrete");                        // awning over the shopfront and the door
      } else if (f) {                                                 // framed window grid on the street and rear faces
        if (x === 0 || x === X - 1) g.set(x, y, z, "bricks");         // piers
        else if (x === 1 || x === X - 2) g.set(x, y, z, "calcite");   // frame jambs
        else g.set(x, y, z, "glass");
      } else if ((x === 0 || x === X - 1) && z <= 6 && (z - 1) % 3 !== 2) g.set(x, y, z, "glass");   // rear wing sides face the yard
      else g.set(x, y, z, "bricks");                                  // party walls and the step faces
    } else {
      if (y === T - 1) g.set(x, y, z, "smooth_stone");                // roof cover on the open tier
      else if (r === 0 && k >= 1) g.set(x, y, z, "stone");            // floor slab for each storey above the ground
    }
  }
  if (isShell) g.set(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // coping
}

// Warm light behind some of the street glass (interior air at z = Z-2), and a lantern in the shop.
for (const [k, x, block] of [[1, 2, "glowstone"], [2, 3, "shroomlight"], [3, 2, "glowstone"], [4, 3, "glowstone"], [5, 2, "glowstone"]]) g.set(x, 3 * k + 1, Z - 2, block);
g.set(3, 2, Z - 2, "lantern", { hanging: "true" });

// Rooftop bulkhead on the first 2 x 1 pair of open cells on the same 12-block tier (the stair and lift housing).
const pair = cells.find(([x, z]) => has(x + 1, z) && !shell(x, z) && !shell(x + 1, z) && top(x, z) === 12 && top(x + 1, z) === 12);
if (pair) {
  const [x, z] = pair;
  for (const xx of [x, x + 1]) {
    for (let y = 12; y < 14; y++) g.set(xx, y, z, "bricks");
    g.set(xx, 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = g.save(`${DIR}/NYC1022657.nbt`);
console.log(JSON.stringify({ ...out, storeysFront: top(2, FRONT) / 3, pent: pair ?? null }));
