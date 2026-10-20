// Planting and trees (P5, elements 25, 26, 18): coastal scrub on the north and west bluffs, grey-green, ochre and purple
// drifts in every planting bed, the meadow with its mown loop kept clear, the lid planting, and the cypress and pine
// groves per plan.md's GROVES table. Plants and trees stand only on grass, dirt, podzol or moss at the surface, and only
// into air: the helpers refuse anything else, so an earlier part's cell is never touched.
import { readFileSync } from "node:fs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { drift, shrubMound, rng, mapHeight, GROVES, B_PADS, MEADOW } from "../vocab.mjs";
import { verge } from "./heights-data.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);
const SOIL = new Set(["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:moss_block"]);
const SITE = readFileSync(new URL("./sitemap.txt", import.meta.url), "utf8").split("\n");

const inBox = (x, z, b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const grow = (b, m) => ({ x0: b.x0 - m, x1: b.x1 + m, z0: b.z0 - m, z1: b.z1 + m });

// Cells with no planting: the Big Lawn (mown, no flowers), the Outpost play area, the portal face and cut walls,
// the terraces and promenade, the two overlook decks with their rails, and the building pads (plus 1 block).
const KEEP_CLEAR = [
  { x0: 66, x1: 119, z0: 62, z1: 85 },
  { x0: 66, x1: 119, z0: 17, z1: 44 },
  { x0: 36, x1: 42, z0: 74, z1: 97 },
  { x0: 50, x1: 119, z0: 88, z1: 108 },
  { x0: 72, x1: 83, z0: 48, z1: 58 },
  { x0: 98, x1: 109, z0: 48, z1: 58 },
  ...B_PADS.map((p) => grow(p, 1)),
];
// Trees also keep 4 blocks off the pads, so a crown does not hang over a building site.
const TREE_KEEP = B_PADS.map((p) => grow(p, 4));
// The meadow's mown loop (2 wide) stays grass: a ring between the outer and inner rectangles.
const MOWN_OUTER = { x0: 52, x1: 65, z0: 21, z1: 43 }, MOWN_INNER = { x0: 54, x1: 63, z0: 23, z1: 41 };
const onMownLoop = (x, z) => inBox(x, z, MOWN_OUTER) && !inBox(x, z, MOWN_INNER);
const SCRUB_N = { x0: 58, x1: 119, z0: 47, z1: 55 };   // north bluff, under the Cliff Walk rail
const SCRUB_W = { x0: 50, x1: 61, z0: 46, z1: 78 };    // west bluff
// [cypress, pine] per grove, in GROVES order
const TREE_MIX = [[10, 3], [8, 1], [5, 0], [6, 2], [6, 2], [3, 0], [4, 1], [6, 1]];
// The highway verge, west of the parkway sweep, gets its own clumps.
const EXTRA_GROVES = [{ x0: 4, x1: 22, z0: 34, z1: 60 }];

const site = (x, z) => SITE[Math.floor(z / 2)]?.[Math.floor(x / 2)] ?? "W";
const planted = (x, z) => (site(x, z) === "P" || site(x, z) === "." || verge(x, z)) && !KEEP_CLEAR.some((b) => inBox(x, z, b)) && !onMownLoop(x, z);

// A seeded hash in [0, 1) for integer inputs: clumps and patches come out the same on every build.
function hash(...k) {
  let h = 0x9e3779b9;
  for (const v of k) { h = Math.imul(h ^ (v | 0), 0x85ebca6b); h ^= h >>> 13; }
  return ((Math.imul(h ^ (h >>> 16), 0xc2b2ae35) >>> 0) / 4294967296);
}

// The top solid block's y at (x, z), and that y only if the block there is soil a plant can stand on.
function surfaceAt(g, x, z) {
  for (let y = 29; y >= 1; y--) { const b = g.blockAt(x, y, z); if (b && !AIR.has(b)) return y; }
  return null;
}
function soilTop(g, x, z) {
  const y = surfaceAt(g, x, z);
  return y !== null && SOIL.has(g.blockAt(x, y, z)) ? y : null;
}

// Plant kind by a 4 x 4 hash, so the drifts come in clumps: meadow flowers in the meadow, ochre on the scrub,
// purples and grey-greens elsewhere.
function kindAt(x, z) {
  const h = hash(Math.floor(x / 4), Math.floor(z / 4), 5);
  if (inBox(x, z, MEADOW)) return h < 0.45 ? "meadow" : "grey-green";
  if (inBox(x, z, SCRUB_N) || inBox(x, z, SCRUB_W)) return h < 0.5 ? "ochre" : "grey-green";
  return h < 0.16 ? "purple" : h < 0.4 ? "ochre" : "grey-green";
}

// Shrub heaps on the bluffs: each footprint must sit on one flat level of soil, so no leaf hangs over air.
function placeScrub(g, zone, want, seed) {
  const R = rng(seed), centres = [];
  let placed = 0, refused = 0;
  for (let tries = 0; placed < want && tries < 20000; tries++) {
    const w = 3 + Math.floor(R() * 3), d = 3 + Math.floor(R() * 2), h = 1 + Math.floor(R() * 2);
    const cx = zone.x0 + Math.floor(R() * (zone.x1 - zone.x0 + 1)), cz = zone.z0 + Math.floor(R() * (zone.z1 - zone.z0 + 1));
    if (centres.some(([x, z]) => Math.max(Math.abs(x - cx), Math.abs(z - cz)) < 5)) continue;
    const rx = Math.floor(w / 2), rz = Math.floor(d / 2);
    let level = null, flat = true;
    for (let x = cx - rx; x <= cx + rx && flat; x++) for (let z = cz - rz; z <= cz + rz; z++) {
      if (!planted(x, z) || !inBox(x, z, zone)) { flat = false; break; }
      const t = soilTop(g, x, z);
      if (t === null || (level !== null && t !== level)) { flat = false; break; }
      level = t;
    }
    if (!flat) continue;
    const r = shrubMound(g, cx, cz, w, d, h, level + 1, { seed: placed });
    refused += r.refused.length;
    centres.push([cx, cz]);
    placed++;
  }
  return { placed, refused };
}

// Trees: Monterey cypress and pine in clumps. A cypress is a short thick trunk (2 x 2 where the ground allows) and a
// wide, flat, layered crown blown east: a dark_oak_leaves underlayer, a spruce_leaves top, a smaller upper tier pushed
// further east. A pine is a tall spruce trunk with a flat umbrella of spruce leaves. Leaves only go into air.
const LEAF = (b) => [b, { persistent: "true", distance: "1", waterlogged: "false" }];
const TREE_SPOTS = [];
const LEAF_CELLS = [];
function putAir(g, x, y, z, ...b) {
  if (x < 0 || x > 119 || z < 0 || z > 145 || y > 30) return false;
  if (!g.isAir(x, y, z)) return false;
  if (TREE_KEEP.some((p) => inBox(x, z, grow(p, -3)))) return false;
  g.set(x, y, z, ...b); return true;
}
function disc(g, cx, y, cz, rx, rz, block, R) {
  for (let dz = -Math.ceil(rz); dz <= Math.ceil(rz); dz++) for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx++) {
    const e = (dx * dx) / (rx * rx) + (dz * dz) / (rz * rz);
    if (e > 1.05 || (e > 0.7 && R() < 0.3)) continue;
    const px = Math.round(cx + dx), pz = Math.round(cz + dz);
    if (putAir(g, px, y, pz, ...LEAF(block))) LEAF_CELLS.push([px, y, pz]);
  }
}
function cypressTree(g, x, top, z, R) {
  const fat = [[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => soilTop(g, x + dx, z + dz) === top);
  const h = 3 + Math.floor(R() * 2);
  for (let y = top + 1; y <= top + h; y++) for (const [dx, dz] of fat ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]]) g.set(x + dx, y, z + dz, ...B.log("dark_oak", "y"));
  // the leaning limb: two logs out east at the trunk top
  const t = top + h, lx = x + (fat ? 2 : 1);
  g.set(lx, t, z, ...B.log("dark_oak", "x")); g.set(lx + 1, t + 1, z, ...B.log("dark_oak", "x"));
  const cx = x + 2 + R() * 1.5, cz = z + (fat ? 0.5 : 0), rx = 4.5 + R() * 1.5, rz = 3 + R() * 1.2;
  disc(g, cx, t + 1, cz, rx, rz, "dark_oak_leaves", R);
  disc(g, cx + 0.5, t + 2, cz, rx - 0.6, rz - 0.5, "spruce_leaves", R);
  if (R() < 0.6) { disc(g, cx + 2.5, t + 3, cz + (R() < 0.5 ? -1 : 1), rx - 2.2, rz - 1.3, "dark_oak_leaves", R); disc(g, cx + 3, t + 4, cz, rx - 3, rz - 2, "spruce_leaves", R); }
}
function pineTree(g, x, top, z, R) {
  const h = 9 + Math.floor(R() * 3);
  for (let y = top + 1; y <= top + h; y++) g.set(x, y, z, ...B.log("spruce", "y"));
  disc(g, x + 0.5, top + h, z, 3.2, 3, "spruce_leaves", R);
  disc(g, x + 0.5, top + h + 1, z, 2.2, 2, "spruce_leaves", R);
  disc(g, x + 1, top + h - 3, z, 1.6, 1.2, "spruce_leaves", R);
}
function placeGrove(g, grove, nCyp, nPine, seed) {
  const R = rng(seed);
  const total = nCyp + nPine;
  let placed = 0;
  // clumps of 3-6 cypress round a centre, then the pines on their own
  const clumps = Math.max(1, Math.round(nCyp / 4));
  for (let c = 0; c < clumps; c++) {
    let cx = 0, cz = 0, ok = false;
    for (let t = 0; t < 400 && !ok; t++) {
      cx = grove.x0 + Math.floor(R() * (grove.x1 - grove.x0 + 1)); cz = grove.z0 + Math.floor(R() * (grove.z1 - grove.z0 + 1));
      ok = planted(cx, cz) && !TREE_KEEP.some((b) => inBox(cx, cz, b)) && !TREE_SPOTS.some(([sx, sz]) => Math.hypot(sx - cx, sz - cz) < 9);
    }
    if (!ok) continue;
    const want = 3 + Math.floor(R() * 4);
    for (let i = 0, tries = 0; i < want && tries < 200; tries++) {
      const x = cx + Math.round((R() - 0.5) * 12), z = cz + Math.round((R() - 0.5) * 10);
      if (!planted(x, z) || TREE_KEEP.some((b) => inBox(x, z, b)) || TREE_SPOTS.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 4.5)) continue;
      const top = soilTop(g, x, z);
      if (top === null) continue;
      cypressTree(g, x, top, z, R); TREE_SPOTS.push([x, z]); i++; placed++;
    }
  }
  for (let i = 0, tries = 0; i < Math.max(1, nPine) && tries < 400; tries++) {
    const x = grove.x0 + Math.floor(R() * (grove.x1 - grove.x0 + 1)), z = grove.z0 + Math.floor(R() * (grove.z1 - grove.z0 + 1));
    if (!planted(x, z) || TREE_KEEP.some((b) => inBox(x, z, b)) || TREE_SPOTS.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 5)) continue;
    const top = soilTop(g, x, z);
    if (top === null) continue;
    pineTree(g, x, top, z, R); TREE_SPOTS.push([x, z]); i++; placed++;
  }
  return { placed, refused: 0 };
}

// Dense native planting: irregular sweeping bands (a wavy diagonal field, so the bands bend like the paths) cycling
// grey-green grasses and ferns, purple flowers, ochre dead bush and berries, moss, warm wildflowers and low azalea
// shrubs. About 85% of each band is planted. Kept free: the 3 x 3 cells round each hidden-light grid point (the lighting
// part sets the light and its moss ring there) and a scatter of path-side cells where a lamp post can stand.
const PATHISH = new Set(["minecraft:smooth_sandstone", "minecraft:smooth_sandstone_slab", "minecraft:smooth_stone", "minecraft:smooth_stone_slab", "minecraft:light_gray_concrete", "minecraft:gray_concrete", "minecraft:white_concrete", "minecraft:yellow_concrete"]);
function bandAt(x, z) {
  const v = x * 0.07 + z * 0.1 + 2.2 * Math.sin(x * 0.045 + z * 0.021) + 1.6 * Math.cos(z * 0.052 - x * 0.013);
  return ((Math.floor(v) % 7) + 7) % 7;
}
function densePlant(g) {
  let n = 0;
  const pick = (a, h) => a[Math.floor(h * a.length) % a.length];
  for (let z = 2; z <= 143; z++) for (let x = 2; x <= 117; x++) {
    if (!planted(x, z)) continue;
    const gx = ((x - 5) % 11 + 11) % 11, gz = ((z - 5) % 11 + 11) % 11;
    if ((gx <= 1 || gx === 10) && (gz <= 1 || gz === 10)) continue;
    const top = soilTop(g, x, z);
    if (top === null || !g.isAir(x, top + 1, z)) continue;
    const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const t = surfaceAt(g, x + dx, z + dz); return t !== null && PATHISH.has(g.blockAt(x + dx, t, z + dz)); });
    const h = hash(x, z, 41), h2 = hash(x, z, 77);
    if (side && h < 0.35) continue;
    let band = bandAt(x, z);
    if (inBox(x, z, MEADOW)) band = [0, 1, 5, 0, 5, 1, 0][band];
    if (h > 0.86) continue;
    const plant = (b, st) => { g.set(x, top + 1, z, b, st); n++; };
    switch (band) {
      case 0: case 3: {
        const b = pick(["tall_grass", "tall_grass", "short_grass", "fern", "large_fern", "tall_grass"], h2);
        if ((b === "tall_grass" || b === "large_fern") && g.isAir(x, top + 2, z)) { plant(b, { half: "lower" }); g.set(x, top + 2, z, b, { half: "upper" }); }
        else plant(b === "large_fern" ? "fern" : b === "tall_grass" ? "short_grass" : b, {});
        break;
      }
      case 1: plant(pick(["allium", "cornflower", "cornflower", "allium", "short_grass"], h2), {}); break;
      case 2: {
        if (h2 < 0.3) g.set(x, top, z, "coarse_dirt");
        const b = pick(["dead_bush", "sweet_berry_bush", "short_grass", "dead_bush"], hash(x, z, 9));
        plant(b, b === "sweet_berry_bush" ? { age: "3" } : {}); break;
      }
      case 4: g.set(x, top, z, "moss_block"); plant(h2 < 0.6 ? "moss_carpet" : "fern", {}); break;
      case 5: plant(pick(["poppy", "oxeye_daisy", "dandelion", "oxeye_daisy", "short_grass"], h2), {}); break;
      case 6: {
        const leaf = h2 < 0.3 ? "flowering_azalea_leaves" : "azalea_leaves";
        if (h2 > 0.85) { plant(h2 > 0.93 ? "flowering_azalea" : "azalea", {}); break; }
        plant(...LEAF(leaf));
        if (hash(x >> 1, z >> 1, 3) < 0.4 && g.isAir(x, top + 2, z)) g.set(x, top + 2, z, ...LEAF(h2 < 0.15 ? "flowering_azalea_leaves" : "azalea_leaves"));
        break;
      }
    }
  }
  return n;
}

export function build(g) {
  let shrubs = 0, trees = 0, cells = 0, refused = 0;

  // 25: coastal scrub on the bluffs
  for (const [zone, want, seed] of [[SCRUB_N, 22, 11], [SCRUB_W, 10, 12]]) {
    const r = placeScrub(g, zone, want, seed);
    shrubs += r.placed; refused += r.refused;
  }

  // 26: cypress and pine groves
  [...GROVES, ...EXTRA_GROVES].forEach((grove, i) => {
    const [nCyp, nPine] = TREE_MIX[i] ?? [0, 0];
    const r = placeGrove(g, grove, nCyp, nPine, 100 + i * 17);
    trees += r.placed; refused += r.refused;
  });

  // Prune leaves that would stick out on their own: a crown leaf needs two solid face neighbours.
  for (let pass = 0; pass < 3; pass++) for (const [x, y, z] of LEAF_CELLS) {
    if (g.isAir(x, y, z)) continue;
    const n = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].filter(([a, b, c]) => !g.isAir(x + a, y + b, z + c)).length;
    if (n < 2) g.set(x, y, z, "air");
  }

  // Ground patches in the beds: a few grass tops become podzol or moss, in clumps, so the planting does not read as one
  // flat green. Only grass on the terrain's own surface (the mapped height), outside the keep-clear cells: the tunnel
  // lid's grass at y 10 belongs to the portal part and is locked.
  for (let z = 0; z <= 145; z++) for (let x = 0; x <= 119; x++) {
    if (!planted(x, z)) continue;
    const top = soilTop(g, x, z);
    if (top === null || top !== mapHeight(x, z) || g.blockAt(x, top, z) !== "minecraft:grass_block") continue;
    const p = hash(Math.floor(x / 3), Math.floor(z / 3), 9);
    if (p > 0.92) g.set(x, top, z, p > 0.96 ? "podzol" : "moss_block");
  }

  // 25 and 18: plant drifts on every planted soil cell, one cell at a time so each drift keeps its own clumping
  for (let z = 0; z <= 145; z++) for (let x = 0; x <= 119; x++) {
    if (!planted(x, z)) continue;
    const top = soilTop(g, x, z);
    if (top === null) continue;
    const r = drift(g, kindAt(x, z), x, z, x, z, top, { seed: 7 });
    cells += r.placed; refused += r.refused.length;
  }

  cells += densePlant(g);
  console.log(`planting: ${shrubs} shrub heaps, ${trees} trees, ${cells} plant cells, ${refused} refused writes`);
}
