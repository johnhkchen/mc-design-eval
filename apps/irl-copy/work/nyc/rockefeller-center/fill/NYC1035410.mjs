// 585 Fifth Avenue, 1930: a narrow Deco-era mixed-use slab. Eight storeys on a granite base, a shopfront
// at street level (residential entrance at x13), pale quartz piers and fields, blue-grey Deco glass in
// 2-wide bays with a 1-block air gap behind each pane, a cornice on each facade, and a setback penthouse.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035410.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

// Massing: lidar roofs are noisy (18..26), so each zone takes its median snapped to a flat tier. Zones: the
// z=0 front row, the west wing, the main slab (z1-2), the rear setback (z3-4), and the east end (no lidar roof).
const TIERS = [21, 24, 26];
const snap = (v) => (v === 0 ? 0 : TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const zoneOf = (x, z) => (z === 0 ? "front" : x >= 25 ? "east" : x < 4 ? "west" : z <= 2 ? "main" : "rear");
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const zoneRoofs = {};
for (const [x, z, , r] of cells) { const k = zoneOf(x, z); (zoneRoofs[k] ??= []).push(r); }
const tier = Object.fromEntries(Object.entries(zoneRoofs).map(([k, a]) => [k, snap(median(a))]));
const roof = (x, z) => (raw.get(`${x},${z}`)?.r ? tier[zoneOf(x, z)] : 0);
const ground = (x, z) => raw.get(`${x},${z}`)?.g ?? 0;

// Storeys: the ground storey is y1-2 (shopfront) under a transom at y3; upper floor lines at y = 4, 7, .., 25
// with window pairs between them. The top row of every column is a cornice or cap.
const WIN = new Set([5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24]);
const SHOP = (y) => y === 1 || y === 2;
const DOOR_X = 13;
const isTop = (x, y, z) => y === roof(x, z) - 1;
const glassFront = (x, y) => x % 3 !== 0 && (WIN.has(y) || SHOP(y)) && y < roof(x, 0) && !isTop(x, y, 0);
const glassRear = (x, y) => x % 3 !== 0 && WIN.has(y) && y < roof(x, 4) && !isTop(x, y, 4);
const lit = (x, y) => (x + y) % 4 === 0 && WIN.has(y) && !isTop(x, y, 0) && y < roof(x, 0);

const g = new Voxels([28, 38, 5]);
const door = (y) => ({ facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });

// Front facade (z=0) and rear facade (z=4), then the interior (z=1-3): air behind glass, floors and walls solid.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const R = roof(x, z); if (!R) continue;
  const gr = ground(x, z);
  for (let y = 0; y < R; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    const top = isTop(x, y, z);
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (z === 0) {
      if (top) g.set(x, y, z, "quartz_slab", { type: "top", waterlogged: "false" });
      else if (x % 3 === 0) g.set(x, y, z, "quartz_bricks");
      else if (x === DOOR_X && (y === 1 || y === 2)) g.set(x, y, z, "dark_oak_door", door(y));
      else if (SHOP(y)) g.set(x, y, z, "glass");
      else if (y === 3) g.set(x, y, z, "polished_granite");
      else if (glassFront(x, y)) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (z === 4) {
      if (top) g.set(x, y, z, "quartz_slab", { type: "top", waterlogged: "false" });
      else if (x % 3 === 0) g.set(x, y, z, "quartz_bricks");
      else if (glassRear(x, y)) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }
    // z = 1..3: the air gap behind front glass (z1) and rear glass (z3), a solid core and floors between
    if (z === 1 && (glassFront(x, y) || (x === DOOR_X && SHOP(y)))) { g.set(x, y, z, "air"); continue; }
    if (z === 3 && glassRear(x, y)) { g.set(x, y, z, "air"); continue; }
    if (z === 1 && lit(x, y)) { g.set(x, y, z, "glowstone"); continue; }
    g.set(x, y, z, "smooth_quartz");
  }
}
// Entrance lantern in the residential hall behind the door, hanging from the transom.
g.set(DOOR_X, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Setback penthouse on the main slab (z1-2), standing on its tier: two glass storeys and a slab cap, topping the front parapet.
const pt = tier.main;
for (let x = 17; x <= 21; x++) {
  for (let y = pt; y < pt + 2; y++) g.set(x, y, 1, x % 3 === 0 ? "quartz_bricks" : "light_blue_stained_glass");
  for (let y = pt; y < pt + 2; y++) g.set(x, y, 2, "smooth_quartz");
  for (let z = 1; z <= 2; z++) g.set(x, pt + 2, z, "quartz_slab", { type: "top", waterlogged: "false" });
}
// Roof equipment on the rear setback, and a planter on the west wing's roof terrace.
for (let x = 9; x <= 11; x++) for (let z = 3; z <= 4; z++) { g.set(x, 24, z, "stone_bricks"); g.set(x, 25, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); }
for (let x = 1; x <= 2; x++) for (let z = 2; z <= 3; z++) g.set(x, 21, z, "azalea_leaves", { distance: "1", persistent: "true", waterlogged: "false" });

const stats = g.save(`${dir}/NYC1035410.nbt`);
console.log(JSON.stringify({ tiers: tier, ...stats }));
