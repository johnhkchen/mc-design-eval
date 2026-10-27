import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Car Handling Building: a 1930s reinforced-concrete commercial block. White plastered concrete, stone plinth and
// quoins, a shopfront ground floor, ribbon windows of light-blue glass between dark mullions, a flat roof with a
// stone parapet and plant. Five storeys of 4 blocks (floor slab at y = 1 + 4s), lower wings step down in whole
// storeys. Every floor slab is solid across the footprint and rests on the perimeter walls and a grid of piers, so
// nothing hangs; the interior is air behind the glass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_810720944.cells.json`, "utf8"));
const [W, H, D] = [116, 34, 143];

const key = (x, z) => x * 1000 + z;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => foot.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // east, west, south (+z), north (-z)

// Storey tier from the lidar roof height (roof / 4, clamped to 1..5), smoothed by a 3x3 vote so the roofs read as flat tiers
const raw = new Map([...foot].map(([k, c]) => [k, Math.min(5, Math.max(1, Math.round(c.roof / 4)))]));
const tier = new Map();
for (const [k, t0] of raw) {
  const x = Math.floor(k / 1000), z = k % 1000, votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const t = raw.get(key(x + dx, z + dz));
    if (t !== undefined) votes.set(t, (votes.get(t) || 0) + 1);
  }
  let best = t0;
  for (const [t, v] of votes) if (v > (votes.get(best) || 0)) best = t;
  tier.set(k, best);
}

const top = (x, z) => { const t = tier.get(key(x, z)); return t === undefined ? -1 : 1 + 4 * t; }; // roof slab row
const edgeFaces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));                 // faces onto the outside
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) < y);             // faces with nothing at y
const paneState = ([dx]) => (dx
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });

const g = new Voxels([W, H, D]);
const glowCandidates = [];

for (const k of foot.keys()) {
  const x = Math.floor(k / 1000), z = k % 1000, t = top(x, z);
  g.set(x, 0, z, "stone_bricks");                                  // plinth under the whole footprint
  for (let y = 1; y <= t; y++) {
    const ex = exposed(x, z, y);
    if (!ex.length) {                                              // interior: floor slabs, roof, piers, then air
      if (y === t || (y - 1) % 4 === 0) g.set(x, y, z, "light_gray_concrete");
      else if (x % 8 === 3 && z % 8 === 3) g.set(x, y, z, "white_concrete");
      continue;
    }
    const row = (y - 1) % 4, s = Math.floor((y - 1) / 4), [dx] = ex[0], along = dx ? z : x;
    let b;
    if (y === t) b = "smooth_stone";                                // cornice on the roof line
    else if (ex.length > 1) b = "stone_bricks";                     // quoins at corners
    else if (row === 0) b = s === 0 ? "stone_bricks" : "smooth_stone"; // base course / string courses
    else if (row === 3) b = s === 0 ? "gray_concrete" : "white_concrete"; // spandrels (shop fascia on the ground)
    else if (along % 3 === 0) b = "gray_concrete";                  // dark mullions between the panes
    else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneState(ex[0]));
      if (row === 1 && along % 9 === 1) glowCandidates.push([x, y, z, ex[0]]);
      continue;
    }
    g.set(x, y, z, b);
  }
  if (DIRS.some(([dx, dz]) => top(x + dx, z + dz) < t)) g.set(x, t + 1, z, "stone_bricks"); // parapet on the edges
}

// Lit rooms behind some windows: a glowstone on the floor slab just inside the glass
for (const [x, y, z, [dx, dz]] of glowCandidates) {
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// Entrance: the middle of the north-facing ground frontage, a door in the glass with stone pilasters and a dark hood
const north = [...foot.keys()].map((k) => [Math.floor(k / 1000), k % 1000])
  .filter(([x, z]) => { const e = edgeFaces(x, z); return e.length === 1 && e[0][1] === -1; })
  .sort((a, b) => a[0] - b[0]);
const [ex, ez] = north[Math.floor(north.length / 2)];
for (const px of [ex - 1, ex + 1]) if (has(px, ez)) for (let y = 2; y <= 3; y++) g.set(px, y, ez, "stone_bricks");
for (const hx of [ex - 1, ex, ex + 1]) if (has(hx, ez)) g.set(hx, 4, ez, "dark_oak_slab", { type: "top" });
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(ex, 2, ez, "dark_oak_door", doorState("lower"));
g.set(ex, 3, ez, "dark_oak_door", doorState("upper"));

// Roof plant on the main tier: two plant screens and a stair/lift overrun, all on flat interior roof
const mainRoof = (x, z) => has(x, z) && top(x, z) === 21 && DIRS.every(([dx, dz]) => has(x + dx, z + dz) && top(x + dx, z + dz) === 21);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (mainRoof(x, z) && ((x >= 24 && x <= 35 && z >= 44 && z <= 51) || (x >= 70 && x <= 80 && z >= 96 && z <= 103))) {
    g.set(x, 22, z, "light_gray_concrete"); g.set(x, 23, z, "light_gray_concrete");
  }
  if (mainRoof(x, z) && x >= 50 && x <= 55 && z >= 60 && z <= 65) {
    const rim = x === 50 || x === 55 || z === 60 || z === 65;
    for (let y = 22; y <= 24; y++) if (rim) g.set(x, y, z, "stone_bricks");
    g.set(x, 25, z, "smooth_stone");
  }
}

const out = g.save(`${DIR}/way_810720944.nbt`);
console.log(`way_810720944.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
