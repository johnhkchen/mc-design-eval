// Mason Bros (GridAKL), Auckland: a 1980s-style concrete-frame office block read from the lidar roof record.
// A 4-storey glazed body on a stone base course, a 5th storey stepped in off the edge, a low ledge on the north
// edge, and a narrow lift/stair core rising to 75 blocks (~63 m) that the lidar shows as the tallest mass.
// Storeys are 4 blocks: floor slab on row 0, glass in rows 1-2, spandrel in row 3. Every floor row is solid across
// the footprint, so each storey stands on the one below; interiors are air behind the glass, with a few glowstone lights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const rows = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_608167747.cells.json", "utf8"));
const cells = rows.map(([x, z, ground, roof]) => ({ x, z, ground, roof }));

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map((c) => [key(c.x, c.z), c]));
const inFp = (x, z) => byXZ.has(key(x, z));
const DIRS = [[1, 0, "x"], [-1, 0, "x"], [0, 1, "z"], [0, -1, "z"]];
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// The lidar roof, median-smoothed over the 3x3 footprint neighbourhood so noise becomes flat tiers (the core is read raw:
// its narrow top would vanish under a median).
function smoothRoof(x, z) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = byXZ.get(key(x + dx, z + dz)); if (c) v.push(c.roof); }
  return median(v);
}
const outside = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));

// Tier tops (roof row count): 12 low ledge, 16 body (4 storeys), 20 set-back 5th storey, 60 and 75 the core.
const tierOf = new Map();
const coreOf = new Set();
for (const c of cells) {
  const k = key(c.x, c.z);
  if (c.roof >= 40) { coreOf.add(k); tierOf.set(k, c.roof >= 64 ? 75 : 60); continue; }
  const m = smoothRoof(c.x, c.z);
  tierOf.set(k, m <= 13 ? 12 : m <= 16 ? 16 : 20);
}
// two majority passes over the body's tiers, so the ledge and the set-back come out as clean blocks, not a checker;
// then the set-back is kept off the perimeter, so the 5th storey steps in from every outer edge
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of cells) {
    const k = key(c.x, c.z);
    if (coreOf.has(k)) continue;
    const votes = new Map();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const nk = key(c.x + dx, c.z + dz);
      if (!tierOf.has(nk) || coreOf.has(nk)) continue;
      const t = tierOf.get(nk); votes.set(t, (votes.get(t) || 0) + 1);
    }
    let best = tierOf.get(k), n = votes.get(best) || 0;
    for (const [t, cnt] of votes) if (cnt > n) { best = t; n = cnt; }
    next.set(k, best);
  }
  for (const [k, t] of next) tierOf.set(k, t);
}
for (const c of cells) if (!coreOf.has(key(c.x, c.z)) && tierOf.get(key(c.x, c.z)) === 20 && outside(c.x, c.z)) tierOf.set(key(c.x, c.z), 16);
const tier = (x, z) => tierOf.get(key(x, z));
const isCore = (x, z) => coreOf.has(key(x, z));
const structural = (x, z) => x % 6 === 3 && z % 6 === 3;   // interior columns on a 6-block grid

// A wall face exists where a neighbour is off the footprint or stands below this row.
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || tier(x + dx, z + dz) <= y);
const exposed = (x, z, y) => exposedDirs(x, z, y).length > 0;

// Entrance: the middle of the north edge (lowest ledge), a door in a 3-wide glass shopfront under a black lintel.
const zMin = Math.min(...cells.map((c) => c.z));
const northXs = cells.filter((c) => c.z === zMin).map((c) => c.x).sort((a, b) => a - b);
const doorX = northXs[Math.floor(northXs.length / 2)];
const doorFacing = { facing: "north", hinge: "left", open: "false", powered: "false" };

// The core's roof plant mast: the core cell nearest its centroid.
const coreTop = cells.filter((c) => isCore(c.x, c.z) && tier(c.x, c.z) === 75);
const cx = coreTop.reduce((s, c) => s + c.x, 0) / coreTop.length, cz = coreTop.reduce((s, c) => s + c.z, 0) / coreTop.length;
const mast = coreTop.reduce((best, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz) ? c : best));

const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([56, 88, 89]);

for (const c of cells) {
  const { x, z, ground } = c;
  const top = tier(x, z);
  const out = outside(x, z);

  for (let y = 0; y < ground; y++) g.set(x, y, z, "white_concrete");      // foundation from y 0 up to the ground

  for (let y = ground; y < top; y++) {
    if (y === top - 1) { g.set(x, y, z, "gray_concrete"); continue; }      // roof membrane: the top layer of the tier
    if (y % 4 === 0) {                                                      // floor slab per storey, solid across
      g.set(x, y, z, out ? (y === 0 ? "stone_bricks" : "light_gray_concrete") : "white_concrete");
      continue;
    }
    if (!exposed(x, z, y)) {                                                // interior: air, except core and columns
      if (isCore(x, z) || structural(x, z)) g.set(x, y, z, "white_concrete");
      continue;
    }
    if (out && z === zMin && Math.abs(x - doorX) <= 1 && y <= 2) {         // the entrance
      if (x === doorX) g.set(x, y, z, "dark_oak_door", { ...doorFacing, half: y === 1 ? "lower" : "upper" });
      else g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if (out && z === zMin && Math.abs(x - doorX) <= 1 && y === 3) { g.set(x, y, z, "black_concrete"); continue; }
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel / head
    const dirs = exposedDirs(x, z, y);
    const onX = dirs.some((d) => d[2] === "x"), onZ = dirs.some((d) => d[2] === "z");
    const along = onZ ? x : z;                                              // along the wall the face sits on
    if ((onX && onZ) || along % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }  // mullions and corners
    g.set(x, y, z, "light_blue_stained_glass");
    // warm light: a glowstone in the interior cell behind some panes
    if (hash(x, y, z) % 9 === 0) {
      const inner = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([nx, nz]) =>
        inFp(nx, nz) && !exposed(nx, nz, y) && !isCore(nx, nz) && !structural(nx, nz));
      if (inner) g.set(inner[0], y, inner[1], "glowstone");
    }
  }

  // parapet on the outer edge, and roof plant on the flat roofs of the body and the set-back
  if (out && top > 0) g.set(x, top, z, "light_gray_concrete");
  if ((top === 16 || top === 20) && !out && !DIRS.some(([dx, dz]) => tier(x + dx, z + dz) !== top)
      && x % 9 === 4 && z % 9 === 4) {
    g.set(x, top, z, "iron_block");
    g.set(x, top + 1, z, "iron_block");
  }
}

g.set(mast.x, 75, mast.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_608167747.nbt");
console.log(JSON.stringify(out));
