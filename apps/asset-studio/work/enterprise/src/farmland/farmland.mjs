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
//   node src/farmland/farmland.mjs <land.nbt> <out world dir> [--seed n]
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { writeWorld } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/anvil.mjs";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { farmLayout } from "./layout.mjs";

const argv = process.argv.slice(2), [LAND, OUT] = argv, SEED = +(argv.includes("--seed") ? argv[argv.indexOf("--seed") + 1] : 7);
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
const L = farmLayout({ top, water, X, Z, seed: SEED });
const { Hs, H, slope, wet, dWater, road, parcel, FARM, farm, stats, use, cropsOf, hMin, hMax } = L;

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
const boundary = (x, z) => { const p = parcel[z * X + x]; if (p < 0) return false; for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= X || zz >= Z) continue; const q = parcel[zz * X + xx]; if (q !== p && (q >= 0 || road[zz * X + xx])) return true; } return false; };
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
  if (boundary(x, z) && u !== "farmstead") {                 // the field's edge: a hedge on a bank, a wall high up, a gate onto the lane
    set(x, g, z, "minecraft:grass_block[snowy=false]");
    const high = (g - hMin) / (hMax - hMin) > 0.75 || u === "terraces";
    if (besideRoad(x, z) && hash(p, 77) < 1 && (x + z + p) % 23 < 3) { set(x, g + 1, z, "minecraft:spruce_fence_gate[facing=north,in_wall=false,open=false,powered=false]"); continue; }
    if (high) { set(x, g + 1, z, hash(x, z, 6) < 0.6 ? "minecraft:cobblestone_wall[east=low,north=low,south=low,up=true,waterlogged=false,west=low]" : "minecraft:mossy_cobblestone_wall[east=low,north=low,south=low,up=true,waterlogged=false,west=low]"); continue; }
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
    case "pasture": {
      set(x, g, z, r < 0.06 ? "minecraft:coarse_dirt" : "minecraft:grass_block[snowy=false]");
      if (r > 0.6 && r < 0.9) set(x, g + 1, z, "minecraft:short_grass"); else if (r >= 0.9 && r < 0.93) set(x, g + 1, z, "minecraft:oxeye_daisy");
      if (r > 0.9985) tree(x, z, g, "oak", 5, 3);
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
// pasture shelters: an open timber shed with a hay rack in each pasture's middle
for (const [p, s] of stats) if (use.get(p) === "pasture") {
  let cx = 0, cz = 0, n = 0; for (let z = 0; z < Z; z += 2) for (let x = 0; x < X; x += 2) if (parcel[z * X + x] === p) { cx += x; cz += z; n++; }
  if (n < 30) continue; cx = Math.round(cx / n); cz = Math.round(cz / n); const g = H(cx, cz);
  for (const [dx, dz] of [[0, 0], [4, 0], [0, 2], [4, 2]]) for (let y = 1; y <= 3; y++) set(cx + dx, g + y, cz + dz, "minecraft:spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  for (let dx = -1; dx <= 5; dx++) for (let dz = -1; dz <= 3; dz++) set(cx + dx, g + 4, cz + dz, "minecraft:spruce_slab[type=bottom,waterlogged=false]");
  set(cx + 2, g + 1, cz, "minecraft:hay_block[axis=x]"); set(cx + 1, g + 1, cz, "minecraft:hay_block[axis=x]"); set(cx + 3, g + 1, cz + 2, "minecraft:water_cauldron[level=3]");
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
const counts = {}; for (const [, u] of use) counts[u] = (counts[u] || 0) + 1;
// a few lane cells with their ground height, for framing eye-level views
const lanes = []; for (let z = 20; z < Z - 20; z += 16) for (let x = 20; x < X - 20; x++) if (road[z * X + x]) { lanes.push([x, H(x, z), z]); x += 40; }
writeFileSync(`${OUT}/farmland.json`, JSON.stringify({ size: v.size, farmstead: farm, parcels: counts, height: [hMin, hMax], lanes }, null, 2));
console.log(JSON.stringify({ size: v.size, chunks: r.chunks, farm, parcels: counts }));
