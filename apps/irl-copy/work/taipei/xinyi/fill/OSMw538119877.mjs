import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119877";
const W = 24, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, g);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const m = Math.min(...ground.values());           // lowest ground = y 0 reference
const deck = m + 10;                               // roof deck / cornice level
const parapet = m + 11;                            // roof is ~11 blocks above lowest ground

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

function sides(x, z) {
  return { zm: !has(x, z - 1), zp: !has(x, z + 1), xm: !has(x - 1, z), xp: !has(x + 1, z) };
}

// Entrance: outward (+z) perimeter cell nearest the middle of the south face
let doorKey = null, best = Infinity;
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (sides(x, z).zp && Math.abs(x - 12) < best) { best = Math.abs(x - 12); doorKey = k; }
}
const [dx, dz] = doorKey ? doorKey.split(",").map(Number) : [-1, -1];

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const s = sides(x, z);
  const perim = s.zm || s.zp || s.xm || s.xp;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, storey line, roof deck (interior)
  const floors = new Set([gr + 1, m + 6, deck]);
  for (const fy of floors) {
    if (fy > gr && fy <= deck) put(x, fy, z, "smooth_stone");
  }

  if (!perim) continue;
  if (gr + 1 > deck) continue; // nothing rises above ground here

  const along_x = s.zm || s.zp;                 // wall runs east-west
  const idx = along_x ? x : z;
  const corner = (s.zm || s.zp) && (s.xm || s.xp);
  const pier = corner || idx % 3 === 0;
  const paneP = along_x
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Wall column
  for (let y = gr + 1; y <= deck; y++) {
    let b;
    if (y === gr + 1) {
      b = "polished_granite";                              // base course
    } else if (y === deck) {
      b = "quartz_block";                                  // cornice
    } else if (y === m + 5 || y === m + 6) {
      b = "light_gray_concrete";                           // spandrel band
    } else if ((y >= m + 2 && y <= m + 4) || (y >= m + 7 && y <= m + 9)) {
      if (pier) b = "white_concrete";
      else { put(x, y, z, "light_blue_stained_glass_pane", paneP); continue; }
    } else {
      b = "white_concrete";
    }
    put(x, y, z, b);
  }
  // Parapet on top of the cornice
  put(x, parapet, z, "white_concrete");
}

// Entrance: glass door with lintel canopy
if (doorKey) {
  const dg = gAt(dx, dz);
  put(dx, dg + 2, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 3, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const ox of [-1, 0, 1]) {
    if (has(dx + ox, dz)) put(dx + ox, dg + 4, dz, "quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// Warm lights behind glass, with an air gap, plus window framing per bay
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const s = sides(x, z);
  if (!(s.zm || s.zp || s.xm || s.xp)) continue;
  if (gr + 1 > deck) continue;
  const along_x = s.zm || s.zp;
  const idx = along_x ? x : z;
  const corner = (s.zm || s.zp) && (s.xm || s.xp);
  if (corner || idx % 3 === 0) continue;
  // inward cell two blocks behind the glass
  let ix = x, iz = z;
  if (s.zm) iz = z + 2; else if (s.zp) iz = z - 2; else if (s.xm) ix = x + 2; else ix = x - 2;
  if (!has(ix, iz)) continue;
  const lightCol = idx % 6;
  if (lightCol === 1) {
    const y = m + 8;
    if (y > gAt(ix, iz)) put(ix, y, iz, "shroomlight");
  } else if (lightCol === 4) {
    const y = m + 3;
    if (y > gAt(ix, iz)) put(ix, y, iz, "glowstone");
  }
}

// Roof equipment on the deck
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (gr >= deck) continue;
  const boxA = x >= 6 && x <= 8 && z >= 5 && z <= 7;
  const boxB = x >= 14 && x <= 15 && z >= 10 && z <= 11;
  if (boxA || boxB) put(x, parapet, z, "light_gray_concrete");
  if (x === 12 && z === 9) {
    put(x, parapet, z, "smooth_stone");
    put(x, parapet + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
