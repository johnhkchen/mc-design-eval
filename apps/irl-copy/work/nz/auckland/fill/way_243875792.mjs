// Way 243875792, Auckland (Mt Eden side of the CBD): a 1980s-90s mid-rise office tower, 15 storeys, on a
// stepped basalt plinth. Lidar roof heights are snapped to the 4-block storey grid and median-smoothed over the
// footprint: a 60 core, a 56 ring one storey down (the setback), and 12 wings (three storeys) along the north-east.
// Each storey stands on the one below, on a global 4-block line: the foundation fills from y 0 to the storey line
// above the cell's ground (basalt on the street edge, stone brick inside), so the downhill side shows its extra
// storeys. Facade = pale concrete frame (a white spandrel at each floor line, white piers every 3 cells, a
// light-grey head) with blue-tint glass panes between; the ground storey is a shopfront with a stone lintel and one
// recessed entrance under a hanging lantern. Interiors are air with a floor slab per storey; glowstone sits behind
// some panes. Glazing is blue-green (cyan) so the bays read as glass from the air, not as a pale slab. A plant box with lanterns stands on the top tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875792.cells.json", "utf8"));
const W = 72, D = 50, H = 74;
const grid = () => Array.from({ length: W }, () => Array(D).fill(null));
const G = grid(), R = grid();                                // ground (foundation), lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;
const up4 = (v) => 4 * Math.ceil(v / 4), snap4 = (v) => 4 * Math.round(v / 4);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// storey lines: foundation top FT (the storey line above the ground), roof TT (the lidar, snapped to the grid and
// median-smoothed over the footprint's 3x3)
const T0 = grid(), FT = grid(), TT = grid();
let bumped = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z)) T0[x][z] = snap4(R[x][z]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z)) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFP(x + dx, z + dz)) vals.push(T0[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  FT[x][z] = up4(G[x][z]);
  TT[x][z] = vals[Math.floor(vals.length / 2)];
  if (TT[x][z] < FT[x][z] + 4) { TT[x][z] = FT[x][z] + 4; bumped++; }     // at least one storey above its ground
}
const maxT = Math.max(...cells.map(([x, z]) => TT[x][z]));

// the shell: solid below FT, on each storey line, and at the roof TT; air between
const solid = (x, z, y) => {
  if (!inFP(x, z)) return false;
  const f = FT[x][z], t = TT[x][z];
  if (y < f || y === t) return true;
  if (y > t) return false;
  return (y - f) % 4 === 0;
};
// a facade face is needed where a neighbour is outside the building: off the footprint, or above its roof
const exterior = (x, z, y) => !inFP(x, z) || y > TT[x][z];
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => exterior(x + dx, z + dz, y));
const streetDirs = (x, z) => DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz));

// the entrance: a street-edge cell on the z-facing wall nearest the middle of the footprint, on the ground storey
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const zs = streetDirs(x, z).find(([, dz]) => dz !== 0);
  if (inFP(x, z) && zs && (!door || Math.abs(x - 36) < Math.abs(door.x - 36))) door = { x, z, dz: zs[1] };
}

const v = new Voxels([W, H, D]);
const PANE = "cyan_stained_glass_pane";                     // blue-green tinted glazing against the white frame

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  const f = FT[x][z], t = TT[x][z], street = streetDirs(x, z).length > 0;
  for (let y = 0; y < f; y++) v.set(x, y, z, street ? "polished_basalt" : "stone_bricks");   // foundation

  for (let y = f; y <= t; y++) {
    if (y === t) {                                               // roof: pale cornice on the edge, grey inside
      v.set(x, y, z, street ? "white_concrete" : "light_gray_concrete");
      if (street) v.set(x, y + 1, z, "stone_bricks");            // parapet
      continue;
    }
    const storey = Math.floor((y - f) / 4), r = (y - f) % 4;
    const ex = exposedDirs(x, z, y);
    if (r === 0) {                                               // a floor line: slab, or the spandrel on the facade
      const facade = ex.length > 0;
      v.set(x, y, z, facade ? (storey === 0 ? "polished_basalt" : "white_concrete") : "light_gray_concrete");
      continue;
    }
    if (ex.length === 0) continue;                                // interior air
    const alongX = ex.some(([, dz]) => dz !== 0);                 // the wall runs along x (neighbour at +-z)
    const alongZ = ex.some(([dx]) => dx !== 0);                   // the wall runs along z (neighbour at +-x)
    const idx = alongX && !alongZ ? x : alongZ && !alongX ? z : x + z;
    const door_ = storey === 0 && door && x === door.x && z === door.z;
    if (r === 3) {                                                // head course; the entrance lantern hangs here
      if (door_) v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else v.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (door_) {
      const facing = door.dz > 0 ? "north" : "south";
      v.set(x, y, z, "oak_door", { facing, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if ((alongX && alongZ) || idx % (storey === 0 ? 4 : 3) === 0) { v.set(x, y, z, "white_concrete"); continue; }
    const connect = alongX && !alongZ
      ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" };
    v.set(x, y, z, PANE, { ...connect, waterlogged: "false" });
  }
}

// warm light behind some panes: the air cell one step inside a glass pane, on the first row of a storey
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z) || TT[x][z] <= FT[x][z]) continue;
  const f = FT[x][z], t = TT[x][z];
  for (let y = f + 1; y < t; y += 4) {
    const pane = v.get(x, y, z);
    if (!pane || pane.block !== PANE || (x * 7 + z * 5 + y * 3) % 11 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const ix = x - dx, iz = z - dz;                             // inward: opposite the way the pane faces
      if (!inFP(ix, iz) || exterior(ix, iz, y) || v.get(ix, y, iz)) continue;
      if (!exposedDirs(x, z, y).some(([ax, az]) => ax === dx && az === dz)) continue;
      v.set(ix, y, iz, "glowstone");
      break;
    }
  }
}

// roof plant on the top tier: a grey box with a stone cap and two lanterns, inside the top tier only
const top = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFP(x, z) && TT[x][z] === maxT) {
  if (DIRS.every(([dx, dz]) => inFP(x + dx, z + dz) && TT[x + dx][z + dz] === maxT)) top.push([x, z]);
}
if (top.length) {
  const mean = (i) => Math.round(top.reduce((s, c) => s + c[i], 0) / top.length);
  const cx = mean(0), cz = mean(1);
  const plant = top.filter(([x, z]) => Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 2);
  for (const [x, z] of plant) {
    for (let y = maxT + 1; y <= maxT + 2; y++) v.set(x, y, z, "light_gray_concrete");
    v.set(x, maxT + 3, z, "stone_bricks");
  }
  for (const [x, z] of plant.filter(([x, z]) => Math.abs(x - cx) === 4 && Math.abs(z - cz) === 2)) {
    v.set(x, maxT + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const out = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875792.nbt");
console.log(JSON.stringify({ cells: cells.length, bumped, maxRoof: maxT, door, ...out }));
