// Eastport Service Centre, Auckland: a 1970s-80s pale-concrete office block on Maungawhau's flank. Six storeys
// (26 blocks, the lidar roof) on the main body, stepping down through 4-block tiers to two-storey wings. Each storey is
// 4 blocks: a light-grey spandrel band, two rows of tinted glass between white concrete piers, and a head band.
// A polished-stone plinth and cornice frame the block; the top has a parapet and a roof plant room on the roof.
// The shell is one block thick with a one-block air gap behind the glass, and a solid floor slab on every storey
// (y = 4k), so every tier and floor stands on what is below it. Warm lanterns sit behind some windows, and the
// ground floor has a glazed entrance on the north face. Heights come from the lidar roof, median-smoothed.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_531457272.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_531457272.nbt";

const W = 37, D = 41, H = 39, STOREY = 4, MAIN_TOP = 26;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const idx = (x, z) => z * W + x;
const ground = new Int16Array(W * D).fill(-1);       // -1 = outside the footprint
const roof = new Int16Array(W * D);
for (const [x, z, g, r] of cells) { ground[idx(x, z)] = g; roof[idx(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[idx(x, z)] >= 0;

// 1. Smooth the lidar roof with a 3x3 median and quantise it to flat tiers: 8, 12, 16, 20 or the 26-block main body.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const top = new Int16Array(W * D);                    // solid column height, 0 outside the footprint
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) vals.push(roof[idx(x + dx, z + dz)] - ground[idx(x + dx, z + dz)]);
  const r = median(vals);
  top[idx(x, z)] = r >= 22 ? MAIN_TOP : Math.min(24, Math.max(8, Math.round(r / STOREY) * STOREY));
}
const T = (x, z) => (inside(x, z) ? top[idx(x, z)] : 0);

// 2. Roles. A cell is solid when it is the base, a roof, a wall (it has an air neighbour on a side), or a floor slab.
const DIRS = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];
const exposure = (x, y, z) => DIRS.filter(({ dx, dz }) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || T(nx, nz) <= y; });
const role = (x, y, z) => {
  if (!inside(x, z)) return null;
  const t = T(x, z); if (y >= t) return null;
  if (y === 0) return "base";
  if (exposure(x, y, z).length) return "wall";
  if (y === t - 1) return "roof";
  if (y % STOREY === 0) return "floor";
  return null;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 3. The entrance: on the north face at ground level, the glazed bay nearest the middle of the frontage.
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (role(x, 1, z) !== "wall" || x % 3 === 0) continue;
  if (!exposure(x, 1, z).some((d) => d.dz === -1)) continue;
  if (!door || Math.abs(x - 18) < Math.abs(door.x - 18)) door = { x, z };
}

// 4. Roof plant room: a 9 x 7 box on the main body, set in from its edges, centred on the tower.
let plant = null;
{
  let sx = 0, sz = 0, n = 0;
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (T(x, z) === MAIN_TOP) { sx += x; sz += z; n++; }
  const cx = sx / n, cz = sz / n;
  let best = null;
  for (let z = 4; z < D - 4; z++) for (let x = 5; x < W - 5; x++) {
    let ok = true;
    for (let dz = -3; dz <= 3 && ok; dz++) for (let dx = -4; dx <= 4 && ok; dx++) if (T(x + dx, z + dz) !== MAIN_TOP) ok = false;
    if (!ok) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (!best || d < best.d) best = { x0: x - 4, x1: x + 4, z0: z - 3, z1: z + 3, d };
  }
  plant = best;
}
const inPlant = (x, z) => plant && x >= plant.x0 && x <= plant.x1 && z >= plant.z0 && z <= plant.z1;

// 5. Facade: the material for a wall cell, from its height in the storey and its position along the face.
const wallBlock = (x, y, z, t, exp) => {
  if (y === t - 1) return "light_gray_concrete";            // parapet
  if (y === t - 2) return "polished_andesite";              // cornice
  const u = exp[0].dx !== 0 ? z : x;                          // position along the face (stair steps take the first face)
  const pier = u % 3 === 0;
  const row = y % STOREY;
  if (row === 0 || row === 3) return pier ? "white_concrete" : "light_gray_concrete";
  return pier ? "white_concrete" : "light_blue_stained_glass";
};

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const r = role(x, y, z);
    if (!r) continue;
    if (r === "base") put(x, y, z, "polished_andesite");
    else if (r === "roof" || r === "floor") put(x, y, z, "smooth_stone");
    else put(x, y, z, wallBlock(x, y, z, t, exposure(x, y, z)));
  }
}

// 6. Glass work over the facade: the entrance door, its stone surround, and warm lanterns just inside some windows.
if (door) {
  const { x, z } = door;
  for (const y of [1, 2]) for (const dx of [-1, 1]) if (role(x + dx, y, z) === "wall") put(x + dx, y, z, "polished_andesite");
  for (const y of [1, 2]) {
    const st = { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    put(x, y, z, "dark_oak_door", st);
  }
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const t = T(x, z);
  for (let y = 1; y < t - 2; y++) {
    if (y % STOREY !== 1) continue;
    const r = role(x, y, z);
    if (r !== "wall") continue;
    const exp = exposure(x, y, z);
    if (exp.length !== 1) continue;
    const u = exp[0].dx !== 0 ? z : x;
    if (u % 3 === 0 || (door && x === door.x && z === door.z)) continue;
    const ix = x - exp[0].dx, iz = z - exp[0].dz;
    if (role(ix, y, iz) !== null) continue;
    if ((u * 7 + Math.floor(y / STOREY) * 3) % 5 !== 0) continue;
    put(ix, y, iz, "lantern", { hanging: "false" });
  }
}

// 7. The roof plant room: a light concrete box with vent slots, standing on the roof.
if (plant) {
  for (let y = MAIN_TOP; y <= MAIN_TOP + 2; y++) for (let z = plant.z0; z <= plant.z1; z++) for (let x = plant.x0; x <= plant.x1; x++) {
    const edge = x === plant.x0 || x === plant.x1 || z === plant.z0 || z === plant.z1;
    if (y === MAIN_TOP + 2) put(x, y, z, "light_gray_concrete");
    else if (edge) put(x, y, z, y === MAIN_TOP + 1 && (x + z) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
  }
}

const info = g.save(OUT);
console.log(`eastport: ${info.blocks} blocks, ${info.palette} palette entries; door ${JSON.stringify(door)}; plant ${JSON.stringify(plant)}`);
