// Part 7 (v2 comment), Dense planting and the finishing pass, run last so it fills only the air the other parts left
// (lamps, benches, tables and walls already stand): Monterey cypress and pine clumps (wide, flat, layered, wind-swept),
// the picnic place's extra terrace walls, tables and umbrellas, the overlook's stepped seating terraces, the parkway's
// median barrier, and dense native drifts in sweeping bands over every non-lawn park cell.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { picnicTable, umbrella, lampPost, rng, CYPRESS_TRUNKS, PINE_TRUNKS, MEADOW_CENTRE, CAMPFIRE_CENTRE, B_FOOTPRINTS } from "../vocab.mjs";

const dir = fileURLToPath(new URL(".", import.meta.url));
const SM = readFileSync(dir + "site.txt", "utf8").trim().split("\n");
const siteAt = (x, z) => SM[Math.min(72, z >> 1)][Math.min(42, x >> 1)];
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const inBox = (x, z, [x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const name = (g, x, y, z) => String(g.blockAt(x, y, z) ?? "").replace("minecraft:", "");
const air = (g, x, y, z) => g.inBounds(x, y, z) && /^(cave_)?air$|^$/.test(name(g, x, y, z));

// smooth value noise (seeded lattice, cosine blend) for the drift bands
function noise2(seed, scale) {
  const r = rng(seed), T = Array.from({ length: 256 }, () => r());
  const h = (i, j) => T[((i * 73856093) ^ (j * 19349663)) & 255];
  const s = (t) => (1 - Math.cos(t * Math.PI)) / 2;
  return (x, z) => {
    const fx = x / scale, fz = z / scale, i = Math.floor(fx), j = Math.floor(fz), u = s(fx - i), v = s(fz - j);
    return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
  };
}

let top;   // column top y as found when this part starts
const leaves = [];
const put = (g, x, y, z, b, st = {}) => {
  if (!air(g, x, y, z)) return false;
  g.set(x, y, z, b, st);
  if (!name(g, x, y, z) || air(g, x, y, z)) return false;           // refused (an earlier part's cell)
  if (/leaves$/.test(b)) leaves.push([x, y, z]);
  return true;
};
// leaves of a crown left with at most one neighbour (ragged edges, a refused limb) are pruned so nothing floats or dangles
function prune(g) {
  for (let pass = 0; pass < 3; pass++) for (const [x, y, z] of leaves) {
    if (air(g, x, y, z)) continue;
    const n = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].filter(([a, b, c]) => !air(g, x + a, y + b, z + c)).length;
    if (n <= 1) g.set(x, y, z, "air");
  }
}

// mown lawns stay lawn (meadow, big lawn); the terraces get beds only between the tables
const meadow = (x, z) => Math.hypot(x - MEADOW_CENTRE[0], z - MEADOW_CENTRE[1]) < 11.8;
const bigLawn = (x, z) => x <= 10 && z >= 54 && z <= 84;
const terrace = (x, z) => x >= 20 && x <= 58 && z >= 40 && z <= 59;
const campfire = (x, z) => Math.hypot(x - CAMPFIRE_CENTRE[0], z - CAMPFIRE_CENTRE[1]) < 10.5;
const station = (x, z) => inBox(x, z, [3, 15, 18, 33]);
const plantable = (x, z) => {
  if (x < 2 || x > 83 || z < 2 || z > 143) return false;           // edge rows stay exactly as mapped
  if (meadow(x, z) || bigLawn(x, z) || campfire(x, z) || station(x, z)) return false;
  if (B_FOOTPRINTS.some((b) => inBox(x, z, b))) return false;
  const s = siteAt(x, z);
  if (s === "P") return true;
  return s === "." && z < 20 && x < 40;                               // the plain grass north-west of the station
};
const grassTop = (g, x, z) => name(g, x, top(x, z), z) === "grass_block";

// ---- trees ----------------------------------------------------------------------------------------------------------
// Monterey cypress: short thick trunk (2-3, a 2x1 or 2x2 base on the big ones), side limbs, and 3 flat pads of leaves,
// each wider than tall, stretched and leaning north-east (the wind), with ragged edges; the top pad flat.
function cypress(g, x, z, seed, big = true) {
  const r = rng(seed), y = top(x, z) + 1, t = 2 + Math.floor(r() * 2);
  const logs = [[0, 0]];
  if (big) logs.push([1, 0], ...(r() < 0.5 ? [[0, -1], [1, -1]] : []));
  for (const [dx, dz] of logs) {
    if (!grassTop(g, x + dx, z + dz) || top(x + dx, z + dz) !== top(x, z)) continue;
    for (let i = 0; i < t; i++) put(g, x + dx, y + i, z + dz, ...B.log("dark_oak", "y"));
  }
  const R = (big ? 4.5 : 3.5) + r() * 1.3, lean = 1 + Math.floor(r() * 2);
  const pads = [[0, R, 0], [1, R - 0.6, 1], [2, R - 1.8, 2]];
  for (const [L, rad, sh] of pads) {
    const cy = y + t + L, cx = x + sh * lean * 0.8, cz = z - sh * lean * 0.8;
    // a limb out toward the pad's centre
    if (L > 0) put(g, Math.round(cx), cy - 1, Math.round(cz), ...B.log("dark_oak", "y"));
    for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) {
      // ellipse stretched along the NE-SW diagonal (1.35 : 1)
      const a = (dx - dz) / Math.SQRT2, b = (dx + dz) / Math.SQRT2;
      const d = Math.hypot(a / 1.3, b / 0.85);
      const edge = rad + (r() - 0.6) * 1.4;
      if (d > edge) continue;
      if (L === 2 && r() < 0.15) continue;
      const lx = Math.round(cx + dx), lz = Math.round(cz + dz);
      put(g, lx, cy, lz, r() < 0.5 ? "spruce_leaves" : "dark_oak_leaves", LEAF);
    }
  }
}

// Monterey pine: tall bare spruce trunk, an umbrella of two flat courses at the top, a lower tuft on one side
function pine(g, x, z, seed) {
  const r = rng(seed), y = top(x, z) + 1, h = 8 + Math.floor(r() * 3);
  for (let i = 0; i < h; i++) if (!put(g, x, y + i, z, ...B.log("spruce", "y"))) {
    for (let j = 0; j < i; j++) g.set(x, y + j, z, "air");                 // a refused trunk cell: no tree here
    return;
  }
  const course = (cy, rad, ox = 0, oz = 0) => {
    for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++)
      if (Math.hypot(dx, dz) <= rad + (r() - 0.5)) put(g, x + ox + dx, cy, z + oz + dz, r() < 0.8 ? "spruce_leaves" : "dark_oak_leaves", LEAF);
  };
  course(y + h - 1, 4.3);
  course(y + h, 3.2, 1, -1);
  const sx = r() < 0.5 ? 1 : -1;
  put(g, x + sx, y + h - 4, z, ...B.log("spruce", "x"));
  course(y + h - 4, 1.6, sx * 3, 0);
}

function treeSpot(g, x, z, taken) {
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2]]) {
    const ax = x + dx, az = z + dz;
    if (!grassTop(g, ax, az) || !air(g, ax, top(ax, az) + 1, az) || !air(g, ax, top(ax, az) + 2, az)) continue;
    if (inBox(ax, az, [64, 76, 46, 64])) continue;                                   // never on the tunnel lid
    if (taken.some(([tx, tz]) => Math.hypot(tx - ax, tz - az) < 4)) continue;
    taken.push([ax, az]);
    return [ax, az];
  }
  return null;
}

// ---- picnic place ---------------------------------------------------------------------------------------------------
// extra retaining seating walls (z40 front of A, z47 inside B, z55 inside C) so the slope reads as 4-5 stepped terraces
function seatWall(g, x0, x1, z, yHigh, gaps) {
  for (let x = x0; x <= x1; x++) {
    if (gaps.some(([a, b]) => x >= a && x <= b)) continue;
    const zw = z + Math.round(Math.sin((2 * Math.PI * (x - x0)) / 24));
    const t = top(x, zw), b = name(g, x, t, zw);
    if (/slab|stair/.test(b) || !/grass_block|smooth_sandstone$/.test(b)) continue;
    let y = t + 1;
    for (; y <= Math.max(yHigh, t + 1); y++) if (!put(g, x, y, zw, "white_terracotta")) break;
    if (y > Math.max(yHigh, t + 1)) put(g, x, y, zw, ...B.slab("birch", "bottom"));
  }
}

// ---- overlook -------------------------------------------------------------------------------------------------------
// curved stepped seating terraces facing north: 4 steps rising southward, each a white_terracotta riser with a birch
// slab seat; a gentle arc in z along x. Built up from the ground (air only), each column only on a full ground block.
function overlookSteps(g, x0, x1, zBase) {
  const placed = [];
  for (let x = x0; x <= x1; x++) {
    const arc = Math.round(2.2 * Math.cos(((x - (x0 + x1) / 2) / (x1 - x0)) * Math.PI));
    for (let k = 0; k < 4; k++) {
      const z = zBase - arc + k, t = top(x, z), b = name(g, x, t, z);
      if (!/grass_block|smooth_sandstone$/.test(b)) continue;
      let ok = true;
      for (let y = t + 1; y <= t + k; y++) if (!put(g, x, y, z, "white_terracotta")) { ok = false; break; }
      if (ok) { put(g, x, t + k + 1, z, ...B.slab("birch", "bottom")); placed.push([x, z]); }
    }
  }
  return placed;
}

// ---- drifts ---------------------------------------------------------------------------------------------------------
const KINDS = ["grey-green", "ochre", "purple-blue", "coastal scrub", "wildflower", "grey-green", "ochre"];
function plantCell(g, x, z, kind, r) {
  const y = top(x, z) + 1, v = r();
  const two = (b) => air(g, x, y + 1, z) && put(g, x, y, z, b, { half: "lower" }) && g.set(x, y + 1, z, b, { half: "upper" });
  const mound = (b) => { if (put(g, x, y, z, b, LEAF) && r() < 0.3) put(g, x, y + 1, z, b, LEAF); };
  switch (kind) {
    case "grey-green":
      if (v < 0.42) put(g, x, y, z, "moss_carpet"); else if (v < 0.58) mound("azalea_leaves");
      else if (v < 0.62) put(g, x, y, z, "moss_block"); else if (v < 0.85) put(g, x, y, z, "fern"); else two("tall_grass");
      break;
    case "ochre":
      if (v < 0.4) two("tall_grass"); else if (v < 0.55) put(g, x, y, z, "short_grass");
      else if (v < 0.78) put(g, x, y, z, "dead_bush"); else if (v < 0.85) put(g, x, y, z, "dandelion"); else if (v < 0.86) two("sunflower"); else put(g, x, y, z, "fern");
      break;
    case "purple-blue":
      if (v < 0.25) put(g, x, y, z, "allium"); else if (v < 0.45) put(g, x, y, z, "cornflower");
      else if (v < 0.7) mound("flowering_azalea_leaves"); else if (v < 0.8) two("lilac"); else put(g, x, y, z, "short_grass");
      break;
    case "coastal scrub":
      if (v < 0.3) put(g, x, y, z, "sweet_berry_bush", { age: "3" }); else if (v < 0.55) put(g, x, y, z, "fern");
      else if (v < 0.75) mound("spruce_leaves"); else if (v < 0.88) mound("azalea_leaves"); else put(g, x, y, z, "moss_carpet");
      break;
    case "wildflower": {
      const f = ["allium", "cornflower", "oxeye_daisy", "poppy", "dandelion", "oxeye_daisy", "short_grass"];
      put(g, x, y, z, f[Math.floor(v * f.length)]);
      break;
    }
  }
}

export function build(g) {
  const tops = new Map();
  for (let x = 0; x <= 85; x++) for (let z = 0; z <= 145; z++) {
    let y = 30;
    while (y > 0 && air(g, x, y, z)) y--;
    tops.set(x * 1000 + z, y);
  }
  top = (x, z) => tops.get(x * 1000 + z) ?? 0;

  // trees: the plan's cypress trunks, each the heart of a clump of 3-5; pines at their trunks plus a few tall ones
  const taken = [];
  const r = rng(2207), pr0 = rng(77);
  CYPRESS_TRUNKS.forEach(([x0, z0], i) => {
    const s = treeSpot(g, x0, z0, taken);
    if (s) cypress(g, s[0], s[1], 100 + i, true);
    const extra = 1 + Math.floor(r() * 3);
    for (let k = 0; k < extra; k++) {
      const a = r() * Math.PI * 2, d = 5 + r() * 3;
      const x = Math.round(x0 + Math.cos(a) * d), z = Math.round(z0 + Math.sin(a) * d);
      if (!plantable(x, z) || terrace(x, z)) continue;
      const t = treeSpot(g, x, z, taken);
      if (t) cypress(g, t[0], t[1], 500 + i * 10 + k, r() < 0.5);
    }
  });
  PINE_TRUNKS.concat([[72, 28], [70, 88], [62, 112], [18, 34], [30, 20], [6, 114], [52, 120]]).forEach(([x, z], i) => {
    if (!plantable(x, z) && i >= PINE_TRUNKS.length) return;
    const s = treeSpot(g, x, z, taken);
    if (s) pine(g, s[0], s[1], 900 + i);
  });

  // picnic place: walls, then a table with an umbrella on every terrace band
  const RAMPS = [[30, 32], [46, 48]];
  seatWall(g, 20, 58, 40, 4, RAMPS);
  seatWall(g, 22, 56, 47, 5, RAMPS);
  seatWall(g, 22, 56, 55, 6, RAMPS);
  const cols = ["orange", "white", "red", "yellow", "light_blue"];
  [[24, 42], [52, 42], [38, 48], [26, 48], [52, 48], [38, 53], [28, 58], [44, 58], [54, 53]].forEach(([x, z], i) => {
    const y = top(x, z);
    if (!grassTop(g, x, z) || top(x + 1, z) !== y || top(x, z - 1) !== y || top(x, z + 1) !== y) return;
    if ([0, 1].some((dx) => [-1, 0, 1].some((dz) => !air(g, x + dx, y + 1, z + dz) || !air(g, x + dx, y + 2, z + dz)))) return;
    picnicTable(g, x, y, z);
    if (air(g, x + 2, y + 1, z) && top(x + 2, z) === y && grassTop(g, x + 2, z)) umbrella(g, x + 2, y, z, cols[i % cols.length], { rotation: (i * 4) % 16 });
  });

  // overlook: two curved stepped seating terraces, lamps at their ends on the promenade side
  const steps = [...overlookSteps(g, 4, 40, 101), ...overlookSteps(g, 6, 42, 107)];
  for (const [x, z] of [[3, 102], [41, 102], [5, 108], [43, 108]]) {
    const y = top(x, z);
    if (/grass_block|smooth_stone|light_gray_concrete/.test(name(g, x, y, z)) && [1, 2, 3, 4].every((d) => air(g, x, y + d, z))) lampPost(g, x, y + 1, z);
  }

  // parkway: a concrete median barrier between the two carriageways (z55..56), light_gray_concrete with a smooth_stone_slab top
  for (let x = 76; x <= 83; x++) for (const z of [55, 56]) {
    if (top(x, z) !== 2) continue;
    put(g, x, 3, z, "light_gray_concrete");
    if (x % 4 === 0 && z === 55) put(g, x, 4, z, ...B.lantern(false)); else put(g, x, 4, z, ...B.slab("smooth_stone", "bottom"));
  }

  // the park's planting spilling over the portal's top: leaf mounds along the lid edge and over the coping
  for (let z = 44; z <= 67; z++) for (const x of [72, 73, 74]) {
    if (inBox(x, z, [66, 73, 50, 55])) continue;
    const t = top(x, z);
    if (t !== 6 || !/grass_block|smooth_stone$/.test(name(g, x, t, z)) || (x < 74 && pr0() < 0.3)) continue;
    put(g, x, 7, z, pr0() < 0.35 ? "flowering_azalea_leaves" : "azalea_leaves", LEAF);
  }

  prune(g);

  // dense drifts: bands from warped noise, ~65% cover; the terraces only in beds between the table groups
  const kindN = noise2(31, 11), warp = noise2(57, 17), cover = noise2(83, 5);
  const pr = rng(4242);
  let planted = 0, cells = 0;
  for (let x = 2; x <= 83; x++) for (let z = 2; z <= 143; z++) {
    if (!plantable(x, z) || !grassTop(g, x, z) || !air(g, x, top(x, z) + 1, z)) continue;
    if (terrace(x, z) && !(((x - 20) % 12) < 3 && z % 5 !== 0)) continue;
    cells++;
    if (cover(x, z) * 0.6 + pr() * 0.4 > 0.57) continue;
    const w = warp(x, z) * 9;
    const k = Math.floor(kindN(x + w, z - w * 0.7) * KINDS.length * 1.6) % KINDS.length;
    plantCell(g, x, z, KINDS[k], pr);
    planted++;
  }
  console.log(`  drifts: planted ${planted} of ${cells} free bed cells, ${taken.length} trees, ${steps.length} overlook seats`);
}
