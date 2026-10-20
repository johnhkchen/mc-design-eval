import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001357.cells.json`, "utf8"));

const W = 37, H = 66, D = 121;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map(([x, z, gr, r]) => [key(x, z), { gr, r }]));
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2;
const entranceX = Math.round(cx);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Smoothed massing: neighbourhood mean of lidar roof, quantized to 4-block setbacks
const RAD = 6;
const smoothRoof = new Map();
for (const [x, z, , r] of cells) {
  let sum = 0, n = 0;
  for (let dx = -RAD; dx <= RAD; dx++) for (let dz = -RAD; dz <= RAD; dz++) {
    const c = cellMap.get(key(x + dx, z + dz));
    if (c) { sum += c.r; n++; }
  }
  const avg = sum / n;
  let T = Math.round(avg / 4) * 4;
  smoothRoof.set(key(x, z), clamp(T, 0, H - 6));
}

// Palette: 1968 curtain-wall tower, pale spandrels, granite base
const GLASS = "light_blue_stained_glass_pane";
const GLASS_FULL = "light_blue_stained_glass";
const SPANDREL = "white_concrete";
const MULLION = "light_gray_concrete";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const CAP = "smooth_stone";

const DOOR = { facing: "north", open: "false", powered: "false", hinge: "left" };

for (const [x, z, grRaw] of cells) {
  const gr = clamp(Math.round(grRaw), 0, H - 10);
  let T = smoothRoof.get(key(x, z));
  if (T < gr + 6) T = gr + 6;
  T = clamp(T, gr + 6, H - 6);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const northFace = !cellMap.has(key(x, z - 1));
  const southFace = !cellMap.has(key(x, z + 1));
  const westFace = !cellMap.has(key(x - 1, z));
  const eastFace = !cellMap.has(key(x + 1, z));
  const perimeter = northFace || southFace || westFace || eastFace;
  const zFace = northFace || southFace;
  const onMinZ = z === minZ;
  const entranceBay = onMinZ && Math.abs(x - cx) <= 3;

  // Body
  for (let y = gr; y < T; y++) {
    const o = y - gr;
    const roofSlab = y === T - 1;

    if (!perimeter) {
      if (o % 2 === 0 || roofSlab) g.set(x, y, z, CAP);
      continue;
    }

    if (roofSlab) { g.set(x, y, z, CAP); continue; }

    // Entrance bay on the street face: granite base, glass, centre door
    if (entranceBay && o <= 1) {
      if (x === entranceX) {
        g.set(x, y, z, "oak_door", { ...DOOR, half: o === 0 ? "lower" : "upper" });
      } else if (o === 0) {
        g.set(x, y, z, BASE);
      } else {
        g.set(x, y, z, GLASS_FULL);
      }
      continue;
    }

    if (o === 0) { g.set(x, y, z, BASE); continue; }

    const mullionCol = zFace ? ((x - minX) % 3 === 0) : ((z - minZ) % 3 === 0);
    if (o % 2 === 0) {
      g.set(x, y, z, mullionCol ? MULLION : SPANDREL);
    } else {
      if (mullionCol) {
        g.set(x, y, z, MULLION);
      } else if (((x * 7 + z * 3 + o) % 11) === 0) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, GLASS);
      }
    }
  }

  // Parapet ring on perimeter at roof level, sitting on the roof slab
  if (perimeter) g.set(x, T, z, MULLION);

  // Lobby lantern behind the entrance glass
  if (x === entranceX && z === minZ + 1 && gr + 1 < T) {
    g.set(x, gr + 1, z, "lantern", { hanging: "false" });
  }
}

// Rooftop mechanical cages only on interior cells whose whole neighbourhood
// shares the same roof level, so nothing floats off a lower neighbour.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (x % 6 !== 3 || z % 6 !== 3) continue;
  if (cellMap.has(key(x + 1, z)) && cellMap.has(key(x - 1, z)) &&
      cellMap.has(key(x, z + 1)) && cellMap.has(key(x, z - 1))) {
    const T = smoothRoof.get(key(x, z));
    const plateau = [-1, 0, 1].every(dx => [-1, 0, 1].every(dz => {
      const v = smoothRoof.get(key(x + dx, z + dz));
      return v === T;
    }));
    if (!plateau || T + 3 >= H) continue;
    g.set(x, T, z, MULLION);
    g.set(x, T + 1, z, MULLION);
    g.set(x, T + 2, z, CAP);
  }
}

g.save(`${DIR}/NYC1001357.nbt`);
