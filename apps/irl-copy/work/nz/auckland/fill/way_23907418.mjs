// Auckland, Mt Eden side of the CBD fringe: a 1930s reinforced-concrete office block in red brick with cream render
// (the stripped-classical commercial stock of the 1920s-30s city). Seven storeys of 4 blocks on a shopfront ground floor,
// the lidar roof reads as one flat tier at 28 with a core at 31: the core carries a louvred plant enclosure, the rest of
// the roof is a dark membrane with AC units. Each cell is a 1-block facade, a 1-block air gap behind the glass only, and
// a solid core with a floor slab on every storey, so each storey stands on the one below. Storey lines and cornice are
// cream render, piers are brick, the plinth is stone, the entrance has a dark oak door with render pilasters.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_23907418.cells.json", "utf8"));

const W = 35, H = 44, D = 45, N = W * D;
const idx = (x, z) => z * W + x;
const inGrid = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const inF = new Uint8Array(N), R = new Int32Array(N);
for (const [x, z, , r] of cells) { inF[idx(x, z)] = 1; R[idx(x, z)] = r; }
const fin = (x, z) => inGrid(x, z) && inF[idx(x, z)] === 1;
const key = (x, y, z) => `${x},${y},${z}`;

// a deterministic hash for the scattered details (which windows are lit)
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

const DIRS = [
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
];

// 1. Smooth the lidar roof: a 5x5 median over footprint cells, so single noisy cells do not make spikes.
const Rm = new Int32Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (fin(x + dx, z + dz)) v.push(R[idx(x + dx, z + dz)]);
  v.sort((a, b) => a - b); Rm[i] = v[v.length >> 1];
}

// 2. Depth in steps from the outside (1 = facade, 2 = behind it: the air gap, 3+ = solid core).
const depth = new Int32Array(N), q = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  if (DIRS.some((d) => !fin(x + d.dx, z + d.dz))) { depth[i] = 1; q.push(i); }
}
for (let h = 0; h < q.length; h++) {
  const i = q[h], x = i % W, z = (i / W) | 0;
  for (const d of DIRS) {
    const nx = x + d.dx, nz = z + d.dz; if (!fin(nx, nz)) continue;
    const j = idx(nx, nz); if (!depth[j]) { depth[j] = depth[i] + 1; q.push(j); }
  }
}

// 3. Tiers: the plant enclosure is the core where the smoothed roof is 30+ and at least 3 steps in; everything else is
// the 7-storey roof at 28. 28 = 7 storeys of 4 blocks; the core's 3 extra blocks are the plant room.
const P = new Uint8Array(N);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (inF[i] && Rm[i] >= 30 && depth[i] >= 3) P[i] = 1;
}
const topOf = (i) => (P[i] ? 31 : 28);

// 4. Facades: outward direction(s) of each depth-1 cell; a corner has two and reads as a pier.
const fac = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || depth[i] !== 1) continue;
  const outs = DIRS.filter((d) => !fin(x + d.dx, z + d.dz));
  const corner = outs.length >= 2;
  const d = outs[0];
  const along = d.dx !== 0 ? z : x;
  fac.set(i, { d, along, corner, win: along % 3 !== 0 });   // piers every third bay, windows between (stepped edges too)
}

// the entrance: the middle of the longest straight run of facade cells
const runs = {};
for (const [i, f] of fac) if (!f.corner) (runs[f.d.name] ??= []).push({ i, along: f.along });
const longest = Object.entries(runs).sort((a, b) => b[1].length - a[1].length)[0];
const doorDir = DIRS.find((d) => d.name === longest[0]);
const sortedRun = longest[1].sort((a, b) => a.along - b.along);
const doorCell = sortedRun[sortedRun.length >> 1];
const doorX = doorCell.i % W, doorZ = (doorCell.i / W) | 0, doorAlong = doorCell.along;
const pilasterAt = new Set([doorAlong - 1, doorAlong + 1].map((a) => `${doorDir.name}:${a}`));

// 5. The plan: every block by key, so panes and bars can take their connections from their neighbours.
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { block, state });
const air = new Set();                                     // the air gap behind glazing (and the entrance hall)
const lit = new Set();                                     // which air cells hold a warm lamp behind the glass

// the facade cell's block at height y (its depth-1 spec)
function facadeBlock(x, z, y, f) {
  if (y === 0) return "stone_bricks";
  const isDoor = x === doorX && z === doorZ;
  if (isDoor && y <= 2) return null;                       // the door is set below, as a pair of halves
  if (isDoor && y === 3) return "glass_pane";             // the transom over the door
  if (y === 1) {
    if (f.d.name === doorDir.name && pilasterAt.has(`${f.d.name}:${f.along}`) && !f.corner) return "smooth_quartz";
    return "polished_andesite";                            // the base course
  }
  if (y === 27) return "smooth_quartz";                    // the cornice
  if (y % 4 === 0) return "smooth_quartz";                 // storey lines
  if (f.d.name === doorDir.name && pilasterAt.has(`${f.d.name}:${f.along}`) && y <= 3) return "smooth_quartz";
  if (!f.win) return "bricks";
  const r = y % 4;
  if (r === 1 && y !== 25) return "smooth_quartz";         // window sills, the top storey's glass runs to the cornice
  return "glass_pane";
}

// 6. Facade cells, and the air gap behind each window / door.
for (const [i, f] of fac) {
  const x = i % W, z = (i / W) | 0;
  const isDoor = x === doorX && z === doorZ;
  for (let y = 0; y < 28; y++) {
    if (isDoor && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", { facing: f.d.name, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const b = facadeBlock(x, z, y, f);
    if (b) put(x, y, z, b, b === "glass_pane" ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
    if (b === "glass_pane" && !isDoor) {
      const ix = x - f.d.dx, iz = z - f.d.dz;
      if (fin(ix, iz) && depth[idx(ix, iz)] >= 2) {
        air.add(key(ix, y, iz));
        if (y % 4 === 2 && hh(x, y, z) % 5 === 0) lit.add(key(ix, y, iz));
      }
    }
  }
  if (isDoor) {
    const ix = x - f.d.dx, iz = z - f.d.dz;
    for (let y = 1; y <= 3; y++) air.add(key(ix, y, iz));   // the entrance hall, behind the door
  }
}

// 7. The rest of the footprint: solid core, floor slab per storey, roof membrane on top, plant enclosure on the core.
const ringOfP = (x, z) => P[idx(x, z)] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !P[idx(x + dx, z + dz)]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || depth[i] === 1) continue;
  const top = topOf(i);
  for (let y = 0; y < top; y++) {
    const k = key(x, y, z);
    if (air.has(k)) { if (lit.has(k)) put(x, y, z, "glowstone"); continue; }
    if (P[i]) {
      if (y === 28 && ringOfP(x, z)) { put(x, y, z, "bricks"); continue; }
      if (y === 29 && ringOfP(x, z)) { put(x, y, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }); continue; }
      if (y === 30 && ringOfP(x, z)) { put(x, y, z, "smooth_quartz"); continue; }
    }
    put(x, y, z, y === top - 1 ? "smooth_stone" : "stone");
  }
}

// AC units on the membrane: 2x2 boxes on the roof, away from the core and the facades
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z); if (!inF[i] || P[i] || depth[i] < 4 || x % 9 !== 2 || z % 9 !== 2) continue;
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => fin(x + dx, z + dz) && !P[idx(x + dx, z + dz)] && depth[idx(x + dx, z + dz)] >= 3);
  if (ok) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x + dx, 28, z + dz, "light_gray_concrete");
}

// the lightning rod on the plant room, at the cell nearest its middle
{
  let sx = 0, sz = 0, n = 0;
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (P[idx(x, z)]) { sx += x; sz += z; n++; }
  if (n) {
    const cx = sx / n, cz = sz / n;
    let best = null;
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (P[idx(x, z)]) {
      const d2 = (x - cx) ** 2 + (z - cz) ** 2; if (!best || d2 < best.d2) best = { x, z, d2 };
    }
    put(best.x, 31, best.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// 8. Panes and bars take their connections from the plan: a side joins a neighbouring pane, bar or solid block.
const PANE = new Set(["glass_pane", "iron_bars"]);
for (const [k, v] of plan) {
  if (!PANE.has(v.block)) continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => { const n = plan.get(key(x + dx, y, z + dz)); return n && n.block !== "glowstone" ? "true" : "false"; };
  v.state = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
}

// 9. Write the volume.
const g = new Voxels([W, H, D]);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(DIR + "way_23907418.nbt");
console.log(`way_23907418: ${out.blocks} blocks, ${out.palette} palette entries; door on the ${doorDir.name} face at (${doorX}, ${doorZ}); plant core ${P.reduce((a, b) => a + b, 0)} cells; ${lit.size} lit windows`);
