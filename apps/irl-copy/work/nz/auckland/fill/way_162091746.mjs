// George Court (way 162091746): a 1970s-80s Auckland concrete-framed office block, about ten storeys (roof 42 blocks, 35 m),
// on a dark volcanic-basalt podium. The lidar roof is read as three setback tiers (42 core, 38 shoulder, 34 wings, a 5x5
// mode of the raw tiers so noise doesn't make islands). Each footprint cell is solid from y 0 up to its tier: the stone
// foundation below its ground, then the building. Storeys are 4 blocks (a slab row, two glass rows, a head band), the
// ground floor 5 (base course, shopfront, lintel). Facades are white-concrete piers every third block with tinted glass
// panes between, precast light-grey spandrels, a basalt base course and a white coping on each roof edge. Behind the glass
// is a one-block air gap, sealed by a slab per storey; the core is solid. Downhill cells show extra lower storeys.
// Roof: a plant box and a mast on the core. Warm glowstone sits in some gaps, and the north entrance has a door and lantern.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_162091746.cells.json", "utf8"));

const W = 45, D = 84, H = 55;
const idx = (x, z) => z * W + x;
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inF[idx(x, z)] === 1;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];       // +x, -x, +z (south), -z (north)
const hash = (x, y, z) => Math.abs(Math.imul(x * 73856093 ^ y * 19349663 ^ z * 83492791, 2654435761) >>> 0);

const inF = new Uint8Array(W * D), G = new Int32Array(W * D), R = new Int32Array(W * D);
for (const [x, z, g, r] of cells) { inF[idx(x, z)] = 1; G[idx(x, z)] = g; R[idx(x, z)] = r; }

// 1. Tiers: raw lidar roof snapped to 34 / 38 / 42, then a 5x5 mode (ties go up).
const raw = (r) => (r >= 40 ? 42 : r >= 37 ? 38 : 34);
const T = new Int32Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF[idx(x, z)]) continue;
  const n = new Map();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const t = raw(R[idx(x + dx, z + dz)]);
    n.set(t, (n.get(t) || 0) + 1);
  }
  let best = 0, bc = -1;
  for (const [t, c] of n) if (c > bc || (c === bc && t > best)) { best = t; bc = c; }
  T[idx(x, z)] = best;
}

// Which sides of a footprint cell are open air at height y: a neighbour whose tier is below y, or outside the footprint
// above its ground. Below the cell's own ground it is foundation, so nothing is exposed there.
function openSides(x, z, y) {
  const out = [];
  DIRS.forEach(([dx, dz], k) => {
    const nx = x + dx, nz = z + dz;
    if (inFoot(nx, nz)) { if (y >= T[idx(nx, nz)]) out.push(k); }
    else if (y >= G[idx(x, z)]) out.push(k);
  });
  return out;
}

// The storey row kinds, shared by every cell so the bands line up across the whole block.
function rowKind(y, g) {
  if (y < 8) {
    if (y === g) return "base";
    if (y === 7) return "head";
    const r = (y - g) % 4;
    return r === 1 || r === 2 ? "glass" : "spandrel";
  }
  if (y === 8) return "base";
  if (y <= 11) return "shop";
  if (y === 12) return "head";
  const r = (y - 13) % 4;
  return r === 0 ? "slab" : r === 3 ? "head" : "glass";
}

// A facade cell at height y (or null): its exposed sides, whether it is a pier (corner, or every third block along the face).
function facadeAt(x, z, y) {
  if (!inFoot(x, z)) return null;
  const i = idx(x, z), g = G[i], t = T[i];
  if (y < g || y >= t) return null;
  const ex = openSides(x, z, y);
  if (!ex.length) return null;
  const along = ex[0] < 2 ? z : x;
  const pier = ex.length >= 2 || along % 3 === 0;
  const kind = y === t - 1 ? "cap" : rowKind(y, g);
  return { ex, pier, kind };
}
const isGlassFacade = (x, z, y) => {
  const f = facadeAt(x, z, y);
  return !!f && !f.pier && (f.kind === "glass" || f.kind === "shop");
};

// 2. The entrance: a north-facing ground cell (G = 8) nearest the middle of the block, its door at y 8 and 9.
let door = null;
for (let z = 0; z < D && !door; z++) for (let x = 0; x < W && !door; x++) {
  if (!inFoot(x, z) || G[idx(x, z)] !== 8) continue;
  if (inFoot(x, z - 1)) continue;
  if (Math.abs(x - W / 2) <= 6) door = { x, z };
}
if (!door) for (let z = 0; z < D && !door; z++) for (let x = 0; x < W && !door; x++) {
  if (inFoot(x, z) && !inFoot(x, z - 1) && G[idx(x, z)] >= 7) door = { x, z };
}

const g = new Voxels([W, H, D]);

// 3. Walls, floors, air gaps and the foundation, one column per footprint cell.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF[idx(x, z)]) continue;
  const gr = G[idx(x, z)], t = T[idx(x, z)];
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    const f = facadeAt(x, z, y);
    if (f) {
      const { ex, pier, kind } = f;
      let b, state;
      if (kind === "base") b = "polished_basalt";
      else if (kind === "cap") b = "white_concrete";
      else if (pier) b = "white_concrete";
      else if (kind === "glass" || kind === "shop") {
        b = "gray_stained_glass_pane";
        const ns = ex[0] < 2;                       // a wall on the x faces runs north-south, one on the z faces east-west
        state = ns
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      } else b = "light_gray_concrete";              // slab, spandrel, head
      if (door && x === door.x && z === door.z && (y === 8 || y === 9)) {
        b = "dark_oak_door";
        state = { facing: "south", half: y === 8 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      } else if (door && x === door.x && z === door.z && y === 10) {
        b = "lantern"; state = { hanging: "false", waterlogged: "false" };
      }
      g.set(x, y, z, b, state);
      continue;
    }
    // Interior: the cap is a roof membrane; glass rows keep an air gap behind the pane (glowstone in some); the rest is core.
    const kind = y === t - 1 ? "cap" : rowKind(y, gr);
    if (kind === "cap") { g.set(x, y, z, "smooth_stone"); continue; }
    if (kind === "glass" || kind === "shop") {
      const behindGlass = DIRS.some(([dx, dz]) => isGlassFacade(x + dx, z + dz, y));
      if (behindGlass) {
        if (kind === "shop" ? hash(x, y, z) % 4 === 0 : hash(x, y, z) % 9 === 0) g.set(x, y, z, "glowstone");
        continue;                                    // air
      }
    }
    g.set(x, y, z, "stone");
  }
}

// 4. Roof plant: a 7 x 5 box on the core (every cell at tier 42), a membrane, and a mast with a lightning rod.
let sx = 0, sz = 0, sn = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF[idx(x, z)] && T[idx(x, z)] === 42) { sx += x; sz += z; sn++; }
const cx = Math.round(sx / sn), cz = Math.round(sz / sn);
for (let z = cz - 2; z <= cz + 2; z++) for (let x = cx - 3; x <= cx + 3; x++) {
  if (!inFoot(x, z) || T[idx(x, z)] !== 42) continue;
  g.set(x, 42, z, "light_gray_concrete"); g.set(x, 43, z, "light_gray_concrete"); g.set(x, 44, z, "smooth_stone");
}
for (let y = 45; y <= 51; y++) g.set(cx, y, cz, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
g.set(cx, 52, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = DIR + "way_162091746.nbt";
const stats = g.save(out);
console.log(JSON.stringify({ file: out, ...stats, door, plant: { cx, cz } }));
