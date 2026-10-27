// Auckland, way 24009954: a 1930s stripped-classical commercial block. Cream plaster on a brick wing, four storeys
// of glazed bays on piers, a setback core on the lidar's diagonal spine, a flat roof with plant boxes. Walls are one
// block thick with an air gap behind the glass; floors are slabs per storey; a few windows are lit from inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24009954.cells.json", "utf8"));
const W = 44, D = 73, H = 33;
const ix = (x, z) => z * W + x;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// ---- footprint, ground and lidar roof ----
const inFoot = new Uint8Array(W * D), gnd = new Int8Array(W * D), roof = new Float64Array(W * D);
for (const [x, z, g, r] of cells) { inFoot[ix(x, z)] = 1; gnd[ix(x, z)] = g; roof[ix(x, z)] = r; }
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && inFoot[ix(x, z)] === 1;
const perim = new Uint8Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inside(x, z) && NB.some(([dx, dz]) => !inside(x + dx, z + dz))) perim[ix(x, z)] = 1;

// lidar noise into flat tiers: a 5x5 mean of the footprint's roof heights, then depth in from the edge for setbacks
const smooth = new Float64Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) { s += roof[ix(x + dx, z + dz)]; n++; }
  smooth[ix(x, z)] = s / n;
}
const depth = new Int16Array(W * D).fill(-1);
let queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (perim[ix(x, z)]) { depth[ix(x, z)] = 1; queue.push([x, z]); }
for (let q = 0; q < queue.length; q++) {
  const [x, z] = queue[q];
  for (const [dx, dz] of NB) if (inside(x + dx, z + dz) && depth[ix(x + dx, z + dz)] < 0) {
    depth[ix(x + dx, z + dz)] = depth[ix(x, z)] + 1; queue.push([x + dx, z + dz]);
  }
}
// wing = 3 storeys (top 14), podium = 4 storeys + roof deck + parapet (top 18), core = setback to 21 on the spine
const TOP = new Int16Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const s = smooth[ix(x, z)], d = depth[ix(x, z)];
  TOP[ix(x, z)] = s < 16 ? 14 : (s >= 18.4 && d >= 3 ? 21 : 18);
}
const top = (x, z) => TOP[ix(x, z)];
const gr = (x, z) => gnd[ix(x, z)];
const isPerim = (x, z) => perim[ix(x, z)] === 1;
// the row each tier's roof deck sits on (its top solid row); above it the roof is open air
const deckRow = (T) => (T === 14 ? 12 : T === 18 ? 16 : 20);
const floorRows = { 14: [4, 8, 12], 18: [4, 8, 12, 16], 21: [4, 8, 12, 16, 17, 20] };
const isFloor = (x, z, y) => y === gr(x, z) || floorRows[top(x, z)].includes(y);
const solid = (x, z, y) => {
  if (!inside(x, z)) return false;
  if (y < gr(x, z)) return true;
  if (isFloor(x, z, y)) return true;
  return isPerim(x, z) && y < top(x, z);
};
const outdoor = (x, z, y) => {
  if (!inside(x, z)) return true;
  if (solid(x, z, y)) return false;
  return y >= top(x, z) || y > deckRow(top(x, z));
};
const exposures = (x, z, y) => NB.filter(([dx, dz]) => outdoor(x + dx, z + dz, y));

// ---- the facade roles, by row: base, shopfront, storey bands, trim (lines, cornice, deck), parapet, windows ----
const roleOf = (y, T) => {
  if (y === 0) return "base";
  if (y <= 2) return "shop";
  if (y === 3) return "band";
  if (T === 14 && y >= 13) return "parapet";
  if (T === 18 && y === 17) return "parapet";
  if (y === 7 || y === 11 || y === 15) return "band";
  if ([4, 8, 12, 16, 17, 20].includes(y)) return "trim";
  return "win";
};
const mats = (T) => (T === 14
  ? { wall: "bricks", trim: "stone_bricks", pier: "stone_bricks" }
  : { wall: "smooth_quartz", trim: "quartz_bricks", pier: "quartz_pillar" });

const facade = (x, z, y, ex, T) => {
  const role = roleOf(y, T), m = mats(T);
  const hasNS = ex.some(([, dz]) => dz !== 0), hasEW = ex.some(([dx]) => dx !== 0);
  const corner = hasNS && hasEW;
  const along = hasNS ? x : z;               // a north or south face runs along x, an east or west face along z
  const pier = corner || along % 4 === 0;     // a pier every fourth block, and at every corner
  const n = ex[0];
  if (role === "base") return { b: "polished_andesite" };
  if (role === "band" || role === "parapet") return { b: m.wall };
  if (role === "trim") return { b: m.trim };
  return pier ? { b: m.pier } : { b: "glass_pane", glass: true, n };       // shop and win rows
};

const cellSpec = (x, z, y) => {
  if (!inside(x, z)) return null;
  const g = gr(x, z), T = top(x, z);
  if (y < g) return { b: "polished_andesite" };                           // foundation under the ground
  if (y >= T) return null;
  const ex = exposures(x, z, y);
  if (isFloor(x, z, y)) {
    if (!ex.length) return { b: y === deckRow(T) ? "stone" : "stone_bricks" };
    return facade(x, z, y, ex, T);
  }
  if (isPerim(x, z) || (ex.length && y <= deckRow(T))) return facade(x, z, y, ex, T);
  return null;                                                            // air: the interior, or open roof
};

// ---- build the grid ----
const grid = new Array(W * H * D).fill(null);
const gi = (x, y, z) => (z * H + y) * W + x;
const put = (x, y, z, b, st) => { if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return false; grid[gi(x, y, z)] = { b, st }; return true; };
const at = (x, y, z) => (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D ? null : grid[gi(x, y, z)]);

const glassNormal = new Map();                                            // glass cell -> its outward normal
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < H; y++) {
    const s = cellSpec(x, z, y);
    if (!s) continue;
    put(x, y, z, s.b);
    if (s.glass) glassNormal.set(gi(x, y, z), s.n);
  }
}

// ---- the entrance: the longest run of ground-floor street-face cells with room for a canopy in front ----
let best = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || !isPerim(x, z) || gr(x, z) !== 0 || top(x, z) === 14) continue;
  const ex = exposures(x, z, 1);
  if (ex.length !== 1) continue;
  const n = ex[0], a = n[0] === 0 ? [1, 0] : [0, 1];
  const same = (cx, cz) => inside(cx, cz) && isPerim(cx, cz) && gr(cx, cz) === 0 && top(cx, cz) !== 14 &&
    exposures(cx, cz, 1).length === 1 && exposures(cx, cz, 1)[0][0] === n[0] && exposures(cx, cz, 1)[0][1] === n[1];
  if (!same(x - a[0], z - a[1]) || !same(x + a[0], z + a[1])) continue;
  let run = 1;
  for (const s of [1, -1]) for (let k = 1; k < 30 && same(x + s * k * a[0], z + s * k * a[1]); k++) run++;
  let clear = true;                                                       // the door's own column needs room in front
  for (let d = 1; d <= 3; d++) {
    const cx = x + n[0] * d, cz = z + n[1] * d;
    if (cx < 0 || cx >= W || cz < 0 || cz >= D || inside(cx, cz)) clear = false;
  }
  if (!clear || run < 3) continue;
  if (!best || run > best.run) best = { x, z, n, a, run };
}
if (best) {
  const { x: ex, z: ez, n: [nx, nz], a: [ax, az] } = best;
  const facing = FACING[`${nx},${nz}`];
  for (const o of [-1, 0, 1]) {
    const x = ex + o * ax, z = ez + o * az;
    if (o === 0) {
      put(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      put(x, 1, z, "quartz_pillar"); put(x, 2, z, "quartz_pillar");
    }
  }
  // the canopy: a slab shelf over the door, cantilevered from the band at row 3 and carried on two posts
  const outside = (cx, cz) => cx >= 0 && cx < W && cz >= 0 && cz < D && !inside(cx, cz);
  for (let o = -2; o <= 2; o++) for (let d = 1; d <= 3; d++) {
    const cx = ex + o * ax + nx * d, cz = ez + o * az + nz * d;
    if (outside(cx, cz)) put(cx, 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const o of [-2, 2]) {
    const cx = ex + o * ax + nx * 3, cz = ez + o * az + nz * 3;
    if (outside(cx, cz)) for (let y = 0; y <= 2; y++) put(cx, y, cz, "quartz_pillar");
  }
  put(ex + nx * 2, 2, ez + nz * 2, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- warm light: some windows lit from a lantern set two blocks in, behind an air gap ----
for (const [key, n] of glassNormal) {
  const x = key % W, y = Math.floor(key / W) % H, z = Math.floor(key / (W * H));
  const lightRow = [5, 9, 13, 18].includes(y) || y === gr(x, z) + 1;
  if (!lightRow || (x * 31 + z * 17 + y * 7) % 4 !== 0) continue;
  const ix2 = x - 2 * n[0], iz2 = z - 2 * n[1];
  if (!inside(ix2, iz2) || at(x - n[0], y, z - n[1]) || at(ix2, y, iz2)) continue;
  if (!at(ix2, y - 1, iz2)) continue;                                      // the lantern stands on the floor slab
  put(ix2, y, iz2, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- roof plant: boxes on the podium's roof deck, clear of the setback core ----
let boxes = 0;
for (let z = 3; z < D - 4 && boxes < 4; z += 6) for (let x = 3; x < W - 4 && boxes < 4; x += 8) {
  const ok = [0, 1, 2].every((dz) => [0, 1, 2].every((dx) => inside(x + dx, z + dz) && !isPerim(x + dx, z + dz) && top(x + dx, z + dz) === 18 && !at(x + dx, 17, z + dz)));
  if (!ok) continue;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) put(x + dx, 17, z + dz, "light_gray_concrete");
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) put(x + dx, 18, z + dz, "light_gray_concrete");
  boxes++;
}

// ---- glass panes connect to their neighbours along the face (and stay thin, not posts) ----
for (const [key, n] of glassNormal) {
  const x = key % W, y = Math.floor(key / W) % H, z = Math.floor(key / (W * H));
  const c = at(x, y, z);
  if (!c || c.b !== "glass_pane") continue;
  const alongNS = n[0] === 0;                                             // on a north/south face the panes run along x
  const on = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  c.st = alongNS
    ? { east: on(1, 0), west: on(-1, 0), north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: on(0, -1), south: on(0, 1), waterlogged: "false" };
}

// ---- write it ----
const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const c = grid[gi(x, y, z)];
  if (c) g.set(x, y, z, c.b, c.st);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24009954.nbt";
const r = g.save(out);
console.log(JSON.stringify({ blocks: r.blocks, palette: r.palette, entrance: best ? { x: best.x, z: best.z, run: best.run } : null, boxes }));
