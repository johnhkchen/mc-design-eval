import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 14 x 17, roof ~21 blocks above lowest ground.
// Read as a 1990s-2000s Xinyi mid-rise office block: white concrete frame,
// tinted glass bands, light-grey string courses, a plant penthouse, and a
// shopfront ground storey on the street side.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265938";
const W = 14, D = 17, H = 33;
const ROOF_TARGET = 21;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint map: key "x,z" -> ground (relative to lowest ground)
const S = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) S.set(`${x},${z}`, gr);
}
const low = Math.min(...S.values());
for (const [k, v] of S) S.set(k, v - low);

const has = (x, z) => S.has(`${x},${z}`);
const gnd = (x, z) => S.get(`${x},${z}`);

// perimeter: footprint cell with a missing 4-neighbour
const isPerim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isCorner = (x, z) =>
  (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
// mullion columns every 3 cells along each face
const isMullion = (x, z) => {
  if (x === 0 || x === W - 1) return z % 3 === 0;
  if (z === 0 || z === D - 1) return x % 3 === 0;
  return false;
};
const isWindow = (x, z) => isPerim(x, z) && !isCorner(x, z) && !isMullion(x, z);

// base = highest relative ground so the whole footprint sits on one level
const base = Math.max(...S.values());
const n = Math.max(2, Math.floor((ROOF_TARGET - base - 1) / STOREY)); // storeys
const roofY = base + n * STOREY;

const g = new Voxels([W, H, D]);

// 1. foundation: solid from y 0 up to the building base under every cell
for (const [key] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");
}

// 2. floor slabs at each storey line (ground floor through roof deck)
for (const [key] of S) {
  const [x, z] = key.split(",").map(Number);
  for (let k = 0; k <= n; k++) {
    g.set(x, base + k * STOREY, z, "light_gray_concrete");
  }
}

// 3. exterior walls, windows, corners, string courses
for (const [key] of S) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const corner = isCorner(x, z);
  for (let y = base; y <= roofY; y++) {
    const rel = y - base;
    const k = Math.floor(rel / STOREY);
    const off = rel % STOREY;
    if (rel === roofY) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (off === 0) {
      g.set(x, y, z, corner ? "smooth_quartz" : "white_concrete");
      continue;
    }
    if (corner) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (k === 0) {
      // shopfront: full tinted glass between mullions, frame elsewhere
      if (off <= 3 && isWindow(x, z)) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "white_concrete");
    } else {
      if (off <= 3 && isWindow(x, z)) g.set(x, y, z, "light_blue_stained_glass_pane");
      else g.set(x, y, z, "white_concrete");
    }
  }
  // parapet and cornice cap
  g.set(x, roofY + 1, z, corner ? "smooth_quartz" : "white_concrete");
  g.set(x, roofY + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 4. entrance on the z=0 street face: double door with a dark oak canopy row
let dx = has(6, 0) ? 6 : null;
if (dx === null) {
  for (let x = 0; x < W; x++) if (has(x, 0)) { dx = x; break; }
}
if (dx !== null) {
  for (const x of [dx - 1, dx + 1]) {
    if (has(x, 0) && !isCorner(x, 0)) {
      // flanking glass stays; only the door cell is solid
    }
  }
  g.set(dx, base + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, base + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let x = dx - 1; x <= dx + 1; x++) {
    if (has(x, 0) && !isCorner(x, 0)) {
      g.set(x, base + 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 5. interior: warm lights set back behind some windows
for (let k = 0; k < n; k++) {
  for (const [key] of S) {
    const [x, z] = key.split(",").map(Number);
    if (!isWindow(x, z)) continue;
    if ((x + z + k) % 4 !== 0) continue;
    let ix = x, iz = z;
    if (x === 0) ix = 1; else if (x === W - 1) ix = W - 2;
    else if (z === 0) iz = 1; else if (z === D - 1) iz = D - 2;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    const y = base + k * STOREY + 2;
    g.set(ix, y, iz, (k + x) % 2 === 0 ? "glowstone" : "shroomlight");
  }
}

// 6. roof plant penthouse, centred on the roof
const PX0 = 4, PX1 = 9, PZ0 = 5, PZ1 = 11;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    if (!ring) continue;
    g.set(x, roofY + 1, z, "gray_concrete");
    g.set(x, roofY + 2, z, "gray_concrete");
    g.set(x, roofY + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
// penthouse glazing on its long faces
for (let x = PX0 + 1; x < PX1; x++) {
  if (has(x, PZ0)) g.set(x, roofY + 1, PZ0, "light_blue_stained_glass_pane");
  if (has(x, PZ1)) g.set(x, roofY + 1, PZ1, "light_blue_stained_glass_pane");
}

// 7. roof pad: a low plant platform and a few vents along the roof edge
for (let x = 1; x < W - 1; x += 4) {
  for (let z = 1; z < D - 1; z += 4) {
    if (!has(x, z) || isPerim(x, z)) continue;
    if (x >= PX0 - 1 && x <= PX1 + 1 && z >= PZ0 - 1 && z <= PZ1 + 1) continue;
    g.set(x, roofY + 1, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
