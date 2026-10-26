// Hotel-Large, 901 Massachusetts Ave NW: a mid-century (1960s-70s) precast-and-glass hotel block on a stone base.
// Massing: the lidar roof, median-smoothed over 3x3 and quantized to 3-block storeys, gives clean setback tiers.
// Storey lines sit at y = 3k (floor bands); each storey is 3 blocks: a band row, then two window rows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58224.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 62, Y = 39, Z = 43;

const M = {
  base: "smooth_stone",          // plinth and foundation
  band: "light_gray_concrete",   // storey lines and floor slabs
  pier: "white_concrete",        // window piers
  glass: "light_blue_stained_glass",
  cornice: "smooth_stone",       // parapet course on the ring
  roof: "stone",                 // roof membrane on the interior
  light: "glowstone",            // warm light behind some panes
  equip: "iron_block",           // rooftop plant
};

const key = (x, z) => `${x},${z}`;
const ground = new Map(), roofLidar = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roofLidar.set(key(x, z), r); }

// Smoothed storey tops: 3x3 median of the lidar roof over footprint cells, then the nearest multiple of 3 (3..27).
const top = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = key(x + dx, z + dz);
    if (roofLidar.has(k)) vals.push(roofLidar.get(k));
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  top.set(key(x, z), Math.max(3, Math.min(27, 3 * Math.round(med / 3))));
}
const T = (x, z) => top.get(key(x, z));

// A face is exposed where the neighbour is off the footprint or stands lower (a setback drop).
const exposed = (x, z, dx, dz) => { const n = T(x + dx, z + dz); return n === undefined || n < T(x, z); };

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const ENTRANCE_X = [34, 35];   // lobby doors on the north face (z = 0)

const g = new Voxels([X, Y, Z]);
let lights = 0;

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const t = T(x, z);
  const wallX = exposed(x, z, -1, 0) || exposed(x, z, 1, 0);   // face turns to east or west: pattern runs along z
  const wallZ = exposed(x, z, 0, -1) || exposed(x, z, 0, 1);   // face turns to north or south: pattern runs along x
  const ring = wallX || wallZ;
  const corner = wallX && wallZ;
  const along = wallX ? z : x;   // position along the facade
  const pier = corner || along % 3 === 0;

  // inward cell for a warm light behind the pane
  const inward = exposed(x, z, -1, 0) ? [x + 1, z] : exposed(x, z, 1, 0) ? [x - 1, z]
    : exposed(x, z, 0, -1) ? [x, z + 1] : [x, z - 1];

  g.set(x, 0, z, M.base);   // foundation / plinth / ground slab

  for (let y = 1; y < t; y++) {
    if (y === t - 1) { g.set(x, y, z, ring ? M.cornice : M.roof); continue; }   // top course
    if (y % 3 === 0) { g.set(x, y, z, M.band); continue; }                     // storey line / floor slab
    if (!ring) continue;                                                      // interior air

    const doorCell = z === 0 && ENTRANCE_X.includes(x) && y <= 2;
    if (doorCell) {
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { ...DOOR, half });
      continue;
    }
    if (pier) { g.set(x, y, z, M.pier); continue; }
    g.set(x, y, z, M.glass);

    // some panes glow: a warm block one cell inside, in the middle row of a storey
    const [ix, iz] = inward;
    const behindIsInterior = T(ix, iz) > y && !(exposed(ix, iz, -1, 0) || exposed(ix, iz, 1, 0) || exposed(ix, iz, 0, -1) || exposed(ix, iz, 0, 1));
    if (y % 3 === 1 && (x * 7 + z * 13 + y * 5) % 11 === 0 && behindIsInterior) {
      g.set(ix, y, iz, M.light);
      lights++;
    }
  }

  // roof plant on the tallest interior roofs
  if (!ring && t >= 18 && x % 9 === 4 && z % 9 === 4) {
    g.set(x, t, z, M.equip);
    g.set(x, t + 1, z, M.equip);
  }
}

const out = g.save(`${DIR}/DC58224.nbt`);
console.log(JSON.stringify({ footprint: cells.length, lights, ...out }));
