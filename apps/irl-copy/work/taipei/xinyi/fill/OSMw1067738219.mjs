import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 18 x 24, roof about 21 blocks above lowest ground.
// Read as a 1990s Xinyi-style mid-rise office/retail block: four storeys of
// ~5 blocks, white cladding, bay-window grid of blue glass, a ground-floor
// shopfront with a dark frame, a quartz cornice and white parapet, and a
// small plant enclosure on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738219";
const W = 18, H = 33, D = 24;
const ROOF_TOP = 21;   // top of parapet
const ROOF_Y = 20;     // roof slab / cornice course
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(g)));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Which sides of a footprint cell face outside the footprint.
function missing(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}
function isEdge(x, z) {
  const m = missing(x, z);
  return m.n || m.s || m.w || m.e;
}

// Entrance: on the north (z-1) face, centred on the median x of that face.
const frontXs = [];
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (m.n && !(m.w || m.e)) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const cx = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;

// Roof plant enclosure box (inset from the facade).
const bx0 = minX + 4, bx1 = maxX - 4;
const bz0 = minZ + 6, bz1 = maxZ - 6;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const m = missing(x, z);
  const corner = (m.n || m.s) && (m.w || m.e);

  // 2. Interior floor slabs at each storey line (and at the ground level).
  if (!edge) {
    const ys = new Set([0, 5, 10, 15, 20, gr]);
    for (const y of ys) {
      if (y < gr || y > ROOF_Y) continue;
      put(x, y, z, y === ROOF_Y ? "gray_concrete" : "smooth_stone");
    }
    continue;
  }

  // 3. Facade on edge cells, from this cell's ground up to the parapet.
  let idx, inDx = 0, inDz = 0, face = null;
  if (!corner) {
    if (m.n) { face = "n"; idx = x; inDz = 1; }
    else if (m.s) { face = "s"; idx = x; inDz = -1; }
    else if (m.w) { face = "w"; idx = z; inDx = 1; }
    else if (m.e) { face = "e"; idx = z; inDx = -1; }
  }

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === ROOF_TOP) { put(x, y, z, "white_concrete"); continue; }
    if (y === ROOF_Y) { put(x, y, z, "smooth_quartz"); continue; }

    if (corner) { put(x, y, z, "white_concrete"); continue; }

    const k = Math.floor(y / STOREY);
    const r = y % STOREY;
    const mullion = idx % 3 === 0;

    if (k === 0) {
      if (r === 0) put(x, y, z, "polished_granite");
      else if (r === 4) put(x, y, z, "polished_andesite");
      else {
        const doorway = face === "n" && cx !== null && Math.abs(x - cx) <= 1;
        if (doorway) put(x, y, z, "glass");
        else if (mullion) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "glass");
      }
    } else {
      if (r === 0) put(x, y, z, "smooth_quartz");
      else if (r === 4) put(x, y, z, "light_gray_concrete");
      else if (mullion) put(x, y, z, "white_concrete");
      else {
        // Window: glass, with a warm glowstone behind some of them.
        put(x, y, z, "light_blue_stained_glass");
        if (r === 2 && ((idx + k * 2) % 4 === 0)) {
          const ix = x + inDx, iz = z + inDz;
          if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// 4. Roof plant enclosure on the roof slab, supported by the roof at y 20.
for (let x = bx0; x <= bx1; x++) {
  for (let z = bz0; z <= bz1; z++) {
    if (!has(x, z)) continue;
    const ring = x === bx0 || x === bx1 || z === bz0 || z === bz1;
    if (ring) {
      for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) put(x, y, z, "light_gray_concrete");
      put(x, ROOF_Y + 4, z, "sea_lantern");
    } else {
      put(x, ROOF_Y + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
