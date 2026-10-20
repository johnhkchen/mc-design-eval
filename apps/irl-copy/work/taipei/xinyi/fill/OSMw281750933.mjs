import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 辦公室 (office), Xinyi district. Two-storey modern office block, reinforced
// concrete frame with white cladding, light-blue glass ribbon windows, grey
// spandrels, full-height quartz pilasters for vertical rhythm, a stone base
// course, a stepped stone cornice and a parapet. Roof deck sits about 11 blocks
// above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw281750933";
const W = 35, H = 23, D = 106;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
let minG = Infinity;
for (const c of cells) {
  const x = c[0], z = c[1], gy = Math.round(c[2]);
  groundAt.set(key(x, z), gy);
  if (gy < minG) minG = gy;
}

// Place a block only inside the volume.
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Absolute storey lines and roof deck, measured from the lowest ground.
const S1 = minG + 5;   // first floor spandrel line
const S2 = minG + 10;  // second floor spandrel line
const R = minG + 11;   // roof deck / parapet base

const has = (x, z) => groundAt.has(key(x, z));
const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Street-side (lowest z) face centre for the entrance.
const zmin = Math.min(...cells.map((c) => c[1]));
const frontXs = cells.filter((c) => c[1] === zmin).map((c) => c[0]);
const cx = Math.round(frontXs.reduce((a, b) => a + b, 0) / frontXs.length);

// ---- 1. Foundation, slabs, walls ----
for (const c of cells) {
  const x = c[0], z = c[1];
  const gy = groundAt.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!isPerimeter(x, z)) {
    // Interior: floor slabs per storey and roof deck, air gaps between.
    put(x, gy, z, "light_gray_concrete");
    if (S1 > gy) put(x, S1, z, "light_gray_concrete");
    if (S2 > gy) put(x, S2, z, "light_gray_concrete");
    if (R > gy) put(x, R, z, "light_gray_concrete");
    continue;
  }

  // Perimeter wall.
  const nW = !has(x - 1, z);
  const nE = !has(x + 1, z);
  const nN = !has(x, z - 1);
  const xFace = nW || nE;
  const idx = xFace ? z : x;
  // Direction from the facade into the building.
  const inX = xFace ? (nW ? 1 : -1) : 0;
  const inZ = xFace ? 0 : (nN ? 1 : -1);

  // Pilaster bay: full-height quartz fin every 6 blocks, reads as a column rhythm.
  const pilaster = idx % 6 === 0;

  // Base course, a heavier stone plinth at ground level.
  put(x, gy, z, "polished_andesite");

  for (let y = gy + 1; y < R; y++) {
    if (y === S1 || y === S2) {
      // Spandrel storey lines, grey, with a darker pilaster line.
      put(x, y, z, pilaster ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (pilaster) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    const inZoneA = y < S1;
    const m = idx % 4;
    if (m === 1 || m === 2) {
      put(x, y, z, "light_blue_stained_glass");
    } else if (m === 0) {
      put(x, y, z, "gray_concrete");   // mullion
    } else {
      put(x, y, z, "white_concrete");
    }

    // Warm light behind some glass, one row per zone.
    const lightRow = inZoneA ? gy + 2 : S1 + 2;
    const lightCol = inZoneA ? idx % 8 === 1 : idx % 8 === 5;
    if (y === lightRow && (m === 1 || m === 2) && lightCol) {
      const ix = x + inX, iz = z + inZ;
      if (has(ix, iz) && !isPerimeter(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Parapet on the roof line and a stone cornice cap above it.
  if (R > gy) {
    put(x, R, z, "white_concrete");
    put(x, R + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- 2. Entrance on the street face: a three-bay glass lobby with a door ----
for (const c of cells) {
  const x = c[0], z = c[1];
  if (z !== zmin || Math.abs(x - cx) > 1) continue;
  const gy = groundAt.get(key(x, z));
  for (let y = gy + 1; y <= Math.min(gy + 3, S1 - 1); y++) {
    put(x, y, z, "glass");
  }
  // Marquee band across the entrance lintel.
  if (gy + 4 < S1) put(x, gy + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
// Door leaf at the centre bay, lower half only so it reads as a door.
{
  const gy = groundAt.get(key(cx, zmin));
  if (gy !== undefined) {
    put(cx, gy + 1, zmin, "iron_block");
    put(cx, gy + 2, zmin, "iron_block");
  }
}

// Warm glow flanking the entrance, inside the lobby.
for (const dx of [-2, 2]) {
  const ik = key(cx + dx, zmin + 1);
  if (!groundAt.has(ik)) continue;
  put(cx + dx, groundAt.get(ik) + 2, zmin + 1, "glowstone");
}

// ---- 3. Roof: condenser units and a few stair bulkheads on the deck ----
for (const c of cells) {
  const x = c[0], z = c[1];
  if (isPerimeter(x, z)) continue;
  if (x % 9 === 4 && z % 15 === 7) {
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
