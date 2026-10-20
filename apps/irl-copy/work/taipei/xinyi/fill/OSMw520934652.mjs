import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 第二院區: two-storey mid-century institutional block (c. 1970s-80s Taipei).
// White concrete facade with smooth-quartz bands, stone-brick plinth,
// red-tile parapet, flat roof with plant boxes. Footprint 127 x 105, roof at y 11.

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw520934652";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const W = 127, H = 23, D = 105;
const TOP = 11;        // parapet top
const ROOF = 10;       // roof slab / cornice level
const BAND = 5;        // storey line between floors
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

function isRing(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}

// Entrance: middle of the northernmost row (smallest z).
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const northXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const ENT_X = northXs[Math.floor(northXs.length / 2)];
const ENT_Z = minZ;

// Pass 1: foundations, floors, roof slab, interior.
for (const [x, z, grRaw] of cells) {
  const f = Math.round(grRaw);
  for (let y = 0; y < f; y++) put(x, y, z, "stone_bricks");
  if (!isRing(x, z)) {
    if (f <= BAND) put(x, BAND, z, "smooth_stone");          // second-floor slab
    if (f <= ROOF) put(x, ROOF, z, "light_gray_concrete");   // flat roof
    if (f <= 0) put(x, 0, z, "smooth_stone");
    else if (f < H) put(x, f, z, "smooth_stone");            // ground floor slab
  }
}

// Pass 2: perimeter facade.
for (const [x, z, grRaw] of cells) {
  if (!isRing(x, z)) continue;
  const f = Math.round(grRaw);
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const W_ = !has(x - 1, z), E = !has(x + 1, z);
  const corner = (N || S) && (W_ || E);
  const t = (N || S) ? x : z;
  const winCol = (t % 4 === 1) || (t % 4 === 2);

  for (let y = f; y <= TOP; y++) {
    if (y === f) { put(x, y, z, "stone_bricks"); continue; }     // plinth course
    if (y === BAND) { put(x, y, z, "smooth_quartz"); continue; } // storey line
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; } // cornice
    if (y === TOP) { put(x, y, z, "red_terracotta"); continue; } // tile parapet
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }
    const inWindowRow = (y >= f + 1 && y <= 4) || (y >= 6 && y <= 8);
    if (inWindowRow && winCol) put(x, y, z, "glass");
    else put(x, y, z, "white_concrete");
  }
}

// Pass 3: entrance door, hanging lantern, warm lights behind glass.
{
  const f = Math.round(gnd(ENT_X, ENT_Z));
  const facing = "north";
  put(ENT_X, f + 1, ENT_Z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ENT_X, f + 2, ENT_Z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ENT_X, f + 3, ENT_Z, "lantern", { hanging: "true" });
  // Glass flanking the entrance on the same row.
  for (const dx of [-2, -1, 1, 2]) {
    const xx = ENT_X + dx;
    if (has(xx, ENT_Z) && isRing(xx, ENT_Z)) {
      put(xx, f + 1, ENT_Z, "glass");
      put(xx, f + 2, ENT_Z, "glass");
    }
  }
}

for (const [x, z, grRaw] of cells) {
  if (!isRing(x, z)) continue;
  if (x === ENT_X && z === ENT_Z) continue;
  const f = Math.round(grRaw);
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const W_ = !has(x - 1, z), E = !has(x + 1, z);
  if ((N || S) && (W_ || E)) continue;
  const t = (N || S) ? x : z;
  if (!((t % 4 === 1) || (t % 4 === 2))) continue;
  // Inward offset from this facade cell.
  let ix = x, iz = z;
  if (N) iz = z + 1; else if (S) iz = z - 1; else if (W_) ix = x + 1; else if (E) ix = x - 1;
  if (!has(ix, iz) || isRing(ix, iz)) continue;
  if (t % 12 === 1 && f + 1 <= 8) {
    // Shroomlight behind a storey-two window.
    put(ix, 7, iz, "shroomlight");
  } else if (t % 12 === 5 && f + 2 <= 4) {
    // Glowstone behind a storey-one window.
    put(ix, f + 2, iz, "glowstone");
  }
}

// Pass 4: roof plant boxes on the flat roof.
for (const [x, z, grRaw] of cells) {
  const f = Math.round(grRaw);
  if (isRing(x, z) || ROOF < f) continue;
  if (x % 24 === 12 && z % 20 === 10) {
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "iron_block");
  }
}

vox.save(`${base}.nbt`);
