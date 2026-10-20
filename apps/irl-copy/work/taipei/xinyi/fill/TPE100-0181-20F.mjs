import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 遠東 Garden City 本館 (商場棟), 2011. Five-storey mall block, 140 x 236 footprint,
// roof about 26 blocks above its lowest ground. Stone-clad podium and tower
// with stained-glass curtain wall, white fins, a flat roof with plant and
// mechanical boxes, and a glazed entrance on each long face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE100-0181-20F";
const W = 140, H = 38, D = 236;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Materials
const FOUND = "polished_andesite";   // plinth, foundation, podium base course
const SLAB = "smooth_stone";         // floor slabs, roof slab
const FIN = "white_concrete";        // mullions and corner pilasters
const SPAN = "light_gray_concrete";  // spandrel lines between storeys
const SHADOW = "polished_andesite";  // deep reveal line under each storey
const PANE_A = "light_blue_stained_glass_pane";
const PANE_B = "cyan_stained_glass_pane";
const GLASS = "light_blue_stained_glass";
const MECH = "light_gray_concrete";
const MOSS = "moss_block";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...cells.map((c) => c[2]));

// Storeys: floors at rel 0,5,10,15,20; roof slab at rel 25; parapet at rel 26.
const ROOF_REL = 26;
const TOP = minG + ROOF_REL + 1;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter and corner classification
const EDGE = new Set();
for (const [x, z] of cells) {
  if (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1)) EDGE.add(key(x, z));
}
const isEdge = (x, z) => EDGE.has(key(x, z));
const missX = (x, z) => !has(x + 1, z) || !has(x - 1, z);
const missZ = (x, z) => !has(x, z + 1) || !has(x, z - 1);
const isCorner = (x, z) => missX(x, z) && missZ(x, z);

// Mullion spacing: tighter on the podium, wider on the tower
const isFin = (x, z, rel) => {
  if (isCorner(x, z)) return true;
  const every = rel < 10 ? 4 : 6;
  return (missZ(x, z) && x % every === 0) || (missX(x, z) && z % every === 0);
};

// Entrances: centred opening on the min-z and max-z faces, 7 cells wide
const ent = new Set();
const entCore = new Set();
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
function addEntrance(zFace) {
  const row = [...EDGE]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => z === zFace && !isCorner(x, z))
    .map(([x]) => x)
    .sort((a, b) => a - b);
  if (!row.length) return;
  const mid = row[row.length >> 1];
  for (const x of row) {
    if (Math.abs(x - mid) <= 3) ent.add(key(x, zFace));
    if (Math.abs(x - mid) <= 1) entCore.add(key(x, zFace));
  }
}
addEntrance(minZ);
addEntrance(maxZ);

// Roof-top plant patches and mechanical boxes
const isMoss = (x, z) => x % 24 < 4 && z % 24 < 4;
const isMech = (x, z) => x % 28 >= 9 && x % 28 <= 14 && z % 36 >= 10 && z % 36 <= 16;

// Main massing loop
for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const corner = edge && isCorner(x, z);
  const entrance = ent.has(key(x, z));
  const core = entCore.has(key(x, z));

  for (let y = 0; y <= TOP && y < H; y++) {
    // Foundation: solid from 0 up to this cell's ground
    if (y < gr) {
      put(x, y, z, FOUND);
      continue;
    }
    const rel = y - minG;
    if (rel < 0) continue;

    if (rel === ROOF_REL) {
      // Parapet on the perimeter only
      if (edge) put(x, y, z, corner ? FIN : SLAB);
      continue;
    }
    if (rel > ROOF_REL) continue;

    const r5 = rel % 5;

    if (r5 === 0) {
      // Floor or roof slab
      if (rel === 0 && edge) put(x, y, z, FOUND);
      else if (rel === 25 && !edge && isMoss(x, z)) put(x, y, z, MOSS);
      else put(x, y, z, SLAB);
      continue;
    }

    if (!edge) continue; // interior air gap behind the glass

    if (entrance) {
      if (rel === 4) put(x, y, z, core ? "sea_lantern" : SPAN);
      else if (core && rel <= 3) put(x, y, z, GLASS);
      else if (rel <= 3) put(x, y, z, GLASS);
      continue;
    }

    if (r5 === 4) {
      // Storey line: shadow reveal on the podium, spandrel above
      put(x, y, z, rel < 10 ? SHADOW : SPAN);
      continue;
    }

    // Window band (r5 1..3)
    if (isFin(x, z, rel)) {
      put(x, y, z, FIN);
    } else {
      const storey = Math.floor(rel / 5);
      const paneId = (storey + (x >> 3)) % 2 === 0 ? PANE_A : PANE_B;
      const props = {
        north: EDGE.has(key(x, z - 1)) ? "true" : "false",
        south: EDGE.has(key(x, z + 1)) ? "true" : "false",
        east: EDGE.has(key(x + 1, z)) ? "true" : "false",
        west: EDGE.has(key(x - 1, z)) ? "true" : "false",
        waterlogged: "false",
      };
      put(x, y, z, paneId, props);
    }
  }
}

// Entrance flanking fins and the sea-lantern canopy header along the outer row
for (const k of ent) {
  const [x, z] = k.split(",").map(Number);
  if (!entCore.has(k)) continue;
  // mark the two cells outside the core as fins at rel 1..3 when they are not in ent
}
for (const zFace of [minZ, maxZ]) {
  const xs = [...ent].map((k) => k.split(",").map(Number)).filter(([, z]) => z === zFace).map(([x]) => x);
  if (!xs.length) continue;
  const lo = Math.min(...xs), hi = Math.max(...xs);
  for (const x of [lo - 1, hi + 1]) {
    if (!has(x, zFace) || !isEdge(x, zFace)) continue;
    for (let rel = 0; rel <= 4; rel++) put(x, minG + rel, zFace, rel === 0 ? FOUND : FIN);
  }
}

// Warm lights placed in the air gap just behind selected window columns
for (const k of EDGE) {
  const [x, z] = k.split(",").map(Number);
  if (isCorner(x, z) || ent.has(k)) continue;
  if (((x * 5 + z * 3) % 9) !== 0) continue;
  let dx = 0, dz = 0;
  if (!has(x + 1, z)) dx = -1;
  else if (!has(x - 1, z)) dx = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x, z - 1)) dz = 1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || EDGE.has(key(ix, iz))) continue;
  const storey = (x + z) % 2;
  const id = (x + z) % 3 === 0 ? "shroomlight" : "glowstone";
  put(ix, minG + 2 + 5 * storey, iz, id);
}

// Roof equipment: mechanical boxes on the interior roof
for (const [x, z] of cells) {
  if (isEdge(x, z) || isMoss(x, z)) continue;
  if (!isMech(x, z)) continue;
  const base = minG + ROOF_REL;
  put(x, base, z, MECH);
  if (x % 28 >= 10 && x % 28 <= 12) put(x, base + 1, z, MECH);
}

g.save(`${DIR}/${ID}.nbt`);
