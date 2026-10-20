import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office/residential block, Xinyi, c. 1990s-2000s.
// Four storeys of 5 blocks, white concrete with blue-tinted glazing,
// stone plinth, quartz piers and corners, cornice and parapet, a central
// penthouse with an antenna, and an entrance on the south face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280210";
const W = 19, H = 33, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Missing neighbours = exposed faces. N = -z, S = +z, W = -x, E = +x.
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ROOF_DECK = 20;   // interior roof deck / exterior cornice level
const PARAPET = 21;     // parapet course
const PH_BASE = 21;     // penthouse starts on the deck
const PH_TOP = 24;
const ANT_TOP = 25;

const glassN = (x, z) => ({ north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
const glassEW = (x, z) => ({ north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Entrance: exposed south face cell nearest the footprint's mean x.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
let entranceX = null;
if (southCells.length) {
  const meanX = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
  entranceX = southCells.reduce((best, [x]) =>
    best === null || Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best, null);
}
const entranceZ = entranceX === null ? null : maxZ;

// 1. Foundation plinth under every cell.
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
}

// 2. Exterior walls, storey articulation, cornice and parapet.
for (const [x, z, gc] of cells) {
  const F = faces(x, z);
  if (F.length === 0) continue;
  const corner = F.some(f => f === "N" || f === "S") && F.some(f => f === "W" || f === "E");
  const alongZ = F.includes("N") || F.includes("S");
  const t = alongZ ? x - minX : z - minZ;
  const pier = t % 3 === 0;

  for (let y = gc; y <= PARAPET; y++) {
    if (y === PARAPET) {
      put(x, y, z, corner ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (y === ROOF_DECK) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    const k = Math.floor(y / 5);
    const o = y % 5;
    if (k === 0) {
      if (o === 0) put(x, y, z, "stone_bricks");
      else if (o <= 2) {
        if (pier) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "light_blue_stained_glass_pane", alongZ ? glassN(x, z) : glassEW(x, z));
      }
      else if (o === 3) put(x, y, z, "smooth_stone");
      else put(x, y, z, "white_concrete");
    } else {
      if (o === 0) put(x, y, z, "light_gray_concrete");
      else if (o <= 3) {
        if (pier) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "light_blue_stained_glass_pane", alongZ ? glassN(x, z) : glassEW(x, z));
      }
      else put(x, y, z, "white_concrete");
    }
  }
}

// 3. Interior floor slabs per storey and the roof deck (air gap left above floors).
for (const [x, z, gc] of cells) {
  if (faces(x, z).length !== 0) continue;
  const levels = new Set([gc, 5, 10, 15]);
  for (const y of levels) if (y >= gc && y < ROOF_DECK) put(x, y, z, "light_gray_concrete");
  put(x, ROOF_DECK, z, "light_gray_concrete");
}

// 4. Warm lights behind some windows: glowstone on the interior cell, 2 blocks up in each storey.
for (const [x, z, gc] of cells) {
  const F = faces(x, z);
  if (F.length === 0) continue;
  const corner = F.some(f => f === "N" || f === "S") && F.some(f => f === "W" || f === "E");
  if (corner) continue;
  const alongZ = F.includes("N") || F.includes("S");
  const t = alongZ ? x - minX : z - minZ;
  if (t % 3 === 0) continue;
  const face = alongZ ? (F.includes("N") ? "N" : "S") : (F.includes("W") ? "W" : "E");
  const [ix, iz] = face === "N" ? [x, z + 1]
    : face === "S" ? [x, z - 1]
    : face === "W" ? [x + 1, z]
    : [x - 1, z];
  if (!has(ix, iz) || faces(ix, iz).length !== 0) continue;
  for (let k = 0; k < 4; k++) {
    if ((t + k) % 3 !== 0) continue;
    const y = 5 * k + 2;
    if (y < gAt(ix, iz) || y >= ROOF_DECK) continue;
    put(ix, y, iz, "glowstone");
  }
}

// 5. Entrance: door, lintel and a small dark-oak canopy on the south face.
if (entranceX !== null) {
  const gc = gAt(entranceX, entranceZ);
  for (const dx of [-1, 0, 1]) {
    const x = entranceX + dx;
    if (!has(x, entranceZ) || !faces(x, entranceZ).includes("S")) continue;
    put(x, gc + 2, entranceZ, "smooth_quartz");
    put(x, gc + 3, entranceZ, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  put(entranceX, gc, entranceZ, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false"
  });
  put(entranceX, gc + 1, entranceZ, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false"
  });
}

// 6. Rooftop penthouse on the interior of the roof, with glazed band and antenna.
const mx = Math.floor((minX + maxX) / 2);
const mz = Math.floor((minZ + maxZ) / 2);
for (let x = mx - 3; x <= mx + 3; x++) {
  for (let z = mz - 2; z <= mz + 2; z++) {
    if (!has(x, z) || faces(x, z).length !== 0) continue;
    const edge = x === mx - 3 || x === mx + 3 || z === mz - 2 || z === mz + 2;
    for (let y = PH_BASE; y < PH_TOP; y++) {
      if (y === 22 && edge) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "white_concrete");
    }
    put(x, PH_TOP, z, "smooth_quartz");
  }
}
if (has(mx, mz) && faces(mx, mz).length === 0) {
  for (let y = PH_TOP + 1; y <= ANT_TOP; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
