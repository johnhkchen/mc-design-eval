import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60297.cells.json`, "utf8"));

// Commercial office, 1120 Connecticut Ave NW: 1970s-80s Washington office block,
// polished granite base, red brick piers and spandrels, quartz floor bands and cornice,
// blue glazing, dark oak entrance doors under a dark canopy.
const W = 36, D = 28, H = 35;
const g = new Voxels([W, H, D]);

const k = (x, z) => x + "," + z;
const raw = new Map();
for (const row of cells) {
  const [x, z, gr, rf] = row;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(k(x, z), { g: Math.max(0, Math.round(gr)), rf: rf });
}

// Smooth lidar roof over a 3x3 neighbourhood, then quantise into 4-block storey tiers.
const cell = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(k(x + dx, z + dz));
    if (o) { sum += o.rf; n++; }
  }
  const avg = sum / n;
  let roof = Math.round(avg / 4) * 4;
  roof = Math.min(H - 5, Math.max(c.g + 8, roof));
  cell.set(key, { g: c.g, r: roof });
}

const has = (x, z) => cell.has(k(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// A block at height y is exterior if any side faces a missing cell or a neighbour
// whose roof is at or below y (so the step-down wall is shown, not left open).
function exposed(x, z, y) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dx, dz] of dirs) {
    const nb = cell.get(k(x + dx, z + dz));
    if (!nb || y >= nb.r) return true;
  }
  return false;
}

// Entrance on the street (lowest-z) face, near the centre of the front.
let minZ = Infinity;
for (const key of cell.keys()) minZ = Math.min(minZ, Number(key.split(",")[1]));
let entranceX = null;
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (z !== minZ) continue;
  if (entranceX === null || Math.abs(x - 17) < Math.abs(entranceX - 17)) entranceX = x;
}
const entrance = new Set();
if (entranceX !== null) {
  entrance.add(k(entranceX, minZ));
  if (has(entranceX + 1, minZ)) entrance.add(k(entranceX + 1, minZ));
}

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const gy = c.g, ry = c.r;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y <= ry - 1; y++) {
    const t = y - gy;
    const ext = isPerim(x, z) || exposed(x, z, y);

    if (!ext) {
      // Interior: floor slabs per storey and a roof deck; otherwise air.
      if (t % 4 === 0 || y === ry - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior facade.
    if (y === ry - 1) { g.set(x, y, z, "quartz_block"); continue; } // cornice
    const pier = (x + z) % 3 === 0;
    const lit = (x * 5 + y * 7 + z * 3) % 23 === 0;

    if (t < 4) {
      // Ground floor: granite base, shopfront glazing, granite band.
      if (t === 0) {
        if (entrance.has(k(x, z))) g.set(x, y, z, "dark_oak_door", { ...DOOR, half: "lower" });
        else g.set(x, y, z, "polished_granite");
      } else if (t === 1) {
        if (entrance.has(k(x, z))) g.set(x, y, z, "dark_oak_door", { ...DOOR, half: "upper" });
        else if (pier) g.set(x, y, z, "polished_granite");
        else g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      } else if (t === 2) {
        if (entrance.has(k(x, z))) g.set(x, y, z, "bricks");
        else if (pier) g.set(x, y, z, "polished_granite");
        else g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      } else {
        g.set(x, y, z, "polished_granite");
      }
    } else {
      // Upper storeys: quartz floor line, glazing between brick piers, brick spandrel.
      const tt = t % 4;
      if (tt === 0) g.set(x, y, z, "quartz_block");
      else if (tt === 3) g.set(x, y, z, "bricks");
      else if (pier) g.set(x, y, z, "bricks");
      else g.set(x, y, z, lit ? "shroomlight" : "light_blue_stained_glass");
    }
  }

  // Entrance canopy: dark slab over the door, one storey above ground.
  if (entrance.has(k(x, z)) && gy + 4 < ry - 1) {
    g.set(x, gy + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }

  // Roof plant on interior roof cells, standing on the roof deck.
  if (!isPerim(x, z) && !exposed(x, z, ry - 1) && (x * 7 + z * 5) % 13 === 0 && ry + 1 < H) {
    g.set(x, ry, z, "light_gray_concrete");
    if ((x + z) % 2 === 0) g.set(x, ry + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC60297.nbt`);
