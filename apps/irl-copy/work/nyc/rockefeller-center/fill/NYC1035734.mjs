// 527 Madison Avenue, 1985 commercial and office building: a granite-based Postmodern office tower, about 32 storeys
// (97 blocks from the lidar, about 108 m), stepping down through the lidar's tiers to a 27-block podium on the north
// street and 36- and 45-block wings on the east. Footprint 41 x 27 (x across, low z = the north street frontage).
// Lidar roofs snap to clean tiers (multiples of 3, so every storey line sits on one 3-block grid from y 0), with a
// majority pass against single-cell noise. Each built column is solid in its base (y 0-2, polished granite with a
// belt course) and then floor slabs every 3 blocks, so every tier stands on the one below. Exterior cells are the
// perimeter of each tier: 3-block storeys of grey curtain-wall glass in two rows under a spandrel row, with granite
// piers every 3 cells. Interiors are air behind the glass with the floor slabs, a few glowstone lamps on the floor
// slab behind some panes. The ground storey is a shopfront with granite pilasters and a dark-oak entrance on the
// north street, lit by a hanging lantern. Roofs are paved terraces with parapets and a mechanical box on the wings;
// the tower's crown has a granite cap and four standing lanterns on its parapet corners.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035734.cells.json`, "utf8"));
const X = 41, Y = 109, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Clean tier heights: the lidar roof snapped to the nearest tier (all multiples of 3).
const TIERS = [3, 12, 15, 27, 36, 45, 60, 78, 96];
const nearest = (h) => TIERS.reduce((a, t) => (Math.abs(t - h) < Math.abs(a - h) ? t : a));

// A cell is built when its lidar roof rises at least 2 blocks above its ground; the rest is open ground (paved).
const built = (x, z) => inFoot(x, z) && cell.get(`${x},${z}`).roof >= cell.get(`${x},${z}`).ground + 2;
const raw = new Map();
for (const [k, { roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (built(x, z)) raw.set(k, nearest(roof));
}

// Majority pass: a cell whose 8 neighbours mostly sit on another tier (6 or more) takes that tier.
const tierMap = new Map(raw);
for (const [k, t] of raw) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!dx && !dz) continue;
    const v = raw.get(`${x + dx},${z + dz}`);
    if (v !== undefined) votes.set(v, (votes.get(v) || 0) + 1);
  }
  let best = t, count = 0;
  for (const [v, c] of votes) if (c > count) { best = v; count = c; }
  if (best !== t && count >= 6) tierMap.set(k, best);
}

const T = (x, z) => tierMap.get(`${x},${z}`) ?? 0;          // built height of the column (0 = none)
const stands = (x, z, y) => T(x, z) > y;                       // a block of the building at this height
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];               // N, S, W, E (outward)
const outs = (x, z, y) => DIRS.filter(([dx, dz]) => !stands(x + dx, z + dz, y));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Blocks
const BASE = "polished_granite", BELT = "smooth_stone", SPAND = "light_gray_concrete", GLASS = "gray_stained_glass";
const CAP = "polished_granite", TERRACE = "smooth_stone", PAVE = "stone_bricks", LAMP = "glowstone";
const ENTRANCE = { x: 12, z: 0 };                                // north street door, on the 27-block podium
const DOOR = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([X, Y, Z]);

// Open ground: pave the cell at its ground line, fill below it so nothing floats on a slope.
for (const [k, { ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (built(x, z)) continue;
  const top = Math.max(ground, 1) - 1;
  for (let y = 0; y < top; y++) g.set(x, y, z, PAVE);
  g.set(x, top, z, BELT);
}

// Built columns: base, storeys and the top cap; exterior cells dressed, interiors left as air with floor slabs.
for (const [k] of tierMap) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const o = outs(x, z, y);
    const ring = o.length > 0;
    if (y === t - 1) { g.set(x, y, z, t >= 96 ? CAP : TERRACE); continue; }   // roof surface
    if (y < 3) { g.set(x, y, z, ring && y === 2 ? BELT : BASE); continue; }   // base course
    if (y % 3 === 0) { g.set(x, y, z, y === 3 && ring ? BASE : SPAND); continue; } // floor slab / spandrel, sign band at the shopfront
    if (!ring) continue;                                                       // interior: air behind the glass
    const onPier = o.some(([dx, dz]) => ((dx ? z : x) % 3) === 0);
    if (y < 6) {                                                               // shopfront: granite piers, glass between
      if (k === `${ENTRANCE.x},${ENTRANCE.z}` && o.some(([dx, dz]) => dz === -1)) {
        if (y === 3) g.set(x, y, z, "dark_oak_door", { ...DOOR, half: "lower" });
        if (y === 4) g.set(x, y, z, "dark_oak_door", { ...DOOR, half: "upper" });
        if (y === 5) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      g.set(x, y, z, onPier ? BASE : GLASS);
      continue;
    }
    g.set(x, y, z, onPier ? BASE : GLASS);
    // Warm light: a glowstone on the floor slab behind some panes (bottom window row only).
    if (!onPier && y % 3 === 1 && hash(x, y, z) % 9 === 0) {
      const [dx, dz] = o[0];
      const ix = x - dx, iz = z - dz;
      if (stands(ix, iz, y) && outs(ix, iz, y).length === 0) g.set(ix, y, iz, LAMP);
    }
  }
}

// Setbacks: where a tier's exposed face starts above a lower neighbour, the storey under its floor slab is solid, so
// no floor hangs over the air of the hollow interior.
for (const [k] of tierMap) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  for (let y = 4; y < t; y++) {
    if (!outs(x, z, y).length || outs(x, z, y - 1).length) continue;
    for (const yy of [y - 1, y - 2]) if (yy >= 3 && !g.get(x, yy, z)) g.set(x, yy, z, SPAND);
  }
}

// Parapets on the exposed edge of every roof, so each tier ends in a clean line.
for (const [k] of tierMap) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  if (outs(x, z, t - 1).length > 0) g.set(x, t, z, BASE);
}

// Roof plant: one 2 x 2 mechanical box (light grey, iron louvres on top) on each wing and podium terrace, away from edges.
for (const t of [27, 36, 45, 60]) {
  let placed = false;
  for (const [k] of tierMap) {
    if (placed) break;
    const [x, z] = k.split(",").map(Number);
    const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => [x + dx, z + dz]);
    if (!block.every(([bx, bz]) => T(bx, bz) === t && outs(bx, bz, t - 1).length === 0)) continue;
    for (const [bx, bz] of block) {
      g.set(bx, t, bz, SPAND); g.set(bx, t + 1, bz, SPAND); g.set(bx, t + 2, bz, "iron_bars");
    }
    placed = true;
  }
}

// Crown: four standing lanterns on the tower's parapet corners.
const crown = [...tierMap].map(([k]) => k.split(",").map(Number)).filter(([x, z]) => T(x, z) === 96 && outs(x, z, 95).length === 2);
for (const [x, z] of crown) g.set(x, 97, z, "lantern", { hanging: "false", waterlogged: "false" });

// Floating check: every exterior block rests on something below it.
let floating = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  if (outs(x, z, y).length) { floating++; if (floating <= 30) console.log("float", x, y, z, g.get(x, y, z).block, T(x, z)); }
}
console.log(`built cells ${tierMap.size}, tiers ${[...new Set(tierMap.values())].sort((a, b) => a - b).join(",")}, floating exterior blocks ${floating}`);

console.log(g.save(`${DIR}/NYC1035734.nbt`));
