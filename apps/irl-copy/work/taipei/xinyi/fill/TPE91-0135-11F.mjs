import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 逸仙悅榕 (TPE91-0135-11F), built 2002. Eleven-storey residential block in
// white terracotta and smooth quartz, with light-blue glass bays, sills,
// a plain cornice and parapet, and a central lobby on the front face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE91-0135-11F";
const W = 33, H = 66, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const STOREY = 5;     // blocks per storey
const ROOF = 54;      // roof deck level
const PARAPET = 55;   // parapet course on the perimeter

// ---- footprint lookup -------------------------------------------------------
const gmap = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gmap.set(`${x},${z}`, Math.round(gr));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => gmap.get(`${x},${z}`);

const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward face: north (z min), south (z max), west (x min), east (x max).
function faceOf(x, z) {
  if (!has(x, z - 1)) return { axis: "x", u: x, out: [0, -1] };
  if (!has(x, z + 1)) return { axis: "x", u: x, out: [0, 1] };
  if (!has(x - 1, z)) return { axis: "z", u: z, out: [-1, 0] };
  if (!has(x + 1, z)) return { axis: "z", u: z, out: [1, 0] };
  return null;
}

function floorsFor(gd) {
  const s = new Set([gd]);
  for (let L = STOREY; L < ROOF; L += STOREY) if (L > gd) s.add(L);
  return s;
}
function baseFloor(floors, y) {
  let b = -Infinity;
  for (const f of floors) if (f <= y && f > b) b = f;
  return b;
}

function paneProps(axis) {
  return axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Entrance: middle of the front (min-z) face.
const frontXs = [];
for (const [x, z] of cells) if (z === minZ && isEdge(x, z)) frontXs.push(x);
const fxMin = Math.min(...frontXs), fxMax = Math.max(...frontXs);
const fxMid = (fxMin + fxMax) / 2;
const entranceHalf = Math.max(2, Math.round((fxMax - fxMin) / 6));
const isEntrance = (x, z) => z === minZ && Math.abs(x - fxMid) <= entranceHalf;
const isEntranceCore = (x, z) => z === minZ && Math.abs(x - fxMid) <= 1;

// ---- main pass --------------------------------------------------------------
for (const [x, z] of cells) {
  const gd = groundOf(x, z);
  const edge = isEdge(x, z);
  const face = edge ? faceOf(x, z) : null;
  const floors = floorsFor(gd);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gd; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gd; y < ROOF; y++) {
    if (floors.has(y)) {
      if (edge && y === gd) g.set(x, y, z, "stone_bricks");        // base course
      else g.set(x, y, z, "light_gray_concrete");                  // storey line / slab
      continue;
    }
    if (!edge || !face) continue;                                  // interior air

    const base = baseFloor(floors, y);
    const rel = y - base;
    const u = face.u;
    const pier = u % 3 === 0;
    const panel = u % 3 === 1 && rel >= 2 && (base / STOREY) % 2 === 1;

    if (rel === 4) {
      // Spandrel, with a darker quartz band under every other storey.
      g.set(x, y, z, (base / STOREY) % 2 === 0 ? "smooth_quartz" : "white_terracotta");
    } else if (rel === 1) {
      // Window sill course, leaving glass above it.
      if (pier) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    } else if (rel >= 2 && rel <= 3) {
      if (pier) g.set(x, y, z, "smooth_quartz");
      else if (panel) g.set(x, y, z, "white_terracotta");          // solid panel bay
      else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face.axis));
    } else {
      g.set(x, y, z, "white_terracotta");
    }
  }

  // Roof deck (interior) and cornice (perimeter) at ROOF.
  g.set(x, ROOF, z, edge ? "smooth_quartz" : "gray_concrete");
  // Parapet cap on the perimeter.
  if (edge) g.set(x, PARAPET, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- entrance on the front face ---------------------------------------------
for (const [x, z] of cells) {
  if (!isEntrance(x, z)) continue;
  const gd = groundOf(x, z);
  // Entrance surround: solid quartz for the flanking bays, glass doorway in the core.
  for (let y = gd + 1; y <= gd + 3; y++) {
    g.set(x, y, z, isEntranceCore(x, z) ? "glass" : "smooth_quartz");
  }
  // Canopy over the door, full width of the entrance bay.
  g.set(x, gd + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  // Stone plinth in front of the doorway.
  g.set(x, gd, z, "stone_bricks");
}

// ---- warm light behind some bays --------------------------------------------
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const face = faceOf(x, z);
  if (!face || isEntrance(x, z)) continue;
  const gd = groundOf(x, z);
  const floors = floorsFor(gd);
  const ix = x - face.out[0], iz = z - face.out[1];
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  if (face.u % 3 === 0) continue;
  const sorted = [...floors].sort((a, b) => a - b);
  sorted.forEach((L, k) => {
    if (L + 2 >= ROOF || L <= gd) return;
    if ((face.u + k) % 4 !== 0) return;
    const block = k % 2 ? "glowstone" : "shroomlight";
    g.set(ix, L + 2, iz, block);
  });
}

// ---- rooftop penthouse block -------------------------------------------------
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 3) {
    g.set(x, ROOF + 1, z, "white_terracotta");
    g.set(x, ROOF + 2, z, "white_terracotta");
    g.set(x, ROOF + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
