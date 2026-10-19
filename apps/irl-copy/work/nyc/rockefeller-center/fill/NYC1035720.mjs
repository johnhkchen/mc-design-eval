// NYC1035720: 12 East 53 Street, NYC individual landmark, Commercial & Office, built 1871.
// Read from the lidar: a C-shaped massing, a 3-storey-wide spine on the east side at 24 blocks (8 storeys),
// wings at 18-21 (6-7 storeys) across the north and south ends, and an open light court on the west side.
// Brick facade on brownstone-style bands, a stone plinth and cornice, a shopfront and a door on the north face,
// cast-iron interior columns, floors per storey, a tar roof with a mechanical penthouse, and lanterns behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035720.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 10, D = 26, H = 36;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor((s.length - 1) / 2)]; };

// Ground per footprint cell, and the lidar roof where it reads as building (under 6 blocks is ground noise).
const ground = new Map(), R = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); if (r >= 6) R.set(key(x, z), r); }

// Lidar voids inside the massing (roof 0 between building cells) take the mean of their neighbours, two passes.
for (let pass = 0; pass < 2; pass++) {
  const fill = [];
  for (const [x, z] of cells) {
    if (R.has(key(x, z))) continue;
    const ns = DIRS.map(([a, b]) => R.get(key(x + a, z + b))).filter((v) => v !== undefined);
    if (ns.length >= 2) fill.push([key(x, z), ns.reduce((p, q) => p + q, 0) / ns.length]);
  }
  for (const [k, v] of fill) R.set(k, v);
}

// Clean flat tiers: round to whole storeys of 3 blocks, then a 3x3 median so each tier is one level.
const Q = new Map([...R].map(([k, r]) => [k, Math.round(r / 3) * 3]));
const T = new Map();
for (const k of Q.keys()) {
  const [x, z] = k.split(",").map(Number), vs = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (Q.has(key(x + a, z + b))) vs.push(Q.get(key(x + a, z + b)));
  T.set(k, med(vs));
}
const bld = (x, z) => T.has(key(x, z));

// Every block, keyed by position, so panes can connect to their neighbours before the volume is written.
const M = new Map();
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const isEdge = (x, z) => DIRS.some(([a, b]) => !bld(x + a, z + b));

for (const [x, z] of cells) {
  const g = ground.get(key(x, z));
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                 // foundation: nothing floats on a slope
  if (!bld(x, z)) continue;

  const top = T.get(key(x, z));
  const perim = isEdge(x, z);
  const exX = !bld(x - 1, z) || !bld(x + 1, z);
  const exZ = !bld(x, z - 1) || !bld(x, z + 1);
  const bay = exX && !exZ ? z : exZ && !exX ? x : x + z;                    // position along the face it stands on
  const pier = bay % 3 === 0;
  const column = x % 3 === 0 && x > 0 && z % 4 === 0;                       // cast-iron interior columns

  for (let y = g; y < top; y++) {
    const band = y % 3;
    if (!perim) {
      if (y === top - 1) put(x, y, z, "blackstone");                        // tar roof deck
      else if (column) put(x, y, z, "iron_block");
      else if (y >= 3 && band === 0) put(x, y, z, "smooth_stone");          // floor slab per storey
      continue;
    }
    if (y >= top - 1) put(x, y, z, "stone_bricks");                         // parapet
    else if (y === top - 2) put(x, y, z, "smooth_stone");                   // cornice
    else if (y === 0) put(x, y, z, "stone_bricks");                         // plinth
    else if (band === 0) put(x, y, z, "brown_terracotta");                  // storey band course
    else if (y < 3) put(x, y, z, pier ? "dark_oak_planks" : "glass_pane");  // shopfront
    else put(x, y, z, pier ? "bricks" : "glass_pane");                      // brick piers, windows between
  }
}

// Entrance on the north face: a door in the shopfront, under the storey band.
const door = (y, half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
if (bld(4, 0)) { put(4, 1, 0, "dark_oak_door", door(1, "lower")); put(4, 2, 0, "dark_oak_door", door(2, "upper")); }

// Lanterns in interior rooms behind some upper windows: the inner neighbour of a window, one block above a floor slab.
for (const [x, z] of cells) {
  if (!bld(x, z) || !isEdge(x, z)) continue;
  const top = T.get(key(x, z));
  const missing = DIRS.filter(([a, b]) => !bld(x + a, z + b));
  if (missing.length !== 1) continue;
  const [a, b] = missing[0], ix = x - a, iz = z - b;
  if (!bld(ix, iz) || isEdge(ix, iz) || (ix % 3 === 0 && ix > 0 && iz % 4 === 0)) continue;
  for (let y = 4; y < top - 2; y += 3) {
    const bay = a !== 0 ? z : x;
    if (bay % 6 !== 1) continue;
    put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// A mechanical penthouse on the north wing's roof.
for (const [x, z] of [[2, 1], [3, 1], [2, 2], [3, 2]]) {
  if (!bld(x, z)) continue;
  const top = T.get(key(x, z));
  put(x, top, z, "iron_block"); put(x, top + 1, z, "iron_block");
}

// Glass panes connect to any block beside them in the same layer (vanilla pane connection, approximated).
for (const [k, v] of M) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (dx, dz) => (M.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  v.state = { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, v] of M) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(`${DIR}/NYC1035720.nbt`);
console.log(JSON.stringify({ built: "NYC1035720", ...out }));
