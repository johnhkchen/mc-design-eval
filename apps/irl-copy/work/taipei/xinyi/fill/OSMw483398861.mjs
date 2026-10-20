import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw483398861";
const W = 42, H = 86, D = 29;
const ROOF = 74;            // roof slab level, about 74 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const v = new Voxels([W, H, D]);

// ---- footprint lookup and depth (distance in cells from the outline) ----
const key = (x, z) => x * 1000 + z;
const G = new Map();
for (const [x, z, g] of cells) G.set(key(x, z), g);
const inFP = (x, z) => G.has(key(x, z));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const depthMap = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (dirs.some(([dx, dz]) => !inFP(x + dx, z + dz))) {
    depthMap.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depthMap.get(key(x, z));
  for (const [dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (inFP(nx, nz) && !depthMap.has(key(nx, nz))) {
      depthMap.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const depth = (x, z) => depthMap.get(key(x, z)) ?? 0;

// ---- massing: podium (to y16), tower (to y56), crown (to roof 74) ----
// Each tier is the footprint eroded by a minimum depth; tiers are nested so
// every storey stands on the one below.
function minDepth(y) {
  if (y < 16) return 1;
  if (y < 56) return 4;
  return 8;
}
const inTier = (x, z, y) => inFP(x, z) && depth(x, z) >= minDepth(y);

// ---- entrance: a plain (non-corner) south-facing perimeter cell near centre ----
let cx = 0;
for (const [x] of cells) cx += x;
cx /= cells.length;
const entranceCands = cells.filter(([x, z]) =>
  !inFP(x, z + 1) && inFP(x - 1, z) && inFP(x + 1, z) && depth(x, z) === 1
);
let ex = -1, ez = -1, best = Infinity;
for (const [x, z] of entranceCands) {
  if (Math.abs(x - cx) < best) { best = Math.abs(x - cx); ex = x; ez = z; }
}

const paneProps = (faceNS) => faceNS
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- main pass over every footprint column ----
for (const [x, z, g] of cells) {
  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");

  for (let y = g; y < ROOF; y++) {
    const inc = inTier(x, z, y);

    if (!inc) {
      // ledge at a setback: top of the lower tier's ring, resting on its wall
      if (y > g && inTier(x, z, y - 1)) v.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // ground course and storey floor slabs span the whole tier (sealed storeys)
    if (y === g) { v.set(x, y, z, "polished_andesite"); continue; }
    if ((y - g) % 5 === 0) { v.set(x, y, z, "light_gray_concrete"); continue; }

    const out = dirs.filter(([dx, dz]) => !inTier(x + dx, z + dz, y));
    if (out.length === 0) continue; // interior air

    const r = (y - g) % 5;           // 1..4 inside the storey
    const corner = out.length > 1;
    const faceNS = out.some(([, dz]) => dz !== 0);

    // entrance doors and lintel
    if (x === ex && z === ez) {
      if (y === g + 1) {
        v.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === g + 2) {
        v.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === g + 3) { v.set(x, y, z, "white_concrete"); continue; }
    }

    if (corner) { v.set(x, y, z, "white_concrete"); continue; }

    if (r === 4) { v.set(x, y, z, "quartz_block"); continue; }   // spandrel

    // window band (r = 1..3): glass with white mullions
    const idx = faceNS ? x : z;
    if (idx % 3 === 0) {
      v.set(x, y, z, "white_concrete");
    } else {
      const block = ((x + z) % 4 === 0) ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
      v.set(x, y, z, block, paneProps(faceNS));
    }

    // warm light behind some glass
    if (r === 2 && (x * 7 + z * 11 + y) % 10 === 0) {
      const [odx, odz] = out[0];
      const ix = x - odx, iz = z - odz;
      if (inTier(ix, iz, y) && depth(ix, iz) >= 2) v.set(ix, y, iz, "glowstone");
    }
  }

  // roof slab over the crown
  if (inTier(x, z, ROOF)) v.set(x, ROOF, z, "light_gray_concrete");

  // parapet with cornice on the crown's outer ring
  if (depth(x, z) === minDepth(ROOF)) {
    v.set(x, ROOF + 1, z, "quartz_block");
    v.set(x, ROOF + 2, z, "white_concrete");
  }

  // roof penthouse (inner core), glass band on its ring
  if (depth(x, z) >= 12 && inTier(x, z, ROOF)) {
    const ring = depth(x, z) === 12;
    v.set(x, ROOF + 1, z, "light_gray_concrete");
    v.set(x, ROOF + 2, z, ring ? "light_blue_stained_glass" : "light_gray_concrete");
    v.set(x, ROOF + 3, z, "light_gray_concrete");
    v.set(x, ROOF + 4, z, "quartz_block");
  }
}

// ---- antenna mast on the deepest penthouse cell nearest the centre ----
let mx = -1, mz = -1, md = -1, mdist = Infinity;
for (const [x, z] of cells) {
  const d = depth(x, z);
  if (!inTier(x, z, ROOF)) continue;
  const dd = Math.abs(x - cx);
  if (d > md || (d === md && dd < mdist)) { md = d; mdist = dd; mx = x; mz = z; }
}
if (mx >= 0) {
  for (let y = ROOF + 5; y <= ROOF + 10 && y < H; y++) {
    v.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

v.save(`${DIR}/${ID}.nbt`);
