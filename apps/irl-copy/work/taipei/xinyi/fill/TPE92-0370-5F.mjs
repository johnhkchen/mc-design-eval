import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0370-5F";
const W = 11, H = 38, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup ------------------------------------------------------
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, Math.max(0, Math.min(H - 1, gr | 0)));
const inFoot = (x, z) => foot.has(`${x},${z}`);

const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
const outwardFaces = (x, z) =>
  Object.keys(DIRS).filter(f => !inFoot(x + DIRS[f][0], z + DIRS[f][1]));
const isPerimeter = (x, z) => outwardFaces(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inFoot(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- storey datum: 2003 mid-rise office, 5 storeys ----------------------------
// floors at y = 1,6,11,16,21 ; roof slab at y = 26 ; parapet 27-28
const FLOORS = [1, 6, 11, 16, 21];
const ROOF_Y = 26;
const TOP_WALL = 25;

// ---- entrance: south face, cell nearest the middle of the south edge ----------
const midX = (W - 1) / 2;
let entX = null;
for (const [x, z] of cells) {
  if (inFoot(x, z + 1)) continue;
  if (entX === null || Math.abs(x - midX) < Math.abs(entX - midX)) entX = x;
}
const entZ = D - 1;
const hasEntrance = entX !== null && inFoot(entX, entZ);

// ---- 1. foundation + plinth ------------------------------------------------------
for (const [x, z, gr] of cells) {
  const top = Math.max(Math.max(0, Math.min(H - 1, gr | 0)), 1); // y 0 always solid
  for (let y = 0; y < top; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. interior floor slabs at each storey line -----------------------------
for (const F of FLOORS) {
  for (const [x, z, gr] of cells) {
    const grd = Math.max(0, Math.min(H - 1, gr | 0));
    if (F >= grd && !isPerimeter(x, z)) put(x, F, z, "smooth_quartz");
  }
}

// ---- 3. facade: walls, windows, piers, warm lights ----------------------------
// Warm light is kept to a handful of bays: the shopfront and the top storey,
// so the glow reads as a deliberate pattern instead of speckle.
const warmBay = (bayIdx, k) =>
  (k === 0 && (bayIdx === 1 || bayIdx === 3)) ||
  (k === FLOORS.length - 1 && bayIdx === 2);

for (const [x, z, gr] of cells) {
  if (!isPerimeter(x, z)) continue;
  const grd = Math.max(0, Math.min(H - 1, gr | 0));
  const outs = outwardFaces(x, z);
  const face = outs[0];
  const alongNS = face === "north" || face === "south";
  const t = alongNS ? x : z;
  const tMax = alongNS ? W - 1 : D - 1;
  const corner = (t === 0 || t === tMax);
  const pier = corner || t % 3 === 0;
  const bayIdx = Math.floor(t / 3);
  const [ox, oz] = DIRS[face];
  const ix = x - ox, iz = z - oz;

  for (let y = Math.max(grd, 1); y <= TOP_WALL; y++) {
    let k = -1;
    for (let i = FLOORS.length - 1; i >= 0; i--) if (y >= FLOORS[i]) { k = i; break; }
    if (k < 0) continue;
    const rel = y - FLOORS[k];

    if (rel === 0) {
      put(x, y, z, k === 0 ? "stone_bricks" : "smooth_quartz");
    } else if (rel === 4) {
      // spandrel: corner posts stay light grey, field stays white
      put(x, y, z, corner ? "smooth_quartz" : "white_concrete");
    } else if (pier) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
      if (rel === 2 && warmBay(bayIdx, k) && inFoot(ix, iz) && !isPerimeter(ix, iz)) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- 4. entrance on south face ---------------------------------------------------
if (hasEntrance) {
  const ex = entX, ez = entZ;
  put(ex, 2, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, 3, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, 4, ez, "light_blue_stained_glass");
  for (const dx of [-1, 1]) {
    if (inFoot(ex + dx, ez)) {
      put(ex + dx, 2, ez, "light_gray_concrete");
      put(ex + dx, 3, ez, "light_gray_concrete");
      put(ex + dx, 4, ez, "light_gray_concrete");
    }
  }
}

// ---- 5. roof, parapet, cornice ----------------------------------------------------
for (const [x, z, gr] of cells) {
  const grd = Math.max(0, Math.min(H - 1, gr | 0));
  if (ROOF_Y >= grd) put(x, ROOF_Y, z, "gray_concrete");
}
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) continue;
  put(x, 27, z, "smooth_quartz");
  put(x, 28, z, "white_concrete");
}
// raised corner posts on the parapet, so the massing reads from the air
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) continue;
  const cornerX = (x === 0 || x === W - 1);
  const cornerZ = (z === 0 || z === D - 1);
  if (cornerX && cornerZ) {
    put(x, 29, z, "smooth_quartz");
  }
}

// ---- 6. roof plant room (central core) -------------------------------------------
const PX0 = 3, PX1 = 7, PZ0 = 4, PZ1 = 8;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!inFoot(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = 27; y <= 29; y++) {
      if (ring) put(x, y, z, y === 28 ? "light_blue_stained_glass" : "light_gray_concrete");
    }
    put(x, 30, z, "gray_concrete");
  }
}

// ---- 7. antenna mast ------------------------------------------------------------
if (inFoot(5, 6)) {
  put(5, 31, 6, "lightning_rod");
  put(5, 32, 6, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
