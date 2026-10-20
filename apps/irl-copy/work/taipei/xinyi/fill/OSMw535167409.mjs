import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise commercial block, c.1985-1995, Xinyi district.
// Five storeys of 5 blocks, pale concrete with a cyan glass ribbon, a dark
// red fascia over a shopfront, parapet, rooftop plant and a penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167409";
const W = 11, H = 38, D = 22;
const FLOOR_H = 5;
const ROOF_Y = 25;      // top of the 5th storey (roof slab)
const PARAPET_TOP = 27; // parapet blocks at 26..27, cap at 28
const PH = { x0: 3, x1: 7, z0: 7, z1: 14 }; // penthouse rectangle

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const key = (x, z) => x + "," + z;
const FP = new Set();
const GR = new Map();
for (const c of list) {
  const x = c[0], z = c[1];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  FP.add(key(x, z));
  GR.set(key(x, z), Math.min(Math.max(0, Math.round(c[2] ?? 0)), PARAPET_TOP - 3));
}
const inFP = (x, z) => FP.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_ORDER = ["N", "S", "W", "E"];

function exteriorFace(x, z) {
  for (const f of FACE_ORDER) {
    const [dx, dz] = DIRS[f];
    if (!inFP(x + dx, z + dz)) return f;
  }
  return null;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inFP(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneProps = (f) =>
  (f === "N" || f === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const EXT = new Map();
for (const k of FP) {
  const [x, z] = k.split(",").map(Number);
  EXT.set(k, exteriorFace(x, z));
}

// Pass 1: foundations, floor slabs and roof slab on every footprint cell.
for (const k of FP) {
  const [x, z] = k.split(",").map(Number);
  const gr = GR.get(k) ?? 0;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");
  for (let s = 1; s <= 4; s++) {
    const fy = s * FLOOR_H;
    if (fy > gr) put(x, fy, z, "smooth_stone");
  }
  put(x, ROOF_Y, z, "stone");
}

// Pass 2: exterior facades, cornice and parapet.
for (const k of FP) {
  const [x, z] = k.split(",").map(Number);
  const f = EXT.get(k);
  if (!f) continue;
  const gr = GR.get(k) ?? 0;
  const u = (f === "N" || f === "S") ? x : z;

  for (let y = gr; y <= ROOF_Y - 1; y++) {
    const s = Math.floor(y / FLOOR_H);
    const rel = y % FLOOR_H;
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (s === 0) {
      if (y === 4) { put(x, y, z, "red_concrete"); continue; }
      if (f === "N" && u === 5 && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (f === "N" && u === 5 && y === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (u % 3 === 0) { put(x, y, z, "stone_bricks"); continue; }
      put(x, y, z, "cyan_stained_glass_pane", paneProps(f));
      continue;
    }
    // Upper storeys
    if (rel === 0) { put(x, y, z, "smooth_stone"); continue; }
    if (rel === 4) { put(x, y, z, "white_concrete"); continue; }
    if (u % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }
    put(x, y, z, "cyan_stained_glass_pane", paneProps(f));
  }

  // Warm light behind some upper-storey windows (in the gap just inside the glass).
  for (let s = 1; s <= 4; s++) {
    const y = s * FLOOR_H + 2;
    if (y <= gr || y >= ROOF_Y) continue;
    if (s % 2 === 1 && u % 6 === 1) {
      const [dx, dz] = DIRS[f];
      const ix = x - dx, iz = z - dz;
      if (inFP(ix, iz) && !EXT.get(key(ix, iz))) put(ix, y, iz, "glowstone");
    }
  }

  // Cornice and parapet with cap.
  put(x, ROOF_Y, z, "smooth_stone");
  for (let y = ROOF_Y + 1; y <= PARAPET_TOP; y++) put(x, y, z, "white_concrete");
  put(x, PARAPET_TOP + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 3: rooftop plant on interior roof cells.
for (const k of FP) {
  const [x, z] = k.split(",").map(Number);
  if (EXT.get(k)) continue;
  const inPH = x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;
  if (inPH) continue;
  if (x % 4 === 1 && z % 5 === 2) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    put(x, ROOF_Y + 2, z, "light_gray_concrete");
  }
}

// Pass 4: penthouse with glass band, roof at y=30.
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inFP(x, z)) continue;
    put(x, ROOF_Y + 1, z, "smooth_stone");
    put(x, ROOF_Y + 5, z, "smooth_stone");
    const perim = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (!perim) continue;
    const corner = (x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1);
    put(x, ROOF_Y + 2, z, "white_concrete");
    if (corner) {
      put(x, ROOF_Y + 3, z, "white_concrete");
      put(x, ROOF_Y + 4, z, "white_concrete");
    } else {
      const f = (x === PH.x0 || x === PH.x1) ? "W" : "N";
      put(x, ROOF_Y + 3, z, "cyan_stained_glass_pane", paneProps(f));
      put(x, ROOF_Y + 4, z, "cyan_stained_glass_pane", paneProps(f));
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
