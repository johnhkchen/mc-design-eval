// shared site reader: ground heightmap (relative to lane grade), water, holes, trees
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
export const FILE = new URL("../input/polarton_expansion_001_xl.nbt", import.meta.url).pathname;
export const GRADE = 5;
const s = (b) => b.replace(/^minecraft:/, "");
const FEATURE = /leaves|leaf_pile|_log$|_wood$|vine|plants|grass$|tall_grass|fern|mushroom|twigs|rocks$|bush|azalea|sprouts|cucumbers|cobweb|nodule|fallen|lily|seagrass|kelp/;
const BUILT = /brick|terracotta|plank|stairs|slab|fence|door|glass|lantern|bed|copper|quartz|barrel|trapdoor|wall$|furnace|chest|smoker|hay|campfire/;
export function readSite(file = FILE) {
  const g = load(file); const [X, Y, Z] = g.size;
  const H = [], water = [], tree = [], built = [];
  for (let z = 0; z < Z; z++) { H.push(new Float64Array(X)); water.push([]); tree.push([]); built.push([]);
    for (let x = 0; x < X; x++) { let h = -99, w = false, t = false, b = false;
      for (let y = Y - 1; y >= 0; y--) { const c = g.get(x, y, z); if (!c) continue; const n = s(c.block);
        if (n === "water") { w = true; continue; }
        if (FEATURE.test(n)) { if (/_log$|_wood$|mushroom_stem/.test(n)) t = true; continue; }
        h = y - GRADE; b = BUILT.test(n) && x >= 82; break; }
      H[z][x] = h; water[z].push(w); tree[z].push(t); built[z].push(b); } }
  return { g, X, Z, H, water, tree, built, hole: (x, z) => H[z][x] < -4 };
}
