import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295632.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295632.nbt";

const W = 15, H = 23, D = 24;
// Record: no tags. Read as a two-storey, 1980s-90s Taipei street-front commercial block:
// stone plinth, red-tile fascia over a shopfront, white-tile upper storey with red-brick piers,
// quartz cornice, and two rooftop plant units. Roof top sits at y 10 (11 blocks above lowest ground).

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// exposures: [north(z-1), south(z+1), west(x-1), east(x+1)]
const exp = (x, z) => [!has(x, z - 1), !has(x, z + 1), !has(x - 1, z), !has(x + 1, z)];
const isPerim = (x, z) => has(x, z) && exp(x, z).some(Boolean);
const nExp = (x, z) => exp(x, z).filter(Boolean).length;

// Entrance: street-facing (north, z min) cell nearest the footprint centre.
const cxMid = (minX + maxX) / 2;
let ent = null;
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (z !== minZ) continue;
  if (!ent || Math.abs(x - cxMid) < Math.abs(ent[0] - cxMid)) ent = [x, z];
}
const isEnt = (x, z) => ent && ent[0] === x && ent[1] === z;

// Bays: piers at every third cell along each facade, corners always piers.
function isPier(x, z) {
  const [n, s] = exp(x, z);
  if (nExp(x, z) >= 2) return true;
  const t = (n || s) ? x - minX : z - minZ;
  return t % 3 === 0;
}
const isWin = (x, z) => isPerim(x, z) && !isPier(x, z);

function put(x, y, z, id, p) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

function paneProps(x, z) {
  const [n, s] = exp(x, z);
  const alongX = n || s;
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// Interior cell directly behind a window (opposite its exposed face).
function interiorBehind(x, z) {
  const [n, s, w, e] = exp(x, z);
  let ix = x, iz = z;
  if (n) iz = z + 1; else if (s) iz = z - 1; else if (w) ix = x + 1; else if (e) ix = x - 1;
  return [ix, iz];
}

// ---- Pass 1: foundations, floor slab, roof deck, cornice ----
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation under each cell
  put(x, 5, z, "smooth_stone");                               // upper floor slab
  put(x, 9, z, "light_gray_concrete");                        // roof deck
  if (isPerim(x, z)) {
    const corner = nExp(x, z) >= 2;
    put(x, 10, z, corner ? "quartz_pillar" : "quartz_block", corner ? { axis: "y" } : undefined);
  }
}

// ---- Pass 2: perimeter walls, shopfront, upper storey, doors and lights ----
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const pier = isPier(x, z);
  const win = isWin(x, z);
  const entr = isEnt(x, z);
  const [n, s] = exp(x, z);
  const pane = win ? paneProps(x, z) : null;

  // Ground storey (y gr..4)
  for (let y = gr; y <= 4; y++) {
    const rel = y - gr;
    if (y === 4) { put(x, y, z, "red_terracotta"); continue; }
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (entr && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (entr && y === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (win && (rel === 1 || rel === 2)) { put(x, y, z, "glass_pane", pane); continue; }
    put(x, y, z, "white_terracotta");
  }

  // Upper storey (y 6..8)
  for (let y = 6; y <= 8; y++) {
    if (y < gr) continue;
    if (win) {
      if (y === 7) put(x, y, z, "glass_pane", pane);
      else put(x, y, z, "white_terracotta");
    } else if (pier) {
      put(x, y, z, "bricks");
    } else {
      put(x, y, z, "white_terracotta");
    }
  }
}

// ---- Pass 3: warm light behind some upper windows (sill height, supported by slab at y5) ----
for (const [x, z, gr] of cells) {
  if (!isWin(x, z) || 6 < gr) continue;
  if ((x + z) % 3 !== 0) continue;
  const [ix, iz] = interiorBehind(x, z);
  if (has(ix, iz) && !isPerim(ix, iz)) put(ix, 6, iz, "glowstone");
}

// ---- Pass 4: rooftop plant units on the interior of the roof (sit on y9 deck) ----
const cx = Math.round(cxMid), cz = Math.round((minZ + maxZ) / 2);
for (const [dx, dz] of [[-3, -4], [-2, -4], [3, 4], [2, 4]]) {
  const x = cx + dx, z = cz + dz;
  if (has(x, z) && !isPerim(x, z)) put(x, 10, z, "iron_block");
}

g.save(OUT);
