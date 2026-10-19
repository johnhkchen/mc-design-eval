// 553 Fifth Avenue, 1955: a mid-century Midtown office slab in pale stone and glass. Footprint 36 x 33; x runs across
// the building (the Fifth Avenue frontage is the x = 0 face, along the avenue's z), low z is the street face to the north.
// Massing: each cell's lidar roof is median-smoothed over its 3 x 3 neighbours and snapped to a tier (30, 36, 45, 51,
// 58 blocks), so the lidar noise becomes flat setbacks: a 10-storey wing on the west and north edges, a 12-storey
// shoulder, a 15-storey step and a 17-storey tower on the east half. A mechanical penthouse with louvres sits on the
// tower. Every column is solid from y 0 to its top, so no tier floats; the foundation is stone brick up to each cell's
// ground. Facade depth is measured from the open air at each height: depth 0 is the skin (spandrels, pale piers and
// glass panes), depth 1 is air behind the glass (or solid behind a spandrel), depth 2 and deeper is the solid core
// with floor slabs. The street floor is a granite plinth, shop glass and a fascia; the upper storeys are 3 blocks each
// (spandrel course, then two rows of glass between calcite piers). A double-door entrance with a canopy sits
// on the Fifth Avenue face, and glowstone glows behind a sparse set of panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035401.cells.json`, "utf8"));
const X = 36, Y = 62, Z = 33;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const PENT_TOP = 61, PENT_BASE = 58, TOWER_TOP = 58;

const key = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, roof] of cells) { ground.set(key(x, z), gr); lidar.set(key(x, z), roof); }
const inFoot = (x, z) => ground.has(key(x, z));

// Lidar roof, median of the 3 x 3 neighbourhood inside the footprint, snapped to the nearest tier.
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(lidar.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tier = (r) => (r < 33 ? 30 : r < 40 ? 36 : r < 47 ? 45 : r < 53 ? 51 : TOWER_TOP);
const top = new Map();
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); top.set(k, tier(median(x, z))); }
const topAt = (x, z) => top.get(key(x, z)) ?? 0;

// Cells built at height y that have open air beside them at that height; depth counts inward from there.
const depthAt = (y) => {
  const d = new Map(), q = [];
  for (const k of top.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (top.get(k) <= y) continue;
    if (N4.some(([dx, dz]) => !inFoot(x + dx, z + dz) || topAt(x + dx, z + dz) <= y)) { d.set(k, 0); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], dv = d.get(key(x, z));
    for (const [dx, dz] of N4) {
      const nx = x + dx, nz = z + dz, nk = key(nx, nz);
      if (!inFoot(nx, nz) || topAt(nx, nz) <= y || d.has(nk)) continue;
      d.set(nk, dv + 1); q.push([nx, nz]);
    }
  }
  return d;
};

// The penthouse: the tower's core, five or more cells in from its edge at the tower's top layer.
const dTop = depthAt(TOWER_TOP - 1);
for (const [k, dd] of dTop) if (top.get(k) === TOWER_TOP && dd >= 5) top.set(k, PENT_TOP);
const depth = Array.from({ length: Y }, (_, y) => depthAt(y));

// Outward normal of a skin cell: the first open side, as [dx, dz].
const normalAt = (x, y, z) => N4.find(([dx, dz]) => !inFoot(x + dx, z + dz) || topAt(x + dx, z + dz) <= y);

// Glass panes connect along the face they sit in: a face with normal along x runs along z, and the reverse.
const pane = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const LIT = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number);
  const G = ground.get(k), T = top.get(k), pent = T === PENT_TOP;
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  for (let y = G; y < T; y++) {
    const d = depth[y].get(k) ?? 1;
    const n = d === 0 ? normalAt(x, y, z) : null;
    const u = n && n[0] !== 0 ? z : x;                     // position along the face, for piers and mullions
    const rel = y - (G + 5);                               // upper storeys start 5 blocks above the street floor
    const street = y < G + 5;
    const lit = LIT(x, y, z);
    let b = null, st;

    if (y === T - 1) {                                     // coping, or roof field behind it
      b = d === 0 ? "smooth_quartz" : pent ? "smooth_quartz" : "stone";
    } else if (d >= 2) {                                   // solid core and floor slabs
      b = pent ? "smooth_quartz" : "smooth_stone";
    } else if (d === 1) {                                  // air behind the skin, unless it is solid behind a spandrel
      if (pent) b = "light_gray_concrete";
      else if (y === G) b = "polished_granite";
      else if (street && y === G + 4) b = "polished_andesite";
      else if (!street && rel % 3 === 0) b = "white_concrete";
      else if (lit) b = "glowstone";
    } else if (pent) {                                     // penthouse louvres
      if (y === PENT_BASE) b = "polished_andesite";
      else if (u % 2 === 0) b = "iron_bars";
      else b = "light_gray_concrete";
    } else if (street) {                                   // shopfront: plinth, glass, fascia
      if (y === G) b = "polished_granite";
      else if (y === G + 4) b = "polished_andesite";
      else if (u % 4 === 0) b = "polished_andesite";
      else { b = "light_blue_stained_glass_pane"; st = pane(n); }
    } else if (rel % 3 === 0) {                            // storey spandrel course
      b = "white_concrete";
    } else if (u % 3 === 0) {                              // pale calcite piers between the windows
      b = "calcite";
    } else {                                               // two rows of glass per storey
      b = "light_blue_stained_glass_pane"; st = pane(n);
    }
    if (b) g.set(x, y, z, b, st);
  }
}

// Entrance on the Fifth Avenue face (x = 0): a double door, hinged at the outer edges, under a canopy.
const doorState = (half, hinge) => ({ facing: "west", half, hinge, open: "false", powered: "false" });
for (const z of [14, 15]) {
  const G = ground.get(key(0, z));
  g.set(0, G, z, "dark_oak_door", doorState("lower", z === 14 ? "left" : "right"));
  g.set(0, G + 1, z, "dark_oak_door", doorState("upper", z === 14 ? "left" : "right"));
}
for (let z = 12; z <= 17; z++) for (let x = 0; x <= 1; x++) {
  if (!inFoot(x, z)) continue;
  g.set(x, ground.get(key(x, z)) + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC1035401.nbt`);
console.log(`built NYC1035401.nbt: ${g.count()} blocks, ${g.palette.length - 1} distinct states`);
