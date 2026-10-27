// Mt Eden / Eden Terrace: a 1930s stripped-Classical commercial block, cream render on a dark stone plinth with red
// terracotta storey lines. Three storeys of 4 blocks on absolute lines (0, 4, 8), so the downhill side shows its
// ground storey and the uphill side is buried one storey. The lidar roof is smoothed into three flat tiers: a 12
// core, an 8 podium and 4 low wings. Upper windows are recessed one block behind the piers, with the glass set one
// block further in and an air gap behind it; the rest is solid volume, no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467357.cells.json", "utf8"));
const SX = 56, SY = 25, SZ = 39;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // outward faces: west, east, north, south
const key = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;

// per footprint cell: ground g, and the smoothed top tier T
const C = new Map();
for (const [x, z, g, r] of cells) {
  let T = r >= 11 ? 12 : r >= 7 ? 8 : 4;
  while (T < g + 2) T += 4;                          // at least a storey above the foundation
  C.set(key(x, z), { g, T });
}
const inside = (x, z) => C.has(key(x, z));
const cell = (x, z) => C.get(key(x, z));

// outward face of a cell (first found), its window test, and whether it is shell (edge or tier boundary)
const faceOf = (x, z) => DIRS.find(([dx, dz]) => !inside(x + dx, z + dz)) ?? null;
const along = (x, z, [dx]) => (dx !== 0 ? z : x);       // position along a facade
const isShell = (x, z) => {
  const { T } = cell(x, z);
  return faceOf(x, z) !== null || DIRS.some(([dx, dz]) => inside(x + dx, z + dz) && cell(x + dx, z + dz).T !== T);
};
const isWindow = (x, z, y) => {                       // a glazed bay on an outward face, storey rows 1-2 of each storey
  if (!inside(x, z)) return false;
  const f = faceOf(x, z); if (!f) return false;
  const { g, T } = cell(x, z);
  if (y < g || y > T - 2) return false;
  return (y % 4) >= 1 && (y % 4) <= 2 && along(x, z, f) % 3 !== 0;
};

// the entrance: a pier-column cell on the lowest ground with a full storey above it
let ent = null;
for (const [k, { g, T }] of C) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z); if (!f || T < 8 || along(x, z, f) % 3 !== 0) continue;
  if (!ent || g < ent.g || (g === ent.g && T > ent.T)) ent = { x, z, g, T, f, a: along(x, z, f) };
}

// recesses: an upper window cell is air, its glass sits one block in (on the cell behind) and a second block in is
// the air gap behind the glass. Only where both inner cells are interior, so the recess never breaks the shell.
const recess = new Set();                               // "x,y,z" of the air in front of the glass
const glass = new Map();                                // "x,y,z" of the pane -> its facade normal
const gap = new Map();                                  // "x,y,z" of the air gap -> lit?
for (const [k, { T }] of C) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z); if (!f) continue;
  for (let y = 4; y < T - 1; y++) {
    if (!isWindow(x, z, y)) continue;
    const p1 = [x - f[0], z - f[1]], p2 = [x - 2 * f[0], z - 2 * f[1]];
    if (!inside(...p1) || !inside(...p2) || isShell(...p1) || isShell(...p2)) continue;
    recess.add(key3(x, y, z));
    glass.set(key3(p1[0], y, p1[1]), f);
    const lit = ((x * 31 + z * 17 + y * 7) % 4) === 0;
    gap.set(key3(p2[0], y, p2[1]), (gap.get(key3(p2[0], y, p2[1])) ?? false) || lit);
  }
}

const g = new Voxels([SX, SY, SZ]);
// a pane connects along its wall to the neighbouring panes on the same facade
const putPane = (x, y, z, f) => {
  const dirs = f[0] !== 0 ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
  const [a, b] = dirs.map(([dx, dz]) => glass.get(key3(x + dx, y, z + dz))?.join() === f.join());
  const st = f[0] !== 0 ? { north: a, south: b, east: false, west: false } : { north: false, south: false, east: b, west: a };
  g.set(x, y, z, "glass_pane", { ...Object.fromEntries(Object.entries(st).map(([k, v]) => [k, String(v)])), waterlogged: "false" });
};

for (const [k, { g: gr, T }] of C) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z), shell = isShell(x, z), edge = f !== null;
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }      // foundation up to the cell's own ground
    if (recess.has(key3(x, y, z))) continue;                        // the recess in front of a window: air
    if (glass.has(key3(x, y, z))) { putPane(x, y, z, glass.get(key3(x, y, z))); continue; }
    if (gap.has(key3(x, y, z))) { if (gap.get(key3(x, y, z)) && y % 4 === 1) g.set(x, y, z, "glowstone"); continue; }   // the air gap, a lit one on the floor
    if (!shell) { g.set(x, y, z, y === T - 1 ? "stone" : "stone_bricks"); continue; }
    if (y === T - 1) { g.set(x, y, z, "smooth_stone"); continue; }   // cornice over a flat roof
    const s = Math.floor(y / 4), row = y % 4;
    if (edge && ent && x === ent.x && z === ent.z && (y === ent.g || y === ent.g + 1)) {   // the entrance door
      const facing = { "-1,0": "east", "1,0": "west", "0,-1": "south", "0,1": "north" }[f.join(",")];
      g.set(x, y, z, "iron_door", { facing, half: y === ent.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (edge && ent && f[0] === ent.f[0] && f[1] === ent.f[1] && y === ent.g + 2 && Math.abs(along(x, z, f) - ent.a) <= 1) {
      g.set(x, y, z, "black_concrete"); continue;      // the canopy over the door
    }
    if (edge && s === 0 && y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (edge && s === 0 && (row === 1 || row === 2)) {  // shopfront: glass between dark piers
      g.set(x, y, z, along(x, z, f) % 3 === 0 ? "polished_blackstone_bricks" : "glass"); continue;
    }
    if (edge && along(x, z, f) % 3 === 0 && (row === 1 || row === 2)) { g.set(x, y, z, "quartz_pillar"); continue; }   // piers
    if (s >= 1 && row === 0) { g.set(x, y, z, "red_terracotta"); continue; }   // storey lines
    g.set(x, y, z, "smooth_quartz");
  }
  if (edge && T < SY - 1) g.set(x, T, z, "red_terracotta");     // coping on the outer edge of the roof
  // roof plant: iron boxes on the roof of the core and podium
  if (!shell && (x % 7 === 3) && (z % 7 === 3) && T === 12) { g.set(x, T, z, "iron_block"); g.set(x, T + 1, z, "iron_block"); }
  else if (!shell && (x % 9 === 4) && (z % 9 === 4) && T === 8) g.set(x, T, z, "iron_block");
}

const counts = {}; for (const { T } of C.values()) counts[T] = (counts[T] || 0) + 1;
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467357.nbt");
console.log("tiers", counts, "entrance", ent && { x: ent.x, z: ent.z, g: ent.g, face: ent.f }, "recess", recess.size, "glass", glass.size, "gap", gap.size, out);
