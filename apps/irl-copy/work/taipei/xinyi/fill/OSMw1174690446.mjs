import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse-style block: stone plinth, red sign band over a
// glazed shopfront, two upper storeys of white-tiled piers and tinted glass,
// cornice, parapet, and a roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690446";
const W = 10, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const doorX = Math.floor((minX + maxX) / 2);

const FACES = [
  { dx: -1, dz: 0 }, { dx: 1, dz: 0 }, { dx: 0, dz: -1 }, { dx: 0, dz: 1 },
];
const exposed = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// Along-wall coordinate and bay test for a face.
function bayInfo(x, z, f) {
  const along = f.dz !== 0 ? x : z;
  const lo = f.dz !== 0 ? minX : minZ;
  const hi = f.dz !== 0 ? maxX : maxZ;
  const isEnd = along === lo || along === hi;
  const bay = !isEnd && (along - lo) % 3 === 1;
  return { along, lo, bay };
}

function facadeMat(x, z, f, y, gr, T) {
  const { bay } = bayInfo(x, z, f);
  const shopBase = gr + 1, shopTop = gr + 4, band = gr + 5, cornice = T - 1;
  if (y === T) return "white_concrete";          // parapet
  if (y === cornice || y === band) return "smooth_stone";
  if (y <= shopTop) {
    if (y === shopTop) return "red_concrete";    // shop sign band
    if (y === shopBase) return "stone_bricks";   // bulkhead course
    return bay ? "cyan_stained_glass" : "white_concrete";
  }
  return bay ? "cyan_stained_glass" : "white_concrete";
}

for (const [x, z, gr] of cells) {
  const T = Math.max(11, gr + 10);     // roof deck level for this cell
  const shopBase = gr + 1, band = gr + 5;
  const ex = exposed(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at each storey line and the roof deck (interior; exterior overwritten below).
  put(x, band, z, "smooth_stone");
  put(x, T, z, "gray_concrete");

  if (ex.length === 0) continue;

  const face = ex[0];
  for (let y = shopBase; y <= T; y++) {
    if (y === T) { put(x, y, z, "white_concrete"); continue; }
    // Entrance door on the south face, centre bay.
    if (x === doorX && !has(x, z + 1) && (y === shopBase || y === shopBase + 1)) {
      const half = y === shopBase ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    put(x, y, z, facadeMat(x, z, face, y, gr, T));
  }
  put(x, T + 1, z, "smooth_stone");        // coping

  // Warm lights set inside some windows (interior cell behind the glass).
  for (const f of ex) {
    const { along, lo, bay } = bayInfo(x, z, f);
    if (!bay) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz)) continue;
    if (along - lo === 1 || (along - lo) % 6 === 1) {
      put(ix, gr + 7, iz, "shroomlight");   // upper floor
    }
    if ((along - lo) % 6 === 4) {
      put(ix, gr + 2, iz, "glowstone");     // shopfront
    }
  }
}

// Roof plant: two small concrete boxes on the deck, away from the parapet.
for (const [x, z, gr] of cells) {
  const T = Math.max(11, gr + 10);
  if (exposed(x, z).length) continue;
  if ((x === 3 || x === 4) && (z === 6 || z === 7) && T + 2 < H) {
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
