// shared site reader: per column the ground top (ignoring plants, trees and ground cover), the water surface and depth,
// trees, and what is already built
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
export const FILE = new URL("../input/antipolar_expansion_002_raw.nbt", import.meta.url).pathname;
export const GRADE = 0; // heights are absolute export y
const s = (b) => b.replace(/^.*:/, "");
export const FEATURE = /leaves|leaf_pile|_log$|_wood$|vine|plants\d?$|grass$|watergrass|tall_grass|fern|mushroom|twigs|rocks$|bush|azalea|sprouts|cucumbers|cobweb|nodule|fallen|lily|seagrass|kelp|cattail|reeds|duckweed|clover|lupine|wild_rice|bones|remains|sugar_cane|dead_bush|moss_carpet|snow$/;
export const BUILT = /brick|terracotta|plank|stairs|slab|fence|door|glass|lantern|bed$|copper|quartz|barrel|trapdoor|wall$|furnace|chest|smoker|hay_block|campfire|stripped_|ladder|concrete|candle|flower_pot|cauldron|composter|smithing|carpet|chain|pressure_plate|basalt|prismarine|headstone|dirt_path|gravel|coarse_dirt|cobble|salt_block|packed_mud/;
export function readSite(file = FILE) {
  const g = load(file); const [X, Y, Z] = g.size;
  const H = [], W = [], depth = [], tree = [], built = [], topBlock = [];
  for (let z = 0; z < Z; z++) { H.push(new Float64Array(X)); W.push(new Float64Array(X).fill(-99)); depth.push(new Float64Array(X)); tree.push([]); built.push([]); topBlock.push([]);
    for (let x = 0; x < X; x++) { let h = -99, t = false, b = false, tb = null;
      for (let y = Y - 1; y >= 0; y--) { const c = g.get(x, y, z); if (!c) continue; const n = s(c.block);
        if (n === "water" || c.state?.waterlogged === "true" && FEATURE.test(n)) { if (W[z][x] < 0) W[z][x] = y; continue; }
        if (FEATURE.test(n)) { if (/_log$|_wood$/.test(n)) t = true; continue; }
        h = y; tb = n; b = BUILT.test(n); break; }
      H[z][x] = h; depth[z][x] = W[z][x] >= 0 ? W[z][x] - h : 0; tree[z].push(t); built[z].push(b); topBlock[z].push(tb); } }
  const water = W.map((r) => [...r].map((w) => w >= 0));
  return { g, X, Y, Z, H, W, water, depth, tree, built, topBlock, hole: (x, z) => H[z][x] < 0 };
}
