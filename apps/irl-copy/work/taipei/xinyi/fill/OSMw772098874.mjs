import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw772098874.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw772098874.nbt";

const W = 17, H = 23, D = 22;
const TOP = 11;          // roof (lidar) above lowest ground
const CORNICE = TOP;     // cornice course sits on top of the roof line
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(key(x, z), Math.min(Math.max(0, Math.round(gr)), 9));
}
const has = (x, z) => G.has(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const WINDOW_ROWS = new Set([2, 3, 4, 6, 7, 8, 9]);
const isPier = (x, z) => ((x - minX) % 3 === 0) || ((z - minZ) % 3 === 0);

// 1. Foundations, floor slabs, walls, cornice, roof
for (const [x, z, gr] of cells) {
  const ground = G.get(key(x, z));
  // foundation fill up to ground, then ground-floor slab
  for (let y = 0; y < ground; y++) S(x, y, z, "stone");
  S(x, ground, z, "smooth_stone");

  // second-storey floor slab (storey line ~5 blocks up)
  if (ground + 5 < TOP) S(x, ground + 5, z, "smooth_stone");

  // roof slab across the footprint
  S(x, TOP, z, "light_gray_concrete");

  if (perim(x, z)) {
    for (let y = ground + 1; y < TOP; y++) {
      const r = y - ground;
      let id;
      if (r === 1) id = "stone_bricks";                       // plinth
      else if (r === 5) id = "light_gray_concrete";            // belt course
      else if (WINDOW_ROWS.has(r)) id = isPier(x, z) ? "white_concrete" : "light_blue_stained_glass";
      else id = "white_concrete";                              // spandrels
      S(x, y, z, id);
    }
    S(x, CORNICE, z, "stone_bricks");                          // cornice / parapet cap
  }
}

// 2. Entrance on the north (min z) face, centred on the footprint
const mid = Math.round((minX + maxX) / 2);
let ex = null;
for (let d = 0; d <= 20 && ex === null; d++) {
  for (const cand of [mid + d, mid - d]) {
    if (has(cand, minZ)) { ex = cand; break; }
  }
}
if (ex !== null) {
  const gr = G.get(key(ex, minZ));
  // shopfront glass either side of the door, dark lintel over the bay
  for (const x of [ex - 1, ex + 1]) {
    if (has(x, minZ)) {
      const gg = G.get(key(x, minZ));
      S(x, gg + 1, minZ, "light_blue_stained_glass");
      S(x, gg + 2, minZ, "light_blue_stained_glass");
      S(x, gg + 3, minZ, "dark_oak_planks");
    }
  }
  S(ex, gr + 3, minZ, "dark_oak_planks");
  S(ex, gr + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(ex, gr + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 3. Warm lights standing on the floors inside, seen through the glass
for (const [x, z] of cells) {
  if (perim(x, z)) continue;
  const gr = G.get(key(x, z));
  const h = (x * 3 + z * 5) % 11;
  if (h === 0) S(x, gr + 1, z, "glowstone");
  else if (h === 6 && gr + 6 < TOP) S(x, gr + 6, z, "shroomlight");
}

// 4. Roof equipment: small plant box near the centre of the roof
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);
for (let x = cx - 1; x <= cx + 1; x++) {
  for (let z = cz - 1; z <= cz + 1; z++) {
    if (!has(x, z)) continue;
    S(x, TOP + 1, z, "light_gray_concrete");
    S(x, TOP + 2, z, "stone_bricks");
  }
}

g.save(OUT);
