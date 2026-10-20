import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343698.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343698.nbt";

// Record: 23 x 20 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, 1970s-80s Taipei commercial block: a tiled
// (smooth quartz) concrete frame, a shopfront on the ground storey,
// a window grid above, a concrete string course, a parapet, and a
// small rooftop mechanical room.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 23, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const has = (x, z) => fp.has(key(x, z));
const gOf = (x, z) => fp.get(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const ROOF_Y = minG + 10;   // roof deck
const WALL_TOP = minG + 9;  // last wall course
const PARAPET_Y = minG + 11;

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // on N/S faces
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // on E/W faces

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Facades on edge cells.
const faceOf = new Map();
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  let face, idx, dx = 0, dz = 0;
  if (!has(x, z - 1)) { face = "N"; idx = x; dz = 1; }
  else if (!has(x, z + 1)) { face = "S"; idx = x; dz = -1; }
  else if (!has(x - 1, z)) { face = "W"; idx = z; dx = 1; }
  else { face = "E"; idx = z; dx = -1; }
  faceOf.set(key(x, z), { face, idx, dx, dz });

  const pane = face === "N" || face === "S" ? PANE_NS : PANE_EW;
  for (let y = gr; y <= WALL_TOP; y++) {
    const rel = y - minG;
    const pier = idx % 4 === 0;
    if (rel === 0) {
      put(x, y, z, "stone_bricks");                         // plinth
    } else if (rel >= 1 && rel <= 3) {
      if (pier) put(x, y, z, "smooth_quartz");              // shopfront piers
      else put(x, y, z, "glass_pane", pane);                // shopfront glazing
    } else if (rel === 4 || rel === 5) {
      put(x, y, z, "light_gray_concrete");                  // lintel band / storey line
    } else if (rel >= 6 && rel <= 8) {
      if (pier) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane", pane);
    } else if (rel === 9) {
      put(x, y, z, "light_gray_concrete");                  // upper frame / cornice
    }
  }

  // Parapet and cap.
  put(x, PARAPET_Y, z, "smooth_quartz");
  put(x, PARAPET_Y + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Interior floor slab at storey line, and the roof deck over the whole footprint.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) put(x, minG + 5, z, "light_gray_concrete");
  put(x, ROOF_Y, z, "smooth_stone");
}

// 4. Warm light: glowstone behind some upper-storey windows (inside the shell).
for (const [x, z, gr] of cells) {
  const info = faceOf.get(key(x, z));
  if (!info) continue;
  const { idx, dx, dz } = info;
  if (idx % 8 !== 2) continue;
  const y = minG + 7;
  if (y < gr) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || gOf(ix, iz) > y || isEdge(ix, iz)) continue;
  put(ix, y, iz, "glowstone");
}

// 5. Rooftop mechanical room: a 5 x 4 box on the roof, fully over footprint cells.
const boxW = 5, boxD = 4;
let best = null;
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
for (let bx = minX; bx + boxW - 1 <= maxX; bx++) {
  for (let bz = minZ; bz + boxD - 1 <= maxZ; bz++) {
    let ok = true;
    for (let x = bx; x < bx + boxW && ok; x++)
      for (let z = bz; z < bz + boxD && ok; z++)
        if (!has(x, z) || isEdge(x, z) || gOf(x, z) > ROOF_Y) ok = false;
    if (!ok) continue;
    const d = Math.abs(bx + boxW / 2 - cx) + Math.abs(bz + boxD / 2 - cz);
    if (!best || d < best.d) best = { bx, bz, d };
  }
}
if (best) {
  const { bx, bz } = best;
  for (let x = bx; x < bx + boxW; x++) {
    for (let z = bz; z < bz + boxD; z++) {
      const wall = x === bx || x === bx + boxW - 1 || z === bz || z === bz + boxD - 1;
      for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) {
        if (wall) {
          // Louvred vents on the side walls at mid height, solid elsewhere.
          const vent = y === ROOF_Y + 2 && (x === bx || x === bx + boxW - 1) && z > bz && z < bz + boxD - 1;
          put(x, y, z, vent ? "iron_bars" : "light_gray_concrete");
        }
      }
      put(x, ROOF_Y + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 6. Entrance: on the north face, nearest the middle, at ground level. Door and hanging lantern.
const north = [...faceOf.entries()]
  .filter(([, v]) => v.face === "N")
  .map(([k, v]) => ({ k, v, x: Number(k.split(",")[0]), z: Number(k.split(",")[1]) }))
  .sort((a, b) => Math.abs(a.x - (minX + maxX) / 2) - Math.abs(b.x - (minX + maxX) / 2));
const entry = north.find((e) => gOf(e.x, e.z) <= minG + 1);
if (entry) {
  const { x, z } = entry;
  put(x, minG + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, minG + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, minG + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(OUT);
