// A farmland demonstration on real terrain (thread 0011): fields, pastures and orchards laid to the land's contours,
// not in squares. Terrain from irl-copy (IGN LiDAR HD ground, Pays d'Auge, Normandy); everything on it is ours.
//   parcels    seeds jittered over the land, each cell to the nearest seed by a distance that counts height three
//              times over (so fields stretch along the contours, as bocage fields do), cut by the farm tracks
//   tracks     least-slope routes between the land's edges and the farmstead: sunken lanes between hedgebanks
//   use        by each parcel's slope, aspect and distance to water: water meadow on the valley floor, orchard on
//              south-facing banks (rows along the contours), pasture on the steep, woodland on the steepest, arable on
//              the gentle ground in contour strips (the crop changes every 3 blocks of height, so bands follow the
//              land), terraced with stone risers where arable is steep
//   bounds     hedgerows with trees on most parcel edges, drystone walls high up, gates where a field meets a track
//   node src/farmland/farmland.mjs <land.nbt> <out world dir> [--seed n] [--holding mixed|livestock]
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { writeWorld } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/anvil.mjs";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { farmLayout } from "./layout.mjs";

const argv = process.argv.slice(2), [LAND, OUT] = argv, SEED = +(argv.includes("--seed") ? argv[argv.indexOf("--seed") + 1] : 7);
const HOLDING = argv.includes("--holding") ? argv[argv.indexOf("--holding") + 1] : "mixed";
const hash = (...n) => { let h = 2166136261 ^ SEED; for (const v of n) { h ^= v + 0x9e3779b9; h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; };

// ---- 1. the ground: the top natural block of each column; buildings' columns filled from their neighbours, smoothed
const src = await load(LAND), [X, Y0, Z] = src.size;
const NATURAL = /^minecraft:(dirt|stone|grass_block|sand|clay|tuff|water|gravel|coarse_dirt|mud|dirt_path|polished_andesite|smooth_stone|andesite)/;
const top = new Float32Array(X * Z).fill(NaN), water = new Uint8Array(X * Z), built = new Uint8Array(X * Z);
for (const [, c] of src.cells) {
  const [x, y, z] = c.pos, i = z * X + x;
  if (NATURAL.test(c.block)) { if (!(top[i] >= y)) top[i] = y; if (c.block.startsWith("minecraft:water")) water[i] = 1; }
  else if (!/leaves|log/.test(c.block)) built[i] = 1;
}
for (let i = 0; i < X * Z; i++) if (built[i]) top[i] = NaN;
for (let pass = 0; pass < 200; pass++) {             // fill the holes from the edges in
  let left = 0;
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = z * X + x; if (!isNaN(top[i])) continue;
    let s = 0, n = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const v = top[zz * X + xx]; if (!isNaN(v)) { s += v; n++; } }
    if (n) top[i] = s / n; else left++;
  }
  if (!left) break;
}
const L = farmLayout({ top, water, X, Z, seed: SEED, holding: HOLDING });
const { Hs, H, slope, wet, dWater, road, parcel, FARM, farm, stats, use, stock, cropsOf, hMin, hMax } = L;

// ---- 4. lay it into voxels
const groundTop = (x, z) => (use.get(parcel[z * X + x]) === "terraces" ? Math.floor(Hs[z * X + x] / 2) * 2 : H(x, z));
let maxH = 0; for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) maxH = Math.max(maxH, groundTop(x, z));
const v = new Voxels([X, maxH + 14, Z]);
// "name[k=v,...]" into the voxels' name and state object
const parse = (b) => { const m = /^([^\[]+)(?:\[(.*)\])?$/.exec(b); return [m[1], m[2] ? Object.fromEntries(m[2].split(",").map((kv) => kv.split("="))) : undefined]; };
const set = (x, y, z, b) => { if (x >= 0 && z >= 0 && x < X && z < Z && y >= 0 && y < v.size[1]) v.set(x, y, z, ...parse(b)); };
const LEAF = (t = "oak") => `minecraft:${t}_leaves[distance=1,persistent=true,waterlogged=false]`;
const tree = (x, z, y, kind = "oak", h = 4, r = 2) => {
  for (let k = 1; k <= h; k++) set(x, y + k, z, `minecraft:${kind}_log[axis=y]`);
  for (let dy = h - 1; dy <= h + 1; dy++) { const rr = dy === h + 1 ? r - 1 : r; for (let dz = -rr; dz <= rr; dz++) for (let dx = -rr; dx <= rr; dx++) if (dx * dx + dz * dz <= rr * rr + 1 && !(dx === 0 && dz === 0 && dy < h + 1)) if (!v.get(x + dx, y + dy, z + dz)) set(x + dx, y + dy, z + dz, LEAF(kind)); }
};
const appleTree = (x, z, y) => { set(x, y + 1, z, "minecraft:oak_log[axis=y]"); set(x, y + 2, z, "minecraft:oak_log[axis=y]");
  for (let dy = 2; dy <= 4; dy++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { if (dy === 4 && Math.abs(dx) + Math.abs(dz) === 2) continue; if (dx === 0 && dz === 0 && dy < 3) continue; set(x + dx, y + dy, z + dz, hash(x + dx, z + dz, dy) < 0.25 ? "minecraft:flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]" : LEAF("oak")); } };
// a field's edge, drawn once: on the higher-numbered parcel's side of each shared edge, by an 8-neighbour test (so the
// line is 4-connected: no diagonal gap an animal could slip through); and along every lane. Returns the parcel across.
const N8 = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const boundary = (x, z) => { const p = parcel[z * X + x]; if (p < 0) return null; for (const [dx, dz] of N8) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const j = zz * X + xx, q = parcel[j]; if (road[j] || wet[j]) return -1; if (q >= 0 && q < p) return q; } return null; };
// each stock's enclosure: post-and-rail for horses, oak rails for pigs, drystone for sheep, a 2-high hedge for cattle
const PEN = { horses: "spruce_fence", pigs: "oak_fence", sheep: "cobblestone_wall", cattle: "hedge" };
const fenceCells = [], gatesWanted = new Map();
const besideRoad = (x, z) => [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dz]) => road[(z + dz) * X + x + dx]);

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = z * X + x, p = parcel[i], u = use.get(p), g = road[i] ? H(x, z) : wet[i] ? H(x, z) - 1 : groundTop(x, z);
  for (let y = 0; y < g - 3; y++) set(x, y, z, "minecraft:stone");
  for (let y = Math.max(0, g - 3); y < g; y++) set(x, y, z, "minecraft:dirt");
  if (wet[i]) { set(x, g, z, "minecraft:water"); set(x, g - 1, z, "minecraft:clay"); continue; }
  if (road[i]) {                                              // a lane: packed earth, a grass crown, wheel ruts of gravel
    const r = hash(x, z, 5); set(x, g, z, r < 0.55 ? "minecraft:dirt_path" : r < 0.8 ? "minecraft:coarse_dirt" : "minecraft:gravel"); continue;
  }
  // a terrace riser: where this cell stands above a lower neighbour in the same terraced parcel, a mossy stone face
  if (u === "terraces") for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; if (parcel[zz * X + xx] === p && groundTop(xx, zz) < g) { for (let y = groundTop(xx, zz) + 1; y < g; y++) set(x, y, z, hash(x, y, z) < 0.6 ? "minecraft:cobblestone" : "minecraft:mossy_cobblestone"); set(x, g - 1, z, "minecraft:mossy_cobblestone"); break; } }
  const across = boundary(x, z);
  if (across !== null && u !== "farmstead" && use.get(across) !== "farmstead") {   // the field's edge
    set(x, g, z, "minecraft:grass_block[snowy=false]");
    const pen = stock.has(p) ? PEN[stock.get(p)] : stock.has(across) ? PEN[stock.get(across)] : null;
    if (pen && pen !== "hedge") {                            // a stock fence or wall: states joined after
      const kind = pen === "cobblestone_wall" && hash(x, z, 6) > 0.6 ? "mossy_cobblestone_wall" : pen;
      fenceCells.push([x, g + 1, z, kind]);
      if (across === -1 && stock.has(p)) { if (!gatesWanted.has(p)) gatesWanted.set(p, []); gatesWanted.get(p).push([x, g + 1, z]); }
      continue;
    }
    if (pen === "hedge") {                                   // a cattle hedge: 2 high, laid thick, a tree now and then
      set(x, g + 1, z, LEAF(hash(x, z, 7) < 0.85 ? "oak" : "birch")); set(x, g + 2, z, LEAF());
      if (across === -1 && stock.has(p)) { if (!gatesWanted.has(p)) gatesWanted.set(p, []); gatesWanted.get(p).push([x, g + 1, z]); }
      if (hash(x, z, 9) < 0.02) tree(x, z, g, "oak", 5, 2);
      continue;
    }
    const high = (g - hMin) / (hMax - hMin) > 0.75 || u === "terraces";
    if (across === -1 && (x + z + p) % 23 < 3) { set(x, g + 1, z, "minecraft:spruce_fence_gate[facing=north,in_wall=false,open=false,powered=false]"); continue; }
    if (high) { fenceCells.push([x, g + 1, z, hash(x, z, 6) < 0.6 ? "cobblestone_wall" : "mossy_cobblestone_wall"]); continue; }
    set(x, g + 1, z, LEAF(hash(x, z, 7) < 0.85 ? "oak" : "birch")); if (hash(x, z, 8) < 0.25) set(x, g + 2, z, LEAF());
    if (hash(x, z, 9) < 0.014) tree(x, z, g, hash(x, z, 10) < 0.8 ? "oak" : "birch", 4 + Math.floor(hash(x, z, 11) * 3), 2);
    continue;
  }
  const r = hash(x, z, 12);
  switch (u) {
    case "arable": {
      if (dWater[i] < 2) { set(x, g, z, "minecraft:grass_block[snowy=false]"); break; }
      const crops = cropsOf(p), band = Math.floor(Hs[i] / 3) % crops.length, [crop, max] = crops[band];
      // a balk of grass between bands, where the band changes
      const nb = Math.floor((Hs[i] + 0.5) / 3) % crops.length;
      if (nb !== band && r < 0.7) { set(x, g, z, "minecraft:grass_block[snowy=false]"); if (r < 0.15) set(x, g + 1, z, "minecraft:poppy"); break; }
      // near ripe, so a field reads as its crop's colour (wheat gold, carrots and potatoes green, beets dark leaf)
      set(x, g, z, "minecraft:farmland[moisture=7]"); set(x, g + 1, z, `minecraft:${crop}[age=${Math.min(max, Math.round(max * (0.85 + 0.3 * hash(p, band, x >> 3, z >> 3))))}]`); break;
    }
    case "terraces": {
      const crops = cropsOf(p), [crop, max] = crops[Math.floor(g / 2) % crops.length];
      set(x, g, z, "minecraft:farmland[moisture=7]"); set(x, g + 1, z, `minecraft:${crop}[age=${max}]`); break;
    }
    case "orchard": {
      set(x, g, z, "minecraft:grass_block[snowy=false]");
      // rows along the contours: a row on every 3rd block of height, a tree every 5 along it
      const onRow = Math.abs(Hs[i] / 4 - Math.round(Hs[i] / 4)) < 0.1, every = (x * 3 + z * 7) % 7 === 0;
      if (onRow && every && !v.get(x, g + 1, z)) appleTree(x, z, g);
      else if (r < 0.25) set(x, g + 1, z, r < 0.2 ? "minecraft:short_grass" : "minecraft:dandelion");
      if (r > 0.997) set(x, g + 1, z, "enterprise:decor_beehive[facing=south]".replace("enterprise:decor_beehive[facing=south]", "minecraft:beehive[facing=south,honey_level=3]"));
      break;
    }
    case "pasture": {                                       // grazed short; trampled where stock gather; by kind
      const k = stock.get(p);
      if (k === "pigs") { set(x, g, z, r < 0.35 ? "minecraft:rooted_dirt" : r < 0.55 ? "minecraft:coarse_dirt" : "minecraft:grass_block[snowy=false]"); break; }
      set(x, g, z, r < 0.04 ? "minecraft:coarse_dirt" : "minecraft:grass_block[snowy=false]");
      if (k === "sheep") { if (r > 0.998) set(x, g + 1, z, hash(x, z, 14) < 0.5 ? "minecraft:mossy_cobblestone" : "minecraft:andesite"); else if (r > 0.994) { set(x, g + 1, z, LEAF("oak")); } else if (r > 0.9 && r < 0.92) set(x, g + 1, z, "minecraft:dandelion"); }
      else if (k === "cattle") { if (r > 0.75 && r < 0.88) set(x, g + 1, z, "minecraft:short_grass"); else if (r >= 0.88 && r < 0.9) set(x, g + 1, z, "minecraft:buttercup".replace("buttercup", "dandelion")); if (r > 0.9988) tree(x, z, g, "oak", 6, 3); }
      else if (r > 0.92 && r < 0.95) set(x, g + 1, z, "minecraft:short_grass");
      break;
    }
    case "meadow": {
      set(x, g, z, "minecraft:grass_block[snowy=false]");
      if (dWater[i] < 3 && r < 0.35) { set(x, g + 1, z, "minecraft:sugar_cane[age=0]"); set(x, g + 2, z, "minecraft:sugar_cane[age=0]"); }
      else if (r < 0.45) set(x, g + 1, z, "minecraft:short_grass");
      else if (r < 0.52) { set(x, g + 1, z, "minecraft:tall_grass[half=lower]"); set(x, g + 2, z, "minecraft:tall_grass[half=upper]"); }
      else if (r < 0.6) set(x, g + 1, z, ["minecraft:azure_bluet", "minecraft:oxeye_daisy", "minecraft:cornflower", "minecraft:blue_orchid"][Math.floor(r * 100) % 4]);
      else if (r > 0.9975) tree(x, z, g, "dark_oak", 4, 3);
      break;
    }
    case "woodland": {
      set(x, g, z, r < 0.3 ? "minecraft:podzol[snowy=false]" : "minecraft:grass_block[snowy=false]");
      if (r > 0.975) tree(x, z, g, r > 0.99 ? "birch" : "oak", 5 + Math.floor(hash(x, z, 13) * 3), 2);
      else if (r < 0.15) set(x, g + 1, z, "minecraft:fern");
      break;
    }
    default: set(x, g, z, "minecraft:grass_block[snowy=false]");
  }
}
// each pasture's furniture, by its stock, round its middle
const centreOf = (p) => { let cx = 0, cz = 0, n = 0; for (let z = 0; z < Z; z += 2) for (let x = 0; x < X; x += 2) if (parcel[z * X + x] === p) { cx += x; cz += z; n++; } return n < 30 ? null : [Math.round(cx / n), Math.round(cz / n)]; };
const clear = (x, z, r) => { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (parcel[(z + dz) * X + x + dx] < 0) return false; return true; };
const shelter = (cx, cz, g, wood) => {                       // an open field shelter: posts, a slab roof, hay inside, a trough
  for (const [dx, dz] of [[0, 0], [4, 0], [0, 2], [4, 2]]) for (let y = 1; y <= 3; y++) set(cx + dx, g + y, cz + dz, `minecraft:${wood}_fence[east=false,north=false,south=false,waterlogged=false,west=false]`);
  for (let dx = 0; dx <= 4; dx++) for (const y of [1, 2, 3]) set(cx + dx, g + y, cz - 1 + 0, dx === 0 || dx === 4 ? `minecraft:${wood}_fence[east=false,north=false,south=false,waterlogged=false,west=false]` : `minecraft:${wood}_planks`);   // the back wall against the weather
  for (let dx = -1; dx <= 5; dx++) for (let dz = -2; dz <= 3; dz++) set(cx + dx, g + 4, cz + dz, `minecraft:${wood}_slab[type=bottom,waterlogged=false]`);
  set(cx + 1, g + 1, cz, "minecraft:hay_block[axis=x]"); set(cx + 2, g + 1, cz, "minecraft:hay_block[axis=x]");
  set(cx + 3, g + 1, cz + 3, "minecraft:water_cauldron[level=3]"); set(cx + 4, g + 1, cz + 3, "minecraft:water_cauldron[level=3]");
  for (const [dx, dz] of [[2, 3], [3, 4], [2, 4], [4, 4]]) set(cx + dx, g, cz + dz, "minecraft:coarse_dirt");   // trampled by the trough
};
for (const [p, k] of stock) {
  const c = centreOf(p); if (!c) continue; const [cx, cz] = c, g = H(cx, cz);
  if (k === "sheep") {
    // a round drystone sheepfold, its gate to the south, and a dew pond up the slope
    if (clear(cx, cz, 4)) { for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) { const d = Math.hypot(dx, dz); const y = H(cx + dx, cz + dz); if (d > 2.6 && d < 3.6) fenceCells.push([cx + dx, y + 1, cz + dz, hash(dx, dz) < 0.6 ? "cobblestone_wall" : "mossy_cobblestone_wall"]); else if (d <= 2.6 && hash(dx, dz, 3) < 0.15) set(cx + dx, y + 1, cz + dz, "minecraft:hay_block[axis=y]"); }
      gatesWanted.set(`fold${p}`, [[cx, H(cx, cz + 3) + 1, cz + 3]]); }
    let best = null; for (let dz = -10; dz <= 10; dz += 2) for (let dx = -10; dx <= 10; dx += 2) { const x = cx + dx, z = cz + dz; if (x < 3 || z < 3 || x >= X - 3 || z >= Z - 3 || !clear(x, z, 2) || Math.hypot(dx, dz) < 6) continue; if (!best || Hs[z * X + x] > Hs[best[1] * X + best[0]]) best = [x, z]; }
    if (best) { const [px, pz] = best, py = H(px, pz); for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const d = Math.hypot(dx, dz); if (d <= 1.5) { set(px + dx, py, pz + dz, "minecraft:water"); set(px + dx, py - 1, pz + dz, "minecraft:clay"); } else if (d <= 2.3) set(px + dx, py, pz + dz, "minecraft:mossy_cobblestone"); } }
  } else if (k === "cattle") {
    if (clear(cx, cz, 4)) shelter(cx - 2, cz - 1, g, "dark_oak");
    for (const [dx, dz] of [[-7, 4], [6, -5]]) if (clear(cx + dx, cz + dz, 3)) tree(cx + dx, cz + dz, H(cx + dx, cz + dz), "oak", 6, 3);   // shade trees
  } else if (k === "horses") {
    if (clear(cx, cz, 4)) shelter(cx - 2, cz - 1, g, "spruce");
    // two cross-rail jumps
    for (const [dx, dz] of [[-6, 4], [5, 5]]) if (clear(cx + dx, cz + dz, 2)) { const y = H(cx + dx, cz + dz); set(cx + dx - 1, y + 1, cz + dz, "minecraft:birch_fence[east=true,north=false,south=false,waterlogged=false,west=false]"); set(cx + dx, y + 1, cz + dz, "minecraft:white_carpet"); set(cx + dx + 1, y + 1, cz + dz, "minecraft:birch_fence[east=false,north=false,south=false,waterlogged=false,west=true]"); }
  } else if (k === "pigs") {
    // a mud wallow and a pig ark (an A-frame of stairs), a trough
    if (clear(cx, cz, 3)) { for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) set(cx + dx, g, cz + dz, dx === 0 && dz === 0 ? "minecraft:water" : "minecraft:mud"); }
    const ax = cx + 4, az = cz - 1; if (clear(ax, az, 2)) { const y = H(ax, az); for (let dz = 0; dz < 3; dz++) { set(ax, y + 1, az + dz, "minecraft:spruce_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]"); set(ax + 1, y + 1, az + dz, "minecraft:spruce_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]"); } set(ax - 1, y + 1, az + 3, "minecraft:water_cauldron[level=3]"); }
  }
}
// the fences and walls, their states joined to whatever stands beside them; then a gate in each pen, onto its lane
const isPen = (b) => b && /_fence|_wall|_fence_gate/.test(b.block);
for (const [x, y, z, kind] of fenceCells) set(x, y, z, `minecraft:${kind}`);
for (const [x, y, z, kind] of fenceCells) {
  const st = {}; for (const [dx, dz, f] of [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]]) { const b = v.get(x + dx, y, z + dz) || v.get(x + dx, y + 1, z + dz) || v.get(x + dx, y - 1, z + dz); const j = isPen(b) || (b && !/air|leaves|grass|flower|fern/.test(b.block) && false); st[f] = j; }
  const wall = kind.endsWith("_wall"), ew = st.east && st.west && !st.north && !st.south, ns = st.north && st.south && !st.east && !st.west;
  const props = wall ? `east=${st.east ? "low" : "none"},north=${st.north ? "low" : "none"},south=${st.south ? "low" : "none"},up=${!(ew || ns)},waterlogged=false,west=${st.west ? "low" : "none"}` : `east=${st.east},north=${st.north},south=${st.south},waterlogged=false,west=${st.west}`;
  set(x, y, z, `minecraft:${kind}[${props}]`);
}
for (const [p, cells] of gatesWanted) {
  if (!cells.length) continue; const [x, y, z] = cells[Math.floor(cells.length / 2)];
  const b = v.get(x, y, z), along = b && b.state && (b.state.east === "true" || b.state.east === "low") && (b.state.west === "true" || b.state.west === "low");
  set(x, y, z, `minecraft:${typeof p === "number" && stock.get(p) === "pigs" ? "oak" : "spruce"}_fence_gate[facing=${along ? "south" : "east"},in_wall=${b && /wall/.test(b.block)},open=false,powered=false]`);
  if (!along && !(b && b.state && (b.state.north === "true" || b.state.north === "low"))) {}
  set(x, y + 1, z, "minecraft:air");
}
// the farmstead: our 19 x 18 lot, set on the levelled plot
const FS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/asset-studio/work/enterprise/bundle/core/src/main/resources/data/enterprise/structure/lordaeron/farmstead/farmstead_19x18_b.nbt";
if (existsSync(FS)) {
  const fs = await load(FS); let gy = 0, n = 0; for (let z = farm[1]; z < farm[1] + 18; z++) for (let x = farm[0] + 1; x < farm[0] + 20; x++) { gy += H(x, z); n++; } gy = Math.round(gy / n);
  for (let z = farm[1]; z < farm[1] + 20; z++) for (let x = farm[0]; x < farm[0] + 21; x++) { for (let y = gy - 4; y <= gy; y++) set(x, y, z, y === gy ? "minecraft:grass_block[snowy=false]" : "minecraft:dirt"); for (let y = gy + 1; y < v.size[1]; y++) if (v.get(x, y, z)) set(x, y, z, "minecraft:air"); }
  for (const [, c] of fs.cells) { const [x, y, z] = c.pos; const name = c.block.replace(/^enterprise:decor_(barrel|composter|cauldron)/, (m, k) => (k === "barrel" ? "minecraft:barrel" : k === "composter" ? "minecraft:composter" : "minecraft:water_cauldron")).replace(/\[contents=[a-z]+\]/, "[level=3]").replace(/minecraft:barrel\[facing=up,open=false\]/, "minecraft:barrel[facing=up,open=false]"); set(farm[0] + 1 + x, gy - 2 + y, farm[1] + z, name); }
}
// the world's top layer for anything left void above ground is air already; write it
mkdirSync(OUT, { recursive: true });
const r = writeWorld(`${OUT}/world`, v, { name: "Enterprise farmland demo (Pays d'Auge terrain)" });
const counts = {}; for (const [, u] of use) counts[u] = (counts[u] || 0) + 1; for (const [, k] of stock) counts[`pasture:${k}`] = (counts[`pasture:${k}`] || 0) + 1;
// a few lane cells with their ground height, for framing eye-level views
const lanes = []; for (let z = 20; z < Z - 20; z += 16) for (let x = 20; x < X - 20; x++) if (road[z * X + x]) { lanes.push([x, H(x, z), z]); x += 40; }
const pens = [...stock].map(([p, k]) => { const c = centreOf(p); return c && { stock: k, centre: [c[0], H(c[0], c[1]), c[1]] }; }).filter(Boolean);
writeFileSync(`${OUT}/farmland.json`, JSON.stringify({ size: v.size, farmstead: farm, parcels: counts, height: [hMin, hMax], lanes, pens }, null, 2));
console.log(JSON.stringify({ size: v.size, chunks: r.chunks, farm, parcels: counts }));
