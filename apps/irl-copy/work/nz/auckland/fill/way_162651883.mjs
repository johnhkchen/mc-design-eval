// Auckland, way 162651883: a 1930s stripped-classical commercial block, cream plaster over brick. A two-storey podium
// (lidar 9-11) carries a four-storey tower on the north-east corner, stepped back to three storeys at its outer edge,
// and one-storey wings (lidar 5-6) run to the south-west. Each storey is 4 blocks: a string course, two rows of glazed bays on piers, and a
// spandrel. The ground storey is a shopfront (polished base, dark timber, glass) with a door and a canopy band. Walls
// are one block thick with an air gap behind the glass, a floor slab per storey, and a flat roof with plant boxes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_162651883.cells.json", "utf8"));

const W = 24, D = 43, H = 29, N = W * D;
const idx = (x, z) => z * W + x;
const inGrid = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const NB = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

const inF = new Uint8Array(N), R = new Float64Array(N);
for (const [x, z, , r] of cells) { inF[idx(x, z)] = 1; R[idx(x, z)] = r; }
const inside = (x, z) => inGrid(x, z) && inF[idx(x, z)] === 1;

// 1. The lidar roof, averaged over a 3x3 of footprint cells so single noisy cells do not make spikes.
const Rm = new Float64Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) { s += R[idx(x + dx, z + dz)]; n++; }
  Rm[i] = s / n;
}

// 2. Clean tiers: one flat roof per storey count, so the lidar's 9-11 podium is one 2-storey tier with a parapet, not
// three jagged ones. top = 1 + 4n + p: a 1-storey wing (5), a 2-storey podium with a parapet (10), a 3-storey wing (13),
// the 4-storey tower (17). The 3x3 mean picks the nearest tier.
const TIERS = [{ n: 1, p: 0 }, { n: 2, p: 1 }, { n: 3, p: 0 }, { n: 4, p: 0 }];
const NS = new Int32Array(N), TOP = new Int32Array(N);
for (let i = 0; i < N; i++) {
  if (!inF[i]) continue;
  let best = null;
  for (const { n, p } of TIERS) {
    const t = 1 + 4 * n + p, d = Math.abs(t - Rm[i]);
    if (!best || d < best.d || (d === best.d && t > best.t)) best = { n, t, d };
  }
  NS[i] = best.n; TOP[i] = best.t;
}
// 3. Setback: the fourth storey steps back from the outer edge, so the tower reads as a tower on a podium with a terrace.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || NS[i] < 4) continue;
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) { NS[i] = 3; TOP[i] = 13; }
}

// A block is exposed at layer y on a side when the neighbour beside it has no column there (outside, or lower).
const exposures = (x, z, y) => NB.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || TOP[idx(nx, nz)] <= y; });

// The ground-floor entrance: a plain west wall, two storeys or more, nearest to z 16 (where the canopy has room).
let ENT = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || NS[i] < 2) continue;
  const ex = exposures(x, z, 2);
  if (ex.length !== 1 || ex[0][0] !== -1) continue;
  if (!ENT || Math.abs(z - 16) < Math.abs(ENT.z - 16)) ENT = { x, z };
}

// Glass and bars connect along the wall, never out of it; the pane state is set from the wall's run.
const paneState = (ex) => {
  const st = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
  const along = ex[0][0] !== 0 ? ["north", "south"] : ["east", "west"];
  for (const d of along) st[d] = "true";
  return st;
};

// The block for one layer of one footprint cell, or null for air (an interior cell, or above the roof).
function cellBlock(x, z, y) {
  const i = idx(x, z);
  if (!inF[i]) return null;
  if (y === 0) return { name: "polished_andesite" };                       // foundation and base course, under every cell
  const top = TOP[i]; if (y >= top) return null;
  const n = NS[i], deck = 4 * n;
  const ex = exposures(x, z, y), exposed = ex.length > 0;
  const corner = ex.some(([dx]) => dx !== 0) && ex.some(([, dz]) => dz !== 0);
  const u = ex.length && ex[0][0] !== 0 ? z : x;                           // position along the wall, for the bay pattern
  const k = Math.floor((y - 1) / 4), r = (y - 1) % 4;

  if (y > deck) {                                                         // parapet on the exposed ring
    if (!exposed) return null;
    if (y === top - 1) return { name: "smooth_quartz_slab", state: { type: "bottom" } };
    return { name: corner ? "quartz_pillar" : "quartz_block" };
  }
  if (y === deck) {                                                       // the roof deck: cornice on the ring, surface inside
    if (!exposed) return { name: "smooth_stone" };
    return { name: corner ? "quartz_pillar" : "smooth_quartz" };
  }
  if (r === 0) {                                                          // floor slab (solid across the cell) and string course
    if (!exposed) return { name: "smooth_stone" };
    if (k === 0) return { name: "polished_andesite" };                      // the stallriser of the shopfront
    return { name: corner ? "quartz_pillar" : "smooth_quartz" };
  }
  if (!exposed) return null;                                              // the air gap behind the glass
  if (k === 0) {                                                          // the shopfront: dark timber, glass, the door
    if (r === 3) return { name: "dark_oak_planks" };                       // fascia
    if (ENT && x === ENT.x && z === ENT.z) return {
      name: "dark_oak_door",
      state: { facing: "west", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
    };
    if (corner || u % 4 !== 1 && u % 4 !== 3) return { name: "dark_oak_log" };
    return { name: "glass_pane", state: paneState(ex) };
  }
  if (r === 3) return { name: corner ? "quartz_pillar" : "quartz_block" }; // spandrel under the windows
  if (corner) return { name: "quartz_pillar" };
  const p = u % 4;
  if (p === 0) return { name: "quartz_pillar" };                           // pier
  if (p === 2) return { name: "iron_bars", state: paneState(ex) };         // mullion
  return { name: "glass_pane", state: paneState(ex) };
}

const g = new Voxels([W, H, D]);
let lit = 0, plant = 0;
const SHOP_CANOPY = (x, z, y) => y === 4 && ENT && Math.abs(z - ENT.z) <= 1 && NS[idx(x, z)] >= 2 && exposures(x, z, y).some(([dx]) => dx === -1);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF[idx(x, z)]) continue;
  for (let y = 0; y < H; y++) {
    let b = cellBlock(x, z, y);
    if (!b) continue;
    // the canopy: a dark slab band over the door, on the storey above the shopfront
    if (SHOP_CANOPY(x, z, y)) b = { name: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };
    g.set(x, y, z, b.name, b.state);
    // warm light in some glazed bays: a glowstone in the air gap just inside the glass
    if (b.name === "glass_pane" && (y - 1) % 4 === 1 && hh(x, y, z) % 7 === 0) {   // the lower glass row: it stands on the slab
      const ex = exposures(x, z, y);
      if (ex.length === 1) {
        const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
        if (inside(ix, iz) && cellBlock(ix, iz, y) === null) { g.set(ix, y, iz, "glowstone"); lit++; }
      }
    }
  }
}
// roof plant: small stone plant boxes on the flat roofs, inside the parapet, where the roof is free
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || NS[i] < 1) continue;
  const y = 4 * NS[i] + 1;
  if (x % 6 !== 3 || z % 6 !== 3 || y >= H) continue;
  if (cellBlock(x, z, y) !== null) continue;
  if (!inside(x + 1, z) || !inside(x, z + 1) || !inside(x + 1, z + 1)) continue;
  if ([[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].some(([a, c]) => cellBlock(a, c, y) !== null)) continue;
  for (const [a, c] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) g.set(a, y, c, "stone_bricks");
  plant++;
}

const stats = g.save(DIR + "way_162651883.nbt");
console.log(`way_162651883: ${stats.blocks} blocks, ${stats.palette} palette entries, ${lit} lit bays, ${plant} roof plant boxes`);
