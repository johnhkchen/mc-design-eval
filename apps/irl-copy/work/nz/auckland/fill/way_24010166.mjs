// AMI Building, Auckland CBD: a late-1980s corporate office tower. A granite plinth, a stone-and-concrete frame
// with pale piers every third bay, blue tinted glass in the window bays, white spandrels, a wing slab at ~59 blocks
// with a 64-block core and a plant box on top. The lidar roof is cleaned by a 3x3 median and quantised into tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_24010166.cells.json`, "utf8"));
const W = 36, D = 32, H = 77;

const PLINTH = "polished_granite", FOUND = "stone", FLOOR = "light_gray_concrete", PIER = "smooth_quartz";
const SPAN = "white_concrete", GLASS = "light_blue_stained_glass_pane", LINTEL = "polished_andesite";
const CORNICE = "polished_andesite", ROOF = "gray_concrete", PEN = "light_gray_concrete", LOUVER = "iron_bars";
const GLOW = "glowstone", ROD = "lightning_rod", LANTERN = "lantern", DOOR = "dark_oak_door";

// footprint and raw lidar roof per cell
const inFp = Array.from({ length: D }, () => Array(W).fill(false));
const raw = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) { inFp[z][x] = true; raw[z][x] = r; }
const fp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inFp[z][x];

// 3x3 median of the lidar roof (drops out lone 1-block noise), then quantised tiers:
// core 64 (roof >= 61), wings 59 (52-60), lower wings on storey lines (3 + 4k), so every tier is a clean floor line
const topOf = (r) => {
  if (r >= 61) return 64;
  if (r >= 52) return 59;
  return Math.max(7, 3 + 4 * Math.round((r - 3) / 4));
};
const top = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp[z][x]) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (fp(x + dx, z + dz)) vals.push(raw[z + dz][x + dx]);
  vals.sort((a, b) => a - b);
  top[z][x] = topOf(vals[vals.length >> 1]);
}

const occ = (x, z, y) => fp(x, z) && y < top[z][x];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz, y));
const isShell = (x, z, y) => exposed(x, z, y).length > 0;

// a flat roof box (w x d) of interior cells all at height t: returns its corner, or null
const findBox = (t, w, d) => {
  let best = null, bestDist = Infinity;
  let cx = 0, cz = 0, n = 0;
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFp[z][x] && top[z][x] === t) { cx += x; cz += z; n++; }
  cx /= n; cz /= n;
  for (let z0 = -1; z0 <= D; z0++) for (let x0 = -1; x0 <= W; x0++) {
    let ok = true;
    for (let z = z0 - 1; z <= z0 + d && ok; z++) for (let x = x0 - 1; x <= x0 + w && ok; x++) {
      const inner = x >= x0 && x < x0 + w && z >= z0 && z < z0 + d;
      if (inner ? !(fp(x, z) && top[z][x] === t) : !(fp(x, z) && top[z][x] >= t)) ok = false;
    }
    if (ok) {
      const dist = Math.hypot(x0 + w / 2 - cx, z0 + d / 2 - cz);
      if (dist < bestDist) { bestDist = dist; best = [x0, z0]; }
    }
  }
  return best;
};

const g = new Voxels([W, H, D]);

// the foundation: solid from y 0 to the floor line (every cell's ground is at most 2, so this is each cell's own ground)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp[z][x]) continue;
  for (let y = 0; y <= 2; y++) g.set(x, y, z, isShell(x, z, y) ? PLINTH : FOUND);
}

// the storeys: a slab on every floor line (3, 7, 11 ...), a 3-block storey between, a cap on each tier's top
const paneState = (x, y, z) => {
  const st = {};
  const names = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  for (const [n, [dx, dz]] of Object.entries(names)) {
    const nx = x + dx, nz = z + dz;
    st[n] = occ(nx, nz, y) && isShell(nx, nz, y) ? "true" : "false";
  }
  return st;
};
const lit = (x, y, z, F, pier) => !pier && F > 3 && (x * 7 + z * 13 + F) % 9 === 0;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp[z][x]) continue;
  const T = top[z][x];
  for (let y = 3; y < T; y++) {
    const off = (y - 3) % 4, F = y - off;
    const ex = exposed(x, z, y), shell = ex.length > 0;
    if (y === T - 1) { g.set(x, y, z, shell ? CORNICE : ROOF); continue; }
    if (off === 0) { g.set(x, y, z, FLOOR); continue; }
    if (!shell) continue;                          // interior: air behind the glass
    const exZ = ex.some(([, dz]) => dz !== 0), exX = ex.some(([dx]) => dx !== 0);
    const along = exZ && !exX ? x : exX && !exZ ? z : -1;
    const pier = along === -1 || along % 3 === 0;  // corners and every third bay are piers
    if (F === 3) {                                 // shopfront: glass to a lintel
      if (off === 3) g.set(x, y, z, LINTEL);
      else g.set(x, y, z, pier ? PIER : GLASS, pier ? undefined : paneState(x, y, z));
      continue;
    }
    if (off === 1) {
      if (pier) { g.set(x, y, z, PIER); continue; }
      if (lit(x, y, z, F, pier) && ex.length === 1) {
        const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
        if (fp(ix, iz) && !isShell(ix, iz, y)) {   // a warm light stands on the floor behind the glass
          g.set(x, y, z, GLASS, paneState(x, y, z));
          g.set(ix, y, iz, GLOW);
          continue;
        }
      }
      g.set(x, y, z, SPAN);
      continue;
    }
    g.set(x, y, z, pier ? PIER : GLASS, pier ? undefined : paneState(x, y, z));
  }
}

// the entrance: a door on the south-facing ring, centred on the frontage, with a hanging lantern in the lobby
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp[z][x] || top[z][x] < 7 || !isShell(x, z, 4)) continue;
  if (!exposed(x, z, 4).some(([dx, dz]) => dx === 0 && dz === 1)) continue;
  if (!door || Math.abs(x - 17) < Math.abs(door[0] - 17)) door = [x, z];
}
if (door) {
  const [dx, dz] = door;
  g.set(dx, 4, dz, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 5, dz, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (fp(dx, dz - 1) && !isShell(dx, dz - 1, 6)) g.set(dx, 6, dz - 1, LANTERN, { hanging: "true", waterlogged: "false" });
}

// roof plant: a penthouse on the wing roof (louvred), a plant box on the core with a lightning rod
const pen = findBox(59, 7, 6);
if (pen) {
  const [x0, z0] = pen;
  for (let z = z0; z < z0 + 6; z++) for (let x = x0; x < x0 + 7; x++) {
    const ring = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 5;
    for (let y = 59; y <= 61; y++) {
      if (!ring) continue;
      if (y === 60 && (x + z) % 2 === 0) g.set(x, y, z, LOUVER);
      else g.set(x, y, z, PEN);
    }
    g.set(x, 62, z, ROOF);
  }
}
const plant = findBox(64, 4, 4);
if (plant) {
  const [x0, z0] = plant;
  for (let z = z0; z < z0 + 4; z++) for (let x = x0; x < x0 + 4; x++) {
    const ring = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 3;
    for (let y = 64; y <= 66; y++) if (ring) g.set(x, y, z, PEN);
    g.set(x, 67, z, ROOF);
  }
  g.set(x0 + 1, 68, z0 + 1, ROD);
}

const out = `${DIR}/way_24010166.nbt`;
const info = g.save(out);
console.log(`way_24010166: ${info.blocks} blocks, ${info.palette} palette entries; tiers`,
  { core: cells.filter(([x, z]) => top[z][x] === 64).length, wings: cells.filter(([x, z]) => top[z][x] === 59).length,
    lower: cells.filter(([x, z]) => top[z][x] < 59).length, door, pen, plant });
