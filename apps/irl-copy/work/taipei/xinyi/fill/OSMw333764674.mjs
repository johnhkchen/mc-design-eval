import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw333764674";
const W = 30, H = 165, D = 34;

// Yunding B: late-1990s Xinyi office/residential tower, about 153 blocks to roof.
// Stone-clad base, cyan tinted glass curtain wall with white concrete fins and spandrels,
// setback tiers, a plant penthouse and a slim mast. y = 0 is the lowest ground under the footprint.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);

const grd = new Map();
for (const [x, z, gr] of cells) grd.set(key(x, z), Math.max(0, Math.round(gr)));

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// 4-neighbour distance from the outside edge of a cell set
function distOf(set) {
  const dist = new Map();
  const q = [];
  for (const k of set) {
    const [x, z] = parse(k);
    if (!set.has(key(x - 1, z)) || !set.has(key(x + 1, z)) ||
        !set.has(key(x, z - 1)) || !set.has(key(x, z + 1))) {
      dist.set(k, 0);
      q.push(k);
    }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i];
    const [x, z] = parse(k);
    const d = dist.get(k);
    for (const n of [key(x - 1, z), key(x + 1, z), key(x, z - 1), key(x, z + 1)]) {
      if (set.has(n) && !dist.has(n)) {
        dist.set(n, d + 1);
        q.push(n);
      }
    }
  }
  return dist;
}

// Which faces of a cell are exposed within its own tier's set
function faceInfo(set, x, z) {
  const has = (a, b) => set.has(key(a, b));
  const xn = !has(x - 1, z), xp = !has(x + 1, z);
  const zn = !has(x, z - 1), zp = !has(x, z + 1);
  return {
    corner: (xn || xp) && (zn || zp),
    alongX: zn || zp, // exposed in z, so the face runs along x
    alongZ: xn || xp, // exposed in x, so the face runs along z
    zn, zp, xn, xp,
  };
}

// Offset from a facade cell toward the interior
function inward(f) {
  if (f.zn) return [0, 1];
  if (f.zp) return [0, -1];
  if (f.xn) return [1, 0];
  return [-1, 0];
}

const GLASS = "cyan_stained_glass_pane";
const FRAME = "white_concrete";
const SLAB = "light_gray_concrete";

// Body of one tier: rows [y0, y1) for every cell of the set, starting at each cell's ground
function body(set, dist, y0, y1) {
  for (const k of set) {
    const [x, z] = parse(k);
    const gr = grd.get(k) ?? 0;
    const d = dist.get(k);
    const f = faceInfo(set, x, z);
    const start = Math.max(y0, gr);
    for (let y = start; y < y1; y++) {
      const rel = y % 5;
      const storey = Math.floor(y / 5);
      if (d > 0) {
        // interior: floor slabs, air gap, occasional warm light just behind the glass
        if (rel === 0 || y === gr) put(x, y, z, SLAB);
        else if (d === 1 && rel === 2 && (x * 7 + z * 3 + storey) % 9 === 0) put(x, y, z, "glowstone");
        continue;
      }
      // facade
      if (y === gr) { put(x, y, z, "polished_granite"); continue; }
      if (rel === 0 || rel === 4) { put(x, y, z, FRAME); continue; }
      if (f.corner) { put(x, y, z, FRAME); continue; }
      const pos = f.alongX ? x : z;
      if (pos % 3 === 0) {
        // mullion: a two-deep white fin so the facade has real relief
        put(x, y, z, FRAME);
        const [dx, dz] = inward(f);
        const ik = key(x + dx, z + dz);
        if (set.has(ik) && dist.get(ik) >= 1) put(x + dx, y, z + dz, FRAME);
        continue;
      }
      const pp = f.alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, GLASS, pp);
    }
  }
}

// --- Tiers -----------------------------------------------------------------
const S1 = new Set(grd.keys());
const d1 = distOf(S1);
const S2 = new Set([...S1].filter((k) => d1.get(k) >= 3));
const d2 = distOf(S2);
const S3 = new Set([...S2].filter((k) => d2.get(k) >= 3));
const d3 = distOf(S3);

// Foundation: solid from y 0 up to each cell's ground
for (const k of S1) {
  const [x, z] = parse(k);
  const gr = grd.get(k);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Tier 1: podium and main shaft, y from ground to 130
body(S1, d1, 0, 130);
// Roof of tier 1 where tier 2 steps back (row 130), with a parapet on the edge
for (const k of S1) {
  const [x, z] = parse(k);
  if (!S2.has(k)) {
    put(x, 130, z, "smooth_stone");
    if (d1.get(k) === 0) put(x, 131, z, FRAME);
  }
}

// Tier 2: first setback, y 130 to 152
body(S2, d2, 130, 152);
// Roof of tier 2 (row 152), parapet on its edge at 153
for (const k of S2) {
  const [x, z] = parse(k);
  if (!S3.has(k)) {
    put(x, 152, z, "smooth_stone");
    if (d2.get(k) === 0) put(x, 153, z, FRAME);
  }
}
// Roof plant on tier-2 terrace: a few low concrete housings on a grid
for (const k of S2) {
  if (S3.has(k)) continue;
  const [x, z] = parse(k);
  if (d2.get(k) >= 1 && x % 5 === 2 && z % 5 === 2) {
    put(x, 153, z, SLAB);
    put(x, 154, z, SLAB);
  }
}

// Tier 3: plant penthouse, y 153 to 157, roof cap at 158
body(S3, d3, 153, 158);
for (const k of S3) {
  const [x, z] = parse(k);
  put(x, 158, z, "smooth_stone");
}

// Slim mast on the penthouse centre
{
  let cx = 0, cz = 0;
  for (const k of S3) { const [x, z] = parse(k); cx += x; cz += z; }
  cx /= S3.size; cz /= S3.size;
  let best = null, bd = Infinity;
  for (const k of S3) {
    const [x, z] = parse(k);
    const dd = (x - cx) ** 2 + (z - cz) ** 2;
    if (dd < bd) { bd = dd; best = [x, z]; }
  }
  if (best) {
    const [mx, mz] = best;
    for (let y = 159; y <= 161; y++) put(mx, y, mz, "iron_bars");
    put(mx, 162, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Ground-floor lobby on the north (z = min) face: wide shopfront, stone lintel, door, lit interior
{
  const zMin = Math.min(...[...S1].map((kk) => parse(kk)[1]));
  const DOOR_X = 14;
  for (let x = 9; x <= 20; x++) {
    const k = key(x, zMin);
    if (!S1.has(k) || d1.get(k) !== 0) continue;
    const gr = grd.get(k);
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (x % 3 === 0) put(x, y, zMin, FRAME);
      else put(x, y, zMin, "glass");
    }
    // stone lintel over the entrance band
    put(x, gr + 4, zMin, "polished_granite");
  }
  // warm lamps just inside the lobby glass
  for (const lx of [11, 17]) {
    const k = key(lx, zMin + 1);
    const gr = grd.get(key(lx, zMin));
    if (S1.has(k) && gr !== undefined) put(lx, gr + 2, zMin + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // door
  const dk = key(DOOR_X, zMin);
  const dgr = grd.get(dk);
  if (dgr !== undefined) {
    const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(DOOR_X, dgr + 1, zMin, "iron_door", { ...dp, half: "lower" });
    put(DOOR_X, dgr + 2, zMin, "iron_door", { ...dp, half: "upper" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
